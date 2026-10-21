async function cargarResumen(area) {
  area.innerHTML = `
    <div class="resumen-dia">
      <div class="resumen-filtro">
        <div class="campo">
          <label for="fechaResumen">Día</label>
          <input type="date" id="fechaResumen">
        </div>
      </div>

      <p id="mensajeResumen" class="mensaje" role="status"></p>

      <div class="resumen">
        <div class="resumen-item">
          <span>Ingresos del día</span>
          <strong id="totalIngresos">$0.00</strong>
        </div>
        <div class="resumen-item resumen-gasto">
          <span>Gastos del día</span>
          <strong id="totalGastos">$0.00</strong>
        </div>
        <div class="resumen-item" id="tarjetaBalance">
          <span>Balance</span>
          <strong id="balanceDia">$0.00</strong>
        </div>
                <div class="resumen-item" id="tarjetaCaja">
          <span>Caja del día</span>
          <strong id="estadoCaja">-</strong>
          <small id="detalleCaja"></small>
        </div>
      </div>

      <h2 class="subtitulo">Ingresos por área y empleado</h2>
      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Área</th>
              <th>Rol</th>
              <th>Empleado</th>
              <th>Operaciones</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody id="filasIngresos"></tbody>
        </table>
      </div>

      <h2 class="subtitulo">Gastos del día</h2>
      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Área</th>
              <th>Operaciones</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody id="filasGastos"></tbody>
        </table>
      </div>

      <p class="nota">
        Reservas cuenta solo los anticipos. Restaurante y bar se sumará
        cuando exista ese módulo.
      </p>
    </div>
  `;

  const fecha = area.querySelector('#fechaResumen');
  const mensaje = area.querySelector('#mensajeResumen');
  const dinero = (n) => '$' + Number(n).toFixed(2);

  // Día de hoy en hora local, formato AAAA-MM-DD
  const hoyLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  function llenarTabla(tbody, filas, columnas, textoVacio) {
    tbody.innerHTML = '';

    if (filas.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = columnas;
      td.textContent = textoVacio;
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    filas.forEach((celdas) => {
      const tr = document.createElement('tr');
      celdas.forEach((valor) => {
        const td = document.createElement('td');
        td.textContent = valor;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  async function cargar() {
    mensaje.textContent = '';
    const d = await api('/resumen/dia?fecha=' + fecha.value);

    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    area.querySelector('#totalIngresos').textContent = dinero(d.total_ingresos);
    area.querySelector('#totalGastos').textContent = dinero(d.total_gastos);
    area.querySelector('#balanceDia').textContent = dinero(d.balance);
    area.querySelector('#tarjetaBalance')
      .classList.toggle('balance-negativo', d.balance < 0);
      
    // Cierre de caja del día
    const tarjetaCaja = area.querySelector('#tarjetaCaja');
    const estadoCaja = area.querySelector('#estadoCaja');
    const detalleCaja = area.querySelector('#detalleCaja');
    tarjetaCaja.classList.remove('caja-ok', 'caja-falta', 'caja-sobra');

    if (d.caja) {
      const dif = d.caja.diferencia;
      estadoCaja.textContent =
        dif === 0 ? 'Cuadra' : dif < 0 ? 'Falta ' + dinero(-dif) : 'Sobra ' + dinero(dif);
      tarjetaCaja.classList.add(dif === 0 ? 'caja-ok' : dif < 0 ? 'caja-falta' : 'caja-sobra');
      detalleCaja.textContent =
        'Cerrada por ' + d.caja.cerrado_por +
        ' · recibido ' + dinero(d.caja.recibido) +
        ' de ' + dinero(d.caja.esperado) +
        (d.caja.nota ? ' · ' + d.caja.nota : '');
    } else {
      estadoCaja.textContent = 'Sin cerrar';
      detalleCaja.textContent = '';
    }

    llenarTabla(
      area.querySelector('#filasIngresos'),
      d.ingresos.map((x) => [x.area, x.rol, x.empleado, x.operaciones, dinero(x.total)]),
      5,
      'No hay ingresos registrados este día.'
    );

    llenarTabla(
      area.querySelector('#filasGastos'),
      d.gastos.map((x) => [x.categoria, x.area, x.operaciones, dinero(x.total)]),
      4,
      'No hay gastos registrados este día.'
    );
  }

  fecha.addEventListener('change', cargar);

  fecha.value = hoyLocal();
  await cargar();
    agregarExportar(area);
}