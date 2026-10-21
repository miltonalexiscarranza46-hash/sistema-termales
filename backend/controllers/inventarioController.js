const pool = require('../config/db');

// Listar productos activos (Devuelve { productos: [...] } tal como lo pide el frontend)
const listarProductos = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, 
        p.nombre, 
        p.precio, 
        p.existencias, 
        p.stock_minimo, 
        p.categoria_id, 
        p.area_id,
        cp.nombre AS categoria_nombre, 
        a.nombre AS area_nombre,
        (p.existencias <= p.stock_minimo) AS bajo_stock
      FROM productos p
      LEFT JOIN categorias_producto cp ON p.categoria_id = cp.id
      LEFT JOIN areas a ON p.area_id = a.id
      WHERE p.activo = true OR p.activo IS NULL
      ORDER BY p.nombre ASC
    `;
    const result = await pool.query(query);
    
    // Clave: el frontend lee estrictamente .productos
    res.json({ ok: true, productos: result.rows });
  } catch (error) {
    console.error('Error al listar productos:', error);
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

// Crear producto
const crearProducto = async (req, res) => {
  let { nombre, categoria_id, area_id, precio, stock_minimo, stock_inicial } = req.body;

  // Asignamos valores predeterminados por si el frontend no los envía explícitamente
  categoria_id = categoria_id || 1; 
  area_id = area_id || 3;
  const existencias = stock_inicial !== undefined ? stock_inicial : 0;

  try {
    const query = `
      INSERT INTO productos (nombre, categoria_id, area_id, precio, existencias, stock_minimo, activo)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `;
    const values = [
      nombre, 
      categoria_id, 
      area_id, 
      precio || 0, 
      existencias, 
      stock_minimo || 5
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json({ ok: true, producto: result.rows[0] });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria_id, area_id, precio, existencias, stock_minimo } = req.body;
  try {
    const query = `
      UPDATE productos 
      SET nombre = $1, categoria_id = $2, area_id = $3, precio = $4, existencias = $5, stock_minimo = $6
      WHERE id = $7 
      RETURNING *
    `;
    const values = [nombre, categoria_id, area_id, precio, existencias, stock_minimo, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }
    
    res.json({ ok: true, producto: result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

// Eliminar producto (Borrado lógico)
const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      UPDATE productos 
      SET activo = false 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }

    res.json({ ok: true, mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

// Catálogos
const catalogos = async (req, res) => {
  try {
    const categorias = await pool.query('SELECT * FROM categorias_producto ORDER BY nombre ASC');
    const areas = await pool.query('SELECT * FROM areas ORDER BY nombre ASC');
    res.json({
      ok: true,
      categorias: categorias.rows,
      areas: areas.rows
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

// Registrar movimientos de inventario (Entrada / Salida / Ajuste)
const registrarMovimiento = async (req, res) => {
  const { producto_id, tipo, cantidad, motivo } = req.body;
  const usuario_id = req.usuario.id; // Asumiendo que el middleware de token inyecta el usuario

  try {
    // Validar datos básicos
    if (!producto_id || !tipo || !cantidad) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios para el movimiento' });
    }

    // Obtener producto actual para calcular nuevas existencias
    const prodRes = await pool.query('SELECT existencias FROM productos WHERE id = $1', [producto_id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }

    let stockActual = prodRes.rows[0].existencias;
    let nuevoStock = stockActual;

    if (tipo === 'entrada') {
      nuevoStock += Number(cantidad);
    } else if (tipo === 'salida') {
      nuevoStock -= Number(cantidad);
      if (nuevoStock < 0) nuevoStock = 0;
    } else if (tipo === 'ajuste') {
      nuevoStock = Number(cantidad); // En ajuste, la cantidad representa el stock físico contado
    }

    // Actualizar existencias en la tabla productos
    await pool.query('UPDATE productos SET existencias = $1 WHERE id = $2', [nuevoStock, producto_id]);

    // Registrar en el historial de movimientos
    await pool.query(
      `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [producto_id, tipo, cantidad, motivo || 'Sin motivo', usuario_id]
    );

    res.json({ ok: true, mensaje: 'Movimiento registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

const listarMovimientos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, p.nombre AS producto_nombre, u.nombre AS usuario_nombre 
      FROM movimientos_inventario m
      JOIN productos p ON m.producto_id = p.id
      JOIN usuarios u ON m.usuario_id = u.id
      ORDER BY m.fecha_hora DESC
      LIMIT 50
    `);
    res.json({ ok: true, movimientos: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

module.exports = {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  catalogos,
  registrarMovimiento,
  listarMovimientos
};