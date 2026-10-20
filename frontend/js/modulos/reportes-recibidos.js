async function cargarReportesRecibidos(area) {
  area.innerHTML = `
    <div class="reporte">
      <div class="reporte-filtros">
        <div class="campo">
          <label for="repFecha">Día</label>
          <input type="date" id="repFecha">
        </div>
        <div class="campo">
          <label for="repRol">Rol</label>
          <select id="repRol">
            <option value="">Todos</option>
            <option value="recepcionista">Recepcionista</option>
            <option value="masajista">Masajista</option>
            <option value="mesero">Mesero</option>
            <option value="bodega">Bodega</option>
            <option value="cajero">Cajero</option>
          </select>
        </div>
        <div class="campo">
          <label for="repEstado">Estado</label>
          <select id="repEstado">
            <option value="">Todos</option>
            <option value="sin_leer">Sin leer</option>
            <option value="leidos">Leídos</option>
          </select>
        </div>
      </div>

      <p id="mensajeRep" class="mensaje" role="status"></p>

      <div class="resumen">
        <div class="resumen-item">
          <span>Reportes recibidos</span>
          <strong id="repTotal">0</strong>
        </div>
        <div class="resumen-item">
          <span>Sin leer</span>
          <strong id="repSinLeer">0</strong>
        </div>
        <div class="resumen-item resumen-gasto" id="repTarjetaFaltan">
          <span>Faltan por enviar</span>
          <strong id="repFaltan">0</strong>
        </div>
      </div>

      <div id="repDetalle" class="reporte-detalle" hidden></div>

      <h3 class="reporte-titulo">Reportes del día</h3>
      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Rol</th>
              <th>Hora</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="filasReportes"></tbody>
        </table>
      </div>

      <h3 class="reporte-titulo" id="repTituloFaltan">Faltan por enviar</h3>
      <div class="reporte-faltan" id="repFaltanLista"></div>
    </div>
  `;

  const q = (s) => area.querySelector(s);
  const fecha = q('#repFecha');
  const rol = q('#repRol');
  const estado = q('#repEstado');
  const mensaje = q('#mensajeRep');
  const detalle = q('#repDetalle');

  const hoyLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  const etiqueta = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  const hora = (iso) =>
    new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  const el = (tag, clase, texto) => {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  };

  async function cargar() {
    const params = new URLSearchParams();
    params.set('fecha', fecha.value);
    if (rol.value) params.set('rol', rol.value);
    if (estado.value) params.set('estado', estado.value);

    const d = await api('/reportes?' + params.toString());
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    mensaje.textContent = '';

    q('#repTotal').textContent = d.reportes.length;
    q('#repSinLeer').textContent = d.reportes.filter((x) => !x.leido).length;

    // Tabla de reportes
    const tbody = q('#filasReportes');
    tbody.innerHTML = '';

    if (d.reportes.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No hay reportes con esos filtros.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    d.reportes.forEach((x) => {
      const tr = document.createElement('tr');
      [x.empleado, etiqueta(x.rol), hora(x.actualizado_en)].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });

      const tdEstado = document.createElement('td');
      tdEstado.appendChild(
        el('span', 'reporte-badge ' + (x.leido ? 'leido' : 'sin-leer'), x.leido ? 'Leído' : 'Sin leer')
      );
      tr.appendChild(tdEstado);

      const tdAcc = document.createElement('td');
      const btn = el('button', 'btn-secundario', 'Ver');
      btn.type = 'button';
      btn.addEventListener('click', () => ver(x.id));
      tdAcc.appendChild(btn);
      tr.appendChild(tdAcc);

      tbody.appendChild(tr);
    });

    // Quiénes faltan (solo cuando no se filtra por estado)
    const mostrarFaltan = !estado.value;
    q('#repTarjetaFaltan').hidden = !mostrarFaltan;
    q('#repTituloFaltan').hidden = !mostrarFaltan;
    q('#repFaltanLista').hidden = !mostrarFaltan;
    q('#repFaltan').textContent = d.faltan.length;

    const lista = q('#repFaltanLista');
    lista.innerHTML = '';
    if (d.faltan.length === 0) {
      lista.appendChild(el('p', 'reporte-nota', 'Todos enviaron su reporte.'));
    }
    d.faltan.forEach((f) => {
      lista.appendChild(el('span', 'reporte-chip', f.empleado + ' · ' + etiqueta(f.rol)));
    });
  }

  async function ver(id) {
    const d = await api('/reportes/' + id);
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    const r = d.reporte;

    detalle.innerHTML = '';
    detalle.appendChild(el('h3', '', r.empleado + ' · ' + etiqueta(r.rol)));

    const fechaTxt = new Date(r.fecha + 'T00:00:00').toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    detalle.appendChild(
      el('p', 'reporte-meta', fechaTxt + ' · enviado a las ' + hora(r.actualizado_en))
    );

    // Resumen automático
    const items = (r.resumen && r.resumen.items) || [];
    if (items.length > 0) {
      const wrap = el('div', 'tabla-wrap');
      const tabla = el('table', 'tabla');
      const thead = document.createElement('thead');
      const trh = document.createElement('tr');
      ['Dato', 'Valor'].forEach((t) => trh.appendChild(el('th', '', t)));
      thead.appendChild(trh);
      tabla.appendChild(thead);
      const tb = document.createElement('tbody');
      items.forEach((x) => {
        const tr = document.createElement('tr');
        tr.appendChild(el('td', '', x.etiqueta));
        tr.appendChild(el('td', '', x.valor));
        tb.appendChild(tr);
      });
      tabla.appendChild(tb);
      wrap.appendChild(tabla);
      detalle.appendChild(wrap);
    } else {
      detalle.appendChild(el('p', 'reporte-meta', 'Este reporte no incluye resumen automático.'));
    }

    detalle.appendChild(el('h4', 'reporte-subtitulo', 'Observaciones'));
    detalle.appendChild(el('p', 'reporte-obs', r.observaciones || 'Sin observaciones.'));

    detalle.appendChild(
      el(
        'p',
        'reporte-meta',
        r.leido
          ? 'Leído por ' + r.leido_por + ' a las ' + hora(r.leido_en)
          : 'Todavía sin leer.'
      )
    );

    const botones = el('div', 'reporte-detalle-botones');
    if (!r.leido) {
      const marcar = el('button', '', 'Marcar como leído');
      marcar.type = 'button';
      marcar.addEventListener('click', async () => {
        const m = await api('/reportes/' + r.id + '/leido', { method: 'PATCH' });
        if (!m.ok) {
          mensaje.textContent = m.mensaje;
          return;
        }
        await ver(r.id);
        await cargar();
      });
      botones.appendChild(marcar);
    }
    const cerrar = el('button', 'btn-secundario', 'Cerrar');
    cerrar.type = 'button';
    cerrar.addEventListener('click', () => {
      detalle.hidden = true;
    });
    botones.appendChild(cerrar);
    detalle.appendChild(botones);

    detalle.hidden = false;
    detalle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  [fecha, rol, estado].forEach((c) =>
    c.addEventListener('change', () => {
      detalle.hidden = true;
      cargar();
    })
  );

  // Estado inicial
  fecha.value = hoyLocal();
  fecha.max = hoyLocal();
  await cargar();
}