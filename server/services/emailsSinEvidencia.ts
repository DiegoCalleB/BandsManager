/**
 * Puerta final de los emails de un lead: lo que aportó una IA o un buscador solo se queda si hay evidencia.
 *
 * Antes (`avisarEmailsDudosos`) un email de la IA se guardaba aunque no se pudiera comprobar, con un aviso.
 * Ahora se descarta: un email deducido es un email inventado, y mandar un pitch a una dirección que no
 * existe daña el remitente de la banda. Se fían sin volver a mirar los de Google Maps, la web de la propia sala
 * y el catálogo (datos estructurados de OSM, Wikidata o la Generalitat), y lo que escribe una persona a mano.
 */
import { fetchUrlExternaSegura } from '../utils/ssrfGuard.js';
import { isValidEmailCached } from '../utils/emailValidator.js';
import { verificarEmailConEvidencia, type MotivoDescarte, type ResultadoEvidencia } from '../utils/emailConEvidencia.js';
import { procedenciaValida, type CamposDeEnriquecimiento, type FuenteDato } from '../utils/procedenciaDatos.js';

const CAMPOS_EMAIL = ['email_contacto', 'email_secundario'] as const;
type CampoEmail = (typeof CAMPOS_EMAIL)[number];

/** Fuentes cuyo email hay que comprobar: son suposiciones, no hechos. */
const FUENTES_A_COMPROBAR = new Set<FuenteDato>(['ia', 'buscador']);

export interface DescarteDeEmail {
  campo: CampoEmail;
  motivo: MotivoDescarte;
}

export interface OpcionesDescarte {
  /** Cómo se comprueba un email. Por defecto, leyendo la web de la sala por el guard SSRF y consultando su DNS. */
  verificar?: (email: string, website?: string) => Promise<ResultadoEvidencia>;
  /** Qué hacer con un email sin procedencia anotada: respetarlo (lo escribió una persona) o tratarlo como de la IA. */
  sinProcedencia?: 'respetar' | 'ia';
  ahora?: Date;
}

type LeadConEmails = Partial<Record<CampoEmail, string>> & CamposDeEnriquecimiento & { website?: string; notas?: string };

async function leerPaginaSegura(url: string): Promise<string | null> {
  const res = await fetchUrlExternaSegura(url, {
    timeoutMs: 4000,
    maxBytes: 1_500_000,
    maxRedirects: 3,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  });
  return res.statusCode >= 200 && res.statusCode < 300 ? res.text() : null;
}

/** Comprueba un email en la web de su sala: lee sus páginas por el guard SSRF y consulta el DNS de su dominio. */
export const verificarEmailEnSuWeb = (email: string, website?: string): Promise<ResultadoEvidencia> =>
  verificarEmailConEvidencia(email, { website, leerPagina: leerPaginaSegura, dominioConCorreo: isValidEmailCached });
const verificarEnLaWeb = verificarEmailEnSuWeb;

/**
 * Comprueba los emails del lead que aportó una IA o un buscador: se quedan los que aparecen en la web de la sala
 * (y pasan a constar como dato de la web); el resto se vacía. Devuelve lo descartado para registrarlo.
 */
export async function descartarEmailsSinEvidencia(lead: LeadConEmails, opciones: OpcionesDescarte = {}): Promise<DescarteDeEmail[]> {
  const verificar = opciones.verificar ?? verificarEnLaWeb;
  const ahora = opciones.ahora ?? new Date();
  const procedencia = procedenciaValida(lead.datos_fuentes);
  const descartes: DescarteDeEmail[] = [];
  let cambioProcedencia = false;

  for (const campo of CAMPOS_EMAIL) {
    const email = lead[campo];
    if (!email) continue;
    const fuente: FuenteDato | undefined = procedencia[campo]?.fuente ?? (opciones.sinProcedencia === 'ia' ? 'ia' : undefined);
    if (!fuente || !FUENTES_A_COMPROBAR.has(fuente)) continue;

    const resultado = await verificar(email, lead.website);
    if ('motivo' in resultado) {
      lead[campo] = '';
      delete procedencia[campo];
      descartes.push({ campo, motivo: resultado.motivo });
    } else {
      procedencia[campo] = { fuente: 'web', confianza: 'alta', en: ahora.toISOString() };
    }
    cambioProcedencia = true;
  }

  if (cambioProcedencia) lead.datos_fuentes = procedencia;
  if (descartes.length > 0) {
    console.warn(`[Emails] Sin evidencia, descartado(s) en '%s': %s`, (lead as { nombre_sala?: string }).nombre_sala ?? '(sin nombre)', descartes.map((d) => `${d.campo} (${d.motivo})`).join(', '));
    // Sin repetir la dirección: lo que no se pudo comprobar no vuelve a aparecer en pantalla como si valiera.
    const nota = `[${ahora.toISOString().slice(0, 10)}] Email sugerido por una IA o un buscador descartado: no se pudo comprobar en su web. Añádelo a mano si lo conoces.`;
    lead.notas = lead.notas ? `${nota}\n${lead.notas}` : nota;
  }
  return descartes;
}

interface ContactoExtraido {
  id?: string;
  email_contacto?: string;
  fuente?: string;
  confianza?: string;
}

/** Lo mínimo que se sabe de cada sala que se mandó a extraer: su id y su web. */
interface SalaAExtraer {
  place_id?: string;
  id?: string;
  nombre_sala?: string;
  website?: string;
}

/**
 * Los contactos que devuelve la IA al «extraer emails»: cada email se comprueba en la web de SU sala (se emparejan por id).
 * El que no se puede comprobar se vacía y la fuente explica por qué, para que no se tome por un dato.
 */
export async function depurarContactosExtraidos<T extends ContactoExtraido>(
  extraidos: T[],
  salas: SalaAExtraer[],
  opciones: Pick<OpcionesDescarte, 'verificar'> = {},
): Promise<{ extraidos: T[]; descartados: number }> {
  const verificar = opciones.verificar ?? verificarEnLaWeb;
  const webPorId = new Map(salas.map((s) => [String(s.place_id || s.id || s.nombre_sala), s.website || '']));
  let descartados = 0;
  for (const contacto of extraidos) {
    if (!contacto.email_contacto) continue;
    const resultado = await verificar(contacto.email_contacto, webPorId.get(String(contacto.id)));
    if (!('motivo' in resultado)) continue;
    contacto.email_contacto = '';
    contacto.confianza = 'baja';
    contacto.fuente = `Email descartado: no se pudo comprobar en su web (${resultado.motivo})`;
    descartados++;
  }
  return { extraidos, descartados };
}

/** Un solo email que devolvió la IA para una sala con esa web: se queda con evidencia, si no se vacía. */
export async function depurarEmailDeIA(
  email: string | undefined,
  website: string | undefined,
  opciones: Pick<OpcionesDescarte, 'verificar'> = {},
): Promise<{ valor: string; descartado: boolean }> {
  if (!email) return { valor: '', descartado: false };
  const resultado = await (opciones.verificar ?? verificarEnLaWeb)(email, website);
  return 'motivo' in resultado ? { valor: '', descartado: true } : { valor: email, descartado: false };
}

/**
 * Ficha que devuelve la IA con cada dato como `{ valor, confianza, fuente }` (o como texto suelto): si su email no aparece
 * en la web de la sala, se sustituye por uno vacío que explica por qué. Modifica la ficha.
 */
export async function depurarEmailEnFichaIA(ficha: Record<string, unknown>, website: string | undefined, opciones: Pick<OpcionesDescarte, 'verificar'> = {}): Promise<boolean> {
  const dato = ficha.email_contacto as { valor?: unknown } | string | null | undefined;
  const email = dato && typeof dato === 'object' ? dato.valor : dato;
  if (typeof email !== 'string' || !email) return false;
  const { descartado } = await depurarEmailDeIA(email, website, opciones);
  if (descartado) ficha.email_contacto = { valor: '', confianza: 'baja', fuente: 'Email descartado: no se pudo comprobar en su web' };
  return descartado;
}
