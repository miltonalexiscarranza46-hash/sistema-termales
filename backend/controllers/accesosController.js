const pool = require('../config/db');

exports.listarTipos = async (req, res) => {
  try {
    const r = await pool.query('SELECT id, nombre, precio FROM tipos_acceso ORDER BY id');
    res.json({ ok: true, tipos: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.registrar = async (req, res) => {
  try {
    const tipoId = Number(req.body.tipo_acceso_id);
    const cantidad = Number(req.body.cantidad);

    if (!Number.isInteger(tipoId) || !Number.isInteger(cantidad) || cantidad < 1) {
      return res.status(400).json({ ok: false, mensaje: 'Datos inválidos' });
    }

    const t = await pool.query('SELECT precio FROM tipos_acceso WHERE id = $1', [tipoId]);
    if (!t.rows[0]) {
      return res.status(404).json({ ok: false, mensaje: 'Tipo de acceso no existe' });
    }

    const monto = Number(t.rows[0].precio) * cantidad;

    const r = await pool.query(
      `INSERT INTO accesos (tipo_acceso_id, cantidad, monto, usuario_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, cantidad, monto, fecha_hora`,
      [tipoId, cantidad, monto, req.usuario.id]

    );

    res.status(201).json({ ok: true, acceso: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.hoy = async (req, res) => {
  try {
    const soloMios = req.usuario.rol === 'cajero';
    const filtro = soloMios ? 'AND a.usuario_id = $1' : '';
    const params = soloMios ? [req.usuario.id] : [];

    const r = await pool.query(
      `SELECT a.id, t.nombre AS tipo, a.cantidad, a.monto,
              u.nombre AS cobrado_por, a.fecha_hora
       FROM accesos a
       JOIN tipos_acceso t ON t.id = a.tipo_acceso_id
       JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.fecha_hora::date = CURRENT_DATE ${filtro}
       ORDER BY a.fecha_hora DESC`,
      params
    );

    const total = r.rows.reduce((s, x) => s + Number(x.monto), 0);
    const personas = r.rows.reduce((s, x) => s + x.cantidad, 0);

    res.json({ ok: true, accesos: r.rows, total, personas });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }

};