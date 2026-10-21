const pool = require('../config/db');

const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const r2 = (n) => Math.round(n * 100) / 100;

// Roles que cobran a clientes y entregan efectivo a caja (en minúsculas para comparación segura)
const ROLES_QUE_ENTREGAN = ['recepcionista', 'masajista', 'mesero'];
// Candado: una entrega y un cierre no pueden cruzarse
const LOCK_CAJA = 7001;

const SQL_DIA = `
  WITH f AS (SELECT COALESCE($1::date, CURRENT_DATE) AS dia),
  esp AS (
    SELECT a.usuario_id AS empleado_id, SUM(a.monto) AS total
    FROM accesos a, f
    WHERE a.fecha_hora::date = f.dia
    GROUP BY a.usuario_id

    UNION ALL

    SELECT r.usuario_id, SUM(r.anticipo)
    FROM reservas r, f
    WHERE r.creado_en::date = f.dia
      AND r.estado <> 'cancelada' AND r.anticipo > 0
    GROUP BY r.usuario_id

    UNION ALL

    SELECT c.masajista_id, SUM(c.precio)
    FROM citas_masaje c, f
    WHERE c.estado = 'cobrada' AND c.cobrado_en::date = f.dia
    GROUP BY c.masajista_id
  ),
  esp2 AS (
    SELECT empleado_id, SUM(total) AS esperado FROM esp GROUP BY empleado_id
  ),
  ent AS (
    SELECT e.empleado_id, SUM(e.monto) AS entregado
    FROM entregas_caja e, f
    WHERE e.fecha = f.dia
    GROUP BY e.empleado_id
  )
  SELECT u.id AS empleado_id, u.nombre AS empleado, ro.nombre AS rol,
         COALESCE(e2.esperado, 0) AS esperado,
         COALESCE(n.entregado, 0) AS entregado
  FROM usuarios u
  JOIN roles ro ON ro.id = u.rol_id
  LEFT JOIN esp2 e2 ON e2.empleado_id = u.id
  LEFT JOIN ent n ON n.empleado_id = u.id
  WHERE LOWER(ro.nombre) = ANY($2::text[])
     OR e2.empleado_id IS NOT NULL 
     OR n.empleado_id IS NOT NULL
  ORDER BY ro.nombre, u.nombre`;

async function calcular(db, fecha) {
  // Pasamos el array de roles permitidos como segundo parámetro a la query
  const q = await db.query(SQL_DIA, [fecha, ROLES_QUE_ENTREGAN]);
  const empleados = q.rows.map((x) => {
    const esperado = r2(Number(x.esperado));
    const entregado = r2(Number(x.entregado));
    return {
      empleado_id: x.empleado_id,
      empleado: x.empleado,
      rol: x.rol,
      esperado,
      entregado,
      diferencia: r2(entregado - esperado),
    };
  });
  const total_esperado = r2(empleados.reduce((s, x) => s + x.esperado, 0));
  const total_entregado = r2(empleados.reduce((s, x) => s + x.entregado, 0));
  return {
    empleados,
    total_esperado,
    total_entregado,
    diferencia: r2(total_entregado - total_esperado),
  };
}

exports.dia = async (req, res) => {
  try {
    const fecha = req.query.fecha || null;
    if (fecha && !esFecha(fecha)) {
      return res.status(400).json({ ok: false, mensaje: 'Fecha inválida' });
    }

    const d = await pool.query(
      `SELECT COALESCE($1::date, CURRENT_DATE)::text AS dia,
              (COALESCE($1::date, CURRENT_DATE) = CURRENT_DATE) AS es_hoy`,
      [fecha]
    );
    const calc = await calcular(pool, fecha);

    const cierre = await pool.query(
      `SELECT c.id, c.esperado, c.recibido, c.diferencia, c.nota,
              u.nombre AS cerrado_por, c.cerrado_en
       FROM cierres_caja c
       JOIN usuarios u ON u.id = c.cerrado_por
       WHERE c.fecha = COALESCE($1::date, CURRENT_DATE)`,
      [fecha]
    );

    const ent = await pool.query(
      `SELECT e.id, e.empleado_id, u.nombre AS empleado, e.monto, e.nota,
              e.creado_en, r.nombre AS recibido_por
       FROM entregas_caja e
       JOIN usuarios u ON u.id = e.empleado_id
       JOIN usuarios r ON r.id = e.recibido_por
       WHERE e.fecha = COALESCE($1::date, CURRENT_DATE)
       ORDER BY e.creado_en`,
      [fecha]
    );

    const c = cierre.rows[0] || null;
    const cerrado = !!c;
    const editable = d.rows[0].es_hoy && !cerrado;

    res.json({
      ok: true,
      fecha: d.rows[0].dia,
      ...calc,
      entregas: ent.rows.map((x) => ({
        ...x,
        monto: Number(x.monto),
        se_puede_borrar: editable,
      })),
      cerrado,
      cierre: c
        ? {
            ...c,
            esperado: Number(c.esperado),
            recibido: Number(c.recibido),
            diferencia: Number(c.diferencia),
          }
        : null,
    });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.entregar = async (req, res) => {
  const client = await pool.connect();
  try {
    const empleadoId = Number(req.body.empleado_id);
    const monto = r2(Number(req.body.monto));
    const nota = (req.body.nota || '').trim();

    if (!Number.isInteger(empleadoId)) {
      return res.status(400).json({ ok: false, mensaje: 'Elige el empleado' });
    }
    if (!(monto > 0) || monto >= 100000000) {
      return res.status(400).json({ ok: false, mensaje: 'El monto debe ser mayor que cero' });
    }
    if (nota.length > 200) {
      return res.status(400).json({ ok: false, mensaje: 'La nota admite máximo 200 caracteres' });
    }

    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_CAJA]);

    const cerrado = await client.query(
      'SELECT 1 FROM cierres_caja WHERE fecha = CURRENT_DATE'
    );
    if (cerrado.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, mensaje: 'La caja de hoy ya está cerrada' });
    }

    const emp = await client.query(
      `SELECT u.id, ro.nombre AS rol
       FROM usuarios u JOIN roles ro ON ro.id = u.rol_id
       WHERE u.id = $1`,
      [empleadoId]
    );
    if (!emp.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: 'Empleado no encontrado' });
    }

    // Validación de rol insensible a mayúsculas/minúsculas
    const rolUsuario = emp.rows[0].rol.toLowerCase();
    if (!ROLES_QUE_ENTREGAN.includes(rolUsuario)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, mensaje: 'Ese empleado no entrega efectivo a caja' });
    }

    const r = await client.query(
      `INSERT INTO entregas_caja (empleado_id, monto, nota, recibido_por)
       VALUES ($1, $2, $3, $4)
       RETURNING id, fecha, empleado_id, monto, nota, creado_en`,
      [empleadoId, monto, nota || null, req.usuario.id]
    );

    await client.query('COMMIT');
    res.status(201).json({
      ok: true,
      mensaje: 'Entrega registrada',
      entrega: { ...r.rows[0], monto: Number(r.rows[0].monto) },
    });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ ok: false, mensaje: e.message });
  } finally {
    client.release();
  }
};

exports.eliminarEntrega = async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }

    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_CAJA]);

    const e = await client.query(
      'SELECT id, fecha = CURRENT_DATE AS es_hoy FROM entregas_caja WHERE id = $1',
      [id]
    );
    if (!e.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: 'Entrega no encontrada' });
    }
    if (!e.rows[0].es_hoy) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, mensaje: 'Solo se pueden anular entregas de hoy' });
    }

    const cerrado = await client.query(
      'SELECT 1 FROM cierres_caja WHERE fecha = CURRENT_DATE'
    );
    if (cerrado.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, mensaje: 'La caja de hoy ya está cerrada' });
    }

    await client.query('DELETE FROM entregas_caja WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ ok: true, mensaje: 'Entrega anulada' });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ ok: false, mensaje: e.message });
  } finally {
    client.release();
  }
};

exports.cerrar = async (req, res) => {
  const client = await pool.connect();
  try {
    const nota = (req.body.nota || '').trim();
    if (nota.length > 200) {
      return res.status(400).json({ ok: false, mensaje: 'La nota admite máximo 200 caracteres' });
    }

    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_CAJA]);

    const ya = await client.query(
      'SELECT 1 FROM cierres_caja WHERE fecha = CURRENT_DATE'
    );
    if (ya.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, mensaje: 'La caja de hoy ya está cerrada' });
    }

    const calc = await calcular(client, null);
    if (calc.empleados.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, mensaje: 'No hay movimientos que cerrar hoy' });
    }

    const r = await client.query(
      `INSERT INTO cierres_caja (fecha, esperado, recibido, diferencia, nota, cerrado_por)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, $5)
       RETURNING id, fecha, esperado, recibido, diferencia, nota, cerrado_en`,
      [calc.total_esperado, calc.total_entregado, calc.diferencia, nota || null, req.usuario.id]
    );

    await client.query('COMMIT');
    const c = r.rows[0];
    res.status(201).json({
      ok: true,
      mensaje: 'Caja cerrada',
      cierre: {
        ...c,
        esperado: Number(c.esperado),
        recibido: Number(c.recibido),
        diferencia: Number(c.diferencia),
      },
    });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ ok: false, mensaje: e.message });
  } finally {
    client.release();
  }
};