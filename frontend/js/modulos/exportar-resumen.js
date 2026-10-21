// ---------- Utilidades para crear un .xlsx real (sin librerías) ----------
const XLSX_TABLA_CRC = (function () {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function xlsxCrc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = XLSX_TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Empaqueta archivos de texto en un .zip sin compresión
function xlsxZip(archivos) {
  const enc = new TextEncoder();
  const partes = [];
  const central = [];
  let offset = 0;

  archivos.forEach(function (a) {
    const nombre = enc.encode(a.nombre);
    const datos = enc.encode(a.texto);
    const crc = xlsxCrc32(datos);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true);
    lh.setUint16(12, 33, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, datos.length, true);
    lh.setUint32(22, datos.length, true);
    lh.setUint16(26, nombre.length, true);
    partes.push(new Uint8Array(lh.buffer), nombre, datos);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(14, 33, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, datos.length, true);
    ch.setUint32(24, datos.length, true);
    ch.setUint16(28, nombre.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nombre);

    offset += 30 + nombre.length + datos.length;
  });

  let tamCentral = 0;
  central.forEach(function (p) { tamCentral += p.length; });

  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamCentral, true);
  fin.setUint32(16, offset, true);

  return new Blob(partes.concat(central, [new Uint8Array(fin.buffer)]), {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function xlsxColumna(i) {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function xlsxEsc(t) {
  return String(t)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// filas: arreglo de filas; cada fila es un arreglo de celdas:
//   { t: 'texto' } o { n: 12.5 }, con e = estilo (0 normal, 1 negrita,
//   2 encabezado verde, 3 dinero, 4 dinero en negrita) y x = true para
//   que no cuente en el ancho de la columna. Una fila [] es una línea en blanco.
function xlsxCrear(filas) {
  const anchos = [];

  const filasXml = filas.map(function (fila, r) {
    if (fila.length === 0) return '';
    const celdas = fila.map(function (c, i) {
      const ref = xlsxColumna(i) + (r + 1);
      const estilo = c.e || 0;
      const largo = c.n !== undefined ? c.n.toFixed(2).length + 2 : String(c.t).length;
      if (!c.x) anchos[i] = Math.max(anchos[i] || 0, largo);
      if (c.n !== undefined) {
        return '<c r="' + ref + '" s="' + estilo + '"><v>' + c.n + '</v></c>';
      }
      return '<c r="' + ref + '" s="' + estilo + '" t="inlineStr"><is><t xml:space="preserve">' +
        xlsxEsc(c.t) + '</t></is></c>';
    }).join('');
    return '<row r="' + (r + 1) + '">' + celdas + '</row>';
  }).join('');

  let cols = '';
  for (let i = 0; i < anchos.length; i++) {
    const w = Math.min(50, Math.max(12, (anchos[i] || 0) + 3));
    cols += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
  }

  const cab = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const nsMain = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const nsRel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const tipoRel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';

  const hoja = cab + '<worksheet xmlns="' + nsMain + '"><cols>' + cols + '</cols><sheetData>' +
    filasXml + '</sheetData></worksheet>';

  const estilos = cab + '<styleSheet xmlns="' + nsMain + '">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/></numFmts>' +
    '<fonts count="3">' +
      '<font><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
    '</fonts>' +
    '<fills count="3">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF12845F"/><bgColor indexed="64"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="5">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  return xlsxZip([
    {
      nombre: '[Content_Types].xml',
      texto: cab + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>',
    },
    {
      nombre: '_rels/.rels',
      texto: cab + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="' + tipoRel + 'officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    },
    {
      nombre: 'xl/workbook.xml',
      texto: cab + '<workbook xmlns="' + nsMain + '" xmlns:r="' + nsRel + '">' +
        '<sheets><sheet name="Resumen" sheetId="1" r:id="rId1"/></sheets></workbook>',
    },
    {
      nombre: 'xl/_rels/workbook.xml.rels',
      texto: cab + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="' + tipoRel + 'worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="' + tipoRel + 'styles" Target="styles.xml"/>' +
        '</Relationships>',
    },
    { nombre: 'xl/styles.xml', texto: estilos },
    { nombre: 'xl/worksheets/sheet1.xml', texto: hoja },
  ]);
}

// ---------- Botones del Resumen del día ----------
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

  // ---------- Excel (.xlsx real) ----------
  // Convierte "$12.50" en el número 12.5 (con formato de dinero) para que Excel pueda sumar
  function cel(v, negrita) {
    const s = String(v).trim();
    if (/^-?\$-?[\d,]*\.?\d+$/.test(s)) {
      return { n: parseFloat(s.replace(/[$,]/g, '')), e: negrita ? 4 : 3 };
    }
    if (/^\d+$/.test(s)) return { n: Number(s), e: 0 };
    return { t: s, e: negrita ? 1 : 0 };
  }

  function bloqueTabla(titulo, t) {
    const filas = [];
    filas.push([{ t: titulo, e: 1, x: true }]);
    filas.push(t.cabecera.map(function (h) { return { t: h, e: 2 }; }));
    if (t.vacia) filas.push([{ t: t.aviso || 'Sin registros.', x: true }]);
    t.filas.forEach(function (fila) { filas.push(fila.map(function (v) { return cel(v); })); });
    return filas;
  }

  area.querySelector('#btnExcel').addEventListener('click', function () {
    try {
      const d = leerDatos();
      const f = fechaArchivo();
      let filas = [];

      filas.push([{ t: 'Termales Santa Teresa - Resumen del día', e: 1, x: true }]);
      filas.push([{ t: 'Día' }, { t: f }]);
      filas.push([]);
      filas.push([{ t: 'Ingresos del día' }, cel(d.ingresos, true)]);
      filas.push([{ t: 'Gastos del día' }, cel(d.gastos, true)]);
      filas.push([{ t: 'Balance' }, cel(d.balance, true)]);
      if (d.cajaEstado || d.cajaDetalle) {
        filas.push([{ t: 'Cierre de caja' }, { t: (d.cajaEstado + ' ' + d.cajaDetalle).trim(), x: true }]);
      }
      filas.push([]);
      filas = filas.concat(bloqueTabla('Ingresos por área y empleado', d.tIngresos));
      filas.push([]);
      filas = filas.concat(bloqueTabla('Gastos del día', d.tGastos));

      const blob = xlsxCrear(filas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resumen-' + f + '.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    } catch (e) {
      alert('No se pudo crear el archivo de Excel: ' + e.message);
    }
  });

  // ---------- Imprimir / PDF (plantilla de la empresa) ----------
  area.querySelector('#btnImprimir').addEventListener('click', function () {
    const d = leerDatos();
    const f = fechaArchivo();

    const fecha = new Date(f + 'T00:00:00');
    const fechaLarga = isNaN(fecha.getTime())
      ? f
      : fecha.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    imprimirDocumento({
      titulo: 'Resumen del día',
      subtitulo: fechaLarga,
      codigo: 'RES-' + f,
      tarjetas: [
        { etiqueta: 'Ingresos del día', valor: d.ingresos },
        { etiqueta: 'Gastos del día', valor: d.gastos, tono: 'gasto' },
        { etiqueta: 'Balance', valor: d.balance, tono: d.balance.indexOf('-') !== -1 ? 'neg' : '' },
      ],
      notas: (d.cajaEstado || d.cajaDetalle)
        ? [{ etiqueta: 'Cierre de caja', texto: (d.cajaEstado + ' ' + d.cajaDetalle).trim() }]
        : [],
      secciones: [
        { titulo: 'Ingresos por área y empleado', tabla: d.tIngresos },
        { titulo: 'Gastos del día', tabla: d.tGastos },
      ],
      firmas: ['Elaborado por', 'Revisado por (Administración)'],
    });
  });
}