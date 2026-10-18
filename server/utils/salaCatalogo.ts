/**
 * Catálogo compartido de salas: reglas puras (sin red ni base de datos).
 *
 * Regla de oro: del lead de una banda solo sale al catálogo lo PÚBLICO de la sala (nombre, ciudad, web...),
 * nunca lo que esa banda habló con ella. La fiabilidad se calcula con señales objetivas, no se copia.
 */
import crypto from 'node:crypto';
import { isValidEmailSyntax } from './emailValidator.js';

export type NivelSala = 'sin_verificar' | 'probable' | 'verificada';

/** Lo mínimo de un lead que el catálogo necesita leer. Sin notas, pitches ni historial. */
export interface LeadParaCatalogo {
  id: string;
  band_id: string;
  nombre_sala: string;
  ciudad?: string | null;
  region?: string | null;
  direccion?: string | null;
  tipo?: string | null;
  aforo?: number | null;
  genero?: string | null;
  website?: string | null;
  instagram?: string | null;
  email_contacto?: string | null;
  telefono?: string | null;
  telefono_fijo?: string | null;
  place_id?: string | null;
  es_verificado?: boolean | null;
  estado?: string | null;
  fecha_envio?: string | null;
  /** El Lector detectó que el correo a esta sala rebotó. Lo deriva el repositorio; el texto de las notas no sale de allí. */
  rebotado?: boolean;
  sala_id?: string | null;
}

/** Campos públicos de una sala: lo único que viaja al catálogo. */
export interface CamposPublicosSala {
  clave: string;
  place_id: string | null;
  nombre: string;
  ciudad: string | null;
  region: string | null;
  direccion: string | null;
  tipo: string;
  aforo: number | null;
  genero: string | null;
  website: string | null;
  instagram: string | null;
  email_contacto: string | null;
  telefono: string | null;
}

export interface SenalesFiabilidad {
  placeId: boolean;
  webDeclarada: boolean;
  /** Undefined = no comprobado todavía. */
  webResponde?: boolean;
  emailValido: boolean;
  bandasConEntrega: number;
  bandasConRespuesta: number;
  rebotes: number;
  verificadaEn?: Date | null;
}

export interface Fiabilidad {
  puntuacion: number;
  nivel: NivelSala;
}

const DIAS_ENTREGA_FIABLE = 3;
const DIAS_CADUCIDAD_VERIFICACION = 180;
const MS_DIA = 86_400_000;

/** Estados del lead que solo se alcanzan cuando la sala ha contestado. */
const ESTADOS_CON_RESPUESTA = new Set(['respondido', 'interesado', 'negociando', 'confirmado', 'aplazado', 'no_interesado']);

const LOCALES_DE_ROL = new Set([
  'info', 'contacto', 'contact', 'booking', 'bookings', 'programacion', 'produccion', 'prensa', 'press', 'sala',
  'administracion', 'eventos', 'events', 'management', 'hola', 'hello', 'conciertos', 'comunicacion', 'artistas',
  'direccion', 'teatro', 'club', 'oficina', 'reservas', 'gestion', 'cultura', 'musica',
]);

/** Emails de relleno que los scrapers y las plantillas dejan en los leads («contact@example.com»). */
const DOMINIOS_DE_RELLENO = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'ejemplo.com', 'ejemplo.es', 'email.com', 'domain.com', 'dominio.com', 'yourdomain.com', 'correo.com']);
const TLDS_RESERVADOS = ['.example', '.test', '.invalid', '.localhost'];

const DOMINIOS_PERSONALES = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'yahoo.com', 'yahoo.es',
  'icloud.com', 'live.com', 'msn.com', 'protonmail.com', 'proton.me', 'telefonica.net', 'terra.es',
]);

/** Solo los recintos donde se puede tocar. Medios, agencias, productoras o bandas amigas no son salas, y las bandas son datos de otras bandas. */
const TIPOS_CATALOGABLES = new Set(['sala', 'festival', 'ayuntamiento', 'discoteca']);

/** Leads de prueba que se cuelan en las bases reales («Test», «Test 178652...», «Prueba»). */
const NOMBRE_DE_PRUEBA = /^(test|prueba)(\s|\d|$)/i;

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Texto de comparación: minúsculas, sin acentos ni signos, espacios colapsados. */
export function normalizarTexto(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  return sinAcentos(valor.toLowerCase()).replace(/[^a-z0-9ñ]+/g, ' ').trim();
}

/** Texto para mostrar: sin caracteres de control, espacios colapsados y acotado. */
export function textoPublico(valor: unknown, max = 120): string | null {
  if (typeof valor !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const limpio = valor.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  return limpio || null;
}

/** «Barcelona, España», «Lanuza (Huesca)» o «Madrid / Sierra de Guadarrama» son la ciudad antes de la primera coma, barra o paréntesis. */
export function ciudadPrincipal(valor: unknown): string {
  return typeof valor === 'string' ? valor.split(/[,/(]/)[0].trim() : '';
}

/**
 * Clave de desduplicación. Prefiere el `place_id`; si no hay, nombre y ciudad normalizados. Es conservadora a
 * propósito: fusionar dos salas distintas es peor que dejar un duplicado, así que no quita palabras como
 * «sala» y sin ciudad no hay clave (un nombre suelto es ambiguo).
 */
export function claveSala(p: { placeId?: string | null; nombre?: unknown; ciudad?: unknown }): string | null {
  const place = typeof p.placeId === 'string' ? p.placeId.trim() : '';
  if (place) return `place:${place}`;
  const nombre = normalizarTexto(p.nombre);
  const ciudad = normalizarTexto(ciudadPrincipal(p.ciudad));
  return nombre && ciudad ? `nc:${nombre}|${ciudad}` : null;
}

export const idDeSala = (clave: string): string => `sala-${crypto.createHash('sha1').update(clave).digest('hex').slice(0, 16)}`;

/** Solo http(s) con dominio y sin credenciales: la web se muestra a otras bandas, no puede ser `javascript:` ni nada raro. */
export function urlPublica(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const bruto = valor.trim();
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(bruto) ? bruto : `https://${bruto}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) return null;
    url.username = '';
    url.password = '';
    return url.href.slice(0, 300);
  } catch {
    return null;
  }
}

/** Usuario de Instagram sin @ ni URL; null si no tiene forma de usuario. */
export function instagramPublico(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const usuario = valor.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0].toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(usuario) ? usuario : null;
}

/** Email de la sala (rol: info@, booking@...), nunca de una persona ni de un correo personal (RGPD). */
export function emailDeRol(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const email = valor.trim().toLowerCase();
  if (!isValidEmailSyntax(email)) return null;
  const [local, dominio] = email.split('@');
  if (DOMINIOS_PERSONALES.has(dominio) || DOMINIOS_DE_RELLENO.has(dominio) || TLDS_RESERVADOS.some((t) => dominio.endsWith(t))) return null;
  return LOCALES_DE_ROL.has(sinAcentos(local)) ? email : null;
}

/** Teléfono fijo español (9xxxxxxxx): una línea de la sala. Los móviles suelen ser de una persona. */
export function telefonoFijoEs(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const digitos = valor.replace(/[\s.()-]/g, '').replace(/^(\+34|0034)/, '');
  return /^9\d{8}$/.test(digitos) ? digitos : null;
}

export type MotivoExclusion = 'tipo' | 'prueba' | 'sin_clave';

/** Por qué un lead no entra al catálogo, o null si puede entrar. */
export function motivoExclusion(lead: LeadParaCatalogo): MotivoExclusion | null {
  if (!TIPOS_CATALOGABLES.has((lead.tipo ?? '').trim().toLowerCase() || 'sala')) return 'tipo';
  if (NOMBRE_DE_PRUEBA.test((lead.nombre_sala ?? '').trim())) return 'prueba';
  return claveSala({ placeId: lead.place_id, nombre: lead.nombre_sala, ciudad: lead.ciudad }) ? null : 'sin_clave';
}

/** Campos públicos de un lead, o null si no puede entrar al catálogo (`motivoExclusion`). */
export function camposPublicos(lead: LeadParaCatalogo): CamposPublicosSala | null {
  if (motivoExclusion(lead)) return null;
  const placeId = lead.place_id?.trim() || null;
  const nombre = textoPublico(lead.nombre_sala);
  const clave = claveSala({ placeId, nombre: lead.nombre_sala, ciudad: lead.ciudad });
  if (!clave || !nombre) return null;
  return {
    clave,
    place_id: placeId,
    nombre,
    ciudad: textoPublico(lead.ciudad, 80),
    region: textoPublico(lead.region, 80),
    direccion: textoPublico(lead.direccion, 160),
    tipo: textoPublico(lead.tipo, 40)?.toLowerCase() ?? 'sala',
    aforo: typeof lead.aforo === 'number' && Number.isFinite(lead.aforo) && lead.aforo > 0 ? Math.round(lead.aforo) : null,
    genero: textoPublico(lead.genero, 80),
    website: urlPublica(lead.website),
    instagram: instagramPublico(lead.instagram),
    email_contacto: emailDeRol(lead.email_contacto),
    telefono: telefonoFijoEs(lead.telefono_fijo) ?? telefonoFijoEs(lead.telefono),
  };
}

/** Valor más repetido (ignorando mayúsculas); en empate, el menor alfabéticamente, para que el resultado sea estable. */
function moda<T extends string | number>(valores: Array<T | null | undefined>): T | null {
  const cuentas = new Map<string, { valor: T; n: number }>();
  for (const v of valores) {
    if (v === null || v === undefined || v === '') continue;
    const k = String(v).toLowerCase();
    const previo = cuentas.get(k);
    cuentas.set(k, { valor: previo?.valor ?? v, n: (previo?.n ?? 0) + 1 });
  }
  const orden = [...cuentas.entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]));
  return orden[0]?.[1].valor ?? null;
}

/** Una sola ficha a partir de lo que varias bandas escribieron de la misma sala: manda el consenso. */
export function consolidarCampos(fichas: CamposPublicosSala[]): CamposPublicosSala {
  const primera = fichas[0];
  const campo = <K extends keyof CamposPublicosSala>(k: K) => moda(fichas.map((f) => f[k] as string | number | null)) as CamposPublicosSala[K];
  return {
    clave: primera.clave,
    place_id: campo('place_id'),
    nombre: campo('nombre') ?? primera.nombre,
    ciudad: campo('ciudad'),
    region: campo('region'),
    direccion: campo('direccion'),
    tipo: campo('tipo') ?? 'sala',
    aforo: campo('aforo'),
    genero: campo('genero'),
    website: campo('website'),
    instagram: campo('instagram'),
    email_contacto: campo('email_contacto'),
    telefono: campo('telefono'),
  };
}

/**
 * Una sala ya verificada no pierde ni cambia lo que tiene por lo que escriba una banda: solo se le completan los
 * huecos. Una sala sin verificar sí se actualiza con el consenso nuevo.
 */
export function fusionarConExistente(existente: Partial<CamposPublicosSala> & { nivel?: NivelSala }, nuevo: CamposPublicosSala): CamposPublicosSala {
  if (existente.nivel !== 'verificada') return nuevo;
  const mantener = <K extends keyof CamposPublicosSala>(k: K): CamposPublicosSala[K] =>
    (existente[k] !== null && existente[k] !== undefined && existente[k] !== '' ? existente[k] : nuevo[k]) as CamposPublicosSala[K];
  return {
    clave: nuevo.clave,
    place_id: mantener('place_id'),
    nombre: mantener('nombre'),
    ciudad: mantener('ciudad'),
    region: mantener('region'),
    direccion: mantener('direccion'),
    tipo: mantener('tipo'),
    aforo: mantener('aforo'),
    genero: mantener('genero'),
    website: mantener('website'),
    instagram: mantener('instagram'),
    email_contacto: mantener('email_contacto'),
    telefono: mantener('telefono'),
  };
}

const diasEntre = (desde: Date, hasta: Date) => (hasta.getTime() - desde.getTime()) / MS_DIA;

/** Señales de fiabilidad de una sala a partir de los leads de todas las bandas que la tienen. Cuenta bandas, no sus datos. */
export function senalesDeLeads(leads: LeadParaCatalogo[], ahora: Date, consolidada: CamposPublicosSala, verificadaEn?: Date | null): SenalesFiabilidad {
  const conRespuesta = new Set<string>();
  const conEntrega = new Set<string>();
  let rebotes = 0;
  for (const lead of leads) {
    if (lead.rebotado) {
      rebotes++;
      continue;
    }
    const respondio = ESTADOS_CON_RESPUESTA.has(String(lead.estado ?? ''));
    const envio = lead.fecha_envio ? new Date(lead.fecha_envio) : null;
    const entregaFiable = !!envio && Number.isFinite(envio.getTime()) && diasEntre(envio, ahora) >= DIAS_ENTREGA_FIABLE;
    // Si la sala contestó, el correo llegó.
    if (respondio) {
      conRespuesta.add(lead.band_id);
      conEntrega.add(lead.band_id);
    } else if (entregaFiable) {
      conEntrega.add(lead.band_id);
    }
  }
  return {
    placeId: !!consolidada.place_id,
    webDeclarada: !!consolidada.website,
    emailValido: !!consolidada.email_contacto,
    bandasConEntrega: conEntrega.size,
    bandasConRespuesta: conRespuesta.size,
    rebotes,
    verificadaEn: verificadaEn ?? null,
  };
}

/**
 * Puntuación 0-100 y nivel. Suma: place_id 30, web declarada 5, web que responde 10, email de rol 10, correo entregado sin
 * rebotes 20, respuesta humana de alguna banda 25. Un rebote resta 40. Pasados 180 días desde la última verificación,
 * la puntuación se reduce a la mitad.
 */
export function calcularFiabilidad(s: SenalesFiabilidad, ahora: Date): Fiabilidad {
  let p = 0;
  if (s.placeId) p += 30;
  if (s.webDeclarada) p += 5;
  if (s.webResponde === true) p += 10;
  if (s.emailValido) p += 10;
  if (s.bandasConEntrega >= 1 && s.rebotes === 0) p += 20;
  if (s.bandasConRespuesta >= 1) p += 25;
  if (s.rebotes > 0) p -= 40;
  p = Math.max(0, Math.min(100, p));
  if (s.verificadaEn && diasEntre(s.verificadaEn, ahora) > DIAS_CADUCIDAD_VERIFICACION) p = Math.floor(p / 2);
  const entregada = s.bandasConEntrega >= 1 && s.rebotes === 0;
  const nivel: NivelSala = p >= 70 && entregada ? 'verificada' : p >= 40 ? 'probable' : 'sin_verificar';
  return { puntuacion: p, nivel };
}

/** La fecha de verificación solo se renueva cuando hay señales más fuertes que las que ya había. */
export function siguienteVerificadaEn(
  previa: { verificadaEn: Date | null; bandasConEntrega: number; bandasConRespuesta: number } | null,
  nuevas: SenalesFiabilidad,
  nivel: NivelSala,
  ahora: Date,
): Date | null {
  if (nivel === 'sin_verificar') return previa?.verificadaEn ?? null;
  const masFuerte = !previa || !previa.verificadaEn || nuevas.bandasConEntrega > previa.bandasConEntrega || nuevas.bandasConRespuesta > previa.bandasConRespuesta;
  return masFuerte ? ahora : previa.verificadaEn;
}
