// Tabla única de colores/etiqueta por estado de lead - antes vivía duplicada (y con valores
// distintos entre sí) en BookingCRM.tsx y Dashboard.tsx. La versión de Dashboard.tsx no cubría
//' confirmado',' aplazado',' respondido',' borrador_creado' ni' aprobado_propuesta/respuesta',
// así que un lead en esos estados se pintaba en gris por defecto en la vista móvil. Esta tabla
// es la de BookingCRM.tsx (la completa) - se convierte en la única fuente para ambos sitios.

interface LeadStatusStyle {
 dot: string;
 badgeLight: string;
 badgeDark: string;
 label: string;
}

const DEFAULT_STYLE: LeadStatusStyle = {
 dot:' bg-[var(--ink-2)]/40',
 badgeLight:' bg-slate-50 text-[var(--ink-2)]',
 badgeDark:' bg-[var(--sunken)]/60 text-[var(--ink-3)]',
 label:' ',
};

export const LEAD_STATUS_STYLES: Record<string, LeadStatusStyle> = {
 nuevo: {
 dot:' bg-[var(--acc)]/80',
 badgeLight:' bg-[var(--accent-alt)]/10 text-[var(--accent-alt)]',
 badgeDark:' bg-[var(--acc)]/15 text-[var(--acc)]/80/30',
 label:' Por contactar',
 },
 esperando_respuesta: {
 dot:' bg-[var(--tentative)]',
 badgeLight:' bg-[var(--tentative)]/10 text-[var(--tentative)]/30',
 badgeDark:' bg-[var(--acc)]/15 text-[var(--ink-3)]/30',
 label:' Contactado',
 },
 enviado: {
 dot:' bg-[var(--tentative)]',
 badgeLight:' bg-[var(--tentative)]/10 text-[var(--tentative)]/30',
 badgeDark:' bg-[var(--acc)]/15 text-[var(--ink-3)]/30',
 label:' Contactado',
 },
 respondido: {
 dot:' bg-[var(--tentative)]/80',
 badgeLight:' bg-[var(--tentative)]/5 text-[var(--tentative)]',
 badgeDark:' bg-[var(--tentative)]/15 text-[var(--tentative)]/80/30',
 label:' En conversación',
 },
 negociando: {
 dot:' bg-[var(--acc)]',
 badgeLight:' bg-[var(--acc)]/10 text-[var(--acc)]',
 badgeDark:' bg-[var(--tentative)]/15 text-[var(--tentative)]/80',
 label:' Negociando',
 },
 confirmado: {
 dot:' bg-[var(--ok)]/80',
 badgeLight:' bg-[var(--ok)]-soft text-[var(--ink)] font-bold/80',
 badgeDark:' bg-[var(--ok)]/20 text-[var(--ok)]/80 font-bold/40',
 label:' Confirmado 🎉',
 },
 aplazado: {
 dot:' bg-[var(--acc)]',
 badgeLight:' bg-[var(--surface)] text-[var(--accent-alt)]',
 badgeDark:' bg-[var(--acc)]/15 text-[var(--acc)]/80/30',
 label:' Aplazado ⏳',
 },
 no_interesado: {
 dot:' bg-[var(--surface)]0',
 badgeLight:' bg-[var(--surface)] text-[var(--ink-2)]',
 badgeDark:' bg-[var(--sunken)]/80 text-[var(--ink-3)]',
 label:' Descartado',
 },
 pendiente_aprobacion: {
 dot:' bg-[var(--acc)]/80',
 badgeLight:' bg-[var(--accent-alt)]/10 text-[var(--accent-alt)]',
 badgeDark:' bg-[var(--acc)]/15 text-[var(--acc)]/80/40',
 label:' Borrador por aprobar',
 },
 aprobado: {
 dot:' bg-[var(--ok)]/80',
 badgeLight:' bg-[var(--ok)]-soft text-[var(--ink)]/80',
 badgeDark:' bg-[var(--ok)]/15 text-[var(--ok)]/40',
 label:' En cola de envío',
 },
 aprobado_propuesta: {
 dot:' bg-[var(--ok)]/80',
 badgeLight:' bg-[var(--ok)]-soft text-[var(--ink)]/80',
 badgeDark:' bg-[var(--ok)]/15 text-[var(--ok)]/40',
 label:' En cola de envío',
 },
 aprobado_respuesta: {
 dot:' bg-[var(--ok)]/80',
 badgeLight:' bg-[var(--ok)]-soft text-[var(--ink)]/80',
 badgeDark:' bg-[var(--ok)]/15 text-[var(--ok)]/40',
 label:' En cola de envío',
 },
 borrador_creado: {
 dot:' bg-[var(--acc)]/80',
 badgeLight:' bg-[var(--surface)] text-[var(--tentative)]',
 badgeDark:' bg-[var(--acc)]/15 text-[var(--acc)]/80',
 label:' Borrador en tu email 📝',
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

export function leadStatusLabel(normalizedStatus: string, fallback: string): string {
 const style = LEAD_STATUS_STYLES[normalizedStatus];
 return style ? style.label : fallback;
}
