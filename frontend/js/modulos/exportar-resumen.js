function agregarExportar(area) {
  if (area.querySelector('.resumen-acciones')) return;

  const barra = document.createElement('div');
  barra.className = 'resumen-acciones';
  barra.innerHTML =
    '<button type="button" id="btnImprimir">Imprimir / Guardar PDF</button>' +
    '<button type="button" id="btnExcel">Descargar Excel</button>';

  const filtro = area.querySelector('.resumen-filtro');
  if (filtro) filtro.insertAdjacentElement('afterend', barra);
  else area.prepend(barra);

  function texto(sel) {
    const e = area.querySelector(sel);
    return e ? e.textContent.trim() : '';
  }

  function leerTabla(idCuerpo) {
    const cuerpo = area.querySelector(idCuerpo);
    if (!cuerpo) return { cabecera: [], filas: [], vacia: true, aviso: '' };
    const cabecera = Array.from(cuerpo.closest('table').querySelectorAll('thead th'))
      .map(function (th) { return th.textContent.trim(); });
    const filas = Array.from(cuerpo.querySelectorAll('tr')).map(function (tr) {
      return Array.from(tr.children).map(function (td) { return td.textContent.trim(); });
    });
    const vacia = filas.length === 0 || (filas.length === 1 && filas[0].length === 1);
    return { cabecera: cabecera, filas: vacia ? [] : filas, vacia: vacia, aviso: vacia && filas[0] ? filas[0][0] : '' };
  }

  function leerDatos() {
    return {
      fecha: texto('#fechaResumen') || (area.querySelector('#fechaResumen') || {}).value || '',
      ingresos: texto('#totalIngresos'),
      gastos: texto('#totalGastos'),
      balance: texto('#balanceDia'),
      cajaEstado: texto('#estadoCaja'),
      cajaDetalle: texto('#detalleCaja'),
      tIngresos: leerTabla('#filasIngresos'),
      tGastos: leerTabla('#filasGastos'),
    };
  }

  function fechaArchivo() {
    const f = area.querySelector('#fechaResumen');
    return f && f.value ? f.value : 'dia';
  }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Excel (CSV) ----------
  function celda(v) {
    let s = String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // evita fórmulas inyectadas
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function linea(arr) { return arr.map(celda).join(';'); }

  area.querySelector('#btnExcel').addEventListener('click', function () {
    const d = leerDatos();
    const f = fechaArchivo();
    const out = [];
    out.push(linea(['Termales Santa Teresa - Resumen del día']));
    out.push(linea(['Día', f]));
    out.push('');
    out.push(linea(['Ingresos del día', d.ingresos]));
    out.push(linea(['Gastos del día', d.gastos]));
    out.push(linea(['Balance', d.balance]));
    if (d.cajaEstado || d.cajaDetalle) {
      out.push(linea(['Caja', d.cajaEstado, d.cajaDetalle]));
    }
    out.push('');
    out.push(linea(['Ingresos por área y empleado']));
    out.push(linea(d.tIngresos.cabecera));
    if (d.tIngresos.vacia) out.push(linea([d.tIngresos.aviso]));
    d.tIngresos.filas.forEach(function (fila) { out.push(linea(fila)); });
    out.push('');
    out.push(linea(['Gastos del día']));
    out.push(linea(d.tGastos.cabecera));
    if (d.tGastos.vacia) out.push(linea([d.tGastos.aviso]));
    d.tGastos.filas.forEach(function (fila) { out.push(linea(fila)); });

    const blob = new Blob(['\uFEFF' + out.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resumen-' + f + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  // ---------- Imprimir / PDF ----------
  function tablaHtml(t) {
    if (t.vacia) return '<p class="vacio">' + esc(t.aviso || 'Sin registros.') + '</p>';
    return '<table><thead><tr>' +
      t.cabecera.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      t.filas.map(function (fila) {
        return '<tr>' + fila.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>';
      }).join('') +
      '</tbody></table>';
  }

  area.querySelector('#btnImprimir').addEventListener('click', function () {
    const d = leerDatos();
    const f = fechaArchivo();
    const ahora = new Date().toLocaleString('es-SV');

    const html =
      '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
      '<title>Resumen del día ' + esc(f) + '</title>' +
      '<style>' +
      'body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:28px;}' +
      'h1{font-size:20px;margin:0 0 4px;}' +
      '.sub{color:#666;font-size:13px;margin-bottom:18px;}' +
      '.tarjetas{display:flex;gap:12px;margin-bottom:12px;}' +
      '.t{flex:1;border:1px solid #ccc;border-radius:8px;padding:10px 12px;}' +
      '.t span{display:block;font-size:12px;color:#666;}' +
      '.t strong{font-size:20px;}' +
      '.caja{border:1px solid #ccc;border-radius:8px;padding:10px 12px;margin-bottom:18px;font-size:14px;}' +
      'h2{font-size:15px;margin:18px 0 6px;}' +
      'table{width:100%;border-collapse:collapse;font-size:13px;}' +
      'th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;}' +
      'th{background:#f0f0f0;}' +
      '.vacio{font-size:13px;color:#666;}' +
      '.pie{margin-top:24px;font-size:11px;color:#888;}' +
      '</style></head><body>' +
      '<h1>Termales Santa Teresa - Resumen del día</h1>' +
      '<div class="sub">Día: ' + esc(f) + '</div>' +
      '<div class="tarjetas">' +
        '<div class="t"><span>Ingresos del día</span><strong>' + esc(d.ingresos) + '</strong></div>' +
        '<div class="t"><span>Gastos del día</span><strong>' + esc(d.gastos) + '</strong></div>' +
        '<div class="t"><span>Balance</span><strong>' + esc(d.balance) + '</strong></div>' +
      '</div>' +
      ((d.cajaEstado || d.cajaDetalle)
        ? '<div class="caja"><strong>Caja:</strong> ' + esc(d.cajaEstado) + ' ' + esc(d.cajaDetalle) + '</div>'
        : '') +
      '<h2>Ingresos por área y empleado</h2>' + tablaHtml(d.tIngresos) +
      '<h2>Gastos del día</h2>' + tablaHtml(d.tGastos) +
      '<div class="pie">Generado el ' + esc(ahora) + '</div>' +
      '</body></html>';

    const w = window.open('', '_blank');
    if (!w) {
      alert('Permite las ventanas emergentes de esta página para poder imprimir.');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 300);
  });
}