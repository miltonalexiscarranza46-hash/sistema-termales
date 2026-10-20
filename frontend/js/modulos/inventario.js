async function cargarInventario(area) {
  let productos = [];
  let esBodega = false;

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function dinero(n) {
    return '$' + Number(n).toFixed(2);
  }

  function aviso(el, texto, ok) {
    el.textContent = texto;
    el.className = 'inv-aviso ' + (ok ? 'inv-ok' : 'inv-error');
  }

  async function pedir(ruta, opciones) {
    try {
      return await api(ruta, opciones);
    } catch (e) {
      return { ok: false, mensaje: 'No se pudo conectar con el servidor' };
    }
  }

  area.innerHTML =
    '<div class="inv">' +
      '<h2>Inventario</h2>' +
      '<div id="invAlerta"></div>' +
      '<div class="inv-barra">' +
        '<label>Área <select id="invFiltro">' +
          '<option value="">Todas</option>' +
          '<option value="restaurante">Restaurante</option>' +
          '<option value="bar">Bar</option>' +
        '</select></label>' +
      '</div>' +
      '<div class="inv-tabla-wrap"><table class="inv-tabla">' +
        '<thead><tr><th>Producto</th><th>Categoría</th><th>Área</th>' +
        '<th>Precio</th><th>Existencias</th><th>Mínimo</th></tr></thead>' +
        '<tbody id="invCuerpo"></tbody>' +
      '</table></div>' +
      '<div id="invOperar"></div>' +
    '</div>';

  const filtro = area.querySelector('#invFiltro');
  const cuerpo = area.querySelector('#invCuerpo');
  const alerta = area.querySelector('#invAlerta');
  const operar = area.querySelector('#invOperar');

  function pintarLista() {
    const f = filtro.value;
    const lista = productos.filter(function (p) { return !f || p.area === f; });

    cuerpo.innerHTML = lista.length
      ? lista.map(function (p) {
          return '<tr class="' + (p.bajo_stock ? 'inv-bajo' : '') + '">' +
            '<td>' + esc(p.nombre) + '</td>' +
            '<td>' + esc(p.categoria) + '</td>' +
            '<td>' + esc(p.area) + '</td>' +
            '<td>' + dinero(p.precio) + '</td>' +
            '<td><strong>' + p.existencias + '</strong>' +
              (p.bajo_stock ? ' <span class="inv-etiqueta">Stock bajo</span>' : '') + '</td>' +
            '<td>' + p.stock_minimo + '</td>' +
          '</tr>';
        }).join('')
      : '<tr><td colspan="6">No hay productos para mostrar.</td></tr>';

    const bajos = productos.filter(function (p) { return p.bajo_stock; });
    alerta.innerHTML = bajos.length
      ? '<div class="inv-alerta">Stock bajo en ' + bajos.length + ' producto(s): ' +
        bajos.map(function (p) { return esc(p.nombre) + ' (' + p.existencias + ')'; }).join(', ') +
        '</div>'
      : '';
  }

  async function cargarProductos() {
    const d = await pedir('/inventario/productos');
    if (!d.ok) {
      cuerpo.innerHTML = '<tr><td colspan="6">' + esc(d.mensaje || 'Error al cargar') + '</td></tr>';
      return;
    }
    productos = d.productos;
    pintarLista();
    llenarSelectProductos();
  }

  filtro.addEventListener('change', pintarLista);

  // ---------- Solo bodega ----------
  let selProducto = null;

  function llenarSelectProductos() {
    if (!selProducto) return;
    const actual = selProducto.value;
    selProducto.innerHTML = productos.map(function (p) {
      return '<option value="' + p.id + '">' + esc(p.nombre) + ' (' + p.existencias + ')</option>';
    }).join('');
    if (actual) selProducto.value = actual;
  }

  async function cargarHistorial() {
    const cont = area.querySelector('#invHistorial');
    if (!cont) return;
    const d = await pedir('/inventario/movimientos');
    if (!d.ok) { cont.innerHTML = '<tr><td colspan="5">' + esc(d.mensaje || 'Error') + '</td></tr>'; return; }
    cont.innerHTML = d.movimientos.length
      ? d.movimientos.map(function (m) {
          const f = new Date(m.fecha_hora).toLocaleString('es-SV');
          return '<tr><td>' + esc(f) + '</td><td>' + esc(m.producto) + '</td>' +
            '<td class="' + (m.tipo === 'entrada' ? 'inv-entrada' : 'inv-salida') + '">' +
            (m.tipo === 'entrada' ? '+' : '-') + m.cantidad + '</td>' +
            '<td>' + esc(m.motivo) + '</td><td>' + esc(m.registrado_por) + '</td></tr>';
        }).join('')
      : '<tr><td colspan="5">Aún no hay movimientos.</td></tr>';
  }

  async function prepararBodega() {
    const cat = await pedir('/inventario/catalogos');
    if (!cat.ok) return; // el mesero solo consulta
    esBodega = true;

    operar.innerHTML =
      '<div class="inv-bloques">' +
        '<form id="invFormMov" class="inv-caja">' +
          '<h3>Registrar movimiento</h3>' +
          '<label>Producto <select id="invProducto"></select></label>' +
          '<label>Tipo <select id="invTipo">' +
            '<option value="entrada">Entrada (llega producto)</option>' +
            '<option value="salida">Salida (merma, consumo)</option>' +
          '</select></label>' +
          '<label>Cantidad <input id="invCantidad" type="number" min="1" step="1" required></label>' +
          '<label>Motivo <input id="invMotivo" maxlength="100" placeholder="Ej: Compra a proveedor" required></label>' +
          '<button type="submit">Registrar</button>' +
          '<p id="invAvisoMov" class="inv-aviso"></p>' +
        '</form>' +

        '<form id="invFormProd" class="inv-caja">' +
          '<h3>Producto nuevo</h3>' +
          '<label>Nombre <input id="invNombre" maxlength="100" required></label>' +
          '<label>Categoría <select id="invCategoria"></select></label>' +
          '<label>Área <select id="invArea"></select></label>' +
          '<label>Precio <input id="invPrecio" type="number" min="0" step="0.01" required></label>' +
          '<label>Existencia inicial <input id="invInicial" type="number" min="0" step="1" value="0"></label>' +
          '<label>Stock mínimo <input id="invMinimo" type="number" min="0" step="1" value="5"></label>' +
          '<button type="submit">Crear producto</button>' +
          '<p id="invAvisoProd" class="inv-aviso"></p>' +
        '</form>' +
      '</div>' +

      '<h3>Últimos movimientos</h3>' +
      '<div class="inv-tabla-wrap"><table class="inv-tabla">' +
        '<thead><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Motivo</th><th>Registró</th></tr></thead>' +
        '<tbody id="invHistorial"></tbody>' +
      '</table></div>';

    selProducto = operar.querySelector('#invProducto');
    operar.querySelector('#invCategoria').innerHTML = cat.categorias.map(function (c) {
      return '<option value="' + c.id + '">' + esc(c.nombre) + '</option>';
    }).join('');
    operar.querySelector('#invArea').innerHTML = cat.areas.map(function (a) {
      return '<option value="' + a.id + '">' + esc(a.nombre) + '</option>';
    }).join('');
    llenarSelectProductos();

    operar.querySelector('#invFormMov').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      const msg = operar.querySelector('#invAvisoMov');
      const boton = ev.target.querySelector('button');
      boton.disabled = true;
      const d = await pedir('/inventario/movimientos', {
        method: 'POST',
        body: JSON.stringify({
          producto_id: Number(selProducto.value),
          tipo: operar.querySelector('#invTipo').value,
          cantidad: Number(operar.querySelector('#invCantidad').value),
          motivo: operar.querySelector('#invMotivo').value,
        }),
      });
      boton.disabled = false;
      if (d.ok) {
        aviso(msg, 'Movimiento registrado. Existencias ahora: ' + d.existencias, true);
        operar.querySelector('#invCantidad').value = '';
        operar.querySelector('#invMotivo').value = '';
        await cargarProductos();
        await cargarHistorial();
      } else {
        aviso(msg, d.mensaje || 'No se pudo registrar', false);
      }
    });

    operar.querySelector('#invFormProd').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      const msg = operar.querySelector('#invAvisoProd');
      const boton = ev.target.querySelector('button');
      boton.disabled = true;
      const d = await pedir('/inventario/productos', {
        method: 'POST',
        body: JSON.stringify({
          nombre: operar.querySelector('#invNombre').value,
          categoria_id: Number(operar.querySelector('#invCategoria').value),
          area_id: Number(operar.querySelector('#invArea').value),
          precio: Number(operar.querySelector('#invPrecio').value),
          existencias: Number(operar.querySelector('#invInicial').value),
          stock_minimo: Number(operar.querySelector('#invMinimo').value),
        }),
      });
      boton.disabled = false;
      if (d.ok) {
        aviso(msg, 'Producto creado: ' + d.producto.nombre, true);
        ev.target.reset();
        await cargarProductos();
        await cargarHistorial();
      } else {
        aviso(msg, d.mensaje || 'No se pudo crear', false);
      }
    });

    await cargarHistorial();
  }

  await cargarProductos();
  await prepararBodega();
}