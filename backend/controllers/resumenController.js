const pool = require('../config/db');

const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const r2 = (n) => Math.round(n * 100) / 100;

exports.dia = async (req, res) => {
  try {
    const fecha = req.query.fecha || null;
    if (fecha && !esFecha(fecha)) {
      return res.status(400).json({ ok: false, mensaje: 'Fecha inválida' });
    }

    const d = await pool.query(
      'SELECT COALESCE($1::date, CURRENT_DATE)::text AS dia',
      [fecha]
    );

    // Ingresos por área, rol y empleado
    const ing = await pool.query(
      `WITH f AS (SELECT COALESCE($1::date, CURRENT_DATE) AS dia)
       SELECT 'Entradas a piscinas' AS area, ro.nombre AS rol,
              u.nombre AS empleado, COUNT(*)::int AS operaciones,
              SUM(a.monto) AS total
       FROM accesos a
       JOIN usuarios u ON u.id = a.usuario_id
       JOIN roles ro ON ro.id = u.rol_id
       CROSS JOIN f
       WHERE a.fecha_hora::date = f.dia
       GROUP BY u.nombre, ro.nombre

       UNION ALL

       SELECT 'Reservas (anticipos)', ro.nombre, u.nombre,
              COUNT(*)::int, SUM(r.anticipo)
       FROM reservas r
       JOIN usuarios u ON u.id = r.usuario_id
       JOIN roles ro ON ro.id = u.rol_id
       CROSS JOIN f
       WHERE r.creado_en::date = f.dia
         AND r.estado <> 'cancelada' AND r.anticipo > 0
       GROUP BY u.nombre, ro.nombre

       UNION ALL

       SELECT 'Masajes', ro.nombre, u.nombre,
              COUNT(*)::int, SUM(c.precio)
       FROM citas_masaje c
       JOIN usuarios u ON u.id = c.masajista_id
       JOIN roles ro ON ro.id = u.rol_id
       CROSS JOIN f
       WHERE c.estado = 'cobrada' AND c.cobrado_en::date = f.dia
       GROUP BY u.nombre, ro.nombre

       ORDER BY 1, 3`,
      [fecha]
    );

    // Gastos por categoría y área
    const gas = await pool.query(
      `SELECT c.nombre AS categoria,
              COALESCE(a.nombre, 'general') AS area,
              COUNT(*)::int AS operaciones,
              SUM(g.monto) AS total
       FROM gastos g
       JOIN categorias_gasto c ON c.id = g.categoria_id
       LEFT JOIN areas a ON a.id = g.area_id
       WHERE g.fecha = COALESCE($1::date, CURRENT_DATE)
       GROUP BY c.nombre, a.nombre
       ORDER BY c.nombre, a.nombre`,
      [fecha]
    );

    const ingresos = ing.rows.map((x) => ({ ...x, total: Number(x.total) }));
    const gastos = gas.rows.map((x) => ({ ...x, total: Number(x.total) }));

    const total_ingresos = r2(ingresos.reduce((s, x) => s + x.total, 0));
    const total_gastos = r2(gastos.reduce((s, x) => s + x.total, 0));

    res.json({
      ok: true,
      fecha: d.rows[0].dia,
      ingresos,
      total_ingresos,
      gastos,
      total_gastos,
      balance: r2(total_ingresos - total_gastos),
    });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};