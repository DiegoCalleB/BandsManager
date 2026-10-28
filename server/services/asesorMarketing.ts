// Asesor de Marketing: lo que la banda ve al abrir la pantalla (modo de hoy y qué publicar) y la
// propuesta de estrategia prerrellenada con IA. El plan lo decide `diagnosticar` sin IA; aquí solo
// se reúnen los datos de la banda y, para la propuesta, se pide un borrador que la banda revisa.

import { loadState } from '../state.js';
import { getAiClient, generateContentWithFallback } from '../ai.js';
import { safeParseJson } from '../utils.js';
import { dbGetEpkConfig, dbGetRegisteredBandById } from '../db.js';
import { dbGetConcerts } from '../db/concerts.js';
import { dbGetEstrategiaMarketing, dbUltimaPublicacion } from '../db/asesorMarketing.js';
import { esConciertoPublicable, hoyIso } from '../utils/paginaConcierto.js';
import { buildBandContextBlock, emptyBandProfile, loadBandProfile } from '../utils/bandProfile.js';
import { diagnosticar, tarjetasDeHoy, type ConciertoParaAsesor, type Diagnostico, type Tarjeta } from '../../src/utils/asesor/diagnostico.js';
import {
  CAMARAS, ESTRATEGIA_INICIAL, ETAPAS, HORAS, OBJETIVOS, sanearEstrategia, type EstrategiaMarketing,
} from '../../src/utils/asesor/estrategia.js';

export interface EstadoAsesor {
  hoy: string;
  diagnostico: Diagnostico;
  tarjetas: Tarjeta[];
  estrategia: EstrategiaMarketing;
  /** false si la banda aún no ha guardado ninguna estrategia: la pantalla le propone empezar por ahí. */
  tieneEstrategia: boolean;
}

/** null si la BD no responde: mejor un error claro que un plan hecho con datos a medias. */
export async function estadoDeHoy(bandId: string, ahora = new Date()): Promise<EstadoAsesor | null> {
  const [guardada, conciertos, ultimaPublicacion] = await Promise.all([
    dbGetEstrategiaMarketing(bandId),
    dbGetConcerts(bandId).catch((e) => {
      console.warn('[Asesor] Sin conciertos:', (e as Error)?.message || e);
      return null;
    }),
    dbUltimaPublicacion(bandId),
  ]);
  if (guardada === undefined || conciertos === null) return null;

  const hoy = hoyIso(ahora);
  const estrategia = guardada ?? ESTRATEGIA_INICIAL;
  const publicables: ConciertoParaAsesor[] = conciertos
    .filter(esConciertoPublicable)
    .map((c) => ({ id: String(c.id), fecha: String(c.fecha).slice(0, 10), sala: String(c.sala || ''), ciudad: String(c.ciudad || '') }));

  const diagnostico = diagnosticar({ hoy, conciertos: publicables, lanzamiento: estrategia.lanzamiento, ultimaPublicacion });
  return { hoy, diagnostico, tarjetas: tarjetasDeHoy(diagnostico, estrategia, hoy), estrategia, tieneEstrategia: guardada !== null };
}

/**
 * Borrador de estrategia a partir de lo que ya sabemos de la banda (bio, género, ciudad, tono).
 * Nunca se guarda solo: vuelve con `revisada: false` y la banda lo corrige. null si no hay IA o
 * lo que devuelve no sirve.
 */
export async function sugerirEstrategia(bandId: string): Promise<EstrategiaMarketing | null> {
  const client = getAiClient();
  if (!client) return null;

  let contextoBanda: string;
  try {
    const perfil = await loadBandProfile(bandId, {
      getBand: (id) => dbGetRegisteredBandById(id),
      getEpk: (id) => dbGetEpkConfig(id),
      getState: () => loadState(),
    });
    contextoBanda = buildBandContextBlock(perfil);
  } catch (e) {
    console.warn('[Asesor] Sin perfil de banda:', (e as Error)?.message || e);
    contextoBanda = buildBandContextBlock(emptyBandProfile(bandId));
  }

  const prompt = `Eres asesor de marketing digital de bandas de música. A partir de lo que sabemos de esta banda, propón un borrador de su estrategia en redes. La banda lo revisará: si un dato no se deduce, deja el valor más prudente y no inventes.

${contextoBanda}

Devuelve SOLO un JSON con esta forma:
{
  "objetivo": uno de ${JSON.stringify(OBJETIVOS)},
  "etapa": uno de ${JSON.stringify(ETAPAS)},
  "publico": "a quién le hablan en una frase: edad, qué escuchan, dónde",
  "horasSemana": uno de ${JSON.stringify(HORAS)},
  "camara": uno de ${JSON.stringify(CAMARAS)},
  "pilares": ["tres temas propios y concretos sobre los que esta banda puede publicar siempre"],
  "lineasRojas": [],
  "referentes": ["hasta tres artistas de su estilo con buena presencia en redes"]
}
Los pilares tienen que ser de ESTA banda (su género, su ciudad, su forma de hablar), no genéricos como "detrás de escena". Sin guiones largos ni superlativos. Deja "lineasRojas" vacío: eso lo decide la banda.`;

  try {
    const respuesta = await generateContentWithFallback(client, { contents: prompt, bandId });
    const borrador = sanearEstrategia(safeParseJson(respuesta.text || ''));
    // Fechas y líneas rojas solo las pone la banda; y un borrador nunca nace revisado.
    return borrador ? { ...borrador, lanzamiento: null, lineasRojas: [], revisada: false } : null;
  } catch (e) {
    console.warn('[Asesor] La IA no pudo proponer estrategia:', (e as Error)?.message || e);
    return null;
  }
}
