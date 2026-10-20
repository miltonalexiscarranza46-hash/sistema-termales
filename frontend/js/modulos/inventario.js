// frontend/js/modulos/inventario.js
// Expone cargarInventario(area). Todo va dentro de una función para no chocar con otros módulos.
(function () {
  const API = '/api/inventario';

  // AJUSTAR: cómo guarda tu login el token (copiar de gastos.js)
  const token = () => localStorage.getItem('token');

  // Solo para mostrar/ocultar el formulario. La seguridad real la hace el servidor.
  function rolActual() {
    try { return JSON.parse(atob(token().split('.')[1])).rol; } catch (e) { return null; }
  }

  async function api(ruta, opciones = {}) {
    const resp = await fetch(API + ruta, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
    });
    const datos = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(datos.mensaje || 'Error ' + resp.status);
    return datos;
  }

  // Crea elementos sin innerHTML (evita inyección de HTML)
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

  window.cargarInventario = function (area) {
    const puedeEscribir = rolActual() !== 'mesero';
    let productos = [];

    area.replaceChildren();
    area.classList.add('inv-modulo');

    const msg = h('p', { class: 'inv-msg' });
    const cont = h('div', { class: 'inv-tabla' });
    const selProd = h('select', { required: '' });

    function mostrar(texto, esError) {
      msg.textContent = texto;
      msg.className = 'inv-msg ' + (esError ? 'inv-error' : 'inv-ok');
    }

    function pintarTabla() {
      const filas = productos.map((p) =>
        h('tr', { class: p.stock_bajo ? 'inv-bajo' : '' },
          h('td', {}, p.nombre),
          h('td', {}, Number(p.precio).toFixed(2)),
          h('td', {}, String(p.stock)),
          h('td', {}, String(p.stock_minimo)),
          h('td', {}, p.stock_bajo ? h('span', { class: 'inv-badge' }, 'Stock bajo') : '')
        )
      );
      cont.replaceChildren(
        h('table', { class: 'inv-table' },
          h('thead', {}, h('tr', {},
            ['Producto', 'Precio', 'Stock', 'Mínimo', 'Alerta'].map((t) => h('th', {}, t)))),
          h('tbody', {}, filas.length ? filas : h('tr', {}, h('td', { colspan: '5' }, 'No hay productos.')))
        )
      );
    }

    function llenarSelect() {
      selProd.replaceChildren(
        ...productos.map((p) => h('option', { value: String(p.id) }, `${p.nombre} (stock ${p.stock})`))
      );
    }

    async function refrescar() {
      try {
        productos = await api('/productos');
        pintarTabla();
        llenarSelect();
      } catch (e) {
        mostrar(e.message, true);
      }
    }

    area.append(h('h2', {}, 'Inventario'), msg, cont);

    if (puedeEscribir) {
      // ── Formulario de movimiento ──
      const selTipo = h('select', {},
        h('option', { value: 'entrada' }, 'Entrada'),
        h('option', { value: 'salida' }, 'Salida'),
        h('option', { value: 'ajuste' }, 'Ajuste (stock contado)'));
      const inCant = h('input', { type: 'number', min: '0', step: '1', required: '', placeholder: 'Cantidad' });
      const inMotivo = h('input', { type: 'text', placeholder: 'Motivo (obligatorio en salida y ajuste)' });

      const formMov = h('form', { class: 'inv-form' },
        h('h3', {}, 'Registrar movimiento'),
        selProd, selTipo, inCant, inMotivo,
        h('button', { type: 'submit' }, 'Guardar movimiento'));

      formMov.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        try {
          await api('/movimientos', {
            method: 'POST',
            body: JSON.stringify({
              producto_id: Number(selProd.value),
              tipo: selTipo.value,
              cantidad: Number(inCant.value),
              motivo: inMotivo.value,
            }),
          });
          mostrar('Movimiento registrado', false);
          formMov.reset();
          refrescar();
        } catch (e) {
          mostrar(e.message, true);
        }
      });

      // ── Formulario de producto nuevo ──
      const inNombre = h('input', { type: 'text', required: '', placeholder: 'Nombre' });
      const inPrecio = h('input', { type: 'number', min: '0', step: '0.01', required: '', placeholder: 'Precio' });
      const inMin = h('input', { type: 'number', min: '0', step: '1', value: '0', placeholder: 'Stock mínimo' });
      const inIni = h('input', { type: 'number', min: '0', step: '1', value: '0', placeholder: 'Stock inicial' });

      const formProd = h('form', { class: 'inv-form' },
        h('h3', {}, 'Nuevo producto'),
        inNombre, inPrecio, inMin, inIni,
        h('button', { type: 'submit' }, 'Crear producto'));

      formProd.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        try {
          await api('/productos', {
            method: 'POST',
            body: JSON.stringify({
              nombre: inNombre.value,
              precio: Number(inPrecio.value),
              stock_minimo: Number(inMin.value),
              stock_inicial: Number(inIni.value),
            }),
          });
          mostrar('Producto creado', false);
          formProd.reset();
          refrescar();
        } catch (e) {
          mostrar(e.message, true);
        }
      });

      area.append(formMov, formProd);
    }

    refrescar();
  };
})();
