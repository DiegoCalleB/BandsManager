/**
 * Qué buzón es cada email de la web de un festival y cuál sirve para proponer un concierto.
 * Solo valen los de booking y los generales, y solo del dominio del propio festival: prensa, entradas, RRHH, legal,
 * personas y dominios ajenos (ticketera, medio, agencia) no son la puerta para una banda.
 */
export type RolDeEmail = 'booking' | 'contacto' | 'prensa' | 'entradas' | 'rrhh' | 'legal' | 'personal';

export interface EmailEncontrado {
  email: string;
  /** Página donde está escrito. */
  pagina: string;
}

export interface EmailElegido {
  email: string;
  rol: 'booking' | 'contacto';
  evidencia: string;
}

// Orden = prioridad: «soporte@» o «ventas@» nunca son booking aunque la web diga otra cosa.
const PALABRAS_POR_ROL: Array<[Exclude<RolDeEmail, 'personal'>, string[]]> = [
  ['legal', ['privacidad', 'privacy', 'dpo', 'legal', 'lopd', 'rgpd', 'gdpr', 'protecciondatos']],
  ['rrhh', ['rrhh', 'hr', 'empleo', 'trabajo', 'jobs', 'voluntarios', 'voluntariado', 'volunteers', 'cv', 'curriculum']],
  ['entradas', ['entradas', 'tickets', 'ticket', 'soporte', 'support', 'ventas', 'sales', 'atencion', 'cliente', 'clientes', 'abonos']],
  ['prensa', ['prensa', 'press', 'comunicacion', 'comunicación', 'media', 'marketing', 'publicidad', 'rrpp']],
  ['booking', ['booking', 'bookings', 'programacion', 'artistas', 'artists', 'bandas', 'bands', 'talent', 'musica', 'contratacion', 'eventos', 'conciertos', 'actuaciones', 'espectaculos', 'shows', 'comeandplay', 'bewerbung', 'bewerbungen', 'programmation', 'programmazione', 'programacao', 'candidature', 'candidatures', 'artistes', 'artisti', 'kuenstler']],
  ['contacto', ['info', 'contacto', 'contact', 'hola', 'hello', 'organizacion', 'produccion', 'general', 'oficina', 'administracion', 'direccion', 'gerencia', 'secretaria', 'reservas', 'kontakt', 'informace', 'informacion', 'informazioni', 'biuro', 'accueil', 'bonjour', 'mail', 'festival', 'office', 'contatti', 'contato']],
];

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export function rolDelEmail(email: string): RolDeEmail {
  const local = sinTildes(email.trim().toLowerCase().split('@')[0] || '');
  const tokens = local.split(/[._\-+]+/).filter(Boolean);
  for (const [rol, palabras] of PALABRAS_POR_ROL) {
    if (tokens.some((t) => palabras.includes(sinTildes(t)))) return rol;
  }
  // «bandbooking@», o el buzón con el nombre del propio festival («marsatac@marsatac.com»).
  if (tokens.some((t) => t.includes('booking'))) return 'booking';
  if (local === (email.trim().toLowerCase().split('@')[1] || '').split('.')[0]) return 'contacto';
  return 'personal';
}

const SEGUNDO_NIVEL = new Set(['com', 'org', 'net', 'edu', 'gob', 'co', 'nom']);

/** Dominio registrable: «tickets.festival.com.es» → «festival.com.es». */
export function dominioRegistrable(host: string): string {
  const labels = host.toLowerCase().replace(/^www\./, '').split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');
  const n = labels[labels.length - 2];
  const toma = SEGUNDO_NIVEL.has(n) && labels[labels.length - 1].length === 2 ? 3 : 2;
  return labels.slice(-toma).join('.');
}

/** Mismo dominio, o la misma marca con otro sufijo o nombre largo (madcool.es ↔ madcoolfestival.es). */
function mismaMarca(dominioEmail: string, dominioWeb: string): boolean {
  const a = dominioRegistrable(dominioEmail);
  if (a === dominioWeb) return true;
  const [x, y] = [a.split('.')[0], dominioWeb.split('.')[0]].sort((m, n) => m.length - n.length);
  return x.length >= 5 && y.startsWith(x);
}

function dominioDeWeb(website: string): string {
  try {
    return dominioRegistrable(new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`).hostname);
  } catch {
    return '';
  }
}

/** El mejor email para proponer un concierto: booking antes que general, del dominio del festival; si no hay, nada. */
export function elegirEmailDeContacto(candidatos: EmailEncontrado[], website: string): EmailElegido | null {
  const dominio = website ? dominioDeWeb(website) : '';
  if (!dominio) return null;
  let mejor: EmailElegido | null = null;
  for (const c of candidatos) {
    const email = c.email.trim().toLowerCase();
    if (!mismaMarca(email.split('@')[1] || '', dominio)) continue;
    const rol = rolDelEmail(email);
    if (rol !== 'booking' && rol !== 'contacto') continue;
    if (!mejor || (rol === 'booking' && mejor.rol === 'contacto')) mejor = { email, rol, evidencia: c.pagina };
  }
  return mejor;
}
