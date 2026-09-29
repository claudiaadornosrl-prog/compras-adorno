// ═══════════════════════════════════════════════════════════════════════
//  📥 Importar equivalencias desde el Excel del proveedor (29-sep, pedido Contreras)
//
//  Paso 1: proveedor + archivo (xlsx / xls / csv). Paso 2: qué columna es el
//  código del proveedor, cuál la descripción y (si la trae) cuál nuestro SKU.
//  Paso 3: el sistema propone el SKU fila por fila (compras_equivalencias_proponer,
//  mismo buscador que el modal de 🔗) y la persona revisa: se guarda SOLO lo tildado
//  (compras_equivalencias_importar, que usa la misma función que el modal).
//  Usa _pedProvs / _pedProvTxt / _pedXlsx de pedidos.js.
// ═══════════════════════════════════════════════════════════════════════
let EQI = null;   // {prov, filas:[[celdas]], hdr, cols:{cod,desc,sku}, items:[...], filtro}

const EQI_ESTADOS = {
  sku_excel:     ['SKU del Excel', '#15803d', 'El Excel trae nuestro SKU y existe en el catálogo.'],
  es_nuestro:    ['ya es nuestro SKU', '#15803d', 'El código del proveedor es igual a un SKU nuestro. Conviene guardarlo igual: así el motor lo reconoce en las facturas.'],
  ya_cargada:    ['ya cargada', '#64748b', 'Este código ya tiene equivalencia. Si tildás la fila, se reemplaza por el SKU que pongas.'],
  propuesta:     ['propuesta', '#b45309', 'El sistema buscó un artículo parecido por la descripción. Revisalo: el parecido es de texto y no entiende de colores ni talles.'],
  sin_candidato: ['sin parecido', '#b91c1c', 'No encontré ningún artículo parecido. Escribí el SKU a mano o dejalo sin tildar.'],
  sku_invalido:  ['SKU inexistente', '#b91c1c', 'El SKU que trae el Excel no existe en el catálogo.'],
  manual:        ['a mano', '#1d4ed8', 'SKU escrito a mano.'],
};

function _eqiNorm(s){ return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim(); }

async function abrirImportarEquiv(){
  EQI = {prov: null, filas: [], hdr: 0, cols: {cod: -1, desc: -1, sku: -1}, items: [], filtro: 'todos', archivo: ''};
  _eqiPintar('Cargando proveedores…');
  await _pedProvs();
  _eqiPintar();
}

function _eqiCerrar(){
  const o = document.getElementById('eqi-overlay'); if (o) o.remove();
  document.body.style.overflow = '';
  EQI = null;
}

function _eqiElegirProv(v){
  const m = String(v||'').match(/\[([^\]]+)\]\s*$/);
  const p = m ? (PED_PROVS||[]).find(x => x.codigo === m[1]) : null;
  if (!p){ if (v) alert('Elegí el proveedor de la lista.'); EQI.prov = null; _eqiPintar(); return; }
  if (!/^\d{11}$/.test(p.cuit_norm || '')){ alert('Ese proveedor no tiene CUIT cargado: las equivalencias se guardan por CUIT.'); EQI.prov = null; _eqiPintar(); return; }
  EQI.prov = p; EQI.items = []; _eqiPintar();
}

async function _eqiArchivo(inp){
  const f = inp.files && inp.files[0]; if (!f) return;
  try {
    const X = await _pedXlsx();
    const wb = X.read(await f.arrayBuffer(), {type: 'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const filas = X.utils.sheet_to_json(ws, {header: 1, raw: false, defval: ''})
      .map(r => r.map(c => String(c == null ? '' : c).trim()))
      .filter(r => r.some(c => c !== ''));
    if (!filas.length){ alert('El archivo no tiene filas.'); return; }
    EQI.filas = filas; EQI.archivo = f.name; EQI.items = [];
    EQI.hdr = _eqiDetectarEncabezado(filas);
    _eqiAdivinarColumnas();
    _eqiPintar();
  } catch (e){ alert('No pude leer el archivo: ' + e.message); }
}

// Encabezado = la primera fila (de las 15 primeras) con 2+ celdas de texto que no son números.
function _eqiDetectarEncabezado(filas){
  for (let i = 0; i < Math.min(15, filas.length - 1); i++){
    const txt = filas[i].filter(c => c && !/^[\d.,\s$%-]+$/.test(c));
    if (txt.length >= 2) return i;
  }
  return 0;
}
function _eqiAdivinarColumnas(){
  const h = (EQI.filas[EQI.hdr] || []).map(_eqiNorm);
  const busca = (re, no) => h.findIndex((c, i) => re.test(c) && !(no || []).includes(i));
  let sku  = busca(/\bsku\b|nuestro|adorno|cod.*interno/);
  let cod  = busca(/cod|art[ií]c|item|ref|modelo/, [sku]);
  let desc = busca(/desc|detalle|producto|nombre|articulo/, [sku, cod]);
  const n = Math.max(...EQI.filas.slice(EQI.hdr, EQI.hdr + 30).map(r => r.length), 0);
  if (cod < 0 && n > 0) cod = 0;
  if (desc < 0 && n > 1) desc = cod === 0 ? 1 : 0;
  EQI.cols = {cod, desc, sku};
}

function _eqiColOpts(sel, conNinguna){
  const h = EQI.filas[EQI.hdr] || [];
  const n = Math.max(...EQI.filas.slice(EQI.hdr, EQI.hdr + 30).map(r => r.length), 0);
  let o = conNinguna ? `<option value="-1"${sel < 0 ? ' selected' : ''}>(no trae)</option>` : '';
  for (let i = 0; i < n; i++){
    const letra = String.fromCharCode(65 + (i % 26));
    o += `<option value="${i}"${sel === i ? ' selected' : ''}>${letra} · ${esc(h[i] || '(sin título)')}</option>`;
  }
  return o;
}

function _eqiFilasDatos(){
  const {cod, desc, sku} = EQI.cols;
  return EQI.filas.slice(EQI.hdr + 1).map(r => ({
    codigo: cod >= 0 ? (r[cod] || '') : '',
    descripcion: desc >= 0 ? (r[desc] || '') : '',
    sku: sku >= 0 ? (r[sku] || '') : '',
  })).filter(x => x.codigo || x.descripcion);
}

async function _eqiBuscar(){
  if (!EQI.prov){ alert('Elegí el proveedor.'); return; }
  if (EQI.cols.cod < 0 && EQI.cols.desc < 0){ alert('Indicá al menos la columna del código o la de la descripción.'); return; }
  const datos = _eqiFilasDatos();
  if (!datos.length){ alert('No hay filas con código o descripción debajo del encabezado.'); return; }
  if (datos.length > 3000 && !confirm(`El archivo tiene ${datos.length} filas. Va a tardar unos minutos. ¿Seguimos?`)) return;
  EQI.items = [];
  const TANDA = 40;
  for (let i = 0; i < datos.length; i += TANDA){
    _eqiProgreso(`Buscando equivalencias… ${Math.min(i + TANDA, datos.length)} de ${datos.length}`);
    const lote = datos.slice(i, i + TANDA);
    const {data, error} = await sb.rpc('compras_equivalencias_proponer', {p_cuit: EQI.prov.cuit_norm, p_filas: lote});
    if (error){ alert('Error buscando: ' + error.message); _eqiPintar(); return; }
    (data || []).forEach(r => {
      if (r.estado === 'vacia') return;
      const it = {...r, sku: r.sku || '', skuOriginal: r.sku || ''};
      it.marcada = r.estado === 'sku_excel' || r.estado === 'es_nuestro'
        || (r.estado === 'propuesta' && Number(r.parecido) >= 0.75 && !r.eq_actual);
      EQI.items.push(it);
    });
  }
  EQI.filtro = 'todos';
  _eqiPintar();
}

function _eqiProgreso(txt){
  const el = document.getElementById('eqi-prog');
  if (el) el.textContent = txt; else _eqiPintar(txt);
}

function _eqiSku(i, v){
  const it = EQI.items[i]; if (!it) return;
  it.sku = String(v || '').trim().toUpperCase();
  if (it.sku !== it.skuOriginal){ it.estado = 'manual'; it.sku_descripcion = ''; it.parecido = null; }
  it.marcada = !!it.sku;
  const cb = document.getElementById('eqi-cb-' + i); if (cb) cb.checked = it.marcada;
  _eqiContador();
}
function _eqiMarcar(i, v){ const it = EQI.items[i]; if (it){ it.marcada = !!v; _eqiContador(); } }
function _eqiMarcarVisibles(v){ _eqiVisibles().forEach(({it}) => { it.marcada = v && !!it.sku; }); _eqiPintar(); }
function _eqiFiltro(f){ EQI.filtro = f; _eqiPintar(); }
function _eqiVisibles(){
  return EQI.items.map((it, i) => ({it, i})).filter(({it}) => {
    switch (EQI.filtro){
      case 'listas':   return ['sku_excel','es_nuestro'].includes(it.estado) || (it.estado === 'propuesta' && Number(it.parecido) >= 0.75);
      case 'revisar':  return it.estado === 'propuesta' && Number(it.parecido) < 0.75;
      case 'sin':      return ['sin_candidato','sku_invalido'].includes(it.estado);
      case 'cargadas': return it.estado === 'ya_cargada' || !!it.eq_actual;
      case 'marcadas': return it.marcada;
      default: return true;
    }
  });
}
function _eqiContador(){
  const n = EQI.items.filter(it => it.marcada && it.sku).length;
  const b = document.getElementById('eqi-guardar');
  if (b){ b.textContent = `✓ Guardar ${n} equivalencia${n === 1 ? '' : 's'}`; b.disabled = !n; }
}

async function _eqiGuardar(){
  const filas = EQI.items.filter(it => it.marcada && it.sku)
    .map(it => ({codigo: it.codigo || '', descripcion: it.descripcion || '', sku: it.sku}));
  if (!filas.length){ alert('No hay filas tildadas con SKU.'); return; }
  const reemplazan = EQI.items.filter(it => it.marcada && it.sku && it.eq_actual && it.eq_actual !== it.sku).length;
  if (!confirm(`Se van a guardar ${filas.length} equivalencias de ${EQI.prov.nombre}.`
      + (reemplazan ? `\n\n⚠ ${reemplazan} reemplazan una equivalencia que ya existía.` : '')
      + '\n\nLas facturas y remitos pendientes de ese proveedor pasan solos al SKU. ¿Seguimos?')) return;
  let ok = 0, reng = 0, rem = 0; const errores = [];
  const TANDA = 100;
  for (let i = 0; i < filas.length; i += TANDA){
    _eqiProgreso(`Guardando… ${Math.min(i + TANDA, filas.length)} de ${filas.length}`);
    const {data, error} = await sb.rpc('compras_equivalencias_importar', {p_cuit: EQI.prov.cuit_norm, p_filas: filas.slice(i, i + TANDA)});
    if (error){ alert('Error guardando: ' + error.message + `\n\nSe llegaron a guardar ${ok}.`); break; }
    ok += data.guardadas || 0; reng += data.renglones || 0; rem += data.remito_lineas || 0;
    (data.errores || []).forEach(e => errores.push(e));
  }
  let msg = `✓ ${ok} equivalencias guardadas.`;
  if (reng || rem) msg += `\n${reng} renglón(es) de facturas y ${rem} de remitos quedaron traducidos.`;
  if (errores.length) msg += `\n\n⚠ ${errores.length} no se guardaron:\n` + errores.slice(0, 15)
    .map(e => `· ${e.codigo || e.descripcion} → ${e.sku}: ${e.error}`).join('\n') + (errores.length > 15 ? '\n…' : '');
  alert(msg);
  if (!errores.length){ _eqiCerrar(); if (typeof vistaEquivalencias === 'function') vistaEquivalencias(); }
  else {
    const malos = new Set(errores.map(e => (e.codigo || '') + '|' + (e.descripcion || '')));
    EQI.items = EQI.items.filter(it => malos.has((it.codigo || '') + '|' + (it.descripcion || '')));
    EQI.items.forEach(it => { it.estado = 'sku_invalido'; it.marcada = false; });
    EQI.filtro = 'todos'; _eqiPintar();
  }
}

function _eqiPintar(cargando){
  if (!EQI) return;
  const prov = EQI.prov;
  const h = EQI.filas[EQI.hdr] || [];
  const nDatos = EQI.filas.length ? _eqiFilasDatos().length : 0;
  const cuenta = f => { const g = EQI.filtro; EQI.filtro = f; const n = _eqiVisibles().length; EQI.filtro = g; return n; };

  let cuerpo;
  if (cargando) cuerpo = `<div class="vacio" id="eqi-prog">${esc(cargando)}</div>`;
  else if (!EQI.items.length) cuerpo = `
    <p class="mini" style="margin-bottom:10px">Sirve para cargar de una vez las equivalencias de todos los artículos de un
      proveedor (por ejemplo la lista de precios de LEXO). El Excel tiene que tener, como mínimo, una columna con el
      <b>código del proveedor</b> o con la <b>descripción</b>. Si además trae nuestro SKU, mejor: se usa tal cual.
      Si no lo trae, el sistema propone uno por parecido y vos revisás antes de guardar.</p>
    <div class="c-fila" style="margin-top:0;border-top:none;padding-top:0">
      <label style="flex:1;min-width:260px">1 · Proveedor
        <input list="eqi-dl-provs" value="${esc(prov ? _pedProvTxt(prov) : '')}" placeholder="Escribí el nombre o el CUIT…"
               onchange="_eqiElegirProv(this.value)">
        <datalist id="eqi-dl-provs">${(PED_PROVS||[]).map(p => `<option value="${esc(_pedProvTxt(p))}">`).join('')}</datalist></label>
      <label style="flex:1;min-width:220px">2 · Archivo (Excel o CSV)
        <input type="file" accept=".xlsx,.xls,.csv,.ods" onchange="_eqiArchivo(this)"></label>
    </div>
    ${EQI.filas.length ? `
      <div class="mini" style="margin-top:12px">📄 <b>${esc(EQI.archivo)}</b> · ${nDatos} filas con datos</div>
      <div class="c-fila">
        <label>Encabezado en la fila
          <input type="number" min="1" max="${EQI.filas.length}" value="${EQI.hdr + 1}" style="width:80px"
                 onchange="EQI.hdr=Math.max(0,Math.min(EQI.filas.length-1,Number(this.value)-1)); _eqiAdivinarColumnas(); _eqiPintar()"></label>
        <label style="min-width:200px">Código del proveedor
          <select onchange="EQI.cols.cod=Number(this.value); _eqiPintar()">${_eqiColOpts(EQI.cols.cod, true)}</select></label>
        <label style="min-width:200px">Descripción
          <select onchange="EQI.cols.desc=Number(this.value); _eqiPintar()">${_eqiColOpts(EQI.cols.desc, true)}</select></label>
        <label style="min-width:200px">Nuestro SKU (opcional)
          <select onchange="EQI.cols.sku=Number(this.value); _eqiPintar()">${_eqiColOpts(EQI.cols.sku, true)}</select></label>
      </div>
      <div class="mini" style="margin:10px 0 5px">Así se leen las primeras filas:</div>
      <div style="overflow-x:auto"><table><thead><tr><th>Código</th><th>Descripción</th><th>SKU</th></tr></thead>
        <tbody>${_eqiFilasDatos().slice(0, 5).map(x => `<tr><td><code>${esc(x.codigo)}</code></td><td>${esc(x.descripcion)}</td>
          <td>${esc(x.sku) || '<span class="mini">—</span>'}</td></tr>`).join('')}</tbody></table></div>
      <div style="margin-top:12px"><button class="act" onclick="_eqiBuscar()" ${prov ? '' : 'disabled title="Elegí el proveedor"'}>
        🔎 Buscar equivalencias de las ${nDatos} filas</button></div>` : ''}`;
  else {
    const vis = _eqiVisibles();
    const filtros = [['todos','Todas'],['listas','✓ Listas'],['revisar','⚠ Para revisar'],['sin','✗ Sin SKU'],['cargadas','Ya cargadas'],['marcadas','Tildadas']];
    cuerpo = `
      <div class="mini" style="margin-bottom:8px"><b>${esc(prov.nombre)}</b> · ${esc(EQI.archivo)} · ${EQI.items.length} artículos.
        Revisá la columna <b>Nuestro SKU</b>: se puede corregir escribiendo otro. Se guarda solo lo tildado.</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px">
        ${filtros.map(([k, t]) => `<button class="act ${EQI.filtro === k ? '' : 'gh'}" style="padding:4px 10px;font-size:12.5px"
            onclick="_eqiFiltro('${k}')">${t} (${cuenta(k)})</button>`).join('')}
        <span style="flex:1"></span>
        <button class="act gh" style="padding:4px 10px;font-size:12.5px" onclick="_eqiMarcarVisibles(true)">☑ Tildar visibles</button>
        <button class="act gh" style="padding:4px 10px;font-size:12.5px" onclick="_eqiMarcarVisibles(false)">☐ Destildar visibles</button>
      </div>
      <div style="overflow:auto;max-height:58vh"><table>
        <thead><tr><th></th><th>Su código</th><th>Cómo lo llama él</th><th>Nuestro SKU</th><th>Nuestro artículo</th><th>Estado</th></tr></thead>
        <tbody>${vis.length ? vis.map(({it, i}) => {
          const e = EQI_ESTADOS[it.estado] || [it.estado, '#64748b', ''];
          const par = it.parecido != null && it.estado === 'propuesta' ? ` · ${Number(it.parecido).toFixed(2)}` : '';
          return `<tr>
            <td><input type="checkbox" id="eqi-cb-${i}" ${it.marcada ? 'checked' : ''} onchange="_eqiMarcar(${i}, this.checked)"></td>
            <td><code>${esc(it.codigo || '—')}</code></td>
            <td>${esc(it.descripcion || '')}</td>
            <td><input value="${esc(it.sku)}" style="width:120px" placeholder="SKU" onchange="_eqiSku(${i}, this.value)"></td>
            <td class="mini">${esc(it.sku_descripcion || '')}${it.eq_actual && it.eq_actual !== it.sku ? `<br><span style="color:#b45309">hoy: ${esc(it.eq_actual)}</span>` : ''}</td>
            <td><span class="chip" style="background:${e[1]}1a;color:${e[1]}" title="${esc(e[2])}">${e[0]}${par}</span></td>
          </tr>`; }).join('') : '<tr><td colspan="6" class="vacio">Nada en este filtro.</td></tr>'}</tbody></table></div>
      <p class="mini" style="margin-top:8px">🚨 Las propuestas de menos de 0,75 de parecido vienen destildadas: el parecido es
        de texto y confunde colores y talles. Los sets que ustedes fraccionan en varios artículos se cargan de a uno con 🔗 Traducir.</p>
      <div id="eqi-prog" class="mini" style="margin-top:4px"></div>`;
  }

  const html = `<div class="c-box" style="max-width:1080px">
    <div class="c-head"><div style="flex:1"><div style="font-weight:700;font-size:16px">📥 Importar equivalencias desde Excel</div>
      <div style="font-size:12.5px;opacity:.9">${prov ? esc(prov.nombre) + ' · CUIT ' + esc(prov.cuit_norm) : 'Código del proveedor → nuestro SKU, de a muchos'}</div></div>
      <button class="m-x" onclick="_eqiCerrar()">✕</button></div>
    <div class="c-body">${cuerpo}</div>
    ${EQI.items.length ? `<div class="c-pie">
      <button class="act gh" onclick="EQI.items=[]; _eqiPintar()">← Volver al archivo</button>
      <div style="flex:1"></div>
      <button class="act gh" onclick="_eqiCerrar()">Cancelar</button>
      <button class="act" id="eqi-guardar" onclick="_eqiGuardar()">✓ Guardar</button></div>` : ''}
  </div>`;

  let ov = document.getElementById('eqi-overlay');
  if (!ov){
    ov = document.createElement('div'); ov.id = 'eqi-overlay';
    ov.addEventListener('click', e => { if (e.target === ov && confirm('¿Cerrar sin guardar?')) _eqiCerrar(); });
    document.body.appendChild(ov); document.body.style.overflow = 'hidden';
  }
  ov.innerHTML = html;
  if (EQI.items.length) _eqiContador();
}
