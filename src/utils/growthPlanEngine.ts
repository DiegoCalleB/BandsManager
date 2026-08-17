import { SocialMetric, EPKConfig } from '../types';
import { detectBandProfileArchetype, BandProfileArchetype } from './bandGrowthTiers';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  impact: 'alto' | 'medio' | 'critico';
  difficulty: 'fácil' | 'medio' | 'avanzado';
  frequency: 'diario' | 'semanal' | 'mensual' | 'puntual';
  kpiTarget: string;
  completed?: boolean;
}

export interface ChannelRecommendation {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'spotify';
  name: string;
  currentMetricsSummary: string;
  growthStage: string;
  primaryObjective: string;
  coreStrategy: string;
  hookFormulas: string[];
  recommendedSchedule: string;
  actionItems: ActionItem[];
  donts: string[];
  viralConcepts: {
    title: string;
    concept: string;
    hook: string;
    callToAction: string;
  }[];
}

export interface GrowthPlan {
  bandName: string;
  generatedAt: string;
  horizonDays: 30 | 60 | 90;
  archetype?: BandProfileArchetype;
  executiveSummary: string;
  overallPillars: {
    pillar: string;
    description: string;
    weightPercentage: number;
  }[];
  weeklyBlueprint: {
    day: string;
    focus: string;
    recommendedPlatform: 'instagram' | 'tiktok' | 'youtube' | 'spotify' | 'todas';
    contentAction: string;
    optimalPostingTime: string;
  }[];
  channels: ChannelRecommendation[];
}

export function getDeterministicGrowthPlan(
  bandName: string,
  latestMetric: SocialMetric | null,
  epkConfig?: EPKConfig | null,
  horizonDays: 30 | 60 | 90 = 30
): GrowthPlan {
  const igCount = latestMetric?.instagram_followers || latestMetric?.instagram || 0;
  const tkCount = latestMetric?.tiktok_followers || latestMetric?.tiktok || 0;
  const ytSubs = latestMetric?.youtube_subscribers || latestMetric?.youtube || 0;
  const ytViews = latestMetric?.youtube_total_views || 0;
  const spCount = latestMetric?.spotify_monthly_listeners || latestMetric?.spotify || 0;
  const hasSpotifyProfile = Boolean(epkConfig?.enlaces_redes?.spotify || spCount > 0);

  const archetype = detectBandProfileArchetype(latestMetric);
  const tier = archetype.tier;
  const genre = epkConfig?.genero || 'Rock / Indie / Balkan-Ska';

  // 1. Instagram Strategy based on Band Tier & Metrics
  let igStage = 'Iniciación / Tracción 0-500';
  let igObjective = '';
  let igStrategy = '';
  let igHooks: string[] = [];
  let igSchedule = '';
  let igActions: ActionItem[] = [];
  let igDonts: string[] = [];
  let igViralConcepts: any[] = [];

  if (tier === 'garage_debut') {
    igStage = 'Fase Debut (0 - 500)';
    igObjective = `Construir el núcleo duro de los primeros 500 seguidores reales de ${bandName} y llenar los primeros conciertos locales`;
    igStrategy = 'Prioriza Reels cortos de 10-18 segundos con audio nítido de los mejores 15 segundos del ensayo o del bolo. En esta fase, los usuarios no te conocen: el gancho debe ser el sonido o la anécdota, no un logotipo.';
    igHooks = [
      `«Si te mola el ${genre}, escucha el riff que grabamos ayer en el local de ensayo...»`,
      '«Le dije a la banda que este tema no iba a funcionar y pasó esto en el primer concierto...»',
      '«El momento exacto en el que el público se unió al coro por primera vez...»',
      '«Lo que nadie te cuenta de ensayar 5 horas un domingo para un bolo de 40 minutos.»'
    ];
    igSchedule = '3 Reels semanales (19:30 - 21:00h) + Stories de ensayo con sticker de pregunta y encuesta';
    igActions = [
      {
        id: 'ig-debut-1',
        title: 'Optimización de Bio con Enlace a Escuchas y Próximo Bolo',
        description: `Escribe una bio directa: "🎸 ${bandName} (${genre}) · 📍 Próxima fecha: [Sala/Ciudad] · Escucha nuestro tema 👇" y enlaza a tu Smartlink/EPK.`,
        impact: 'critico',
        difficulty: 'fácil',
        frequency: 'puntual',
        kpiTarget: 'Lograr > 50 clics mensuales en el enlace de la bio'
      },
      {
        id: 'ig-debut-2',
        title: 'Reels de fragmentos de ensayo con audio nativo limpio',
        description: 'Graba en vertical con buena luz en el local. Corta directamente al inicio del estribillo sin introducciones lentas.',
        impact: 'critico',
        difficulty: 'medio',
        frequency: 'semanal',
        kpiTarget: 'Superar las 1.000 visualizaciones orgánicas por Reel'
      },
      {
        id: 'ig-debut-3',
        title: 'Etiquetar la sala del concierto en Stories y Reels colaborativos',
        description: 'Siempre que toques en directo, pide un post en colaboración o etiqueta la sala para que compartan en su cuenta y absorbas su público local.',
        impact: 'alto',
        difficulty: 'fácil',
        frequency: 'semanal',
        kpiTarget: 'Captar +30 seguidores locales tras cada concierto'
      }
    ];
    igDonts = [
      'No subas una foto estática del cartel de concierto como único post de feed (Instagram apenas le da alcance a imágenes con mucho texto). Haz un Reel tocando el tema principal con las fechas en texto animado.',
      'No uses más de 5 hashtags y evita etiquetas genéricas como #music o #love; usa etiquetas de tu escena (#IndieMadrid #RockDirecto).'
    ];
    igViralConcepts = [
      {
        title: 'De Nota de Voz de WhatsApp a Tema de Banda',
        concept: 'Compara la nota de voz cutre grabada en el móvil a las 2 AM con el tema terminado sonando a toda potencia con la banda junta.',
        hook: '«Así empezó esta canción en una nota de voz a las 3 AM vs cómo suena con toda la banda...»',
        callToAction: 'Comenta si te mola el cambio o prefieres la maqueta acústica.'
      }
    ];
  } else if (tier === 'local_traction') {
    igStage = 'Tracción Local (500 - 2.5K)';
    igObjective = `Convertir el alcance de visualizaciones en seguidores leales, oyentes de Spotify y venta de entradas en tu ciudad`;
    igStrategy = 'Activa el algoritmo mediante Reels con alta tasa de "Guardados" y "Compartidos por DM". Humaniza a cada músico de la banda para que el público se encariñe con las personalidades del grupo.';
    igHooks = [
      '«POV: Eres el guitarrista y te toca improvisar porque se ha roto una cuerda en pleno solo...»',
      `«Canciones que no deberían sonar tan enérgicas en directo pero en nuestra sala pasó esto...»`,
      `«Si te gusta [Banda de Referencia], te garantizo que este tema de ${bandName} va directo a tu playlist.»`,
      '«La cara de nuestro batería cuando le dijimos que tocamos en el festival este mes.»'
    ];
    igSchedule = '4 Reels semanales (20:00 - 21:30h) + Canal de Difusión VIP semanal';
    igActions = [
      {
        id: 'ig-trac-1',
        title: 'Abrir Canal de Difusión («Backstage & Inéditos»)',
        description: 'Crea un Broadcast Channel en Instagram donde mandar audios exclusivos de ensayos, tomas falsas y preventa privada de entradas.',
        impact: 'alto',
        difficulty: 'fácil',
        frequency: 'puntual',
        kpiTarget: 'Unir al 20% de tus seguidores más activos'
      },
      {
        id: 'ig-trac-2',
        title: 'Reels con sticker interactivo de cuenta atrás para conciertos',
        description: 'Añade el sticker de cuenta atrás del concierto en las Stories y ancla el Reel del tema estrella en tu perfil.',
        impact: 'critico',
        difficulty: 'medio',
        frequency: 'semanal',
        kpiTarget: 'Tasa de retención > 60% en los primeros 5 segundos'
      },
      {
        id: 'ig-trac-3',
        title: 'Publicar dinámicas de preguntas con respuestas en vídeo',
        description: 'Responde a los comentarios de "¿cómo afináis?" o "¿de qué habla la letra?" con un Reel corto mostrando los instrumentos.',
        impact: 'medio',
        difficulty: 'fácil',
        frequency: 'semanal',
        kpiTarget: 'Aumentar comentarios en un +50%'
      }
    ];
    igDonts = [
      'No dejes comentarios sin responder en las primeras 2 horas tras publicar un Reel.',
      'No publiques Reels con mala ecualización donde la voz quede tapada por el volumen del bajo.'
    ];
    igViralConcepts = [
      {
        title: 'La Prueba de Fuego del Público',
        concept: 'Pide al público en directo que cante a capela una frase y grábalo desde el escenario con la cámara hacia ellos.',
        hook: '«El momento exacto en el que dejamos de cantar nosotros y la sala entera gritó esto...»',
        callToAction: 'Si estuviste en la sala, encuéntrate en el vídeo y comenta.'
      }
    ];
  } else {
    igStage = 'Consolidación & Expansión Regional/Nacional (2.5K+)';
    igObjective = `Vender el 100% del aforo de las salas de la gira y afianzar la marca musical de ${bandName} ante festivales y promotores`;
    igStrategy = 'Contenido cinematográfico de alta producción intercalado con momentos crudos de carretera. Anuncios de gira con carruseles de fechas y venta de merchandising exclusivo en edición limitada.';
    igHooks = [
      `«Anunciamos las 8 ciudades de la Gira de ${bandName}. ¿En cuál nos vemos en el pogo?»`,
      '«Así vivimos el concierto más salvaje de nuestra historia desde el escenario...»',
      '«El antes y el después de tocar 3 días seguidos sin dormir en furgoneta.»'
    ];
    igSchedule = '4-5 Reels semanales + Cobertura intensiva en directo durante fines de semana de bolo';
    igActions = [
      {
        id: 'ig-cons-1',
        title: 'Lanzar campañas de Anuncios segmentados por ciudad de concierto',
        description: 'Promociona con 5€/día el Reel del directo a personas interesadas en indie/rock en el radio de 25km de la sala donde tocas.',
        impact: 'critico',
        difficulty: 'medio',
        frequency: 'semanal',
        kpiTarget: 'Coste por clic a entrada < 0.25€ y lleno de sala'
      },
      {
        id: 'ig-cons-2',
        title: 'Colaboraciones cruzadas con otras bandas del cartel',
        description: 'Publica posts compartidos (Co-Author) con los grupos con los que compartes escenario para sumar audiencias enteras.',
        impact: 'alto',
        difficulty: 'fácil',
        frequency: 'mensual',
        kpiTarget: '+200 seguidores cruzados por fecha de concierto'
      }
    ];
    igDonts = [
      'No descuides las historias destacadas; organízalas por "Gira", "Música", "Merch" y "Prensa".',
      'No anuncies un concierto con menos de 3 semanas de margen en redes.'
    ];
    igViralConcepts = [
      {
        title: 'El Viaje de 600km para 50 Minutos de Éxtasis',
        concept: 'Muestra el viaje en furgoneta, montaje de escenario, cansancio y la explosión final de adrenalina al subir al escenario.',
        hook: '«600 kilómetros de carretera para vivir estos 50 minutos con vosotros. Valió cada segundo.»',
        callToAction: 'Etiqueta a quien te acompaña a todos los conciertos.'
      }
    ];
  }

  const instagramRec: ChannelRecommendation = {
    platform: 'instagram',
    name: 'Instagram',
    currentMetricsSummary: `${igCount.toLocaleString()} seguidores · ${igStage}`,
    growthStage: igStage,
    primaryObjective: igObjective,
    coreStrategy: igStrategy,
    hookFormulas: igHooks,
    recommendedSchedule: igSchedule,
    actionItems: igActions,
    donts: igDonts,
    viralConcepts: igViralConcepts
  };

  // 2. TikTok Strategy based on Band Tier
  let tkStage = 'Iniciación 0-500';
  let tkObjective = '';
  let tkStrategy = '';
  let tkHooks: string[] = [];
  let tkSchedule = '';
  let tkActions: ActionItem[] = [];
  let tkDonts: string[] = [];
  let tkViralConcepts: any[] = [];

  if (tkCount < 1000) {
    tkStage = 'Fase de Descubrimiento (0 - 1K)';
    tkObjective = 'Conseguir que el algoritmo posicione vuestro audio original y viralice ganchos musicales ante público frío';
    tkStrategy = 'TikTok es la plataforma de descubrimiento musical más potente. No necesitas seguidores para conseguir 50k views si el gancho en los primeros 1.5 segundos genera intriga o empatía musical. Sube la pista como sonido oficial.';
    tkHooks = [
      '«Le dije a mis colegas que esta melodía era pegadiza y no me creían...»',
      '«POV: Cuando en el ensayo sale un riff que suena como si fuera de un festival de 20.000 personas...»',
      '«Esta canción la compusimos para los que echan de menos a alguien este verano.»',
      '«Puse la cámara en el mástil del bajo sin saber que saldría la toma del año.»'
    ];
    tkSchedule = '4-5 TikToks semanales (16:00 - 18:00h y 21:30 - 23:00h)';
    tkActions = [
      {
        id: 'tk-deb-1',
        title: 'Registrar y Fijar el Audio Original Oficial de la Banda',
        description: 'Sube un vídeo con el estribillo más potente en audio de estudio. Fíjalo en tu perfil y anima a la comunidad a usar ese audio.',
        impact: 'critico',
        difficulty: 'fácil',
        frequency: 'semanal',
        kpiTarget: 'Lograr que al menos 15 personas graben TikToks con vuestro sonido'
      },
      {
        id: 'tk-deb-2',
        title: 'Estructura "Gancho Rápido + Subtítulos Dinámicos"',
        description: 'Empieza con texto grande que plantee un dilema ("¿Es este el mejor solo que hemos tocado jamás?") y subtítulos palabra por palabra.',
        impact: 'alto',
        difficulty: 'medio',
        frequency: 'diario',
        kpiTarget: 'Watch Time promedio > 8.5 segundos'
      }
    ];
    tkDonts = [
      'NUNCA subas a TikTok vídeos que tengan la marca de agua o logo de Instagram Reels (el algoritmo reduce el alcance un 90%).',
      'No tardes más de 2 segundos en arrancar el ritmo de la canción.'
    ];
    tkViralConcepts = [
      {
        title: 'El Error que se Convirtió en Canción',
        concept: 'Muestra una pifia o equivocación en el local que al final sonó tan bien que se quedó como puente del tema.',
        hook: '«Nos equivocamos metiendo este acorde y acabó siendo la mejor parte del disco...»',
        callToAction: 'Dale al + si quieres escuchar cómo quedó en el estudio.'
      }
    ];
  } else {
    tkStage = 'Consolidación de Comunidad (1K+)';
    tkObjective = 'Convertir usuarios virales de TikTok en oyentes activos de Spotify y seguidores en Instagram';
    tkStrategy = 'Usa la función de responder comentarios con vídeos tocando instrumentos en directo. Participa en tendencias musicales adaptándolas con el estilo propio de la banda.';
    tkHooks = [
      '«Nos pidieron tocar este tema en acústico y esto fue lo que pasó...»',
      '«Así reacciona la gente cuando metemos este cambio de ritmo en mitad del tema.»'
    ];
    tkSchedule = '1 TikTok diario alternando entre fragmentos de directo, humor de banda y proceso de grabación';
    tkActions = [
      {
        id: 'tk-con-1',
        title: 'Responder a comentarios pidiendo canciones con tomas en directo',
        description: 'Aprovecha las preguntas de los fans en comentarios para crear nuevos clips tocando la estrofa solicitada.',
        impact: 'alto',
        difficulty: 'fácil',
        frequency: 'semanal',
        kpiTarget: '+20% ratio de comentarios por vídeo'
      }
    ];
    tkDonts = [
      'No ignores los sonidos en tendencia de la semana para hacer formatos humorísticos de la banda.',
      'No dejes enlaces rotos en el perfil de TikTok.'
    ];
    tkViralConcepts = [
      {
        title: 'Versión Inesperada con el Sonido de la Banda',
        concept: 'Haz un cover de 20 segundos de un clásico del pop pero con el sonido distorsionado y enérgico de vuestro grupo.',
        hook: '«¿Cómo sonaría este hit si lo tocáramos en un festival de rock?»',
        callToAction: 'Comenta qué otra canción quieres que versionemos.'
      }
    ];
  }

  const tiktokRec: ChannelRecommendation = {
    platform: 'tiktok',
    name: 'TikTok',
    currentMetricsSummary: `${tkCount.toLocaleString()} seguidores · ${tkStage}`,
    growthStage: tkStage,
    primaryObjective: tkObjective,
    coreStrategy: tkStrategy,
    hookFormulas: tkHooks,
    recommendedSchedule: tkSchedule,
    actionItems: tkActions,
    donts: tkDonts,
    viralConcepts: tkViralConcepts
  };

  // 3. YouTube Strategy based on views & subscribers
  let ytStage = 'Fase Inicial (0 - 500 suscriptores)';
  let ytObjective = '';
  let ytStrategy = '';
  let ytHooks: string[] = [];
  let ytSchedule = '';
  let ytActions: ActionItem[] = [];
  let ytDonts: string[] = [];
  let ytViralConcepts: any[] = [];

  if (ytSubs < 1000) {
    ytStage = 'Tracción de Catálogo & Shorts (0 - 1K)';
    ytObjective = 'Generar un repositorio oficial de máxima calidad de sonido (videoclips y sesiones acústicas) usando Shorts como embudo de captación';
    ytStrategy = 'YouTube es el segundo buscador del mundo y premia el audio en alta definición (24-bit/48kHz). Publica Shorts verticales que enlacen con un clic al videoclip oficial de larga duración en horizontal.';
    ytHooks = [
      `«Directo en alta definición: Así suena [Nombre Canción] en ${bandName} con la sala hasta arriba.»`,
      '«Sesión Acústica Exclusiva grabada en una sola toma sin cortes ni autotune.»',
      '«Detrás de cámaras: Cómo grabamos este videoclip con 0€ de presupuesto.»'
    ];
    ytSchedule = '2 Shorts semanales + 1 Vídeo largo de calidad (Sesión en directo o Videoclip) cada 4 semanas';
    ytActions = [
      {
        id: 'yt-deb-1',
        title: 'Enlazar YouTube Shorts al Videoclip Oficial Largo',
        description: 'Al subir un Short, usa el botón nativo de YouTube "Vídeo Relacionado" para que quien vea el clip corto salte al videoclip completo con 1 toque.',
        impact: 'critico',
        difficulty: 'fácil',
        frequency: 'semanal',
        kpiTarget: 'Derivar el 25% de visitas de Shorts hacia el videoclip largo'
      },
      {
        id: 'yt-deb-2',
        title: 'Miniaturas de Alto Contraste con Expresiones y Texto Corto',
        description: 'Usa miniaturas nítidas con primer plano de los músicos en directo, colores saturados y máximo 3 palabras en negrita.',
        impact: 'alto',
        difficulty: 'medio',
        frequency: 'semanal',
        kpiTarget: 'Click-Through Rate (CTR) de miniaturas > 7%'
      },
      {
        id: 'yt-deb-3',
        title: 'Optimización SEO con Letra Completa y Enlaces en la Descripción',
        description: 'Escribe la letra íntegra de la canción, acordes, créditos y enlaces a Spotify e Instagram en la descripción del vídeo.',
        impact: 'medio',
        difficulty: 'fácil',
        frequency: 'puntual',
        kpiTarget: 'Aparecer en primeras posiciones al buscar letra de la canción'
      }
    ];
    ytDonts = [
      'No dejes vídeos largos sin capítulos (Timestamps) en la descripción.',
      'No subas audio saturado o con el micro saturado del móvil si buscas dar imagen profesional ante programadores de salas.'
    ];
    ytViralConcepts = [
      {
        title: 'Sesión Acústica en Lugar Inesperado',
        concept: 'Graba a la banda tocando en acústico en una azotea con atardecer, un túnel con eco o el bosque.',
        hook: '«Tocamos esta canción con la reverberación natural de este túnel abandonado...»',
        callToAction: 'Suscríbete para ver la sesión completa.'
      }
    ];
  } else {
    ytStage = 'Consolidación Audiovisual (1K+ suscriptores)';
    ytObjective = 'Fidelizar a la comunidad con directos completos, documentales de gira y monetización por YouTube Music';
    ytStrategy = 'Crea listas de reproducción organizadas por álbumes y conciertos completos. Los directos bien masterizados son la mejor carta de presentación para festivales.';
    ytHooks = [
      `«Concierto Completo de ${bandName} en Directo (Live HD)»`,
      '«Making of del nuevo álbum: 10 días encerrados en el estudio de grabación.»'
    ];
    ytSchedule = '3 Shorts semanales + 1 directo / videoclip oficial mensual';
    ytActions = [
      {
        id: 'yt-con-1',
        title: 'Publicar el Concierto Completo con División de Capítulos',
        description: 'Sube 30-45 minutos de concierto en multicámara y divide cada canción con timestamps para que los fans compartan sus temas favoritos.',
        impact: 'alto',
        difficulty: 'avanzado',
        frequency: 'mensual',
        kpiTarget: 'Tiempo de reproducción promedio > 12 minutos por espectador'
      }
    ];
    ytDonts = [
      'No dejes el canal sin banner actualizado con las fechas de la gira.',
      'No olvides fijar un comentario en cada vídeo con el enlace a entradas.'
    ];
    ytViralConcepts = [
      {
        title: 'El Documental de Fin de Gira',
        concept: 'Resumen de 10 minutos con lo mejor de la temporada: viajes, risas, caídas y los momentos más emotivos con el público.',
        hook: '«1 año de gira resumido en 10 minutos de pura adrenalina.»',
        callToAction: 'Cuéntanos en comentarios en qué concierto estuviste.'
      }
    ];
  }

  const youtubeRec: ChannelRecommendation = {
    platform: 'youtube',
    name: 'YouTube',
    currentMetricsSummary: `${ytSubs.toLocaleString()} suscriptores · ${ytViews > 0 ? `${ytViews.toLocaleString()} visualizaciones totales · ` : ''}${ytStage}`,
    growthStage: ytStage,
    primaryObjective: ytObjective,
    coreStrategy: ytStrategy,
    hookFormulas: ytHooks,
    recommendedSchedule: ytSchedule,
    actionItems: ytActions,
    donts: ytDonts,
    viralConcepts: ytViralConcepts
  };

  // 4. Spotify & Streaming Strategy
  let spStage = !hasSpotifyProfile ? 'Fase Pre-Lanzamiento' : spCount < 1000 ? 'Tracción Inicial (0 - 1K oyentes)' : 'Consolidación Algorítmica (1K+ oyentes)';
  let spObjective = '';
  let spStrategy = '';
  let spHooks: string[] = [];
  let spSchedule = '';
  let spActions: ActionItem[] = [];
  let spDonts: string[] = [];
  let spViralConcepts: any[] = [];

  if (!hasSpotifyProfile || spCount < 1000) {
    spObjective = hasSpotifyProfile 
      ? 'Aumentar el ratio de guardados (Save Rate > 12%) para activar el algoritmo de Release Radar y Radio de Artista'
      : 'Preparar la distribución digital y campaña de Pre-Save para el primer lanzamiento oficial en plataformas';
    spStrategy = hasSpotifyProfile
      ? 'Para que el algoritmo de Spotify te recomiende en "Descubrimiento Semanal", necesitas que los oyentes escuchen más de 30 segundos sin saltar la pista y la añadan a sus bibliotecas personales (Save Rate).'
      : 'Elige una distribuidora digital (DistroKid, CD Baby, Altafonte, Amuse) y sube los temas con 4 semanas de antelación para poder hacer el Pitch Editorial oficial en Spotify for Artists.';
    spHooks = [
      `«Escucha el nuevo single de ${bandName} en Spotify y guárdalo en tu playlist favorita.»`,
      `«Si te gustan bandas de ${genre}, acabamos de soltar este tema en todas las plataformas.»`,
      '«Haz Pre-Save para ser el primero en escucharlo el viernes a las 00:00h.»'
    ];
    spSchedule = 'Estrategia de singles en cascada: 1 single nuevo cada 6-8 semanas para mantener la curva del Release Radar en constante ascenso';
    spActions = [
      {
        id: 'sp-deb-1',
        title: hasSpotifyProfile ? 'Crear la Playlist Oficial de la Banda («Artist Pick»)' : 'Reclamar perfil verificado en Spotify for Artists',
        description: hasSpotifyProfile
          ? `Crea una playlist llamada "${bandName}: Lo que nos inspira" mezclando vuestros temas con referentes reconocidos del género y fíjala en tu perfil.`
          : 'Reclama tu cuenta oficial en Spotify for Artists tras subir el primer master para personalizar fotos, biografía y enlaces a redes.',
        impact: 'alto',
        difficulty: 'fácil',
        frequency: 'puntual',
        kpiTarget: 'Perfil 100% completado con biografía y fotos oficiales'
      },
      {
        id: 'sp-deb-2',
        title: 'Pitch Editorial en Spotify for Artists con 3 semanas de antelación',
        description: 'Rellena detalladamente los instrumentos, género, estado de ánimo (mood), ciudad y la historia del tema para que los curadores editoriales de España lo valoren.',
        impact: 'critico',
        difficulty: 'medio',
        frequency: 'mensual',
        kpiTarget: 'Entrada en al menos 1 lista editorial de novedades (ej. Radar Indie, Novedades Rock)'
      },
      {
        id: 'sp-deb-3',
        title: 'Campaña de Pre-Save con incentivo exclusivo para fans',
        description: 'Ofrece a los fans que hagan Pre-Save acceso a un vídeo exclusivo o la posibilidad de ganar merchandising firmado en el próximo concierto.',
        impact: 'alto',
        difficulty: 'medio',
        frequency: 'mensual',
        kpiTarget: 'Conseguir > 100 Pre-Saves antes de la fecha de salida'
      }
    ];
    spDonts = [
      'NUNCA compres reproducciones o pagues a servicios sospechosos de "Playlists Bot": Spotify detecta los streams fraudulentos, elimina las canciones y banea la cuenta de la banda.',
      'No publiques un disco completo de 10 canciones de golpe sin haber sacado previamente 3 o 4 singles de adelanto.'
    ];
    spViralConcepts = [
      {
        title: 'Lanzamiento de Single en Cascada',
        concept: 'Saca el Single 1; cuando saques el Single 2, agrúpalo en un bundle que contenga también el Single 1 para que el oyente reproduzca ambos temas seguidos.',
        hook: '«El segundo adelanto de nuestro próximo disco ya está disponible en Spotify.»',
        callToAction: 'Dale al corazón verde en Spotify para no perderte nada.'
      }
    ];
  } else {
    spObjective = `Escalar oyentes mensuales más allá de ${spCount.toLocaleString()} y entrar en rotación en listas editoriales de gran calado`;
    spStrategy = 'Optimiza la retención de los primeros 15 segundos de cada tema para minimizar el Skip Rate. Coordina el lanzamiento con campañas de prensa musical y radios independientes.';
    spHooks = [
      `«Superamos los ${spCount.toLocaleString()} oyentes en Spotify. ¡Gracias a todos los que nos tenéis en bucle!»`,
      '«Nuevo single disponible. Cuéntanos cuál es tu verso favorito en los comentarios.»'
    ];
    spSchedule = 'Lanzamientos constantes cada 6 semanas + Campaña de Canvas animados en vertical para cada canción';
    spActions = [
      {
        id: 'sp-con-1',
        title: 'Subir Spotify Canvas (Vídeo vertical en bucle) a todas las canciones',
        description: 'Crea vídeos verticales de 3 a 8 segundos en bucle para cada tema en Spotify. Aumenta las posibilidades de compartir en historias de Instagram un +145%.',
        impact: 'alto',
        difficulty: 'fácil',
        frequency: 'mensual',
        kpiTarget: '100% del catálogo con Canvas activo'
      }
    ];
    spDonts = [
      'No dejes canciones sin Canvas animado.',
      'No dejes de actualizar las fechas de los conciertos en Songkick / Bandsintown para que salgan automáticamente en vuestro perfil de Spotify.'
    ];
    spViralConcepts = [
      {
        title: 'La Lista de Carretera de la Banda',
        concept: 'Una playlist curada por todos los miembros del grupo con los temas que suenan en la furgoneta durante los viajes de gira.',
        hook: '«Esta es la música que suena en nuestra furgoneta a las 4 AM entre bolo y bolo.»',
        callToAction: 'Sigue la playlist en Spotify para viajar con nosotros.'
      }
    ];
  }

  const spotifyRec: ChannelRecommendation = {
    platform: 'spotify',
    name: 'Spotify & Streaming',
    currentMetricsSummary: hasSpotifyProfile 
      ? `${spCount.toLocaleString()} oyentes mensuales · Perfil Verificado · ${spStage}` 
      : `Sin perfil público detectado · ${spStage}`,
    growthStage: spStage,
    primaryObjective: spObjective,
    coreStrategy: spStrategy,
    hookFormulas: spHooks,
    recommendedSchedule: spSchedule,
    actionItems: spActions,
    donts: spDonts,
    viralConcepts: spViralConcepts
  };

  return {
    bandName: bandName || 'Bakandeya',
    generatedAt: new Date().toISOString(),
    horizonDays,
    archetype,
    executiveSummary: `Plan Estratégico adaptado a ${bandName || 'Bakandeya'} en ${archetype.label}. Con una audiencia base de ${igCount.toLocaleString()} en Instagram, ${tkCount.toLocaleString()} en TikTok y ${ytSubs.toLocaleString()} en YouTube, el plan prioriza resolver el cuello de botella: "${archetype.primaryBottleneck}" para alcanzar una meta de crecimiento de ${archetype.idealFollowerGrowthRate} y llenar las salas del circuito musical.`,
    overallPillars: [
      {
        pillar: 'Directo y Energía de Escenario (Conversión a Salas)',
        description: 'Demostrar con clips de sonido impecable que la banda ofrece un directo explosivo que nadie debe perderse.',
        weightPercentage: 40
      },
      {
        pillar: 'Humanización & Detrás de Cámaras (Comunidad de Superfans)',
        description: 'Ensayos, anécdotas de furgoneta, composición de letras y conexión personal entre los músicos y el público.',
        weightPercentage: 35
      },
      {
        pillar: 'Lanzamientos en Cascada & Streaming (Spotify / YouTube)',
        description: 'Campañas de anticipación musical, Pre-Saves, Canvas animados y derivación constante a plataformas de escucha.',
        weightPercentage: 25
      }
    ],
    weeklyBlueprint: [
      {
        day: 'Lunes',
        focus: 'Humor & Anécdota de Furgoneta o Ensayo',
        recommendedPlatform: 'tiktok',
        contentAction: 'Vídeo dinámico de 15s con anécdota o situación cómica de grupo con audio en tendencia.',
        optimalPostingTime: '16:00h'
      },
      {
        day: 'Martes',
        focus: 'Riff o Solo del Directo con Calidad de Sonido',
        recommendedPlatform: 'instagram',
        contentAction: 'Reel vertical con audio nítido del último concierto y gancho visual en los primeros 2 segundos.',
        optimalPostingTime: '20:00h'
      },
      {
        day: 'Miércoles',
        focus: 'Interacción en Stories & Votaciones de Setlist',
        recommendedPlatform: 'instagram',
        contentAction: 'Stickers de preguntas y encuestas sobre qué canciones tocar en el próximo concierto.',
        optimalPostingTime: '14:00h'
      },
      {
        day: 'Jueves',
        focus: 'YouTube Short / Avance de Videoclip Oficial',
        recommendedPlatform: 'youtube',
        contentAction: 'Short vertical con el momento cumbre del tema enlazado con 1 toque al videoclip oficial completo.',
        optimalPostingTime: '18:30h'
      },
      {
        day: 'Viernes',
        focus: 'Lanzamiento / Cuenta Atrás Concierto del Fin de Semana',
        recommendedPlatform: 'todas',
        contentAction: 'Post colaborativo con la sala y sticker de cuenta atrás para la apertura de puertas.',
        optimalPostingTime: '19:30h'
      },
      {
        day: 'Sábado',
        focus: 'Cobertura en Vivo del Concierto (Stories)',
        recommendedPlatform: 'instagram',
        contentAction: '5-6 Stories en directo desde la prueba de sonido, camerino y momento del pogo con el público.',
        optimalPostingTime: '22:30h'
      },
      {
        day: 'Domingo',
        focus: 'Agradecimiento y Recap del Concierto',
        recommendedPlatform: 'instagram',
        contentAction: 'Carrusel de fotos o Reel resumen agradeciendo a la sala y a la ciudad por la energía.',
        optimalPostingTime: '20:30h'
      }
    ],
    channels: [
      instagramRec,
      tiktokRec,
      youtubeRec,
      spotifyRec
    ]
  };
}
