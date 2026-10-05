// Límites de plan por tipo de registro, en espejo de src/utils/planPermissions.ts. Hasta ahora
// solo se comprobaban en el cliente (App.tsx): un usuario que llamase directamente a la API con
// el token de sesión podía crear leads/fans/canciones/bandas sin límite, saltándose por completo
// el plan contratado. Aquí se repite la comprobación en el servidor, que es la que de verdad
// importa para hacerla cumplir.
export interface PlanLimits {
  maxLeads: number;
  maxPressContacts: number;
  maxBands: number;
  maxSongs: number;
  maxFans: number;
}

const PLAN_LIMITS: Record<'promo' | 'promo_plus' | 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel', PlanLimits> = {
  promo: {
    maxLeads: 0,
    maxPressContacts: 0,
    maxBands: 1,
    maxSongs: 25,
    maxFans: 250,
  },
  promo_plus: {
    maxLeads: 0,
    maxPressContacts: 0,
    maxBands: 1,
    maxSongs: 25,
    maxFans: 250,
  },
  ensayo: {
    maxLeads: 10,
    maxPressContacts: 0,
    maxBands: 1,
    maxSongs: 5,
    maxFans: 10,
  },
  local: {
    maxLeads: 50,
    maxPressContacts: 10,
    maxBands: 1,
    maxSongs: 20,
    maxFans: 100,
  },
  de_gira: {
    maxLeads: Infinity,
    maxPressContacts: Infinity,
    maxBands: 1,
    maxSongs: Infinity,
    maxFans: Infinity,
  },
  cabeza_de_cartel: {
    maxLeads: Infinity,
    maxPressContacts: Infinity,
    maxBands: 5,
    maxSongs: Infinity,
    maxFans: Infinity,
  },
};

export function getPlanLimits(normalizedPlan: 'promo' | 'promo_plus' | 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel'): PlanLimits {
  return PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.ensayo;
}

export function checkRecordLimit(
  normalizedPlan: 'promo' | 'promo_plus' | 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel',
  recordType: 'leads' | 'medios' | 'fans' | 'songs' | 'bands',
  currentCount: number
): { allowed: boolean; max: number; message?: string } {
  const limits = getPlanLimits(normalizedPlan);
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
      message: `Límite del plan alcanzado: tienes ${currentCount} ${typeLabel} y tu plan actual permite un máximo de ${max}. Mejora tu plan para añadir más.`
    };
  }

  return { allowed: true, max };
}
