// ═══════════════════════════════════════════════════════════════════════
//  Compras Adorno · manual.js — Manual de uso (overlay 📖, autoinyectable)
//  🚨 REGLA: cada vez que se agrega o cambia una función del módulo,
//  actualizar la sección correspondiente acá (y bump del ?v= en index.html).
// ═══════════════════════════════════════════════════════════════════════

function _mEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _manualSecciones() {
  return [
    {
      icon: '🗂', titulo: 'Cómo se guarda una factura',
      desc: 'Todo el sistema arranca acá: el archivo se guarda en OneDrive y el nombre le dice al sistema qué es.',
      pasos: [
        'Carpeta: 2026 → PROVEEDORES → FACTURAS → el mes que corresponda.',
        'Nombre: <LETRA> <PROVEEDOR> FC <NÚMERO>.pdf — por ejemplo "G CENCOSUD SA FC 109109.pdf".',
        'La primera letra es la clasificación: G gastos · M mercadería · I inversiones · Z gastos no asociados a la actividad.',
        '🚨 UNA factura por archivo. Si un PDF trae varias, el sistema no puede contabilizarlo y lo marca para corregir.',
        'Si la factura NO va contabilizada, agregale "NO CONTABILIZA" al nombre y el sistema la saltea.',
      ],
    },
    {
      icon: '🤖', titulo: 'Qué hace el sistema solo',
      desc: 'Cada hora el motor busca facturas nuevas, las lee y las deja listas para que las controles.',
      pasos: [
        'Lee el PDF y saca proveedor, CUIT, número, fecha, total y el desglose de IVA.',
        'Verifica que las cuentas cierren: netos + IVA + percepciones tiene que dar el total.',
        'Si algo no le cierra, NO inventa: lo deja marcado para revisión. Nunca vas a ver un número inventado.',
        'Identifica al proveedor por el nombre del archivo contra el padrón de Dragonfish, así no confunde CUITs parecidos.',
      ],
    },
    {
      icon: '📥', titulo: 'Bandeja',
      desc: 'La cola del día: lo que el sistema no pudo resolver solo y necesita tu ojo.',
      pasos: [
        'Arriba ves cuántos comprobantes esperan control.',
        '📎 "Archivos con problema": el nombre no coincide con el comprobante de adentro, o el PDF trae más de una factura. Hay que corregir el archivado en OneDrive.',
        'El resto son facturas donde el sistema no pudo leer algún dato con seguridad.',
      ],
    },
    {
      icon: '📄', titulo: 'Facturas',
      desc: 'El histórico completo, desde 2019 en adelante.',
      pasos: [
        'Buscá por proveedor, número o CUIT. Filtrá por año, mes y tipo de gasto.',
        'Tocá los títulos de las columnas para ordenar.',
        'El 📄 al final de la fila indica que la factura tiene su PDF vinculado.',
      ],
    },
    {
      icon: '📊', titulo: 'Listados',
      desc: 'Reemplaza la planilla de gastos: cuánto se gastó, en qué y con quién.',
      pasos: [
        'Por tipo de gasto: cuánto se fue en gastos, mercadería, inversiones y no-actividad, con su porcentaje.',
        'Mes a mes: la evolución del año, con cada tipo en su columna.',
        'Top proveedores: los 25 más grandes del período filtrado.',
        'Todo respeta los filtros de arriba, así que podés mirar un solo mes o un solo tipo.',
      ],
    },
  ];
}

function abrirManual() {
  if (document.getElementById('manual-overlay')) return;
  const items = _manualSecciones();
  const ov = document.createElement('div');
  ov.id = 'manual-overlay';
  ov.innerHTML = `
    <div class="m-box">
      <div class="m-head">
        <span style="font-size:22px;">📖</span>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:16px;">Manual · Compras</div>
          <div style="font-size:12px;opacity:.85;">Guía rápida de cada herramienta del módulo</div>
        </div>
        <button class="m-close" onclick="cerrarManual()">✕</button>
      </div>
      ${items.map((s, i) => `
        <div class="m-sec">
          <div class="m-tit">${s.icon} ${i + 1}. ${_mEsc(s.titulo)}</div>
          <div class="m-desc">${_mEsc(s.desc)}</div>
          <ul class="m-pasos">${s.pasos.map(p => `<li>${_mEsc(p)}</li>`).join('')}</ul>
        </div>`).join('')}
      <div class="m-foot">💡 Este manual se actualiza junto con el sistema. ¿Falta algo o no funciona? Avisale a JP.</div>
    </div>`;
  ov.addEventListener('click', e => { if (e.target === ov) cerrarManual(); });
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
}

function cerrarManual() {
  const ov = document.getElementById('manual-overlay');
  if (ov) ov.remove();
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarManual(); });

(function _manualInit() {
  const css = document.createElement('style');
  css.textContent = `
    #manual-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:20px 12px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
    #manual-overlay .m-box{background:#f8fafc;border-radius:14px;max-width:760px;width:100%;padding-bottom:6px;box-shadow:0 20px 60px rgba(0,0,0,.3);}
    #manual-overlay .m-head{position:sticky;top:0;background:#ea580c;color:#fff;padding:14px 18px;border-radius:14px 14px 0 0;display:flex;align-items:center;gap:10px;z-index:1;}
    #manual-overlay .m-close{background:rgba(255,255,255,.18);border:none;color:#fff;font-size:16px;border-radius:8px;padding:6px 11px;cursor:pointer;}
    #manual-overlay .m-sec{background:#fff;border:1px solid #e2e8f0;border-left:4px solid #ea580c;border-radius:10px;margin:14px 14px 0;padding:14px 18px;}
    #manual-overlay .m-tit{font-weight:700;font-size:15px;margin-bottom:4px;color:#9a3412;}
    #manual-overlay .m-desc{font-size:13px;color:#475569;margin-bottom:8px;}
    #manual-overlay .m-pasos{margin:0 0 2px 18px;padding:0;font-size:13px;line-height:1.65;color:#334155;}
    #manual-overlay .m-pasos li{margin-bottom:4px;}
    #manual-overlay .m-foot{margin:16px 14px 12px;background:#fef3c7;border-left:4px solid #d97706;border-radius:8px;padding:11px 14px;font-size:12.5px;color:#92400e;}`;
  document.head.appendChild(css);

  const poner = () => {
    const hdr = document.querySelector('header');
    if (!hdr || document.getElementById('btn-manual')) return;
    const b = document.createElement('button');
    b.id = 'btn-manual'; b.className = 'hbtn'; b.textContent = '📖';
    b.title = 'Manual de uso';
    b.onclick = abrirManual;
    hdr.insertBefore(b, hdr.querySelector('.hbtn'));
  };
  poner();
  new MutationObserver(poner).observe(document.body, { childList: true, subtree: true });
})();
