async function cargarAccesos(area) {
  area.innerHTML = `
    <div class="accesos">
      <form id="formAcceso" class="accesos-form">
        <div class="campo">
          <label for="tipoAcceso">Tipo de entrada</label>
          <select id="tipoAcceso" required></select>
        </div>

        <div class="campo">
          <label for="cantidadAcceso">Cantidad de personas</label>
          <input type="number" id="cantidadAcceso" min="1" value="1" required>
        </div>

        <div class="campo total-previo">
          <span>Total a cobrar</span>
          <strong id="totalPrevio">$0.00</strong>
        </div>

        <button type="submit">Registrar entrada</button>
        <p id="mensajeAcceso" class="mensaje" role="status"></p>
      </form>

      <div class="resumen">
        <div class="resumen-item">
          <span>Total cobrado hoy</span>
          <strong id="totalHoy">$0.00</strong>
        </div>
        <div class="resumen-item">
          <span>Personas hoy</span>
          <strong id="personasHoy">0</strong>
        </div>

      </div>

      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Monto</th>
              <th>Cobró</th>
            </tr>
          </thead>
          <tbody id="filasAccesos"></tbody>
        </table>
      </div>
    </div>
  `;

  const select = area.querySelector('#tipoAcceso');
  const cantidad = area.querySelector('#cantidadAcceso');
  const totalPrevio = area.querySelector('#totalPrevio');
  const mensaje = area.querySelector('#mensajeAcceso');
  let tipos = [];

  const dinero = (n) => '$' + Number(n).toFixed(2);

  function actualizarTotal() {
    const t = tipos.find((x) => x.id === Number(select.value));
    const c = Number(cantidad.value);
    totalPrevio.textContent = t && c > 0 ? dinero(t.precio * c) : '$0.00';
  }


  async function cargarTipos() {
    const d = await api('/accesos/tipos');
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    tipos = d.tipos.map((t) => ({ ...t, precio: Number(t.precio) }));
    select.innerHTML = '';
    tipos.forEach((t) => {
      const op = document.createElement('option');
      op.value = t.id;
      op.textContent = t.nombre + ' · ' + dinero(t.precio);
      select.appendChild(op);
    });
    actualizarTotal();
  }

  async function cargarHoy() {
    const d = await api('/accesos/hoy');
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    area.querySelector('#totalHoy').textContent = dinero(d.total);
    area.querySelector('#personasHoy').textContent = d.personas;

    const tbody = area.querySelector('#filasAccesos');
    tbody.innerHTML = '';

    if (d.accesos.length === 0) {

      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'Aún no hay entradas registradas hoy.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    d.accesos.forEach((a) => {
      const hora = new Date(a.fecha_hora).toLocaleTimeString('es-SV', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const celdas = [hora, a.tipo, a.cantidad, dinero(a.monto), a.cobrado_por];
      const tr = document.createElement('tr');
      celdas.forEach((valor) => {
        const td = document.createElement('td');
        td.textContent = valor;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  select.addEventListener('change', actualizarTotal);
  cantidad.addEventListener('input', actualizarTotal);

  area.querySelector('#formAcceso').addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';


    const d = await api('/accesos', {
      method: 'POST',
      body: JSON.stringify({
        tipo_acceso_id: Number(select.value),
        cantidad: Number(cantidad.value),
      }),
    });

    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    mensaje.textContent = 'Entrada registrada: ' + dinero(d.acceso.monto);
    cantidad.value = 1;
    actualizarTotal();
    cargarHoy();
  });

  await cargarTipos();
  await cargarHoy();
}