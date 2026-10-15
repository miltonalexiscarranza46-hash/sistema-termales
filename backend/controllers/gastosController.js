const pool = require('../config/db');

const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

exports.catalogos = async (req, res) => {
  try {
    const cat = await pool.query('SELECT id, nombre FROM categorias_gasto ORDER BY id');
    const are = await pool.query('SELECT id, nombre FROM areas ORDER BY id');
    res.json({ ok: true, categorias: cat.rows, areas: are.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const fecha = req.query.fecha || null;
    if (fecha && !esFecha(fecha)) {
      return res.status(400).json({ ok: false, mensaje: 'Fecha inválida' });
    }

    const r = await pool.query(
      `SELECT g.id,
              to_char(g.fecha, 'YYYY-MM-DD') AS fecha,
              c.nombre AS categoria,
              COALESCE(a.nombre, 'general') AS area,
              g.descripcion,
              g.monto,
              u.nombre AS registrado_por,
              (g.creado_en::date = CURRENT_DATE) AS se_puede_borrar
       FROM gastos g
       JOIN categorias_gasto c ON c.id = g.categoria_id
       LEFT JOIN areas a ON a.id = g.area_id
       JOIN usuarios u ON u.id = g.usuario_id
       WHERE g.fecha = COALESCE($1::date, CURRENT_DATE)
       ORDER BY g.id DESC`,
      [fecha]
    );

    const total = Math.round(
      r.rows.reduce((s, x) => s + Number(x.monto), 0) * 100
    ) / 100;

    res.json({ ok: true, gastos: r.rows, total });
  } catch (e) {
    if (e.code === '22008' || e.code === '22007') {
      return res.status(400).json({ ok: false, mensaje: 'Fecha inválida' });
    }
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const categoriaId = Number(req.body.categoria_id);
    const areaId = req.body.area_id ? Number(req.body.area_id) : null;
    const monto = Math.round(Number(req.body.monto) * 100) / 100;
    const descripcion = (req.body.descripcion || '').trim();
    const fecha = req.body.fecha || null;

    if (!Number.isInteger(categoriaId)) {
      return res.status(400).json({ ok: false, mensaje: 'Elige una categoría' });
    }
    if (areaId !== null && !Number.isInteger(areaId)) {
      return res.status(400).json({ ok: false, mensaje: 'Área inválida' });
    }
    if (!(monto > 0) || monto >= 100000000) {
      return res.status(400).json({ ok: false, mensaje: 'El monto debe ser mayor que cero' });
    }
    if (!descripcion || descripcion.length > 200) {
      return res.status(400).json({ ok: false, mensaje: 'Escribe una descripción (máximo 200 caracteres)' });
    }
    if (fecha && !esFecha(fecha)) {
      return res.status(400).json({ ok: false, mensaje: 'Fecha inválida' });
    }

    if (fecha) {
      const f = await pool.query('SELECT $1::date > CURRENT_DATE AS futura', [fecha]);
      if (f.rows[0].futura) {
        return res.status(400).json({ ok: false, mensaje: 'No se pueden registrar gastos con fecha futura' });
      }
    }

    const r = await pool.query(
      `INSERT INTO gastos (categoria_id, area_id, monto, descripcion, fecha, usuario_id)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6)
       RETURNING id, monto, to_char(fecha, 'YYYY-MM-DD') AS fecha`,
      [categoriaId, areaId, monto, descripcion, fecha, req.usuario.id]
    );

    res.status(201).json({ ok: true, gasto: r.rows[0] });
  } catch (e) {
    if (e.code === '23503') {
      return res.status(400).json({ ok: false, mensaje: 'La categoría o el área no existe' });
    }
    if (e.code === '22008' || e.code === '22007') {
      return res.status(400).json({ ok: false, mensaje: 'Fecha inválida' });
    }
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

// Solo se puede borrar un gasto registrado hoy (para corregir errores)
exports.eliminar = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }

    const r = await pool.query(
      `DELETE FROM gastos
       WHERE id = $1 AND creado_en::date = CURRENT_DATE
       RETURNING id`,
      [id]
    );
    if (!r.rows[0]) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Gasto no encontrado o ya no se puede borrar (solo los registrados hoy)',
      });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};