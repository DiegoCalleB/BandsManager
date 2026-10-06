/**
 * Piezas de seguridad del seguimiento de correos (aperturas, clics, Dossier PDF) y del webhook
 * de Resend. Antes los endpoints públicos se fiaban de un `leadId` en claro o de un token en
 * base64 sin firma, usaban un secreto por defecto escrito en el código, redirigían a cualquier
 * URL y el webhook de Resend no verificaba nada: cualquiera podía falsear aperturas, escribir en
 * las notas de los leads de otras bandas o usar el dominio de la marca para redirigir a phishing.
 */
import crypto from 'node:crypto';

let avisadoSecretoAleatorio = false;

/**
 * Secreto de las firmas. Si el servidor no tiene JWT_SECRET ni CRON_SECRET se usa uno ALEATORIO
 * por proceso (los enlaces de antes dejan de validar al reiniciar, pero nadie puede firmar con
 * un valor conocido): nunca una constante pública.
 */
const SECRETO_ALEATORIO = crypto.randomBytes(32).toString('hex');
export function secretoDeTracking(): string {
  const env = process.env.JWT_SECRET || process.env.CRON_SECRET;
  if (env) return env;
  if (!avisadoSecretoAleatorio) {
    avisadoSecretoAleatorio = true;
    console.warn('[Tracking] JWT_SECRET/CRON_SECRET no definidos: se usa un secreto aleatorio (los enlaces de seguimiento no sobrevivirán a un reinicio).');
  }
  return SECRETO_ALEATORIO;
}

const hmac = (dato: string) => crypto.createHmac('sha256', secretoDeTracking()).update(dato).digest('hex');

/** Compara en tiempo constante; acepta firmas truncadas (los tokens ya enviados llevan 16 hex). */
export function firmaValida(dato: string, firma: unknown): boolean {
  if (typeof firma !== 'string' || firma.length < 16 || firma.length > 64 || !/^[0-9a-f]+$/i.test(firma)) return false;
  const esperada = hmac(dato).slice(0, firma.length);
  return crypto.timingSafeEqual(Buffer.from(firma.toLowerCase()), Buffer.from(esperada));
}

export interface PayloadTracking {
  leadId: string;
  bandId: string;
  msgId?: string;
}

export function generarToken(payload: PayloadTracking): string {
  const base64Data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${base64Data}.${hmac(base64Data).slice(0, 16)}`;
}

/** Solo acepta tokens FIRMADOS. El formato base64 sin firma, que cualquiera podía fabricar, ya no vale. */
export function decodificarToken(token: unknown): PayloadTracking | null {
  if (typeof token !== 'string') return null;
  const partes = token.trim().split('.');
  if (partes.length !== 2) return null;
  const [base64Data, firma] = partes;
  if (!firmaValida(base64Data, firma)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(base64Data, 'base64url').toString('utf8'));
    const leadId = parsed?.leadId || parsed?.id;
    if (!leadId || !idSeguro(String(leadId))) return null;
    return {
      leadId: String(leadId),
      bandId: String(parsed.bandId || parsed.band_id || ''),
      msgId: parsed.msgId ? String(parsed.msgId) : undefined,
    };
  } catch {
    return null;
  }
}

/** Identificadores que se interpolan en consultas: sin comas, paréntesis ni comodines. */
export function idSeguro(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[A-Za-z0-9_.:@-]{1,160}$/.test(valor);
}

/* ------------------------------------------------------------------ redirecciones */

/** Firma del destino de un clic: los enlaces de correos NUEVOS la llevan y pueden apuntar a cualquier web. */
export function firmarDestino(url: string): string {
  return hmac(`destino:${url}`).slice(0, 24);
}

const DOMINIOS_CONOCIDOS = [
  'bandmanager.io', 'spotify.com', 'instagram.com', 'youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com',
  'twitter.com', 'x.com', 'soundcloud.com', 'bandcamp.com', 'linktr.ee', 'music.apple.com', 'deezer.com',
];

function hostsPropios(): string[] {
  const hosts: string[] = [];
  for (const v of [process.env.APP_URL, process.env.VITE_APP_URL, process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL]) {
    try {
      if (v && v !== 'MY_APP_URL') hosts.push(new URL(v).hostname);
    } catch { /* valor no es una URL */ }
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) hosts.push(process.env.RAILWAY_PUBLIC_DOMAIN);
  return hosts;
}

export function esHttp(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Dominios en los que se puede confiar SIN firma (los de antes de firmar destinos y los propios). */
export function hostConocido(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return [...DOMINIOS_CONOCIDOS, ...hostsPropios()].some((d) => host === d.toLowerCase() || host.endsWith(`.${d.toLowerCase()}`));
  } catch {
    return false;
  }
}

/**
 * ¿A dónde redirigir? Solo http(s), y solo si el destino viene firmado por nosotros o es de un
 * dominio conocido. Si no, a la web de la marca: el dominio de la marca no sirve para redirigir
 * a una página de phishing.
 */
export function destinoSeguro(url: unknown, firma: unknown, porDefecto = 'https://bandmanager.io'): string {
  if (typeof url !== 'string' || !esHttp(url)) return porDefecto;
  if (typeof firma === 'string' && firma && firma.length === firmarDestino(url).length) {
    const esperada = firmarDestino(url);
    if (crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return url;
  }
  return hostConocido(url) ? url : porDefecto;
}

/* ------------------------------------------------------------------ webhook de Resend (Svix) */

/**
 * Verifica la firma Svix que Resend pone en sus webhooks (cabeceras svix-id, svix-timestamp,
 * svix-signature) con el secreto `whsec_...` del webhook. Sin secreto configurado devuelve false:
 * se rechaza todo antes que aceptar eventos de cualquiera.
 */
export function verificarFirmaSvix(opciones: {
  secreto: string | undefined;
  id: string | undefined;
  timestamp: string | undefined;
  firma: string | undefined;
  cuerpo: Buffer | string;
  ahoraMs?: number;
}): boolean {
  const { secreto, id, timestamp, firma, cuerpo } = opciones;
  if (!secreto || !id || !timestamp || !firma) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const ahora = (opciones.ahoraMs ?? Date.now()) / 1000;
  if (Math.abs(ahora - ts) > 5 * 60) return false; // anti-repetición
  const clave = Buffer.from(secreto.replace(/^whsec_/, ''), 'base64');
  const contenido = `${id}.${timestamp}.${Buffer.isBuffer(cuerpo) ? cuerpo.toString('utf8') : cuerpo}`;
  const esperada = crypto.createHmac('sha256', clave).update(contenido).digest('base64');
  return firma
    .split(' ')
    .map((p) => p.split(',')[1])
    .filter(Boolean)
    .some((candidata) => {
      const a = Buffer.from(candidata);
      const b = Buffer.from(esperada);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
}

/** Texto libre que llega de fuera y acaba en las notas del lead: sin saltos de línea y con tope. */
export function textoLibreSeguro(valor: unknown, max: number): string {
  return String(valor ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\P{C}]/gu, '')
    .trim()
    .slice(0, max);
}
