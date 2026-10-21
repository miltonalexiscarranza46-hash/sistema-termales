async function cargarBar(area) {
  area.innerHTML = `
    <div class="bar">
      <p id="barMensaje" class="mensaje" role="status"></p>

      <div class="resumen">
        <div class="resumen-item"><span>Cobrado hoy</span><strong id="barTotalHoy">$0.00</strong></div>
        <div class="resumen-item"><span>Cuentas cobradas</span><strong id="barCuentasHoy">0</strong></div>
        <div class="resumen-item"><span>Efectivo</span><strong id="barEfectivo">$0.00</strong></div>
        <div class="resumen-item"><span>Tarjeta</span><strong id="barTarjeta">$0.00</strong></div>
        <div class="resumen-item"><span>Transferencia</span><strong id="barTransferencia">$0.00</strong></div>
      </div>

      <form id="barFormAbrir" class="bar-abrir">
        <div class="campo">
          <label for="barArea">Área</label>
          <select id="barArea" class="bar-select" required></select>
        </div>
        <div class="campo">
          <label for="barMesa">Mesa</label>
          <input type="text" id="barMesa" class="bar-input" maxlength="20" required>
        </div>
        <button type="submit" class="bar-btn-cobrar" style="padding: 10px 20px; font-size: 0.9375rem;">Abrir pedido</button>
      </form>

      <div class="bar-tabs">
        <button type="button" class="bar-tab bar-tab-activa" data-estado="abierto">Abiertos</button>
        <button type="button" class="bar-tab" data-estado="cobrado">Cobrados hoy</button>
        <button type="button" class="bar-tab" data-estado="cancelado">Cancelados hoy</button>
      </div>

      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Mesa</th><th>Área</th><th>Artículos</th><th>Total</th><th>Hora</th><th></th>
            </tr>
          </thead>
          <tbody id="barFilas"></tbody>
        </table>
      </div>

      <section id="barDetalle" class="bar-detalle" hidden></section>
    </div>
  `;

  const mensaje = area.querySelector('#barMensaje');
  const selArea = area.querySelector('#barArea');
  const inpMesa = area.querySelector('#barMesa');
  const tbody = area.querySelector('#barFilas');
  const detalle = area.querySelector('#barDetalle');
  const tabs = area.querySelectorAll('.bar-tab');

  let estadoActual = 'abierto';
  let pedidoActual = null;
  let metodos = ['efectivo', 'tarjeta', 'transferencia'];
  let busqueda = '';

  const dinero = (n) => '$' + Number(n).toFixed(2);
  const hora = (f) =>
    f ? new Date(f).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' }) : '—';

  function avisar(texto, esError) {
    mensaje.textContent = texto || '';
    mensaje.classList.toggle('mensaje-error', Boolean(esError));
  }

  function el(etiqueta, clase, texto) {
    const e = document.createElement(etiqueta);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function boton(texto, clase, accion) {
    const b = el('button', clase, texto);
    b.type = 'button';
    b.addEventListener('click', accion);
    return b;
  }

  /* ---------- Datos generales ---------- */

  async function cargarCatalogos() {
    const d = await api('/bar/catalogos');
    if (!d.ok) { avisar(d.mensaje, true); return; }
    metodos = d.metodos_pago;
    selArea.innerHTML = '';
    d.areas.forEach((a) => {
      const op = document.createElement('option');
      op.value = a.id;
      op.textContent = a.nombre;
      selArea.appendChild(op);
    });
  }

  async function cargarResumen() {
    const d = await api('/bar/resumen');
    if (!d.ok) { avisar(d.mensaje, true); return; }
    const por = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    d.por_metodo.forEach((x) => { por[x.metodo_pago] = Number(x.total); });
    area.querySelector('#barTotalHoy').textContent = dinero(d.total);
    area.querySelector('#barCuentasHoy').textContent = d.cuentas;
    area.querySelector('#barEfectivo').textContent = dinero(por.efectivo);
    area.querySelector('#barTarjeta').textContent = dinero(por.tarjeta);
    area.querySelector('#barTransferencia').textContent = dinero(por.transferencia);
  }

  async function cargarLista() {
    const d = await api('/bar/pedidos?estado=' + estadoActual);
    if (!d.ok) { avisar(d.mensaje, true); return; }

    tbody.innerHTML = '';
    if (d.pedidos.length === 0) {
      const tr = el('tr');
      const td = el('td', '', 'No hay pedidos en esta lista.');
      td.colSpan = 6;
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    d.pedidos.forEach((p) => {
      const tr = el('tr');
      if (pedidoActual === p.id) tr.classList.add('bar-fila-activa');
      [p.mesa, p.area, p.articulos, dinero(p.total), hora(p.fecha_pago || p.fecha_hora)]
        .forEach((v) => tr.appendChild(el('td', '', v)));

      const tdAccion = el('td');
      tdAccion.appendChild(
        boton(estadoActual === 'abierto' ? 'Atender' : 'Ver', 'bar-btn-ver', () => abrirDetalle(p.id))
      );
      tr.appendChild(tdAccion);
      tbody.appendChild(tr);
    });
  }

  /* ---------- Detalle de un pedido ---------- */

  async function abrirDetalle(id) {
    const d = await api('/bar/pedidos/' + id);
    if (!d.ok) { avisar(d.mensaje, true); return; }

    pedidoActual = id;
    let productos = [];
    if (d.pedido.estado === 'abierto') {
      const pr = await api('/bar/productos?area_id=' + d.pedido.area_id);
      if (pr.ok) productos = pr.productos;
    }
    pintarDetalle(d.pedido, d.detalle, productos);
    cargarLista();
  }

  function cerrarDetalle() {
    pedidoActual = null;
    busqueda = '';
    detalle.hidden = true;
    detalle.innerHTML = '';
    cargarLista();
  }

  function pintarDetalle(pedido, lineas, productos) {
    const abierto = pedido.estado === 'abierto';
    detalle.hidden = false;
    detalle.innerHTML = '';

    // Encabezado
    const cab = el('div', 'bar-detalle-cab');
    cab.append(
      el('h2', '', 'Mesa ' + pedido.mesa + ' · ' + pedido.area),
      el('span', 'bar-estado bar-estado-' + pedido.estado, pedido.estado),
      boton('Cerrar', 'bar-btn-cerrar', cerrarDetalle)
    );
    detalle.appendChild(cab);

    // Líneas del pedido
    const wrap = el('div', 'tabla-wrap');
    const tabla = el('table', 'tabla');
    tabla.innerHTML =
      '<thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr></thead>';
    const tb = el('tbody');

    if (lineas.length === 0) {
      const tr = el('tr');
      const td = el('td', '', 'Aún no hay productos en este pedido.');
      td.colSpan = 5;
      tr.appendChild(td);
      tb.appendChild(tr);
    }

    lineas.forEach((l) => {
      const tr = el('tr');
      tr.appendChild(el('td', '', l.producto));
      tr.appendChild(el('td', '', dinero(l.precio_unitario)));

      const tdCant = el('td', 'bar-cant');
      if (abierto) {
        tdCant.append(
          boton('−', 'bar-btn-cant', () => cambiar(l.producto_id, l.cantidad - 1)),
          el('span', 'bar-cant-num', l.cantidad),
          boton('+', 'bar-btn-cant', () => agregar(l.producto_id))
        );
      } else {
        tdCant.textContent = l.cantidad;
      }
      tr.appendChild(tdCant);

      tr.appendChild(el('td', '', dinero(l.subtotal)));

      const tdQuitar = el('td');
      if (abierto) {
        tdQuitar.appendChild(boton('Quitar', 'bar-btn-quitar', () => cambiar(l.producto_id, 0)));
      }
      tr.appendChild(tdQuitar);
      tb.appendChild(tr);
    });

    tabla.appendChild(tb);
    wrap.appendChild(tabla);
    detalle.appendChild(wrap);
    detalle.appendChild(el('p', 'bar-total', 'Total: ' + dinero(pedido.total)));

    if (!abierto) {
      const nota =
        pedido.estado === 'cobrado'
          ? 'Cobrado con ' + pedido.metodo_pago + ' a las ' + hora(pedido.fecha_pago) + '.'
          : 'Pedido cancelado: no se cobró ni se descontó inventario.';
      detalle.appendChild(el('p', 'bar-nota', nota));
      return;
    }

    // Agregar productos
    const sec = el('div', 'bar-productos');
    sec.appendChild(el('h3', '', 'Agregar productos'));

    const buscar = el('input', 'bar-input'); // Asegurar clase input
    buscar.type = 'search';
    buscar.placeholder = 'Buscar producto...';
    buscar.value = busqueda;
    buscar.style.marginBottom = '14px';

    const grid = el('div', 'bar-grid');

    function pintarProductos() {
      const q = busqueda.trim().toLowerCase();
      grid.innerHTML = '';
      productos
        .filter((p) => p.nombre.toLowerCase().includes(q))
        .forEach((p) => {
          const b = boton('', 'bar-producto', () => agregar(p.id));
          b.append(
            el('strong', '', p.nombre),
            el('span', '', dinero(p.precio)),
            el('small', '', p.existencias > 0 ? 'Quedan ' + p.existencias : 'Agotado')
          );
          if (p.existencias < 1) b.disabled = true;
          grid.appendChild(b);
        });
      if (!grid.children.length) grid.appendChild(el('p', '', 'No hay productos que coincidan.'));
    }

    buscar.addEventListener('input', () => {
      busqueda = buscar.value;
      pintarProductos();
    });
    pintarProductos();
    sec.append(buscar, grid);
    detalle.appendChild(sec);

    // Cobro y cancelación
    const cobro = el('div', 'bar-cobro');
    const selMetodo = el('select', '', '');
    selMetodo.className = 'bar-select'; // Asegurar clase select
    metodos.forEach((m) => {
      const op = document.createElement('option');
      op.value = m;
      op.textContent = m.charAt(0).toUpperCase() + m.slice(1);
      selMetodo.appendChild(op);
    });

    const btnCobrar = boton('Cobrar ' + dinero(pedido.total), 'bar-btn-cobrar', () =>
      cobrar(btnCobrar, selMetodo.value, pedido.total)
    );
    btnCobrar.disabled = lineas.length === 0;

    cobro.append(
      el('label', '', 'Método de pago'),
      selMetodo,
      btnCobrar,
      boton('Cancelar pedido', 'bar-btn-cancelar', cancelar)
    );
    detalle.appendChild(cobro);
  }

  /* ---------- Acciones ---------- */

  async function agregar(productoId) {
    avisar('');
    const d = await api('/bar/pedidos/' + pedidoActual + '/items', {
      method: 'POST',
      body: JSON.stringify({ producto_id: productoId, cantidad: 1 }),
    });
    if (!d.ok) { avisar(d.mensaje, true); return; }
    abrirDetalle(pedidoActual);
  }

  async function cambiar(productoId, cantidad) {
    avisar('');
    const d = await api('/bar/pedidos/' + pedidoActual + '/items/' + productoId, {
      method: 'PATCH',
      body: JSON.stringify({ cantidad }),
    });
    if (!d.ok) { avisar(d.mensaje, true); return; }
    abrirDetalle(pedidoActual);
  }

  async function cobrar(btn, metodo, total) {
    if (!confirm('¿Cobrar ' + dinero(total) + ' con ' + metodo + '?')) return;
    avisar('');
    btn.disabled = true;

    const d = await api('/bar/pedidos/' + pedidoActual + '/cobrar', {
      method: 'POST',
      body: JSON.stringify({ metodo_pago: metodo }),
    });
    if (!d.ok) {
      avisar(d.mensaje, true);
      btn.disabled = false;
      return;
    }

    avisar('Cuenta cobrada: ' + dinero(d.pedido.total) + ' (' + d.pedido.metodo_pago + ').');
    await abrirDetalle(pedidoActual);
    cargarResumen();
  }

  async function cancelar() {
    if (!confirm('¿Cancelar este pedido? No se cobrará ni se descontará inventario.')) return;
    avisar('');
    const d = await api('/bar/pedidos/' + pedidoActual + '/cancelar', { method: 'POST' });
    if (!d.ok) { avisar(d.mensaje, true); return; }
    avisar('Pedido cancelado.');
    cerrarDetalle();
  }

  /* ---------- Eventos ---------- */

  function marcarTab() {
    tabs.forEach((t) => t.classList.toggle('bar-tab-activa', t.dataset.estado === estadoActual));
  }

  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      estadoActual = t.dataset.estado;
      marcarTab();
      cerrarDetalle();
    })
  );

  area.querySelector('#barFormAbrir').addEventListener('submit', async (e) => {
    e.preventDefault();
    avisar('');

    const d = await api('/bar/pedidos', {
      method: 'POST',
      body: JSON.stringify({ area_id: Number(selArea.value), mesa: inpMesa.value }),
    });
    if (!d.ok) { avisar(d.mensaje, true); return; }

    inpMesa.value = '';
    estadoActual = 'abierto';
    marcarTab();
    await abrirDetalle(d.pedido.id);
    avisar('Pedido abierto en la mesa ' + d.pedido.mesa + '.');
  });

  try {
    await cargarCatalogos();
    await cargarResumen();
    await cargarLista();
  } catch (e) {
    avisar('Error: ' + e.message, true);
  }
}
