async function cargarReservas(area) {
  area.innerHTML = `
    <div class="reservas">

      <form id="formReserva" class="reservas-form">
        <div class="campo">
          <label for="resNombre">Nombre del cliente</label>
          <input type="text" id="resNombre" required>
        </div>

        <div class="campo">
          <label for="resTelefono">Teléfono</label>
          <input type="tel" id="resTelefono">
        </div>

        <div class="campo">
          <label for="resEntrada">Fecha de entrada</label>
          <input type="date" id="resEntrada" required>
        </div>

        <div class="campo">
          <label for="resSalida">Fecha de salida</label>
          <input type="date" id="resSalida" required>
        </div>

        <div class="campo">
          <label for="resCabana">Cabaña disponible</label>
          <select id="resCabana" required disabled></select>
        </div>

        <div class="campo">
          <label for="resAnticipo">Anticipo ($)</label>
          <input type="number" id="resAnticipo" min="0" step="0.01" value="0">
        </div>

        <div class="campo total-previo">
          <span id="resDetalle">Total de la reserva</span>
          <strong id="resTotal">$0.00</strong>
          <small id="resSaldo">Saldo: $0.00</small>
        </div>

        <button type="submit">Crear reserva</button>
        <p id="mensajeReservas" class="mensaje" role="status"></p>
      </form>

      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Cabaña</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Total</th>
              <th>Anticipo</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="filasReservas"></tbody>
        </table>
      </div>
    </div>
  `;

  const form = area.querySelector('#formReserva');
  const nombre = area.querySelector('#resNombre');
  const telefono = area.querySelector('#resTelefono');
  const entrada = area.querySelector('#resEntrada');
  const salida = area.querySelector('#resSalida');
  const select = area.querySelector('#resCabana');
  const anticipo = area.querySelector('#resAnticipo');
  const detalle = area.querySelector('#resDetalle');
  const totalEl = area.querySelector('#resTotal');
  const saldoEl = area.querySelector('#resSaldo');
  const mensaje = area.querySelector('#mensajeReservas');
  const tbody = area.querySelector('#filasReservas');

  let cabanas = [];
  const dinero = (n) => '$' + Number(n).toFixed(2);

  function hoy() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dia;
  }

  entrada.min = hoy();
  salida.min = hoy();

  function noches() {
    if (!entrada.value || !salida.value) return 0;
    const n = (Date.parse(salida.value) - Date.parse(entrada.value)) / 86400000;
    return n > 0 ? n : 0;
  }

  function actualizarTotal() {
    const c = cabanas.find((x) => x.id === Number(select.value));
    const n = noches();
    const total = c && n > 0 ? c.precio_noche * n : 0;
    const adelanto = Number(anticipo.value) || 0;

    detalle.textContent =
      n > 0 ? 'Total · ' + n + (n === 1 ? ' noche' : ' noches') : 'Total de la reserva';
    totalEl.textContent = dinero(total);
    saldoEl.textContent = 'Saldo: ' + dinero(Math.max(total - adelanto, 0));
  }

  function textoSelect(texto) {
    select.innerHTML = '';
    const op = document.createElement('option');
    op.value = '';
    op.textContent = texto;
    select.appendChild(op);
    select.disabled = true;
  }

  async function buscarDisponibles() {
    cabanas = [];

    if (!entrada.value || !salida.value) {
      textoSelect('Elige las fechas primero');
      actualizarTotal();
      return;
    }
    if (salida.value <= entrada.value) {
      textoSelect('La salida debe ser después de la entrada');
      actualizarTotal();
      return;
    }

    const d = await api(
      '/reservas/disponibles?entrada=' + entrada.value + '&salida=' + salida.value
    );
    if (!d.ok) {
      textoSelect('Error al consultar');
      mensaje.textContent = d.mensaje;
      return;
    }

    cabanas = d.cabanas.map((c) => ({ ...c, precio_noche: Number(c.precio_noche) }));

    if (cabanas.length === 0) {
      textoSelect('No hay cabañas libres en esas fechas');
      actualizarTotal();
      return;
    }

    select.innerHTML = '';
    cabanas.forEach((c) => {
      const op = document.createElement('option');
      op.value = c.id;
      op.textContent =
        c.nombre + ' · ' + c.capacidad + ' personas · ' + dinero(c.precio_noche) + '/noche';
      select.appendChild(op);
    });
    select.disabled = false;
    actualizarTotal();
  }

  async function cargarLista() {
    const d = await api('/reservas');
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    tbody.innerHTML = '';

    if (d.reservas.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 10;
      td.textContent = 'No hay reservas próximas.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    d.reservas.forEach((r) => {
      const tr = document.createElement('tr');
      if (r.estado === 'cancelada') tr.classList.add('fila-cancelada');

      const celdas = [
        r.cliente,
        r.telefono || '—',
        r.cabana,
        r.fecha_entrada,
        r.fecha_salida,
        dinero(r.total),
        dinero(r.anticipo),
        dinero(r.saldo),
      ];
      celdas.forEach((valor) => {
        const td = document.createElement('td');
        td.textContent = valor;
        tr.appendChild(td);
      });

      const tdEstado = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'estado estado-' + r.estado;
      badge.textContent = r.estado;
      tdEstado.appendChild(badge);
      tr.appendChild(tdEstado);

      const tdAccion = document.createElement('td');
      if (r.estado !== 'cancelada') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-cancelar';
        btn.textContent = 'Cancelar';
        btn.addEventListener('click', () => cancelar(r));
        tdAccion.appendChild(btn);
      }
      tr.appendChild(tdAccion);

      tbody.appendChild(tr);
    });
  }

  async function cancelar(r) {
    const texto =
      '¿Cancelar la reserva de ' + r.cliente + ' en ' + r.cabana +
      ' (' + r.fecha_entrada + ' al ' + r.fecha_salida + ')?';
    if (!confirm(texto)) return;

    mensaje.textContent = '';
    const d = await api('/reservas/' + r.id + '/cancelar', { method: 'PATCH' });

    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    mensaje.textContent = 'Reserva cancelada. Las fechas quedaron libres.';
    buscarDisponibles();
    cargarLista();
  }

  entrada.addEventListener('change', () => {
    if (entrada.value) salida.min = entrada.value;
    buscarDisponibles();
  });
  salida.addEventListener('change', buscarDisponibles);
  select.addEventListener('change', actualizarTotal);
  anticipo.addEventListener('input', actualizarTotal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const d = await api('/reservas', {
      method: 'POST',
      body: JSON.stringify({
        nombre: nombre.value,
        telefono: telefono.value,
        cabana_id: Number(select.value),
        fecha_entrada: entrada.value,
        fecha_salida: salida.value,
        anticipo: Number(anticipo.value) || 0,
      }),
    });

    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    const r = d.reserva;
    mensaje.textContent =
      'Reserva creada: ' + r.noches + (r.noches === 1 ? ' noche' : ' noches') +
      ', total ' + dinero(r.total) + ', estado ' + r.estado + '.';

    form.reset();
    entrada.min = hoy();
    salida.min = hoy();
    await buscarDisponibles();
    cargarLista();
  });

  textoSelect('Elige las fechas primero');
  actualizarTotal();
  await cargarLista();
}