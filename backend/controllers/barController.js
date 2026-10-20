// backend/controllers/barController.js
// AJUSTAR: misma ruta de conexión que usa gastosController.js
const pool = require('../config/db');

// ── Nombres que dependen de tu base (cámbialos aquí si difieren) ──
const TABLA_DETALLE = 'detalle_pedidos'; // columnas: id, pedido_id, producto_id, cantidad, precio_unitario
// pedidos debe tener: id, mesero_id, total, estado_cuenta, cobrado_por, metodo_pago, fecha_pago
const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];

class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const idValido = (v) => Number.isInteger(v) && v > 0;

// Ejecuta fn dentro de una transacción. fn devuelve { status, body }.
async function enTransaccion(res, etiqueta, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { status, body } = await fn(client);
    await client.query('COMMIT');
    res.status(status).json(body);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof HttpError) {
      return res.status(err.status).json({ mensaje: err.message });
    }
    console.error(`${etiqueta}:`, err);
    res.status(500).json({ mensaje: `Error en ${etiqueta}` });
  } finally {
    client.release();
  }
}

// Bloquea el pedido SOLO si es del mesero. Si no existe o es de otro: 404.
async function bloquearPedido(client, pedidoId, meseroId) {
  const { rows } = await client.query(
    'SELECT * FROM pedidos WHERE id = $1 AND mesero_id = $2 FOR UPDATE',
    [pedidoId, meseroId]
  );
  if (rows.length === 0) throw new HttpError(404, 'Pedido no encontrado');
  return rows[0];
}

function exigirAbierto(pedido) {
  if (pedido.estado_cuenta !== 'abierta') {
    throw new HttpError(409, 'El pedido ya no está abierto y no se puede modificar');
  }
}

async function recalcularTotal(client, pedidoId) {
  await client.query(
    `UPDATE pedidos
        SET total = COALESCE((SELECT SUM(cantidad * precio_unitario)
                                FROM ${TABLA_DETALLE}
                               WHERE pedido_id = $1), 0)
      WHERE id = $1`,
    [pedidoId]
  );
}

async function cargarPedido(client, pedidoId) {
  const p = await client.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
  const items = await client.query(
    `SELECT d.id, d.producto_id, pr.nombre, d.cantidad, d.precio_unitario,
            (d.cantidad * d.precio_unitario) AS subtotal
       FROM ${TABLA_DETALLE} d
       JOIN productos pr ON pr.id = d.producto_id
      WHERE d.pedido_id = $1
      ORDER BY d.id`,
    [pedidoId]
  );
  return { ...p.rows[0], items: items.rows };
}

// GET /api/bar/pedidos?estado=abierta|pagada|cancelada   (mesero: solo los suyos)
exports.listarPedidos = async (req, res) => {
  const { estado } = req.query;
  if (estado && !['abierta', 'pagada', 'cancelada'].includes(estado)) {
    return res.status(400).json({ mensaje: 'estado inválido' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM pedidos
        WHERE mesero_id = $1 AND ($2::text IS NULL OR estado_cuenta = $2)
        ORDER BY id DESC
        LIMIT 100`,
      [req.usuario.id, estado || null]
    );
    res.json(rows);
  } catch (err) {
    console.error('listarPedidos:', err);
    res.status(500).json({ mensaje: 'Error al listar pedidos' });
  }
};

// POST /api/bar/pedidos   → abre un pedido vacío
exports.abrirPedido = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO pedidos (mesero_id, total, estado_cuenta)
       VALUES ($1, 0, 'abierta')
       RETURNING *`,
      [req.usuario.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('abrirPedido:', err);
    res.status(500).json({ mensaje: 'Error al abrir el pedido' });
  }
};

// GET /api/bar/pedidos/:id
exports.obtenerPedido = async (req, res) => {
  const pedidoId = parseInt(req.params.id, 10);
  if (!idValido(pedidoId)) return res.status(400).json({ mensaje: 'id inválido' });

  try {
    const { rows } = await pool.query(
      'SELECT id FROM pedidos WHERE id = $1 AND mesero_id = $2',
      [pedidoId, req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    res.json(await cargarPedido(pool, pedidoId));
  } catch (err) {
    console.error('obtenerPedido:', err);
    res.status(500).json({ mensaje: 'Error al obtener el pedido' });
  }
};

// POST /api/bar/pedidos/:id/items   body: { producto_id, cantidad }
// El precio NUNCA viene del navegador: sale de la tabla productos.
exports.agregarItem = async (req, res) => {
  const pedidoId = parseInt(req.params.id, 10);
  const { producto_id, cantidad } = req.body;

  if (!idValido(pedidoId)) return res.status(400).json({ mensaje: 'id de pedido inválido' });
  if (!idValido(producto_id)) return res.status(400).json({ mensaje: 'producto_id inválido' });
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return res.status(400).json({ mensaje: 'La cantidad debe ser un entero mayor a 0' });
  }

  await enTransaccion(res, 'agregarItem', async (client) => {
    const pedido = await bloquearPedido(client, pedidoId, req.usuario.id);
    exigirAbierto(pedido);

    const prod = await client.query(
      'SELECT id, precio FROM productos WHERE id = $1 AND activo = TRUE',
      [producto_id]
    );
    if (prod.rows.length === 0) throw new HttpError(404, 'Producto no encontrado');
    const precio = prod.rows[0].precio;

    const existente = await client.query(
      `SELECT id FROM ${TABLA_DETALLE} WHERE pedido_id = $1 AND producto_id = $2`,
      [pedidoId, producto_id]
    );
    if (existente.rows.length > 0) {
      await client.query(
        `UPDATE ${TABLA_DETALLE}
            SET cantidad = cantidad + $1, precio_unitario = $2
          WHERE id = $3`,
        [cantidad, precio, existente.rows[0].id]
      );
    } else {
      await client.query(
        `INSERT INTO ${TABLA_DETALLE} (pedido_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedidoId, producto_id, cantidad, precio]
      );
    }

    await recalcularTotal(client, pedidoId);
    return { status: 201, body: await cargarPedido(client, pedidoId) };
  });
};

// DELETE /api/bar/pedidos/:id/items/:itemId
exports.quitarItem = async (req, res) => {
  const pedidoId = parseInt(req.params.id, 10);
  const itemId = parseInt(req.params.itemId, 10);
  if (!idValido(pedidoId) || !idValido(itemId)) {
    return res.status(400).json({ mensaje: 'id inválido' });
  }

  await enTransaccion(res, 'quitarItem', async (client) => {
    const pedido = await bloquearPedido(client, pedidoId, req.usuario.id);
    exigirAbierto(pedido);

    const del = await client.query(
      `DELETE FROM ${TABLA_DETALLE} WHERE id = $1 AND pedido_id = $2`,
      [itemId, pedidoId]
    );
    if (del.rowCount === 0) throw new HttpError(404, 'Línea del pedido no encontrada');

    await recalcularTotal(client, pedidoId);
    return { status: 200, body: await cargarPedido(client, pedidoId) };
  });
};

// POST /api/bar/pedidos/:id/cobrar   body: { metodo_pago }
// Una sola transacción: valida stock, descuenta, registra movimientos y marca pagado.
exports.cobrarPedido = async (req, res) => {
  const pedidoId = parseInt(req.params.id, 10);
  const { metodo_pago } = req.body;

  if (!idValido(pedidoId)) return res.status(400).json({ mensaje: 'id inválido' });
  if (!METODOS_PAGO.includes(metodo_pago)) {
    return res.status(400).json({ mensaje: `metodo_pago debe ser: ${METODOS_PAGO.join(', ')}` });
  }

  await enTransaccion(res, 'cobrarPedido', async (client) => {
    const pedido = await bloquearPedido(client, pedidoId, req.usuario.id);
    exigirAbierto(pedido);

    // Cantidad total por producto, ordenada por id para bloquear siempre en el mismo orden
    const lineas = await client.query(
      `SELECT producto_id, SUM(cantidad)::int AS cantidad
         FROM ${TABLA_DETALLE}
        WHERE pedido_id = $1
        GROUP BY producto_id
        ORDER BY producto_id`,
      [pedidoId]
    );
    if (lineas.rows.length === 0) {
      throw new HttpError(400, 'No se puede cobrar un pedido sin productos');
    }

    for (const l of lineas.rows) {
      const { rows } = await client.query(
        'SELECT id, nombre, stock FROM productos WHERE id = $1 FOR UPDATE',
        [l.producto_id]
      );
      if (rows.length === 0) throw new HttpError(409, `El producto ${l.producto_id} ya no existe`);

      const { nombre, stock } = rows[0];
      if (stock < l.cantidad) {
        throw new HttpError(409, `Stock insuficiente de "${nombre}": hay ${stock} y el pedido pide ${l.cantidad}`);
      }

      const nuevoStock = stock - l.cantidad;
      await client.query('UPDATE productos SET stock = $1 WHERE id = $2', [nuevoStock, l.producto_id]);
      await client.query(
        `INSERT INTO inventario_movimientos
           (producto_id, tipo, cantidad, stock_resultante, motivo, usuario_id)
         VALUES ($1, 'salida', $2, $3, $4, $5)`,
        [l.producto_id, l.cantidad, nuevoStock, `Venta pedido #${pedidoId}`, req.usuario.id]
      );
    }

    // El total lo calcula el servidor, nunca el navegador
    await recalcularTotal(client, pedidoId);
    await client.query(
      `UPDATE pedidos
          SET estado_cuenta = 'pagada', cobrado_por = $1, metodo_pago = $2, fecha_pago = NOW()
        WHERE id = $3`,
      [req.usuario.id, metodo_pago, pedidoId]
    );

    return { status: 200, body: await cargarPedido(client, pedidoId) };
  });
};