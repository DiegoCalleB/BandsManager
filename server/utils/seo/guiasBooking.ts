import type { GuiaSeo } from './tipos.js';

export const GUIAS_BOOKING: GuiaSeo[] = [
  {
    slug: 'como-hacer-un-epk',
    titulo: 'Cómo hacer un EPK para tu banda: estructura, ejemplos y checklist',
    h1: 'Cómo hacer un EPK para tu banda',
    descripcion: 'Qué incluir en el EPK (dossier de prensa) de tu banda, en qué orden y qué sobra. Con esquema de una pantalla, ejemplos de antes y después y una checklist.',
    intro: 'El EPK, o dossier de prensa electrónico, es la página que abre una sala, un festival o un periodista para decidir si te contrata o te escribe. Tiene un minuto. Un buen EPK no cuenta toda tu historia: responde rápido a las tres preguntas del programador y le da un motivo para contestar.',
    resumen: ['Un EPK de una pantalla responde a tres cosas: ¿encaja con mi sala?, ¿llena público? y ¿es fácil trabajar con ellos?', 'El orden importa: nombre y estilo, escucha inmediata, foto, un dato real, biografía corta, vídeo de directo y, al final, rider y contacto.', 'Compártelo como enlace, adáptalo según a quién se lo mandas y actualízalo tras cada concierto: un EPK desactualizado resta confianza.'],
    secciones: [
      {
        h2: 'Qué se pregunta quien lo abre',
        parrafos: ['Quien programa recibe decenas de propuestas a la semana. No lee: escanea. Cada bloque de tu EPK tiene que contestar una duda concreta en pocos segundos.'],
        tablas: [{ titulo: 'Lo que el programador necesita saber', cabeceras: ['Pregunta', 'Dónde la responde tu EPK'], filas: [['¿Qué hacen y a qué suena?', 'Una frase de estilo y una escucha inmediata.'], ['¿Encajan con mi sala?', 'El estilo, el formato y un dato de dónde han tocado.'], ['¿Llevan público?', 'Un dato real de tracción local, solo uno.'], ['¿Tocan bien en directo?', 'Un vídeo de treinta a sesenta segundos.'], ['¿Es fácil trabajar con ellos?', 'Rider claro y contacto visible.']] }],
      },
      {
        h2: 'Anatomía de un EPK de una pantalla',
        parrafos: ['Piénsalo para el móvil, que es donde se abre casi todo. De arriba abajo, lo que decide va primero y lo que se consulta después va al final.'],
        figura: 'anatomia-epk',
        pasos: ['Nombre y estilo en una frase, sin superlativos que no puedas demostrar.', 'Una escucha inmediata: un par de temas o un teaser, que suenen sin salir de la página.', 'Una foto de banda de calidad, que se vea bien también en pequeño.', 'Un dato real de tracción local: entradas vendidas en una sala concreta, por ejemplo.', 'Biografía de cuatro o cinco líneas.', 'Un vídeo de directo de treinta a sesenta segundos.', 'Rider técnico y contacto, fáciles de encontrar.'],
      },
      {
        h2: 'Puntúa tu EPK',
        parrafos: ['Marca lo que ya tiene el tuyo. Lo que no marques es lo primero que arreglar.'],
        calculadora: 'epk-checklist',
      },
      {
        h2: 'Qué escribir en cada bloque',
        parrafos: ['La diferencia entre un EPK que se lee y uno que se cierra suele estar en el texto. Sustituye el relleno por hechos que se puedan comprobar.'],
        tablas: [{ titulo: 'Antes y después', cabeceras: ['Bloque', 'Mejor evitarlo', 'Mejor así'], filas: [['Estilo', '«Rock potente, original y sin etiquetas»', '«Rock de guitarras con estribillos de sala pequeña, para quien disfruta de [referencia 1] o [referencia 2]»'], ['Biografía', '«Formada en 2019 por cuatro amigos con influencias muy variadas…»', '«[Banda] son cuatro músicos de [ciudad] que tocan en directo desde [año]. Cierran el repertorio con [tema] y han actuado en [sala 1] y [sala 2].»'], ['Dato de tracción', '«Miles de seguidores»', '«Agotaron entradas en [sala] el [mes]: [número] personas»'], ['Contacto', 'Un formulario escondido al final', 'Nombre, correo y teléfono a la vista, con el horario en que contestas']] }],
        aviso: 'Si no tienes aún un dato de tracción, no lo inventes: pon dónde has tocado y una escucha buena. Un dato falso o inflado es lo primero que comprueba un programador.',
      },
      {
        h2: 'Un EPK distinto según a quién se lo envías',
        parrafos: ['El mismo dossier base sirve, pero cambia qué va primero. Piensa en quién lo abre.'],
        tablas: [{ titulo: 'Qué priorizar según el destinatario', cabeceras: ['Destinatario', 'Va primero', 'Qué añadir'], filas: [['Sala pequeña', 'Escucha y vídeo de directo', 'Fechas libres y rider ligero.'], ['Festival', 'Vídeo y dato de convocatoria', 'Formato corto del set y cambios de montaje rápidos.'], ['Prensa y blogs', 'Una noticia concreta y fotos', 'Notas de prensa, fotos descargables y la historia en tres frases.'], ['Promotor o agencia', 'Dato de tracción y calendario', 'Formato y condiciones de la gira.']] }],
      },
      {
        h2: 'Fotos, vídeo y audio: lo práctico',
        tablas: [{ titulo: 'Material y formato recomendado', cabeceras: ['Material', 'Qué conviene', 'Evita'], filas: [['Foto de banda', 'Buena luz, todos reconocibles y en horizontal, más una versión vertical.', 'Fotos oscuras, de espaldas o con filtros que oculten caras.'], ['Vídeo de directo', 'Treinta a sesenta segundos con buen sonido y la banda en plano.', 'Conciertos enteros o grabaciones con el micrófono saturado.'], ['Audio', 'Dos temas que se reproduzcan directamente en la página.', 'Reproducción automática y enlaces que obliguen a salir.'], ['Logo', 'Fondo transparente y versión clara y oscura.', 'Imágenes pequeñas estiradas.']] }],
      },
      {
        h2: 'Enlace o PDF',
        parrafos: ['Un enlace a una página siempre gana al PDF adjunto: se abre en el móvil, se actualiza sin reenviarlo y no pesa en el correo, que es lo que más fácilmente acaba en spam. El PDF solo tiene sentido como descarga opcional para quien necesite imprimirlo.'],
      },
      {
        h2: 'Errores que cuestan bolos',
        lista: ['Biografías largas con la historia entera de la banda y de cada miembro.', 'Adjuntar PDF y fotos pesadas en el primer correo.', 'Superlativos que no puedes demostrar: «potente», «único», «el mejor».', 'Enlaces a todas las redes en lugar de dos o tres bien elegidas.', 'Música que no suena a la primera, con registro o aplicación de por medio.', 'Fechas pasadas, discos antiguos y fotos de otra formación.'],
      },
      {
        h2: 'Mantenerlo vivo',
        tablas: [{ titulo: 'Un calendario de actualización', cabeceras: ['Cuándo', 'Qué actualizas'], filas: [['Tras cada concierto', 'Una foto o un clip nuevo y la lista de salas donde has tocado.'], ['Cada mes', 'El dato de tracción, si ha cambiado, y los enlaces rotos.'], ['Cada lanzamiento', 'Los temas de la escucha inmediata y la biografía.'], ['Cada cambio de formación', 'Foto, biografía y rider.']] }],
      },
      {
        h2: 'Cómo hacerlo en BandManager',
        lista: ['Elige una plantilla de diseño del dossier y rellena los bloques: perfil y bio, música y directo, media kit con PDFs y prensa.', 'Sube el rider técnico y el dossier en PDF como descarga opcional dentro del propio dossier.', 'Comparte un único enlace, con una firma de email y un código QR ya preparados.', 'Si lo envías con el enlace de seguimiento de una propuesta, BandManager registra interacciones como abrirlo, reproducir un tema o descargar el PDF.'],
      },
    ],
    faq: [
      { q: '¿Qué diferencia hay entre EPK y dossier?', a: 'En la práctica se usan como sinónimos. EPK es el término anglosajón (electronic press kit) y dossier el castellano. Lo que importa es que sea breve, escuchable y fácil de compartir con un enlace.' },
      { q: '¿Cuánto debe ocupar un EPK?', a: 'Una pantalla de móvil de scroll o una o dos páginas si es PDF. Lo detallado se deja para quien lo pida.' },
      { q: '¿Necesito un EPK si todavía toco poco?', a: 'Sí, y es cuando más ayuda. Un EPK ordenado compensa la falta de trayectoria porque demuestra que eres profesional y fácil de contratar.' },
      { q: '¿Qué pongo si aún no tengo vídeos de directo?', a: 'Graba un teaser de treinta a sesenta segundos en un ensayo con buena luz y sonido. Vale más que nada y se prepara en una tarde.' },
      { q: '¿Con qué frecuencia lo actualizo?', a: 'Tras cada concierto con una foto o un clip y cada mes con una revisión rápida de datos y enlaces.' },
    ],
    relacionadas: ['email-a-una-sala', 'como-conseguir-bolos', '/technical-rider-template'],
    cta: { titulo: 'Tu EPK, con un enlace', texto: 'En BandManager montas el dossier de tu banda y lo compartes con una URL propia, con rider técnico incluido.', boton: 'Crear mi EPK gratis' },
  },

  {
    slug: 'como-conseguir-bolos',
    titulo: 'Cómo conseguir bolos: método, calculadora y plantillas para bandas',
    h1: 'Cómo conseguir bolos con tu banda',
    descripcion: 'Un método para conseguir conciertos sin depender de la suerte: calcula a cuántas salas escribir, elige bien, haz seguimiento y mide. Con plantillas.',
    intro: 'Conseguir bolos no depende de la suerte ni de los contactos: es un embudo. Escribes a un número de salas, una parte contesta, una parte de esas acaba en fecha. Si conoces esas proporciones, sabes exactamente cuánto tienes que escribir para llegar a tus conciertos del año.',
    resumen: ['Es un embudo: salas contactadas, respuestas y fechas. Con tus porcentajes puedes calcular a cuántas salas escribir para llegar a tu objetivo.', 'Elige salas donde ya tocan bandas como la tuya, prepara un dossier en enlace y un mensaje corto, y haz seguimiento a los 7 y a los 21 días.', 'Anota cada envío y mide tus tasas: lo que no se mide, no mejora, y cada ronda te da mejores datos que la anterior.'],
    secciones: [
      {
        h2: 'Es un embudo: calcula a cuántas salas escribir',
        parrafos: ['El error más común es escribir a diez salas, no recibir respuesta y concluir que no funciona. Ninguna banda consigue un bolo por cada diez mensajes: en la práctica contesta una parte y solo algunas de esas acaban en fecha. Lo que hace la diferencia es el número de intentos bien hechos y mantener el ritmo.', 'Calcúlalo con tus datos. Si todavía no tienes cifras propias, empieza con las de ejemplo y ajústalas tras tus primeros envíos.'],
        calculadora: 'embudo-bolos',
        tablas: [{ titulo: 'Ejemplo resuelto con los valores de la calculadora', cabeceras: ['Paso', 'Cuenta', 'Resultado'], filas: [['Tasa de éxito por sala', '20 % contestan × 30 % acaban en fecha', '6 de cada 100'], ['Salas a contactar', '12 bolos ÷ 0,06', '200 salas'], ['Respuestas esperadas', '200 × 20 %', '40 respuestas'], ['Ritmo', '200 salas en 6 meses', '7,7 mensajes por semana']] }],
      },
      {
        h2: 'Qué cambia al mejorar cada paso',
        parrafos: ['El gráfico muestra cuántos bolos salen según a cuántas salas escribes y de cuántas de cada cien acaba saliendo una fecha. Los tres casos son de ejemplo, no medias reales.'],
        grafico: {
          alt: 'Gráfico de líneas con los bolos conseguidos según cuántas salas se contactan, en tres escenarios. Con 3 fechas de cada 100 salas, 120 salas dan unos 4 bolos. Con 6 de cada 100, dan unos 7. Con 12 de cada 100, dan unos 14. Mejorar la tasa pesa tanto como escribir a más salas.',
          pie: 'Cifras de ejemplo, no reales. Bolos conseguidos según las salas contactadas y cuántas de cada cien acaban en fecha.',
          ejeX: { titulo: 'Salas contactadas', etiquetas: ['0', '20', '40', '60', '80', '100', '120'] },
          ejeY: { titulo: 'Bolos conseguidos', max: 16, unidad: '' },
          series: [
            { nombre: '12 de cada 100', valores: [0, 20, 40, 60, 80, 100, 120].map((n) => Math.round(n * 0.12 * 10) / 10), tipo: 'principal' },
            { nombre: '6 de cada 100', valores: [0, 20, 40, 60, 80, 100, 120].map((n) => Math.round(n * 0.06 * 10) / 10), tipo: 'secundaria' },
            { nombre: '3 de cada 100', valores: [0, 20, 40, 60, 80, 100, 120].map((n) => Math.round(n * 0.03 * 10) / 10), tipo: 'neutra' },
          ],
        },
        aviso: 'Duplicar tu tasa de éxito vale lo mismo que duplicar el número de salas, y cuesta menos tiempo. Mejorar el mensaje, el dossier y el seguimiento mueve esa tasa.',
      },
      {
        h2: 'Paso 1: elige salas que encajan',
        parrafos: ['Una sala donde ya tocan bandas como la tuya es una sala con público para ti. Mira su programación de los últimos meses antes de escribir: estilo, aforo, si abren a bandas locales o solo a giras, y qué días programan música.'],
        tablas: [{ titulo: 'Qué mirar antes de escribir a una sala', cabeceras: ['Señal', 'Dónde mirarla', 'Qué significa'], filas: [['Estilos programados', 'Su agenda y sus redes', 'Si no hay nada parecido a lo tuyo, descártala.'], ['Aforo', 'Su web o una llamada', 'Tu convocatoria tiene que ser razonable para su tamaño.'], ['Bandas locales', 'Carteles de los últimos meses', 'Si solo programan giras, tienes menos opciones.'], ['Días de música', 'Agenda de la semana', 'Te dice qué fechas puedes proponer.'], ['Quién programa', 'Web, redes o la propia sala', 'Escribir a una persona vale más que a un correo genérico.']] }],
      },
      {
        h2: 'Una hoja de salas para copiar',
        parrafos: ['Lleva un registro de cada contacto: sin él no sabes a quién has escrito ni cuándo toca el siguiente mensaje.'],
        tablas: [{ titulo: 'Registro de salas', cabeceras: ['Sala', 'Ciudad', 'Aforo', 'Contacto', 'Último mensaje', 'Estado', 'Próximo paso'], filas: [['[nombre]', '[ciudad]', '[aprox.]', '[persona o correo]', '[fecha]', 'Nuevo, contactado, respondió, negociando o confirmado', '[acción y fecha]']] }],
      },
      {
        h2: 'Paso 2: prepara lo mínimo antes de escribir',
        lista: ['Un dossier en enlace, con una escucha inmediata y una foto de calidad.', 'Un vídeo de directo corto, de treinta a sesenta segundos.', 'Un rider técnico claro, para que pregunten menos.', 'Dos o tres fechas posibles, para no preguntar a ciegas.', 'Un dato real de tracción local: entradas vendidas en una sala concreta, por ejemplo.'],
      },
      {
        h2: 'Paso 3: un primer mensaje corto y humano',
        parrafos: ['Menos de ciento veinte palabras, dos párrafos. Reconoce algo concreto de la sala, di qué aportas y enlaza el dossier. Una sala nota enseguida cuándo es una plantilla pegada a cien destinatarios.'],
        tablas: [{ titulo: 'Partes de un buen primer correo', cabeceras: ['Parte', 'Qué dice', 'Ejemplo'], filas: [['Asunto', 'Banda, estilo y ciudad', '«[Banda] (rock, [ciudad]): propuesta para [sala]»'], ['Apertura', 'Algo específico de la sala', '«Os seguimos desde hace tiempo y nos gustó mucho el ciclo de [mes].»'], ['Propuesta', 'Qué eres y qué propones', '«Somos [banda], [estilo en pocas palabras], y nos gustaría tocar en vuestro espacio.»'], ['Fechas', 'Dos opciones concretas', '«Nos cuadrarían el [fecha 1] o el [fecha 2].»'], ['Cierre', 'Una pregunta fácil de contestar', '«¿Os parece bien que lo veamos? El dossier está en mi firma.»']] }],
        aviso: 'Un único enlace al dossier, mejor en la firma que en el cuerpo, y sin adjuntos pesados: son lo que dispara los filtros de spam.',
      },
      {
        h2: 'Paso 4: seguimiento sin agobiar',
        parrafos: ['La mayor parte de las respuestas llega tras un segundo mensaje. Marca las fechas en tu registro para no depender de la memoria.'],
        tablas: [{ titulo: 'Un calendario de seguimiento', cabeceras: ['Cuándo', 'Qué haces', 'Qué dices'], filas: [['Día 0', 'Primer mensaje', 'El correo corto con el dossier en la firma.'], ['Día 7', 'Recordatorio de una línea', '«Retomo este correo por si se os pasó. Tenemos libre el [fecha].»'], ['Día 21', 'Segundo y último recordatorio', 'Algo nuevo: una fecha, un directo reciente o una mención en prensa.'], ['Tras 90 días', 'Pausa y vuelta a empezar', 'Escribe de nuevo con una novedad real, en la siguiente temporada.']] }],
      },
      {
        h2: 'Paso 5: de un sí a una fecha',
        pasos: ['Responde en el mismo día, con las fechas que propones y tu disponibilidad real.', 'Pregunta cómo trabajan: aforo, fórmula de pago, equipo de sonido y hora de montaje.', 'Habla de dinero tras el primer sí, con tu mínimo claro.', 'Manda el rider y la hoja de ruta, separando lo técnico de la hospitalidad.', 'Confirma por escrito fecha, hora, importe y forma de pago, y anota la fecha en tu calendario.'],
      },
      {
        h2: 'Errores que hunden la tasa de respuesta',
        lista: ['Escribir un mensaje largo con toda la historia de la banda.', 'Adjuntar archivos pesados en el primer correo.', 'Pedir caché antes de que sepan quién eres.', 'Mandar el mismo texto a cien salas sin cambiar el nombre bien.', 'No hacer seguimiento: casi todos los síes llegan tras un recordatorio.', 'Dejar de escribir tras tres intentos en lugar de mantener un ritmo semanal.'],
      },
      {
        h2: 'Cómo hacerlo en BandManager',
        lista: ['Guarda cada sala en el CRM con su estado: nuevo, contactado, respondió, negociando o confirmado.', 'Deja que el redactor prepare un borrador corto con el enlace a tu dossier y apruébalo tú antes de que salga.', 'El lector registra las respuestas y actualiza el estado de cada sala.', 'Mira tus propias tasas y ajusta el mensaje y el ritmo con datos reales.'],
      },
    ],
    faq: [
      { q: '¿A cuántas salas debo escribir?', a: 'Depende de tus tasas. Con 20 % de respuesta y 30 % de fecha tras responder, para 12 bolos tendrías que contactar unas 200. La calculadora de arriba lo hace con tus números.' },
      { q: '¿Mejor por email o por Instagram?', a: 'Por email para la propuesta, porque es lo que la sala usa para programar. Instagram sirve para romper el hielo, no para cerrar fechas.' },
      { q: '¿Cuándo hago el seguimiento?', a: 'A los siete días con una línea y a los veintiuno con algo nuevo. Si no hay respuesta, pausa y vuelve en la siguiente temporada.' },
      { q: '¿Qué hago si no tengo directos grabados?', a: 'Graba un teaser de treinta a sesenta segundos en un ensayo con buena luz y sonido. Vale más que nada y se prepara en una tarde.' },
      { q: '¿Cuánto tarda en notarse?', a: 'Una ronda de contactos suele dar respuestas en dos o tres semanas. Mantén el ritmo durante meses: los resultados se acumulan.' },
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
    resumen: ['Mensaje corto: conoce la sala, di qué aportas y propón dos fechas.', 'Enlace al dossier en la firma, sin adjuntos pesados que acaben en spam.', 'Si no responden, una línea de seguimiento a la semana y a por la siguiente sala.'],
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
    resumen: ['Lee las bases enteras: cumplir exactamente lo que piden es el primer filtro.', 'Prepara dossier en enlace, un vídeo corto de directo y un rider ágil.', 'Cita un dato real de tracción y explica por qué encajas en ese festival.'],
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
    relacionadas: ['como-hacer-un-epk', '/technical-rider-template', 'cuanto-cobrar-por-un-concierto'],
    cta: { titulo: 'Candidaturas sin perder el hilo', texto: 'Lleva en BandManager tus fechas, tus propuestas y tu dossier para no dejar escapar ninguna convocatoria.', boton: 'Probar BandManager gratis' },
  },
  {
    slug: 'cuanto-cobrar-por-un-concierto',
    titulo: 'Cuánto cobrar por un concierto: caché, taquilla y calculadora',
    h1: 'Cuánto cobrar por un concierto',
    descripcion: 'Calcula tu caché mínimo y elige entre caché fijo, taquilla o mixto con un ejemplo en cifras. Incluye cómo negociar y una propuesta para copiar.',
    intro: 'No existe una tarifa universal para una banda, y por eso cuesta tanto ponerle precio a un concierto. Lo que sí existe es un método: saber cuánto te cuesta tocar, comparar los tres modelos de pago con números y llegar a la conversación con la sala sabiendo cuál es tu suelo.',
    resumen: ['Tu mínimo sale de sumar los gastos reales y el valor de tu tiempo (ensayo, montaje, viaje y concierto), no de lo que «suele cobrarse».', 'Caché fijo, taquilla y mixto no son mejores ni peores: cambia quién asume el riesgo. Con tus cifras puedes ver dónde se cruzan.', 'Habla de dinero después del primer sí, con tu mínimo claro, una propuesta por escrito y las condiciones de pago acordadas.'],
    secciones: [
      {
        h2: 'Los tres modelos de pago',
        parrafos: ['Casi todos los acuerdos son una de estas tres fórmulas o una mezcla. Lo que cambia entre ellas no es cuánto ganas de media, sino quién asume el riesgo de que venga poca gente.'],
        tablas: [{ titulo: 'Caché fijo, taquilla y mixto', cabeceras: ['Modelo', 'Cómo funciona', 'Riesgo para ti', 'Cuándo conviene'], filas: [['Caché fijo', 'La sala paga una cantidad pactada, venga quien venga.', 'Bajo. Lo asume la sala.', 'Si empiezas, no conoces tu convocatoria o la sala no cobra entrada.'], ['Taquilla', 'Cobras un porcentaje de las entradas, o lo que quede tras gastos.', 'Alto. Si viene poca gente, cobras poco.', 'Si traes público fiel y la sala cobra entrada.'], ['Mixto', 'Un mínimo garantizado más un extra a partir de cierta asistencia.', 'Medio. Tienes suelo y techo abierto.', 'Cuando quieres proteger el suelo sin renunciar a ganar más.']] }],
      },
      {
        h2: 'Calcula tu mínimo',
        parrafos: ['El suelo es la cifra por debajo de la cual el concierto te cuesta dinero. Se calcula en tres pasos: suma los gastos reales (transporte, alquiler de backline, comida y sonido si lo pones tú), suma las horas que te lleva entre ensayo, montaje, viaje y concierto, y dale un valor a esa hora. Pruébalo con tus datos:'],
        calculadora: 'cache-minimo',
        tablas: [{ titulo: 'Ejemplo resuelto con los valores de la calculadora', cabeceras: ['Concepto', 'Cuenta', 'Importe'], filas: [['Gastos del concierto', 'Transporte, comida y alquiler', '120 €'], ['Valor del tiempo', '4 personas × 10 horas × 10 €', '400 €'], ['Tu mínimo', '120 + 400', '520 €'], ['Por persona', '520 ÷ 4', '130 €']] }],
      },
      {
        h2: 'Qué modelo te sale mejor: un ejemplo con cifras',
        parrafos: ['Comparemos los tres modelos con el mínimo anterior, 520 €. Usamos cifras inventadas para ilustrar el razonamiento, no datos de ninguna sala: un caché fijo de 450 €, una taquilla en la que la banda se lleva 5,60 € por asistente (entradas de 8 € y el 70 % tras gastos) y un mixto de 200 € garantizados más 4 € por asistente a partir de los 40.'],
        grafico: {
          alt: 'Gráfico de líneas con lo que cobra la banda según cuánta gente asiste, en tres modelos. El caché fijo es una línea plana de 450 euros. La taquilla empieza en cero y sube de forma constante. El mixto parte de 200 euros y sube a partir de 40 asistentes. Una línea discontinua marca el mínimo de 520 euros: la taquilla lo supera hacia las 93 personas y el mixto lo alcanza con 120.',
          pie: 'Cifras de ejemplo, no reales. Lo que cobra la banda según la asistencia en cada modelo, frente a un mínimo de 520 €.',
          ejeX: { titulo: 'Personas que asisten', etiquetas: ['0', '20', '40', '60', '80', '100', '120'] },
          ejeY: { titulo: 'Lo que cobra la banda', max: 720, unidad: '€' },
          series: [
            { nombre: 'Taquilla', valores: [0, 112, 224, 336, 448, 560, 672], tipo: 'principal' },
            { nombre: 'Mixto', valores: [200, 200, 200, 280, 360, 440, 520], tipo: 'secundaria' },
            { nombre: 'Caché fijo', valores: [450, 450, 450, 450, 450, 450, 450], tipo: 'neutra' },
            { nombre: 'Tu mínimo', valores: [520, 520, 520, 520, 520, 520, 520], tipo: 'referencia' },
          ],
          nota: { serie: 0, indice: 5, texto: 'Ya cubres tu mínimo' },
        },
        lista: ['Con poca gente gana el caché fijo, pero con 450 € ya estás por debajo de tu mínimo: tocarías perdiendo dinero.', 'La taquilla solo supera tu mínimo a partir de unas 93 personas. Si no estás seguro de traerlas, es una apuesta.', 'El mixto te asegura 200 € y no alcanza tu mínimo hasta las 120 personas: bueno si la sala llena, flojo si no.'],
        aviso: 'La conclusión no es que un modelo sea mejor, sino que con tus cifras puedes ver en qué punto te compensa cada uno antes de contestar a la sala.',
      },
      {
        h2: 'Qué sube o baja lo que puedes pedir',
        lista: ['Convocatoria demostrable: entradas vendidas en otras salas, un dato real y no una impresión.', 'El día y la franja: un viernes por la noche no es un martes a las ocho.', 'Aforo y precio de la entrada: la sala solo puede pagar lo que le cuadra con su taquilla.', 'Formato: un dúo acústico cuesta menos de mover que una banda completa con backline.', 'Qué incluye la sala: sonido, backline, alojamiento y comida cuentan como dinero.', 'Distancia y gastos: una fecha a doscientos kilómetros cambia tu mínimo.'],
      },
      {
        h2: 'Cómo hablar de dinero con una sala',
        parrafos: ['Mejor después del primer sí que en el primer correo: antes de eso aún no saben quién eres. Cuando la sala ya muestra interés, pregunta cómo trabajan antes de dar una cifra.'],
        pasos: ['Pregunta qué aforo tienen y qué fórmula suelen ofrecer a bandas como la tuya.', 'Si te dan una cifra, compárala con tu mínimo antes de contestar. No hace falta decir que sí en el momento.', 'Propón tu fórmula con una frase corta: «Para este formato nos cuadraría un caché de X o un mínimo de Y más un porcentaje a partir de Z personas.»', 'Si no llegáis a un acuerdo, pide a cambio algo medible: una fecha mejor, difusión real, backline o alojamiento.', 'Deja lo acordado por escrito, con fecha, hora, importe y forma de pago.'],
      },
      {
        h2: 'Una propuesta económica para copiar',
        parrafos: ['Una tabla con estos conceptos evita malentendidos y se pega tal cual en un correo o en el contrato.'],
        tablas: [{ titulo: 'Propuesta económica', cabeceras: ['Concepto', 'Importe o condición', 'Quién lo asume'], filas: [['Caché por la actuación', '[importe] € más impuestos si corresponde', 'Sala u organizador'], ['Sonido y backline', 'Incluido o [importe] €', 'Sala'], ['Transporte', 'Incluido o [importe] €', 'Banda o sala'], ['Alojamiento y comida', 'Incluido o [importe] €', 'Sala'], ['Derechos de autor', '[quién los gestiona]', 'Sala u organizador'], ['Forma y fecha de pago', 'Transferencia, efectivo o a plazo, en la fecha [fecha]', 'Sala u organizador']] }],
      },
      {
        h2: 'Errores que cuestan dinero',
        lista: ['Aceptar sin comparar con tu mínimo y descubrir después que tocaste perdiendo.', 'Pactar a taquilla sin saber cuánta gente vas a traer.', 'No dejar por escrito el importe y la fecha de pago.', 'Olvidar los gastos pequeños, que sumados pesan: aparcamiento, cables, comida.', 'Cobrar menos «porque es una sala amiga» sin que haya una contrapartida clara.'],
      },
      {
        h2: 'Lo que no hemos incluido: impuestos y derechos',
        parrafos: ['Las cifras de esta guía no tienen en cuenta impuestos, cuotas ni derechos de autor, que dependen de tu país, de cómo factures y de la sala. Consulta con un gestor cómo declarar lo que cobras; aquí solo ofrecemos orientación general.'],
      },
    ],
    faq: [
      { q: '¿Es normal tocar gratis?', a: 'Pasa al principio, pero debería haber algo medible a cambio: una buena fecha, difusión real o contactos. Tocar gratis solo por tocar no construye trayectoria.' },
      { q: '¿Cuánto cobra una banda pequeña?', a: 'Depende de la ciudad, la sala y la gente que traigas, así que no hay una cifra fiable. Calcula tu mínimo y negocia a partir de ahí.' },
      { q: '¿Caché fijo o taquilla?', a: 'Si no conoces tu convocatoria, caché fijo o mixto con mínimo. Si traes público fiel y la sala cobra entrada, la taquilla puede dejarte más.' },
      { q: '¿Quién paga los derechos de autor?', a: 'Suele hacerlo la sala o el organizador. Aclara quién lo gestiona antes de cerrar la fecha.' },
      { q: '¿Cuándo hablo de dinero?', a: 'Tras el primer sí. Antes de eso pregunta cómo trabajan y qué aforo tienen; después propón tu fórmula.' },
    ],
    relacionadas: ['repartir-dinero-en-una-banda', 'contrato-actuacion-musical', 'como-conseguir-bolos'],
    cta: { titulo: 'Sabe cuánto ganas de verdad', texto: 'BandManager lleva tus conciertos, cachés y gastos para que veas qué bolos te compensan.', boton: 'Probar BandManager gratis' },
  },
];
