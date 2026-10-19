async function cargarCaja(area) {
  area.innerHTML = `
    <div class="caja">
      <div class="resumen">
        <div class="resumen-item">
          <span>Esperado</span>
          <strong id="cajaEsperado">$0.00</strong>
        </div>
        <div class="resumen-item">
          <span>Entregado</span>
          <strong id="cajaEntregado">$0.00</strong>
        </div>
        <div class="resumen-item" id="cajaTarjetaDif">
          <span>Diferencia</span>
          <strong id="cajaDif">$0.00</strong>
        </div>
        <div class="resumen-item">
          <span>Estado de la caja</span>
          <strong id="cajaEstado">-</strong>
        </div>
        <div class="resumen-item">
          <span>Ver caja del día</span>
          <input type="date" id="cajaFechaVer">
        </div>
      </div>

      <div id="cajaCierreInfo" class="caja-cierre" hidden></div>

      <form id="formEntrega" class="caja-form">
        <div class="campo">
          <label for="cajaEmpleado">Empleado que entrega</label>
          <select id="cajaEmpleado" required></select>
        </div>

        <div class="campo">
          <label for="cajaMonto">Monto recibido</label>
          <input type="number" id="cajaMonto" min="0.01" step="0.01" placeholder="0.00" required>
        </div>

        <div class="campo">
          <label for="cajaNota">Nota (opcional)</label>
          <input type="text" id="cajaNota" maxlength="200" placeholder="Ej: entrega del turno de la mañana">
        </div>

        <button type="submit">Registrar entrega</button>
      </form>

      <p id="mensajeCaja" class="mensaje" role="status"></p>

      <h3 class="caja-titulo">Por empleado</h3>
      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Rol</th>
              <th>Esperado</th>
              <th>Entregado</th>
              <th>Diferencia</th>
            </tr>
          </thead>
          <tbody id="filasEmpleadosCaja"></tbody>
        </table>
      </div>

      <h3 class="caja-titulo">Entregas del día</h3>
      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Empleado</th>
              <th>Monto</th>
              <th>Nota</th>
              <th>Recibió</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="filasEntregasCaja"></tbody>
        </table>
      </div>

      <div id="cajaCerrarBox" class="caja-cerrar">
        <div class="campo">
          <label for="cajaNotaCierre">Nota del cierre (opcional)</label>
          <input type="text" id="cajaNotaCierre" maxlength="200" placeholder="Observaciones del día">
        </div>
        <button type="button" id="btnCerrarCaja">Cerrar caja del día</button>
      </div>
    </div>
  `;

  const q = (s) => area.querySelector(s);
  const fechaVer = q('#cajaFechaVer');
  const selEmpleado = q('#cajaEmpleado');
  const monto = q('#cajaMonto');
  const nota = q('#cajaNota');
  const mensaje = q('#mensajeCaja');
  const form = q('#formEntrega');
  const cerrarBox = q('#cajaCerrarBox');
  const cierreInfo = q('#cajaCierreInfo');

  let ultimo = null; // última respuesta de /caja/dia

  const dinero = (n) => '$' + Number(n).toFixed(2);

  const hoyLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  const hora = (iso) =>
    new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  const claseDif = (n) => (n === 0 ? 'caja-ok' : n < 0 ? 'caja-falta' : 'caja-sobra');
  const textoDif = (n) =>
    n === 0 ? 'Cuadra' : n < 0 ? 'Falta ' + dinero(-n) : 'Sobra ' + dinero(n);

  const etiqueta = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  // Sugiere en el monto lo que le falta entregar al empleado elegido
  function sugerirMonto() {
    if (!ultimo) return;
    const e = ultimo.empleados.find((x) => String(x.empleado_id) === selEmpleado.value);
    monto.value = e && e.diferencia < 0 ? (-e.diferencia).toFixed(2) : '';
  }

  function pintarEmpleados(d) {
    const tbody = q('#filasEmpleadosCaja');
    tbody.innerHTML = '';

    if (d.empleados.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'Este día no hay movimientos de dinero.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    d.empleados.forEach((e) => {
      const tr = document.createElement('tr');
      [e.empleado, etiqueta(e.rol), dinero(e.esperado), dinero(e.entregado)].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      const tdDif = document.createElement('td');
      const span = document.createElement('span');
      span.className = 'caja-etiqueta ' + claseDif(e.diferencia);
      span.textContent = textoDif(e.diferencia);
      tdDif.appendChild(span);
      tr.appendChild(tdDif);
      tbody.appendChild(tr);
    });
  }

  function pintarEntregas(d) {
    const tbody = q('#filasEntregasCaja');
    tbody.innerHTML = '';

    if (d.entregas.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'No hay entregas registradas este día.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    d.entregas.forEach((x) => {
      const tr = document.createElement('tr');
      [hora(x.creado_en), x.empleado, dinero(x.monto), x.nota || '-', x.recibido_por].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });

      const tdAcc = document.createElement('td');
      if (x.se_puede_borrar) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-borrar';
        btn.textContent = 'Anular';
        btn.addEventListener('click', () => anular(x));
        tdAcc.appendChild(btn);
      }
      tr.appendChild(tdAcc);
      tbody.appendChild(tr);
    });
  }

  async function cargar() {
    const d = await api('/caja/dia?fecha=' + fechaVer.value);
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    ultimo = d;

    const esHoy = d.fecha === hoyLocal();
    const editable = esHoy && !d.cerrado;

    q('#cajaEsperado').textContent = dinero(d.total_esperado);
    q('#cajaEntregado').textContent = dinero(d.total_entregado);
    q('#cajaDif').textContent = textoDif(d.diferencia);
    q('#cajaTarjetaDif').className = 'resumen-item caja-tarjeta ' + claseDif(d.diferencia);
    q('#cajaEstado').textContent = d.cerrado ? 'Cerrada' : esHoy ? 'Abierta' : 'Sin cierre';

    // Cuadro del cierre
    if (d.cerrado) {
      const c = d.cierre;
      cierreInfo.hidden = false;
      cierreInfo.textContent =
        'Caja cerrada por ' + c.cerrado_por + ' el ' +
        new Date(c.cerrado_en).toLocaleString('es') +
        '. Esperado ' + dinero(c.esperado) +
        ', recibido ' + dinero(c.recibido) +
        ' (' + textoDif(c.diferencia) + ').' +
        (c.nota ? ' Nota: ' + c.nota : '');
    } else {
      cierreInfo.hidden = true;
      cierreInfo.textContent = '';
    }

    form.hidden = !editable;
    cerrarBox.hidden = !editable;

    // Lista de empleados que pueden entregar
    const anterior = selEmpleado.value;
    selEmpleado.innerHTML = '';
    d.empleados.forEach((e) => {
      const op = document.createElement('option');
      op.value = e.empleado_id;
      op.textContent = e.empleado + (e.diferencia < 0 ? ' (falta ' + dinero(-e.diferencia) + ')' : '');
      selEmpleado.appendChild(op);
    });
    if (anterior && [...selEmpleado.options].some((o) => o.value === anterior)) {
      selEmpleado.value = anterior;
    }
    if (!monto.value) sugerirMonto();

    pintarEmpleados(d);
    pintarEntregas(d);
  }

  async function anular(x) {
    if (!confirm('¿Anular la entrega de ' + dinero(x.monto) + ' de ' + x.empleado + '?')) return;
    mensaje.textContent = '';
    const d = await api('/caja/entregas/' + x.id, { method: 'DELETE' });
    mensaje.textContent = d.mensaje;
    monto.value = '';
    cargar();
  }

  selEmpleado.addEventListener('change', sugerirMonto);
  fechaVer.addEventListener('change', () => {
    mensaje.textContent = '';
    monto.value = '';
    cargar();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const d = await api('/caja/entregas', {
      method: 'POST',
      body: JSON.stringify({
        empleado_id: Number(selEmpleado.value),
        monto: Number(monto.value),
        nota: nota.value,
      }),
    });

    mensaje.textContent = d.ok ? 'Entrega registrada: ' + dinero(d.entrega.monto) : d.mensaje;
    if (d.ok) {
      monto.value = '';
      nota.value = '';
    }
    cargar();
  });

  q('#btnCerrarCaja').addEventListener('click', async () => {
    mensaje.textContent = '';
    const texto =
      'Vas a cerrar la caja de hoy.\n\n' +
      'Esperado: ' + dinero(ultimo.total_esperado) + '\n' +
      'Entregado: ' + dinero(ultimo.total_entregado) + '\n' +
      'Resultado: ' + textoDif(ultimo.diferencia) + '\n\n' +
      'Después no podrás registrar ni anular entregas de hoy. ¿Cerrar la caja?';
    if (!confirm(texto)) return;

    const d = await api('/caja/cierre', {
      method: 'POST',
      body: JSON.stringify({ nota: q('#cajaNotaCierre').value }),
    });
    mensaje.textContent = d.mensaje;
    if (d.ok) q('#cajaNotaCierre').value = '';
    cargar();
  });

  // Estado inicial
  fechaVer.value = hoyLocal();
  fechaVer.max = hoyLocal();
  await cargar();
}