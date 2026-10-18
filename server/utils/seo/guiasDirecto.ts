import type { GuiaSeo } from './tipos.js';

export const GUIAS_DIRECTO: GuiaSeo[] = [
  {
    slug: 'como-hacer-un-setlist',
    titulo: 'Cómo hacer un setlist para un concierto: orden, energía y duración',
    h1: 'Cómo hacer un setlist para un concierto',
    descripcion: 'Criterios para ordenar las canciones de un directo: apertura, curva de energía, tonalidades, transiciones y cierre. Con pasos para armarlo en una tarde.',
    intro: 'Un buen setlist no es tus mejores canciones en fila. Es un recorrido con principio, tensión y final, ajustado al tiempo que te dan.',
    secciones: [
      {
        h2: 'Empieza por el tiempo disponible',
        parrafos: ['Pregunta cuánto dura tu slot y cuánto hay entre canción y canción. Cuenta la duración real de cada tema, más el tiempo que pierdes hablando y afinando. Sobra siempre alguno: deja una o dos canciones de reserva.'],
      },
      {
        h2: 'Dibuja la curva de energía',
        pasos: ['Abre con un tema que enganche rápido, no necesariamente el más fuerte.', 'Sube la energía en el primer tercio y consigue la atención de la sala.', 'Coloca un respiro hacia la mitad: un tema lento o una canción con dinámica distinta.', 'Reconstruye la tensión hasta el final.', 'Cierra con el tema que quieras que se recuerde y deja uno de reserva para el bis.'],
      },
      {
        h2: 'Cuida las transiciones',
        lista: ['Tonalidades: pasar de un tema a otro en tonos cercanos suena más natural.', 'Tempo: evita saltos bruscos de BPM sin una pausa o un cambio de ambiente.', 'Cambios de instrumento o de afinación: agrúpalos para no parar el concierto cada tres minutos.'],
      },
      {
        h2: 'Imprímelo y compártelo',
        parrafos: ['Lleva copias legibles al escenario, con letra grande y los cambios marcados, y comparte la misma versión con el técnico de sonido. Un setlist con QR hacia tus redes convierte cada concierto en seguidores.'],
      },
    ],
    faq: [
      { q: '¿Cuántas canciones caben en una hora?', a: 'Depende de la duración media, pero con temas de tres a cuatro minutos y la charla entre canciones, suelen ser entre doce y catorce.' },
      { q: '¿Conviene cambiar el setlist según la sala?', a: 'Sí. Una sala de pie pide más energía; un teatro permite más matices. Ten una versión base y ajústala.' },
      { q: '¿Cómo meto las versiones de otros?', a: 'Dos o tres, en puntos donde el público se suelte, ayudan a conectar. No más de un tercio del set.' },
    ],
    relacionadas: ['como-organizar-ensayos', 'promocionar-un-concierto', '/plantilla-rider-tecnico'],
    cta: { titulo: 'Setlists que se ordenan solos', texto: 'En BandManager armas el repertorio, ves la curva de energía y exportas el setlist en PDF con QR.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'hoja-de-ruta-de-gira',
    titulo: 'Hoja de ruta de gira: plantilla y qué incluir',
    h1: 'Hoja de ruta de gira: qué incluir',
    descripcion: 'Cómo preparar la hoja de ruta (day sheet) de un concierto o una gira: horarios, contactos, carga, sonido y alojamiento. Con lista de comprobación.',
    intro: 'La hoja de ruta es el documento que evita llamadas a las dos de la mañana. Cada miembro de la banda debería poder abrirla y saber qué toca hacer y a qué hora.',
    secciones: [
      {
        h2: 'Qué incluye una hoja de ruta de un día',
        lista: ['Sala y dirección, con enlace al mapa y acceso de carga.', 'Persona de contacto en la sala y teléfono del técnico de sonido.', 'Hora de llegada, carga, prueba de sonido, apertura de puertas y salida a escena.', 'Duración del set y orden de bandas, si hay más grupos.', 'Camerino, comida y dónde dormir.', 'Qué lleva cada uno: backline, instrumentos y cables.'],
      },
      {
        h2: 'Para una gira de varias fechas',
        pasos: ['Una hoja por día con los mismos apartados, ordenadas por fecha.', 'Tiempos de viaje realistas entre ciudades, con margen para imprevistos.', 'Alojamiento y aparcamiento de la furgo confirmados con antelación.', 'Presupuesto previsto por fecha: gasolina, peajes, dietas.', 'Un responsable por fecha que lleve el contacto con la sala.'],
      },
      {
        h2: 'Cómo compartirla',
        parrafos: ['Un documento compartido que todos vean actualizado vale más que un PDF que circula por el grupo de WhatsApp. Si cambia una hora de prueba, debe cambiar para todos a la vez.'],
      },
    ],
    faq: [
      { q: '¿Qué diferencia hay entre rider y hoja de ruta?', a: 'El rider dice lo que necesitáis (sonido, backline, hospitalidad). La hoja de ruta dice cuándo y dónde pasa todo ese día.' },
      { q: '¿Quién la hace?', a: 'Quien lleve la gestión de la banda, con la información que da la sala. Conviene que todos la lean antes de salir.' },
      { q: '¿Cuándo debo mandarla?', a: 'Con tiempo para poder corregir: unos tres días antes en una fecha suelta y con la gira cerrada semanas antes.' },
    ],
    relacionadas: ['/plantilla-rider-tecnico', 'rider-de-hospitalidad', 'como-organizar-ensayos'],
    cta: { titulo: 'Gira y calendario en un solo sitio', texto: 'BandManager reúne tus conciertos, horarios y contactos para que toda la banda vea lo mismo.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'rider-de-hospitalidad',
    titulo: 'Rider de hospitalidad para bandas: qué pedir y qué no',
    h1: 'Rider de hospitalidad: qué pedir a una sala',
    descripcion: 'Qué es el rider de hospitalidad, qué puede pedir razonablemente una banda independiente y cómo plantearlo sin parecer exigente.',
    intro: 'El rider de hospitalidad recoge lo que necesitáis para estar bien durante el concierto: camerino, comida, bebida y logística. Para una banda independiente, menos es más.',
    secciones: [
      {
        h2: 'Qué suele pedirse',
        lista: ['Camerino con llave o espacio seguro para los instrumentos.', 'Agua suficiente para todos, en el camerino y en el escenario.', 'Comida o dietas para el equipo, o una cantidad acordada.', 'Aparcamiento cercano para la furgoneta y acceso de carga.', 'Entradas de cortesía para invitados, con un número claro.'],
      },
      {
        h2: 'Qué no conviene pedir',
        parrafos: ['Cosas que la sala no pueda cumplir o que parezcan caprichos: marcas concretas, cantidades exageradas. Si es una sala pequeña, pide lo básico. Lo demás se agradece más cuando se ofrece que cuando se exige.'],
      },
      {
        h2: 'Cómo plantearlo',
        pasos: ['Sepáralo del rider técnico: el técnico de sonido no necesita leer lo de la comida.', 'Marca lo imprescindible y lo que es "mejor si se puede".', 'Pregunta antes qué ofrece la sala: muchas ya lo tienen resuelto.', 'Confírmalo por escrito en la hoja de ruta.'],
      },
    ],
    faq: [
      { q: '¿Es obligatorio presentar rider de hospitalidad?', a: 'No, pero ayuda a evitar malentendidos. Basta con unas pocas líneas claras.' },
      { q: '¿Se negocia?', a: 'Sí. Es habitual adaptarlo al presupuesto y las condiciones de cada sala o festival.' },
      { q: '¿Dónde se incluye?', a: 'En un apartado distinto del rider técnico y del dossier, o como documento aparte.' },
    ],
    relacionadas: ['/plantilla-rider-tecnico', 'hoja-de-ruta-de-gira', 'contrato-actuacion-musical'],
    cta: { titulo: 'Todos tus documentos a mano', texto: 'Guarda el rider y el dossier en BandManager y compártelos con un enlace en cada propuesta.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'como-organizar-ensayos',
    titulo: 'Cómo organizar los ensayos de una banda para que sean productivos',
    h1: 'Cómo organizar los ensayos de una banda',
    descripcion: 'Cómo planificar ensayos que sirvan: frecuencia, objetivos por sesión, calendario compartido y cómo dejar de perder el tiempo.',
    intro: 'Un ensayo sin objetivo se convierte en una charla con ruido. Con una estructura sencilla, dos horas rinden más que cuatro sin plan.',
    secciones: [
      {
        h2: 'Cada ensayo, un objetivo',
        parrafos: ['Antes de empezar, decidid qué queréis conseguir: cerrar un tema nuevo, pulir las transiciones, preparar un concierto. Se anota al empezar y se revisa al acabar.'],
      },
      {
        h2: 'Una estructura que funciona',
        pasos: ['Diez minutos de montaje y afinación.', 'Calentamiento con un tema que ya domináis.', 'Trabajo del objetivo de la sesión.', 'Un pase completo del set, sin parar, como si fuera un directo.', 'Cinco minutos para decidir qué se hace en el próximo ensayo.'],
      },
      {
        h2: 'Calendario y asistencia',
        lista: ['Fijad un día y una hora recurrentes y respetadlos.', 'Confirmad asistencia con antelación: si falta alguien clave, mejor mover el ensayo que hacerlo a medias.', 'Compartid el repertorio y las grabaciones del último ensayo para que se trabaje en casa.'],
      },
      {
        h2: 'Antes de un concierto',
        parrafos: ['Dos semanas antes, pasad del trabajo de canciones al trabajo de directo: el set completo, el tiempo entre temas y la logística de escenario. Grabad un pase y escuchadlo: se oyen cosas que no se notan tocando.'],
      },
    ],
    faq: [
      { q: '¿Cuánto debe durar un ensayo?', a: 'Entre dos y tres horas suele ser lo que se sostiene con calidad. Más allá, baja la concentración.' },
      { q: '¿Cuántas veces por semana?', a: 'Una a la semana es lo habitual en bandas que compaginan trabajo; aumenta antes de conciertos importantes.' },
      { q: '¿Y si no coincidimos todos?', a: 'Ensayad por secciones (ritmo, armonías) y reservad un ensayo completo antes de cada fecha.' },
    ],
    relacionadas: ['como-hacer-un-setlist', 'hoja-de-ruta-de-gira', 'promocionar-un-concierto'],
    cta: { titulo: 'Ensayos y calendario compartidos', texto: 'BandManager gestiona los ensayos, la asistencia y el repertorio de toda la banda.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'promocionar-un-concierto',
    titulo: 'Cómo promocionar un concierto: plan de 4 semanas para tu banda',
    h1: 'Cómo promocionar un concierto',
    descripcion: 'Un plan de promoción por semanas para un concierto: cartel, redes, enlaces con seguimiento, prensa local y cómo llenar la sala.',
    intro: 'Llenar una sala no depende solo de la sala. Con cuatro semanas, un cartel claro y un enlace que se pueda compartir, ya tienes una campaña.',
    secciones: [
      {
        h2: 'Semana 4: prepara la base',
        pasos: ['Cierra fecha, hora, precio y dónde se compra la entrada.', 'Diseña un cartel legible: sala, fecha y hora a primera vista.', 'Crea una única página o enlace del concierto para compartir en todos los canales.'],
      },
      {
        h2: 'Semanas 3 y 2: empieza a sonar',
        lista: ['Anuncia la fecha en tus redes con un vídeo corto de directo, no solo con el cartel.', 'Escribe a la prensa y a los blogs locales con una nota breve y el enlace al concierto.', 'Pide a la sala que lo comparta y etiquete a la banda.', 'Invita en persona: el boca a boca sigue siendo lo que más llena.'],
      },
      {
        h2: 'Última semana: recuerda y cuenta atrás',
        parrafos: ['Publica una cuenta atrás con contenido distinto cada día: un ensayo, un tema, la lista de invitados. Manda un correo a tus fans con la fecha y el enlace de entradas. El día del concierto, recuerda el horario y la dirección.'],
      },
      {
        h2: 'Mide qué funciona',
        parrafos: ['Usa enlaces distintos para cada canal (Instagram, correo, cartel) y mira cuál trae más clics a las entradas. La próxima vez dedica el esfuerzo a lo que funcionó.'],
      },
    ],
    faq: [
      { q: '¿Con cuánta antelación se anuncia un concierto?', a: 'De tres a cuatro semanas para una sala local. Si hay entradas anticipadas o festival, antes.' },
      { q: '¿Funciona pagar publicidad en redes?', a: 'Puede, con una audiencia local acotada y un presupuesto pequeño. Antes agota lo gratuito: tu lista de correo y tus redes.' },
      { q: '¿Qué pongo en el cartel?', a: 'Nombre de la banda, sala, fecha, hora y precio. Todo lo demás es secundario.' },
    ],
    relacionadas: ['captar-emails-de-fans', 'como-hacer-un-setlist', 'como-conseguir-bolos'],
    cta: { titulo: 'Una página para cada concierto', texto: 'BandManager crea la página pública del concierto, el cartel y enlaces cortos con seguimiento.', boton: 'Probar BandManager gratis' },
  },
];
