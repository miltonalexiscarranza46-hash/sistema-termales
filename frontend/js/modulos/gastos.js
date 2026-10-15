async function cargarGastos(area) {
  area.innerHTML = `
    <div class="gastos">
      <form id="formGasto" class="gastos-form">
        <div class="campo">
          <label for="categoriaGasto">Categoría</label>
          <select id="categoriaGasto" required></select>
        </div>

        <div class="campo">
          <label for="areaGasto">Área</label>
          <select id="areaGasto"></select>
        </div>

        <div class="campo">
          <label for="montoGasto">Monto</label>
          <input type="number" id="montoGasto" min="0.01" step="0.01" placeholder="0.00" required>
        </div>

        <div class="campo">
          <label for="descripcionGasto">Descripción</label>
          <input type="text" id="descripcionGasto" maxlength="200" placeholder="¿En qué se gastó?" required>
        </div>

        <div class="campo">
          <label for="fechaGasto">Fecha del gasto</label>
          <input type="date" id="fechaGasto" required>
        </div>

        <button type="submit">Registrar gasto</button>
        <p id="mensajeGastos" class="mensaje" role="status"></p>
      </form>

      <div class="resumen">
        <div class="resumen-item resumen-gasto">
          <span>Total gastado del día</span>
          <strong id="totalGastosDia">$0.00</strong>
        </div>
        <div class="resumen-item resumen-gasto">
          <span>Gastos registrados</span>
          <strong id="cantidadGastos">0</strong>
        </div>
        <div class="resumen-item resumen-gasto">
          <span>Ver gastos del día</span>
          <input type="date" id="fechaVer">
        </div>
      </div>

      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Área</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Registró</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="filasGastos"></tbody>
        </table>
      </div>
    </div>
  `;

  const selCategoria = area.querySelector('#categoriaGasto');
  const selArea = area.querySelector('#areaGasto');
  const monto = area.querySelector('#montoGasto');
  const descripcion = area.querySelector('#descripcionGasto');
  const fechaGasto = area.querySelector('#fechaGasto');
  const fechaVer = area.querySelector('#fechaVer');
  const mensaje = area.querySelector('#mensajeGastos');
  const tbody = area.querySelector('#filasGastos');

  const dinero = (n) => '$' + Number(n).toFixed(2);

  const hoyLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  // "cabanas" -> "Cabañas", "restaurante" -> "Restaurante"
  const etiqueta = (t) =>
    t === 'cabanas' ? 'Cabañas' : t.charAt(0).toUpperCase() + t.slice(1);

  async function cargarCatalogos() {
    const d = await api('/gastos/catalogos');
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    selCategoria.innerHTML = '';
    d.categorias.forEach((c) => {
      const op = document.createElement('option');
      op.value = c.id;
      op.textContent = etiqueta(c.nombre);
      selCategoria.appendChild(op);
    });

    selArea.innerHTML = '';
    const general = document.createElement('option');
    general.value = '';
    general.textContent = 'General (sin área)';
    selArea.appendChild(general);
    d.areas.forEach((a) => {
      const op = document.createElement('option');
      op.value = a.id;
      op.textContent = etiqueta(a.nombre);
      selArea.appendChild(op);
    });
  }

  async function cargarLista() {
    const d = await api('/gastos?fecha=' + fechaVer.value);
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    area.querySelector('#totalGastosDia').textContent = dinero(d.total);
    area.querySelector('#cantidadGastos').textContent = d.gastos.length;

    tbody.innerHTML = '';

    if (d.gastos.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'No hay gastos registrados este día.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    d.gastos.forEach((g) => {
      const tr = document.createElement('tr');

      const celdas = [
        etiqueta(g.categoria),
        etiqueta(g.area),
        g.descripcion,
        dinero(g.monto),
        g.registrado_por,
      ];
      celdas.forEach((valor) => {
        const td = document.createElement('td');
        td.textContent = valor;
        tr.appendChild(td);
      });

      // Solo se pueden borrar los gastos registrados hoy
      const tdAcc = document.createElement('td');
      if (g.se_puede_borrar) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-borrar';
        btn.textContent = 'Borrar';
        btn.addEventListener('click', () => borrar(g));
        tdAcc.appendChild(btn);
      }
      tr.appendChild(tdAcc);

      tbody.appendChild(tr);
    });
  }

  async function borrar(g) {
    const texto = '¿Borrar el gasto "' + g.descripcion + '" de ' + dinero(g.monto) + '?';
    if (!confirm(texto)) return;

    mensaje.textContent = '';
    const d = await api('/gastos/' + g.id, { method: 'DELETE' });
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    mensaje.textContent = 'Gasto borrado.';
    cargarLista();
  }

  fechaVer.addEventListener('change', cargarLista);

  area.querySelector('#formGasto').addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const d = await api('/gastos', {
      method: 'POST',
      body: JSON.stringify({
        categoria_id: Number(selCategoria.value),
        area_id: selArea.value ? Number(selArea.value) : null,
        monto: Number(monto.value),
        descripcion: descripcion.value,
        fecha: fechaGasto.value,
      }),
    });

    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    mensaje.textContent = 'Gasto registrado: ' + dinero(d.gasto.monto);
    monto.value = '';
    descripcion.value = '';
    fechaVer.value = fechaGasto.value; // mostrar el día del gasto
    cargarLista();
  });

  // Estado inicial
  fechaGasto.value = hoyLocal();
  fechaGasto.max = hoyLocal(); // sin fechas futuras (el backend también lo valida)
  fechaVer.value = hoyLocal();

  await cargarCatalogos();
  await cargarLista();
}