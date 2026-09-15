// Tabla única de colores/etiqueta por estado de lead - antes vivía duplicada (y con valores
// distintos entre sí) en BookingCRM.tsx y Dashboard.tsx. La versión de Dashboard.tsx no cubría
// 'confirmado', 'aplazado', 'respondido', 'borrador_creado' ni 'aprobado_propuesta/respuesta',
// así que un lead en esos estados se pintaba en gris por defecto en la vista móvil. Esta tabla
// es la de BookingCRM.tsx (la completa) - se convierte en la única fuente para ambos sitios.

interface LeadStatusStyle {
  dot: string;
  badgeLight: string;
  badgeDark: string;
  label: string;
}

const DEFAULT_STYLE: LeadStatusStyle = {
  dot: 'bg-stone-400',
  badgeLight: 'bg-slate-50 text-slate-500',
  badgeDark: 'bg-neutral-800/60 text-neutral-400',
  label: '',
};

export const LEAD_STATUS_STYLES: Record<string, LeadStatusStyle> = {
  nuevo: {
    dot: 'bg-amber-400',
    badgeLight: 'bg-amber-50 text-amber-800 border border-amber-200',
    badgeDark: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    label: 'Por contactar',
  },
  esperando_respuesta: {
    dot: 'bg-sky-400',
    badgeLight: 'bg-sky-50 text-sky-700 border border-sky-200',
    badgeDark: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    label: 'Contactado',
  },
  enviado: {
    dot: 'bg-sky-400',
    badgeLight: 'bg-sky-50 text-sky-700 border border-sky-200',
    badgeDark: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    label: 'Contactado',
  },
  respondido: {
    dot: 'bg-indigo-400',
    badgeLight: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    badgeDark: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    label: 'En conversación',
  },
  negociando: {
    dot: 'bg-purple-400',
    badgeLight: 'bg-purple-50 text-purple-700 border border-purple-200',
    badgeDark: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    label: 'Negociando',
  },
  confirmado: {
    dot: 'bg-emerald-400',
    badgeLight: 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300',
    badgeDark: 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40',
    label: 'Confirmado 🎉',
  },
  aplazado: {
    dot: 'bg-yellow-500',
    badgeLight: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    badgeDark: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
    label: 'Aplazado ⏳',
  },
  no_interesado: {
    dot: 'bg-neutral-500',
    badgeLight: 'bg-slate-100 text-slate-500 border border-slate-200',
    badgeDark: 'bg-neutral-800/80 text-neutral-400 border border-neutral-700/50',
    label: 'Descartado',
  },
  pendiente_aprobacion: {
    dot: 'bg-amber-400 animate-pulse',
    badgeLight: 'bg-amber-50 text-amber-700 border border-amber-300',
    badgeDark: 'bg-amber-500/15 text-amber-400 border border-amber-500/40',
    label: 'Borrador por aprobar',
  },
  aprobado: {
    dot: 'bg-emerald-400',
    badgeLight: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    badgeDark: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
    label: 'En cola de envío',
  },
  aprobado_propuesta: {
    dot: 'bg-emerald-400',
    badgeLight: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    badgeDark: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
    label: 'En cola de envío',
  },
  aprobado_respuesta: {
    dot: 'bg-emerald-400',
    badgeLight: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    badgeDark: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
    label: 'En cola de envío',
  },
  borrador_creado: {
    dot: 'bg-cyan-400',
    badgeLight: 'bg-cyan-50 text-cyan-700 border border-cyan-300',
    badgeDark: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40',
    label: 'Borrador en tu email 📝',
  },
};

const styleFor = (normalizedStatus: string): LeadStatusStyle =>
  LEAD_STATUS_STYLES[normalizedStatus] ?? DEFAULT_STYLE;

export function leadStatusDotColor(normalizedStatus: string): string {
  return styleFor(normalizedStatus).dot;
}

export function leadStatusBadgeClass(normalizedStatus: string, isStitchLight: boolean): string {
  const style = styleFor(normalizedStatus);
  return isStitchLight ? style.badgeLight : style.badgeDark;
}

export function leadStatusLabel(normalizedStatus: string, fallback: string): string {
  const style = LEAD_STATUS_STYLES[normalizedStatus];
  return style ? style.label : fallback;
}
