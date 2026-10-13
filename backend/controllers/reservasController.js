const pool = require('../config/db');

const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

exports.listarCabanas = async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, nombre, capacidad, precio_persona FROM cabanas ORDER BY id'
    );
    res.json({ ok: true, cabanas: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.disponibles = async (req, res) => {
  try {
    const { entrada, salida } = req.query;
    const personas = Number(req.query.personas || 1);

    if (!esFecha(entrada) || !esFecha(salida) || salida <= entrada) {
      return res.status(400).json({ ok: false, mensaje: 'Fechas inválidas' });
    }
    if (!Number.isInteger(personas) || personas < 1) {
      return res.status(400).json({ ok: false, mensaje: 'Cantidad de personas inválida' });
    }

    const r = await pool.query(
      `SELECT c.id, c.nombre, c.capacidad, c.precio_persona
       FROM cabanas c
       WHERE c.capacidad >= $3
         AND NOT EXISTS (
           SELECT 1 FROM reservas r
           WHERE r.cabana_id = c.id
             AND r.estado <> 'cancelada'
             AND r.fecha_entrada < $2
             AND r.fecha_salida > $1
         )
       ORDER BY c.id`,
      [entrada, salida, personas]
    );
    res.json({ ok: true, cabanas: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT r.id, c.nombre AS cliente, c.telefono, b.nombre AS cabana,
              to_char(r.fecha_entrada, 'YYYY-MM-DD') AS fecha_entrada,
              to_char(r.fecha_salida, 'YYYY-MM-DD') AS fecha_salida,
              r.personas, r.anticipo, r.total, (r.total - r.anticipo) AS saldo,
              r.estado, u.nombre AS registrado_por
       FROM reservas r
       JOIN clientes c ON c.id = r.cliente_id
       JOIN cabanas b ON b.id = r.cabana_id
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.fecha_salida >= CURRENT_DATE
       ORDER BY r.fecha_entrada, r.id`
    );
    res.json({ ok: true, reservas: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.crear = async (req, res) => {
  const client = await pool.connect();
  try {
    const { nombre, telefono, fecha_entrada, fecha_salida } = req.body;
    const cabanaId = Number(req.body.cabana_id);
    const personas = Number(req.body.personas);
    const anticipo = Number(req.body.anticipo || 0);

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'Falta el nombre del cliente' });
    }
    if (!esFecha(fecha_entrada) || !esFecha(fecha_salida) || fecha_salida <= fecha_entrada) {
      return res.status(400).json({ ok: false, mensaje: 'Fechas inválidas' });
    }
    if (!Number.isInteger(cabanaId) || !(anticipo >= 0)) {
      return res.status(400).json({ ok: false, mensaje: 'Datos inválidos' });
    }
    if (!Number.isInteger(personas) || personas < 1) {
      return res.status(400).json({ ok: false, mensaje: 'Indica cuántas personas serán' });
    }

    await client.query('BEGIN');

    // Bloquea la cabaña para que dos cajeros no la reserven a la vez
    const cab = await client.query(
      'SELECT precio_persona, capacidad FROM cabanas WHERE id = $1 FOR UPDATE',
      [cabanaId]
    );
    if (!cab.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: 'La cabaña no existe' });
    }

    if (personas > cab.rows[0].capacidad) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        ok: false,
        mensaje: 'La cabaña admite máximo ' + cab.rows[0].capacidad + ' personas',
      });
    }

    const choque = await client.query(
      `SELECT 1 FROM reservas
       WHERE cabana_id = $1 AND estado <> 'cancelada'
         AND fecha_entrada < $3 AND fecha_salida > $2
       LIMIT 1`,
      [cabanaId, fecha_entrada, fecha_salida]
    );
    if (choque.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, mensaje: 'La cabaña ya está reservada en esas fechas' });
    }

    const noches = (Date.parse(fecha_salida) - Date.parse(fecha_entrada)) / 86400000;
    const total = noches * personas * Number(cab.rows[0].precio_persona);

    if (anticipo > total) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, mensaje: 'El anticipo no puede ser mayor al total' });
    }

    const cli = await client.query(
      'INSERT INTO clientes (nombre, telefono) VALUES ($1, $2) RETURNING id',
      [nombre.trim(), (telefono || '').trim() || null]
    );

    const estado = anticipo >= total ? 'pagada' : 'pendiente';

    const r = await client.query(
      `INSERT INTO reservas
         (cliente_id, cabana_id, fecha_entrada, fecha_salida, personas, anticipo, total, estado, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, personas, anticipo, total, estado`,
      [cli.rows[0].id, cabanaId, fecha_entrada, fecha_salida, personas, anticipo, total, estado, req.usuario.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ ok: true, reserva: { ...r.rows[0], noches } });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ ok: false, mensaje: e.message });
  } finally {
    client.release();
  }
};

exports.cancelar = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }

    const r = await pool.query(
      `UPDATE reservas SET estado = 'cancelada'
       WHERE id = $1 AND estado <> 'cancelada'
       RETURNING id`,
      [id]
    );
    if (!r.rows[0]) {
      return res.status(404).json({ ok: false, mensaje: 'Reserva no encontrada o ya cancelada' });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};