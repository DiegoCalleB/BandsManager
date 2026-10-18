import type { GuiaSeo } from './tipos.js';

export const GUIAS_BOOKING: GuiaSeo[] = [
  {
    slug: 'como-hacer-un-epk',
    titulo: 'Cómo hacer un EPK para tu banda: qué incluir y ejemplos',
    h1: 'Cómo hacer un EPK para tu banda',
    descripcion: 'Qué es un EPK (dossier de prensa), qué debe llevar y qué sobra. Una guía práctica para que salas y festivales te entiendan en un minuto.',
    intro: 'El EPK (electronic press kit) o dossier es la página que una sala o un festival abre para decidir si te contrata. Si tarda más de un minuto en entenderte, la cierra.',
    secciones: [
      {
        h2: 'Qué es un EPK y para qué sirve',
        parrafos: ['Es una presentación de tu banda pensada para quien programa: quiénes sois, cómo sonáis, qué habéis tocado y cómo contactar. No es una web de fans ni un currículum de veinte páginas.', 'Un buen EPK responde de golpe a tres preguntas del programador: ¿encaja en mi sala?, ¿llena público?, ¿es fácil trabajar con ellos?'],
      },
      {
        h2: 'Qué debe llevar, por orden de importancia',
        pasos: [
          'Una frase que defina el estilo y a quién se parece, sin superlativos que no puedas demostrar.',
          'Una escucha inmediata: un par de temas o un teaser de 30 a 60 segundos de directo. Nada de conciertos enteros.',
          'Una foto de banda buena y una versión horizontal para cartelería.',
          'Un dato verificable de tracción local, uno solo: entradas vendidas en una sala concreta, por ejemplo.',
          'Biografía corta, de cuatro o cinco líneas.',
          'Rider técnico y datos de contacto visibles, sin tener que buscarlos.',
        ],
      },
      {
        h2: 'Qué sobra',
        lista: ['Biografías de cada músico con sus instrumentos desde los doce años.', 'Veinte fotos o adjuntos pesados que hacen que el correo acabe en spam.', 'Adjetivos de relleno: "potente", "único", "revolucionario".', 'Enlaces a todas las redes: con dos o tres bien elegidas basta.'],
      },
      {
        h2: 'PDF o enlace',
        parrafos: ['Un enlace a una página siempre gana al PDF adjunto: se abre en el móvil, se actualiza sin reenviarlo y no pesa en el correo. Si además puedes saber si lo han abierto, sabes cuándo conviene escribir de nuevo.'],
      },
    ],
    faq: [
      { q: '¿Qué diferencia hay entre EPK y dossier?', a: 'En la práctica se usan como sinónimos. EPK es el término anglosajón (electronic press kit) y dossier el castellano. Lo que importa es que sea breve, escuchable y fácil de compartir con un enlace.' },
      { q: '¿Cuánto debe ocupar un EPK?', a: 'Una pantalla de móvil de scroll o una o dos páginas si es PDF. Lo detallado se deja para quien lo pida.' },
      { q: '¿Necesito un EPK si todavía toco poco?', a: 'Sí, y es cuando más ayuda. Un EPK ordenado compensa la falta de trayectoria porque demuestra que eres profesional y fácil de contratar.' },
    ],
    relacionadas: ['email-a-una-sala', 'como-conseguir-bolos', '/plantilla-rider-tecnico'],
    cta: { titulo: 'Tu EPK, con un enlace', texto: 'En BandManager montas el dossier de tu banda y lo compartes con una URL propia, con rider técnico incluido.', boton: 'Crear mi EPK gratis' },
  },
  {
    slug: 'como-conseguir-bolos',
    titulo: 'Cómo conseguir bolos con tu banda: método paso a paso',
    h1: 'Cómo conseguir bolos con tu banda',
    descripcion: 'Un método para conseguir conciertos sin depender de la suerte: elegir salas, escribirles bien, hacer seguimiento y repetir sin quemarte.',
    intro: 'Conseguir bolos no es talento ni contactos: es un proceso. Quien escribe a cincuenta salas bien elegidas, con un mensaje corto y seguimiento, toca más que quien espera a que le llamen.',
    secciones: [
      {
        h2: '1. Elige salas que encajen, no todas',
        parrafos: ['Mira qué programan: estilo, aforo, si acogen bandas locales o de gira. Una sala donde ya tocan grupos como el tuyo es una sala con público para ti. Apunta ciudad, contacto y última programación en una hoja o en tu CRM.'],
      },
      {
        h2: '2. Prepara lo mínimo antes de escribir',
        lista: ['Un EPK en forma de enlace, con escucha inmediata.', 'Un rider técnico claro para que pregunten menos.', 'Dos o tres fechas posibles, para no preguntar a ciegas.'],
      },
      {
        h2: '3. Escribe un mensaje corto y humano',
        parrafos: ['Menos de 120 palabras, dos párrafos. Reconoce algo concreto de la sala, di qué aportas (público, ambiente) y enlaza el EPK. Evita copiar y pegar un texto igual para todos: una sala nota cuándo es una plantilla.'],
      },
      {
        h2: '4. Haz seguimiento sin agobiar',
        pasos: ['Espera unos siete días antes de volver a escribir.', 'Segundo mensaje de una línea, aportando algo nuevo: una fecha, un directo reciente.', 'Si tras dos seguimientos no hay respuesta, déjalo para la siguiente temporada y pasa a la siguiente sala.'],
      },
      {
        h2: '5. Convierte cada bolo en el siguiente',
        parrafos: ['Pide a la sala o al promotor que te presente a otras salas, recoge los emails del público en cada concierto y publica la fecha con una página compartible. Un bolo bien hecho es la mejor carta de presentación para el siguiente.'],
      },
    ],
    faq: [
      { q: '¿Cuántas salas debo contactar?', a: 'Empieza por veinte o treinta bien elegidas. Es normal que respondan pocas; lo importante es mantener el ritmo cada semana.' },
      { q: '¿Es mejor escribir por email o por Instagram?', a: 'Por email para la propuesta, porque es lo que la sala usa para programar. Instagram sirve para romper el hielo, no para cerrar fechas.' },
      { q: '¿Y si no tengo directos grabados?', a: 'Graba un teaser de 30 a 60 segundos en un ensayo con buena luz y sonido. Vale más que nada y se prepara en una tarde.' },
    ],
    relacionadas: ['email-a-una-sala', 'como-hacer-un-epk', 'cuanto-cobrar-por-un-concierto'],
    cta: { titulo: 'Tus contactos, sin hojas de cálculo', texto: 'BandManager guarda tus salas, redacta el borrador de cada propuesta y no envía nada sin que tú lo apruebes.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'email-a-una-sala',
    titulo: 'Cómo escribir un email a una sala de conciertos (con modelo)',
    h1: 'Cómo escribir un email a una sala de conciertos',
    descripcion: 'Estructura, tono y errores a evitar al escribir a una sala para pedir un bolo. Incluye un modelo corto y qué hacer si no responden.',
    intro: 'El primer correo decide si te leen o te archivan. La clave es ser breve, concreto y fácil de contestar con un sí.',
    secciones: [
      {
        h2: 'La estructura que funciona',
        pasos: ['Asunto claro: nombre de la banda, estilo y ciudad.', 'Una frase que muestre que conoces la sala y su programación.', 'Qué aportas: a quién traes y en qué formato tocas.', 'Un único enlace al dossier, mejor en la firma que en el cuerpo.', 'Una propuesta concreta: dos fechas posibles.'],
      },
      {
        h2: 'Un modelo corto',
        parrafos: ['Hola [nombre], os seguimos desde hace tiempo y nos encantó la programación de este otoño en [sala]. Somos [banda], [estilo en pocas palabras] de [ciudad], y nos gustaría tocar en vuestro espacio. Nos cuadrarían el [fecha 1] o el [fecha 2]. Os dejo el dossier en la firma. ¿Os parece bien que lo veamos?'],
      },
      {
        h2: 'Errores que cierran puertas',
        lista: ['Textos largos con la historia entera de la banda.', 'Adjuntar PDF pesados, fotos y audios: es lo que dispara el spam.', 'Pedir caché antes de que sepan quién eres.', 'Jerga corporativa y superlativos que no puedes demostrar.', 'Mensaje idéntico a cien salas, con el nombre mal cambiado.'],
      },
      {
        h2: 'Si no responden',
        parrafos: ['Espera una semana y manda una línea: "Retomo este correo por si se os pasó. Tenemos libre el [fecha]". Si tampoco hay respuesta, prueba por otro canal una sola vez y sigue con otras salas.'],
      },
    ],
    faq: [
      { q: '¿A qué hora conviene enviarlo?', a: 'Entre semana por la mañana, cuando la gente de la sala está en el correo. Evita los fines de semana, que es cuando están trabajando.' },
      { q: '¿Debo adjuntar el EPK?', a: 'Mejor un enlace. Un adjunto pesa, puede ir a spam y se queda desactualizado en cuanto cambias algo.' },
      { q: '¿Tuteo o usted?', a: 'En salas independientes y festivales pequeños, tuteo y tono cercano. En teatros e instituciones, un registro algo más formal.' },
    ],
    relacionadas: ['como-conseguir-bolos', 'como-hacer-un-epk', 'presentar-banda-festival'],
    cta: { titulo: 'Borradores que tú apruebas', texto: 'BandManager redacta cada propuesta con la voz de tu banda y espera tu visto bueno antes de enviarla.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'presentar-banda-festival',
    titulo: 'Cómo presentar tu banda a un festival: convocatorias y consejos',
    h1: 'Cómo presentar tu banda a un festival',
    descripcion: 'Cómo preparar la candidatura a una convocatoria de festival: qué piden, cuándo enviarla y cómo destacar entre cientos de propuestas.',
    intro: 'Los festivales reciben cientos de candidaturas. Las que pasan el primer filtro son las que se entienden rápido y cumplen exactamente lo que pide la convocatoria.',
    secciones: [
      {
        h2: 'Antes de enviar nada',
        lista: ['Lee las bases enteras: fechas, formato, límite de candidaturas y qué material piden.', 'Comprueba que tu estilo y tu aforo encajan con el cartel de años anteriores.', 'Revisa qué franja ocuparon bandas parecidas a la tuya y apunta a esa.'],
      },
      {
        h2: 'Qué material preparar',
        pasos: ['Dossier con enlace, escucha inmediata y foto de calidad.', 'Un vídeo de directo corto, con buen sonido, mejor que un concierto entero.', 'Rider técnico ajustado al formato de festival: montajes rápidos y pocos canales.', 'Datos de contacto y disponibilidad.'],
      },
      {
        h2: 'Cómo destacar',
        parrafos: ['Cita un dato real de tracción, como una sala llena o un buen directo reciente. Explica en una frase por qué encajas en ese festival y no en cualquiera. Y cumple los plazos: una candidatura fuera de fecha no se lee.'],
      },
    ],
    faq: [
      { q: '¿Cuándo enviar la candidatura?', a: 'Cuanto antes dentro del plazo. Muchas convocatorias se revisan por orden y a los últimos días llegan cientos de propuestas.' },
      { q: '¿Merece la pena presentarse si no tengo disco?', a: 'Sí, si tienes buen directo. Muchos festivales valoran más la actuación que el catálogo grabado.' },
      { q: '¿Me pueden pedir que toque gratis?', a: 'A veces. Decide antes qué condiciones aceptas y qué contrapartida pides: visibilidad real, backline o alojamiento.' },
    ],
    relacionadas: ['como-hacer-un-epk', '/plantilla-rider-tecnico', 'cuanto-cobrar-por-un-concierto'],
    cta: { titulo: 'Candidaturas sin perder el hilo', texto: 'Lleva en BandManager tus fechas, tus propuestas y tu dossier para no dejar escapar ninguna convocatoria.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'cuanto-cobrar-por-un-concierto',
    titulo: 'Cuánto cobrar por un concierto: caché, taquilla y mixto',
    h1: 'Cuánto cobrar por un concierto',
    descripcion: 'Cómo calcular el caché de tu banda y qué modelo elegir: caché fijo, taquilla o mixto. Método para saber tu mínimo y negociar con la sala.',
    intro: 'No existe una tarifa universal. Lo que sí existe es un método para saber cuál es tu mínimo y cuándo te compensa asumir riesgo.',
    secciones: [
      {
        h2: 'Los tres modelos habituales',
        lista: ['Caché fijo: la sala paga una cantidad pase lo que pase. Menos riesgo para ti.', 'Taquilla: cobras un porcentaje o lo que quede tras gastos. Depende de cuánta gente traigas.', 'Mixto: un mínimo garantizado más un porcentaje a partir de cierto aforo.'],
      },
      {
        h2: 'Calcula tu mínimo',
        pasos: ['Suma los gastos reales: transporte, alquiler de local o backline, comida, sonido si lo pones tú.', 'Añade el valor de tu tiempo: ensayos, montaje, desplazamiento y el propio concierto.', 'Divide entre los miembros y comprueba que sale una cifra por la que merece la pena salir de casa.', 'Ese resultado es tu suelo. Por debajo, el concierto te cuesta dinero.'],
      },
      {
        h2: 'Cuándo negociar a taquilla',
        parrafos: ['Si traes público fiel y la sala cobra entrada, la taquilla puede dejarte más que un caché bajo. Si empiezas y no conoces tu convocatoria, el caché fijo o un mixto con mínimo te protege.'],
      },
      {
        h2: 'Cómo hablar de dinero con una sala',
        parrafos: ['Mejor tras el primer sí que en el primer correo. Pregunta primero cómo trabajan, qué aforo tienen y qué suelen ofrecer a bandas como la tuya, y entonces propón tu fórmula. Deja siempre por escrito lo acordado.'],
      },
    ],
    faq: [
      { q: '¿Es normal tocar gratis?', a: 'En los inicios sucede, pero conviene que a cambio haya algo medible: fecha en buen día, difusión real o contactos. Tocar gratis por tocar no construye trayectoria.' },
      { q: '¿Cuánto cobra una banda pequeña?', a: 'Depende de la ciudad, la sala y el público que traigas, así que no hay cifra fiable. Calcula tu mínimo y negocia a partir de ahí.' },
      { q: '¿Quién paga los derechos de autor?', a: 'Suele hacerlo la sala o el organizador. Aclara quién lo gestiona antes de cerrar la fecha.' },
    ],
    relacionadas: ['repartir-dinero-en-una-banda', 'contrato-actuacion-musical', 'como-conseguir-bolos'],
    cta: { titulo: 'Sabe cuánto ganas de verdad', texto: 'BandManager lleva tus conciertos, cachés y gastos para que veas qué bolos te compensan.', boton: 'Probar BandManager gratis' },
  },
];
