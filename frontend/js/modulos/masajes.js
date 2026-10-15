async function cargarMasajes(area) {
  area.innerHTML = `
    <div class="masajes">
      <form id="formCita" class="masajes-form">
        <div class="campo">
          <label for="servicioCita">Servicio</label>
          <select id="servicioCita" required></select>
        </div>

        <div class="campo">
          <label for="inicioCita">Fecha y hora</label>
          <input type="datetime-local" id="inicioCita" required>
        </div>

        <div class="campo">
          <label for="masajistaCita">Masajista libre</label>
          <select id="masajistaCita" required></select>
        </div>

        <div class="campo">
          <label for="nombreCita">Cliente</label>
          <input type="text" id="nombreCita" maxlength="100" placeholder="Nombre del cliente" required>
        </div>

        <div class="campo">
          <label for="telefonoCita">Teléfono (opcional)</label>
          <input type="text" id="telefonoCita" maxlength="20" placeholder="7000-0000">
        </div>

        <div class="campo total-previo">
          <span id="detalleServicio">Total a cobrar</span>
          <strong id="totalCita">$0.00</strong>
        </div>

        <button type="submit" id="btnAgendar">Agendar cita</button>
        <p id="mensajeMasajes" class="mensaje" role="status"></p>
      </form>

      <div class="resumen">
        <div class="resumen-item">
          <span>Total cobrado del día</span>
          <strong id="totalDia">$0.00</strong>
        </div>
        <div class="resumen-item">
          <span>Citas pendientes</span>
          <strong id="pendientesDia">0</strong>
        </div>
        <div class="resumen-item">
          <span>Ver agenda del día</span>
          <input type="date" id="fechaAgenda">
        </div>
      </div>

      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Servicio</th>
              <th>Masajista</th>
              <th>Precio</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="filasCitas"></tbody>
        </table>
      </div>
    </div>
  `;

  const selServicio = area.querySelector('#servicioCita');
  const inicio = area.querySelector('#inicioCita');
  const selMasajista = area.querySelector('#masajistaCita');
  const nombre = area.querySelector('#nombreCita');
  const telefono = area.querySelector('#telefonoCita');
  const totalCita = area.querySelector('#totalCita');
  const detalle = area.querySelector('#detalleServicio');
  const btnAgendar = area.querySelector('#btnAgendar');
  const mensaje = area.querySelector('#mensajeMasajes');
  const fechaAgenda = area.querySelector('#fechaAgenda');
  const tbody = area.querySelector('#filasCitas');

  const dinero = (n) => '$' + Number(n).toFixed(2);

  // Fecha y hora local en el formato que usa el campo datetime-local
  const ahoraLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  let servicios = [];
  let ultimaBusqueda = 0;

  function actualizarTotal() {
    const s = servicios.find((x) => x.id === Number(selServicio.value));
    totalCita.textContent = s ? dinero(s.precio) : '$0.00';
    detalle.textContent = s ? 'Total a cobrar · ' + s.duracion_min + ' min' : 'Total a cobrar';
  }

  async function cargarServicios() {
    const d = await api('/masajes/servicios');
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    servicios = d.servicios.map((s) => ({ ...s, precio: Number(s.precio) }));
    selServicio.innerHTML = '';
    servicios.forEach((s) => {
      const op = document.createElement('option');
      op.value = s.id;
      op.textContent = s.nombre + ' · ' + s.duracion_min + ' min · ' + dinero(s.precio);
      selServicio.appendChild(op);
    });
    actualizarTotal();
  }

  // Muestra solo los masajistas libres a esa hora para ese servicio
  async function buscarLibres() {
    const turno = ++ultimaBusqueda;
    selMasajista.innerHTML = '';
    btnAgendar.disabled = true;
    if (!selServicio.value || !inicio.value) return;

    const d = await api(
      '/masajes/disponibles?inicio=' + encodeURIComponent(inicio.value) +
      '&servicio_id=' + selServicio.value
    );
    if (turno !== ultimaBusqueda) return; // llegó una respuesta vieja

    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    if (d.masajistas.length === 0) {
      const op = document.createElement('option');
      op.value = '';
      op.textContent = 'Nadie libre a esa hora';
      selMasajista.appendChild(op);
      return;
    }

    d.masajistas.forEach((m) => {
      const op = document.createElement('option');
      op.value = m.id;
      op.textContent = m.nombre;
      selMasajista.appendChild(op);
    });
    btnAgendar.disabled = false;
  }

  async function cargarAgenda() {
    const d = await api('/masajes/citas?fecha=' + fechaAgenda.value);
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    area.querySelector('#totalDia').textContent = dinero(d.total_cobrado);
    area.querySelector('#pendientesDia').textContent = d.pendientes;

    tbody.innerHTML = '';

    if (d.citas.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8;
      td.textContent = 'No hay citas para este día.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    d.citas.forEach((c) => {
      const tr = document.createElement('tr');
      if (c.estado === 'cancelada') tr.classList.add('fila-cancelada');

      const celdas = [
        c.hora_inicio + ' – ' + c.hora_fin,
        c.cliente,
        c.telefono || '—',
        c.servicio,
        c.masajista,
        dinero(c.precio),
      ];
      celdas.forEach((valor) => {
        const td = document.createElement('td');
        td.textContent = valor;
        tr.appendChild(td);
      });

      const tdEstado = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'estado estado-' + c.estado;
      badge.textContent = c.estado;
      tdEstado.appendChild(badge);
      tr.appendChild(tdEstado);

      const tdAcc = document.createElement('td');
      if (c.estado === 'agendada') {
        const caja = document.createElement('div');
        caja.className = 'acciones';

        const bCobrar = document.createElement('button');
        bCobrar.type = 'button';
        bCobrar.className = 'btn-cobrar';
        bCobrar.textContent = 'Cobrar';
        bCobrar.addEventListener('click', () => cobrar(c));

        const bCancelar = document.createElement('button');
        bCancelar.type = 'button';
        bCancelar.className = 'btn-cancelar';
        bCancelar.textContent = 'Cancelar';
        bCancelar.addEventListener('click', () => cancelar(c));

        caja.appendChild(bCobrar);
        caja.appendChild(bCancelar);
        tdAcc.appendChild(caja);
      }
      tr.appendChild(tdAcc);

      tbody.appendChild(tr);
    });
  }

  async function cobrar(c) {
    if (!confirm('¿Cobrar ' + dinero(c.precio) + ' a ' + c.cliente + '?')) return;
    mensaje.textContent = '';
    const d = await api('/masajes/citas/' + c.id + '/cobrar', { method: 'PATCH' });
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    mensaje.textContent = 'Cobrado: ' + dinero(d.cobrado);
    cargarAgenda();
  }

  async function cancelar(c) {
    const texto = '¿Cancelar la cita de ' + c.cliente + ' (' + c.hora_inicio + ')?';
    if (!confirm(texto)) return;
    mensaje.textContent = '';
    const d = await api('/masajes/citas/' + c.id + '/cancelar', { method: 'PATCH' });
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    mensaje.textContent = 'Cita cancelada. El horario quedó libre.';
    cargarAgenda();
    buscarLibres();
  }

  selServicio.addEventListener('change', () => {
    actualizarTotal();
    buscarLibres();
  });
  inicio.addEventListener('change', buscarLibres);
  fechaAgenda.addEventListener('change', cargarAgenda);

  area.querySelector('#formCita').addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const d = await api('/masajes/citas', {
      method: 'POST',
      body: JSON.stringify({
        nombre: nombre.value,
        telefono: telefono.value,
        servicio_id: Number(selServicio.value),
        masajista_id: Number(selMasajista.value),
        inicio: inicio.value,
      }),
    });

    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      buscarLibres();
      return;
    }

    mensaje.textContent = 'Cita agendada: ' + d.cita.inicio + ' · ' + dinero(d.cita.precio);
    nombre.value = '';
    telefono.value = '';
    fechaAgenda.value = inicio.value.slice(0, 10); // mostrar el día de la cita
    await buscarLibres();
    await cargarAgenda();
  });

  // Estado inicial
  inicio.value = ahoraLocal();
  inicio.min = ahoraLocal();
  fechaAgenda.value = ahoraLocal().slice(0, 10);

  await cargarServicios();
  await buscarLibres();
  await cargarAgenda();
}