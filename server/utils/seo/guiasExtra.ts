import type { GuiaSeo } from './tipos.js';

export const GUIAS_EXTRA: GuiaSeo[] = [
  {
    slug: 'como-elegir-nombre-de-banda',
    titulo: 'Cómo elegir el nombre de una banda: criterios y errores a evitar',
    h1: 'Cómo elegir el nombre de una banda',
    descripcion: 'Criterios para elegir un buen nombre de banda: que se recuerde, se escriba, se encuentre en internet y esté libre. Con lista de comprobación.',
    intro: 'El nombre es lo primero que lee un programador y lo último que quieres cambiar cuando ya tienes público. Elegirlo bien al principio te ahorra muchos problemas.',
    resumen: ['Un buen nombre se recuerda, se escribe sin dudar y se encuentra al buscarlo.', 'Comprueba antes que esté libre en buscadores, redes, plataformas de música y registros.', 'Pruébalo en voz alta y por teléfono: si hay que deletrearlo, es un problema.'],
    secciones: [
      {
        h2: 'Qué hace bueno a un nombre',
        lista: ['Se recuerda: corto, con ritmo, fácil de decir en voz alta.', 'Se escribe sin dudas: quien lo oye en un concierto puede buscarlo sin equivocarse.', 'Se encuentra: no se confunde con otros grupos, personas o palabras comunes.', 'Encaja con tu música sin encasillarte: dentro de cinco años puedes sonar distinto.'],
      },
      {
        h2: 'Comprobaciones antes de decidir',
        pasos: ['Búscalo en Google entre comillas y en Spotify: si ya hay una banda con ese nombre, descártalo.', 'Comprueba que el usuario esté libre en Instagram, YouTube y TikTok, o que sea muy parecido.', 'Mira si hay dominio disponible, aunque sea con una pequeña variación.', 'Consulta el registro de marcas de tu país por si alguien ya lo protege.', 'Pregunta a cinco personas qué entienden al leerlo y cómo lo escribirían al oírlo.'],
      },
      {
        h2: 'Errores habituales',
        lista: ['Nombres tan genéricos que son imposibles de encontrar en un buscador.', 'Grafías raras, símbolos o números que nadie sabe escribir.', 'Chistes internos que solo entiende la banda.', 'Elegirlo sin comprobar disponibilidad y descubrirlo cuando ya hay cartel impreso.'],
      },
      {
        h2: 'Cambiar de nombre a tiempo',
        parrafos: ['Si te das cuenta de que el nombre no funciona, cámbialo cuanto antes. Cuantas menos escuchas, seguidores y conciertos tengas a ese nombre, menos cuesta. Anuncia el cambio y mantén el nombre antiguo en la biografía durante un tiempo.'],
      },
    ],
    faq: [
      { q: '¿Puedo registrar el nombre de mi banda?', a: 'Sí, como marca en la oficina de patentes y marcas de tu país. No es obligatorio, pero te protege si otro grupo empieza a usarlo. Consulta con un profesional, porque depende de cada caso.' },
      { q: '¿Importa que el nombre esté en inglés o en español?', a: 'Importa que encaje con tu público y que se pueda pronunciar. Si quieres tocar fuera, comprueba que no signifique algo raro en otro idioma.' },
      { q: '¿Y si el nombre ya lo usa otra banda en otro país?', a: 'Mejor evitarlo. Aunque no haya conflicto legal, en las plataformas de música y buscadores se mezclarán vuestros resultados.' },
    ],
    relacionadas: ['como-hacer-un-epk', 'como-hacer-un-cartel-de-concierto', 'captar-emails-de-fans'],
    cta: { titulo: 'Tu banda, bien presentada', texto: 'En BandManager reúnes el nombre, el dossier, el repertorio y la página de fans de tu banda en un solo sitio.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'como-hacer-un-cartel-de-concierto',
    titulo: 'Cómo hacer un cartel de concierto que se lea y llame la atención',
    h1: 'Cómo hacer un cartel de concierto',
    descripcion: 'Qué debe llevar un cartel de concierto, cómo ordenar la información, qué tamaños usar y los errores que hacen que nadie lo lea. Con lista de comprobación.',
    intro: 'Un cartel tiene dos segundos para decir quién toca, dónde y cuándo. Si hay que entrecerrar los ojos para entenderlo, ya ha fallado.',
    resumen: ['Lo imprescindible: nombre de la banda, sala, fecha, hora y precio o dónde comprar.', 'Una sola jerarquía clara: banda y fecha grandes, el resto pequeño pero legible.', 'Prepara versión vertical para redes y horizontal para pantallas y prensa.'],
    secciones: [
      {
        h2: 'Qué debe llevar',
        lista: ['Nombre de la banda, legible desde lejos.', 'Sala y ciudad, con la dirección si no es muy conocida.', 'Fecha y hora de apertura de puertas y del concierto.', 'Precio de la entrada o dónde conseguirla, con un enlace o un QR.', 'Los logos de sala o patrocinadores, si los hay.'],
      },
      {
        h2: 'Cómo ordenar la información',
        pasos: ['Decide qué es lo primero que quieres que se lea: normalmente la banda y la fecha.', 'Usa como máximo dos tipografías y dos o tres tamaños.', 'Deja espacio en blanco: un cartel lleno no se lee.', 'Cuida el contraste entre texto y fondo, sobre todo si usas una foto.', 'Añade un QR que lleve a la página del concierto o a las entradas.'],
      },
      {
        h2: 'Formatos que conviene tener',
        lista: ['Vertical (4:5) para Instagram y la mayoría de las redes.', 'Cuadrado para publicaciones y mensajes.', 'Horizontal para pantallas, webs y prensa.', 'Un tamaño imprimible (A3 o A4) con margen de sangrado si lo vas a llevar a una imprenta.'],
      },
      {
        h2: 'Errores que lo estropean',
        parrafos: ['Texto demasiado pequeño, fechas ambiguas ("el sábado" sin día), fondos que se comen las letras y olvidar la hora. Antes de publicarlo, enséñaselo a alguien durante cinco segundos y pregúntale qué ha entendido.'],
      },
    ],
    faq: [
      { q: '¿Necesito un diseñador?', a: 'No necesariamente. Con una buena foto, poca tipografía y un orden claro puedes hacer un cartel correcto tú mismo. Un diseñador ayuda cuando quieres una identidad visual de banda.' },
      { q: '¿Qué tamaño tiene un cartel de concierto?', a: 'Para imprimir, A3 o A4 son los más habituales. Para redes, 1080 por 1350 píxeles en vertical funciona en la mayoría de las plataformas.' },
      { q: '¿Pongo el precio en el cartel?', a: 'Sí, si el precio es fijo. Si las entradas se venden en varias partes, pon dónde conseguirlas con un QR.' },
    ],
    relacionadas: ['promocionar-un-concierto', 'como-elegir-nombre-de-banda', 'como-conseguir-prensa-local'],
    cta: { titulo: 'Cartel y página del concierto', texto: 'BandManager crea el cartel y la página pública de cada concierto, con enlaces cortos para saber qué canal trae más gente.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'como-hacer-una-prueba-de-sonido',
    titulo: 'Cómo hacer una prueba de sonido eficaz: pasos y orden',
    h1: 'Cómo hacer una prueba de sonido',
    descripcion: 'Cómo preparar y ordenar la prueba de sonido de una banda: input list, orden de canales, monitores, comunicación con el técnico y cuánto tiempo dedicar.',
    intro: 'La prueba de sonido suele durar menos de lo que crees. Llegar con todo preparado marca la diferencia entre sonar bien o empezar el concierto con prisas.',
    resumen: ['Lleva el rider y la input list impresos y compártelos con el técnico antes de llegar.', 'Sigue un orden: batería, bajo, guitarras, teclados, voces y, al final, una canción completa.', 'Pide lo imprescindible en monitores y deja el pulido para el directo.'],
    secciones: [
      {
        h2: 'Antes de llegar',
        lista: ['Manda el rider técnico y la input list con antelación.', 'Revisa cables, pilas, cuerdas de repuesto y pedales.', 'Define quién habla con el técnico: una sola persona por banda.', 'Prepara el setlist y la canción con la que probarás el sonido.'],
      },
      {
        h2: 'El orden de la prueba',
        pasos: ['Monta primero, sin sonido, y deja el escenario despejado.', 'Pasad canal por canal: bombo, caja, resto de la batería, bajo, guitarras, teclados y voces.', 'Ajustad monitores: pide lo justo para oírte, sin obsesionarte.', 'Tocad una canción completa con toda la banda para equilibrar la mezcla.', 'Dejad anotados los ajustes importantes antes de salir del escenario.'],
      },
      {
        h2: 'Cómo hablar con el técnico',
        parrafos: ['Sé amable y concreto: en lugar de "más graves", di "no oigo el bajo en mi monitor". Escucha sus sugerencias: conoce la sala. Y no discutáis entre vosotros delante del técnico, que consume el tiempo de todos.'],
      },
      {
        h2: 'Qué dejar para el directo',
        parrafos: ['No pulas cada detalle: con público la sala suena distinta. Comprueba lo esencial, fija una referencia de volumen y reserva el tiempo que sobre para descansar antes del concierto.'],
      },
    ],
    faq: [
      { q: '¿Cuánto dura una prueba de sonido?', a: 'Entre veinte y cuarenta minutos para una banda pequeña, dependiendo de los canales y de la sala. Pregunta en la sala cuánto tiempo te dan.' },
      { q: '¿Qué hago si no hay prueba de sonido?', a: 'En festivales o programaciones con varias bandas a veces solo hay una línea de sonido rápida. Llega con todo montado y los ajustes anotados.' },
      { q: '¿Qué es una input list?', a: 'La lista de canales que el técnico conecta a la mesa. Cuanto más clara, más rápido va la prueba.' },
    ],
    relacionadas: ['/technical-rider-template', 'hoja-de-ruta-de-gira', 'como-organizar-ensayos'],
    cta: { titulo: 'Rider y hoja de ruta a mano', texto: 'Guarda el rider técnico y la hoja de ruta de cada concierto en BandManager y compártelos con la sala con un enlace.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'como-grabar-un-directo-con-el-movil',
    titulo: 'Cómo grabar un directo con el móvil: vídeo y audio decentes',
    h1: 'Cómo grabar un directo con el móvil',
    descripcion: 'Cómo conseguir una grabación de directo útil para tu dossier con un móvil: dónde colocarlo, cómo evitar la saturación del audio y cómo editarlo en un teaser.',
    intro: 'No necesitas una cámara profesional para tener un teaser de directo que convenza a una sala. Necesitas luz, un sitio estable y un audio que no sature.',
    resumen: ['Lo más importante es el audio: evita que el micrófono del móvil sature con el volumen de la sala.', 'Coloca el móvil fijo, en horizontal y con buena luz, mejor que en la mano.', 'Un teaser de 30 a 60 segundos vale más que un concierto entero.'],
    secciones: [
      {
        h2: 'Dónde colocar el móvil',
        lista: ['Fijo, sobre un trípode o apoyado en un sitio estable. Nada de grabar en la mano.', 'En horizontal, a la altura del pecho o más alto, con todo el grupo en plano.', 'A cierta distancia del escenario, para que el micro no reciba el volumen de los altavoces.', 'Con luz suficiente: sin contraluces de focos directos a la cámara.'],
      },
      {
        h2: 'Cómo cuidar el audio',
        pasos: ['Si puedes, usa un grabador o la señal de la mesa y sincroniza el audio después.', 'Si usas solo el móvil, aléjate de los altavoces y baja la ganancia si tu app lo permite.', 'Haz una prueba de diez segundos y escúchala con auriculares antes del concierto.', 'Graba varias canciones: siempre habrá una que salga mejor.'],
      },
      {
        h2: 'Convertirlo en un teaser',
        parrafos: ['Elige el mejor minuto del concierto: arranque con energía, un estribillo reconocible y un cierre limpio. Recórtalo, ajusta el volumen y añade el nombre de la banda al principio o al final. Con eso ya tienes el vídeo que cualquier sala puede abrir en su móvil.'],
      },
      {
        h2: 'Permisos y buen uso',
        parrafos: ['Pide permiso a la sala si vas a grabar desde un sitio concreto o si va a salir público reconocible. Y si publicas material de otros grupos o canciones de terceros, revisa las condiciones de cada plataforma.'],
      },
    ],
    faq: [
      { q: '¿Mejor grabar vídeo en vertical o en horizontal?', a: 'En horizontal para el dossier y las salas. Para redes puedes recortar una versión vertical después.' },
      { q: '¿Qué app uso para grabar?', a: 'La cámara del móvil funciona, pero algunas apps de vídeo permiten controlar el nivel de audio y evitar la saturación.' },
      { q: '¿Cuánto debe durar el vídeo del dossier?', a: 'Entre treinta y sesenta segundos. Si tienen que ver cinco minutos para decidir, no lo harán.' },
    ],
    relacionadas: ['como-hacer-un-epk', 'como-conseguir-bolos', 'promocionar-un-concierto'],
    cta: { titulo: 'Tu directo, en tu dossier', texto: 'En BandManager enlazas tus vídeos y tus escuchas en el dossier de tu banda y lo compartes con un solo enlace.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'como-conseguir-prensa-local',
    titulo: 'Cómo conseguir prensa local para tu banda: guía práctica',
    h1: 'Cómo conseguir prensa local para tu banda',
    descripcion: 'Cómo llegar a medios locales, blogs y radios: qué enviar, cómo escribir una nota de prensa corta y cómo hacer seguimiento sin agobiar.',
    intro: 'La prensa local lee muchos mensajes al día. Los que consiguen una mención son los que le ponen fácil el trabajo al periodista: una noticia clara, un enlace y fotos listas.',
    resumen: ['Dirígete a medios, blogs y radios de tu ciudad que ya hablan de música como la tuya.', 'Envía una nota corta con una noticia concreta: un concierto, un disco, un hito.', 'Incluye un enlace al dossier con fotos y música, sin adjuntos pesados.'],
    secciones: [
      {
        h2: 'A quién escribir',
        lista: ['Secciones de cultura de la prensa local y regional.', 'Blogs y medios especializados en tu estilo.', 'Radios locales y programas musicales.', 'Agendas culturales de tu ciudad, que suelen publicar conciertos gratis.'],
      },
      {
        h2: 'Qué enviar',
        pasos: ['Un asunto claro con la noticia: "Concierto de [banda] en [sala] el [fecha]".', 'Un primer párrafo con lo esencial: quién, qué, cuándo, dónde.', 'Una frase de contexto: por qué interesa a su público.', 'Enlace al dossier con fotos de calidad, música y vídeo.', 'Datos de contacto y disponibilidad para entrevistas.'],
      },
      {
        h2: 'El momento adecuado',
        parrafos: ['Dos o tres semanas antes de un concierto para que puedan publicarlo con tiempo. Si es un lanzamiento, avisa antes de que salga y ofrece una escucha previa. Y evita escribir a todos los medios el mismo día con el mismo texto: cada periodista agradece un detalle propio.'],
      },
      {
        h2: 'Seguimiento sin agobiar',
        parrafos: ['Si no hay respuesta en una semana, una línea de recordatorio con algo nuevo. Si tampoco, déjalo y vuelve con la siguiente noticia. Agradece siempre una mención y compártela en tus redes mencionando al medio.'],
      },
    ],
    faq: [
      { q: '¿Necesito una agencia de prensa?', a: 'Para una banda local no hace falta. Con una nota bien escrita y un dossier cuidado puedes conseguir presencia en medios de tu ciudad por tu cuenta.' },
      { q: '¿Qué foto envío?', a: 'Una foto de banda de buena calidad, con buena luz, en horizontal y vertical, con permiso para publicarla.' },
      { q: '¿Y si no me contestan?', a: 'Es normal. Prueba con otro medio y con otra noticia. A veces la respuesta llega semanas después.' },
    ],
    relacionadas: ['como-hacer-un-epk', 'promocionar-un-concierto', 'como-hacer-un-cartel-de-concierto'],
    cta: { titulo: 'Un dossier listo para prensa', texto: 'BandManager te deja montar el dossier de tu banda y compartirlo con un enlace para salas, prensa y festivales.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'como-colaborar-con-otras-bandas',
    titulo: 'Cómo colaborar con otras bandas: intercambios de bolos y giras',
    h1: 'Cómo colaborar con otras bandas',
    descripcion: 'Cómo montar intercambios de bolos, conciertos compartidos y giras entre bandas: cómo proponerlo, qué acordar y cómo repartir el trabajo y el público.',
    intro: 'Las bandas que se ayudan crecen más rápido. Un concierto compartido suma públicos, reparte gastos y abre puertas a salas de otra ciudad.',
    resumen: ['Busca bandas de un estilo cercano y con público parecido al tuyo.', 'Propón un intercambio concreto: tú tocas en su ciudad y ellos en la tuya.', 'Acordad por escrito horarios, reparto de gastos y quién promociona qué.'],
    secciones: [
      {
        h2: 'Con quién colaborar',
        lista: ['Bandas de estilo cercano, no idéntico: suma público sin competir.', 'Bandas de otra ciudad que quieran tocar en la tuya.', 'Grupos con una escena de seguidores activa y buenas relaciones con salas.'],
      },
      {
        h2: 'Cómo proponerlo',
        pasos: ['Escribe un mensaje corto: quién eres, qué propones y por qué os encajaría.', 'Propón un intercambio claro: "tocáis en nuestra ciudad y nosotros en la vuestra".', 'Enlaza tu dossier y un vídeo de directo para que puedan valorarlo.', 'Ofrece algo más: presentarles a una sala o compartir contactos.'],
      },
      {
        h2: 'Qué acordar antes',
        lista: ['Orden de actuación y duración de cada set.', 'Reparto de caché o de taquilla.', 'Quién pone backline y quién hace de contacto con la sala.', 'Quién promociona y en qué canales.', 'Gastos compartidos: transporte, alojamiento, comidas.'],
      },
      {
        h2: 'Mantener la relación',
        parrafos: ['Cumple lo acordado, comparte su música y vuelve a proponer otra fecha. Una banda con la que has tocado bien es la mejor recomendación para otras salas y otras ciudades.'],
      },
    ],
    faq: [
      { q: '¿Qué es un intercambio de bolos?', a: 'Dos bandas de ciudades distintas se organizan para tocar la una en la ciudad de la otra, aprovechando los contactos y el público local de cada una.' },
      { q: '¿Cómo reparto el dinero en un concierto compartido?', a: 'Lo habitual es repartir a partes iguales tras gastos, o por orden de cartel y convocatoria. Acordadlo antes, por escrito.' },
      { q: '¿Y si una de las bandas no promociona?', a: 'Deja claro desde el principio qué se espera de cada una. Si no cumple, valora si volver a colaborar.' },
    ],
    relacionadas: ['como-conseguir-bolos', 'repartir-dinero-en-una-banda', 'hoja-de-ruta-de-gira'],
    cta: { titulo: 'Fechas y contactos en orden', texto: 'BandManager reúne tus conciertos, tus salas y tus contactos para organizar intercambios sin perder el hilo.', boton: 'Probar BandManager gratis' },
  },
];
