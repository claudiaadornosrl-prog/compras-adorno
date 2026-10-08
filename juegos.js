// ════════════════════════════════════════════════════════════════════
// 🧩 JUEGOS Y DESGLOSES (29-sep-2026, JP)
// Artículos que el proveedor factura como SET bajo un solo SKU (ej. SREDO) y
// que nosotros vendemos por separado (SREDO + SREDOCH). La RECETA dice qué
// piezas salen de cada juego (stock_juegos). Con eso:
//  · los TXT que genera el módulo ya suman las piezas (compras_remito_txt),
//  · para los TXT que manda FGR a los locales, la lista de abajo dice qué
//    desglose le toca cargar a cada local por remito y lo compara con los
//    movimientos DES que el local cargó en su Dragonfish (stock_desgloses_dragon,
//    lo sube sync_mercaderia.py todas las mañanas).
// Usa: sb, esc, fechaCorta, _fechaTs, toast (si existe).
// ════════════════════════════════════════════════════════════════════
const JG = { recetas: [], pend: [], vista: 'recetas', local: '', soloPend: true, busca: '', err: '' };

const _JG_EST = {
  pendiente: ['⏳ Sin cargar', '#92400e', '#fef3c7', 'El local todavía no cargó el desglose de este remito en el Dragonfish'],
  difiere:   ['⚠ Difiere',     '#991b1b', '#fee2e2', 'El local cargó un desglose pero no coincide con lo que corresponde'],
  ok:        ['✅ Cargado',     '#166534', '#dcfce7', 'El desglose cargado en el Dragonfish coincide con lo que corresponde'],
};
const _jgLocal = l => ({ alcorta: 'Alcorta', unicenter: 'Unicenter', oficina: 'Venta Online' }[l] || l || '—');
const _jgNum = n => { const x = Number(n || 0); return Number.isInteger(x) ? String(x) : x.toLocaleString('es-AR', { maximumFractionDigits: 2 }); };

async function cargarJuegosCard() {
  const el = document.getElementById('juegos-card');
  if (!el) return;
  el.innerHTML = '<div class="card"><span class="mini">🧩 Cargando juegos y desgloses…</span></div>';
  const [r1, r2] = await Promise.all([
    sb.rpc('stock_juegos_listar'),
    sb.rpc('stock_desgloses_pendientes', { p_desde: null, p_local: null }),
  ]);
  JG.err = (r1.error || r2.error) ? (r1.error || r2.error).message : '';
  JG.recetas = r1.data || [];
  JG.pend = r2.data || [];
  pintarJuegosCard();
}

function _jgPiezasTxt(piezas) {
  return (piezas || []).map(p => `<span class="chip" style="background:${p.confirmado === false ? '#fef3c7' : '#f1f5f9'};color:#334155;margin:1px"
      title="${p.juego ? 'Sale del juego ' + esc(p.juego) : ''}${p.confirmado === false ? ' · receta SIN confirmar' : ''}">${_jgNum(p.cantidad)} × ${esc(p.sku)}</span>`).join(' ');
}

function pintarJuegosCard() {
  const el = document.getElementById('juegos-card');
  if (!el) return;
  const sinConf = JG.recetas.filter(r => !r.confirmado).length;
  const nPend = JG.pend.filter(p => p.estado !== 'ok').length;
  const tabBtn = (k, tx) => `<button class="act ${JG.vista === k ? '' : 'gh'}" style="font-size:12.5px;padding:5px 11px" onclick="JG.vista='${k}';pintarJuegosCard()">${tx}</button>`;
  let cuerpo = '';
  if (JG.err) cuerpo = `<div class="alerta">${esc(JG.err)}</div>`;
  else if (JG.vista === 'pend') cuerpo = _jgHtmlPend();
  else cuerpo = _jgHtmlRecetas();
  el.innerHTML = `<div class="card" style="border-left:4px solid #7c3aed">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
      <h3 style="font-size:15px;flex:1;min-width:220px;display:flex;align-items:center;gap:8px">${ico('puzzle','s')} Desgloses
        ${ayuda('Artículos que el proveedor factura como juego bajo un solo SKU y que vendemos por separado (ej. SREDO → SREDO + SREDOCH). La receta dice qué piezas salen de cada juego. Los TXT que genera el módulo ya las suman solas; para los TXT que manda FGR a los locales, acá se ve qué desglose le toca cargar a cada local y si ya lo cargó en su Dragonfish (movimiento de stock DES, se sincroniza todas las mañanas).')}</h3>
      <span class="mini">${JG.recetas.length} recetas${sinConf ? ` · <span style="color:#b45309">${sinConf} sin confirmar</span>` : ''}</span>
    </div>
    ${cuerpo}
  </div>`;
}

function _jgHtmlPend() {
  let filas = JG.pend.slice();
  if (JG.local) filas = filas.filter(p => p.local === JG.local);
  if (JG.soloPend) filas = filas.filter(p => p.estado !== 'ok');
  const filtros = `<div class="filtros" style="margin-bottom:8px">
      <select onchange="JG.local=this.value;pintarJuegosCard()">
        <option value="">Los dos locales</option>
        <option value="alcorta" ${JG.local === 'alcorta' ? 'selected' : ''}>Alcorta</option>
        <option value="unicenter" ${JG.local === 'unicenter' ? 'selected' : ''}>Unicenter</option>
      </select>
      <label class="mini" style="display:flex;align-items:center;gap:5px"><input type="checkbox" ${JG.soloPend ? 'checked' : ''}
        onchange="JG.soloPend=this.checked;pintarJuegosCard()"> Ocultar los ya cargados</label>
      <span class="mini" style="margin-left:auto">Últimos 45 días</span>
    </div>`;
  if (!filas.length) return filtros + `<div class="vacio" style="padding:14px">${JG.pend.length ? '✅ Todos los desgloses de los últimos 45 días están cargados.' : 'No entraron juegos a los locales en los últimos 45 días.'}</div>`;
  return filtros + `<div style="overflow-x:auto"><table>
    <thead><tr><th>Fecha</th><th>Local</th><th>Remito</th><th>Piezas a sumar al stock</th><th>Cargado en el Dragonfish</th><th>Estado</th></tr></thead>
    <tbody>${filas.slice(0, 200).map(p => {
      const e = _JG_EST[p.estado] || _JG_EST.pendiente;
      const movs = (p.movs || []).map(m => `mov ${esc(String(m.mov))} (${fechaCorta(m.fecha)})`).join(', ');
      return `<tr>
        <td>${fechaCorta(p.fecha)}</td>
        <td>${esc(_jgLocal(p.local))}</td>
        <td><b>${String(p.punto_venta).padStart(4, '0')}-${String(p.numero).padStart(8, '0')}</b>
          ${p.origen === 'fgr_txt' ? '<div class="mini">📨 TXT de FGR</div>' : ''}</td>
        <td>${_jgPiezasTxt(p.piezas)}</td>
        <td>${(p.cargado || []).length ? _jgPiezasTxt(p.cargado) + `<div class="mini">${movs}</div>` : '<span class="mini">—</span>'}</td>
        <td><span class="chip" style="background:${e[2]};color:${e[1]}" title="${esc(e[3])}">${e[0]}</span></td>
      </tr>`;
    }).join('')}</tbody></table></div>
    ${filas.length > 200 ? `<p class="mini" style="margin-top:6px">Mostrando 200 de ${filas.length}.</p>` : ''}`;
}

function _jgHtmlRecetas() {
  const q = (JG.busca || '').trim().toUpperCase();
  let filas = JG.recetas.slice().sort((a, b) => (a.confirmado === b.confirmado ? a.juego.localeCompare(b.juego) : a.confirmado ? 1 : -1));
  if (q) filas = filas.filter(r => (r.juego + ' ' + (r.juego_desc || '') + ' ' + (r.piezas || []).map(p => p.sku + ' ' + (p.descripcion || '')).join(' ')).toUpperCase().includes(q));
  const sinConf = JG.recetas.filter(r => !r.confirmado).length;
  return `<div class="filtros" style="margin-bottom:8px">
      <input type="search" placeholder="Buscar SKU o descripción…" value="${esc(JG.busca)}" data-busca="juegos"
        oninput="clearTimeout(JG._t);const v=this.value;JG._t=setTimeout(()=>{JG.busca=v;pintarJuegosCard();const i=document.querySelector('[data-busca=juegos]');if(i){i.focus();i.setSelectionRange(v.length,v.length)}},500)">
      <button class="act" style="font-size:12.5px;padding:6px 11px" onclick="editarJuego('')">➕ Nuevo juego</button>
      ${sinConf ? `<button class="act gh" style="font-size:12.5px;padding:6px 11px" onclick="confirmarJuegosTodos()">✔ Confirmar las ${sinConf} deducidas</button>` : ''}
    </div>
    ${sinConf ? `<p class="mini" style="margin-bottom:8px;color:#92400e">🟡 Las recetas <b>sin confirmar</b> se dedujeron de los desgloses que los
      locales cargaron en el Dragonfish el último año. Ya se usan para avisar qué desglose falta, pero <b>no entran al TXT</b>
      hasta que las confirmes: revisalas y tocá ✔.</p>` : ''}
    <div style="overflow-x:auto"><table>
    <thead><tr><th>Juego (lo que factura el proveedor)</th><th>Se desglosa en</th><th>Proveedor</th><th class="num" title="Desgloses de este juego que los locales cargaron en el Dragonfish (últimos 120 días)">DES</th><th></th></tr></thead>
    <tbody>${filas.map(r => `<tr style="${r.confirmado ? '' : 'background:#fffbeb'}">
      <td><b>${esc(r.juego)}</b><div class="mini">${esc(r.juego_desc || '')}</div></td>
      <td>${(r.piezas || []).map(p => `<div><b>${_jgNum(p.cantidad)} × ${esc(p.sku)}</b> <span class="mini">${esc(p.descripcion || '')}</span></div>`).join('')}</td>
      <td class="mini">${esc(r.proveedor || '—')}</td>
      <td class="num">${r.desgloses_dragon || 0}</td>
      <td class="num" style="white-space:nowrap">
        ${r.confirmado ? '<span class="chip" style="background:#dcfce7;color:#166534" title="Receta confirmada: entra al TXT">✔ confirmada</span>'
          : `<button class="act" style="font-size:12px;padding:4px 9px" title="${r.origen === 'historial' ? 'Deducida del Dragonfish' : 'Cargada a mano'} — confirmar para que entre al TXT" onclick="confirmarJuego('${esc(r.juego)}')">✔ Confirmar</button>`}
        <button class="act gh" style="font-size:12px;padding:4px 9px" onclick="editarJuego('${esc(r.juego)}')">✏️</button>
        <button class="act gh" style="font-size:12px;padding:4px 9px" title="Borrar la receta (el artículo pasa a no desglosarse)" onclick="borrarJuego('${esc(r.juego)}')">🗑</button>
      </td></tr>`).join('') || '<tr><td colspan="5" class="vacio">Sin recetas.</td></tr>'}</tbody></table></div>`;
}

async function confirmarJuego(juego) {
  const { error } = await sb.rpc('stock_juego_confirmar', { p_juego: juego });
  if (error) return alert(error.message);
  const r = JG.recetas.find(x => x.juego === juego); if (r) r.confirmado = true;
  pintarJuegosCard();
  if (typeof onJuegoCambio === 'function') onJuegoCambio(juego);
}

async function confirmarJuegosTodos() {
  const pend = JG.recetas.filter(r => !r.confirmado);
  if (!confirm(`¿Confirmar las ${pend.length} recetas deducidas del Dragonfish?\n\nDesde ese momento sus piezas se suman solas a los TXT que genere el módulo. Revisalas antes: si alguna está mal, editala con ✏️.`)) return;
  for (const r of pend) {
    const { error } = await sb.rpc('stock_juego_confirmar', { p_juego: r.juego });
    if (error) { alert(`${r.juego}: ${error.message}`); break; }
    r.confirmado = true;
  }
  pintarJuegosCard();
}

async function borrarJuego(juego) {
  if (!confirm(`¿Borrar la receta de ${juego}?\n\nEl artículo deja de desglosarse: el TXT lo manda solo y ya no se controla el desglose en los locales.`)) return;
  const { error } = await sb.rpc('stock_juego_guardar', { p_juego: juego, p_piezas: [], p_confirmar: true, p_nota: 'borrada' });
  if (error) return alert(error.message);
  JG.recetas = JG.recetas.filter(r => r.juego !== juego);
  pintarJuegosCard();
  if (typeof onJuegoCambio === 'function') onJuegoCambio(juego);
}

// ── Editor ──────────────────────────────────────────────────────────
let JGE = null;
function editarJuego(juego, skuNuevo) {
  const r = JG.recetas.find(x => x.juego === juego);
  const pz = r ? r.piezas : (Array.isArray(skuNuevo) ? skuNuevo : null);
  JGE = { nuevo: !r && !pz, juego: juego || (typeof skuNuevo === 'string' ? skuNuevo : '') || '', piezas: pz ? pz.map(p => ({ sku: p.sku, cantidad: p.cantidad, descripcion: p.descripcion })) : [{ sku: '', cantidad: 1 }], nota: '' };
  let ov = document.getElementById('jg-overlay');
  if (!ov) { ov = document.createElement('div'); ov.id = 'jg-overlay'; document.body.appendChild(ov); }
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:30px 12px;overflow:auto';
  ov.onclick = e => { if (e.target === ov) cerrarEditorJuego(); };
  _jgePintar();
}
function cerrarEditorJuego() { document.getElementById('jg-overlay')?.remove(); JGE = null; }

function _jgePintar() {
  const ov = document.getElementById('jg-overlay'); if (!ov || !JGE) return;
  ov.innerHTML = `<div style="background:#fff;border-radius:14px;max-width:620px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)">
    <div style="background:#7c3aed;color:#fff;padding:13px 17px;border-radius:14px 14px 0 0;display:flex;align-items:center;gap:10px">
      <b style="flex:1">🧩 ${JGE.nuevo ? 'Nuevo juego' : 'Receta de ' + esc(JGE.juego)}</b>
      <button onclick="cerrarEditorJuego()" style="background:rgba(255,255,255,.18);border:none;color:#fff;border-radius:8px;padding:5px 10px;cursor:pointer">✕</button>
    </div>
    <div style="padding:15px 17px">
      <label class="mini" style="display:block;margin-bottom:10px">SKU del juego (el que factura el proveedor)
        <input id="jge-juego" value="${esc(JGE.juego)}" ${JGE.nuevo ? '' : 'readonly'} style="display:block;width:100%;margin-top:4px;padding:7px 9px;border:1px solid var(--line);border-radius:7px;text-transform:uppercase${JGE.nuevo ? '' : ';background:#f1f5f9'}"
          oninput="JGE.juego=this.value.toUpperCase()"></label>
      <p class="mini" style="margin-bottom:8px">El juego en sí queda como la pieza principal (sigue entrando al stock con su SKU).
        Cargá acá las <b>otras piezas</b> que salen de cada juego, y cuántas.</p>
      <table><thead><tr><th>SKU de la pieza</th><th class="num" style="width:90px">Cantidad</th><th></th></tr></thead>
      <tbody>${JGE.piezas.map((p, i) => `<tr>
        <td><input value="${esc(p.sku || '')}" placeholder="ej. SREDOCH" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:6px;text-transform:uppercase"
          oninput="JGE.piezas[${i}].sku=this.value.toUpperCase()">${p.descripcion ? `<div class="mini">${esc(p.descripcion)}</div>` : ''}</td>
        <td class="num"><input type="number" min="1" step="1" value="${p.cantidad || 1}" style="width:75px;padding:6px 8px;border:1px solid var(--line);border-radius:6px;text-align:right"
          oninput="JGE.piezas[${i}].cantidad=this.value"></td>
        <td><button class="act gh" style="font-size:12px;padding:3px 8px" onclick="JGE.piezas.splice(${i},1);_jgePintar()">✕</button></td>
      </tr>`).join('')}</tbody></table>
      <button class="act gh" style="font-size:12.5px;padding:5px 10px;margin-top:7px" onclick="JGE.piezas.push({sku:'',cantidad:1});_jgePintar()">＋ Agregar pieza</button>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;padding:12px 17px;border-top:1px solid var(--bd)">
      <button class="act gh" onclick="cerrarEditorJuego()">Cancelar</button>
      <button class="act" onclick="guardarJuego()">💾 Guardar y confirmar</button>
    </div>
  </div>`;
}

async function guardarJuego() {
  if (!JGE) return;
  const juego = (JGE.juego || '').trim().toUpperCase();
  if (!juego) return alert('Falta el SKU del juego.');
  const piezas = JGE.piezas.map(p => ({ sku: (p.sku || '').trim().toUpperCase(), cantidad: Number(p.cantidad || 0) })).filter(p => p.sku);
  if (!piezas.length) return alert('Cargá al menos una pieza (o borrá la receta con 🗑).');
  if (piezas.some(p => !(p.cantidad > 0))) return alert('Las cantidades tienen que ser mayores a 0.');
  if (new Set(piezas.map(p => p.sku)).size !== piezas.length) return alert('Hay una pieza repetida.');
  if (JGE.nuevo && JG.recetas.some(r => r.juego === juego) && !confirm(`${juego} ya tiene receta. ¿Reemplazarla?`)) return;
  const { error } = await sb.rpc('stock_juego_guardar', { p_juego: juego, p_piezas: piezas, p_confirmar: true, p_nota: null });
  if (error) return alert(error.message);
  cerrarEditorJuego();
  JG.vista = 'recetas';
  cargarJuegosCard();
  if (typeof onJuegoCambio === 'function') onJuegoCambio(juego);
}
