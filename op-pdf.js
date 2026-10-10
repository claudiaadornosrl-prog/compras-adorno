// ═══════════════════════════════════════════════════════════════════════
//  Compras Adorno · op-pdf.js — PDF de la Orden de Pago y del Certificado
//  de Retención. Hasta el 8-oct-2026 copiaba el armado del Dragonfish;
//  ahora usa el diseño "Tarjetas" elegido por JP (ver _disenos_pdf).
//  Se carga después del script principal: usa sb, plata, _fecha, esc.
//  jsPDF viene de cdnjs (igual que Tesorería / RRHH).
// ═══════════════════════════════════════════════════════════════════════

let _opFontOk = false;
async function _opCargarFuente(doc){
  try { if (doc.getFontList && doc.getFontList()['AdornoTitulo']) return true; } catch (_) {}
  try {
    const r = await fetch('./fonts/URWGothic-Book.ttf');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const bytes = new Uint8Array(await r.arrayBuffer());
    let bin = ''; for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    doc.addFileToVFS('AdornoTitulo.ttf', btoa(bin));
    doc.addFont('AdornoTitulo.ttf', 'AdornoTitulo', 'normal');
    _opFontOk = true; return true;
  } catch (e) { console.warn('Fuente institucional no disponible', e); return false; }
}
const _pdfN = n => Number(n || 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const _pdfF = d => d ? String(d).slice(0,10).split('-').reverse().join('/') : '';
const _pdfCuit = c => { c = String(c||'').replace(/\D/g,''); return c.length === 11 ? c.slice(0,2)+'-'+c.slice(2,10)+'-'+c.slice(10) : c; };

// "SON PESOS: ..." — número en letras (hasta miles de millones, con centavos)
function _pdfLetras(n){
  const U = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
             'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiún', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
             'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  function tres(x){
    if (x === 0) return ''; if (x === 100) return 'cien';
    const c = Math.floor(x/100), r = x % 100; let s = C[c];
    if (r < 30) s += (s && r ? ' ' : '') + U[r];
    else { const d = Math.floor(r/10), u = r % 10; s += (s ? ' ' : '') + D[d] + (u ? ' y ' + U[u] : ''); }
    return s;
  }
  function ent(x){
    if (x === 0) return 'cero';
    const mm = Math.floor(x / 1e6), mil = Math.floor((x % 1e6) / 1000), r = x % 1000; let p = [];
    if (mm) p.push(mm === 1 ? 'un millón' : tres(mm) + ' millones');
    if (mil) p.push(mil === 1 ? 'mil' : tres(mil) + ' mil');
    if (r) p.push(tres(r));
    return p.join(' ');
  }
  const e = Math.floor(Math.abs(n)), c = Math.round((Math.abs(n) - e) * 100);
  let s = ent(e).replace(/(veintiún|un)$/, m => m === 'un' ? 'uno' : 'veintiuno');  // "un" solo apocopa antes de sustantivo (mil, millón)
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return `${s} con ${String(c).padStart(2,'0')}/100.-`;
}

// ═══════════════════════════════════════════════════════════════════════
//  (8-oct-2026, JP) Diseño "Tarjetas": logo Claudia Adorno, URW Gothic,
//  bloque naranja con el número, secciones en tarjetas con banda gris,
//  total/retención en franja naranja clara. Mismo lenguaje que el módulo.
// ═══════════════════════════════════════════════════════════════════════
const _PC = { or: [234,88,12], tx: [15,23,42], mut: [100,116,139], bd: [226,232,240], soft: [248,250,252], fila: [241,245,249],
              amb: [255,247,237], ambBd: [254,215,170], ambTx: [154,52,18], blanco: [255,255,255], gris: [148,163,184] };
// (v143, JP) firma de JP para el certificado de retención (misma imagen que los recibos de RRHH)
let _pdfFirma = null;
async function _pdfCargarFirma(){
  if (_pdfFirma) return _pdfFirma;
  try {
    const r = await fetch('./firma-jp.jpg'); if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = await r.blob();
    _pdfFirma = await new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = no; fr.readAsDataURL(b); });
  } catch (e) { console.warn('Firma no disponible', e); _pdfFirma = null; }
  return _pdfFirma;
}
let _pdfLogo = null;
async function _pdfCargarLogo(){
  if (_pdfLogo) return _pdfLogo;
  try {
    const r = await fetch('./logo-ca.png'); if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = await r.blob();
    _pdfLogo = await new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = no; fr.readAsDataURL(b); });
  } catch (e) { console.warn('Logo no disponible', e); _pdfLogo = null; }
  return _pdfLogo;
}
// Texto con "negrita" simulada (la fuente institucional solo viene en Book): relleno + trazo fino.
function _pt(doc, t, x, y, o = {}){
  const col = o.col || _PC.tx;
  doc.setTextColor(...col); doc.setFontSize(o.size || 8.5);
  const opt = { align: o.align || 'left' };
  if (o.maxWidth) opt.maxWidth = o.maxWidth;
  if (o.charSpace) opt.charSpace = o.charSpace;
  if (o.bold){ doc.setDrawColor(...col); doc.setLineWidth(o.size >= 12 ? 0.35 : 0.22); opt.renderingMode = 'fillAndStroke'; }
  doc.text(String(t ?? ''), x, y, opt);
  if (o.bold){ doc.setDrawColor(...(_PC.bd)); doc.setLineWidth(0.2); }
}
// Cabecera común: logo + datos de la empresa a la izquierda, bloque naranja a la derecha.
function _pdfCabTarjetas(doc, emp, bloque){
  if (_pdfLogo) doc.addImage(_pdfLogo, 'PNG', 14, 13, 58, 58 * 272 / 2432);
  else _pt(doc, 'Claudia Adorno', 14, 19, {size: 16, col: _PC.gris});
  _pt(doc, `${emp.nombre} · CUIT ${_pdfCuit(emp.cuit)} · ${emp.cond_iva}`, 14, 25, {size: 6.5, col: _PC.mut, maxWidth: 108});
  _pt(doc, `${emp.domicilio} · ${emp.localidad || ''}`, 14, 28.3, {size: 6.5, col: _PC.mut, maxWidth: 108});
  _pt(doc, `IIBB ${emp.iibb} · Inicio de actividades ${emp.inicio_actividades}`, 14, 31.6, {size: 6.5, col: _PC.mut, maxWidth: 108});
  doc.setFillColor(..._PC.or); doc.roundedRect(128, 12, 68, 21, 2.5, 2.5, 'F');
  _pt(doc, bloque.titulo.toUpperCase(), 192, 17.5, {size: 5.6, col: _PC.blanco, align: 'right', charSpace: 0.25});
  _pt(doc, bloque.numero, 192, 24.5, {size: 12.5, col: _PC.blanco, align: 'right', bold: true});
  _pt(doc, bloque.pie, 192, 30, {size: 7, col: _PC.blanco, align: 'right'});
  return 40;
}
// Tarjeta: devuelve el y donde arranca el contenido; se cierra con _pdfCardFin.
function _pdfCardIni(doc, x, y, w, titulo, letra){
  doc.setFillColor(..._PC.soft); doc.roundedRect(x, y, w, 7, 2, 2, 'F'); doc.rect(x, y + 4, w, 3, 'F');
  let tx = x + 4;
  if (letra){ doc.setFillColor(..._PC.or); doc.circle(x + 5.5, y + 3.5, 2.1, 'F'); _pt(doc, letra, x + 5.5, y + 4.6, {size: 6, col: _PC.blanco, align: 'center', bold: true}); tx = x + 10; }
  _pt(doc, titulo.toUpperCase(), tx, y + 4.7, {size: 6.3, col: _PC.mut, charSpace: 0.35});
  doc.setDrawColor(..._PC.bd); doc.setLineWidth(0.2); doc.line(x, y + 7, x + w, y + 7);
  return y + 7;
}
function _pdfCardFin(doc, x, y0, w, y){
  doc.setDrawColor(..._PC.bd); doc.setLineWidth(0.25); doc.roundedRect(x, y0, w, y - y0, 2, 2, 'S');
  return y + 5;
}
// Tabla dentro de una tarjeta. cols: [{t, x, align, w}], filas: array de arrays de celdas, tot: fila final
function _pdfTabla(doc, x, w, y, cols, filas, tot, salto){
  const enc = () => { cols.forEach(c => _pt(doc, c.t.toUpperCase(), c.x, y + 4.3, {size: 6, col: _PC.mut, align: c.align || 'left', charSpace: 0.3}));
    y += 6.2; doc.setDrawColor(..._PC.bd); doc.line(x, y, x + w, y); };
  enc();
  filas.forEach(f => {
    if (salto && y > 262) { y = salto(y); enc(); }
    y += 5.2;
    f.forEach((cel, i) => { const c = cols[i]; _pt(doc, cel, c.x, y, {size: 8, col: c.mut ? _PC.mut : _PC.tx, align: c.align || 'left', maxWidth: c.w}); });
    y += 1.8; doc.setDrawColor(..._PC.fila); doc.line(x, y, x + w, y);
  });
  if (tot){ doc.setFillColor(250, 250, 250); doc.rect(x, y, w, 7, 'F'); y += 5;
    tot.forEach((cel, i) => { if (cel == null) return; const c = cols[i]; _pt(doc, cel, c.x, y, {size: 8, align: c.align || 'left', bold: true}); }); y += 2; }
  return y;
}
function _pdfFranja(doc, y, titulo, sub, monto){
  doc.setFillColor(..._PC.amb); doc.setDrawColor(..._PC.ambBd); doc.setLineWidth(0.25); doc.roundedRect(14, y, 182, 16, 2.5, 2.5, 'FD');
  _pt(doc, titulo, 19, y + 6.5, {size: 9, col: _PC.ambTx, bold: true});
  _pt(doc, sub, 19, y + 11.5, {size: 6.8, col: _PC.ambTx, maxWidth: 110});
  _pt(doc, monto, 191, y + 10.8, {size: 15, col: _PC.or, align: 'right', bold: true});
  doc.setDrawColor(..._PC.bd);
  return y + 21;
}
function _pdfPie(doc, izq, firma, prueba){
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++){
    doc.setPage(p);
    doc.setDrawColor(..._PC.bd); doc.setLineWidth(0.2); doc.line(14, 281, 196, 281);
    _pt(doc, izq, 14, 285, {size: 6.5, col: _PC.gris});
    _pt(doc, 'Compras Adorno' + (n > 1 ? ` · página ${p} de ${n}` : ''), 196, 285, {size: 6.5, col: _PC.gris, align: 'right'});
    if (prueba) _pt(doc, 'AMBIENTE DE PRUEBA', 105, 291, {size: 7, col: [203,213,225], align: 'center', charSpace: 1});
  }
  doc.setPage(n);
  if (firma){
    doc.setDrawColor(..._PC.tx); doc.setLineWidth(0.3); doc.line(firma.x, 266, firma.x + firma.w, 266);
    _pt(doc, firma.t1, firma.x + firma.w / 2, 270, {size: 7, col: _PC.tx, align: 'center'});
    if (firma.t2) _pt(doc, firma.t2, firma.x + firma.w / 2, 273.5, {size: 6.3, col: _PC.mut, align: 'center'});
    doc.setDrawColor(..._PC.bd);
  }
}

// ── ORDEN DE PAGO ─────────────────────────────────────────────────────
async function descargarOpPdf(opId){
  const {data, error} = await sb.rpc('compras_op_detalle', {p_op: opId});
  if (error){ alert(error.message); return; }
  const o = data.orden, f = data.facturas || [], r = (data.retenciones || []).filter(x => Number(x.importe) > 0), pg = data.pagos || [], pv = data.proveedor || {}, emp = data.empresa;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit: 'mm', format: 'a4'});
  const fnt = (await _opCargarFuente(doc)) ? 'AdornoTitulo' : 'helvetica';
  doc.setFont(fnt, 'normal'); await _pdfCargarLogo();
  const nro = `${String(o.punto_venta).padStart(4,'0')}-${String(o.numero).padStart(8,'0')}`;
  const nuevaPagina = () => { doc.addPage(); doc.setFont(fnt, 'normal'); return 16; };
  let y = _pdfCabTarjetas(doc, emp, {titulo: 'Orden de pago', numero: `${o.letra || 'X'} ${nro}`, pie: _pdfF(o.fecha)});
  // proveedor + datos fiscales
  let y0 = y, yc = _pdfCardIni(doc, 14, y, 88, 'Proveedor');
  _pt(doc, pv.nombre || o.proveedor_nombre || '', 18, yc + 5.5, {size: 8.5, bold: true, maxWidth: 80});
  _pt(doc, [pv.domicilio, 'C.A.B.A.'].filter(Boolean).join(' · '), 18, yc + 10.5, {size: 7.5, col: _PC.mut, maxWidth: 80});
  _pdfCardFin(doc, 14, y0, 88, yc + 14);
  yc = _pdfCardIni(doc, 108, y, 88, 'Datos fiscales');
  _pt(doc, `CUIT ${_pdfCuit(pv.cuit || o.cuit_proveedor)}`, 112, yc + 5.5, {size: 8.5, bold: true});
  _pt(doc, `${pv.cond_iva === 'RI' ? 'IVA Responsable Inscripto' : (pv.cond_iva || (pv.es_exterior ? 'Exterior' : 'Responsable Inscripto'))}${pv.codigo ? ' · Código de proveedor ' + pv.codigo : ''}`, 112, yc + 10.5, {size: 7.5, col: _PC.mut, maxWidth: 80});
  y = _pdfCardFin(doc, 108, y0, 88, yc + 14);
  // comprobantes
  const tipoNom = {FC: 'Factura', NC: 'Nota de crédito', ND: 'Nota de débito', INT: 'Comprobante interno'};
  y0 = y; yc = _pdfCardIni(doc, 14, y, 182, 'Comprobantes cancelados');
  const colsF = [{t:'Emisión', x:18}, {t:'Vencimiento', x:42}, {t:'Comprobante', x:68, w:70}, {t:'Neto', x:160, align:'right', mut:true}, {t:'Importe', x:192, align:'right'}];
  y = _pdfTabla(doc, 14, 182, yc, colsF, f.map(x => [_pdfF(x.fecha), _pdfF(x.vencimiento), `${tipoNom[x.tipo] || x.tipo} ${x.letra || ''} ${String(x.punto_venta||0).padStart(4,'0')}-${String(x.numero||0).padStart(8,'0')}`, _pdfN(x.neto), _pdfN(x.total)]),
    ['Subtotal', null, null, null, _pdfN(o.subtotal)], yy => { _pdfCardFin(doc, 14, y0, 182, yy); const n = nuevaPagina(); y0 = n; return _pdfCardIni(doc, 14, n, 182, 'Comprobantes cancelados (cont.)'); });
  y = _pdfCardFin(doc, 14, y0, 182, y);
  if (y > 230) y = nuevaPagina();
  // retenciones
  y0 = y; yc = _pdfCardIni(doc, 14, y, 182, 'Retenciones practicadas');
  if (r.length){
    const colsR = [{t:'Régimen', x:18}, {t:'Certificado', x:114}, {t:'Base', x:158, align:'right', mut:true}, {t:'Alíc.', x:172, align:'right'}, {t:'Importe', x:192, align:'right'}];
    const corto = (t, n) => { t = String(t || ''); return t.length > n ? t.slice(0, n - 1).trim() + '…' : t; };
    y = _pdfTabla(doc, 14, 182, yc, colsR, r.map(x => [corto(`${x.codigo} · ${x.nombre || ''}`, 48), x.certificado_nro || '—', _pdfN(x.base_calculo), x.alicuota != null ? Number(x.alicuota) + ' %' : '—', _pdfN(x.importe)]),
      ['Total retenido', null, null, null, _pdfN(o.retenciones_total)]);
  } else { _pt(doc, 'Sin retenciones.', 18, yc + 5.5, {size: 8, col: _PC.mut}); y = yc + 8; }
  y = _pdfCardFin(doc, 14, y0, 182, y);
  // total a pagar
  y = _pdfFranja(doc, y, 'Total a pagar', `Son pesos ${_pdfLetras(o.neto_a_pagar).toLowerCase()}`, `$ ${_pdfN(o.neto_a_pagar)}`);
  // valores entregados
  y0 = y; yc = _pdfCardIni(doc, 14, y, 182, 'Valores entregados');
  const colsP = [{t:'Medio', x:18}, {t:'Detalle', x:60, w:100, mut:true}, {t:'Importe', x:192, align:'right'}];
  y = _pdfTabla(doc, 14, 182, yc, colsP, pg.map(p => {
    let d = p.cuenta ? 'Cuenta ' + p.cuenta : '';
    if (p.cheque_numero || p.cheque_banco || p.cheque_fecha) d += (d ? ' · ' : '') + [p.cheque_numero ? 'N° ' + p.cheque_numero : '', p.cheque_banco, p.cheque_emision ? 'emisión ' + _pdfF(p.cheque_emision) : '', p.cheque_fecha ? 'pago ' + _pdfF(p.cheque_fecha) : ''].filter(Boolean).join(' · ');
    if (p.notas) d += (d ? ' · ' : '') + p.notas;
    return [p.medio, d || '—', _pdfN(p.importe)];
  }), pg.length > 1 ? ['Total', null, _pdfN(pg.reduce((a, p) => a + Number(p.importe || 0), 0))] : null);
  y = _pdfCardFin(doc, 14, y0, 182, y);
  if (o.observaciones){
    y0 = y; yc = _pdfCardIni(doc, 14, y, 182, 'Observaciones');
    const lin = doc.splitTextToSize(String(o.observaciones), 174);
    _pt(doc, lin, 18, yc + 5.5, {size: 8}); y = _pdfCardFin(doc, 14, y0, 182, yc + 3 + lin.length * 4.2);
  }
  _pdfPie(doc, `Orden de pago ${o.letra || 'X'} ${nro} · emitida el ${_pdfF(o.fecha)} por ${o.emitida_por || ''}`, {x: 136, w: 60, t1: `Por ${emp.nombre}`}, o.es_prueba);
  doc.save(`OP ${nro} ${(pv.nombre || '').replace(/[\\/:*?"<>|]/g,'')}.pdf`);
}

// ── CERTIFICADO DE RETENCIÓN (uno por régimen retenido) ───────────────
async function descargarCertificadosPdf(opId){
  const {error: eN} = await sb.rpc('compras_op_certificados', {p_op: opId});   // numera los que falten
  if (eN){ alert(eN.message); return; }
  const {data, error} = await sb.rpc('compras_op_detalle', {p_op: opId});
  if (error){ alert(error.message); return; }
  const o = data.orden, f = data.facturas || [], rets = (data.retenciones || []).filter(x => Number(x.importe) > 0), pv = data.proveedor || {}, emp = data.empresa;
  if (!rets.length){ alert('Esta orden no practicó retenciones: no hay certificado para emitir.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit: 'mm', format: 'a4'});
  const fnt = (await _opCargarFuente(doc)) ? 'AdornoTitulo' : 'helvetica';
  doc.setFont(fnt, 'normal'); await _pdfCargarLogo();
  await _pdfCargarFirma();
  const IMP = {ganancias: 'Impuesto a las ganancias', iibb: 'Ingresos Brutos', iva: 'Impuesto al valor agregado', suss: 'SUSS'};
  const nroOP = `${o.letra || 'X'} ${String(o.punto_venta).padStart(4,'0')}-${String(o.numero).padStart(8,'0')}`;
  const montoComp = f.reduce((a, x) => a + Number(x.total || 0), 0);
  const tipoNom = {FC: 'Factura', NC: 'Nota de crédito', ND: 'Nota de débito', INT: 'Comprobante interno'};
  const nuevaPagina = () => { doc.addPage(); doc.setFont(fnt, 'normal'); return 16; };
  rets.forEach((r, idx) => {
    if (idx) nuevaPagina();
    const imp = IMP[r.impuesto] || r.impuesto || 'Impuesto a las ganancias';
    const regimen = r.regimen_nombre || r.nombre || '';
    let y = _pdfCabTarjetas(doc, emp, {titulo: 'Certificado de retención', numero: r.certificado_nro || '—', pie: _pdfF(o.fecha)});
    _pt(doc, 'Retención de ', 14, y + 2, {size: 12});
    const w1 = doc.getTextWidth('Retención de ');
    _pt(doc, imp, 14 + w1, y + 2, {size: 12, col: _PC.or, bold: true});
    y += 7;
    // A y B
    let y0 = y, yc = _pdfCardIni(doc, 14, y, 88, 'Agente de retención', 'A');
    _pt(doc, emp.nombre, 18, yc + 5.5, {size: 8.5, bold: true});
    _pt(doc, `CUIT ${_pdfCuit(emp.cuit)}`, 18, yc + 10, {size: 7.5, col: _PC.mut});
    _pt(doc, `${emp.domicilio} · ${emp.localidad}`, 18, yc + 14, {size: 7.5, col: _PC.mut, maxWidth: 80});
    _pdfCardFin(doc, 14, y0, 88, yc + 17.5);
    yc = _pdfCardIni(doc, 108, y, 88, 'Sujeto retenido', 'B');
    _pt(doc, pv.nombre || o.proveedor_nombre || '', 112, yc + 5.5, {size: 8.5, bold: true, maxWidth: 80});
    _pt(doc, `CUIT ${_pdfCuit(pv.cuit || o.cuit_proveedor)}`, 112, yc + 10, {size: 7.5, col: _PC.mut});
    _pt(doc, pv.domicilio || '', 112, yc + 14, {size: 7.5, col: _PC.mut, maxWidth: 80});
    y = _pdfCardFin(doc, 108, y0, 88, yc + 17.5);
    // C
    y0 = y; yc = _pdfCardIni(doc, 14, y, 182, 'Retención practicada', 'C');
    const kv = [['Impuesto', imp], ['Régimen', regimen],
      ['Comprobante que origina la retención', `Orden de pago ${nroOP} · ${f.length} comprobante${f.length === 1 ? '' : 's'} (detalle abajo)`],
      ['Monto de los comprobantes', `$ ${_pdfN(montoComp)}`], ['Base de cálculo', `$ ${_pdfN(r.base_calculo)}`],
      ['Alícuota', r.alicuota != null ? Number(r.alicuota) + ' %' : '—']];
    if (r.editado && r.motivo_edicion) kv.push(['Observación', r.motivo_edicion]);
    let yk = yc + 2;
    kv.forEach(([k, v]) => { yk += 4.6; _pt(doc, k, 18, yk, {size: 7.8, col: _PC.mut}); _pt(doc, v, 78, yk, {size: 7.8, maxWidth: 114}); });
    y = _pdfCardFin(doc, 14, y0, 182, yk + 3);
    // comprobantes alcanzados
    y0 = y; yc = _pdfCardIni(doc, 14, y, 182, 'Comprobantes alcanzados por la retención');
    const colsF = [{t:'Emisión', x:18}, {t:'Comprobante', x:44, w:90}, {t:'Neto', x:160, align:'right', mut:true}, {t:'Importe', x:192, align:'right'}];
    y = _pdfTabla(doc, 14, 182, yc, colsF, f.map(x => [_pdfF(x.fecha), `${tipoNom[x.tipo] || x.tipo} ${x.letra || ''} ${String(x.punto_venta||0).padStart(4,'0')}-${String(x.numero||0).padStart(8,'0')}`, _pdfN(x.neto), _pdfN(x.total)]),
      [`Total · ${f.length} comprobante${f.length === 1 ? '' : 's'}`, null, _pdfN(f.reduce((a, x) => a + Number(x.neto || 0), 0)), _pdfN(montoComp)],
      yy => { _pdfCardFin(doc, 14, y0, 182, yy); const n = nuevaPagina(); y0 = n; return _pdfCardIni(doc, 14, n, 182, 'Comprobantes alcanzados (cont.)'); });
    y = _pdfCardFin(doc, 14, y0, 182, y);
    if (y > 240) y = nuevaPagina();
    _pdfFranja(doc, y, 'Monto de la retención', `Son pesos ${_pdfLetras(r.importe).toLowerCase()}`, `$ ${_pdfN(r.importe)}`);
    // firma de este certificado (en la página donde terminó); la imagen va apoyada sobre la línea
    if (_pdfFirma) doc.addImage(_pdfFirma, 'JPEG', 20, 239.5, 34, 34 * 258 / 382);
    doc.setDrawColor(..._PC.tx); doc.setLineWidth(0.3); doc.line(14, 262, 84, 262);
    _pt(doc, 'Firma del agente de retención', 14, 266, {size: 7});
    _pt(doc, `${emp.firmante} · ${emp.cargo}`, 14, 269.5, {size: 6.3, col: _PC.mut});
    doc.setDrawColor(..._PC.bd);
  });
  _pdfPie(doc, `Certificado${rets.length > 1 ? 's' : ''} de retención · Orden de pago ${nroOP} · ${_pdfF(o.fecha)}`, null, o.es_prueba);
  doc.save(`Retencion OP ${nroOP.replace(/\s/g, ' ')} ${(pv.nombre || '').replace(/[\\/:*?"<>|]/g,'')}.pdf`);
}
