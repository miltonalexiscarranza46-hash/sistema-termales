const pool = require('../config/db');

exports.catalogos = async (req, res) => {
  try {
    const cat = await pool.query('SELECT id, nombre FROM categorias_producto ORDER BY id');
    const are = await pool.query(
      "SELECT id, nombre FROM areas WHERE nombre IN ('restaurante', 'bar') ORDER BY id"
    );
    res.json({ ok: true, categorias: cat.rows, areas: are.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.listarProductos = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.id, p.nombre, cp.nombre AS categoria, a.nombre AS area,
              p.precio, p.existencias, p.stock_minimo,
              (p.existencias <= p.stock_minimo) AS bajo_stock
       FROM productos p
       JOIN categorias_producto cp ON cp.id = p.categoria_id
       JOIN areas a ON a.id = p.area_id
       WHERE p.activo = TRUE
       ORDER BY a.nombre, cp.nombre, p.nombre`
    );
    res.json({ ok: true, productos: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.crearProducto = async (req, res) => {
  const client = await pool.connect();

  try {
    const nombre = (req.body.nombre || '').trim();
    const categoriaId = Number(req.body.categoria_id);
    const areaId = Number(req.body.area_id);
    const precio = Math.round(Number(req.body.precio) * 100) / 100;
    const existencias = Number(req.body.existencias || 0);
    const stockMinimo = Number(req.body.stock_minimo === undefined ? 5 : req.body.stock_minimo);

    if (!nombre || nombre.length > 100) {
      return res.status(400).json({ ok: false, mensaje: 'Escribe el nombre del producto (máximo 100 caracteres)' });
    }
    if (!Number.isInteger(categoriaId) || !Number.isInteger(areaId)) {
      return res.status(400).json({ ok: false, mensaje: 'Elige la categoría y el área' });
    }
    if (!(precio >= 0) || precio >= 100000000) {
      return res.status(400).json({ ok: false, mensaje: 'Precio inválido' });
    }
    if (!Number.isInteger(existencias) || existencias < 0 ||
        !Number.isInteger(stockMinimo) || stockMinimo < 0) {
      return res.status(400).json({ ok: false, mensaje: 'Existencias y stock mínimo deben ser enteros de cero en adelante' });
    }

    await client.query('BEGIN');

    const repetido = await client.query(
      `SELECT 1 FROM productos
       WHERE lower(nombre) = lower($1) AND area_id = $2 AND activo = TRUE
       LIMIT 1`,
      [nombre, areaId]
    );
    if (repetido.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, mensaje: 'Ya existe un producto con ese nombre en esa área' });
    }

    const p = await client.query(
      `INSERT INTO productos (nombre, categoria_id, area_id, precio, existencias, stock_minimo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre, existencias`,
      [nombre, categoriaId, areaId, precio, existencias, stockMinimo]
    );

    if (existencias > 0) {
      await client.query(
        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id)
         VALUES ($1, 'entrada', $2, 'Existencia inicial', $3)`,
        [p.rows[0].id, existencias, req.usuario.id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ok: true, producto: p.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    if (e.code === '23503') {
      return res.status(400).json({ ok: false, mensaje: 'La categoría o el área no existe' });
    }
    res.status(500).json({ ok: false, mensaje: e.message });
  } finally {
    client.release();
  }
};

exports.registrarMovimiento = async (req, res) => {
  const client = await pool.connect();

  try {
    const productoId = Number(req.body.producto_id);
    const tipo = req.body.tipo;
    const cantidad = Number(req.body.cantidad);
    const motivo = (req.body.motivo || '').trim();

    if (!Number.isInteger(productoId)) {
      return res.status(400).json({ ok: false, mensaje: 'Elige un producto' });
    }
    if (tipo !== 'entrada' && tipo !== 'salida') {
      return res.status(400).json({ ok: false, mensaje: 'El tipo debe ser entrada o salida' });
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return res.status(400).json({ ok: false, mensaje: 'La cantidad debe ser un entero mayor que cero' });
    }
    if (!motivo || motivo.length > 100) {
      return res.status(400).json({ ok: false, mensaje: 'Escribe el motivo (máximo 100 caracteres)' });
    }

    await client.query('BEGIN');

    // Bloquea el producto para que dos movimientos no se pisen
    const p = await client.query(
      'SELECT existencias FROM productos WHERE id = $1 AND activo = TRUE FOR UPDATE',
      [productoId]
    );
    if (!p.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: 'El producto no existe' });
    }

    const actual = p.rows[0].existencias;
    if (tipo === 'salida' && actual < cantidad) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, mensaje: 'No hay suficiente existencia (hay ' + actual + ')' });
    }

    const delta = tipo === 'entrada' ? cantidad : -cantidad;
    const u = await client.query(
      'UPDATE productos SET existencias = existencias + $2 WHERE id = $1 RETURNING existencias',
      [productoId, delta]
    );

    await client.query(
      `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [productoId, tipo, cantidad, motivo, req.usuario.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ ok: true, existencias: u.rows[0].existencias });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ ok: false, mensaje: e.message });
  } finally {
    client.release();
  }
};

exports.listarMovimientos = async (req, res) => {
  try {
    const productoId = req.query.producto_id ? Number(req.query.producto_id) : null;
    if (productoId !== null && !Number.isInteger(productoId)) {
      return res.status(400).json({ ok: false, mensaje: 'Producto inválido' });
    }

    const r = await pool.query(
      `SELECT m.id, p.nombre AS producto, m.tipo, m.cantidad, m.motivo,
              u.nombre AS registrado_por, m.fecha_hora
       FROM movimientos_inventario m
       JOIN productos p ON p.id = m.producto_id
       JOIN usuarios u ON u.id = m.usuario_id
       WHERE ($1::int IS NULL OR m.producto_id = $1)
       ORDER BY m.id DESC
       LIMIT 50`,
      [productoId]
    );
    res.json({ ok: true, movimientos: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};