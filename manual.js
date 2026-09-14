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
        '🔄 La ETAPA manda: la etapa del comprobante (sin contabilizar → contabilizado sin controlar → controlado sin OP → con OP sin pagar → pagada) define a la vez dónde se ve en el módulo y en qué carpeta del OneDrive está el PDF. Si desde Facturas se retrocede la etapa, el comprobante VUELVE a la Bandeja y el motor muda el archivo a la carpeta anterior; al aprobarlo de nuevo en la Bandeja avanza a "controlado sin OP" y el PDF se muda otra vez.',
        '📄 Ver la factura: tanto en la lista de la Bandeja como arriba del modal de control hay un link que abre el PDF en OneDrive, en otra pestaña, para mirarlo mientras controlás.',
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
        '✏ SKU: cambia el código del concepto y arrastra TODO lo ya contabilizado al código nuevo, en una sola operación. Antes de hacerlo te muestra cuántos renglones, comprobantes y proveedores se van a reescribir. El SKU viejo queda guardado en el historial, así que los asientos anteriores se siguen pudiendo rastrear.',
        'Si el SKU que escribís YA existe, no es un renombre sino una fusión: los dos conceptos quedan hechos uno solo. El módulo te avisa y te lo hace confirmar aparte. No deja fusionar conceptos con alícuotas distintas.',
        '🚨 Cambiar el SKU lo puede hacer solo el administrador, y el código nuevo también tiene que existir en el Dragonfish mientras siga en uso.',
      ],
    },
    {
      icon: '💸', titulo: 'Órdenes de pago',
      desc: 'Donde se arma lo que se le va a pagar a cada proveedor, con las retenciones ya calculadas.',
      pasos: [
        'Arriba están los proveedores con facturas ya controladas esperando OP, con el total y hace cuántos días espera la más vieja (en rojo si pasó el mes).',
        '"Armar OP" abre el detalle: vienen todos los comprobantes tildados y podés destildar los que no querés pagar todavía. Las notas de crédito RESTAN, y se ven en rojo.',
        'Abajo se calcula solo: subtotal, las retenciones que correspondan y el neto a pagar. Cambiá lo que quieras arriba y el número se recalcula al instante.',
        '🚨 El sistema NUNCA inventa una retención. Si al régimen le falta la alícuota, sale $0 y te lo dice en el recuadro de avisos. Lo mismo si el proveedor no tiene régimen asignado en su ficha: te propone uno según el tipo de gasto (mercadería → enajenación de bienes; gastos → locaciones y servicios) y te avisa que lo confirmes.',
        '✏ Los importes de retención SE PUEDEN EDITAR. Escribí el número que corresponda y el neto a pagar se recalcula solo. El ↺ vuelve a lo que calculó el sistema. Con "➕ Agregar otra retención" sumás un régimen que no estaba propuesto (por ejemplo IIBB Buenos Aires).',
        '🚨 Si el importe que ponés difiere del calculado, el sistema te pide el MOTIVO y sin eso no emite. No es burocracia: ese texto es lo que explica el número en el certificado de retención que se le entrega al proveedor y en el listado que va al estudio. Queda guardado junto al importe original que había calculado el sistema.',
        'Para NO retener algo que el sistema propone, poné 0 con su motivo — mejor que borrarlo, porque queda el rastro de que se decidió no retener y por qué.',
        'Una OP ya emitida no se edita: si un importe quedó mal, anulala y volvé a emitirla. Así el pendiente de Tesorería y el certificado dicen lo mismo.',
        'Los proveedores del exterior no llevan retención de la RG 830 (son beneficiarios del exterior, es otro régimen) — el sistema los saltea diciendo por qué.',
        'Al emitir: la factura pasa a "con OP sin pagar" y el PDF se muda solo a esa carpeta (tarda un minuto), y se crea el pendiente de pago en Tesorería para que la plata no se cargue dos veces.',
        '🚨 Si la plata YA salió antes de armar la OP, no se duplica nada: el módulo te avisa ANTES de emitir que hay egresos del banco por ese mismo importe sin conciliar, y al emitir Tesorería los vincula sola. La OP nace PAGADA y las facturas van derecho al archivo definitivo.',
        'Y al revés también: cuando el pago salga más adelante y Tesorería lo concilie, la OP pasa sola a "pagada" y las facturas avanzan de etapa sin que nadie toque nada.',
        '"Anular" devuelve las facturas a "controlado sin OP" y cancela el pendiente de Tesorería. Pide motivo y queda asentado. Una OP ya pagada no se puede anular desde acá.',
        '🧪 En modo prueba las OP llevan punto de venta 9999 y NO generan el pendiente en Tesorería, así no ensucian la numeración real ni los pagos.',
      ],
    },
    {
      icon: '📊', titulo: 'Listados',
      desc: 'Dos miradas del mismo período: la de gestión (cuánto se gastó) y la del estudio contable (cuánto crédito fiscal hay).',
      pasos: [
        '📈 Gestión — reemplaza la planilla de gastos: por tipo de gasto (gastos, mercadería, inversiones, no-actividad) con su porcentaje, mes a mes, y los 25 proveedores más grandes. Respeta los filtros de arriba.',
        '🧾 Para el estudio — elegís el período con las flechas ‹ › o las dos fechas, y salen los tres listados del mes.',
        '🚨 Los listados respetan el ambiente: en modo 🧪 prueba salen SOLO los comprobantes de test, y en definitivo SOLO los reales. Nunca se mezclan.',
        'Si un comprobante del período no está marcado "computa en el Libro IVA", no entra en los listados pero aparece abajo en "fuera del Libro IVA", con su importe. Así se ve que existe y por qué no figura (típicamente proveedores del exterior).',
        'IVA Compras: un renglón por comprobante con el neto abierto por alícuota, el IVA, las percepciones y el total. Entran solo los marcados "computa en el Libro IVA"; las notas de crédito restan y se ven en rojo.',
        'Hay DOS descargas a propósito. "⬇ Formato estudio" saca las mismas columnas del Subdiario que se le manda hoy al contador (comprobante FDC/NCC, Mto grav., No Grav., IVA 21%, una alícuota variable, Per./Ret. IVA, Otros, Total): se lo mandás y no tiene que cambiar nada. "⬇ IVA Compras completo" abre una columna por alícuota y agrega descuadre y alertas: ese es para controlar, no para presentar.',
        'Percepciones sufridas: lo que los proveedores le percibieron a la empresa (IVA, IIBB CABA, IIBB Bs.As.). También es crédito. Abajo va el detalle por comprobante y jurisdicción, el mismo corte del listado que se manda hoy, con su propia descarga.',
        'Retenciones practicadas: lo que la empresa retuvo al pagar, agrupado por quincena, que es como se declara. Se llena solo con las órdenes de pago que emita el módulo (las anuladas no cuentan: nunca se practicó la retención). Se baja en CSV con el corte quincenal que recibe el estudio.',
        'Las filas naranjas tienen el importe puesto a mano en la OP, con su motivo al lado — y el CSV lleva las dos columnas, para que el estudio vea de dónde salió cada número.',
        '🚨 Antes de mandárselo al estudio, mirá los dos avisos: "no cierra" (neto + IVA + percepciones ≠ total, hay que revisar el PDF) y "para mirar" (IVA de ajuste, o una imputación contable que no coincide con el neto del comprobante). El listado no los esconde a propósito.',
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
