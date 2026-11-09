/**
 * Qué cambia el agente nocturno en un festival tras leer su web oficial. Función pura: recibe el lead, lo que se leyó
 * (`scripts/lib/lectorWebFestival.ts`) y lo que se sabe del buzón (MX, respuesta), y devuelve solo los cambios.
 *
 * Reglas (AGENTS.md §3, «sin evidencia no entran»):
 * - Nunca se borra ni se pisa un email: si desaparece de la web, su fiabilidad caduca sola (`fiabilidadEmail.ts`).
 * - Un email solo se añade si está escrito en la web del festival (ya filtrado por rol y dominio en el lector).
 * - Volver a verlo en la web renueva `verificado_en` y le da evidencia web aunque antes viniera de una IA.
 */

export interface LeadAReverificar {
  email_contacto?: string | null;
  email_secundario?: string | null;
  instagram?: string | null;
  telefono?: string | null;
  festival_start_date?: string | null;
  festival_end_date?: string | null;
  datos_fuentes?: unknown;
}

export interface LecturaDeWeb {
  paginas: number;
  /** Mejor email de booking/contacto del dominio del festival, si lo hay. */
  email: string;
  evidencia: string;
  /** Todos los emails del dominio del festival vistos en sus páginas (para re-verificar el guardado). */
  emailsVistos: string[];
  instagram: string;
  telefono: string;
  inicio: string;
  fin: string;
}

export type ResultadoReverificacion = 'web_caida' | 'reverificado' | 'nuevo' | 'cambio_detectado' | 'desaparecido' | 'sin_email';

export interface Reverificacion {
  resultado: ResultadoReverificacion;
  cambios: Record<string, unknown>;
}

type Procedencia = Record<string, unknown>;

const norm = (e?: string | null) => (e ?? '').trim().toLowerCase();

export function decidirReverificacion(
  lead: LeadAReverificar,
  leido: LecturaDeWeb,
  { ahora = new Date(), mx, respondio = false }: { ahora?: Date; mx?: boolean; respondio?: boolean } = {},
): Reverificacion {
  if (!leido.paginas) return { resultado: 'web_caida', cambios: {} };
  const iso = ahora.toISOString();
  const fuentes: Record<string, Procedencia> = { ...((lead.datos_fuentes as Record<string, Procedencia>) || {}) };
  const cambios: Record<string, unknown> = {};
  const vistos = new Set(leido.emailsVistos.map(norm));
  const actual = norm(lead.email_contacto);
  let resultado: ResultadoReverificacion;

  if (actual && vistos.has(actual)) {
    const previa = fuentes.email_contacto ?? {};
    const conEvidencia = previa.fuente === 'web' || previa.fuente === 'places';
    fuentes.email_contacto = {
      ...previa,
      ...(conEvidencia ? {} : { fuente: 'web', confianza: 'alta', en: iso }),
      verificado_en: iso,
      ...(leido.evidencia ? { pagina: leido.evidencia } : {}),
    };
    resultado = 'reverificado';
  } else if (!actual && leido.email) {
    cambios.email_contacto = leido.email;
    fuentes.email_contacto = { fuente: 'web', confianza: 'alta', en: iso, verificado_en: iso, pagina: leido.evidencia };
    resultado = 'nuevo';
  } else if (actual && leido.email && norm(leido.email) !== actual) {
    if (!norm(lead.email_secundario)) {
      cambios.email_secundario = leido.email;
      fuentes.email_secundario = { fuente: 'web', confianza: 'alta', en: iso, verificado_en: iso, pagina: leido.evidencia };
    }
    resultado = 'cambio_detectado';
  } else {
    resultado = actual ? 'desaparecido' : 'sin_email';
  }

  const email = norm((cambios.email_contacto as string | undefined) ?? lead.email_contacto);
  if (email && fuentes.email_contacto) {
    if (respondio) fuentes.email_contacto = { ...fuentes.email_contacto, confirmado_por_respuesta: true };
    if (mx === false) fuentes.email_contacto = { ...fuentes.email_contacto, aviso: { tipo: 'dominio_inexistente', para: email } };
  }

  if (!lead.instagram && leido.instagram) cambios.instagram = `@${leido.instagram.replace(/^@/, '')}`;
  if (!lead.telefono && leido.telefono) cambios.telefono = leido.telefono;
  const hoy = iso.slice(0, 10);
  // Fechas: se rellenan si faltan o si las guardadas son de una edición ya pasada y la web publica una nueva (futura).
  const fechaPasada = !!lead.festival_start_date && (lead.festival_end_date || lead.festival_start_date) < hoy;
  if ((!lead.festival_start_date || fechaPasada) && leido.inicio && leido.inicio >= hoy) {
    cambios.festival_start_date = leido.inicio;
    cambios.festival_end_date = leido.fin && leido.fin >= leido.inicio ? leido.fin : leido.inicio;
  }

  const fuentesAntes = JSON.stringify(lead.datos_fuentes ?? {});
  if (JSON.stringify(fuentes) !== fuentesAntes) cambios.datos_fuentes = fuentes;
  return { resultado, cambios };
}
