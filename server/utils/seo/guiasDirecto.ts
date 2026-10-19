import type { GuiaSeo } from './tipos.js';

export const GUIAS_DIRECTO: GuiaSeo[] = [
  {
    slug: 'como-hacer-un-setlist',
    titulo: 'Cómo hacer un setlist: estructura, orden y plantillas gratis',
    h1: 'Cómo hacer un setlist que funcione',
    descripcion: 'Qué es un setlist y cómo montarlo: calcula el tiempo, estructura el concierto en cinco tramos, ordena por tonalidad y afinación y copia tres plantillas.',
    intro: 'Un setlist es la lista ordenada de los temas de un concierto, con sus transiciones y, a menudo, la tonalidad y la afinación de cada uno. Casi todos se rompen por el medio: buen arranque, buen cierre y, entre medias, una playlist sin hilo. La solución no es meter más temas, es darle forma.',
    resumen: ['Empieza por el tiempo real de tu slot, no por las canciones: casi todas las bandas cargan de más.', 'Estructura el set en cinco tramos (gancho, subida, respiro, remontada y cierre) y ordena después por tonalidad y afinación.', 'Lleva una hoja de una página al escenario, mándale el setlist al técnico con tiempo y trátalo como un borrador hasta la prueba de sonido.'],
    secciones: [
      {
        h2: 'Empieza por el tiempo, no por las canciones',
        parrafos: ['Antes de abrir ninguna herramienta, apunta dos números: los minutos que tienes en el escenario y lo que dura de media cada tema. Después cuenta medio minuto de transición por canción y resta cinco minutos de margen para imprevistos: una cuerda rota, un pedido del público, un micro que no suena.', 'La cuenta es sencilla: (minutos del slot menos 5) dividido entre (duración media más 0,5). Con ella sale un número de temas casi siempre menor del que pensabas.'],
        calculadora: 'slot-setlist',
        tablas: [{ titulo: 'Cuántos temas caben en tu slot', cabeceras: ['Slot', 'Temas de 4 min', 'Temas de 3 min'], filas: [['30 min', '5', '7'], ['45 min', '8', '11'], ['60 min', '12', '15'], ['75 min', '15', '20'], ['90 min', '18', '24']] }],
      },
      {
        h2: 'La curva de energía en cinco tramos',
        parrafos: ['Un set que funciona tiene casi siempre el mismo esqueleto: arranca con algo que enganche, sube, respira, vuelve a subir y cierra con algo que todos puedan cantar. No es una fórmula mágica, es la forma en que se cansa y se recupera la atención de una sala.'],
        figura: 'curva-setlist',
        tablas: [{ titulo: 'Los cinco tramos de un set de doce temas', cabeceras: ['Tramo', 'Temas', 'Qué buscas'], filas: [['Gancho', '1 y 2', 'Atrapar en los primeros 20 segundos. Un tema medio o rápido; el lento profundo se guarda.'], ['Subida', '3 a 5', 'Subir energía con temas más cortos y estribillos grandes. Aquí el público ocasional decide si se queda.'], ['Respiro', '6 y 7', 'Un tema más lento o desnudo. Sin él, la sala se agota hacia el noveno.'], ['Remontada', '8 a 10', 'Reconstruir la tensión con los temas más grandes.'], ['Cierre', '11 y 12 (y bis)', 'Un estribillo que todos conozcan. Nada experimental al final.']] }],
        aviso: 'Una regla que suele funcionar: el tema más conocido va penúltimo, no último. El público llega al pico antes del cierre y se va cantando el último, que debe ser un estribillo seguro.',
      },
      {
        h2: 'Ordena por tonalidad y afinación',
        parrafos: ['Cuando el orden suena bien, míralo con los ojos de la banda. Dos temas en drop D seguidos son un cambio de afinación ahorrado. Tres posiciones distintas de cejilla seguidas son tres momentos en que el guitarrista mira al mástil en lugar del público. Si puedes agrupar por afinación sin romper la curva, hazlo; si no, cubre el cambio con una intro de treinta segundos o una historia.', 'Con las tonalidades pasa algo parecido: no hace falta ser teórico, basta con escuchar las uniones. Si dos temas seguidos suenan mal cantados a medio volumen en el salón de casa, cambia uno de sitio.'],
        tablas: [{ titulo: 'Cómo suena cada salto de tonalidad', cabeceras: ['Salto', 'Efecto', 'Cuándo usarlo'], filas: [['Una cuarta o quinta arriba', 'Suena a construcción', 'Para remontar tras el respiro'], ['Un tono abajo', 'Suena a bajada', 'Justo antes del tema lento'], ['Misma tonalidad dos veces', 'Plano', 'Solo si el tempo cambia mucho'], ['Un semitono', 'Suena a accidente', 'Evítalo salvo que sea a propósito']] }],
      },
      {
        h2: 'Planifica las transiciones, no solo los temas',
        parrafos: ['La mayoría de los setlists listan doce temas y cero transiciones. En el escenario, cada hueco se convierte en una pregunta. Decide antes de subir:'],
        lista: ['Qué temas van pegados, con cuenta directa desde la última nota.', 'Cuáles necesitan un puente: un relleno de batería, un colchón de teclado, una afinación.', 'Cuáles piden una historia o una frase del cantante.', 'Dónde hace falta un descanso real: agua, cambio de guitarra, hablar con el público.'],
        aviso: 'Escribe las transiciones como líneas aparte en el setlist. «Cambio a acústica» forma parte del concierto tanto como el tema anterior.',
      },
      {
        h2: 'Una hoja de una página para el escenario',
        parrafos: ['La versión que acaba pegada en el suelo delante del baterista debe caber en una página, leerse bajo los focos a dos metros y llevar solo lo imprescindible: título, tonalidad y afinación. Las letras y los acordes van en una tablet o en el móvil, en una vista pensada para escenario, no en el papel.'],
      },
      {
        h2: 'Mándaselo al técnico de sonido con tiempo',
        parrafos: ['Lo que más sube tu sonido en directo es entregar al técnico, el día antes, un setlist con las duraciones y los temas que piden algo especial: cambio a acústica, voz de armonía, click, un sample. Si la sala tiene técnico de casa que no te ha oído nunca, añade el plano de escenario: dará por hecho que no tienes uno.', 'Mejor un enlace que un PDF: el PDF se queda viejo en cuanto cambias el orden.'],
      },
      {
        h2: 'Tres plantillas para copiar',
        parrafos: ['Son esqueletos, no sentencias: cambia los tipos de tema por los tuyos y ajusta la duración a tu slot.'],
        tablas: [
          { titulo: 'Concierto de 45 minutos como telonero', cabeceras: ['#', 'Tema', 'Función'], filas: [['1', 'Tu mejor arranque', 'Gancho'], ['2', 'Tu segundo mejor tema', 'Gancho'], ['3', 'Tema nuevo o menos conocido', 'Subida'], ['4', 'Tema más conocido', 'Pico'], ['5', 'Lento o desnudo', 'Respiro'], ['6', 'Tema de construcción', 'Remontada'], ['7', 'El que quieres que recuerden', 'Cierre']] },
          { titulo: 'Concierto de 75 minutos en sala propia', cabeceras: ['Bloque', 'Temas', 'Función'], filas: [['Apertura', '1 a 3', 'Gancho y subida'], ['Primer tercio', '4 a 7', 'Material nuevo con los estribillos grandes'], ['Respiro', '8 y 9', 'Un lento y un tema acústico'], ['Remontada', '10 a 13', 'Los temas más conocidos'], ['Cierre', '14 y 15', 'Estribillo conocido y bis']] },
          { titulo: 'Festival de 30 minutos', cabeceras: ['#', 'Idea'], filas: [['1 a 2', 'Arranca fuerte y sin hablar: el público está de paso'], ['3 a 4', 'Sube con lo más reconocible'], ['5', 'Un único respiro corto'], ['6 a 7', 'Cierra con lo más conocido y deja uno de reserva']] },
        ],
      },
      {
        h2: 'Cómo hacerlo en BandManager',
        lista: ['Guarda cada tema con su tonalidad, BPM y duración en el repertorio.', 'Arma el setlist arrastrando temas y mira el mapa de energía del set para ver si la curva respira.', 'Exporta el setlist en PDF para imprimirlo y llevarlo al escenario.', 'Compártelo como texto con el resto de la banda y úsalo en el modo escenario, con letras, acordes y transposición.'],
      },
      {
        h2: 'Trátalo como un borrador hasta la prueba de sonido',
        parrafos: ['Las mejores bandas reconstruyen los últimos tres temas después de la prueba, según la sala. Si es pequeña y el público es mayor, recortan el cierre más ruidoso y suben el estribillo. Si el público es joven y está de pie, al revés. Un setlist es un plan, no un contrato: constrúyelo para poder editarlo, no para conservarlo.'],
      },
    ],
    faq: [
      { q: '¿Cuántas canciones caben en una hora?', a: 'Entre doce y quince, según duren tres o cuatro minutos cada una, contando medio minuto de transición y cinco minutos de margen.' },
      { q: '¿Qué canción va primera y cuál última?', a: 'Primero algo que enganche en veinte segundos, no necesariamente tu mejor tema. Al final, un estribillo que todos conozcan; el más conocido suele ir justo antes.' },
      { q: '¿Conviene cambiar el setlist según la sala?', a: 'Sí. Una sala de pie pide más energía y un teatro permite más matices. Ten una versión base y ajusta los últimos tres temas tras la prueba.' },
      { q: '¿Cuántas versiones de otros meto?', a: 'Dos o tres, colocadas donde la sala pueda soltarse, ayudan a conectar. Mejor que no pasen de un tercio del set.' },
    ],
    relacionadas: ['como-organizar-ensayos', 'como-hacer-una-prueba-de-sonido', 'promocionar-un-concierto'],
    cta: { titulo: 'Setlists que se ordenan solos', texto: 'En BandManager armas el repertorio, ves la curva de energía y exportas el setlist en PDF.', boton: 'Probar BandManager gratis' },
  },

  {
    slug: 'hoja-de-ruta-de-gira',
    titulo: 'Hoja de ruta de gira: plantilla y qué incluir',
    h1: 'Hoja de ruta de gira: qué incluir',
    descripcion: 'Cómo preparar la hoja de ruta (day sheet) de un concierto o una gira: horarios, contactos, carga, sonido y alojamiento. Con lista de comprobación.',
    intro: 'La hoja de ruta es el documento que evita llamadas a las dos de la mañana. Cada miembro de la banda debería poder abrirla y saber qué toca hacer y a qué hora.',
    resumen: ['Una hoja por día con sala, contactos, horarios, comida y alojamiento.', 'En gira, añade tiempos de viaje realistas y un responsable por fecha.', 'Compártela en un documento vivo, no en un PDF perdido en el chat.'],
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
    relacionadas: ['/technical-rider-template', 'rider-de-hospitalidad', 'como-organizar-ensayos'],
    cta: { titulo: 'Gira y calendario en un solo sitio', texto: 'BandManager reúne tus conciertos, horarios y contactos para que toda la banda vea lo mismo.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'rider-de-hospitalidad',
    titulo: 'Rider de hospitalidad para bandas: qué pedir y qué no',
    h1: 'Rider de hospitalidad: qué pedir a una sala',
    descripcion: 'Qué es el rider de hospitalidad, qué puede pedir razonablemente una banda independiente y cómo plantearlo sin parecer exigente.',
    intro: 'El rider de hospitalidad recoge lo que necesitáis para estar bien durante el concierto: camerino, comida, bebida y logística. Para una banda independiente, menos es más.',
    resumen: ['Pide solo lo básico: camerino, agua, comida, parking y entradas de cortesía.', 'Sepáralo del rider técnico y marca qué es imprescindible.', 'Pregunta antes qué ofrece la sala: muchas ya lo tienen resuelto.'],
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
    relacionadas: ['/technical-rider-template', 'hoja-de-ruta-de-gira', 'contrato-actuacion-musical'],
    cta: { titulo: 'Todos tus documentos a mano', texto: 'Guarda el rider y el dossier en BandManager y compártelos con un enlace en cada propuesta.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'como-organizar-ensayos',
    titulo: 'Cómo organizar los ensayos de una banda para que sean productivos',
    h1: 'Cómo organizar los ensayos de una banda',
    descripcion: 'Cómo planificar ensayos que sirvan: frecuencia, objetivos por sesión, calendario compartido y cómo dejar de perder el tiempo.',
    intro: 'Un ensayo sin objetivo se convierte en una charla con ruido. Con una estructura sencilla, dos horas rinden más que cuatro sin plan.',
    resumen: ['Cada ensayo, un objetivo anotado al empezar y revisado al acabar.', 'Estructura: montaje, calentamiento, trabajo, pase completo y plan del siguiente.', 'Dos semanas antes de un bolo, pasa de trabajar canciones a trabajar el directo.'],
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
    resumen: ['Cuatro semanas bastan: base, ruido, cuenta atrás y medición.', 'Una sola página del concierto para compartir en todos los canales.', 'Un enlace distinto por canal te dice cuál trae más gente.'],
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
