/**
 * Confirmar un email caducado: una persona de la banda lo ha comprobado (lo ha probado, lo ha visto en la web…) y
 * responde de él. Solo sirve para emails «Revisar» (leídos en una web hace más de 90 días): lo de una IA, un rebote o
 * un dominio sin correo no se puede confirmar con un clic; para eso se corrige el email a mano.
 * La confirmación vale `DIAS_VIGENCIA_WEB` días, como una lectura de la web, y luego vuelve a pedir revisión.
 */
import { fiabilidadDelEmail, sePuedeEnviar, type ProcedenciaEmail } from './fiabilidadEmail';

export type CampoEmailConfirmable = 'email_contacto' | 'email_secundario';
const CAMPOS: CampoEmailConfirmable[] = ['email_contacto', 'email_secundario'];

interface LeadConEmails {
  email_contacto?: string | null;
  email_secundario?: string | null;
  datos_fuentes?: unknown;
}

const mapa = (bruto: unknown): Record<string, ProcedenciaEmail | undefined> =>
  bruto && typeof bruto === 'object' && !Array.isArray(bruto) ? (bruto as Record<string, ProcedenciaEmail | undefined>) : {};

/** El campo de email que se puede confirmar (caducado, sin aviso de dominio), o null si no hay ninguno. */
export function campoConfirmable(lead: LeadConEmails, ahora: Date = new Date()): CampoEmailConfirmable | null {
  const fuentes = mapa(lead.datos_fuentes);
  for (const campo of CAMPOS) {
    const email = lead[campo]?.trim();
    const p = fuentes[campo];
    if (!email || !p?.fuente || p.aviso) continue;
    const f = fiabilidadDelEmail({ email, procedencia: p }, ahora);
    if (f.nivel === 'caducado' && !sePuedeEnviar(f)) return campo;
  }
  return null;
}

/** Mapa de procedencia nuevo con `campo` confirmado por una persona hoy. No modifica el que recibe. */
export function confirmarEmailPorPersona(datosFuentes: unknown, campo: CampoEmailConfirmable, ahora: Date = new Date()): Record<string, unknown> {
  const previo = mapa(datosFuentes)[campo];
  const iso = ahora.toISOString();
  return { ...mapa(datosFuentes), [campo]: { ...previo, fuente: 'persona', en: previo?.en ?? iso, verificado_en: iso } };
}
