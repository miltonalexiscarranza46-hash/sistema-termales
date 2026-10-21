// Plantilla de documentos imprimibles de Termales Santa Teresa.
// cfg: { titulo, subtitulo, codigo, tarjetas:[{etiqueta,valor,tono}],
//        notas:[{etiqueta,texto}], secciones:[{titulo,tabla}], firmas:[texto] }
// tabla: { cabecera:[], filas:[[]], vacia:bool, aviso:'' }
function imprimirDocumento(cfg) {
  const EMPRESA = 'Termales Santa Teresa';
  const LEMA = 'Sistema de gestión';
  const LOGO = 'frontend\img\Emblema de Llamas Fluidas Azul y Verde.png'; // opcional: ruta de una imagen, por ejemplo '/img/logo.png'

  const esc = function (t) {
    return String(t === undefined || t === null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  const esNumero = function (v) {
    return /^-?\$?-?[\d.,]+$/.test(String(v).trim());
  };

  const ahora = new Date().toLocaleString('es-SV');

  const logoHtml = LOGO
    ? '<img class="logo" src="' + esc(new URL(LOGO, location.href).href) + '" alt="">'
    : '<div class="logo-texto">TST</div>';

  const tarjetas = (cfg.tarjetas || []).map(function (t) {
    return '<div class="t ' + esc(t.tono || '') + '"><span>' + esc(t.etiqueta) +
      '</span><strong>' + esc(t.valor) + '</strong></div>';
  }).join('');

  const notas = (cfg.notas || []).map(function (n) {
    return '<div class="nota"><b>' + esc(n.etiqueta) + ':</b> ' + esc(n.texto) + '</div>';
  }).join('');

  function tablaHtml(t) {
    if (!t || t.vacia) {
      return '<p class="vacio">' + esc((t && t.aviso) || 'Sin registros.') + '</p>';
    }
    return '<table><thead><tr>' +
      t.cabecera.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      t.filas.map(function (fila) {
        return '<tr>' + fila.map(function (v) {
          return '<td' + (esNumero(v) ? ' class="num"' : '') + '>' + esc(v) + '</td>';
        }).join('') + '</tr>';
      }).join('') +
      '</tbody></table>';
  }

  const secciones = (cfg.secciones || []).map(function (s) {
    return '<h2>' + esc(s.titulo) + '</h2>' + tablaHtml(s.tabla);
  }).join('');

  const firmas = (cfg.firmas || []).map(function (f) {
    return '<div class="firma"><div class="linea"></div><span>' + esc(f) + '</span></div>';
  }).join('');

  const html =
    '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
    '<title>' + esc(cfg.titulo) + ' - ' + esc(EMPRESA) + '</title>' +
    '<style>' +
    '@page{size:A4;margin:14mm 14mm 16mm;' +
      '@bottom-right{content:"Página " counter(page) " de " counter(pages);font-size:10px;color:#777;}}' +
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
    'body{font-family:"Segoe UI",Arial,Helvetica,sans-serif;color:#1f2d36;margin:0;font-size:12px;}' +
    '.encabezado{display:flex;justify-content:space-between;align-items:center;' +
      'background:#163b55;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0;}' +
    '.marca{display:flex;align-items:center;gap:12px;}' +
    '.logo{height:42px;}' +
    '.logo-texto{width:42px;height:42px;border-radius:50%;background:#12845f;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;}' +
    '.empresa{font-size:18px;font-weight:700;letter-spacing:.3px;}' +
    '.lema{font-size:11px;opacity:.8;}' +
    '.doc{text-align:right;}' +
    '.doc-tipo{font-size:11px;letter-spacing:2px;opacity:.8;}' +
    '.doc-cod{font-size:14px;font-weight:700;}' +
    '.franja{height:5px;background:#12845f;border-radius:0 0 8px 8px;margin-bottom:18px;}' +
    'h1{font-size:22px;margin:0 0 2px;color:#163b55;}' +
    '.sub{margin:0 0 16px;color:#5b6b76;font-size:13px;text-transform:capitalize;}' +
    '.tarjetas{display:flex;gap:12px;margin-bottom:12px;}' +
    '.t{flex:1;border:1px solid #d6e2dd;border-left:5px solid #12845f;border-radius:8px;padding:10px 12px;background:#f7fbf9;}' +
    '.t span{display:block;font-size:11px;color:#5b6b76;text-transform:uppercase;letter-spacing:.5px;}' +
    '.t strong{font-size:20px;color:#163b55;}' +
    '.t.gasto{border-left-color:#d9822b;background:#fffaf4;}' +
    '.t.neg{border-left-color:#c0392b;background:#fdf5f4;}' +
    '.t.neg strong{color:#a3342b;}' +
    '.nota{border:1px solid #d6e2dd;border-radius:8px;padding:9px 12px;margin-bottom:12px;background:#f7fbf9;font-size:12px;}' +
    'h2{font-size:14px;color:#163b55;margin:20px 0 8px;padding-bottom:4px;border-bottom:2px solid #12845f;}' +
    'table{width:100%;border-collapse:collapse;font-size:12px;}' +
    'th{background:#12845f;color:#fff;text-align:left;padding:7px 9px;font-weight:600;}' +
    'td{padding:6px 9px;border-bottom:1px solid #e3ebe8;}' +
    'tbody tr:nth-child(even) td{background:#f4f8f7;}' +
    '.num{text-align:right;font-variant-numeric:tabular-nums;}' +
    'th:last-child{text-align:right;}' +
    '.vacio{color:#7a8a94;font-style:italic;margin:6px 0;}' +
    'tr{page-break-inside:avoid;}' +
    'h2{page-break-after:avoid;}' +
    '.firmas{display:flex;gap:40px;margin-top:56px;page-break-inside:avoid;}' +
    '.firma{flex:1;text-align:center;font-size:11px;color:#5b6b76;}' +
    '.firma .linea{border-top:1px solid #1f2d36;margin-bottom:5px;}' +
    '.pie{margin-top:26px;padding-top:8px;border-top:1px solid #d6e2dd;font-size:10px;color:#7a8a94;' +
      'display:flex;justify-content:space-between;}' +
    '</style></head><body>' +
    '<div class="encabezado">' +
      '<div class="marca">' + logoHtml +
        '<div><div class="empresa">' + esc(EMPRESA) + '</div><div class="lema">' + esc(LEMA) + '</div></div>' +
      '</div>' +
      '<div class="doc"><div class="doc-tipo">DOCUMENTO</div><div class="doc-cod">' + esc(cfg.codigo || '') + '</div></div>' +
    '</div>' +
    '<div class="franja"></div>' +
    '<h1>' + esc(cfg.titulo) + '</h1>' +
    '<p class="sub">' + esc(cfg.subtitulo || '') + '</p>' +
    (tarjetas ? '<div class="tarjetas">' + tarjetas + '</div>' : '') +
    notas + secciones +
    (firmas ? '<div class="firmas">' + firmas + '</div>' : '') +
    '<div class="pie"><span>' + esc(EMPRESA) + ' · Documento de uso interno</span>' +
      '<span>Generado el ' + esc(ahora) + '</span></div>' +
    '</body></html>';

  const w = window.open('', '_blank');
  if (!w) {
    alert('Permite las ventanas emergentes de esta página para poder imprimir.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(function () { w.print(); }, 400);
}