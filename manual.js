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
      icon: '🏢', titulo: 'Proveedores',
      desc: 'La ficha de cada proveedor con los datos que el módulo necesita y Dragonfish no tiene.',
      pasos: [
        'El listado trae los 1.300 proveedores ordenados por cuántas facturas les cargamos. Se busca por nombre o por CUIT.',
        'El nombre, CUIT, mail y teléfono los manda Dragonfish y se actualizan solos cada 4 horas: si los cambiás allá, acá se ven al rato.',
        'Lo que cargás en la ficha (condición de pago, CBU, mail para la orden de pago, condición de IVA, notas) es del módulo y NO se pisa con el sync. Va a servir para emitir las órdenes de pago.',
        '➕ Nuevo proveedor es SOLO para los que no están en Dragonfish. Si ya existe, el sistema no lo duplica: te avisa y te muestra cuál es.',
        'Proveedores del exterior: se tildan como tales y no piden CUIT (Anthropic, por ejemplo). Sus compras no llevan IVA discriminado y van aparte en el Libro IVA.',
        '⚠ Dragonfish tiene 36 CUITs cargados con dos fichas distintas (el mismo proveedor con dos nombres). Cuando pasa, el listado te lo avisa: completá los datos en UNA sola.',
        'La ficha tiene bloques: datos comerciales (pago, IVA, CBU), contacto de la empresa (teléfono, WhatsApp, mails, web — con botones que abren el chat de WhatsApp o el mail directo), personas de contacto (nombre, cargo y sus teléfonos/mails), descuentos pactados (varios por proveedor: general, por compra mínima, por cantidad, por pronto pago) y retenciones (qué régimen le aplica y si tiene certificado de exclusión con su vencimiento; vencido se marca en rojo).',
        '🔍 Validar en ARCA: al dar de alta un proveedor argentino el sistema consulta la constancia de inscripción en ARCA y muestra razón social oficial, si el CUIT está VIGENTE (activo) o no, condición frente al IVA, domicilio fiscal y actividad. Sin esa validación no se da de alta; si ARCA lo da INACTIVO te pide confirmar.',
        'En la ficha de cualquier proveedor está el mismo botón para re-consultar. El listado marca "ARCA ✓" o "ARCA ⚠" según la última consulta guardada.',
        'Vigilancia: una vez por mes se re-consultan los proveedores con compras recientes. Si alguno pasa a NO vigente, JP recibe un aviso para revisarlo antes de pagarle.',
      ],
    },
    {
      icon: '🔐', titulo: 'Entrar una sola vez',
      desc: 'La sesión se comparte entre todos los módulos del sistema.',
      pasos: [
        'En el Hub, con el ícono 👤 de arriba, ingresás con tu usuario y podés tildar "Confiar en esta computadora".',
        'Con eso tildado, entrás a todos los módulos de ese equipo sin volver a escribir la clave.',
        'En las computadoras de los locales, que usan varias personas, NO se tilda: cada módulo sigue pidiendo usuario y contraseña por separado.',
        'Al salir de cualquier módulo se cierra la sesión en todos. La computadora sigue marcada como de confianza hasta que lo apagues desde el Hub.',
      ],
    },
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
      icon: '🔄', titulo: 'El circuito del día a día',
      desc: 'Para las facturas nuevas ya no hace falta esperar el archivo mensual: el circuito arranca en la carpeta CONTABILIZAR.',
      pasos: [
        'Dejá el PDF en DOCUMENTOS → CONTABILIZAR → SIN CONTABILIZAR, con la nomenclatura de siempre (G/M/I/Z + proveedor + FC número).',
        'En la Bandeja tocá 🤖 "Leer SIN CONTABILIZAR": en menos de un minuto el motor lee los PDFs nuevos y los trae con el concepto propuesto. La franja 🤖 muestra la última pasada y qué archivos ignoró.',
        '🚨 Solo procesa PDFs SUELTOS en la raíz y con nomenclatura. Subcarpetas, otros formatos y nombres fuera de norma quedan listados como "fuera de norma" — corregí el nombre y en la próxima pasada entra.',
        'Si un escaneo salió mal y lo reemplazás con el MISMO nombre, el motor no lo reintenta solo (recuerda lo que ya intentó): renombralo apenas distinto o avisale a JP.',
        'El sistema NO mueve los archivos entre carpetas: mientras siga el Dragonfish, mover cada PDF por el circuito sigue siendo trabajo de administración.',
        '🧪 Si arriba de todo hay una franja amarilla "AMBIENTE DE PRUEBA", el módulo está en etapa de test: muestra solo comprobantes de prueba y el motor trabaja sobre la carpeta CONTABILIZAR → PRUEBA. El histórico real está guardado pero oculto.',
      ],
    },
    {
      icon: '💵', titulo: 'Facturas en dólares (Anthropic, software, etc.)',
      desc: 'El Dragonfish las rechazaba y quedaban como "NO CONTABILIZABLE". Este sistema sí las toma.',
      pasos: [
        'Nombrala normal: "G ANTHROPIC FC xxx.pdf" — SIN el "NO CONTABILIZABLE".',
        'El motor la pesifica solo con el dólar oficial VENTA del día de emisión, y SIEMPRE muestra qué cotización usó (en la Bandeja, en el control y en el resumen).',
        'Si el cambio real fue otro (el del resumen de la tarjeta, por ejemplo), corregí la cotización en el control: el total en pesos se recalcula.',
        'No entran al Libro IVA (si corresponde declararlas lo define el estudio) pero SÍ computan como gasto real del negocio — que es el punto: hoy esa plata es invisible en los listados.',
        'El proveedor extranjero se da de alta solo (código EXT-…) la primera vez.',
      ],
    },
    {
      icon: '🤖', titulo: 'Qué hace el sistema solo',
      desc: 'El motor busca facturas nuevas, las lee y las deja listas para que las controles.',
      pasos: [
        'Lee el PDF y saca proveedor, CUIT, número, fecha, total y el desglose de IVA.',
        'Verifica que las cuentas cierren: netos + IVA + percepciones tiene que dar el total.',
        'Si algo no le cierra, NO inventa: lo deja marcado para revisión. Nunca vas a ver un número inventado.',
        'Identifica al proveedor por el nombre del archivo contra el padrón de Dragonfish, así no confunde CUITs parecidos.',
      ],
    },
    {
      icon: '📥', titulo: 'Bandeja · el control',
      desc: 'La cola del día. Cada factura llega con un concepto contable propuesto y el motivo por el que el sistema lo propone.',
      pasos: [
        'Los cuatro números de arriba: cuántas esperan control, cuántas se contabilizaron solas (solo hay que confirmarlas), cuántas necesitan que vos decidas, y cuántos archivos están mal armados.',
        '🟢 Confianza alta: el proveedor viene usando siempre el mismo concepto. Mirá que tenga sentido y confirmá.',
        '🟡 Confianza media: el proveedor viene alternando conceptos. Acá sí hay que pensarlo.',
        '🔴 Sin propuesta: proveedor nuevo. La primera se contabiliza a mano; de ahí en más el sistema ya sabe.',
        '🚨 El motivo está escrito para que puedas DESCONFIAR. Si dice "las dos últimas usaron este concepto" pero vos sabés que esas dos fueron atípicas, corregilo.',
      ],
    },
    {
      icon: '✓', titulo: 'Controlar una factura',
      desc: 'Se abre con el botón "Controlar" y muestra todo lo que hace falta para decidir, sin ir a buscar nada.',
      pasos: [
        'Arriba: neto, IVA y total leídos del PDF, más el nombre del archivo.',
        'Los botones de "conceptos que ya usó este proveedor" son el atajo: casi siempre es uno de esos dos o tres.',
        '🧾 Desglose impositivo: debajo de Neto / IVA / Total se abre el detalle impuesto por impuesto — IVA por alícuota (21 / 10,5 / 27), percepción de IVA, IIBB CABA, IIBB Buenos Aires y otros tributos — cada uno con su base, su % efectivo y su importe. Si el % efectivo no coincide con el nominal aparece ⚠ (base mal leída); si neto + impuestos no llegan al total, avisa cuánto falta. Con "✏ Corregir importes" se editan a mano todos los importes (netos, IVA por alícuota, percepciones, total) si el motor leyó mal: el sistema exige que neto + impuestos = total, marca la factura como corregida y deja asentado quién cambió qué.',
        'Si no, escribí el código en el campo — se autocompleta contra el catálogo entero.',
        '"Dividir en otro concepto" sirve para las facturas que se reparten (por ejemplo, flete aparte, o gasto partido entre sucursales). El cartelito de abajo te avisa si los importes no suman el neto.',
        '"✳ Concepto nuevo" crea un concepto contable que no existe en el catálogo (código, descripción y alícuota de IVA) sin salir del control, y lo deja puesto en la línea.',
        'Las dos casillas del final son independientes: "Libro IVA" es la contabilidad formal y "gasto real" es la mirada de gestión. Hay gastos que van a una y no a la otra.',
        'Rechazar saca la factura de la cola (duplicada, mal archivada, no corresponde) y te pide el motivo — sin motivo nadie entiende después por qué quedó afuera.',
      ],
    },
    {
      icon: '🚚', titulo: 'Mercadería · control de precios y descuentos',
      desc: 'Cada factura de Familia García Regueira controlada renglón por renglón, sin leer el PDF.',
      pasos: [
        'El número de la factura de FGR es el mismo del remito que ya está en el sistema. El control cruza: qué vino y cuánto (remito) × el precio con descuento pactado (lista COSTO a la fecha) = lo que la factura debería decir.',
        '✅ Coincide: precios y descuentos son los de lista, al peso.',
        '🔺 Facturada de MÁS: el proveedor cobró por encima de la lista. Puede ser sobreprecio o una lista desactualizada en el Dragonfish — el botón "Detalle" muestra artículo por artículo cuál difiere.',
        '🔻 De menos: a favor nuestro. Conviene mirarla igual.',
        '❔ Sin remito: todavía no se importó el archivo del proveedor, o la factura no lleva remito.',
        'El descuento es POR ARTÍCULO (servilletas 25 %, cosmética 30 %): por eso se compara contra la lista COSTO y no contra un porcentaje único.',
        '📦 Remitos sin factura: la mercadería suele entrar primero por remito y la factura llega después. Esta lista muestra lo recibido que ninguna factura cubre todavía — el control para que el stock no se cuente dos veces ni quede mercadería sin facturar. Se asocia solo cuando factura y remito tienen el mismo número y proveedor; el resto, botón 🔗 Asociar.',
        'Si un remito lleva más de 30 días sin factura (queda en rojo), reclamársela al proveedor.',
        '➕ Cargar remito: cuando llega mercadería de cualquier proveedor (Espalma, etc.) antes que la factura, cargá el remito acá: proveedor, número, sucursal y los renglones (cantidad + SKU nuestro — si el papel trae el código del proveedor, traducilo con 🔗 Equivalencias).',
        'Al guardar se descarga el TXT para importar al Dragonfish: el stock entra UNA sola vez, por el mismo circuito que los archivos de FGR. Nada de cargar los renglones dos veces.',
        'Cuando después llegue la factura de ese remito, el sistema la engancha (o la enganchás con 🔗) y de paso le corre el control de precios renglón por renglón.',
      ],
    },
    {
      icon: '🧠', titulo: 'Cómo aprende el sistema',
      desc: 'No hay reglas que mantener a mano: aprende de lo que ustedes contabilizan.',
      pasos: [
        'Cada vez que confirmás o corregís, esa decisión pasa a ser el historial del proveedor.',
        'La próxima factura de ese proveedor se propone con lo último que decidieron.',
        'Medido contra las 1.147 facturas de 2026 ya cargadas en el Dragonfish: cuando las dos últimas coincidieron, acierta el 96 %.',
        'Por eso corregir vale doble: arreglás esta factura y las que vengan.',
      ],
    },
    {
      icon: '📄', titulo: 'Facturas',
      desc: 'El listado de lo YA contabilizado (histórico desde 2019 + lo que se aprueba en la Bandeja). Lo que espera control no aparece acá hasta que le das el OK.',
      pasos: [
        'Buscá por proveedor, número o CUIT. Filtrá por año, mes y tipo de gasto.',
        'Tocá los títulos de las columnas para ordenar.',
        'Tocá una factura y se abre el resumen de cómo se contabilizó: conceptos, importes, alícuotas, quién la aprobó.',
        'El ✏️ del resumen permite corregir la contabilización — queda marcada como corregida y asentado quién la cambió. Si la contabilización vino del Dragonfish, pide confirmación extra.',
        'La columna Estado sigue el circuito de carpetas: Contabilizada s/ controlar → Controlada sin OP → Con OP sin pagar → Pagada y archivada. En el resumen se cambia con el desplegable.',
        'El 📄 al final de la fila abre el PDF directo.',
        'Al aprobar una factura en la Bandeja, el PDF se renombra solo con el formato definitivo: "G CENCOSUD SA FC 0001 - 00109109.pdf" (tipo de gasto · proveedor · FC/NC/ND · punto de venta - número). Para encontrarla después alcanza con buscar los últimos dígitos del número.',
        '"➕ Cargar sin factura": para gastos reales del negocio sin comprobante fiscal. NO entran al Libro IVA (regla fija) pero sí computan como gasto de gestión. El detalle es obligatorio: es lo único que explica el gasto.',
      ],
    },
    {
      icon: '📇', titulo: 'Conceptos',
      desc: 'El catálogo contable: cada concepto es un SKU + su descripción, como los artículos del Dragonfish.',
      pasos: [
        'Buscá por SKU o descripción; se puede editar la descripción, la alícuota de IVA y dar de baja (desmarcar Activo).',
        '➕ Nuevo concepto: solo para un tipo de gasto genuinamente nuevo — no para variantes de nombre. Cada concepto de más parte los listados.',
        '🚨 Mientras el Dragonfish siga en uso, todo concepto creado acá hay que darlo de alta también allá como artículo, sino la exportación lo rechaza.',
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
