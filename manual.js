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
        'Dejá el PDF en DOCUMENTOS → CONTABILIZAR → 1 - SIN CONTABILIZAR, con la nomenclatura de siempre (G/M/I/Z + proveedor + FC número).',
        'En la Bandeja tocá 🤖 "Leer 1 - SIN CONTABILIZAR": en menos de un minuto el motor lee los PDFs nuevos y los trae con el concepto propuesto. La franja 🤖 muestra la última pasada y qué archivos ignoró.',
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
        '🧾 Formato "espejo de la factura" (22-sep): el modal se arma como el papel para controlarlo a la par. La cabecera naranja ES la cabecera del papel: a la izquierda el proveedor (CUIT, condición de venta y el chip ARCA ✓ vigente / ⚠ / sin consultar), a la derecha el comprobante (número, emisión, vencimiento, CAE y su vencimiento, remito y el botón 📄 Ver la factura). Lo que el motor no leyó se ve como — para que se note qué falta. En el medio los renglones: cantidad, descripción con su SKU, precio unitario, descuento, neto, la columna Control y el Concepto contable al que van; debajo, la imputación contable (propuesta del sistema, conceptos usados y las líneas editables), y recién después el pie. La columna Control que compara cada artículo contra las listas COMPRA (precio del proveedor) y COSTO (con el descuento pactado) vigentes en el Dragonfish a la fecha de la factura: "✓ lista" cierra, "≠ lista" difiere y dice cuánto, "sin SKU" hay que traducirlo en 🔗 Equivalencias, "sin lista" el artículo no tiene precio cargado, "no es stock" son cajas o fletes. Si la factura no tiene renglones de artículos (servicios, alquileres) se muestra lo que el motor leyó del PDF. Abajo el pie con la misma pirámide que el papel: suma de renglones → descuento → neto gravado / no gravado / exento → IVA por alícuota → percepciones → TOTAL, y a la izquierda el bloque CONTROL con cada verificación en ✓ o ⚠ (neto + impuestos = total, precios vs lista, renglones sin SKU, los conceptos suman el neto, CAE leído). Con "✏ Corregir importes" se editan a mano los importes si el motor leyó mal: exige neto + impuestos = total y deja asentado quién cambió qué.',
        'Si no, escribí el código en el campo — se autocompleta contra el catálogo entero.',
        '"Dividir en otro concepto" sirve para las facturas que se reparten (por ejemplo, flete aparte, o gasto partido entre sucursales). El cartelito de abajo te avisa si los importes no suman el neto.',
        '"✳ Concepto nuevo" crea un concepto contable que no existe en el catálogo (código, descripción y alícuota de IVA) sin salir del control, y lo deja puesto en la línea.',
        'Las dos casillas del final son independientes: "Libro IVA" es la contabilidad formal y "gasto real" es la mirada de gestión. Hay gastos que van a una y no a la otra.',
        'CAE y vencimiento del CAE: el motor los lee del PDF cuando puede; si no, se completan a mano. Si el CAE no tiene 14 dígitos el sistema avisa antes de guardar.',
        'IVA % por línea: viene precargado con la alícuota del concepto (21 · 10,5 · 27 · 0) y se puede cambiar para un caso no contemplado (por ejemplo 2,5 o 5). Lo que se pone acá manda sobre el catálogo solo para esa factura.',
        '"Va al Libro IVA" y "Va a la planilla de gastos" son las mismas dos casillas de siempre: la segunda se llamaba antes "Es gasto real del negocio (gestión)" — es el mismo dato, con el nombre de lo que hace.',
        '📒 "Va a la planilla de gastos": si está tildada aparecen Período (mes de CONSUMO, no de emisión), Unidad (Administración / Oficina / Alcorta / Unicenter / Libertador), Categoría (Sueldos · Alquiler · Expensas · Servicios · Tarjetas · IIBB · Varios) e Importe. El sistema los SUGIERE por reglas —desfase del proveedor (Niz, Diaz y Perez Forclaz facturan el mes siguiente), unidad del concepto contable, FC B en bruto— y muestra el motivo; quien controla los corrige si no corresponden. Mercadería, inversiones y Z vienen destildados: la planilla es de gastos.',
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
        '📥 Remitos para importar al Dragonfish (21-sep): cuando entra una factura de mercadería con renglones (FGR trae nuestro SKU) o un PDF de remito ("RTO 17171 ESPALMA SA FC 39668.pdf"), el sistema arma el remito y con ⬇ TXT baja el archivo para el importador (ALCO / UNI / ADMIN según el destino). Mientras el stock viva en el Dragonfish, el módulo llega hasta ahí: el tránsito, la recepción y el stock los hace el Dragon. Cuando el Dragon se saque, el mismo remito pasa a recibirse desde acá.',
        'El PDF de un remito no se lee renglón por renglón (suelen ser escaneos): sus renglones se copian de la factura cuando se vinculan por el número impreso en ella. Si el remito llega antes que la factura, queda esperando; cuando la factura entra, se completa solo.',
        'FGR web: la venta online no trae TXT de FGR. La factura alcanza — el remito esperado nace con destino ADMIN y el TXT reemplaza al que FGR no manda. Las cajas de envío (CAJA*) se pagan pero no entran al stock.',
        'Un renglón sin SKU frena el TXT a propósito: resolvelo en 🔗 Equivalencias. El destino se elige en la columna Destino (desplegable con las sucursales; el código entre paréntesis es el que va en el TXT). El TXT se puede volver a bajar (el botón muestra ✓ y queda registrado cuándo), pero en el Dragonfish se importa UNA sola vez.',
        'Un mismo TXT importado en ADMIN hace dos cosas: el remito de COMPRA en ADMIN y el remito de VENTA hacia el local de destino (el tránsito que el local confirma en su Dragon). Con destino Oficina solo se hace la compra y la mercadería queda en el depósito.',
        '📨 "TXT lo manda el proveedor": FGR entrega su propio TXT para lo que despacha a los locales, y ese es el que se importa. Para esos remitos el módulo NO genera TXT (sería doble ingreso). La excepción es la venta WEB de FGR, que no trae TXT: ahí sí se genera acá, con destino Oficina/ADMIN — es lo que hoy deja el stock de ADMIN en negativo. La regla vive en la ficha del proveedor.',
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
      icon: '📄', titulo: 'Comprobantes',
      desc: 'Facturas, notas de crédito, notas de débito Y remitos: todo lo YA contabilizado (histórico desde 2019 + lo que se aprueba en la Bandeja). Lo que espera control no aparece acá hasta que le das el OK.',
      pasos: [
        'Buscá por proveedor, número o CUIT. Filtrá por año, mes, tipo de gasto y clase (solo facturas / solo NC / solo ND / solo remitos).',
        'Los remitos aparecen abajo en su propia tabla, con la factura a la que están vinculados (o "sin factura"), el destino y el estado del stock. Tocar un remito con factura abre esa factura.',
        'El total del encabezado es FC + ND − NC.',
        'Tocá los títulos de las columnas para ordenar.',
        'Tocá una factura y se abre el resumen de cómo se contabilizó: conceptos, importes, alícuotas, quién la aprobó.',
        'El ✏️ del resumen permite corregir la contabilización — queda marcada como corregida y asentado quién la cambió. Si la contabilización vino del Dragonfish, pide confirmación extra.',
        'La columna Estado sigue el circuito de carpetas: Contabilizada s/ controlar → Controlada sin OP → Con OP sin pagar → Pagada y archivada. En el resumen se cambia con el desplegable.',
        'Columna Remito: los remitos asociados a esa factura, con su estado de stock. "en stock" = ya entró al Dragonfish (llegó por el TXT de FGR o se recibió) · "TXT ✓" = el TXT ya se generó · "TXT pend." = falta generarlo en 🚚 Mercadería · "📨 TXT prov." = el TXT lo manda el proveedor (FGR a locales). Una factura de mercadería sin ningún remito avisa "sin remito".',
        'Cómo se asocian: el motor lo hace solo al leer la factura — por el mismo número (FGR: el nº de la factura ES el del remito) o por el nº de remito impreso en la factura (Espalma: "Remito: 00017171"). Si administración deja el PDF del remito con el nombre "RTO 17171 ESPALMA FC 39668.pdf", el FC del nombre también lo vincula. Lo que no se enganche solo se vincula a mano en 🚚 Mercadería (🔗).',
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
        'Cómo se calcula (RG 830, igual que lo hacía el Dragonfish): la base es el NETO del pago sin IVA, acumulado por proveedor y régimen dentro del mes; se le resta el mínimo no imponible del régimen y sobre eso va la alícuota (2 % mercadería y servicios, 6 % alquileres) o la escala progresiva (honorarios); se descuenta lo ya retenido en el mes y, si queda menos de $240, no se retiene. Los parámetros están en ⚙️ Retenciones y salieron del Dragonfish el 18-09-2026: si el estudio informa un cambio, se corrigen ahí.',
        '🧮 Pasá el mouse por el código de cada retención (o tocalo en el celular) y se abre el cálculo paso a paso: base del pago, lo ya pagado en el mes, el mínimo no imponible, la alícuota o el tramo de la escala, lo ya retenido y el resultado. Es exactamente lo que calculó el sistema, y en la OP emitida queda guardado tal cual — se puede ver siempre desde "Ver".',
        '💳 Medios de pago: por defecto hay uno con el neto completo. Si la OP se paga en partes (parte por transferencia, parte con cheque, parte en efectivo), "➕ Otro medio de pago" agrega filas: cada una con su medio, su importe y, si querés, la cuenta de Tesorería. Con "Cheque" aparecen número, banco, fecha de EMISIÓN y días de diferimiento: la fecha de pago se calcula sola (ej. emitido el 23/09 + 30 días → paga el 23/10) y es la que va al pendiente de Tesorería. Con "Echeq" es igual pero SIN número: lo asigna el banco al emitirlo. La suma tiene que dar el neto a pagar: el sistema muestra cuánto falta asignar y no emite si no cierra.',
        '⬇ Desde el detalle de una OP emitida se descargan dos PDF: la Orden de pago (mismo formato que la del Dragonfish: comprobantes cancelados, retenciones, valores otorgados, total en letras) y el Certificado de retención (uno por régimen retenido, numerado con el punto de venta de la OP + correlativo propio, como los "0032-00001139" de hoy). El certificado se numera la primera vez que se descarga y después no cambia.',
        'Con varios medios, en Tesorería se crea UN pendiente por cada uno (con el importe de esa parte), así el banco concilia cada egreso por separado. Cuando se paga una parte la OP queda en "pago parcial"; cuando se pagan todas, pasa a "pagada" y recién ahí las facturas avanzan al archivo definitivo.',
        '🚨 El sistema NUNCA inventa una retención. Si al régimen le falta la alícuota, sale $0 y te lo dice en el recuadro de avisos. Lo mismo si el proveedor no tiene régimen asignado en su ficha: te propone uno según el tipo de gasto (mercadería → enajenación de bienes; gastos → locaciones y servicios) y te avisa que lo confirmes.',
        '✏ Los importes de retención SE PUEDEN EDITAR. Escribí el número que corresponda y el neto a pagar se recalcula solo. El ↺ vuelve a lo que calculó el sistema. Con "➕ Agregar otra retención" sumás un régimen que no estaba propuesto (por ejemplo IIBB Buenos Aires).',
        '🚨 Si el importe que ponés difiere del calculado, el sistema te pide el MOTIVO y sin eso no emite. No es burocracia: ese texto es lo que explica el número en el certificado de retención que se le entrega al proveedor y en el listado que va al estudio. Queda guardado junto al importe original que había calculado el sistema.',
        'Para NO retener algo que el sistema propone, poné 0 con su motivo — mejor que borrarlo, porque queda el rastro de que se decidió no retener y por qué.',
        'Una OP ya emitida no se edita: si un importe quedó mal, anulala y volvé a emitirla. Así el pendiente de Tesorería y el certificado dicen lo mismo.',
        'Los proveedores del exterior no llevan retención de la RG 830 (son beneficiarios del exterior, es otro régimen) — el sistema los saltea diciendo por qué.',
        'Al emitir: la factura pasa a "con OP sin pagar" y el PDF se muda solo a esa carpeta (tarda un minuto), y se crea el pendiente de pago en Tesorería para que la plata no se cargue dos veces.',
        '🚨 Si la plata YA salió antes de armar la OP, no se duplica nada: el módulo te avisa ANTES de emitir que hay egresos del banco por ese mismo importe sin conciliar, y al emitir Tesorería los vincula sola. La OP nace PAGADA y las facturas van derecho al archivo definitivo.',
        'Y al revés también: cuando el pago salga más adelante y Tesorería lo concilie, la OP pasa sola a "pagada" y las facturas avanzan de etapa sin que nadie toque nada.',
        '"Anular" devuelve las facturas a "controlado sin OP" y cancela TODOS los pendientes de Tesorería de esa OP. Pide motivo y queda asentado. Una OP con algún medio ya pagado (parcial o total) no se puede anular desde acá: se resuelve en Tesorería.',
        '🧪 En modo prueba las OP llevan punto de venta 9999 y NO generan el pendiente en Tesorería, así no ensucian la numeración real ni los pagos.',
      ],
    },
    {
      icon: '⚙️', titulo: 'Retenciones · los regímenes',
      desc: 'La tabla de regímenes que el sistema conoce, con sus parámetros. Es lo que alimenta el cálculo de cada OP.',
      pasos: [
        'Cada fila es un régimen (Ganancias enajenación de bienes, locaciones y servicios, alquileres, honorarios, IIBB…) con su alícuota, mínimo no imponible, retención mínima, base (neto o total) y si acumula en el mes por proveedor. Tocás, cambiás y "Guardar".',
        '➕ Nuevo régimen: para dar de alta uno que hoy no existe. Código (el MISMO que usa el Dragonfish mientras convivan: RTN-G-5, RIVA, etc.), nombre, impuesto, jurisdicción y los parámetros. Si tiene escala progresiva como honorarios, dejá la alícuota vacía y la escala se carga en la base.',
        '🚨 Crear el régimen NO retiene a nadie todavía. Un régimen se aplica en una OP solo si está ASIGNADO en la ficha del proveedor (🏢 Proveedores → ficha → Retenciones), o si es el que el sistema propone por tipo de gasto cuando la ficha no tiene ninguno. Después del alta, asignalo a los proveedores que corresponda.',
        'Sin alícuota cargada el sistema no inventa nada: calcula $0 con aviso y el importe se pone a mano en la OP, con motivo. Es a propósito — un número viejo con aire de autoridad es peor que un cero que avisa.',
        'La casilla "Activo" saca o vuelve a poner un régimen en juego sin borrarlo: desactivado no se propone en ninguna OP, pero su historia queda (R902 e IIBB Buenos Aires están así porque no se practican desde 2022).',
        'Al régimen se le puede cargar también una exclusión por proveedor (certificado de no retención con vencimiento) desde la ficha del proveedor; ahí manda la ficha, no la tabla.',
      ],
    },
    {
      icon: '📊', titulo: 'Listados',
      desc: 'Dos miradas del mismo período: la de gestión (cuánto se gastó) y la del estudio contable (cuánto crédito fiscal hay).',
      pasos: [
        '📈 Gestión — reemplaza la planilla de gastos: por tipo de gasto (gastos, mercadería, inversiones, no-actividad) con su porcentaje, mes a mes, y los 25 proveedores más grandes. Respeta los filtros de arriba.',
        '🧾 Para el estudio — elegís el MES con los desplegables de mes y año (o con las flechas ‹ ›) y salen los tres listados de ese mes completo. Si necesitás un corte distinto (una quincena, un rango entre dos fechas), usás "Desde / Hasta": el desplegable pasa a decir "rango a medida".',
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
