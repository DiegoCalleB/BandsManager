import { SocialMetric, EPKConfig } from '../types';

export type BandTier = 
  | 'garage_debut'       // 0 - 500 followers / <1k views
  | 'local_traction'     // 500 - 2.5k followers / 1k - 10k views
  | 'regional_circuit'   // 2.5k - 10k followers / 10k - 50k views
  | 'national_headliner'; // 10k+ followers / 50k+ views

export interface BandProfileArchetype {
  tier: BandTier;
  label: string;
  stageName: string;
  stageBadgeColor: string;
  description: string;
  primaryBottleneck: string;
  conversionFocus: string;
  idealFollowerGrowthRate: string;
}

export function detectBandProfileArchetype(metric: SocialMetric | null): BandProfileArchetype {
  const ig = metric?.instagram_followers || metric?.instagram || 0;
  const tk = metric?.tiktok_followers || metric?.tiktok || 0;
  const ytSubs = metric?.youtube_subscribers || metric?.youtube || 0;
  const ytViews = metric?.youtube_total_views || 0;
  const spListeners = metric?.spotify_monthly_listeners || metric?.spotify || 0;

  // Max primary community footprint
  const maxFollowers = Math.max(ig, tk, ytSubs);
  const totalAudience = ig + tk + ytSubs + spListeners;

  if (maxFollowers < 500 && ytViews < 3000) {
    return {
      tier: 'garage_debut',
      label: 'Banda Emergente / Fase Debut (0 - 500)',
      stageName: 'Fase 1: Tracción Inicial y Validación de Sonido',
      stageBadgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      description: 'Grupo en fase de arranque con círculo cercano y primeros directos en salas pequeñas. El foco debe ser validar qué canciones y ganchos conectan antes de invertir en campañas de pago.',
      primaryBottleneck: 'Falta de volumen y consistencia de contenido (miedo a publicar directos o ensayos sin pulir).',
      conversionFocus: 'Conseguir los primeros 100 «Superfans» y llenar salas de 50-80 personas por boca a boca y micro-comunidad.',
      idealFollowerGrowthRate: '+15% a +30% mensual'
    };
  }

  if (maxFollowers < 2500 || totalAudience < 5000) {
    return {
      tier: 'local_traction',
      label: 'Tracción Local & Primera Comunidad (500 - 2.5K)',
      stageName: 'Fase 2: Expansión de Nicho y Retención Orgánica',
      stageBadgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      description: 'La banda ya tiene una base leal en su ciudad natal y empieza a tener reproducciones orgánicas en Reels y TikTok. Es el momento de sistematizar la conversión de visualizaciones a oyentes de Spotify y entradas de conciertos.',
      primaryBottleneck: 'Fugas en el embudo: la gente ve el Reel pero no entra al perfil ni escucha el tema en streaming.',
      conversionFocus: 'Transformar espectadores casuales en oyentes mensuales recurrentes y suscriptores de lista de correo/WhatsApp VIP.',
      idealFollowerGrowthRate: '+10% a +20% mensual'
    };
  }

  if (maxFollowers < 10000 || totalAudience < 25000) {
    return {
      tier: 'regional_circuit',
      label: 'Circuito Regional & Gira en Salas (2.5K - 10K)',
      stageName: 'Fase 3: Consolidación y Conquista de Ciudades',
      stageBadgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
      description: 'Banda con solvencia en directo, repertorio asentado y presencia en festivales medianos o salas medianas (200-500 aforo). Requiere contenido de alta producción y campañas de lanzamiento con singles en cascada.',
      primaryBottleneck: 'Saturación del público local; necesidad de abrir nuevas plazas y ciudades mediante micro-segmentación geográfica.',
      conversionFocus: 'Venta anticipada de entradas (*early bird*) y activación algorítmica masiva en Spotify (Radio / Descubrimiento Semanal).',
      idealFollowerGrowthRate: '+8% a +15% mensual'
    };
  }

  return {
    tier: 'national_headliner',
    label: 'Escalado Nacional & Cabeza de Cartel (10K+)',
    stageName: 'Fase 4: Posicionamiento Mainstream y Grandes Recintos',
    stageBadgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    description: 'Banda con tracción consolidada, catálogo extenso y comunidad activa en múltiples ciudades. La estrategia pasa por exclusivas, colaboraciones con otros artistas del género y monetización de merchandising de autor.',
    primaryBottleneck: 'Fatiga de la audiencia si el contenido no se renueva con narrativas de álbum y formatos inmersivos.',
    conversionFocus: 'Sold-out en salas de gran aforo (500+), venta de vinilos/merch y fidelización a largo plazo.',
    idealFollowerGrowthRate: '+5% a +10% mensual continuo'
  };
}
