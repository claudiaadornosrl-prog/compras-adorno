// ═══════════════════════════════════════════════════════════════════════
//  Compras Adorno · op-pdf.js — PDF de la Orden de Pago y del Certificado
//  de Retención, con el mismo armado que emite hoy el Dragonfish (modelos
//  que pasó JP el 22-sep-2026: OP 0032-00003290 y ret 1139 Cencosud).
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

function _pdfCabecera(doc, emp, tituloDer, subDer, fnt){
  doc.setFont(fnt, 'bold'); doc.setFontSize(12); doc.text(emp.nombre, 14, 16);
  doc.setFont(fnt, 'normal'); doc.setFontSize(7.5);
  doc.text(emp.domicilio, 14, 21); doc.text('Buenos Aires - ARGENTINA', 14, 24.5);
  doc.text('TE.:', 14, 28); doc.text(emp.cond_iva, 14, 31.5);
  // recuadro X
  doc.setLineWidth(0.5); doc.rect(97, 11, 16, 16); doc.setFontSize(20); doc.setFont(fnt, 'bold'); doc.text('X', 105, 23, {align: 'center'});
  doc.setLineWidth(0.2); doc.line(105, 27, 105, 40);
  doc.setFontSize(11); doc.text(tituloDer, 118, 16);
  doc.setFont(fnt, 'normal'); doc.setFontSize(8);
  subDer.forEach((t, i) => doc.text(t, 118, 21 + i*3.6));
}

// ── ORDEN DE PAGO ─────────────────────────────────────────────────────
async function descargarOpPdf(opId){
  const {data, error} = await sb.rpc('compras_op_detalle', {p_op: opId});
  if (error){ alert(error.message); return; }
  const o = data.orden, f = data.facturas || [], r = (data.retenciones || []).filter(x => Number(x.importe) > 0), pg = data.pagos || [], pv = data.proveedor || {}, emp = data.empresa;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit: 'mm', format: 'a4'});
  const fnt = (await _opCargarFuente(doc)) ? 'AdornoTitulo' : 'helvetica';
  const nro = `${String(o.punto_venta).padStart(4,'0')}-${String(o.numero).padStart(8,'0')}`;
  _pdfCabecera(doc, emp, `ORDEN DE PAGO N°   ${nro}`, [
    `FECHA: ${_pdfF(o.fecha)}`, `CUIT: ${emp.cuit}`, `IIBB: ${emp.iibb}`, `Inicio de actividades:   ${emp.inicio_actividades}`], fnt);
  doc.setFontSize(7); doc.text('Página 1 de 1', 196, 38, {align: 'right'});
  doc.line(14, 41, 196, 41);
  // proveedor
  doc.setFontSize(8);
  doc.text(`${pv.nombre || ''}${pv.codigo ? ' (' + pv.codigo + ')' : ''}`, 14, 46);
  doc.text(pv.domicilio || '', 14, 50); doc.text('C.A.B.A., Argentina', 14, 54);
  doc.text('N° Documento:', 118, 46); doc.text(`CUIT: ${_pdfCuit(pv.cuit)}`, 118, 50); doc.text(pv.cond_iva || (pv.es_exterior ? 'Exterior' : 'Responsable Inscripto'), 118, 54);
  // detalle comprobantes
  let y = 61;
  doc.setFont(fnt, 'bold'); doc.text('Detalle de comprobantes cancelados', 14, y); doc.setFont(fnt, 'normal'); y += 4;
  doc.line(14, y, 196, y); y += 3.5;
  doc.text('Fecha', 14, y); doc.text('Emisión', 38, y); doc.text('Vencimiento', 62, y); doc.text('Comprobante', 90, y); doc.text('Monto', 196, y, {align: 'right'}); y += 1.5;
  doc.line(14, y, 196, y); y += 4;
  const tipoNom = {FC: 'Factura De Compra', NC: 'Nota De Crédito', ND: 'Nota De Débito', INT: 'Comprobante Interno'};
  f.forEach(x => {
    doc.text(_pdfF(o.fecha), 14, y); doc.text(_pdfF(x.fecha), 38, y); doc.text(_pdfF(x.vencimiento), 62, y);
    doc.text(`${tipoNom[x.tipo] || x.tipo} ${x.letra || ''} ${String(x.punto_venta||0).padStart(5,'0')}-${String(x.numero||0).padStart(8,'0')}`, 90, y);
    doc.text(_pdfN(x.total), 196, y, {align: 'right'}); y += 4;
  });
  y = Math.max(y, 150);
  doc.line(14, y, 196, y); y += 4;
  doc.text('Subtotal', 150, y); doc.text(_pdfN(o.subtotal), 196, y, {align: 'right'}); y += 4;
  // retenciones
  doc.setFont(fnt, 'bold'); doc.text('Retenciones aplicadas', 14, y); doc.setFont(fnt, 'normal'); y += 2; doc.line(14, y, 196, y); y += 4;
  r.forEach(x => { doc.text(`${x.codigo} · ${x.nombre}${x.certificado_nro ? ' · Cert. ' + x.certificado_nro : ''}`, 14, y); doc.text(_pdfN(x.importe), 196, y, {align: 'right'}); y += 4; });
  doc.line(14, y, 196, y); y += 4;
  doc.text('Subtotal', 150, y); doc.text(_pdfN(o.retenciones_total), 196, y, {align: 'right'}); y += 5;
  // valores
  doc.setFont(fnt, 'bold'); doc.text('Detalle de valores otorgados', 14, y); doc.setFont(fnt, 'normal'); y += 2; doc.line(14, y, 196, y); y += 3.5;
  doc.text('Valor', 14, y); doc.text('Descripción', 34, y); doc.text('Monto', 196, y, {align: 'right'}); y += 1.5; doc.line(14, y, 196, y); y += 4;
  const cod = m => /transf/i.test(m) ? 'TRANS' : /echeq/i.test(m) ? 'ECHEQ' : /cheq/i.test(m) ? 'CHEQ' : /efect/i.test(m) ? 'EFEC' : /mercado/i.test(m) ? 'MP' : String(m||'').slice(0,6).toUpperCase();
  const desc = m => /transf/i.test(m) ? 'Transferencias Bancarias' : m;
  pg.forEach(p => {
    let d = desc(p.medio);
    if (p.cheque_numero || p.cheque_banco || p.cheque_fecha) d += ` (${[p.cheque_numero ? 'N° ' + p.cheque_numero : '', p.cheque_banco, p.cheque_emision ? 'emisión ' + _pdfF(p.cheque_emision) : '', p.cheque_fecha ? 'pago ' + _pdfF(p.cheque_fecha) : ''].filter(Boolean).join(' · ')})`;
    doc.text(cod(p.medio), 14, y); doc.text(d, 34, y); doc.text(_pdfN(p.importe), 196, y, {align: 'right'}); y += 4;
  });
  y += 6; doc.setFont(fnt, 'bold'); doc.text('Saldo de Cuenta Corriente', 14, y); doc.setFont(fnt, 'normal'); y += 2; doc.line(14, y, 196, y); y += 8;
  doc.setFont(fnt, 'bold'); doc.text('Observaciones', 14, y); doc.setFont(fnt, 'normal'); y += 2; doc.line(14, y, 196, y); y += 5;
  if (o.observaciones) doc.text(String(o.observaciones), 14, y, {maxWidth: 180});
  // pie
  let yb = 262;
  doc.line(14, yb, 196, yb); yb += 4; doc.text('Subtotal', 150, yb); doc.text(_pdfN(o.neto_a_pagar), 196, yb, {align: 'right'}); yb += 3; doc.line(14, yb, 196, yb); yb += 6;
  doc.text('Vuelto', 150, yb); yb += 6;
  doc.setFont(fnt, 'bold'); doc.setFontSize(10); doc.text('TOTAL    $', 150, yb); doc.text(_pdfN(o.neto_a_pagar), 196, yb, {align: 'right'});
  doc.setFont(fnt, 'normal'); doc.setFontSize(8); doc.text(`Son PESOS: ${_pdfLetras(o.neto_a_pagar)}`, 14, yb + 3);
  doc.text(`Por ${emp.nombre}`, 150, yb + 12);
  if (o.es_prueba){ doc.setTextColor(180); doc.setFontSize(9); doc.text('AMBIENTE DE PRUEBA', 105, 290, {align: 'center'}); doc.setTextColor(0); }
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
  const IMP = {ganancias: 'Impuesto a las ganancias', iibb: 'Ingresos Brutos', iva: 'Impuesto al valor agregado', suss: 'SUSS'};
  const nroOP = `${String(o.punto_venta).padStart(4,'0')}-${String(o.numero).padStart(8,'0')}`;
  const montoComp = f.reduce((a, x) => a + Number(x.total || 0), 0);
  rets.forEach((r, idx) => {
    if (idx) doc.addPage();
    const imp = IMP[r.impuesto] || r.impuesto || 'Impuesto a las ganancias';
    let y = 18;
    doc.setFont(fnt, 'bold'); doc.setFontSize(12); doc.text('Comprobante de retención', 105, y, {align: 'center'}); y += 6;
    doc.setFontSize(10); doc.text(imp, 105, y, {align: 'center'}); y += 8;
    doc.setFont(fnt, 'normal'); doc.setFontSize(9);
    doc.text(`Certificado Nro.:     ${r.certificado_nro || '—'}`, 14, y); doc.text(`FECHA:     ${_pdfF(o.fecha)}`, 140, y); y += 8;
    const sec = (t) => { doc.setFont(fnt, 'bold'); doc.text(t, 14, y); doc.setFont(fnt, 'normal'); y += 2; doc.line(14, y, 196, y); y += 5; };
    const fila = (k, v) => { doc.text(k, 14, y); doc.text(String(v ?? ''), 88, y, {maxWidth: 108}); y += 5; };
    sec('A. - Datos del agente de retención');
    fila('Apellido y nombre / Denominación:', emp.nombre); fila('C.U.I.T.:', emp.cuit); fila('Domicilio:', `${emp.domicilio} - ${emp.localidad}`); y += 4;
    sec('B. - Datos del sujeto retenido');
    fila('Apellido y nombre / Denominación:', pv.nombre || ''); fila('C.U.I.T.:', pv.cuit || ''); fila('Domicilio:', pv.domicilio || ''); y += 4;
    sec('C. - Datos de la retención practicada');
    fila('Impuesto:', imp); fila('Régimen:', r.regimen_nombre || r.nombre);
    fila('Comprobante que origina la retención:', `Orden de pago ${nroOP}` + (f.length ? ` (${f.map(x => x.comprobante).join(', ')})` : ''));
    fila('Monto del comprobante que origina la retención:', _pdfN(montoComp));
    fila('Base de cálculo:', _pdfN(r.base_calculo)); fila('Alícuota:', (r.alicuota != null ? Number(r.alicuota) + ' %' : '—'));
    doc.setFont(fnt, 'bold'); fila('Monto de la retención:', _pdfN(r.importe)); doc.setFont(fnt, 'normal');
    if (r.editado && r.motivo_edicion) fila('Observación:', r.motivo_edicion);
    y += 20;
    doc.line(14, y, 90, y); y += 4; doc.text('Firma del agente de retención:', 14, y); y += 6;
    doc.text(`Aclaración: ${emp.firmante}                 Cargo: ${emp.cargo}`, 14, y);
    doc.setFontSize(7); doc.setTextColor(120); doc.text('Comprobante generado por Compras Adorno', 14, 285); doc.setTextColor(0);
    if (o.es_prueba){ doc.setTextColor(180); doc.setFontSize(9); doc.text('AMBIENTE DE PRUEBA', 105, 290, {align: 'center'}); doc.setTextColor(0); }
  });
  doc.save(`Retencion OP ${nroOP} ${(pv.nombre || '').replace(/[\\/:*?"<>|]/g,'')}.pdf`);
}
