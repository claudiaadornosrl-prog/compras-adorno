// ═══════════════════════════════════════════════════════════════════════
//  Compras Adorno · pedidos.js — 📝 PEDIDOS A PROVEEDORES (25-sep-2026, JP)
//
//  Se arma la orden de pedido (proveedor + artículos + cantidades), se manda
//  al proveedor (PDF / Excel) y lo que va entregando se descuenta:
//   · SOLO desde los remitos que entran al módulo (FGR por el sync del Dragon,
//     Espalma por sus remitos), del pedido más viejo al más nuevo, por SKU,
//   · o a mano con 📥 Recibir, para los proveedores que no mandan detalle.
//  El saldo queda pendiente hasta que alguien CIERRA el pedido (con motivo).
//  Todo va al depósito (Oficina): no hay destino por renglón.
//
//  La lógica vive en la base (compras_pedido_guardar / _accion / _recibir /
//  _catalogo / _detalle y compras_pedidos_reimputar). Este archivo solo dibuja.
//  Se carga después del script principal: usa sb, esc, plata, fechaCorta,
//  nmParse, _hoyAR, MODO_PRUEBA y (para el PDF) op-pdf.js.
// ═══════════════════════════════════════════════════════════════════════

(function(){
  const css = `
#ped-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9998;display:flex;align-items:flex-start;
  justify-content:center;padding:18px 12px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
#ped-overlay .c-box{background:#fff;border-radius:14px;max-width:1000px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);}
#ped-overlay .c-head{position:sticky;top:0;background:var(--primary);color:#fff;padding:13px 17px;border-radius:14px 14px 0 0;
  display:flex;align-items:flex-start;gap:10px;z-index:2;}
#ped-overlay .m-x{background:rgba(255,255,255,.18);border:none;color:#fff;font-size:15px;border-radius:8px;padding:5px 10px;cursor:pointer;}
#ped-overlay .c-body{padding:15px 17px;}
#ped-overlay .c-pie{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 17px;border-top:1px solid var(--bd);
  background:#f8fafc;border-radius:0 0 14px 14px;position:sticky;bottom:0;z-index:2;}
.ped-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin-bottom:10px;}
.ped-grid label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--mut);}
.ped-grid input,.ped-grid textarea{font:inherit;font-size:14px;padding:7px 9px;border:1px solid var(--bd);border-radius:8px;}
.ped-sub{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;}
.ped-sub button{background:#fff;border:1px solid var(--bd);border-radius:20px;padding:6px 13px;font:inherit;font-size:13px;cursor:pointer;color:var(--mut);}
.ped-sub button.on{background:var(--primary);border-color:var(--primary);color:#fff;font-weight:700;}
.ped-cat{max-height:290px;overflow-y:auto;border:1px solid var(--bd);border-radius:9px;margin:6px 0 12px;}
.ped-cat table{font-size:12.5px;} .ped-cat th{position:sticky;top:0;background:#fff;z-index:1;line-height:1.15;vertical-align:bottom;padding:5px 5px!important}
.ped-cat th .sub{display:block;font-size:9.5px;color:var(--mut);font-weight:400;text-transform:none;letter-spacing:0}
.ped-cat td{padding:4px 4px!important}
.ped-cat .desc{display:inline-block;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle}
.ped-cat select.meses{font:inherit;font-size:9.5px;color:var(--primary);border:none;background:transparent;padding:0;cursor:pointer;font-weight:700}
.ped-in{font:inherit;font-size:13px;padding:3px 6px;border:1px solid var(--bd);border-radius:6px;width:74px;text-align:right;}
.ped-in.w{width:100%;text-align:left;}
.ped-e-borrador{background:#f1f5f9;color:#475569;} .ped-e-enviado{background:#dbeafe;color:#1e40af;}
.ped-e-parcial{background:#fef3c7;color:#92400e;} .ped-e-completo{background:#dcfce7;color:#166534;}
.ped-e-cerrado{background:#e5e7eb;color:#374151;} .ped-e-anulado{background:#fee2e2;color:#991b1b;}
.ped-venc{color:var(--bad);font-weight:700;}
.ped-grid{grid-template-columns:2fr 1fr 1fr auto}
#ped-overlay label.c-tog{cursor:pointer;display:inline-flex}#ped-overlay label.c-tog input{display:none}
#ped-overlay label.c-tog .eico{width:34px;height:34px;color:#cbd5e1;border:1px solid var(--bd);background:#fff;cursor:pointer}
#ped-overlay label.c-tog input:checked + .eico{color:#fff;background:var(--primary);border-color:var(--primary)}
#ped-overlay .ped-cat td{white-space:nowrap}
#ped-overlay .fx-tbl td{white-space:nowrap;vertical-align:middle}
.ped-ok{color:var(--ok);font-weight:700;}
@media(max-width:640px){.ped-grid{grid-template-columns:1fr}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

const PED_ESTADOS = {borrador:'📝 Borrador', enviado:'📤 Enviado', parcial:'🟡 Entrega parcial',
                     completo:'✅ Completo', cerrado:'🔒 Cerrado', anulado:'✖ Anulado'};
let PED_VISTA = 'pedidos', PED_FILTRO = 'abiertos', PED_BUSCA = '', PED_PROV_PEND = '';
let PED_LISTA = [], PED_PEND = [], PED_PROVS = null;
let pedEd = null;      // pedido que se está armando/editando
let pedCat = [];       // resultados del catálogo
const _pedN = n => Number(n || 0).toLocaleString('es-AR', {maximumFractionDigits: 2});
const _pedNro = n => String(n || 0).padStart(6, '0');
// (29-sep, JP) Packs: el proveedor vende algunos artículos de a varios (MINIES = "PX2", HOTEL2 = "PACK X 3").
// El pack sale de la equivalencia (cantidad por unidad). La cantidad del pedido se guarda en UNIDADES
// nuestras (como el stock y los mínimos) y tiene que ser múltiplo del pack; al proveedor se le pide en packs.
const _pedPk = x => Number(x && x.pack) > 1 ? Number(x.pack) : 1;
function _pedPackChip(pk){ return pk > 1 ? ` <span class="eico" style="width:22px;height:22px;background:#7c3aed1a;color:#6d28d9;vertical-align:middle" title="El proveedor lo vende en pack de ${pk}: se pide en packs y se cuenta en unidades (el stock y los remitos van en unidades)">${ico('caja','s')}</span><span class="mini" style="color:#6d28d9"> ×${pk}</span>` : ''; }
// (29-sep, JP) Condiciones del proveedor: compra mínima ($ y/o unidades) y descuento extra por volumen.
// La cuenta la hace la base (compras_pedido_condiciones): importe = cant × precio (lista COMPRA sin IVA),
// unidades = como las cuenta el proveedor (un pack ×2 cuenta 1). Al guardar, el pedido se queda con la foto.
function _pedBase(L){
  return { importe: (L||[]).reduce((a, l) => a + Number(l.cantidad||0) * Number(l.precio_unitario||0), 0),
           unidades: (L||[]).reduce((a, l) => a + Number(l.cantidad||0) / _pedPk(l), 0) };
}
function _pedUmbralTxt(t){ return t.tipo === 'monto_minimo' ? plata(t.umbral) : `${_pedN(t.umbral)} unidades`; }
function _pedFaltaTxt(t){ return t.tipo === 'monto_minimo' ? plata(t.falta) : `${_pedN(Math.ceil(t.falta))} unidades`; }
function _pedCondHtml(c, importe, conProximo){
  if (!c) return '';
  const m = c.minimo, d = c.descuento, px = conProximo ? c.proximo : null, otros = c.otros || [];
  if (!m && !d && !px && !(c.escalones||[]).length && !otros.length)
    return `<div class="mini" style="margin-top:8px;display:flex;gap:6px;align-items:center">${ayuda('Este proveedor no tiene cargada compra mínima ni descuento por volumen. Se cargan en Proveedores, en su ficha.')} Sin condiciones cargadas</div>`;
  const partes = [];
  if (m){
    const req = [m.importe ? plata(m.importe) : null, m.unidades ? `${_pedN(m.unidades)} unidades` : null].filter(Boolean)
      .join(m.modo === 'ambos' ? ' y ' : ' o ');
    const falta = [m.falta_importe > 0 ? plata(m.falta_importe) : null, m.falta_unidades > 0 ? `${_pedN(Math.ceil(m.falta_unidades))} unidades` : null]
      .filter(Boolean).join(m.modo === 'ambos' ? ' y ' : ' o ');
    partes.push(m.cumple
      ? `<div style="color:#166534">✓ Llega a la compra mínima (${req}).</div>`
      : `<div style="color:var(--bad);font-weight:600">⚠ No llega a la compra mínima (${req}): faltan ${falta}.</div>`);
    if (m.nota) partes.push(`<div class="mini">${esc(m.nota)}</div>`);
  }
  if (d){
    const ahorro = Math.round(Number(importe||0) * Number(d.pct) / 100 * 100) / 100;
    partes.push(`<div style="color:#166534;font-weight:600">🎁 Descuento extra ${_pedN(d.pct)} % por superar ${_pedUmbralTxt(d)}${d.descripcion ? ` (${esc(d.descripcion)})` : ''}
      ${importe ? `: −${plata(ahorro)} · total con descuento <b>${plata(Number(importe) - ahorro)}</b>` : ''}</div>`);
  }
  if (px) partes.push(`<div style="color:#92400e">💡 Si sumás ${_pedFaltaTxt(px)} más llegás al ${_pedN(px.pct)} % de descuento (desde ${_pedUmbralTxt(px)}).</div>`);
  if (otros.length) partes.push(`<div class="mini">Otras condiciones pactadas (no se aplican al pedido): ${otros.map(o =>
      esc(`${o.porcentaje ?? ''}${o.porcentaje ? ' % ' : ''}${o.descripcion || o.tipo || ''}`)).join(' · ')}</div>`);
  return `<div class="card" style="margin-top:10px;padding:10px 12px;background:#fafafa;font-size:13px;display:flex;flex-direction:column;gap:4px">
    <b style="font-size:13px">📋 Condiciones del proveedor</b>${partes.join('')}</div>`;
}
function _pedPintarLin(){
  const el = document.getElementById('ped-lin'); if (el) el.innerHTML = _pedLineasHtml();
  const cat = document.getElementById('ped-cat'); if (cat && pedCat.length) cat.innerHTML = _pedCatHtml();
  pedCondRefrescar();
}
function pedCondRefrescar(){
  clearTimeout(window._pedCondT);
  window._pedCondT = setTimeout(async () => {
    const box = document.getElementById('ped-cond'); if (!box || !pedEd) return;
    if (!pedEd.proveedor_nombre){ box.innerHTML = ''; pedEd._cond = null; return; }
    const b = _pedBase(pedEd.lineas);
    const {data, error} = await sb.rpc('compras_pedido_condiciones', {p_cuit: pedEd.proveedor_cuit || null,
      p_codigo: pedEd.proveedor_codigo || null, p_importe: b.importe, p_unidades: b.unidades});
    if (error){ box.innerHTML = `<div class="alerta">${esc(error.message)}</div>`; return; }
    pedEd._cond = data;
    box.innerHTML = _pedCondHtml(data, b.importe, true);
    const tot = document.getElementById('ped-tot'); if (tot) tot.innerHTML = _pedTotHtml();
  }, 350);
}
function _pedPacksTxt(u, pk){ const n = Number(u||0) / pk; return `${_pedN(n)} pack${n === 1 ? '' : 's'} ×${pk}`; }
const _pedChip = e => `<span class="chip ped-e-${esc(e)}">${PED_ESTADOS[e] || esc(e)}</span>`;
const PED_EST_ICO = {borrador:'lapiz', enviado:'avion', parcial:'reloj', completo:'ok', cerrado:'candado', anulado:'anular'};
const PED_EST_TXT = {borrador:'Borrador', enviado:'Enviado', parcial:'Entrega parcial', completo:'Completo', cerrado:'Cerrado', anulado:'Anulado'};
const _pedEico = e => `<span class="eico ped-e-${esc(e)}" title="${PED_EST_TXT[e] || esc(e)}">${ico(PED_EST_ICO[e] || 'info','s')}</span>`;
const _pedDias = f => f ? Math.round((new Date(_hoyAR()) - new Date(String(f).slice(0,10))) / 864e5) : null;

// ── Carga ─────────────────────────────────────────────────────────────
async function _pedCargar(){
  const [a, b] = await Promise.all([
    sb.from('compras_pedidos_v').select('*').eq('es_prueba', MODO_PRUEBA).order('fecha', {ascending:false}).order('numero', {ascending:false}).limit(1000),
    sb.from('compras_pedido_lineas_v').select('*').eq('es_prueba', MODO_PRUEBA).in('estado', ['enviado','parcial']).gt('pendiente', 0)
      .order('proveedor_nombre').order('fecha').order('nroitem').limit(5000)
  ]);
  if (a.error) throw a.error; if (b.error) throw b.error;
  PED_LISTA = a.data || []; PED_PEND = b.data || [];
}

async function vistaPedidos(){
  const c = document.getElementById('cont');
  c.innerHTML = '<div class="vacio">Cargando pedidos…</div>';
  try { await _pedCargar(); }
  catch(e){ c.innerHTML = `<div class="alerta">No se pudieron leer los pedidos: ${esc(e.message)}</div>`; return; }
  _pedPintar();
}

function _pedPintar(){
  if (tabActual !== 'pedidos') return;
  const c = document.getElementById('cont');
  const abiertos = PED_LISTA.filter(p => ['borrador','enviado','parcial'].includes(p.estado));
  const pendUni = PED_PEND.reduce((a, l) => a + Number(l.pendiente || 0), 0);
  const pendImp = PED_PEND.reduce((a, l) => a + Number(l.pendiente || 0) * Number(l.precio_unitario || 0), 0);
  const vencidos = PED_LISTA.filter(p => ['enviado','parcial'].includes(p.estado) && p.entrega_estimada && p.entrega_estimada < _hoyAR()).length;
  // (8-oct, JP) resumen en un renglón de chips y sub-pestañas con ícono; el alta es un "+"
  c.innerHTML = `
    <div class="abar">
      <button class="fchip ${PED_VISTA==='pedidos'?'on':''}" onclick="PED_VISTA='pedidos';_pedPintar()" title="Pedidos abiertos: ${abiertos.filter(p=>p.estado==='borrador').length} en borrador">${ico('lista','s')} <b>${abiertos.length}</b> pedidos</button>
      <button class="fchip ${PED_VISTA==='pendientes'?'on':''}" onclick="PED_VISTA='pendientes';_pedPintar()" title="Unidades pedidas y no recibidas: ${PED_PEND.length} renglones · ${platac(pendImp)} a precio de pedido">${ico('reloj','s')} <b>${_pedN(pendUni)}</b> pendientes</button>
      ${vencidos ? `<span class="fchip" style="cursor:help;color:var(--bad);border-color:#fecaca;background:#fef2f2" title="Pedidos enviados que pasaron la fecha de entrega estimada">${ico('alerta','s')} <b>${vencidos}</b> vencidos</span>` : ''}
      <span style="flex:1"></span>
      <button class="act mini-ico" onclick="pedNuevo()" title="Nuevo pedido">${ico('mas')}</button>
    </div>
    ${PED_VISTA === 'pedidos' ? _pedVistaLista() : _pedVistaPendientes()}`;
}

function _pedVistaLista(){
  const q = PED_BUSCA.trim().toLowerCase();
  const rows = PED_LISTA.filter(p => {
    if (PED_FILTRO === 'abiertos' && !['borrador','enviado','parcial'].includes(p.estado)) return false;
    if (PED_FILTRO === 'terminados' && !['completo','cerrado','anulado'].includes(p.estado)) return false;
    if (q && !(`${p.proveedor_nombre} ${p.numero} ${p.notas||''}`.toLowerCase().includes(q))) return false;
    return true;
  });
  return `<div class="card">
    <div class="filtros">
      <select onchange="PED_FILTRO=this.value;_pedPintar()">
        <option value="abiertos" ${PED_FILTRO==='abiertos'?'selected':''}>Abiertos</option>
        <option value="terminados" ${PED_FILTRO==='terminados'?'selected':''}>Completos, cerrados y anulados</option>
        <option value="todos" ${PED_FILTRO==='todos'?'selected':''}>Todos</option>
      </select>
      <input type="search" placeholder="Buscar proveedor, Nº o nota…" value="${esc(PED_BUSCA)}"
             oninput="PED_BUSCA=this.value;clearTimeout(window._pedT);window._pedT=setTimeout(()=>{_pedPintar();const i=document.querySelector('.filtros input[type=search]');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)">
    </div>
    ${rows.length ? `<div style="overflow-x:auto"><table class="tb-band">
      <thead><tr><th>Nº</th><th>Fecha</th><th>Proveedor</th><th class="ctr">Estado</th><th class="num" title="Renglones">Reng.</th>
        <th class="num">Pedido</th><th class="num">Recibido</th><th class="num">Pendiente</th>
        <th class="num">$ pendiente</th><th>Entrega est.</th></tr></thead>
      <tbody>${rows.map(p => {
        const venc = ['enviado','parcial'].includes(p.estado) && p.entrega_estimada && p.entrega_estimada < _hoyAR();
        return `<tr onclick="pedAbrir(${p.id})" title="Abrir el pedido">
          <td><b>${_pedNro(p.numero)}</b></td><td>${fechaCorta(p.fecha)}</td>
          <td class="prov"><span class="prov-nom">${esc(p.proveedor_nombre)}</span>${p.notas ? `<div class="mini prov-nom" title="${esc(p.notas)}">${esc(p.notas)}</div>` : ''}</td>
          <td class="ctr" style="white-space:nowrap">${_pedEico(p.estado)}${Number(p.descuento_extra_pct) ? ` <span class="eico" style="background:#dcfce7;color:#166534" title="Descuento extra por volumen: −${_pedN(p.descuento_extra_pct)} %">${ico('regalo','s')}</span>` : ''}${p.condiciones?.minimo && !p.condiciones.minimo.cumple && p.estado !== 'anulado' ? ` <span class="eico" style="background:#fee2e2;color:#991b1b" title="No llega a la compra mínima del proveedor">${ico('alerta','s')}</span>` : ''}</td><td class="num">${p.renglones}</td>
          <td class="num">${_pedN(p.unidades)}</td><td class="num">${_pedN(p.recibido)}</td>
          <td class="num"><b>${_pedN(p.pendiente)}</b>${Number(p.cancelado) ? `<div class="mini">${_pedN(p.cancelado)} cancel.</div>` : ''}</td>
          <td class="num">${Number(p.importe_pendiente) ? plata(p.importe_pendiente * (1 - Number(p.descuento_extra_pct||0)/100)) : '—'}</td>
          <td class="${venc?'ped-venc':''}" ${venc ? 'title="Pasó la fecha de entrega estimada"' : ''}>${p.entrega_estimada ? fechaCorta(p.entrega_estimada) : '—'}</td></tr>`;
      }).join('')}</tbody></table></div>`
      : `<div class="vacio">${PED_LISTA.length ? 'No hay pedidos con ese filtro.' : 'Todavía no hay pedidos. Tocá el + para armar el primero.'}</div>`}
  </div>`;
}

function _pedPendFiltrados(){
  const q = PED_BUSCA.trim().toLowerCase();
  return PED_PEND.filter(l => (!PED_PROV_PEND || l.proveedor_nombre === PED_PROV_PEND) &&
    (!q || `${l.sku||''} ${l.descripcion} ${l.codigo_proveedor||''} ${l.proveedor_nombre}`.toLowerCase().includes(q)));
}
function _pedVistaPendientes(){
  const provs = [...new Set(PED_PEND.map(l => l.proveedor_nombre))].sort();
  const rows = _pedPendFiltrados();
  const tot = rows.reduce((a, l) => a + Number(l.pendiente||0), 0);
  const imp = rows.reduce((a, l) => a + Number(l.pendiente||0) * Number(l.precio_unitario||0), 0);
  return `<div class="card">
    <div class="filtros">
      <span class="mini" style="cursor:help" title="Lo que se pidió y todavía no llegó, de los pedidos enviados. Se descuenta solo cuando entra el remito del proveedor con el mismo SKU, o a mano con Recibir dentro del pedido.">${ico('info','s')}</span>
      <select onchange="PED_PROV_PEND=this.value;_pedPintar()">
        <option value="">Todos los proveedores (${provs.length})</option>
        ${provs.map(p => `<option ${p===PED_PROV_PEND?'selected':''}>${esc(p)}</option>`).join('')}
      </select>
      <input type="search" placeholder="Buscar SKU o descripción…" value="${esc(PED_BUSCA)}"
             oninput="PED_BUSCA=this.value;clearTimeout(window._pedT);window._pedT=setTimeout(()=>{_pedPintar();const i=document.querySelector('.filtros input[type=search]');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)">
      <button class="act gh mini-ico" onclick="pedPendExcel()" title="Bajar en Excel">${ico('excel')}</button>
      <button class="act gh mini-ico" onclick="pedPendPdf()" title="Bajar en PDF (sirve para reclamarle al proveedor)">${ico('pdf')}</button>
    </div>
    ${rows.length ? `<div style="overflow-x:auto"><table class="tb-band">
      <thead><tr><th>Proveedor</th><th>Pedido</th><th>SKU</th><th>Descripción</th>
        <th class="num">Pedido</th><th class="num">Recibido</th><th class="num">Pendiente</th>
        <th class="num">Días</th><th>Entrega est.</th></tr></thead>
      <tbody>${rows.map(l => {
        const venc = l.entrega_estimada && l.entrega_estimada < _hoyAR();
        return `<tr onclick="pedAbrir(${l.pedido_id})" title="Abrir el pedido">
          <td class="prov"><span class="prov-nom">${esc(l.proveedor_nombre)}</span></td><td>Nº ${_pedNro(l.pedido_numero)}<div class="mini">${fechaCorta(l.fecha)}</div></td>
          <td><b>${esc(l.sku||'—')}</b>${l.codigo_proveedor ? `<div class="mini">${esc(l.codigo_proveedor)}</div>` : ''}</td>
          <td>${esc(l.descripcion)}</td><td class="num">${_pedN(l.cantidad)}</td><td class="num">${_pedN(l.recibido)}</td>
          <td class="num"><b>${_pedN(l.pendiente)}</b></td><td class="num">${_pedDias(l.fecha) ?? '—'}</td>
          <td class="${venc?'ped-venc':''}" ${venc ? 'title="Pasó la fecha de entrega estimada"' : ''}>${l.entrega_estimada ? fechaCorta(l.entrega_estimada) : '—'}</td></tr>`;
      }).join('')}</tbody>
      <tfoot><tr><td colspan="6"><b>${rows.length} renglones</b></td><td class="num"><b>${_pedN(tot)}</b></td>
        <td colspan="2" class="num">${imp ? plata(imp) : ''}</td></tr></tfoot></table></div>`
      : `<div class="vacio">No hay mercadería pendiente de entrega${PED_PROV_PEND ? ' de ' + esc(PED_PROV_PEND) : ''}.</div>`}
  </div>`;
}

// ── Proveedores (para elegir en el pedido) ────────────────────────────
// (8-oct, JP) Por defecto solo los proveedores a los que les compramos mercadería
// (marca manual en la ficha, o regla automática: facturas de mercadería, remitos,
// artículos del stock a su nombre). Con PED_PROVS_TODOS se traen todos.
let PED_PROVS_TODOS = false, PED_PROVS_CACHE = {};
let PED_MESES = Number(localStorage.getItem('ped_meses') || 6) || 6;   // meses de venta que muestra el catálogo
function pedMesesSet(v){ PED_MESES = Math.min(13, Math.max(1, Number(v) || 6)); localStorage.setItem('ped_meses', PED_MESES); pedBuscarCat(); }
async function _pedProvs(){
  const k = PED_PROVS_TODOS ? 'todos' : 'merc';
  if (PED_PROVS_CACHE[k]){ PED_PROVS = PED_PROVS_CACHE[k]; return PED_PROVS; }
  let out = [];
  if (!PED_PROVS_TODOS){
    const {data, error} = await sb.rpc('compras_proveedores_mercaderia');
    if (error) console.warn(error.message); else out = data || [];
  } else {
    let d = 0;
    while (true){
      const {data, error} = await sb.from('tesoreria_proveedores').select('codigo,nombre,cuit_norm,activo')
        .order('nombre').range(d, d + 999);
      if (error){ console.warn(error.message); break; }
      out = out.concat(data || []); if ((data||[]).length < 1000) break; d += 1000;
    }
  }
  PED_PROVS = out.filter(p => p.activo !== false);
  PED_PROVS_CACHE[k] = PED_PROVS;
  return PED_PROVS;
}
async function pedProvsTodos(on){
  PED_PROVS_TODOS = !!on; await _pedProvs();
  const dl = document.getElementById('ped-dl-provs');
  if (dl) dl.innerHTML = (PED_PROVS||[]).map(p => `<option value="${esc(_pedProvTxt(p))}">`).join('');
  const i = document.getElementById('ped-prov'); if (i) i.focus();
}
const _pedProvTxt = p => `${p.nombre}${p.cuit_norm ? ' · ' + p.cuit_norm : ''} · [${p.codigo}]`;

// ── Armar / editar ────────────────────────────────────────────────────
async function pedNuevo(){
  pedEd = {id: null, estado: 'borrador', numero: null, proveedor_codigo: '', proveedor_cuit: '', proveedor_nombre: '',
           fecha: _hoyAR(), entrega_estimada: '', notas: '', lineas: []};
  pedCat = [];
  await _pedProvs();
  _pedEditor();
}
async function pedEditar(id){
  const {data, error} = await sb.rpc('compras_pedido_detalle', {p_id: id});
  if (error){ alert(error.message); return; }
  const p = data.pedido;
  pedEd = {id: p.id, estado: p.estado, numero: p.numero, proveedor_codigo: p.proveedor_codigo || '',
           proveedor_cuit: p.proveedor_cuit || '', proveedor_nombre: p.proveedor_nombre, fecha: p.fecha,
           entrega_estimada: p.entrega_estimada || '', notas: p.notas || '',
           lineas: (data.lineas || []).map(l => ({id: l.id, sku: l.sku || '', codigo_proveedor: l.codigo_proveedor || '',
             descripcion: l.descripcion, cantidad: Number(l.cantidad), precio_unitario: l.precio_unitario,
             recibido: Number(l.recibido || 0), cancelado: Number(l.cantidad_cancelada || 0),
             cant_guardada: ['borrador','enviado','parcial'].includes(p.estado) ? Number(l.cantidad) : 0,
             pack: _pedPk(l), descripcion_proveedor: l.descripcion_proveedor || ''}))};
  pedCat = [];
  await _pedProvs();
  _pedEditor();
  if (pedEd.proveedor_nombre) pedBuscarCat();
  pedCondRefrescar();
}

function _pedEditor(){
  const e = pedEd;
  const provVal = e.proveedor_nombre ? `${e.proveedor_nombre}${e.proveedor_cuit ? ' · ' + e.proveedor_cuit : ''}${e.proveedor_codigo ? ' · [' + e.proveedor_codigo + ']' : ''}` : '';
  let ov = document.getElementById('ped-overlay');
  if (!ov){ ov = document.createElement('div'); ov.id = 'ped-overlay'; document.body.appendChild(ov); }
  ov.onclick = ev => { if (ev.target === ov) pedCerrarModal(); };
  ov.innerHTML = `<div class="c-box">
    <div class="c-head"><div style="flex:1"><b style="font-size:16px">${e.id ? `✏️ Pedido Nº ${_pedNro(e.numero)}` : '➕ Nuevo pedido'}</b>
      <div style="font-size:12px;opacity:.85">${e.id ? _pedChip(e.estado) : 'Se guarda como borrador hasta que lo marques como enviado.'}</div></div>
      <button class="m-x" onclick="pedCerrarModal()">✕</button></div>
    <div class="c-body">
      <div class="ped-grid">
        <label>Proveedor
          <div style="display:flex;gap:6px;align-items:center"><input id="ped-prov" list="ped-dl-provs" value="${esc(provVal)}" placeholder="Escribí el nombre o el CUIT…" onchange="pedElegirProv(this.value)" style="flex:1">
          <label class="c-tog" title="La lista trae solo los proveedores a los que les compramos mercadería. Naranja = ver todos los proveedores"><input type="checkbox" ${PED_PROVS_TODOS ? 'checked' : ''} onchange="pedProvsTodos(this.checked)"><span class="eico">${ico('edificio')}</span></label></div>
          <datalist id="ped-dl-provs">${(PED_PROVS||[]).map(p => `<option value="${esc(_pedProvTxt(p))}">`).join('')}</datalist></label>
        <label>Fecha del pedido <input type="date" id="ped-fecha" value="${esc(e.fecha||'')}" onchange="pedEd.fecha=this.value"></label>
        <label>Entrega estimada <input type="date" id="ped-entrega" value="${esc(e.entrega_estimada||'')}" onchange="pedEd.entrega_estimada=this.value"></label>
        <label style="justify-content:flex-end">&nbsp;<label class="c-tog" title="Notas para el proveedor (salen en el pedido): horario de entrega, colores a consultar…"><input type="checkbox" id="ped-notas-tog" ${e.notas ? 'checked' : ''} onchange="const n=document.getElementById('ped-notas-fila'); n.style.display=this.checked?'':'none'; if(this.checked) document.getElementById('ped-notas').focus()"><span class="eico">${ico('hoja')}</span></label></label>
      </div>
      <div id="ped-notas-fila" style="margin:-4px 0 12px;${e.notas ? '' : 'display:none'}">
        <input id="ped-notas" value="${esc(e.notas||'')}" oninput="pedEd.notas=this.value" placeholder="Notas para el proveedor (salen en el pedido): entregar de 9 a 13 hs, consultar colores…"
               style="width:100%;font:inherit;font-size:14px;padding:7px 9px;border:1px solid var(--bd);border-radius:8px"></div>

      <div class="card" style="padding:10px 12px;background:#fafafa">
        <div class="filtros" style="margin-bottom:4px;align-items:center">
          <button class="act gh mini-ico" title="Buscar en el catálogo del proveedor" onclick="pedBuscarCat()">${ico('lupa')}</button>
          <input type="search" id="ped-cat-q" placeholder="SKU o descripción del catálogo del proveedor (Enter)" style="flex:1;min-width:200px" onkeydown="if(event.key==='Enter')pedBuscarCat()">
          <label class="c-tog" title="Todo el catálogo del proveedor (no solo lo que ya compramos). Naranja = activo"><input type="checkbox" id="ped-cat-todos" onchange="pedBuscarCat()"><span class="eico">${ico('lista')}</span></label>
          <label class="c-tog" title="Solo los artículos que están por debajo de su mínimo de reposición. Naranja = activo"><input type="checkbox" id="ped-cat-bajo" onchange="document.getElementById('ped-cat').innerHTML=_pedCatHtml()"><span class="eico">${ico('bajarflecha')}</span></label>
          <span id="ped-cat-res" class="mini" style="display:inline-flex;align-items:center;gap:6px"></span>
        </div>
        <div id="ped-cat">${_pedCatHtml()}</div>
      </div>

      <div id="ped-lin">${_pedLineasHtml()}</div>
      <div id="ped-cond"></div>
    </div>
    <div class="c-pie">
      <button class="act gh" style="display:inline-flex;align-items:center;gap:6px" title="Agregar un renglón sin SKU. Ojo: no se descuenta solo con los remitos, se recibe a mano." onclick="pedAgregarLibre()">${ico('mas','s')} Renglón sin SKU</button>
      <span style="flex:1"></span>
      <button class="act gh" onclick="pedCerrarModal()">Cancelar</button>
      <button class="act gh" onclick="pedGuardar(false)">💾 Guardar${e.estado==='borrador'?' borrador':''}</button>
      ${e.estado === 'borrador' ? `<button class="act" onclick="pedGuardar(true)">📤 Guardar y enviar</button>` : ''}
    </div></div>`;  pedCondRefrescar();
}

function pedElegirProv(v){
  const m = String(v||'').match(/\[([^\]]+)\]\s*$/);
  const p = m ? (PED_PROVS||[]).find(x => x.codigo === m[1]) : null;
  if (!p){
    if (v) alert('Elegí el proveedor de la lista (si no está, dalo de alta en 🏢 Proveedores).');
    pedEd.proveedor_codigo = ''; pedEd.proveedor_cuit = ''; pedEd.proveedor_nombre = '';
    return;
  }
  pedEd.proveedor_codigo = p.codigo; pedEd.proveedor_cuit = p.cuit_norm || ''; pedEd.proveedor_nombre = p.nombre;
  pedBuscarCat();
  pedCondRefrescar();
}

async function pedBuscarCat(){
  if (!pedEd.proveedor_nombre){ document.getElementById('ped-cat').innerHTML = '<div class="mini" style="padding:8px">Primero elegí el proveedor.</div>'; return; }
  const q = document.getElementById('ped-cat-q')?.value || '';
  const todos = !!document.getElementById('ped-cat-todos')?.checked;
  document.getElementById('ped-cat').innerHTML = '<div class="mini" style="padding:8px">Buscando…</div>';
  const {data, error} = await sb.rpc('compras_pedido_catalogo', {p_cuit: pedEd.proveedor_cuit || null,
    p_nombre: pedEd.proveedor_nombre, p_busca: q || null, p_todos: todos, p_prueba: MODO_PRUEBA, p_meses: PED_MESES});
  if (error){ document.getElementById('ped-cat').innerHTML = `<div class="alerta">${esc(error.message)}</div>`; return; }
  pedCat = data || [];
  // (28-sep, JP) Arriba lo que MÁS hay que pedir para completar el mínimo; después
  // los que están OK y al final los que no tienen mínimo cargado. La base ya lo
  // devuelve así: esto lo asegura aunque cambie el orden de la RPC.
  pedCat.sort((a, b) => {
    const fa = a.falta_minimo == null ? -1 : Number(a.falta_minimo), fb = b.falta_minimo == null ? -1 : Number(b.falta_minimo);
    return (fb - fa) || String(a.descripcion||'').localeCompare(String(b.descripcion||''));
  });
  document.getElementById('ped-cat').innerHTML = _pedCatHtml();
}
// (25-sep) Mínimo de reposición = el umbral de reposición por local (hoy sale de
// COMB.MINREPO del Dragonfish, vía sync_mercaderia.py → stock_minimos).
// "Falta" = lo que hay que pedir para volver al mínimo: el depósito cubre lo que les
// falta a los locales + su propio mínimo; el sobrante de un local no cubre al otro;
// el stock negativo cuenta como 0; ya descuenta lo pedido y no entregado.
// (29-sep, JP) La base ya descuenta lo pedido en pedidos GUARDADOS. Lo que está en el editor y todavía no
// se guardó (o se cambió respecto de lo guardado) se descuenta acá, así el sugerido baja apenas se agrega.
function _pedDeltaEditor(sku){
  if (!pedEd) return 0;
  const k = String(sku||'').toUpperCase();
  return pedEd.lineas.filter(l => (l.sku||'').toUpperCase() === k)
    .reduce((t, l) => t + Number(l.cantidad||0) - Number(l.cant_guardada||0), 0);
}
function _pedFalta(a){
  if (a.falta_minimo == null) return null;
  const n = Number(a.falta_minimo) - _pedDeltaEditor(a.sku);
  return n > 0 ? n : 0;
}
function _pedYaPedido(a){ return Math.max(Number(a.pendiente_pedidos||0) + _pedDeltaEditor(a.sku), 0); }
function _pedStk(stock, min){
  const s = _pedN(stock);
  if (min == null || !(Number(min) > 0)) return s;
  return Number(stock || 0) < Number(min) ? `<b style="color:var(--bad)" title="Por debajo del mínimo (${_pedN(min)})">${s}</b>` : s;
}
function _pedMin(v){ return v == null || !(Number(v) > 0) ? '—' : _pedN(v); }
function _pedCatHtml(){
  if (!pedEd || !pedEd.proveedor_nombre) return '<div class="mini" style="padding:8px">Elegí el proveedor para ver sus artículos.</div>';
  if (!pedCat.length) return `<div class="mini" style="padding:8px">No hay artículos de este proveedor con ese filtro. Probá "todo el catálogo" o cargá un renglón sin SKU.</div>`;
  const ya = new Set(pedEd.lineas.map(l => (l.sku||'').toUpperCase()));
  const soloBajo = !!document.getElementById('ped-cat-bajo')?.checked;
  const filas = pedCat.map((a, i) => ({a, i})).filter(x => !soloBajo || _pedFalta(x.a) > 0);
  const faltan = pedCat.map((a, i) => ({a, i})).filter(x => _pedFalta(x.a) > 0 && !ya.has(String(x.a.sku).toUpperCase()));
  const sinMin = pedCat.filter(a => a.falta_minimo == null).length;
  // (8-oct, JP) el resumen y el "agregar todo lo que falta" van en el renglón de filtros, como íconos
  setTimeout(() => { const r = document.getElementById('ped-cat-res'); if (!r) return;
    r.innerHTML = `<span title="${faltan.length} artículo(s) por debajo del mínimo sin agregar al pedido${sinMin ? ' · ' + sinMin + ' sin mínimo cargado' : ''}" style="cursor:help;white-space:nowrap">${faltan.length ? `<b style="color:var(--bad)">${faltan.length}</b> bajo mín.` : 'bajo mín. 0'}${sinMin ? ` · ${sinMin} s/mín.` : ''}</span>
      ${faltan.length ? `<button class="act mini-ico" style="width:34px;height:34px;justify-content:center" title="Agregar al pedido todo lo que falta para llegar al mínimo (${faltan.length} artículos, con la cantidad que falta)" onclick="pedAgregarBajoMinimo()">${ico('mas')}</button>` : ''}`; }, 0);
  if (!filas.length) return '<div class="mini" style="padding:8px">Ningún artículo de la lista está por debajo de su mínimo.</div>';
  return `<div class="ped-cat"><table>
    <thead><tr><th>SKU</th><th>Descripción</th><th class="num" title="Stock Alcorta / Unicenter / Oficina (en rojo: por debajo de su mínimo)">Stock<span class="sub">A · U · O</span></th>
      <th class="num" title="Stock total: la suma de los tres puntos">Total</th>
      <th class="num" title="Unidades vendidas entre todos los puntos de venta en los últimos meses (facturas menos notas de crédito; el mes actual cuenta hasta ayer). Tocá los meses para cambiar cuántos se suman.">Vend.<span class="sub"><select class="meses" onchange="pedMesesSet(this.value)" onclick="event.stopPropagation()" title="Cuántos meses sumar">${[1,2,3,6,9,12].map(m => `<option value="${m}" ${m===PED_MESES?'selected':''}>${m} M</option>`).join('')}</select></span></th>
      <th class="num" title="Mínimo de reposición (umbral) Alcorta / Unicenter / Oficina — sale del Dragonfish">Mín.<span class="sub">A · U · O</span></th>
      <th class="num" title="Lo que hay que pedir para volver al mínimo: lo que les falta a los locales + el mínimo del depósito, menos lo que ya hay en Oficina y lo ya pedido">Falta<span class="sub">p/ mín.</span></th>
      <th class="num" title="Precio de la lista COMPRA">$ compra</th><th class="num" title="Ya pedido y todavía no entregado (otros pedidos abiertos)">Pedido</th>
      <th class="num" style="width:44px">Cant.</th><th></th></tr></thead>
    <tbody>${filas.map(({a, i}) => { const f = _pedFalta(a); return `<tr>
      <td title="${a.codigo_proveedor ? 'Código del proveedor: ' + esc(a.codigo_proveedor) : ''}"><b>${esc(a.sku)}</b></td>
      <td>${_pedPackChip(_pedPk(a))}<span class="desc" title="${esc(a.descripcion||'')}">${esc(a.descripcion||'')}</span></td>
      <td class="num">${_pedStk(a.stock_alcorta, a.min_alcorta)} · ${_pedStk(a.stock_unicenter, a.min_unicenter)} · ${_pedStk(a.stock_oficina, a.min_oficina)}</td>
      <td class="num"><b>${_pedN(a.stock_total)}</b></td>
      <td class="num">${a.vendido == null ? '<span class="mini" title="Sin ventas en ese período">—</span>' : _pedN(a.vendido)}</td>
      <td class="num">${_pedMin(a.min_alcorta)} · ${_pedMin(a.min_unicenter)} · ${_pedMin(a.min_oficina)}</td>
      <td class="num">${f == null ? '<span class="mini">sin mín.</span>' : (f > 0 ? `<b style="color:var(--bad)">${_pedN(f)}</b>${_pedPk(a) > 1 ? ` <span class="mini">= ${_pedN(Math.ceil(f/_pedPk(a)))} pk</span>` : ''}` : '<span class="mini ped-ok">OK</span>')}</td>
      <td class="num">${a.precio_compra ? plata(a.precio_compra) : '—'}</td>
      <td class="num">${_pedYaPedido(a) ? `<b style="color:var(--warn)">${_pedN(_pedYaPedido(a))}</b>` : '—'}</td>
      <td class="num"><input class="ped-in" style="width:40px" id="ped-cq-${i}" inputmode="decimal" value="${f > 0 ? Math.ceil(f / _pedPk(a)) : 1}" onkeydown="if(event.key==='Enter')pedAgregarCat(${i})"
            title="${_pedPk(a) > 1 ? 'Cantidad de PACKS (de a ' + _pedPk(a) + ' unidades)' : 'Unidades'}">${_pedPk(a) > 1 ? ' <span class="mini">pk</span>' : ''}</td>
      <td>${ya.has(String(a.sku).toUpperCase()) ? `<span class="eico" style="color:var(--ok);width:22px;height:22px" title="Ya está en el pedido">${ico('ok','s')}</span>`
            : `<button class="act op-ico" title="Agregar al pedido" onclick="pedAgregarCat(${i})">${ico('mas','s')}</button>`}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}
function pedAgregarBajoMinimo(){
  const ya = new Set(pedEd.lineas.map(l => (l.sku||'').toUpperCase()));
  const lista = pedCat.filter(a => _pedFalta(a) > 0 && !ya.has(String(a.sku).toUpperCase()));
  if (!lista.length) return;
  if (!confirm(`Se agregan ${lista.length} artículo(s) con la cantidad que falta para volver al mínimo. Después podés ajustar cada renglón. ¿Seguimos?`)) return;
  for (const a of lista){ const pk = _pedPk(a);
    pedEd.lineas.push({id: null, sku: a.sku, codigo_proveedor: a.codigo_proveedor || '', descripcion: a.descripcion || a.sku,
                       cantidad: Math.ceil(_pedFalta(a) / pk) * pk, precio_unitario: a.precio_compra ?? null, recibido: 0, cancelado: 0,
                       pack: pk, descripcion_proveedor: a.descripcion_proveedor || ''}); }
  _pedPintarLin();
  document.getElementById('ped-cat').innerHTML = _pedCatHtml();
}
function pedAgregarCat(i){
  const a = pedCat[i]; if (!a) return;
  const pk = _pedPk(a);
  const n = nmParse(document.getElementById('ped-cq-' + i)?.value || '1');
  if (!(n > 0)){ alert('Poné una cantidad mayor a 0.'); return; }
  if (pk > 1 && !Number.isInteger(n)){ alert(`${a.sku} viene en pack de ${pk}: poné una cantidad entera de packs.`); return; }
  const cant = n * pk;   // en unidades nuestras
  const ex = pedEd.lineas.find(l => (l.sku||'').toUpperCase() === String(a.sku).toUpperCase());
  if (ex){ ex.cantidad = Number(ex.cantidad) + cant; }
  else pedEd.lineas.push({id: null, sku: a.sku, codigo_proveedor: a.codigo_proveedor || '', descripcion: a.descripcion || a.sku,
                          cantidad: cant, precio_unitario: a.precio_compra ?? null, recibido: 0, cancelado: 0,
                          pack: pk, descripcion_proveedor: a.descripcion_proveedor || ''});
  _pedPintarLin();
  document.getElementById('ped-cat').innerHTML = _pedCatHtml();
}
function pedAgregarLibre(){
  pedEd.lineas.push({id: null, sku: '', codigo_proveedor: '', descripcion: '', cantidad: 1, precio_unitario: null, recibido: 0, cancelado: 0, pack: 1});
  _pedPintarLin();
}
function pedQuitar(i){
  const l = pedEd.lineas[i];
  if (l.recibido > 0){ alert('Ese renglón ya recibió mercadería: bajale la cantidad en vez de sacarlo.'); return; }
  pedEd.lineas.splice(i, 1);
  _pedPintarLin();
  if (document.getElementById('ped-cat')) document.getElementById('ped-cat').innerHTML = _pedCatHtml();
}
function pedCampo(i, k, v){
  const l = pedEd.lineas[i]; if (!l) return;
  if (k === 'packs'){
    const n = nmParse(v), pk = _pedPk(l);
    if (!Number.isInteger(n) || n <= 0){ alert(`Viene en pack de ${pk}: poné una cantidad entera de packs.`);
      const inp = document.getElementById('ped-pq-' + i); if (inp) inp.value = _pedN(l.cantidad / pk); return; }
    l.cantidad = n * pk;
    const u = document.getElementById('ped-u-' + i); if (u) u.textContent = `= ${_pedN(l.cantidad)} u.`;
  }
  else if (k === 'cantidad' || k === 'precio_unitario'){ const n = nmParse(v); l[k] = (k === 'precio_unitario' && !String(v).trim()) ? null : n; }
  else l[k] = v;
  const tot = document.getElementById('ped-tot'); if (tot) tot.innerHTML = _pedTotHtml();
  if (['cantidad','packs','precio_unitario'].includes(k)) pedCondRefrescar();
  if (['cantidad','packs','sku'].includes(k)){ const cat = document.getElementById('ped-cat'); if (cat && pedCat.length) cat.innerHTML = _pedCatHtml(); }
  const sub = document.getElementById('ped-sub-' + i);
  if (sub) sub.textContent = l.precio_unitario ? plata(Number(l.cantidad||0) * Number(l.precio_unitario)) : '—';
}
function _pedTotHtml(){
  const u = pedEd.lineas.reduce((a, l) => a + Number(l.cantidad||0), 0);
  const i = pedEd.lineas.reduce((a, l) => a + Number(l.cantidad||0) * Number(l.precio_unitario||0), 0);
  const pct = Number(pedEd._cond?.pct || 0);
  return `<b>${pedEd.lineas.length} renglones · ${_pedN(u)} unidades${i ? ' · ' + plata(i) : ''}</b>${pct && i ? ` <span style="color:#166534">· con ${_pedN(pct)} % extra: ${plata(i * (1 - pct/100))}</span>` : ''}`;
}
function _pedLineasHtml(){
  const L = pedEd.lineas;
  if (!L.length) return '<div class="vacio" style="padding:18px">El pedido todavía no tiene artículos: agregalos desde el catálogo de arriba.</div>';
  const conRec = L.some(l => l.recibido > 0);
  return `<div style="overflow-x:auto"><table class="fx-tbl">
    <thead><tr><th>#</th><th>SKU</th><th>Cód. proveedor</th><th>Descripción</th><th class="num" title="Los artículos en pack (caja) se piden en packs y se cuentan en unidades">Cantidad</th>
      ${conRec ? '<th class="num">Recibido</th>' : ''}<th class="num" title="Precio de la lista COMPRA vigente cuando lo hay, por unidad nuestra. Se puede corregir.">$ unitario</th><th class="num">Subtotal</th><th></th></tr></thead>
    <tbody>${L.map((l, i) => `<tr>
      <td>${i+1}</td>
      <td>${l.id || l.sku ? `<b>${esc(l.sku||'—')}</b>` : `<input class="ped-in w" style="width:90px" placeholder="(opcional)" value="${esc(l.sku)}" onchange="pedCampo(${i},'sku',this.value.toUpperCase())">`}</td>
      <td><input class="ped-in w" style="width:110px" value="${esc(l.codigo_proveedor||'')}" onchange="pedCampo(${i},'codigo_proveedor',this.value)"></td>
      <td><input class="ped-in w" style="min-width:200px" value="${esc(l.descripcion||'')}" onchange="pedCampo(${i},'descripcion',this.value)" title="${l.descripcion_proveedor ? 'El proveedor lo llama: ' + esc(l.descripcion_proveedor) : ''}">${_pedPackChip(_pedPk(l))}</td>
      <td class="num">${_pedPk(l) > 1
        ? `<input class="ped-in" id="ped-pq-${i}" inputmode="decimal" value="${_pedN(l.cantidad / _pedPk(l))}" onchange="pedCampo(${i},'packs',this.value)"
             title="Cantidad de PACKS de ${_pedPk(l)}"> <span class="mini" id="ped-u-${i}" style="white-space:nowrap">= ${_pedN(l.cantidad)} u.</span>`
        : `<input class="ped-in" inputmode="decimal" value="${_pedN(l.cantidad)}" onchange="pedCampo(${i},'cantidad',this.value)">`}</td>
      ${conRec ? `<td class="num">${_pedN(l.recibido)}</td>` : ''}
      <td class="num"><input class="ped-in" style="width:100px" inputmode="decimal" value="${l.precio_unitario != null ? _pedN(l.precio_unitario) : ''}" placeholder="—" onchange="pedCampo(${i},'precio_unitario',this.value)"></td>
      <td class="num" id="ped-sub-${i}">${l.precio_unitario ? plata(Number(l.cantidad||0) * Number(l.precio_unitario)) : '—'}</td>
      <td>${l.recibido > 0 ? '' : `<button class="act op-ico" style="background:var(--bad)" title="Sacar este renglón" onclick="pedQuitar(${i})">${ico('anular','s')}</button>`}</td></tr>`).join('')}
    </tbody><tfoot><tr><td colspan="9" id="ped-tot">${_pedTotHtml()}</td></tr></tfoot></table></div>`;
}

async function pedGuardar(enviar){
  const e = pedEd;
  e.fecha = document.getElementById('ped-fecha')?.value || e.fecha;
  e.entrega_estimada = document.getElementById('ped-entrega')?.value || '';
  e.notas = document.getElementById('ped-notas')?.value || '';
  if (!e.proveedor_nombre){ alert('Elegí el proveedor.'); return; }
  if (!e.lineas.length){ alert('El pedido no tiene artículos.'); return; }
  if (e.lineas.some(l => !(Number(l.cantidad) > 0))){ alert('Hay renglones con cantidad 0.'); return; }
  if (e.lineas.some(l => !String(l.descripcion||'').trim() && !String(l.sku||'').trim())){ alert('Hay renglones sin SKU ni descripción.'); return; }
  const malPack = e.lineas.find(l => _pedPk(l) > 1 && Number(l.cantidad) % _pedPk(l) !== 0);
  if (malPack){ alert(`${malPack.sku || malPack.descripcion} viene en pack de ${_pedPk(malPack)}: la cantidad tiene que ser múltiplo (${_pedN(Math.floor(malPack.cantidad/_pedPk(malPack))*_pedPk(malPack))} o ${_pedN(Math.ceil(malPack.cantidad/_pedPk(malPack))*_pedPk(malPack))} unidades).`); return; }
  if (enviar){
    const b = _pedBase(e.lineas);
    const {data: c} = await sb.rpc('compras_pedido_condiciones', {p_cuit: e.proveedor_cuit || null,
      p_codigo: e.proveedor_codigo || null, p_importe: b.importe, p_unidades: b.unidades});
    if (c && c.minimo && !c.minimo.cumple){
      const falta = [c.minimo.falta_importe > 0 ? plata(c.minimo.falta_importe) : null,
                     c.minimo.falta_unidades > 0 ? `${_pedN(Math.ceil(c.minimo.falta_unidades))} unidades` : null].filter(Boolean).join(' / ');
      if (!confirm(`⚠ El pedido NO llega a la compra mínima del proveedor (faltan ${falta}).${c.minimo.nota ? '\n' + c.minimo.nota : ''}\n\n¿Lo marcás como enviado igual?`)) return;
    }
  }
  const {data, error} = await sb.rpc('compras_pedido_guardar', {p_id: e.id,
    p_cab: {es_prueba: MODO_PRUEBA, proveedor_codigo: e.proveedor_codigo, proveedor_cuit: e.proveedor_cuit,
            proveedor_nombre: e.proveedor_nombre, fecha: e.fecha, entrega_estimada: e.entrega_estimada || null, notas: e.notas},
    p_lineas: e.lineas.map(l => ({id: l.id, sku: l.sku || null, codigo_proveedor: l.codigo_proveedor || null,
      descripcion: l.descripcion || l.sku, cantidad: l.cantidad, precio_unitario: l.precio_unitario,
      pack: _pedPk(l), descripcion_proveedor: l.descripcion_proveedor || null}))});
  if (error){ alert(error.message); return; }
  const id = data.id;
  if (enviar){
    const r = await sb.rpc('compras_pedido_accion', {p_id: id, p_accion: 'enviar', p_motivo: null});
    if (r.error){ alert(r.error.message); return; }
  }
  pedCerrarModal();
  await vistaPedidos();
  await pedAbrir(id);
  if (enviar && confirm(`Pedido Nº ${_pedNro(data.numero)} marcado como ENVIADO.\n\n¿Descargar el PDF para mandarle al proveedor?`)) pedPdf(id);
}

function pedCerrarModal(){ document.getElementById('ped-overlay')?.remove(); }
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && document.getElementById('ped-overlay')) pedCerrarModal(); });

// ── Detalle ───────────────────────────────────────────────────────────
let pedDet = null;
async function pedAbrir(id){
  const {data, error} = await sb.rpc('compras_pedido_detalle', {p_id: id});
  if (error){ alert(error.message); return; }
  pedDet = data;
  _pedDetalle(false);
}
function _pedDetalle(recibiendo){
  const p = pedDet.pedido, L = pedDet.lineas || [], E = pedDet.entregas || [];
  const abierto = ['enviado','parcial'].includes(p.estado);
  let ov = document.getElementById('ped-overlay');
  if (!ov){ ov = document.createElement('div'); ov.id = 'ped-overlay'; document.body.appendChild(ov); }
  ov.onclick = ev => { if (ev.target === ov) pedCerrarModal(); };
  const venc = abierto && p.entrega_estimada && p.entrega_estimada < _hoyAR();
  ov.innerHTML = `<div class="c-box">
    <div class="c-head"><div style="flex:1">
      <b style="font-size:16px">📝 Pedido Nº ${_pedNro(p.numero)} · ${esc(p.proveedor_nombre)}</b>
      <div style="font-size:12.5px;opacity:.9;margin-top:3px">${_pedChip(p.estado)} · ${fechaCorta(p.fecha)}
        ${p.entrega_estimada ? ` · entrega estimada ${fechaCorta(p.entrega_estimada)}${venc ? ' ⚠ vencida' : ''}` : ''}
        ${p.enviado_at ? ` · enviado por ${esc(p.enviado_por||'')}` : ''}</div></div>
      <button class="m-x" onclick="pedCerrarModal()">✕</button></div>
    <div class="c-body">
      ${p.notas ? `<p style="margin-bottom:8px;font-size:13px">📌 ${esc(p.notas)}</p>` : ''}
      ${p.cierre_motivo ? `<div class="alerta" style="background:#f1f5f9;border-left-color:#64748b;color:#334155">
        ${p.estado === 'anulado' ? 'Anulado' : 'Cerrado'} por ${esc(p.cerrado_por||'')} el ${_fechaTs(p.cerrado_at)}: ${esc(p.cierre_motivo)}</div>` : ''}
      ${p.estado === 'borrador' ? `<div class="alerta" style="background:#fffbeb;border-left-color:#d97706;color:#92400e">
        Está en BORRADOR: todavía no descuenta entregas. Cuando lo mandes al proveedor tocá 📤 Marcar como enviado.</div>` : ''}
      ${recibiendo ? `<div class="alerta" style="background:#eff6ff;border-left-color:#2563eb;color:#1e3a8a">
        Cargá lo que llegó en la columna <b>Recibe ahora</b>, en UNIDADES (un pack ×2 son 2). Si el proveedor manda remito con SKU, esto se descuenta solo:
        recibí a mano solo lo que no viene por remito, para no contarlo dos veces.</div>` : ''}
      <div style="overflow-x:auto"><table class="fx-tbl">
        <thead><tr><th>#</th><th>SKU</th><th>Descripción</th><th class="num">Pedido</th><th class="num">Recibido</th>
          <th class="num">Cancelado</th><th class="num">Pendiente</th><th class="num">$ unit.</th>
          ${recibiendo ? '<th class="num">Recibe ahora</th>' : ''}</tr></thead>
        <tbody>${L.map(l => `<tr>
          <td>${l.nroitem}</td><td><b>${esc(l.sku||'—')}</b>${l.codigo_proveedor ? `<div class="mini">${esc(l.codigo_proveedor)}</div>` : ''}</td>
          <td>${esc(l.descripcion)}${_pedPackChip(_pedPk(l))}</td><td class="num">${_pedN(l.cantidad)}${_pedPk(l) > 1 ? `<div class="mini">${_pedPacksTxt(l.cantidad, _pedPk(l))}</div>` : ''}</td>
          <td class="num">${Number(l.recibido) ? _pedN(l.recibido) : '—'}</td>
          <td class="num">${Number(l.cantidad_cancelada) ? _pedN(l.cantidad_cancelada) : '—'}</td>
          <td class="num">${Number(l.pendiente) ? `<b>${_pedN(l.pendiente)}</b>` : '<span class="ped-ok">✓</span>'}</td>
          <td class="num">${l.precio_unitario != null ? plata(l.precio_unitario) : '—'}</td>
          ${recibiendo ? `<td class="num"><input class="ped-in ped-rec" data-l="${l.id}" inputmode="decimal" placeholder="0"
              ${Number(l.pendiente) > 0 ? '' : 'title="Ya no queda pendiente (solo sirve para corregir con negativo)"'}></td>` : ''}</tr>`).join('')}
        </tbody>
        <tfoot><tr><td colspan="3"><b>Totales</b></td>
          <td class="num"><b>${_pedN(p.unidades)}</b></td><td class="num"><b>${_pedN(p.recibido)}</b></td>
          <td class="num">${Number(p.cancelado) ? _pedN(p.cancelado) : '—'}</td><td class="num"><b>${_pedN(p.pendiente)}</b></td>
          <td class="num">${Number(p.importe) ? plata(p.importe) : ''}${Number(p.descuento_extra_pct) && Number(p.importe) ? `<div class="mini" style="color:#166534">−${_pedN(p.descuento_extra_pct)} % = ${plata(p.importe_neto)}</div>` : ''}</td>${recibiendo ? '<td></td>' : ''}</tr></tfoot></table></div>
      ${p.condiciones ? _pedCondHtml(p.condiciones, p.importe, ['borrador','enviado','parcial'].includes(p.estado)) : ''}
      ${recibiendo ? `<div class="filtros" style="margin-top:10px">
          <label class="mini">Fecha <input type="date" id="ped-rec-f" value="${_hoyAR()}"></label>
          <input id="ped-rec-n" placeholder="Nota (remito papel nº, quién recibió…; obligatoria si corregís con negativo)" style="flex:1;min-width:220px">
        </div>` : ''}
      <h4 style="margin:16px 0 6px;font-size:13.5px">📦 Entregas registradas</h4>
      ${E.length ? `<div style="overflow-x:auto"><table class="fx-tbl"><thead><tr><th>Fecha</th><th>SKU</th><th>Descripción</th>
          <th class="num">Cantidad</th><th>Origen</th><th>Nota</th></tr></thead>
        <tbody>${E.map(x => `<tr><td>${fechaCorta(x.fecha)}</td><td>${esc(x.sku||'—')}</td><td>${esc(x.descripcion)}</td>
          <td class="num" style="${Number(x.cantidad)<0?'color:var(--bad)':''}">${_pedN(x.cantidad)}</td>
          <td>${x.origen === 'remito' ? '🚚 remito (automático)' : '✋ a mano · ' + esc(x.por||'')}</td>
          <td class="mini">${esc(x.nota||'')}</td></tr>`).join('')}</tbody></table></div>`
        : '<div class="mini">Todavía no entregó nada.</div>'}
    </div>
    <div class="c-pie">
      ${recibiendo ? `<button class="act gh" onclick="_pedDetalle(false)">Cancelar</button><span style="flex:1"></span>
                      <button class="act" onclick="pedRecibirGuardar()">📥 Registrar recepción</button>`
      : `<button class="act gh" onclick="pedPdf(${p.id})">⬇ PDF</button>
         <button class="act gh" onclick="pedExcel(${p.id})">⬇ Excel</button>
         <span style="flex:1"></span>
         ${!['cerrado','anulado'].includes(p.estado) ? `<button class="act gh" onclick="pedCerrarModal();pedEditar(${p.id})">✏️ Editar</button>` : ''}
         ${p.estado === 'borrador' ? `<button class="act" onclick="pedAccion(${p.id},'enviar')">📤 Marcar como enviado</button>` : ''}
         ${abierto ? `<button class="act gh" onclick="_pedDetalle(true)">📥 Recibir a mano</button>
                      <button class="act gh" onclick="pedAccion(${p.id},'cerrar')" title="El saldo pendiente se da por cancelado">🔒 Cerrar saldo</button>` : ''}
         ${p.estado === 'cerrado' ? `<button class="act gh" onclick="pedAccion(${p.id},'reabrir')">↩ Reabrir</button>` : ''}
         ${!['anulado','cerrado','completo'].includes(p.estado) && !Number(p.recibido) ? `<button class="act gh" style="color:var(--bad);border-color:var(--bad)" onclick="pedAccion(${p.id},'anular')">✖ Anular</button>` : ''}`}
    </div></div>`;
}

async function pedAccion(id, accion){
  let motivo = null;
  if (accion === 'cerrar'){
    motivo = prompt('Cerrar el pedido: todo lo que falta entregar se da por CANCELADO y sale del listado de pendientes.\n\n¿Por qué se cierra? (ej.: el proveedor no tiene más, se pidió por otro lado)');
    if (motivo === null) return; if (!motivo.trim()){ alert('El motivo es obligatorio.'); return; }
  }
  if (accion === 'anular'){
    motivo = prompt('Anular el pedido (queda registrado pero sin efecto).\n\n¿Por qué se anula?');
    if (motivo === null) return; if (!motivo.trim()){ alert('El motivo es obligatorio.'); return; }
  }
  if (accion === 'reabrir' && !confirm('Reabrir el pedido: lo cancelado vuelve a quedar pendiente. ¿Seguimos?')) return;
  const {data, error} = await sb.rpc('compras_pedido_accion', {p_id: id, p_accion: accion, p_motivo: motivo});
  if (error){ alert(error.message); return; }
  if (accion === 'enviar' && data.imputadas) alert(`Se descontaron ${data.imputadas} entregas de remitos que ya habían llegado.`);
  await vistaPedidos();
  await pedAbrir(id);
}

async function pedRecibirGuardar(){
  const items = [...document.querySelectorAll('.ped-rec')].map(i => ({linea_id: Number(i.dataset.l), cantidad: nmParse(i.value)}))
    .filter(x => x.cantidad);
  if (!items.length){ alert('No cargaste ninguna cantidad.'); return; }
  const {data, error} = await sb.rpc('compras_pedido_recibir', {p_pedido: pedDet.pedido.id, p_items: items,
    p_fecha: document.getElementById('ped-rec-f').value || null, p_nota: document.getElementById('ped-rec-n').value || null});
  if (error){ alert(error.message); return; }
  const id = pedDet.pedido.id;
  await vistaPedidos();
  await pedAbrir(id);
}

// ── Exportar: Excel (SheetJS, se carga solo cuando hace falta) ─────────
async function _pedXlsx(){
  if (window.XLSX) return window.XLSX;
  await new Promise((ok, mal) => { const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
  return window.XLSX;
}
async function pedExcel(id){
  const {data, error} = await sb.rpc('compras_pedido_detalle', {p_id: id});
  if (error){ alert(error.message); return; }
  const X = await _pedXlsx(); const p = data.pedido;
  const conPrecio = (data.lineas||[]).some(l => l.precio_unitario != null);
  const filas = [['Claudia Adorno SRL — ORDEN DE PEDIDO Nº ' + _pedNro(p.numero)], ['Proveedor', p.proveedor_nombre],
    ['Fecha', fechaCorta(p.fecha)], ['Entrega estimada', p.entrega_estimada ? fechaCorta(p.entrega_estimada) : ''],
    ['Entregar en', data.empresa.entrega], ['Notas', p.notas || ''], [],
    ['#', 'Código proveedor', 'Descripción proveedor', 'SKU', 'Descripción', 'Pack (u. por pack)', 'Cantidad a pedir', 'Unidad', 'Unidades',
     ...(conPrecio ? ['Precio por pack/unidad', 'Subtotal'] : [])]];
  (data.lineas||[]).forEach(l => { const pk = _pedPk(l);
    filas.push([l.nroitem, l.codigo_proveedor || '', l.descripcion_proveedor || '', l.sku || '', l.descripcion, pk,
      Number(l.cantidad) / pk, pk > 1 ? 'packs' : 'unidades', Number(l.cantidad),
      ...(conPrecio ? [l.precio_unitario != null ? Number(l.precio_unitario) * pk : '', l.precio_unitario != null ? Number(l.cantidad) * Number(l.precio_unitario) : ''] : [])]); });
  if (conPrecio && Number(p.importe)){
    filas.push([], ['', '', '', '', 'Total estimado', '', '', '', '', '', Number(p.importe)]);
    if (Number(p.descuento_extra_pct)){
      const dd = p.condiciones?.descuento;
      filas.push(['', '', '', '', `Descuento por volumen ${_pedN(p.descuento_extra_pct)} %${dd ? ' (desde ' + _pedUmbralTxt(dd) + ')' : ''}`, '', '', '', '', '', -Math.round(Number(p.importe) * Number(p.descuento_extra_pct)) / 100]);
      filas.push(['', '', '', '', 'Total con descuento', '', '', '', '', '', Number(p.importe_neto)]);
    }
  }
  const ws = X.utils.aoa_to_sheet(filas); ws['!cols'] = [{wch:5},{wch:18},{wch:30},{wch:14},{wch:40},{wch:9},{wch:10},{wch:9},{wch:9},{wch:14},{wch:14}];
  const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Pedido');
  X.writeFile(wb, `Pedido ${_pedNro(p.numero)} ${String(p.proveedor_nombre).replace(/[\\/:*?"<>|]/g,'')}.xlsx`);
}
async function pedPendExcel(){
  const rows = _pedPendFiltrados();
  if (!rows.length){ alert('No hay pendientes con ese filtro.'); return; }
  const X = await _pedXlsx();
  const filas = [['Proveedor','Pedido Nº','Fecha pedido','Entrega estimada','SKU','Código proveedor','Descripción','Pack','Pedido (u.)','Recibido','Cancelado','Pendiente (u.)','Pendiente (packs)','Precio unitario','Pendiente $','Días']];
  rows.forEach(l => { const pk = _pedPk(l); filas.push([l.proveedor_nombre, l.pedido_numero, fechaCorta(l.fecha), l.entrega_estimada ? fechaCorta(l.entrega_estimada) : '',
    l.sku || '', l.codigo_proveedor || '', l.descripcion, pk, Number(l.cantidad), Number(l.recibido), Number(l.cantidad_cancelada), Number(l.pendiente),
    pk > 1 ? Number(l.pendiente) / pk : '',
    l.precio_unitario != null ? Number(l.precio_unitario) : '', l.precio_unitario != null ? Number(l.pendiente) * Number(l.precio_unitario) : '', _pedDias(l.fecha)]); });
  const ws = X.utils.aoa_to_sheet(filas);
  ws['!cols'] = [{wch:32},{wch:9},{wch:12},{wch:12},{wch:14},{wch:16},{wch:44},{wch:6},{wch:9},{wch:9},{wch:9},{wch:10},{wch:10},{wch:12},{wch:13},{wch:6}];
  const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Pendiente de entrega');
  X.writeFile(wb, `Pendiente de entrega${PED_PROV_PEND ? ' ' + PED_PROV_PEND.replace(/[\\/:*?"<>|]/g,'') : ''} ${_hoyAR()}.xlsx`);
}

// ── Exportar: PDF (jsPDF + cabecera de op-pdf.js) ──────────────────────
function _pedPdfTabla(doc, fnt, cols, filas, y0, alto){
  // cols: [{t, x, w, der}] · devuelve la y final; corta página cuando no entra
  const cab = () => { doc.setFont(fnt, 'bold'); doc.setFontSize(7.5);
    cols.forEach(c => doc.text(c.t, c.der ? c.x + c.w : c.x, y, {align: c.der ? 'right' : 'left'}));
    doc.setLineWidth(0.2); doc.line(14, y + 1.5, 196, y + 1.5); y += 5; doc.setFont(fnt, 'normal'); };
  let y = y0; cab();
  filas.forEach(f => {
    const partes = cols.map((c, i) => c.der ? [String(f[i] ?? '')] : doc.splitTextToSize(String(f[i] ?? ''), c.w));
    const h = Math.max(...partes.map(p => p.length)) * 3.4 + 1;
    if (y + h > alto){ doc.addPage(); y = 16; cab(); }
    doc.setFontSize(8);
    partes.forEach((p, i) => { const c = cols[i]; doc.text(p, c.der ? c.x + c.w : c.x, y, {align: c.der ? 'right' : 'left'}); });
    y += h;
  });
  return y;
}
async function pedPdf(id){
  const {data, error} = await sb.rpc('compras_pedido_detalle', {p_id: id});
  if (error){ alert(error.message); return; }
  const p = data.pedido, L = data.lineas || [], emp = data.empresa, pv = data.proveedor || {};
  const { jsPDF } = window.jspdf; const doc = new jsPDF({unit: 'mm', format: 'a4'});
  const fnt = (typeof _opCargarFuente === 'function' && await _opCargarFuente(doc)) ? 'AdornoTitulo' : 'helvetica';
  _pdfCabecera(doc, emp, `ORDEN DE PEDIDO N°   ${_pedNro(p.numero)}`,
    [`FECHA: ${_pdfF(p.fecha)}`, `CUIT: ${_pdfCuit(emp.cuit)}`, p.entrega_estimada ? `Entrega estimada: ${_pdfF(p.entrega_estimada)}` : '',
     'Documento no válido como factura'], fnt);
  doc.line(14, 41, 196, 41);
  doc.setFontSize(9); doc.setFont(fnt, 'bold'); doc.text('Proveedor:', 14, 47);
  doc.setFont(fnt, 'normal'); doc.text(`${p.proveedor_nombre}${p.proveedor_cuit ? '   ·   CUIT ' + _pdfCuit(p.proveedor_cuit) : ''}`, 34, 47);
  let y = 51.5;
  if (pv.domicilio || pv.email || pv.telefono){ doc.setFontSize(8);
    doc.text([pv.domicilio, pv.email, pv.telefono].filter(Boolean).join('   ·   '), 34, y); y += 4.5; }
  doc.setFontSize(9); doc.setFont(fnt, 'bold'); doc.text('Entregar en:', 14, y); doc.setFont(fnt, 'normal'); doc.text(emp.entrega, 34, y); y += 4.5;
  if (p.notas){ const n = doc.splitTextToSize(p.notas, 160); doc.setFont(fnt, 'bold'); doc.text('Notas:', 14, y);
    doc.setFont(fnt, 'normal'); doc.text(n, 34, y); y += n.length * 4 + 0.5; }
  doc.line(14, y, 196, y); y += 5;
  const conPrecio = L.some(l => l.precio_unitario != null);
  const cols = conPrecio
    ? [{t:'#',x:14,w:6},{t:'CÓD. PROV.',x:21,w:24},{t:'SKU',x:46,w:22},{t:'DESCRIPCIÓN',x:69,w:62},{t:'CANTIDAD',x:132,w:20,der:true},{t:'P. UNIT.',x:153,w:19,der:true},{t:'SUBTOTAL',x:173,w:23,der:true}]
    : [{t:'#',x:14,w:6},{t:'CÓD. PROV.',x:21,w:28},{t:'SKU',x:50,w:26},{t:'DESCRIPCIÓN',x:77,w:94},{t:'CANTIDAD',x:172,w:24,der:true}];
  // (29-sep) Al proveedor se le pide en PACKS cuando lo vende así: "4 packs x2"; el precio va por pack.
  const cantTxt = l => { const pk = _pedPk(l); return pk > 1 ? `${_pedN(l.cantidad/pk)} pack${l.cantidad/pk===1?'':'s'} x${pk}` : _pedN(l.cantidad); };
  const descTxt = l => l.descripcion + (l.descripcion_proveedor ? '\n' + l.descripcion_proveedor : '');
  const filas = L.map(l => conPrecio
    ? [l.nroitem, l.codigo_proveedor||'', l.sku||'', descTxt(l), cantTxt(l), l.precio_unitario != null ? _pdfN(Number(l.precio_unitario) * _pedPk(l)) : '',
       l.precio_unitario != null ? _pdfN(Number(l.cantidad) * Number(l.precio_unitario)) : '']
    : [l.nroitem, l.codigo_proveedor||'', l.sku||'', descTxt(l), cantTxt(l)]);
  y = _pedPdfTabla(doc, fnt, cols, filas, y, 272);
  doc.line(14, y, 196, y); y += 5;
  doc.setFont(fnt, 'bold'); doc.setFontSize(9);
  doc.text(`${L.length} renglones · ${_pedN(p.unidades)} unidades`, 14, y);
  if (conPrecio && Number(p.importe)) doc.text(`Total estimado: $ ${_pdfN(p.importe)}`, 196, y, {align: 'right'});
  if (conPrecio && Number(p.importe) && Number(p.descuento_extra_pct)){
    const dd = p.condiciones?.descuento;
    doc.setFont(fnt, 'normal');
    y += 5; doc.text(`Descuento por volumen ${_pedN(p.descuento_extra_pct)} %${dd ? ' (pedido desde ' + _pedUmbralTxt(dd).replace(/\s/g, ' ') + ')' : ''}: - $ ${_pdfN(Number(p.importe) - Number(p.importe_neto))}`, 196, y, {align: 'right'});
    doc.setFont(fnt, 'bold');
    y += 5; doc.text(`Total estimado con descuento: $ ${_pdfN(p.importe_neto)}`, 196, y, {align: 'right'});
  }
  doc.setFont(fnt, 'normal'); doc.setFontSize(7.5);
  doc.text('Por favor, indicar en el remito el N° de este pedido. Precios de referencia según lista vigente.'
    + (L.some(l => _pedPk(l) > 1) ? ' Cantidades en packs donde se indica (precio por pack).' : ''), 14, y + 6);
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++){ doc.setPage(i); doc.setFontSize(7); doc.text(`Página ${i} de ${n}`, 196, 290, {align: 'right'}); }
  doc.save(`Pedido ${_pedNro(p.numero)} ${String(p.proveedor_nombre).replace(/[\\/:*?"<>|]/g,'')}.pdf`);
}
async function pedPendPdf(){
  const rows = _pedPendFiltrados();
  if (!rows.length){ alert('No hay pendientes con ese filtro.'); return; }
  const { jsPDF } = window.jspdf; const doc = new jsPDF({unit: 'mm', format: 'a4'});
  const fnt = (typeof _opCargarFuente === 'function' && await _opCargarFuente(doc)) ? 'AdornoTitulo' : 'helvetica';
  doc.setFont(fnt, 'bold'); doc.setFontSize(13); doc.text('Mercadería pendiente de entrega', 14, 16);
  doc.setFont(fnt, 'normal'); doc.setFontSize(8.5);
  doc.text(`Claudia Adorno SRL · ${PED_PROV_PEND || 'todos los proveedores'} · al ${fechaCorta(_hoyAR())}`, 14, 21.5);
  const cols = [{t:'PROVEEDOR',x:14,w:38},{t:'PEDIDO',x:53,w:17},{t:'SKU',x:71,w:22},{t:'DESCRIPCIÓN',x:94,w:62},
                {t:'PEDIDO',x:157,w:12,der:true},{t:'RECIB.',x:170,w:12,der:true},{t:'PEND.',x:183,w:13,der:true}];
  const filas = rows.map(l => [l.proveedor_nombre, `${_pedNro(l.pedido_numero)} ${fechaCorta(l.fecha)}`, l.sku||'', l.descripcion,
                               _pedN(l.cantidad), _pedN(l.recibido), _pedN(l.pendiente)]);
  let y = _pedPdfTabla(doc, fnt, cols, filas, 29, 280);
  doc.line(14, y, 196, y); doc.setFont(fnt, 'bold'); doc.setFontSize(9);
  doc.text(`${rows.length} renglones · ${_pedN(rows.reduce((a, l) => a + Number(l.pendiente||0), 0))} unidades pendientes`, 14, y + 5);
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++){ doc.setPage(i); doc.setFont(fnt, 'normal'); doc.setFontSize(7); doc.text(`Página ${i} de ${n}`, 196, 290, {align: 'right'}); }
  doc.save(`Pendiente de entrega ${_hoyAR()}.pdf`);
}
