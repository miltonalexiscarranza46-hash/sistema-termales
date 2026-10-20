const pool = require('../config/db');

const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const dinero = (n) => '$' + Number(n || 0).toFixed(2);

const ROLES_REPORTAN = ['recepcionista', 'masajista', 'mesero', 'bodega', 'cajero'];
// Roles que aún no tienen resumen automático (sus módulos están pendientes)
const ROLES_SIN_RESUMEN = ['mesero', 'bodega'];

const textoDif = (n) =>
  n === 0 ? 'cuadra' : n < 0 ? 'falta ' + dinero(-n) : 'sobra ' + dinero(n);

// Resumen automático de hoy según el rol del empleado
async function resumenDe(db, rol, usuarioId) {
  const items = [];

  if (rol === 'recepcionista') {
    const a = await db.query(
      `SELECT COALESCE(SUM(cantidad), 0)::int AS personas,
              COALESCE(SUM(monto), 0) AS total
       FROM accesos
       WHERE usuario_id = $1 AND fecha_hora::date = CURRENT_DATE`,
      [usuarioId]
    );
    const r = await db.query(
      `SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(anticipo), 0) AS total
       FROM reservas
       WHERE usuario_id = $1 AND creado_en::date = CURRENT_DATE
         AND estado <> 'cancelada'`,
      [usuarioId]
    );
    items.push(
      { etiqueta: 'Personas que entraron', valor: String(a.rows[0].personas) },
      { etiqueta: 'Cobrado en entradas', valor: dinero(a.rows[0].total) },
      { etiqueta: 'Reservas creadas', valor: String(r.rows[0].cantidad) },
      { etiqueta: 'Anticipos cobrados', valor: dinero(r.rows[0].total) }
    );
  }

  if (rol === 'masajista') {
    const c = await db.query(
      `SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(precio), 0) AS total
       FROM citas_masaje
       WHERE masajista_id = $1 AND estado = 'cobrada'
         AND cobrado_en::date = CURRENT_DATE`,
      [usuarioId]
    );
    const p = await db.query(
      `SELECT COUNT(*)::int AS cantidad
       FROM citas_masaje
       WHERE masajista_id = $1 AND estado = 'agendada'
         AND inicio::date = CURRENT_DATE`,
      [usuarioId]
    );
    items.push(
      { etiqueta: 'Masajes cobrados', valor: String(c.rows[0].cantidad) },
      { etiqueta: 'Total cobrado', valor: dinero(c.rows[0].total) },
      { etiqueta: 'Citas aún agendadas hoy', valor: String(p.rows[0].cantidad) }
    );
  }

  if (rol === 'cajero') {
    const e = await db.query(
      `SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(monto), 0) AS total
       FROM entregas_caja
       WHERE recibido_por = $1 AND fecha = CURRENT_DATE`,
      [usuarioId]
    );
    const c = await db.query(
      `SELECT esperado, recibido, diferencia
       FROM cierres_caja WHERE fecha = CURRENT_DATE`
    );
    items.push(
      { etiqueta: 'Entregas recibidas', valor: String(e.rows[0].cantidad) },
      { etiqueta: 'Efectivo recibido', valor: dinero(e.rows[0].total) }
    );
    if (c.rows[0]) {
      items.push({
        etiqueta: 'Caja del día',
        valor:
          'Cerrada: esperado ' + dinero(c.rows[0].esperado) +
          ', recibido ' + dinero(c.rows[0].recibido) +
          ' (' + textoDif(Number(c.rows[0].diferencia)) + ')',
      });
    } else {
      items.push({ etiqueta: 'Caja del día', valor: 'Sin cerrar' });
    }
  }

  return items;
}

// ---------- Empleados ----------

exports.hoy = async (req, res) => {
  try {
    const rol = req.usuario.rol;
    const items = await resumenDe(pool, rol, req.usuario.id);

    const r = await pool.query(
      `SELECT id, observaciones, leido, creado_en, actualizado_en
       FROM reportes
       WHERE usuario_id = $1 AND fecha = CURRENT_DATE`,
      [req.usuario.id]
    );
    const d = await pool.query('SELECT CURRENT_DATE::text AS dia');
    const reporte = r.rows[0] || null;

    res.json({
      ok: true,
      fecha: d.rows[0].dia,
      resumen: { items },
      requiere_observaciones: ROLES_SIN_RESUMEN.includes(rol),
      reporte,
      se_puede_corregir: !reporte || !reporte.leido,
    });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.enviar = async (req, res) => {
  try {
    const rol = req.usuario.rol;
    const observaciones = (req.body.observaciones || '').trim();

    if (observaciones.length > 1000) {
      return res.status(400).json({ ok: false, mensaje: 'Las observaciones admiten máximo 1000 caracteres' });
    }
    if (ROLES_SIN_RESUMEN.includes(rol) && !observaciones) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Escribe tus observaciones: tu reporte aún no tiene resumen automático',
      });
    }

    const resumen = { items: await resumenDe(pool, rol, req.usuario.id) };

    // Un reporte por empleado y día; se corrige solo si el administrador no lo ha leído.
    // (xmax = 0 indica que la fila fue insertada y no actualizada)
    const r = await pool.query(
      `INSERT INTO reportes (fecha, usuario_id, resumen, observaciones)
       VALUES (CURRENT_DATE, $1, $2::jsonb, $3)
       ON CONFLICT (fecha, usuario_id) DO UPDATE
         SET resumen = EXCLUDED.resumen,
             observaciones = EXCLUDED.observaciones,
             actualizado_en = NOW()
         WHERE reportes.leido = FALSE
       RETURNING id, (xmax = 0) AS nuevo`,
      [req.usuario.id, JSON.stringify(resumen), observaciones || null]
    );

    if (!r.rows[0]) {
      return res.status(409).json({
        ok: false,
        mensaje: 'El administrador ya leyó tu reporte de hoy; ya no se puede cambiar',
      });
    }

    const nuevo = r.rows[0].nuevo;
    res.status(nuevo ? 201 : 200).json({
      ok: true,
      mensaje: nuevo ? 'Reporte enviado' : 'Reporte actualizado',
      id: r.rows[0].id,
    });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

// ---------- Administrador ----------

exports.listar = async (req, res) => {
  try {
    const fecha = req.query.fecha || null;
    const rol = req.query.rol || null;
    const estado = req.query.estado || null;

    if (fecha && !esFecha(fecha)) {
      return res.status(400).json({ ok: false, mensaje: 'Fecha inválida' });
    }
    if (rol && !ROLES_REPORTAN.includes(rol)) {
      return res.status(400).json({ ok: false, mensaje: 'Rol inválido' });
    }
    if (estado && !['leidos', 'sin_leer'].includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'Estado inválido' });
    }
    const leido = estado === 'leidos' ? true : estado === 'sin_leer' ? false : null;

    const d = await pool.query(
      'SELECT COALESCE($1::date, CURRENT_DATE)::text AS dia',
      [fecha]
    );

    const rep = await pool.query(
      `WITH f AS (SELECT COALESCE($1::date, CURRENT_DATE) AS dia)
       SELECT r.id, u.nombre AS empleado, ro.nombre AS rol,
              r.creado_en, r.actualizado_en, r.leido
       FROM reportes r
       JOIN usuarios u ON u.id = r.usuario_id
       JOIN roles ro ON ro.id = u.rol_id
       CROSS JOIN f
       WHERE r.fecha = f.dia
         AND ($2::text IS NULL OR ro.nombre = $2)
         AND ($3::boolean IS NULL OR r.leido = $3)
       ORDER BY r.creado_en`,
      [fecha, rol, leido]
    );

    const faltan = await pool.query(
      `SELECT u.id, u.nombre AS empleado, ro.nombre AS rol
       FROM usuarios u
       JOIN roles ro ON ro.id = u.rol_id
             WHERE u.activo = TRUE AND ro.nombre = ANY($1::text[])
         AND ($2::text IS NULL OR ro.nombre = $2)
         AND NOT EXISTS (
           SELECT 1 FROM reportes r
           WHERE r.usuario_id = u.id
             AND r.fecha = COALESCE($3::date, CURRENT_DATE)
         )
       ORDER BY ro.nombre, u.nombre`,
      [ROLES_REPORTAN, rol, fecha]
    );

    res.json({
      ok: true,
      fecha: d.rows[0].dia,
      reportes: rep.rows,
      faltan: faltan.rows,
    });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.ver = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }

    const r = await pool.query(
      `SELECT r.id, r.fecha::text AS fecha, u.nombre AS empleado,
              ro.nombre AS rol, r.resumen, r.observaciones, r.leido,
              r.creado_en, r.actualizado_en,
              l.nombre AS leido_por, r.leido_en
       FROM reportes r
       JOIN usuarios u ON u.id = r.usuario_id
       JOIN roles ro ON ro.id = u.rol_id
       LEFT JOIN usuarios l ON l.id = r.leido_por
       WHERE r.id = $1`,
      [id]
    );
    if (!r.rows[0]) {
      return res.status(404).json({ ok: false, mensaje: 'Reporte no encontrado' });
    }

    res.json({ ok: true, reporte: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.marcarLeido = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }

    const existe = await pool.query('SELECT 1 FROM reportes WHERE id = $1', [id]);
    if (!existe.rows[0]) {
      return res.status(404).json({ ok: false, mensaje: 'Reporte no encontrado' });
    }

    await pool.query(
      `UPDATE reportes
       SET leido = TRUE, leido_por = $2, leido_en = NOW()
       WHERE id = $1 AND leido = FALSE`,
      [id, req.usuario.id]
    );

    res.json({ ok: true, mensaje: 'Reporte marcado como leído' });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};