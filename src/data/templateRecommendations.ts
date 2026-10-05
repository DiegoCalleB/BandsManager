import type { TemplateCategory } from '../components/booking/TemplateConfigSection';

export interface CategoryRecommendation {
  badge: string;
  tagline: string;
  dos: string[];
  donts: string[];
  bestOpening: string;
  keyHooks: string[];
  ctaSuggestion: string;
  aiSecretTip: string;
  quickImprovePrompt: string;
}

export const CATEGORY_RECOMMENDATIONS: Record<TemplateCategory, CategoryRecommendation> = {
  salas: {
    badge: 'Programación Cultural & Teatros',
    tagline: 'Prioriza el respeto por la acústica del espacio, la cercanía con el programador y una rotación ágil.',
    dos: [
      'Empieza reconociendo el mimo de su programación y su aportación cultural en la ciudad.',
      'Menciona el aforo idóneo y el tipo de directo (bailable, acústico o enérgico).',
      'Incluye un único enlace claro a vídeos en vivo y dossier (máx. 1 click).',
      'Propón ventanas de meses concretos o consulta su agenda con amabilidad.',
    ],
    donts: [
      'Prohibido hablar de "llenar barras o dinamizar copas" en salas culturales o teatros.',
      'No metas muletillas técnicas pesadas en el primer correo ("montamos en 20 min y recogemos en 5").',
      'No adjuntes archivos pesados en PDF que puedan saturar el buzón o caer en spam.',
    ],
    bestOpening:
      '«Hola [Nombre/Equipo], seguimos con mucha atención el mimo y la identidad que dais a vuestra programación en [Ciudad]...»',
    keyHooks: ['Enlace directo a directo multicámara', 'Flexibilidad de formatos (taquilla/co-booking)', 'Show adaptado al espacio'],
    ctaSuggestion: '«¿Cómo tenéis el calendario para el próximo trimestre? Nos encantaría valorar si encajamos.»',
    aiSecretTip: 'El Redactor IA detectará automáticamente si la sala es teatro o club para modular el nivel de energía del directo.',
    quickImprovePrompt:
      'Haz el texto más cercano y humano (<130 palabras), añade un halago sincero a su labor cultural y un CTA suave para revisar su calendario.',
  },
  festivales: {
    badge: 'Directores Artísticos & Bookers',
    tagline: 'Concisión absoluta, datos de impacto (escenario, rotación técnica) y enlaces a directos multitudinarios.',
    dos: [
      'Sé ultra directo (<100 palabras): los programadores de festivales leen cientos de propuestas al día.',
      'Destaca la energía del show ante grandes audiencias y la rapidez del cambio de set técnico.',
      'Aporta métricas o enlace directo a vídeo de directo en escenario grande.',
      'Ofrece disponibilidad para enviar rider técnico completo y propuesta de caché cerrada.',
    ],
    donts: [
      'No cuentes la biografía completa de la banda ni anécdotas largas.',
      'No utilices frases corporativas trilladas como "somos la banda revelación".',
      'No envíes correos genéricos sin saber el cartel o las líneas estilísticas del festival.',
    ],
    bestOpening: '«Hola equipo de [Nombre Festival], os presentamos nuestra propuesta de directo enérgico para la próxima edición...»',
    keyHooks: [
      'Cambio de set técnico ultrarrápido',
      'Show de alta intensidad para escenario principal',
      'Material promocional listo para cartelería',
    ],
    ctaSuggestion: '«Quedamos a vuestra disposición para remitiros dossier completo, rider técnico y propuesta económica.»',
    aiSecretTip:
      'La IA resalta la versatilidad de rotación técnica y la capacidad de mantener al público activo entre grandes cabezas de cartel.',
    quickImprovePrompt:
      'Optimiza para festival: síntesis extrema, enfoque en impacto en escenario grande, rapidez en cambio de backline y propuesta formal.',
  },
  discotecas: {
    badge: 'Clubbing & Sesiones Nocturnas',
    tagline: 'Enfocado a directos electrónicos, híbridos y show bailable para complementar sesiones de DJ.',
    dos: [
      'Destaca el formato Live Set híbrido con elementos acústicos en vivo (violín, sintes, percusión).',
      'Resalta que la energía mantiene la pista encendida en horario de madrugada o tras el warm-up.',
      'Acompaña siempre de un teaser/vídeo corto de ambiente nocturno y gente bailando.',
    ],
    donts: [
      'No uses tono formal o burocrático; adapta el lenguaje al entorno clubbing.',
      'No propongas formatos lentos, sentados o de escucha atenta.',
      'No olvides especificar los requisitos básicos de cabina y monitores.',
    ],
    bestOpening:
      '«Hola equipo de [Nombre Club], os escribimos para presentar un Live Set de alta intensidad para vuestras sesiones de clubbing...»',
    keyHooks: ['Show bailable ininterrumpido', 'Fusión electrónica + instrumentos en vivo', 'Complemento idóneo entre sets de DJs'],
    ctaSuggestion: '«¿Tenéis fechas libres en vuestra programación nocturna para incorporar un show en directo?»',
    aiSecretTip: 'El motor IA enfatiza la conexión con el público de madrugada y la facilidad para integrarse en cabina.',
    quickImprovePrompt:
      'Adapta a discoteca/club: tono nocturno y enérgico, destaca formato Live Set híbrido bailable e integración en cabina DJ.',
  },
  medios: {
    badge: 'Prensa, Radios & Crítica Musical',
    tagline: 'Facilita el trabajo del periodista o locutor: enlaces directos a audio WAV/MP3, nota de prensa y fotos en alta resolución.',
    dos: [
      'Dirígete al locutor, redactor o responsable de la sección musical por su nombre.',
      'Ofrece disponibilidad para entrevistas telefónicas, presenciales o acústicos en estudio.',
      'Incluye enlace directo a carpeta de prensa con temas en alta calidad (WAV/MP3) y bio resumida.',
    ],
    donts: [
      'No mandes archivos de audio pesados adjuntos.',
      'No redactes notas de prensa interminables; destaca el gancho de novedad (nuevo single, gira, hito).',
      'No olvides agradecer su labor de difusión de la música independiente.',
    ],
    bestOpening: '«Hola [Nombre/Equipo], os hacemos llegar la nota de prensa y el adelanto de nuestra nueva gira...»',
    keyHooks: [
      'Audio disponible en WAV broadcast',
      'Disponibilidad para entrevistas y acústicos en directo',
      'Nota de prensa maquetada y fotos HQ',
    ],
    ctaSuggestion: '«Quedamos a vuestra disposición para coordinar entrevista o enviaros copias físicas/digitales si lo deseáis.»',
    aiSecretTip: 'La IA estructurará la nota con gancho periodístico, fecha de lanzamiento y citas de impacto listas para publicar.',
    quickImprovePrompt:
      'Convierte en un pitch periodístico impecable: gancho de novedad, disponibilidad para acústico/entrevista y enlace a descarga en WAV.',
  },
  grupos: {
    badge: 'Co-Booking & Músico a Músico',
    tagline: 'Tono cercano, de colega a colega, proponiendo un intercambio justo (Date Swap) para sumar públicos y compartir gastos.',
    dos: [
      'Tono directo de músico a músico: habla como en el local de ensayo o en el camerino.',
      'Propón una fecha en tu ciudad acogiendo a la otra banda y pide la vuelta en su ciudad.',
      'Plantea compartir backline (batería, pantallas) para abaratar logística y furgoneta.',
    ],
    donts: [
      'Prohibido el tono corporativo o de agencia comercial; sonaría distante y frío.',
      'No dejes la propuesta en el aire: plantea ciudades concretas y meses tentativos.',
      'No pretendas que la otra banda asuma todo el riesgo de taquilla.',
    ],
    bestOpening: '«¡Buenas gente de [Nombre Banda]! Os seguimos el proyecto y nos mola mucho lo que hacéis...»',
    keyHooks: [
      'Intercambio de fechas (Date Swap) ida y vuelta',
      'Compartir backline y gastos de sala',
      'Sinergia de públicos en ambas ciudades',
    ],
    ctaSuggestion: '«¿Cómo lo veis? ¿Os cuadra que charlemos por WhatsApp o llamada esta semana para ver opciones?»',
    aiSecretTip: 'El Redactor IA redacta con cercanía total, usando fórmulas coloquiales de respeto mutuo entre músicos.',
    quickImprovePrompt:
      'Reescribe de músico a músico: tono ultra cercano, propuesta concreta de intercambio de fechas (date swap) y compartir backline.',
  },
  managements: {
    badge: 'Agencias & Bookers Profesionales',
    tagline: 'Demuestra solidez de proyecto, tracción en redes/ventas, logística solvente y visión de negocio compartida.',
    dos: [
      'Enfócate en la viabilidad económica, solvencia técnica y potencial de crecimiento del proyecto.',
      'Presenta datos de venta de entradas, reproducciones o festivales recorridos.',
      'Plantea sinergias para coproducción, representación o incorporación a su roster de gira.',
    ],
    donts: [
      'No envíes propuestas sin haber investigado qué bandas llevan en su catálogo.',
      'Evita exageraciones no contrastadas sobre cifras o seguidores.',
      'No omitas los datos de contacto del responsable de booking de la banda.',
    ],
    bestOpening:
      '«Hola equipo de [Nombre Agencia], os escribo en representación de [Nombre Banda] para presentar nuestra propuesta de directo...»',
    keyHooks: [
      'Tracción contrastada en directo y venta de entradas',
      'Logística de producción eficiente y autónoma',
      'Propuesta de sinergias para roster de gira',
    ],
    ctaSuggestion: '«Estaré encantado de coordinar una breve llamada para explorar posibles sinergias o coproducciones.»',
    aiSecretTip: 'La IA enfatiza la eficiencia de producción y el retorno comercial para agentes y promotores.',
    quickImprovePrompt:
      'Enfoca para agencia de management: profesionalidad, solvencia técnica, tracción de público y propuesta de llamada ejecutiva.',
  },
  ayuntamientos: {
    badge: 'Concejalías de Festejos & Cultura',
    tagline:
      'Formalidad institucional, facturación en regla (seguridad social, altas), solvencia técnica y espectáculo para todos los públicos.',
    dos: [
      'Tratamiento formal («Estimados responsables», «ustedes»).',
      'Destaca la idoneidad para fiestas patronales, plazas públicas y eventos para todos los públicos.',
      'Menciona explícitamente la capacidad de facturación oficial, altas en SS y cumplimiento de normativa.',
    ],
    donts: [
      'No utilices lenguaje coloquial o tuteo.',
      'No olvides especificar que el espectáculo cuenta con seguro y cumplimiento técnico.',
      'No dejes de indicar que se enviará propuesta presupuestaria formal.',
    ],
    bestOpening: '«Estimados responsables del Área de Cultura y Festejos de [Ayuntamiento/Localidad], nos dirigimos a ustedes...»',
    keyHooks: [
      'Facturación oficial y altas en Seguridad Social',
      'Espectáculo familiar y participativo de alta energía',
      'Rider técnico completo para plazas y auditorios',
    ],
    ctaSuggestion: '«Quedamos a su disposición para remitirles la propuesta presupuestaria formal y el dossier de producción.»',
    aiSecretTip: 'La IA adaptará el redactado a la terminología administrativa formal requerida en licitaciones y contratos públicos.',
    quickImprovePrompt:
      'Redacta con protocolo institucional: tratamiento formal (ustedes), solvencia de facturación oficial, idoneidad para fiestas patronales y propuesta presupuestaria.',
  },
};
