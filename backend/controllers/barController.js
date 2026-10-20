const pool = require('../config/db');

const AREAS_BAR = ['restaurante', 'bar'];
const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];
const ESTADOS = ['abierto', 'cobrado', 'cancelado'];

const fallo = (res, codigo, mensaje) =>
  res.status(codigo).json({ ok: false, mensaje });

// Entero positivo o null
const idValido = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// Pedido del mesero, bloqueado para que nadie más lo modifique a la vez
async function bloquearPedido(client, pedidoId, meseroId) {
  const r = await client.query(
    `SELECT id, area_id, estado FROM pedidos
     WHERE id = $1 AND mesero_id = $2
     FOR UPDATE`,
    [pedidoId, meseroId]
  );
  return r.rows[0] || null;
}

// Devuelve el pedido abierto del mesero; si no, responde el error y devuelve null
async function pedidoAbierto(client, res, pedidoId, meseroId) {
  const ped = await bloquearPedido(client, pedidoId, meseroId);
  if (!ped) {
    await client.query('ROLLBACK');
    fallo(res, 404, 'El pedido no existe');

    return null;
  }
  if (ped.estado !== 'abierto') {
    await client.query('ROLLBACK');
    fallo(res, 409, 'El pedido ya no está abierto (' + ped.estado + ')');
    return null;
  }
  return ped;
}

// Suma las líneas y guarda el total en el pedido (lo calcula el servidor)
async function recalcularTotal(client, pedidoId) {
  const r = await client.query(
    `UPDATE pedidos
     SET total = COALESCE((SELECT SUM(subtotal) FROM detalle_pedido WHERE pedido_id = $1), 0)
     WHERE id = $1
     RETURNING total`,
    [pedidoId]
  );
  return r.rows[0].total;
}

/* ---------- Consultas ---------- */

exports.catalogos = async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, nombre FROM areas WHERE nombre = ANY($1) ORDER BY id',
      [AREAS_BAR]
    );
    res.json({ ok: true, areas: r.rows, metodos_pago: METODOS_PAGO });
  } catch (e) {

    fallo(res, 500, e.message);
  }
};

exports.productos = async (req, res) => {
  try {
    const areaId = idValido(req.query.area_id);
    if (!areaId) return fallo(res, 400, 'Elige el área');

    const r = await pool.query(
      `SELECT p.id, p.nombre, cp.nombre AS categoria, p.precio, p.existencias
       FROM productos p
       JOIN categorias_producto cp ON cp.id = p.categoria_id
       JOIN areas a ON a.id = p.area_id
       WHERE p.activo = TRUE AND p.area_id = $1 AND a.nombre = ANY($2)
       ORDER BY cp.nombre, p.nombre`,
      [areaId, AREAS_BAR]
    );
    res.json({ ok: true, productos: r.rows });
  } catch (e) {
    fallo(res, 500, e.message);
  }
};

exports.listarPedidos = async (req, res) => {
  try {
    const estado = req.query.estado || 'abierto';
    if (!ESTADOS.includes(estado)) return fallo(res, 400, 'Estado inválido');

    // Abiertos: todos. Cobrados y cancelados: solo los de hoy.
    const filtroFecha =
      estado === 'cobrado' ? 'AND p.fecha_pago::date = CURRENT_DATE'

      : estado === 'cancelado' ? 'AND p.fecha_hora::date = CURRENT_DATE'
      : '';

    const r = await pool.query(
      `SELECT p.id, a.nombre AS area, p.mesa, p.total, p.estado, p.metodo_pago,
              p.fecha_hora, p.fecha_pago,
              (SELECT COALESCE(SUM(d.cantidad), 0)::int
               FROM detalle_pedido d WHERE d.pedido_id = p.id) AS articulos
       FROM pedidos p
       JOIN areas a ON a.id = p.area_id
       WHERE p.mesero_id = $1 AND p.estado = $2 ${filtroFecha}
       ORDER BY p.id DESC`,
      [req.usuario.id, estado]
    );
    res.json({ ok: true, pedidos: r.rows });
  } catch (e) {
    fallo(res, 500, e.message);
  }
};

exports.verPedido = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return fallo(res, 400, 'Pedido inválido');

    const p = await pool.query(
      `SELECT p.id, p.area_id, a.nombre AS area, p.mesa, p.total, p.estado,
              p.metodo_pago, p.fecha_hora, p.fecha_pago
       FROM pedidos p
       JOIN areas a ON a.id = p.area_id
       WHERE p.id = $1 AND p.mesero_id = $2`,
      [id, req.usuario.id]

    );
    if (!p.rows[0]) return fallo(res, 404, 'El pedido no existe');

    const d = await pool.query(
      `SELECT d.producto_id, pr.nombre AS producto, d.cantidad,
              d.precio_unitario, d.subtotal
       FROM detalle_pedido d
       JOIN productos pr ON pr.id = d.producto_id
       WHERE d.pedido_id = $1
       ORDER BY pr.nombre`,
      [id]
    );
    res.json({ ok: true, pedido: p.rows[0], detalle: d.rows });
  } catch (e) {
    fallo(res, 500, e.message);
  }
};

exports.miResumen = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT metodo_pago, COUNT(*)::int AS cuentas, COALESCE(SUM(total), 0) AS total
       FROM pedidos
       WHERE estado = 'cobrado' AND cobrado_por = $1
         AND fecha_pago::date = CURRENT_DATE
       GROUP BY metodo_pago
       ORDER BY metodo_pago`,
      [req.usuario.id]
    );
    const total = r.rows.reduce((s, x) => s + Number(x.total), 0);
    const cuentas = r.rows.reduce((s, x) => s + x.cuentas, 0);
    res.json({ ok: true, por_metodo: r.rows, total, cuentas });

  } catch (e) {
    fallo(res, 500, e.message);
  }
};

/* ---------- Pedidos ---------- */

exports.abrirPedido = async (req, res) => {
  try {
    const areaId = idValido(req.body.area_id);
    const mesa = String(req.body.mesa || '').trim();

    if (!areaId) return fallo(res, 400, 'Elige el área');
    if (!mesa || mesa.length > 20) {
      return fallo(res, 400, 'Escribe la mesa (máximo 20 caracteres)');
    }

    const a = await pool.query(
      'SELECT id FROM areas WHERE id = $1 AND nombre = ANY($2)',
      [areaId, AREAS_BAR]
    );
    if (!a.rows[0]) return fallo(res, 400, 'El área no es válida para pedidos');

    const r = await pool.query(
      `INSERT INTO pedidos (area_id, mesa, mesero_id)
       VALUES ($1, $2, $3)
       RETURNING id, area_id, mesa, total, estado, fecha_hora`,
      [areaId, mesa, req.usuario.id]
    );
    res.status(201).json({ ok: true, pedido: r.rows[0] });
  } catch (e) {
    fallo(res, 500, e.message);

  }
};

// Agrega un producto (si ya está en el pedido, suma la cantidad)
exports.agregarItem = async (req, res) => {
  const client = await pool.connect();
  try {
    const pedidoId = idValido(req.params.id);
    const productoId = idValido(req.body.producto_id);
    const cantidad = Number(req.body.cantidad === undefined ? 1 : req.body.cantidad);

    if (!pedidoId || !productoId) return fallo(res, 400, 'Pedido o producto inválido');
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 999) {
      return fallo(res, 400, 'La cantidad debe ser un entero entre 1 y 999');
    }

    await client.query('BEGIN');

    const ped = await pedidoAbierto(client, res, pedidoId, req.usuario.id);
    if (!ped) return;

    // El precio sale de la base de datos, nunca del navegador
    const pr = await client.query(
      `SELECT nombre, precio, existencias FROM productos
       WHERE id = $1 AND activo = TRUE AND area_id = $2`,
      [productoId, ped.area_id]
    );
    if (!pr.rows[0]) {
      await client.query('ROLLBACK');
      return fallo(res, 404, 'El producto no existe en esa área');
    }


    // Aviso temprano de stock (no lo reserva; el cobro lo valida de nuevo)
    const previa = await client.query(
      'SELECT cantidad FROM detalle_pedido WHERE pedido_id = $1 AND producto_id = $2',
      [pedidoId, productoId]
    );
    const nueva = (previa.rows[0] ? previa.rows[0].cantidad : 0) + cantidad;
    if (nueva > pr.rows[0].existencias) {
      await client.query('ROLLBACK');
      return fallo(
        res, 409,
        'No hay suficiente existencia de ' + pr.rows[0].nombre +
        ' (hay ' + pr.rows[0].existencias + ')'
      );
    }

    // Si ya estaba, se conserva el precio con el que se agregó
    await client.query(
      `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
       VALUES ($1, $2, $3::int, $4::numeric, $3::int * $4::numeric)
       ON CONFLICT (pedido_id, producto_id) DO UPDATE
       SET cantidad = detalle_pedido.cantidad + EXCLUDED.cantidad,
           subtotal = (detalle_pedido.cantidad + EXCLUDED.cantidad) * detalle_pedido.precio_unitario`,
      [pedidoId, productoId, cantidad, pr.rows[0].precio]
    );

    const total = await recalcularTotal(client, pedidoId);
    await client.query('COMMIT');
    res.status(201).json({ ok: true, cantidad: nueva, total });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    fallo(res, 500, e.message);
  } finally {

    client.release();
  }
};

// Cambia la cantidad de un producto del pedido (0 lo quita)
exports.cambiarCantidad = async (req, res) => {
  const client = await pool.connect();
  try {
    const pedidoId = idValido(req.params.id);
    const productoId = idValido(req.params.productoId);
    const cantidad = Number(req.body.cantidad);

    if (!pedidoId || !productoId) return fallo(res, 400, 'Pedido o producto inválido');
    if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > 999) {
      return fallo(res, 400, 'La cantidad debe ser un entero entre 0 y 999 (0 quita el producto)');
    }

    await client.query('BEGIN');

    const ped = await pedidoAbierto(client, res, pedidoId, req.usuario.id);
    if (!ped) return;

    let afectadas;
    if (cantidad === 0) {
      afectadas = await client.query(
        'DELETE FROM detalle_pedido WHERE pedido_id = $1 AND producto_id = $2',
        [pedidoId, productoId]
      );
    } else {
      const pr = await client.query(
        'SELECT nombre, existencias FROM productos WHERE id = $1',
        [productoId]

      );
      if (pr.rows[0] && cantidad > pr.rows[0].existencias) {
        await client.query('ROLLBACK');
        return fallo(
          res, 409,
          'No hay suficiente existencia de ' + pr.rows[0].nombre +
          ' (hay ' + pr.rows[0].existencias + ')'
        );
      }
      afectadas = await client.query(
        `UPDATE detalle_pedido
         SET cantidad = $3::int, subtotal = $3::int * precio_unitario
         WHERE pedido_id = $1 AND producto_id = $2`,
        [pedidoId, productoId, cantidad]
      );
    }

    if (afectadas.rowCount === 0) {
      await client.query('ROLLBACK');
      return fallo(res, 404, 'Ese producto no está en el pedido');
    }

    const total = await recalcularTotal(client, pedidoId);
    await client.query('COMMIT');
    res.json({ ok: true, total });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    fallo(res, 500, e.message);
  } finally {
    client.release();
  }
};


// Cobra: descuenta inventario, guarda quién cobró, cómo pagó y cuándo
exports.cobrar = async (req, res) => {
  const client = await pool.connect();
  try {
    const pedidoId = idValido(req.params.id);
    const metodo = req.body.metodo_pago;

    if (!pedidoId) return fallo(res, 400, 'Pedido inválido');
    if (!METODOS_PAGO.includes(metodo)) {
      return fallo(res, 400, 'Elige cómo pagó el cliente (efectivo, tarjeta o transferencia)');
    }

    await client.query('BEGIN');

    const ped = await pedidoAbierto(client, res, pedidoId, req.usuario.id);
    if (!ped) return;

    // Bloquea los productos en orden para evitar bloqueos cruzados entre meseros
    const lineas = await client.query(
      `SELECT d.producto_id, d.cantidad, pr.nombre, pr.existencias
       FROM detalle_pedido d
       JOIN productos pr ON pr.id = d.producto_id
       WHERE d.pedido_id = $1
       ORDER BY d.producto_id
       FOR UPDATE OF pr`,
      [pedidoId]
    );

    if (lineas.rows.length === 0) {
      await client.query('ROLLBACK');
      return fallo(res, 400, 'El pedido no tiene productos');

    }

    const faltantes = lineas.rows.filter((l) => l.cantidad > l.existencias);
    if (faltantes.length > 0) {
      await client.query('ROLLBACK');
      return fallo(
        res, 409,
        'No hay suficiente existencia: ' +
        faltantes
          .map((l) => l.nombre + ' (pide ' + l.cantidad + ', hay ' + l.existencias + ')')
          .join('; ')
      );
    }

    for (const l of lineas.rows) {
      await client.query(
        'UPDATE productos SET existencias = existencias - $2 WHERE id = $1',
        [l.producto_id, l.cantidad]
      );
      await client.query(
        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id)
         VALUES ($1, 'salida', $2, $3, $4)`,
        [l.producto_id, l.cantidad, 'Venta pedido #' + pedidoId, req.usuario.id]
      );
    }

    await recalcularTotal(client, pedidoId);

    const r = await client.query(
      `UPDATE pedidos
       SET estado = 'cobrado', cobrado_por = $2, metodo_pago = $3, fecha_pago = NOW()
       WHERE id = $1

       RETURNING id, total, estado, metodo_pago, fecha_pago`,
      [pedidoId, req.usuario.id, metodo]
    );

    await client.query('COMMIT');
    res.json({ ok: true, pedido: r.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    fallo(res, 500, e.message);
  } finally {
    client.release();
  }
};

// Cancela un pedido abierto (no mueve inventario: nunca se había descontado)
exports.cancelar = async (req, res) => {
  try {
    const pedidoId = idValido(req.params.id);
    if (!pedidoId) return fallo(res, 400, 'Pedido inválido');

    const r = await pool.query(
      `UPDATE pedidos SET estado = 'cancelado'
       WHERE id = $1 AND mesero_id = $2 AND estado = 'abierto'
       RETURNING id, estado`,
      [pedidoId, req.usuario.id]
    );
    if (!r.rows[0]) return fallo(res, 404, 'El pedido no existe o ya no está abierto');

    res.json({ ok: true, pedido: r.rows[0] });
  } catch (e) {
    fallo(res, 500, e.message);
  }

};