import type { GuiaSeo } from './tipos.js';

export const GUIAS_NEGOCIO: GuiaSeo[] = [
  {
    slug: 'captar-emails-de-fans',
    titulo: 'Cómo captar emails de fans de tu banda sin ser pesado',
    h1: 'Cómo captar emails de fans de tu banda',
    descripcion: 'Por qué la lista de correo es el activo más valioso de una banda y cómo conseguirla: QR en conciertos, incentivo, formulario corto y primer email.',
    intro: 'Los seguidores de redes son de la plataforma. Un email es tuyo. Una lista de correo te permite avisar de cada concierto sin depender de ningún algoritmo.',
    secciones: [
      {
        h2: 'Por qué el correo',
        parrafos: ['Una publicación llega a una parte de tus seguidores y el resto no la ve. Un correo llega a la bandeja de quien te dio permiso. Para anunciar un concierto o un disco, es el canal más directo que tienes.'],
      },
      {
        h2: 'Dónde pedirlo',
        lista: ['En el concierto, con un QR en el setlist, el cartel o la mesa de merch. Es cuando el público está más enganchado.', 'En tu perfil de redes, con un enlace único que lleve a una página de la banda.', 'Tras una compra de entrada o de merch.'],
      },
      {
        h2: 'Cómo pedirlo sin invadir',
        pasos: ['Un solo campo para empezar: el email. Nombre y consentimiento en el segundo paso.', 'Di qué van a recibir y con qué frecuencia: fechas, música nueva, algún aviso.', 'Ofrece algo concreto: acceso anticipado a entradas, una maqueta, un descuento.', 'Cumple con la ley: consentimiento expreso y enlace para darse de baja en cada correo.'],
      },
      {
        h2: 'El primer correo importa',
        parrafos: ['Envía una bienvenida en los primeros minutos: gracias, la canción más escuchada, el próximo concierto y un botón para seguir en la red que prefiera. Después, un correo útil de vez en cuando: nada de spam.'],
      },
    ],
    faq: [
      { q: '¿Necesito el consentimiento del fan?', a: 'Sí. Debe aceptar expresamente recibir comunicaciones y poder darse de baja cuando quiera. Es obligatorio por la normativa de protección de datos y de comunicaciones comerciales.' },
      { q: '¿Cada cuánto debo escribir?', a: 'Cuando haya algo que contar: un concierto, un lanzamiento, una novedad. Uno al mes suele ser un buen ritmo.' },
      { q: '¿Cuántos suscriptores necesito para que sirva?', a: 'Pocos. Cien personas que han pedido saber de ti valen más que miles que pasaron por tu perfil.' },
    ],
    relacionadas: ['promocionar-un-concierto', 'como-conseguir-bolos', 'software-para-gestionar-una-banda'],
    cta: { titulo: 'Tu lista de fans, en tu mano', texto: 'BandManager crea la página de fans con QR para tus conciertos y guarda los contactos para ti.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'repartir-dinero-en-una-banda',
    titulo: 'Cómo repartir el dinero en una banda de música',
    h1: 'Cómo repartir el dinero en una banda',
    descripcion: 'Cómo repartir ingresos y gastos entre los miembros de una banda: fondo común, reparto por igual o por trabajo, y cómo evitar discusiones.',
    intro: 'El dinero rompe más bandas que las discusiones de estilo. Un acuerdo claro desde el principio, por escrito, evita la mayoría de los conflictos.',
    secciones: [
      {
        h2: 'Decide los gastos antes del reparto',
        lista: ['Gastos comunes: local de ensayo, material, transporte, promoción.', 'Fondo de la banda: un porcentaje de cada ingreso para reinvertir.', 'Reparto del resto entre los miembros.'],
      },
      {
        h2: 'Tres modelos de reparto',
        pasos: ['A partes iguales: sencillo y válido si el trabajo es parecido.', 'Por trabajo: quien hace booking, mezclas o diseño recibe algo extra.', 'Mixto: partes iguales por tocar y un pequeño extra por tareas de gestión.'],
      },
      {
        h2: 'Reglas para evitar problemas',
        parrafos: ['Dejadlo por escrito: porcentajes, quién guarda el fondo y cuándo se reparte. Llevad una cuenta común o una hoja compartida con todos los ingresos y gastos, visible para todos. Y revisad el acuerdo cuando cambie la banda: entra un miembro, sale otro, sube la actividad.'],
      },
      {
        h2: 'Cuando entran músicos de apoyo',
        parrafos: ['Acordad un precio por bolo, pactado de antemano y sin tocar el fondo de la banda. Es más sencillo para todos que improvisar el reparto después del concierto.'],
      },
    ],
    faq: [
      { q: '¿Quién debe guardar el dinero de la banda?', a: 'Una persona de confianza con las cuentas a la vista de todos, o una cuenta común. Lo importante es la transparencia.' },
      { q: '¿Tengo que declarar lo que cobro en la banda?', a: 'Depende de tu situación fiscal y de cómo facturéis. Consulta con un gestor: aquí solo ofrecemos orientación general.' },
      { q: '¿Y si uno de los miembros deja la banda?', a: 'Lo mejor es haberlo previsto por escrito: qué pasa con el material, el nombre y el dinero pendiente.' },
    ],
    relacionadas: ['cuanto-cobrar-por-un-concierto', 'contrato-actuacion-musical', 'software-para-gestionar-una-banda'],
    cta: { titulo: 'Cuentas claras para toda la banda', texto: 'BandManager lleva los ingresos y gastos de la banda para que el reparto sea transparente.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'contrato-actuacion-musical',
    titulo: 'Contrato de actuación musical: qué debe incluir (lista)',
    h1: 'Contrato de actuación musical: qué debe incluir',
    descripcion: 'Lista de comprobación de los apartados de un contrato de actuación: partes, fecha, caché, pago, rider, cancelación y derechos. Orientación general.',
    intro: 'Un concierto cerrado por mensaje es un concierto en riesgo. Un contrato breve y claro protege a la banda y a la sala. Esta guía es orientación general, no asesoramiento jurídico.',
    secciones: [
      {
        h2: 'Qué debe incluir',
        lista: ['Las partes: nombre o razón social de la banda y de la sala u organizador.', 'Fecha, lugar, hora de llegada, de prueba de sonido y duración del concierto.', 'Caché o condiciones económicas, y quién paga impuestos y gastos.', 'Forma y fecha de pago: antes, el mismo día o a plazo.', 'Rider técnico y de hospitalidad como anexos.', 'Condiciones de cancelación y qué ocurre en caso de fuerza mayor.', 'Quién se encarga de los derechos de autor.'],
      },
      {
        h2: 'Qué cuidar al firmar',
        parrafos: ['Que las condiciones económicas coincidan con lo hablado y que la forma de pago esté clara. Que la cancelación contemple a las dos partes. Y que el anexo del rider diga exactamente lo que necesitáis, para que no haya sorpresas el día del concierto.'],
      },
      {
        h2: 'Cuando el acuerdo es por email',
        parrafos: ['Si la sala no quiere contrato, deja por escrito un correo de confirmación con fecha, hora, caché y condiciones, y pide que lo respondan con un "conforme". Es mejor que nada.'],
      },
    ],
    faq: [
      { q: '¿Es obligatorio un contrato?', a: 'No siempre, pero es recomendable para cualquier concierto con dinero de por medio. Sirve de prueba si hay desacuerdo.' },
      { q: '¿Quién redacta el contrato?', a: 'Puede hacerlo la sala o la banda. Lo importante es revisarlo con calma antes de firmar.' },
      { q: '¿Necesito un abogado?', a: 'Para contratos sencillos de un concierto, un modelo claro suele bastar. Para giras, exclusividades o cachés altos, consulta a un profesional.' },
    ],
    relacionadas: ['cuanto-cobrar-por-un-concierto', 'rider-de-hospitalidad', '/plantilla-rider-tecnico'],
    cta: { titulo: 'Tus bolos y condiciones, ordenados', texto: 'BandManager guarda las fechas, el caché y las condiciones de cada concierto en un solo sitio.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'software-para-gestionar-una-banda',
    titulo: 'Software para gestionar una banda de música: qué debe tener',
    h1: 'Software para gestionar una banda de música',
    descripcion: 'Qué necesita una banda independiente para organizarse mejor que con hojas de cálculo y chats: booking, repertorio, calendario, EPK, finanzas y fans.',
    intro: 'La mayoría de las bandas se gestionan con una hoja de cálculo, un grupo de WhatsApp y mucha memoria. Funciona hasta que hay más de cinco salas, dos ensayos y una gira.',
    secciones: [
      {
        h2: 'Dónde se pierde el tiempo',
        lista: ['Buscar a quién se escribió, cuándo y qué contestó.', 'Mantener el repertorio y los setlists en tres sitios distintos.', 'Cuadrar calendarios entre los miembros.', 'Rehacer el dossier cada vez que cambia algo.', 'Saber cuánto se ha ganado de verdad con cada bolo.'],
      },
      {
        h2: 'Lo que debería ofrecer',
        pasos: ['Booking: lista de salas, estado de cada conversación y recordatorios de seguimiento.', 'Repertorio y setlists con duración, tonalidad y exportación a PDF.', 'Calendario compartido de conciertos y ensayos.', 'EPK o dossier público con enlace propio.', 'Finanzas básicas por concierto.', 'Captación de fans y de correos.'],
      },
      {
        h2: 'Cómo elegir',
        parrafos: ['Que sea sencillo en el móvil, porque la banda lo abre en la furgo y en el ensayo. Que no te obligue a pagar desde el primer día. Y que no envíe nada en tu nombre sin que lo apruebes: tu relación con las salas es tu activo.'],
      },
    ],
    faq: [
      { q: '¿Hoja de cálculo o software específico?', a: 'La hoja sirve para empezar. Cuando el volumen crece, un software específico ahorra horas y evita olvidos.' },
      { q: '¿Para qué tipo de bandas es?', a: 'Para bandas y artistas independientes que quieren tocar más y gestionar menos, desde un trío de local hasta una gira.' },
      { q: '¿Se puede usar gratis?', a: 'BandManager tiene un plan gratuito. Revisa en la página de planes qué incluye.' },
    ],
    relacionadas: ['como-conseguir-bolos', 'captar-emails-de-fans', 'repartir-dinero-en-una-banda'],
    cta: { titulo: 'El mánager que llevas en el bolsillo', texto: 'Salas, repertorio, calendario, EPK y fans en un solo sitio, pensado para el móvil.', boton: 'Crear mi cuenta gratis' },
  },
];
