async function cargarEnviarReporte(area) {
  area.innerHTML = `
    <div class="reporte">
      <p id="reporteFecha" class="reporte-fecha"></p>

      <div id="reporteEstado" class="reporte-estado"></div>

      <h3 class="reporte-titulo">Resumen de hoy</h3>
      <div class="tabla-wrap" id="reporteTablaWrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Dato</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody id="filasResumenReporte"></tbody>
        </table>
      </div>
      <p id="reporteSinResumen" class="reporte-nota" hidden>
        Tu módulo todavía no genera un resumen automático.
        Cuéntale al administrador cómo fue tu día en las observaciones.
      </p>

      <form id="formReporte" class="reporte-form">
        <div class="campo">
          <label for="reporteObs">
            Observaciones <span id="reporteObsTipo">(opcional)</span>
          </label>
          <textarea id="reporteObs" rows="5" maxlength="1000"
            placeholder="Ej: faltó papel en la entrada, un cliente pidió factura..."></textarea>
          <small id="reporteContador">0 / 1000</small>
        </div>
        <button type="submit" id="btnEnviarReporte">Enviar reporte</button>
      </form>

      <p id="mensajeReporte" class="mensaje" role="status"></p>
    </div>
  `;

  const q = (s) => area.querySelector(s);
  const obs = q('#reporteObs');
  const contador = q('#reporteContador');
  const mensaje = q('#mensajeReporte');
  const form = q('#formReporte');
  const boton = q('#btnEnviarReporte');
  const estado = q('#reporteEstado');

  const hora = (iso) =>
    new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  const actualizarContador = () => {
    contador.textContent = obs.value.length + ' / 1000';
  };

  async function cargar() {
    const d = await api('/reportes/hoy');
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    q('#reporteFecha').textContent = new Date(d.fecha + 'T00:00:00').toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Resumen automático
    const tbody = q('#filasResumenReporte');
    tbody.innerHTML = '';
    const items = d.resumen.items;
    q('#reporteTablaWrap').hidden = items.length === 0;
    q('#reporteSinResumen').hidden = items.length > 0;

    items.forEach((x) => {
      const tr = document.createElement('tr');
      [x.etiqueta, x.valor].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // Aviso de estado
    const r = d.reporte;
    if (!r) {
      estado.className = 'reporte-estado pendiente';
      estado.textContent = 'Todavía no has enviado tu reporte de hoy.';
    } else if (r.leido) {
      estado.className = 'reporte-estado leido';
      estado.textContent = 'El administrador ya leyó tu reporte. Ya no se puede cambiar.';
    } else {
      estado.className = 'reporte-estado enviado';
      estado.textContent =
        'Reporte enviado a las ' + hora(r.actualizado_en) +
        '. Puedes corregirlo mientras el administrador no lo lea.';
    }

    // Formulario
    obs.value = r && r.observaciones ? r.observaciones : '';
    obs.required = d.requiere_observaciones;
    q('#reporteObsTipo').textContent = d.requiere_observaciones ? '(obligatorio)' : '(opcional)';
    obs.disabled = !d.se_puede_corregir;
    boton.hidden = !d.se_puede_corregir;
    boton.textContent = r ? 'Actualizar reporte' : 'Enviar reporte';
    actualizarContador();
  }

  obs.addEventListener('input', actualizarContador);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const d = await api('/reportes', {
      method: 'POST',
      body: JSON.stringify({ observaciones: obs.value }),
    });

    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    await cargar();
    mensaje.textContent = d.mensaje;
  });

  await cargar();
}