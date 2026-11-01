// Asesor de Marketing: la presencia de la banda. Reúne lo que BandManager ya sabe (perfil, dossier,
// bolos, enlaces con seguimiento y sus clics, y el perfil de Instagram si está conectado), pasa los
// módulos puros (auditoría 360, kit SEO, clics tras publicar) y lo devuelve junto. Solo LEE y no usa
// IA: es determinista y cuesta cero. Lo que no se puede saber sale como «sin datos», nunca inventado.

import { dbGetEpkConfig, dbGetRegisteredBandById } from '../db.js';
import { dbGetConcerts } from '../db/concerts.js';
import { dbAccionesDesde, dbGetEstrategiaMarketing, dbResultadosDesde, dbResultadosRedDesde } from '../db/asesorMarketing.js';
import { dbClicsDeBanda, dbListarEnlaces, type EnlaceFila } from '../db/enlacesCortos.js';
import { loadState } from '../state.js';
import { baseUrlPublica, esConciertoPublicable, hoyIso } from '../utils/paginaConcierto.js';
import { resumirClics, urlHttpSegura } from '../utils/enlacesCortos.js';
import { loadBandProfile } from '../utils/bandProfile.js';
import { credencialesInstagram } from './credencialesInstagram.js';
import { hostGraphPara } from './publicadores/instagramReels.js';
import { peticionReal, type Peticion } from './asesorInstagram.js';
import { diasEntre, sumarDias } from '../../src/utils/campanaConcierto.js';
import { candidatosAnuncio, DIAS_VENTANA } from '../../src/utils/asesor/anuncios.js';
import { auditar, type DatosAuditoria, type EnlaceDeSeguimiento } from '../../src/utils/asesor/auditoria.js';
import type { BiosPegadas, Presencia } from '../../src/utils/asesor/presencia.js';
import { clicsTrasPublicar, DIAS_CLICS_PIEZA } from '../../src/utils/asesor/clicsPieza.js';
import { estadoClicsEnlace } from '../../src/utils/asesor/diagnosticoMetricas.js';
import { ESTRATEGIA_INICIAL } from '../../src/utils/asesor/estrategia.js';
import { REDES, type Red } from '../../src/utils/asesor/reglasFormato.js';
import { DONDE_USAR_PALABRAS, nombreInstagram, opcionesBio, palabrasClave, type DatosSeo } from '../../src/utils/asesor/seo.js';

const VERSION_GRAPH = 'v21.0';
/** Días de clics que se leen: los 7 del resumen y los de las ventanas de 48 h de las piezas. */
const DIAS_CLICS = DIAS_CLICS_PIEZA + 2;
const MAX_BIO = 1200;
const DIAS_BOLO_CERCANO = 21;
export const MAX_BIOS = 3;

/** Lo que la banda pega: solo las redes conocidas, como texto limpio y acotado. Lo demás se ignora. */
export function sanearBios(raw: unknown): BiosPegadas {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const bios: BiosPegadas = {};
  for (const red of REDES) {
    const v = o[red];
    if (typeof v !== 'string') continue;
    // eslint-disable-next-line no-control-regex
    const limpio = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, MAX_BIO);
    if (limpio) bios[red] = limpio;
  }
  return bios;
}

interface PerfilInstagram {
  nombre: string | null;
  bio: string | null;
  seguidores: number | null;
}

/** Nombre, bio y seguidores de la cuenta conectada. PENDIENTE: validar los campos con una cuenta real. null si no se puede. */
async function leerPerfilInstagram(bandId: string, pedir: Peticion): Promise<PerfilInstagram | null> {
  const cred = await credencialesInstagram(bandId).catch(() => null);
  if (!cred) return null;
  try {
    const url = `${hostGraphPara(cred.token)}/${VERSION_GRAPH}/${encodeURIComponent(cred.igUserId)}?fields=name,biography,followers_count&access_token=${encodeURIComponent(cred.token)}`;
    const r = await pedir(url);
    const c = r.cuerpo as { error?: unknown; name?: unknown; biography?: unknown; followers_count?: unknown };
    if (!r.ok || c?.error) return null;
    const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, MAX_BIO) : null);
    return { nombre: texto(c.name), bio: texto(c.biography), seguidores: typeof c.followers_count === 'number' && c.followers_count >= 0 ? c.followers_count : null };
  } catch {
    return null;
  }
}

/** A dónde debería llevar el enlace de la bio: al bolo si está cerca, y si no al dossier. */
export function destinoRecomendado(bolo: { id: string; dias: number; tieneEntradas: boolean } | null): Presencia['enlaces']['recomendado'] {
  if (bolo && bolo.dias <= DIAS_BOLO_CERCANO) {
    return bolo.tieneEntradas
      ? { destino: 'entradas', concertId: bolo.id, motivo: `Faltan ${bolo.dias} días para el bolo: que el clic llegue directo a las entradas.` }
      : { destino: 'concierto', concertId: bolo.id, motivo: `Faltan ${bolo.dias} días para el bolo: que el clic llegue a su página.` };
  }
  return { destino: 'epk', concertId: null, motivo: 'Sin bolo cerca, el dossier es la mejor puerta de entrada.' };
}

const limpiar = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function presenciaDeLaBanda(bandId: string, biosRaw: unknown, ahora = new Date(), pedir: Peticion = peticionReal): Promise<Presencia | null> {
  const hoy = hoyIso(ahora);
  const bios = sanearBios(biosRaw);

  const desdeResultados = sumarDias(hoy, -DIAS_VENTANA - 28);
  const [guardada, epk, conciertos, enlaces, acciones, perfilIg, resultados, resultadosRed] = await Promise.all([
    dbGetEstrategiaMarketing(bandId),
    dbGetEpkConfig(bandId).catch(() => null),
    dbGetConcerts(bandId).catch(() => null),
    dbListarEnlaces(bandId).catch(() => [] as EnlaceFila[]),
    dbAccionesDesde(bandId, sumarDias(hoy, -DIAS_CLICS_PIEZA)),
    leerPerfilInstagram(bandId, pedir),
    // Lo que la banda midió: de ahí sale qué merece dinero. Se lee más atrás de la ventana porque TikTok compara con «lo habitual».
    dbResultadosDesde(bandId, desdeResultados),
    dbResultadosRedDesde(bandId, desdeResultados),
  ]);
  if (guardada === undefined || conciertos === null) return null;
  const estrategia = guardada ?? ESTRATEGIA_INICIAL;
  const redes = estrategia.redes;

  const perfil = await loadBandProfile(bandId, {
    getBand: (id) => dbGetRegisteredBandById(id),
    getEpk: async () => epk,
    getState: () => loadState(),
  });

  // El próximo bolo público (de hoy en adelante).
  const proximo = conciertos
    .filter(esConciertoPublicable)
    .map((c) => ({ c, fecha: String(c.fecha).slice(0, 10) }))
    .filter(({ fecha }) => fecha >= hoy)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))[0];
  const bolo = proximo
    ? { id: String(proximo.c.id), fecha: proximo.fecha, sala: limpiar(proximo.c.sala), dias: diasEntre(hoy, proximo.fecha), tieneEntradas: !!urlHttpSegura(proximo.c.entradas_url || proximo.c.entradasUrl) }
    : null;

  // Enlaces con seguimiento: por red, el del próximo bolo si existe y, si no, el más reciente.
  const base = baseUrlPublica();
  const enlacePorRed = new Map<Red, EnlaceFila>();
  for (const e of enlaces) {
    if (!(REDES as readonly string[]).includes(e.canal)) continue;
    const actual = enlacePorRed.get(e.canal as Red);
    const esDelBolo = !!bolo && e.concert_id === bolo.id;
    if (!actual || esDelBolo || (actual.concert_id !== bolo?.id && (e.created_at ?? '') >= (actual.created_at ?? ''))) enlacePorRed.set(e.canal as Red, e);
  }
  const enlacesAuditoria: Partial<Record<Red, EnlaceDeSeguimiento>> = {};
  for (const [red, e] of enlacePorRed) enlacesAuditoria[red] = { destino: e.destino, concertId: e.concert_id };

  // Clics: una sola lectura, de la que salen los 7 días por red y las ventanas de 48 h de cada pieza.
  const clics = enlaces.length
    ? await dbClicsDeBanda(bandId, new Date(ahora.getTime() - DIAS_CLICS * 86_400_000).toISOString()).catch(() => [])
    : [];
  const resumen = resumirClics(enlaces, clics, ahora);
  const clics7PorRed = (red: Red) => resumen.porCanal.find((c) => c.canal === red)?.clics ?? 0;

  const enlaceYoutube = enlacePorRed.get('youtube');
  const datosSeo: DatosSeo = {
    nombre: perfil.name, genero: perfil.genre, ciudad: perfil.location,
    proximoBolo: bolo ? { sala: bolo.sala, fecha: bolo.fecha } : null,
    fraseImpacto: limpiar(epk?.fraseImpacto) || undefined,
    enlaceYoutube: enlaceYoutube ? `${base}/r/${enlaceYoutube.code}` : null,
  };

  const datos: DatosAuditoria = {
    hoy, nombre: perfil.name, genero: perfil.genre, ciudad: perfil.location, redes,
    perfiles: {
      instagram: { url: perfil.instagram, bio: bios.instagram ?? perfilIg?.bio ?? null },
      tiktok: { url: perfil.tiktok, bio: bios.tiktok ?? null },
      youtube: { url: perfil.youtube, bio: bios.youtube ?? null },
    },
    nombreInstagram: perfilIg?.nombre ?? null,
    spotify: limpiar(epk?.enlacesRedes?.spotify) || undefined,
    biografiaEpk: perfil.bio,
    logo: !!limpiar(epk?.logoUrl),
    fotos: Array.isArray(epk?.bandPhotos) ? epk!.bandPhotos.length : 0,
    emailBooking: !!limpiar(epk?.contactoBooking?.email),
    proximoBolo: bolo,
    enlaces: enlacesAuditoria,
  };

  const seguidores = perfilIg?.seguidores ?? null;
  const referentes = [...new Set([...estrategia.referentes, ...(Array.isArray(epk?.bandasSimilares) ? epk!.bandasSimilares : [])].map((x) => limpiar(x)).filter(Boolean))].slice(0, 3);
  return {
    auditoria: auditar(datos),
    kit: {
      palabrasClave: palabrasClave(datosSeo),
      dondeUsar: DONDE_USAR_PALABRAS,
      nombreInstagram: redes.includes('instagram') && perfil.name ? nombreInstagram(datosSeo) : null,
      bios: redes.map((red) => ({ red, opciones: opcionesBio(red, datosSeo) })).filter((b) => b.opciones.length > 0),
    },
    enlaces: {
      recomendado: destinoRecomendado(bolo),
      porRed: redes.map((red) => {
        const e = enlacePorRed.get(red);
        return { red, url: e ? `${base}/r/${e.code}` : null, destino: e?.destino ?? null, concertId: e?.concert_id ?? null, clics7: clics7PorRed(red) };
      }),
      clicsTrasPublicar: clicsTrasPublicar(acciones, enlaces, clics, hoy, redes),
    },
    anuncios: candidatosAnuncio({
      hoy, resultados, resultadosRed, ciudad: perfil.location, genero: perfil.genre, referentes,
      proximoBolo: proximo && bolo ? { sala: bolo.sala, ciudad: limpiar(proximo.c.ciudad), dias: bolo.dias, tieneEntradas: bolo.tieneEntradas } : null,
    }),
    instagram: {
      leido: !!perfilIg,
      seguidores,
      clicsSemanalesEstado: seguidores ? estadoClicsEnlace(clics7PorRed('instagram'), seguidores) : 'sin_datos',
    },
  };
}
