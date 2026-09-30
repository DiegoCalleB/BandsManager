// Tabla única de colores/etiqueta por estado de lead - antes vivía duplicada (y con valores
// distintos entre sí) en BookingCRM.tsx y Dashboard.tsx. La versión de Dashboard.tsx no cubría
//'confirmado', 'aplazado', 'respondido', 'borrador_creado' ni'aprobado_propuesta/respuesta',
// así que un lead en esos estados se pintaba en gris por defecto en la vista móvil. Esta tabla
// es la de BookingCRM.tsx (la completa) - se convierte en la única fuente para ambos sitios.

interface LeadStatusStyle {
  dot: string;
  badgeLight: string;
  badgeDark: string;
  label: string;
}

const DEFAULT_STYLE: LeadStatusStyle = {
  dot: "bg-[var(--ink-3)]",
  badgeLight: "bg-[var(--sunken)] text-[var(--ink-2)]",
  badgeDark: "bg-[var(--sunken)] text-[var(--ink-2)]",
  label: "",
};

// Un solo lenguaje de estado (tokens, se adaptan a Claro/Oscuro/Clásico): acento = en marcha de tu lado, tentative = esperando a la
// otra parte, ok = cerrado o en cola, sunken = aparcado. Nada de opacidades sueltas sobre el texto: bajan el contraste.
export const LEAD_STATUS_STYLES: Record<string, LeadStatusStyle> = {
  nuevo: {
    dot: "bg-[var(--acc)]",
    badgeLight: "bg-[var(--acc-soft)] text-[var(--acc-ink)]",
    badgeDark: "bg-[var(--acc-soft)] text-[var(--acc-ink)]",
    label: "Por contactar",
  },
  esperando_respuesta: {
    dot: "bg-[var(--tentative)]",
    badgeLight: "bg-[var(--tentative)]/15 text-[var(--tentative)]",
    badgeDark: "bg-[var(--tentative)]/15 text-[var(--tentative)]",
    label: "Contactado",
  },
  enviado: {
    dot: "bg-[var(--tentative)]",
    badgeLight: "bg-[var(--tentative)]/15 text-[var(--tentative)]",
    badgeDark: "bg-[var(--tentative)]/15 text-[var(--tentative)]",
    label: "Contactado",
  },
  respondido: {
    dot: "bg-[var(--tentative)]",
    badgeLight: "bg-[var(--tentative)]/15 text-[var(--tentative)]",
    badgeDark: "bg-[var(--tentative)]/15 text-[var(--tentative)]",
    label: "En conversación",
  },
  negociando: {
    dot: "bg-[var(--acc)]",
    badgeLight: "bg-[var(--acc-soft)] text-[var(--acc-ink)]",
    badgeDark: "bg-[var(--acc-soft)] text-[var(--acc-ink)]",
    label: "Negociando",
  },
  confirmado: {
    dot: "bg-[var(--ok)]",
    badgeLight: "bg-[var(--ok-soft)] text-[var(--ok)]",
    badgeDark: "bg-[var(--ok-soft)] text-[var(--ok)]",
    label: "Confirmado",
  },
  aplazado: {
    dot: "bg-[var(--ink-3)]",
    badgeLight: "bg-[var(--sunken)] text-[var(--ink-2)]",
    badgeDark: "bg-[var(--sunken)] text-[var(--ink-2)]",
    label: "Aplazado",
  },
  no_interesado: {
    dot: "bg-[var(--ink-3)]",
    badgeLight: "bg-[var(--sunken)] text-[var(--ink-2)]",
    badgeDark: "bg-[var(--sunken)] text-[var(--ink-2)]",
    label: "Descartado",
  },
  pendiente_aprobacion: {
    dot: "bg-[var(--acc)]",
    badgeLight: "bg-[var(--acc-soft)] text-[var(--acc-ink)]",
    badgeDark: "bg-[var(--acc-soft)] text-[var(--acc-ink)]",
    label: "Borrador por aprobar",
  },
  aprobado: {
    dot: "bg-[var(--ok)]",
    badgeLight: "bg-[var(--ok-soft)] text-[var(--ok)]",
    badgeDark: "bg-[var(--ok-soft)] text-[var(--ok)]",
    label: "En cola de envío",
  },
  aprobado_propuesta: {
    dot: "bg-[var(--ok)]",
    badgeLight: "bg-[var(--ok-soft)] text-[var(--ok)]",
    badgeDark: "bg-[var(--ok-soft)] text-[var(--ok)]",
    label: "En cola de envío",
  },
  aprobado_respuesta: {
    dot: "bg-[var(--ok)]",
    badgeLight: "bg-[var(--ok-soft)] text-[var(--ok)]",
    badgeDark: "bg-[var(--ok-soft)] text-[var(--ok)]",
    label: "En cola de envío",
  },
  borrador_creado: {
    dot: "bg-[var(--acc)]",
    badgeLight: "bg-[var(--acc-soft)] text-[var(--acc-ink)]",
    badgeDark: "bg-[var(--acc-soft)] text-[var(--acc-ink)]",
    label: "Borrador en tu correo",
  },
};

const styleFor = (normalizedStatus: string): LeadStatusStyle =>
  LEAD_STATUS_STYLES[normalizedStatus] ?? DEFAULT_STYLE;

export function leadStatusDotColor(normalizedStatus: string): string {
  return styleFor(normalizedStatus).dot;
}

export function leadStatusBadgeClass(normalizedStatus: string): string {
  const style = styleFor(normalizedStatus);
  return style.badgeLight;
}

export function leadStatusLabel(
  normalizedStatus: string,
  fallback: string,
): string {
  const style = LEAD_STATUS_STYLES[normalizedStatus];
  return style ? style.label : fallback;
}
