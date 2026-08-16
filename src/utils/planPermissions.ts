export type SubscriptionPlanId = 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' | 'emergente' | 'profesional' | 'elite' | 'manager360';

export interface PlanFeature {
  id: string;
  label: string;
}

export interface PlanDefinition {
  id: 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel';
  name: string;
  badge: string;
  color: string;
  price: string;
  credits: string;
  creditsSub: string;
  description: string;
  allowedModules: string[];
  stickerGift?: {
    qty: string;
    description: string;
  };
  features: string[];
}

export const PLANS: Record<'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel', PlanDefinition> = {
  ensayo: {
    id: 'ensayo',
    name: 'Ensayo',
    badge: 'Gratis',
    color: '#71717a', // Zinc
    price: '0€ / para siempre',
    credits: '100 créditos / mes',
    creditsSub: 'Pitches básicos y consultas IA',
    description: 'Para proyectos noveles que están empezando a organizarse.',
    allowedModules: ['resumen', 'booking', 'medios', 'bandas', 'calendario', 'epk', 'repertorio', 'planes'],
    features: [
      '1 banda o proyecto activo',
      '10 salas en base de datos',
      'Dossier de Prensa Interactivo (EPK)',
      'Gestión de Repertorio, Setlists & Letras',
      'Metrónomo WebAudio & Afinador Pro',
    ],
  },
  local: {
    id: 'local',
    name: 'Local',
    badge: 'Iniciación',
    color: '#94a3b8', // Slate / Silver
    price: '15€ / mes',
    credits: '300 créditos / mes',
    creditsSub: 'Booking guiado y generación de ideas',
    description: 'Bandas en activo que buscan arrancar su booking y difusión.',
    allowedModules: ['resumen', 'booking', 'medios', 'bandas', 'calendario', 'epk', 'fans', 'reels', 'repertorio', 'planes'],
    stickerGift: {
      qty: '250 pegatinas gratis',
      description: 'Pack de pegatinas de tu banda, gratis con tu primera suscripción',
    },
    features: [
      '1 banda o proyecto',
      '50 salas de conciertos',
      '🎁 Regalo: 250 pegatinas vinilo de tu banda',
      '10 contactos de prensa y medios',
      'Planificador de Redes & Reels Center',
      'QR & Captura de Base de Fans',
      'Asistente IA de Redacción de Pitches',
    ],
  },
  de_gira: {
    id: 'de_gira',
    name: 'De Gira',
    badge: 'Más Popular',
    color: '#f59e0b', // Amber / Gold
    price: '29€ / mes',
    credits: '800 créditos / mes',
    creditsSub: 'Flujos agénticos completos y auto-booking',
    description: 'Para bandas que tocan con frecuencia y automatizan su gestión.',
    allowedModules: ['resumen', 'booking', 'medios', 'bandas', 'calendario', 'epk', 'giras', 'fans', 'reels', 'repertorio', 'chat', 'planes'],
    stickerGift: {
      qty: '500 pegatinas gratis',
      description: 'Pack de pegatinas de tu banda, gratis con tu primera suscripción',
    },
    features: [
      'Salas y festivales ilimitados',
      'Medios y prensa ilimitados',
      '🎁 Regalo: 500 pegatinas vinilo de tu banda',
      'Agentes IA Scout, Redactor y Lector',
      'Rutas de Gira & Tour Logistics',
      'Calculadora de kilometraje y dietas',
      'Dossier EPK con dominio propio',
    ],
  },
  cabeza_de_cartel: {
    id: 'cabeza_de_cartel',
    name: 'Cabeza de Cartel',
    badge: 'Pro & Multi-Banda',
    color: '#10b981', // Emerald
    price: '79€ / mes',
    credits: '2.500 créditos / mes',
    creditsSub: 'Capacidad multi-banda y agentes en paralelo',
    description: 'Control total para proyectos profesionales, agencias y mánagers.',
    allowedModules: ['resumen', 'booking', 'medios', 'bandas', 'calendario', 'epk', 'giras', 'fans', 'reels', 'repertorio', 'chat', 'finanzas', 'merchan', 'planes'],
    stickerGift: {
      qty: '1.000 pegatinas + entrega prioritaria',
      description: 'Pack de pegatinas de tu banda, gratis con tu primera suscripción',
    },
    features: [
      'Hasta 5 bandas gestionadas en paralelo',
      'Todo ilimitado sin restricciones de volumen',
      '🎁 Regalo: 1.000 pegatinas vinilo + Envío Express',
      'Taller Merchan & Inventario Completo',
      'Finanzas Avanzadas e Ingresos/Gastos',
      'IA Multi-Agente con Function Calling',
      'Soporte Prioritario VIP 24/7',
    ],
  },
};

export function normalizePlan(rawPlan?: string): 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' {
  if (!rawPlan) return 'ensayo';
  const clean = rawPlan.toLowerCase().trim();
  
  if (clean === 'cabeza_de_cartel' || clean === 'cabeza de cartel' || clean === 'elite' || clean === 'manager360' || clean === 'pro_plus' || clean === '360' || clean === 'manager 360' || clean === 'elite 360') {
    return 'cabeza_de_cartel';
  }
  if (clean === 'de_gira' || clean === 'de gira' || clean === 'profesional' || clean === 'pro' || clean === 'consolidada' || clean === 'gira profesional' || clean === 'gira') {
    return 'de_gira';
  }
  if (clean === 'local') {
    return 'local';
  }
  if (clean === 'ensayo' || clean === 'emergente' || clean === 'gratis' || clean === 'free' || clean === 'basico') {
    return 'ensayo';
  }
  
  return 'ensayo';
}

export function getPlanDefinition(rawPlan?: string): PlanDefinition {
  const norm = normalizePlan(rawPlan);
  return PLANS[norm];
}

export function isElitePlan(rawPlan?: string): boolean {
  return normalizePlan(rawPlan) === 'cabeza_de_cartel';
}

export function getPlanTierLevel(rawPlan?: string): number {
  const norm = normalizePlan(rawPlan);
  if (norm === 'cabeza_de_cartel') return 4;
  if (norm === 'de_gira') return 3;
  if (norm === 'local') return 2;
  return 1;
}

export function getPlanChangeType(currentPlan?: string, targetPlan?: string): 'current' | 'upgrade' | 'downgrade' {
  const normCurrent = normalizePlan(currentPlan);
  const normTarget = normalizePlan(targetPlan);
  if (normCurrent === normTarget) return 'current';
  const currLevel = getPlanTierLevel(normCurrent);
  const targetLevel = getPlanTierLevel(normTarget);
  return targetLevel > currLevel ? 'upgrade' : 'downgrade';
}

export interface PlanLimits {
  maxLeads: number;
  maxPressContacts: number;
  maxBands: number;
  maxSongs: number;
  maxFans: number;
  monthlyCredits: number;
}

export const PLAN_LIMITS: Record<'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel', PlanLimits> = {
  ensayo: {
    maxLeads: 10,
    maxPressContacts: 0,
    maxBands: 1,
    maxSongs: 5,
    maxFans: 10,
    monthlyCredits: 100
  },
  local: {
    maxLeads: 50,
    maxPressContacts: 10,
    maxBands: 1,
    maxSongs: 20,
    maxFans: 100,
    monthlyCredits: 300
  },
  de_gira: {
    maxLeads: Infinity,
    maxPressContacts: Infinity,
    maxBands: 1,
    maxSongs: Infinity,
    maxFans: Infinity,
    monthlyCredits: 800
  },
  cabeza_de_cartel: {
    maxLeads: Infinity,
    maxPressContacts: Infinity,
    maxBands: 5,
    maxSongs: Infinity,
    maxFans: Infinity,
    monthlyCredits: 2500
  }
};

export function getPlanLimits(rawPlan?: string): PlanLimits {
  const norm = normalizePlan(rawPlan);
  return PLAN_LIMITS[norm] || PLAN_LIMITS.ensayo;
}

export function checkRecordLimit(
  rawPlan: string | undefined,
  recordType: 'leads' | 'medios' | 'fans' | 'songs' | 'bands',
  currentCount: number
): { allowed: boolean; max: number; current: number; message?: string } {
  const limits = getPlanLimits(rawPlan);
  let max = Infinity;
  let typeLabel = 'registros';

  if (recordType === 'leads') {
    max = limits.maxLeads;
    typeLabel = 'salas';
  } else if (recordType === 'medios') {
    max = limits.maxPressContacts;
    typeLabel = 'contactos de medios';
  } else if (recordType === 'fans') {
    max = limits.maxFans;
    typeLabel = 'fans';
  } else if (recordType === 'songs') {
    max = limits.maxSongs;
    typeLabel = 'canciones';
  } else if (recordType === 'bands') {
    max = limits.maxBands;
    typeLabel = 'bandas';
  }

  if (currentCount >= max) {
    return {
      allowed: false,
      max,
      current: currentCount,
      message: `Tienes ${currentCount} ${typeLabel} y el plan contratado (${getPlanDefinition(rawPlan).name}) permite un máximo de ${max}. Puedes seguir consultando y editando tus datos existentes, pero necesitas mejorar el plan para añadir nuevos registros.`
    };
  }

  return { allowed: true, max, current: currentCount };
}

export function hasModuleAccess(rawPlan: string | undefined, moduleId: string): boolean {
  const norm = normalizePlan(rawPlan);
  if (norm === 'cabeza_de_cartel') return true;

  const planDef = PLANS[norm];
  return planDef ? planDef.allowedModules.includes(moduleId) : false;
}

export function getRequiredPlanForModule(moduleId: string): 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' {
  if (PLANS.ensayo.allowedModules.includes(moduleId)) return 'ensayo';
  if (PLANS.local.allowedModules.includes(moduleId)) return 'local';
  if (PLANS.de_gira.allowedModules.includes(moduleId)) return 'de_gira';
  return 'cabeza_de_cartel';
}


