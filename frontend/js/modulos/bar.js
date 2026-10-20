// frontend/js/modulos/bar.js
// Expone cargarBar(area). Pantalla del mesero: pedidos abiertos, agregar productos y cobrar.
(function () {
  const API_BAR = '/api/bar';
  const API_INV = '/api/inventario';
  const METODOS = ['efectivo', 'tarjeta', 'transferencia'];

  // AJUSTAR: cómo guarda tu login el token (copiar de gastos.js)
  const token = () => localStorage.getItem('token');

  async function api(url, opciones = {}) {
    const resp = await fetch(url, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
    });
    const datos = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(datos.mensaje || 'Error ' + resp.status);
    return datos;
  }

  function h(tag, props = {}, ...hijos) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    hijos.flat().filter((c) => c != null && c !== false).forEach((c) => el.append(c));
    return el;
  }

  const dinero = (n) => '$' + Number(n).toFixed(2);

  window.cargarBar = function (area) {
    area.replaceChildren();
    area.classList.add('bar-modulo');

    const msg = h('p', { class: 'bar-msg' });
    const panel = h('div', { class: 'bar-panel' });
    area.append(h('h2', {}, 'Restaurante y bar'), msg, panel);

    function mostrar(texto, esError) {
      msg.textContent = texto;
      msg.className = 'bar-msg ' + (esError ? 'bar-error' : 'bar-ok');
    }

    // ── Lista de pedidos abiertos ──
    async function verLista() {
      try {
        const pedidos = await api(API_BAR + '/pedidos?estado=abierta');
        const filas = pedidos.map((p) =>
          h('tr', {},
            h('td', {}, '#' + p.id),
            h('td', {}, dinero(p.total)),
            h('td', {}, h('button', { class: 'bar-btn', onclick: () => verDetalle(p.id) }, 'Abrir'))
          )
        );
        panel.replaceChildren(
          h('button', { class: 'bar-btn bar-principal', onclick: nuevoPedido }, 'Nuevo pedido'),
          h('h3', {}, 'Pedidos abiertos'),
          filas.length
            ? h('table', { class: 'bar-table' },
                h('thead', {}, h('tr', {}, ['Pedido', 'Total', ''].map((t) => h('th', {}, t)))),
                h('tbody', {}, filas))
            : h('p', {}, 'No tienes pedidos abiertos.')
        );
      } catch (e) {
        mostrar(e.message, true);
      }
    }

    async function nuevoPedido() {
      try {
        const p = await api(API_BAR + '/pedidos', { method: 'POST', body: '{}' });
        mostrar('Pedido #' + p.id + ' abierto', false);
        verDetalle(p.id);
      } catch (e) {
        mostrar(e.message, true);
      }
    }

    // ── Detalle de un pedido ──
    async function verDetalle(id) {
      try {
        const [pedido, productos] = await Promise.all([
          api(API_BAR + '/pedidos/' + id),
          api(API_INV + '/productos'),
        ]);

        const filas = pedido.items.map((it) =>
          h('tr', {},
            h('td', {}, it.nombre),
            h('td', {}, String(it.cantidad)),
            h('td', {}, dinero(it.precio_unitario)),
            h('td', {}, dinero(it.subtotal)),
            h('td', {}, h('button', { class: 'bar-btn', onclick: () => quitar(id, it.id) }, 'Quitar'))
          )
        );

        // Agregar producto
        const selProd = h('select', { required: '' },
          ...productos.map((p) =>
            h('option', { value: String(p.id) }, `${p.nombre} — ${dinero(p.precio)} (stock ${p.stock})`)));
        const inCant = h('input', { type: 'number', min: '1', step: '1', value: '1', required: '' });
        const formAgregar = h('form', { class: 'bar-form' }, selProd, inCant,
          h('button', { type: 'submit', class: 'bar-btn' }, 'Agregar'));
        formAgregar.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          try {
            await api(API_BAR + '/pedidos/' + id + '/items', {
              method: 'POST',
              body: JSON.stringify({ producto_id: Number(selProd.value), cantidad: Number(inCant.value) }),
            });
            mostrar('', false);
            verDetalle(id);
          } catch (e) {
            mostrar(e.message, true);
          }
        });

        // Cobrar
        const selPago = h('select', {}, ...METODOS.map((m) => h('option', { value: m }, m)));
        const btnCobrar = h('button', { class: 'bar-btn bar-principal', onclick: () => cobrar(id, selPago.value) },
          'Cobrar ' + dinero(pedido.total));

        panel.replaceChildren(
          h('button', { class: 'bar-btn', onclick: verLista }, '← Volver'),
          h('h3', {}, 'Pedido #' + id),
          filas.length
            ? h('table', { class: 'bar-table' },
                h('thead', {}, h('tr', {}, ['Producto', 'Cant.', 'Precio', 'Subtotal', ''].map((t) => h('th', {}, t)))),
                h('tbody', {}, filas))
            : h('p', {}, 'Aún no hay productos.'),
          h('p', { class: 'bar-total' }, 'Total: ' + dinero(pedido.total)),
          h('h4', {}, 'Agregar producto'),
          formAgregar,
          h('h4', {}, 'Cobro'),
          h('div', { class: 'bar-form' }, selPago, btnCobrar)
        );
      } catch (e) {
        mostrar(e.message, true);
      }
    }

    async function quitar(pedidoId, itemId) {
      try {
        await api(API_BAR + '/pedidos/' + pedidoId + '/items/' + itemId, { method: 'DELETE' });
        verDetalle(pedidoId);
      } catch (e) {
        mostrar(e.message, true);
      }
    }

    async function cobrar(pedidoId, metodo) {
      if (!window.confirm('¿Cobrar el pedido #' + pedidoId + ' con ' + metodo + '?')) return;
      try {
        await api(API_BAR + '/pedidos/' + pedidoId + '/cobrar', {
          method: 'POST',
          body: JSON.stringify({ metodo_pago: metodo }),
        });
        mostrar('Pedido #' + pedidoId + ' cobrado', false);
        verLista();
      } catch (e) {
        mostrar(e.message, true); // aquí aparece el 409 de stock insuficiente
      }
    }

    verLista();
  };
})();
