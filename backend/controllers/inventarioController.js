// backend/controllers/inventarioController.js
// AJUSTAR: la ruta de conexión a la base (copiar la misma que usa gastosController.js)
const pool = require('../config/db');

const TIPOS = ['entrada', 'salida', 'ajuste'];

const esEnteroNoNegativo = (v) => Number.isInteger(v) && v >= 0;

// GET /api/inventario/productos  (bodega, mesero)
exports.listarProductos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, precio, stock, stock_minimo,
              (stock <= stock_minimo) AS stock_bajo
         FROM productos
        WHERE activo = TRUE
        ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) {
    console.error('listarProductos:', err);
    res.status(500).json({ mensaje: 'Error al listar productos' });
  }
};

// POST /api/inventario/productos  (bodega)
// body: { nombre, precio, stock_minimo, stock_inicial }
exports.crearProducto = async (req, res) => {
  const { nombre, precio, stock_minimo = 0, stock_inicial = 0 } = req.body;

  if (typeof nombre !== 'string' || nombre.trim() === '') {
    return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  }
  if (typeof precio !== 'number' || !(precio >= 0)) {
    return res.status(400).json({ mensaje: 'El precio debe ser un número mayor o igual a 0' });
  }
  if (!esEnteroNoNegativo(stock_minimo) || !esEnteroNoNegativo(stock_inicial)) {
    return res.status(400).json({ mensaje: 'Stock mínimo e inicial deben ser enteros mayores o iguales a 0' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO productos (nombre, precio, stock, stock_minimo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, precio, stock, stock_minimo`,
      [nombre.trim(), precio, stock_inicial, stock_minimo]
    );
    const producto = rows[0];

    if (stock_inicial > 0) {
      await client.query(
        `INSERT INTO movimientos_inventario
           (producto_id, tipo, cantidad, stock_resultante, motivo, usuario_id)
         VALUES ($1, 'entrada', $2, $2, 'Stock inicial', $3)`,
        [producto.id, stock_inicial, req.usuario.id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(producto);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya existe un producto con ese nombre' });
    }
    console.error('crearProducto:', err);
    res.status(500).json({ mensaje: 'Error al crear el producto' });
  } finally {
    client.release();
  }
};

// POST /api/inventario/movimientos  (bodega)
// body: { producto_id, tipo: 'entrada'|'salida'|'ajuste', cantidad, motivo }
// - entrada: suma cantidad
// - salida:  resta cantidad (409 si el stock quedaría negativo)
// - ajuste:  cantidad es el NUEVO stock contado físicamente
exports.registrarMovimiento = async (req, res) => {
  const { producto_id, tipo, cantidad, motivo } = req.body;

  if (!Number.isInteger(producto_id) || producto_id <= 0) {
    return res.status(400).json({ mensaje: 'producto_id inválido' });
  }
  if (!TIPOS.includes(tipo)) {
    return res.status(400).json({ mensaje: "tipo debe ser 'entrada', 'salida' o 'ajuste'" });
  }
  if (!Number.isInteger(cantidad) || cantidad < 0 || (tipo !== 'ajuste' && cantidad === 0)) {
    return res.status(400).json({ mensaje: 'La cantidad debe ser un entero positivo (el ajuste admite 0)' });
  }
  if ((tipo === 'salida' || tipo === 'ajuste') && (typeof motivo !== 'string' || motivo.trim() === '')) {
    return res.status(400).json({ mensaje: 'El motivo es obligatorio en salidas y ajustes' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Bloquea la fila para que dos movimientos simultáneos no pisen el stock
    const { rows } = await client.query(
      'SELECT id, nombre, stock FROM productos WHERE id = $1 AND activo = TRUE FOR UPDATE',
      [producto_id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    const { nombre, stock } = rows[0];
    let nuevoStock;
    if (tipo === 'entrada')      nuevoStock = stock + cantidad;
    else if (tipo === 'salida')  nuevoStock = stock - cantidad;
    else                         nuevoStock = cantidad;

    if (nuevoStock < 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        mensaje: `Stock insuficiente de "${nombre}": hay ${stock} y se intentan sacar ${cantidad}`
      });
    }

    await client.query('UPDATE productos SET stock = $1 WHERE id = $2', [nuevoStock, producto_id]);

    const mov = await client.query(
      `INSERT INTO movimientos_inventario
         (producto_id, tipo, cantidad, stock_resultante, motivo, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, producto_id, tipo, cantidad, stock_resultante, motivo, usuario_id, fecha`,
      [producto_id, tipo, cantidad, nuevoStock, motivo ? motivo.trim() : null, req.usuario.id]
    );

    await client.query('COMMIT');
    res.status(201).json(mov.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('registrarMovimiento:', err);
    res.status(500).json({ mensaje: 'Error al registrar el movimiento' });
  } finally {
    client.release();
  }
};

// GET /api/inventario/movimientos  (bodega)
// query opcional: ?producto_id=3&limite=50
exports.listarMovimientos = async (req, res) => {
  const productoId = req.query.producto_id ? parseInt(req.query.producto_id, 10) : null;
  let limite = parseInt(req.query.limite, 10);
  if (!Number.isInteger(limite) || limite <= 0 || limite > 500) limite = 100;

  if (req.query.producto_id && !Number.isInteger(productoId)) {
    return res.status(400).json({ mensaje: 'producto_id inválido' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.producto_id, p.nombre AS producto, m.tipo, m.cantidad,
              m.stock_resultante, m.motivo, m.usuario_id, m.fecha
         FROM movimientos_inventario m
         JOIN productos p ON p.id = m.producto_id
        WHERE ($1::int IS NULL OR m.producto_id = $1)
        ORDER BY m.fecha DESC, m.id DESC
        LIMIT $2`,
      [productoId, limite]
    );
    res.json(rows);
  } catch (err) {
    console.error('listarMovimientos:', err);
    res.status(500).json({ mensaje: 'Error al listar movimientos' });
  }
};