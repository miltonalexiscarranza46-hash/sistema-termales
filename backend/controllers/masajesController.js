const pool = require('../config/db');

const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const esFechaHora = (s) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s || '');

exports.listarServicios = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, nombre, duracion_min, precio
       FROM servicios_masaje WHERE activo = TRUE ORDER BY id`
    );
    res.json({ ok: true, servicios: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.listarMasajistas = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.nombre
       FROM usuarios u JOIN roles ro ON ro.id = u.rol_id
       WHERE ro.nombre = 'masajista' AND u.activo = TRUE
       ORDER BY u.nombre`
    );
    res.json({ ok: true, masajistas: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

// Masajistas libres a una hora, para un servicio
exports.disponibles = async (req, res) => {
  try {
    const { inicio } = req.query;
    const servicioId = Number(req.query.servicio_id);

    if (!esFechaHora(inicio) || !Number.isInteger(servicioId)) {
      return res.status(400).json({ ok: false, mensaje: 'Datos inválidos' });
    }

    const s = await pool.query(
      'SELECT duracion_min FROM servicios_masaje WHERE id = $1 AND activo = TRUE',
      [servicioId]
    );
    if (!s.rows[0]) {
      return res.status(404).json({ ok: false, mensaje: 'El servicio no existe' });
    }

    const r = await pool.query(
      `SELECT u.id, u.nombre
       FROM usuarios u JOIN roles ro ON ro.id = u.rol_id
       WHERE ro.nombre = 'masajista' AND u.activo = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM citas_masaje c
           WHERE c.masajista_id = u.id
             AND c.estado <> 'cancelada'
             AND c.inicio < $1::timestamp + make_interval(mins => $2)
             AND c.fin > $1::timestamp
         )
       ORDER BY u.nombre`,
      [inicio, s.rows[0].duracion_min]
    );
    res.json({ ok: true, masajistas: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.listarCitas = async (req, res) => {
  try {
    const fecha = req.query.fecha || null;
    if (fecha && !esFecha(fecha)) {
      return res.status(400).json({ ok: false, mensaje: 'Fecha inválida' });
    }

    const r = await pool.query(
      `SELECT c.id, cl.nombre AS cliente, cl.telefono, s.nombre AS servicio,
              u.nombre AS masajista,
              to_char(c.inicio, 'YYYY-MM-DD') AS fecha,
              to_char(c.inicio, 'HH24:MI') AS hora_inicio,
              to_char(c.fin, 'HH24:MI') AS hora_fin,
              c.precio, c.estado
       FROM citas_masaje c
       JOIN clientes cl ON cl.id = c.cliente_id
       JOIN servicios_masaje s ON s.id = c.servicio_id
       JOIN usuarios u ON u.id = c.masajista_id
       WHERE c.inicio::date = COALESCE($1::date, CURRENT_DATE)
       ORDER BY c.inicio, c.id`,
      [fecha]
    );

    const total_cobrado = r.rows
      .filter((x) => x.estado === 'cobrada')
      .reduce((s, x) => s + Number(x.precio), 0);
    const pendientes = r.rows.filter((x) => x.estado === 'agendada').length;

    res.json({ ok: true, citas: r.rows, total_cobrado, pendientes });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.crearCita = async (req, res) => {
  const client = await pool.connect();

  try {
    const { nombre, telefono, inicio } = req.body;
    const servicioId = Number(req.body.servicio_id);
    // Si no se indica masajista, la cita es del usuario que agenda
    const masajistaId = Number(req.body.masajista_id || req.usuario.id);

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'Falta el nombre del cliente' });
    }
    if (!esFechaHora(inicio)) {
      return res.status(400).json({ ok: false, mensaje: 'Fecha y hora inválidas' });
    }
    if (!Number.isInteger(servicioId) || !Number.isInteger(masajistaId)) {
      return res.status(400).json({ ok: false, mensaje: 'Datos inválidos' });
    }

    await client.query('BEGIN');

    // Valida al masajista y lo bloquea para que no se agenden dos citas a la vez
    const m = await client.query(
      `SELECT u.id
       FROM usuarios u JOIN roles ro ON ro.id = u.rol_id
       WHERE u.id = $1 AND u.activo = TRUE AND ro.nombre = 'masajista'
       FOR UPDATE OF u`,
      [masajistaId]
    );
    if (!m.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: 'El masajista no existe' });
    }

    const s = await client.query(
      'SELECT duracion_min, precio FROM servicios_masaje WHERE id = $1 AND activo = TRUE',
      [servicioId]
    );
    if (!s.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: 'El servicio no existe' });
    }
    const { duracion_min, precio } = s.rows[0];

    const choque = await client.query(
      `SELECT 1 FROM citas_masaje
       WHERE masajista_id = $1 AND estado <> 'cancelada'
         AND inicio < $2::timestamp + make_interval(mins => $3)
         AND fin > $2::timestamp
       LIMIT 1`,
      [masajistaId, inicio, duracion_min]
    );
    if (choque.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, mensaje: 'Ese masajista ya tiene una cita en ese horario' });
    }

    const cli = await client.query(
      'INSERT INTO clientes (nombre, telefono) VALUES ($1, $2) RETURNING id',
      [nombre.trim(), (telefono || '').trim() || null]
    );

    // El servidor calcula la hora de fin y fija el precio
    const r = await client.query(
      `INSERT INTO citas_masaje
         (cliente_id, servicio_id, masajista_id, inicio, fin, precio)
       VALUES ($1, $2, $3, $4::timestamp, $4::timestamp + make_interval(mins => $5), $6)
       RETURNING id, precio, estado,
                 to_char(inicio, 'YYYY-MM-DD HH24:MI') AS inicio,
                 to_char(fin, 'YYYY-MM-DD HH24:MI') AS fin`,
      [cli.rows[0].id, servicioId, masajistaId, inicio, duracion_min, precio]
    );

    await client.query('COMMIT');
    res.status(201).json({ ok: true, cita: r.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ ok: false, mensaje: e.message });
  } finally {
    client.release();
  }
};

exports.cobrar = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }

    const r = await pool.query(
      `UPDATE citas_masaje SET estado = 'cobrada', cobrado_en = now()
       WHERE id = $1 AND estado = 'agendada'
       RETURNING id, precio`,
      [id]
    );
    if (!r.rows[0]) {
      return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada o ya no está agendada' });
    }
    res.json({ ok: true, cobrado: r.rows[0].precio });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.cancelar = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }

    const r = await pool.query(
      `UPDATE citas_masaje SET estado = 'cancelada'
       WHERE id = $1 AND estado = 'agendada'
       RETURNING id`,
      [id]
    );
    if (!r.rows[0]) {
      return res.status(404).json({ ok: false, mensaje: 'Solo se pueden cancelar citas agendadas' });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};