/**
 * Lógica pura de los enlaces cortos con atribución (bandmanager.io/r/<código>).
 *
 * Sin I/O: códigos, destinos, filtrado de bots, hash de visitante y resumen de clics. La capa de
 * datos está en `server/db/enlacesCortos.ts` y las rutas en `server/routes/enlacesCortos.ts`.
 *
 * Decisión de seguridad: un enlace corto apunta a un DESTINO LÓGICO ('entradas', 'concierto',
 * 'epk', 'fans'), nunca a una URL libre. Así el dominio de la marca no se puede usar para
 * redirigir a un sitio arbitrario (AGENTS.md §1, seguimiento público), y si la banda cambia su
 * enlace de entradas los enlaces ya repartidos siguen valiendo.
 */
import crypto from 'node:crypto';

export const DESTINOS = ['entradas', 'concierto', 'epk', 'fans'] as const;
export type DestinoEnlace = (typeof DESTINOS)[number];

export const CANALES = ['instagram', 'tiktok', 'whatsapp', 'facebook', 'youtube', 'email', 'cartel', 'web', 'otro'] as const;
export type CanalEnlace = (typeof CANALES)[number];

/** Tope de enlaces por banda: lo crea un usuario autenticado, pero sin tope sería un vector de relleno. */
export const MAX_ENLACES_POR_BANDA = 300;

export function esDestino(valor: unknown): valor is DestinoEnlace {
  return typeof valor === 'string' && (DESTINOS as readonly string[]).includes(valor);
}

export function esCanal(valor: unknown): valor is CanalEnlace {
  return typeof valor === 'string' && (CANALES as readonly string[]).includes(valor);
}

/* ------------------------------------------------------------------ códigos */

// Sin 0/o/1/l/i: se dictan por teléfono y se leen en un cartel impreso.
const ALFABETO = '23456789abcdefghjkmnpqrstuvwxyz';
export const LONGITUD_CODIGO = 7;

/** Código aleatorio criptográfico (no secuencial: no se pueden enumerar los enlaces de otras bandas). */
export function generarCodigo(): string {
  const bytes = crypto.randomBytes(LONGITUD_CODIGO);
  let out = '';
  for (let i = 0; i < LONGITUD_CODIGO; i++) out += ALFABETO[bytes[i] % ALFABETO.length];
  return out;
}

const PATRON_CODIGO = new RegExp(`^[${ALFABETO}]{${LONGITUD_CODIGO}}$`);

/** Normaliza (minúsculas) y valida; devuelve null si no es un código nuestro. */
export function normalizarCodigo(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const c = valor.trim().toLowerCase();
  return PATRON_CODIGO.test(c) ? c : null;
}

/** Huella única de (concierto, destino, canal) dentro de una banda. */
export function claveEnlace(concertId: string | null | undefined, destino: DestinoEnlace, canal: CanalEnlace): string {
  return `${concertId || '-'}|${destino}|${canal}`;
}

/* ------------------------------------------------------------------ destinos */

export interface ContextoDestino {
  /** Origen público de la app, sin barra final (p. ej. https://bandmanager.io). */
  baseUrl: string;
  /** Token público de la banda para /epk y /unete (`encodeBandId`). */
  bandToken: string;
  /** Enlace de entradas del concierto (puede no existir o no ser válido). */
  entradasUrl?: string | null;
  /** URL de la página pública del concierto (/e/...), si el concierto es publicable. */
  conciertoUrl?: string | null;
  /** Id del concierto: solo para la campaña UTM. */
  concertId?: string | null;
}

/** Solo http(s). Cualquier otro esquema (javascript:, data:...) o texto vacío se descarta. */
export function urlHttpSegura(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const t = url.trim();
  if (!/^https?:\/\//i.test(t)) return null;
  try {
    const u = new URL(t);
    // Nada de credenciales incrustadas (https://banco.com@sitio-malo.com).
    if (u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** UTM solo para destinos PROPIOS: a una pasarela externa no se le toca la URL (llevan firmas y afiliación). */
export function conUtm(url: string, canal: string, campana: string | null | undefined): string {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', canal);
    u.searchParams.set('utm_medium', 'enlace_corto');
    u.searchParams.set('utm_campaign', campana || 'general');
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * URL final de un enlace corto. Nunca devuelve null: si el destino pedido no se puede servir
 * (concierto sin enlace de entradas, concierto borrado o privado) se degrada a la página del
 * concierto y, en último término, al dossier de la banda. Un enlace repartido no puede acabar en 404.
 */
export function resolverDestino(
  enlace: { destino: DestinoEnlace; canal: string; concert_id?: string | null },
  ctx: ContextoDestino
): { url: string; destinoEfectivo: DestinoEnlace } {
  const campana = ctx.concertId || enlace.concert_id || null;
  const base = ctx.baseUrl.replace(/\/$/, '');
  const epk = () => conUtm(`${base}/epk?b=${encodeURIComponent(ctx.bandToken)}`, enlace.canal, campana);

  if (enlace.destino === 'entradas') {
    const externa = urlHttpSegura(ctx.entradasUrl);
    if (externa) return { url: externa, destinoEfectivo: 'entradas' };
    if (ctx.conciertoUrl) return { url: conUtm(ctx.conciertoUrl, enlace.canal, campana), destinoEfectivo: 'concierto' };
    return { url: epk(), destinoEfectivo: 'epk' };
  }
  if (enlace.destino === 'concierto') {
    if (ctx.conciertoUrl) return { url: conUtm(ctx.conciertoUrl, enlace.canal, campana), destinoEfectivo: 'concierto' };
    return { url: epk(), destinoEfectivo: 'epk' };
  }
  if (enlace.destino === 'fans') {
    const q = new URLSearchParams({ b: ctx.bandToken });
    if (campana) q.set('concertId', campana);
    return { url: conUtm(`${base}/unete?${q.toString()}`, enlace.canal, campana), destinoEfectivo: 'fans' };
  }
  return { url: epk(), destinoEfectivo: 'epk' };
}

/* ------------------------------------------------------------------ quién hace clic */

// Rastreadores y generadores de vista previa: piden el enlace al pegarlo en un chat o una red, no
// son personas. Se les redirige igual (para que la vista previa funcione) pero no cuentan.
const PATRON_BOT =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|slack|discord|skype|linkedin|pinterest|embedly|quora|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|go-http|okhttp|axios|node-fetch|java\//i;

export function esBot(userAgent: unknown): boolean {
  const ua = typeof userAgent === 'string' ? userAgent.trim() : '';
  // Sin user-agent no es un navegador de persona.
  return ua.length === 0 || PATRON_BOT.test(ua);
}

export type Dispositivo = 'movil' | 'tablet' | 'escritorio';

export function dispositivoDe(userAgent: unknown): Dispositivo {
  const ua = typeof userAgent === 'string' ? userAgent : '';
  if (/ipad|tablet|kindle|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return 'tablet';
  if (/mobi|iphone|ipod|android/i.test(ua)) return 'movil';
  return 'escritorio';
}

/**
 * Hash de visitante que NO identifica a la persona: mezcla IP, navegador, el DÍA y un secreto del
 * servidor, y se trunca. Sirve para contar «personas distintas hoy» sin guardar IP, y como la sal
 * incluye el día no permite seguir a nadie de un día para otro (RGPD: sin dato personal, sin cookie).
 */
export function hashVisitante(ip: string, userAgent: string, dia: string, secreto: string): string {
  return crypto.createHmac('sha256', secreto).update(`${dia}|${ip}|${userAgent}`).digest('hex').slice(0, 16);
}

/** Solo el host del Referer (nunca la ruta ni los parámetros): `instagram.com`, `t.co`... */
export function origenDe(referer: unknown): string | null {
  if (typeof referer !== 'string' || !referer) return null;
  try {
    const host = new URL(referer).hostname.toLowerCase().replace(/^www\./, '');
    return host.slice(0, 60) || null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ resumen de clics */

export interface EnlaceBasico {
  code: string;
  canal: string;
  destino: DestinoEnlace;
  concert_id?: string | null;
}

export interface ClicBasico {
  code: string;
  clicked_at: string;
  visitante?: string | null;
}

export interface ResumenEnlace {
  clics: number;
  personas: number;
  ultimoClic: string | null;
  /** Clics por día, del más antiguo al de hoy (7 valores). */
  ultimos7: number[];
}

export interface ResumenClics {
  porEnlace: Record<string, ResumenEnlace>;
  totales: { clics: number; personas: number; ultimos7: number[] };
  /** Canales ordenados de más a menos clics, solo los que tienen alguno. */
  porCanal: Array<{ canal: string; clics: number }>;
}

/** Día (AAAA-MM-DD) en hora de Madrid: la gira es en España y «hoy» no puede cambiar a las 2:00. */
export function diaMadrid(fecha: Date): string {
  return fecha.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}

function ultimosDias(ahora: Date, n: number): string[] {
  const dias: string[] = [];
  for (let i = n - 1; i >= 0; i--) dias.push(diaMadrid(new Date(ahora.getTime() - i * 86_400_000)));
  return dias;
}

export function resumirClics(enlaces: EnlaceBasico[], clics: ClicBasico[], ahora: Date = new Date()): ResumenClics {
  const dias = ultimosDias(ahora, 7);
  const indiceDia = new Map(dias.map((d, i) => [d, i]));
  const canalDe = new Map(enlaces.map((e) => [e.code, e.canal]));

  const porEnlace: Record<string, ResumenEnlace> = {};
  const personasPorEnlace = new Map<string, Set<string>>();
  for (const e of enlaces) {
    porEnlace[e.code] = { clics: 0, personas: 0, ultimoClic: null, ultimos7: new Array(7).fill(0) };
    personasPorEnlace.set(e.code, new Set());
  }

  const personasTotales = new Set<string>();
  const totales7: number[] = new Array(7).fill(0);
  const porCanal = new Map<string, number>();
  let totalClics = 0;

  for (const c of clics) {
    const r = porEnlace[c.code];
    // Clics de enlaces que ya no están en la lista (borrados) no se cuentan en ningún sitio.
    if (!r) continue;
    r.clics++;
    totalClics++;
    if (!r.ultimoClic || c.clicked_at > r.ultimoClic) r.ultimoClic = c.clicked_at;

    if (c.visitante) {
      personasPorEnlace.get(c.code)!.add(c.visitante);
      personasTotales.add(c.visitante);
    }

    const t = new Date(c.clicked_at);
    if (!Number.isNaN(t.getTime())) {
      const i = indiceDia.get(diaMadrid(t));
      if (i !== undefined) {
        r.ultimos7[i]++;
        totales7[i]++;
      }
    }
    const canal = canalDe.get(c.code) || 'otro';
    porCanal.set(canal, (porCanal.get(canal) || 0) + 1);
  }

  for (const [code, set] of personasPorEnlace) porEnlace[code].personas = set.size;

  return {
    porEnlace,
    totales: { clics: totalClics, personas: personasTotales.size, ultimos7: totales7 },
    porCanal: [...porCanal.entries()]
      .map(([canal, n]) => ({ canal, clics: n }))
      .sort((a, b) => b.clics - a.clics || a.canal.localeCompare(b.canal)),
  };
}
