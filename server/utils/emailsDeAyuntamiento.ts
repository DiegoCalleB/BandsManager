/**
 * Qué buzón de un ayuntamiento sirve para proponer un concierto o una actuación en fiestas. Misma política que
 * `emailsDeContacto.ts` (festivales): solo del dominio del ayuntamiento, nunca personas, y nada que no contrate música.
 * Orden de preferencia: festejos > cultura > juventud > turismo > general.
 */
import { dominioRegistrable } from './emailsDeContacto.js';
import type { EmailEncontrado } from './emailsDeContacto.js';

export type RolMunicipal = 'festejos' | 'cultura' | 'juventud' | 'turismo' | 'general' | 'otro';

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Orden = prioridad de descarte: «prensa» o «rrhh» ganan a cualquier otra palabra del mismo buzón.
const DESCARTAR = ['prensa', 'comunicacion', 'rrhh', 'personal', 'empleo', 'intervencion', 'tesoreria', 'recaudacion', 'urbanismo', 'obras', 'policia', 'padron', 'secretaria', 'registro', 'sede', 'deportes', 'educacion', 'sanidad', 'servicios', 'medioambiente', 'igualdad', 'bienestar', 'privacidad', 'dpd', 'lopd', 'webmaster', 'soporte', 'quejas', 'sugerencias', 'transparencia'];
const POR_ROL: Array<[Exclude<RolMunicipal, 'otro'>, string[]]> = [
  ['festejos', ['festejos', 'fiestas', 'festes', 'festas', 'festeig', 'festivales', 'eventos']],
  ['cultura', ['cultura', 'kultura', 'culturais', 'cultural', 'agenda', 'programacion', 'musica']],
  ['juventud', ['juventud', 'xuventude', 'joventut', 'gazteria', 'juventudes']],
  ['turismo', ['turismo', 'turisme', 'turismoa']],
  ['general', ['info', 'informacion', 'contacto', 'contact', 'ayuntamiento', 'concello', 'ajuntament', 'udala', 'alcaldia', 'alcaldía', 'atencion', 'oficina', 'general', 'correo', 'administracion', 'ayto']],
];

export function rolDeEmailMunicipal(email: string): RolMunicipal {
  const local = sinTildes(email.trim().toLowerCase().split('@')[0] || '');
  const tokens = local.split(/[._\-+]+/).filter(Boolean);
  if (tokens.some((t) => DESCARTAR.includes(t))) return 'otro';
  for (const [rol, palabras] of POR_ROL) if (tokens.some((t) => palabras.includes(t))) return rol;
  return 'otro';
}

const PRIORIDAD: RolMunicipal[] = ['festejos', 'cultura', 'juventud', 'turismo', 'general'];

export interface EmailMunicipalElegido {
  email: string;
  rol: Exclude<RolMunicipal, 'otro'>;
  evidencia: string;
}

function dominioDeWeb(web: string): string {
  try {
    return dominioRegistrable(new URL(/^https?:\/\//i.test(web) ? web : `https://${web}`).hostname);
  } catch {
    return '';
  }
}

export function elegirEmailDeAyuntamiento(candidatos: EmailEncontrado[], web: string): EmailMunicipalElegido | null {
  const dominio = dominioDeWeb(web);
  if (!dominio) return null;
  let mejor: EmailMunicipalElegido | null = null;
  for (const cand of candidatos) {
    const email = cand.email.trim().toLowerCase();
    if (dominioRegistrable(email.split('@')[1] || '') !== dominio) continue;
    const rol = rolDeEmailMunicipal(email);
    if (rol === 'otro') continue;
    if (!mejor || PRIORIDAD.indexOf(rol) < PRIORIDAD.indexOf(mejor.rol)) mejor = { email, rol, evidencia: cand.pagina };
  }
  return mejor;
}
