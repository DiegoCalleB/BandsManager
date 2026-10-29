// Asesor de Marketing: lo que la banda ve al abrir la pantalla (modo de hoy, opciones y semana),
// la pieza lista para publicar que prepara la IA, lo que la banda hace con cada idea y la
// propuesta de estrategia. El plan lo deciden `diagnosticar` y `opcionesDeHoy` sin IA; la IA solo
// redacta, y lo que devuelve siempre pasa por un saneador antes de llegar a la banda.

import { loadState } from '../state.js';
import { getAiClient, generateContentWithFallback } from '../ai.js';
import { safeParseJson } from '../utils.js';
import { dbGetEpkConfig, dbGetRegisteredBandById } from '../db.js';
import { dbGetConcerts } from '../db/concerts.js';
import { dbAccionesDesde, dbGetEstrategiaMarketing, dbGuardarAccion, dbGuardarResultado, dbResultadosDesde, dbUltimaPublicacion } from '../db/asesorMarketing.js';
import { esConciertoPublicable, hoyIso } from '../utils/paginaConcierto.js';
import { sanitizeExternalText } from '../utils/promptSafety.js';
import { buildBandContextBlock, emptyBandProfile, loadBandProfile, type BandProfile } from '../utils/bandProfile.js';
import { fechaCorta, sumarDias } from '../../src/utils/campanaConcierto.js';
import { detectarCaida } from '../../src/utils/asesor/rescate.js';
import { agendaDe, type DiaAgenda } from '../../src/utils/asesor/agenda.js';
import { diagnosticar, type ConciertoParaAsesor, type Diagnostico } from '../../src/utils/asesor/diagnostico.js';
import {
  DIAS_APRENDIZAJE, buscarTarjeta, opcionesDeHoy, semana, type Accion, type OpcionesDeHoy,
} from '../../src/utils/asesor/opciones.js';
import { promptPieza, sanearPieza, type Pieza } from '../../src/utils/asesor/pieza.js';
import {
  porMedir, resumenDe, sanearMedidas, tituloDe, lecturaDe, type PorMedir, type ResultadoPieza as ResultadoMedido, type Resumen,
} from '../../src/utils/asesor/resumen.js';
import { bloqueVozAprendida, terminosProhibidosEn, vozAprendidaDe } from '../../src/utils/asesor/vozAprendida.js';
import {
  CAMARAS, ESTRATEGIA_INICIAL, ETAPAS, HORAS, OBJETIVOS, sanearEstrategia, type EstrategiaMarketing,
} from '../../src/utils/asesor/estrategia.js';

export interface EstadoAsesor {
  hoy: string;
  diagnostico: Diagnostico;
  opciones: OpcionesDeHoy;
  /** Piezas hechas cada uno de los últimos 7 días. */
  semana: Array<{ fecha: string; hechas: number }>;
  /** Publicadas hace 2 días o más que esperan sus números. */
  porMedir: PorMedir[];
  /** Lo que se ha aprendido de lo medido; null mientras no haya con qué concluir. */
  resumen: Resumen | null;
  /** Tres semanas con lo fijado (bolos, hitos, lanzamiento) y lo ya publicado. */
  agenda: DiaAgenda[];
  estrategia: EstrategiaMarketing;
  /** false si la banda aún no ha guardado ninguna estrategia: la pantalla le propone empezar por ahí. */
  tieneEstrategia: boolean;
}

interface Contexto {
  hoy: string;
  diagnostico: Diagnostico;
  conciertos: ConciertoParaAsesor[];
  /** Lo medido en el último mes: de ahí salen el rescate, el aprendizaje y el resumen. */
  resultados: ResultadoMedido[];
  estrategia: EstrategiaMarketing;
  tieneEstrategia: boolean;
}

/** Los datos de los que sale el plan de hoy. null si la BD no responde: mejor un error claro que un plan a medias. */
async function contextoDeHoy(bandId: string, ahora: Date): Promise<Contexto | null> {
  const [guardada, conciertos, ultimaPublicacion, resultados] = await Promise.all([
    dbGetEstrategiaMarketing(bandId),
    dbGetConcerts(bandId).catch((e) => {
      console.warn('[Asesor] Sin conciertos:', (e as Error)?.message || e);
      return null;
    }),
    dbUltimaPublicacion(bandId),
    dbResultadosDesde(bandId, sumarDias(hoyIso(ahora), -DIAS_APRENDIZAJE)),
  ]);
  if (guardada === undefined || conciertos === null) return null;

  const hoy = hoyIso(ahora);
  const estrategia = guardada ?? ESTRATEGIA_INICIAL;
  const publicables: ConciertoParaAsesor[] = conciertos
    .filter(esConciertoPublicable)
    .map((c) => ({ id: String(c.id), fecha: String(c.fecha).slice(0, 10), sala: String(c.sala || ''), ciudad: String(c.ciudad || '') }));
  const diagnostico = diagnosticar({ hoy, conciertos: publicables, lanzamiento: estrategia.lanzamiento, ultimaPublicacion, rescate: detectarCaida(resultados, hoy) });
  return { hoy, diagnostico, conciertos: publicables, resultados, estrategia, tieneEstrategia: guardada !== null };
}

export async function estadoDeHoy(bandId: string, ahora = new Date()): Promise<EstadoAsesor | null> {
  const ctx = await contextoDeHoy(bandId, ahora);
  if (!ctx) return null;
  const historial = await dbAccionesDesde(bandId, sumarDias(ctx.hoy, -DIAS_APRENDIZAJE));
  const { conciertos, resultados, ...resto } = ctx;
  return {
    ...resto,
    agenda: agendaDe({ hoy: ctx.hoy, conciertos, lanzamiento: ctx.estrategia.lanzamiento, historial, resultados }),
    opciones: opcionesDeHoy(ctx.diagnostico, ctx.estrategia, ctx.hoy, historial, resultados),
    semana: semana(historial, ctx.hoy),
    porMedir: porMedir(historial, resultados, ctx.hoy),
    resumen: resumenDe(resultados, ctx.hoy),
  };
}

/* ----------------------------------------------------------------- hecho / saltado */

export type ResultadoAccion = 'ok' | 'no_existe' | 'sin_bd';

/** Marca una idea de hoy como hecha o saltada (o la deja pendiente con `null`). El formato lo pone el servidor. */
export async function registrarAccion(bandId: string, tarjetaId: unknown, accion: Accion | null, ahora = new Date()): Promise<ResultadoAccion> {
  const ctx = await contextoDeHoy(bandId, ahora);
  if (!ctx) return 'sin_bd';
  const tarjeta = buscarTarjeta(ctx.diagnostico, ctx.estrategia, ctx.hoy, tarjetaId);
  if (!tarjeta) return 'no_existe';
  return (await dbGuardarAccion(bandId, ctx.hoy, tarjeta.id, tarjeta.formato, accion, tarjeta.titulo)) ? 'ok' : 'sin_bd';
}

/* ----------------------------------------------------------------- cómo le fue a cada pieza */

export type ResultadoMedida = { estado: 'ok'; titulo: string; veredicto: string; mensaje: string } | { estado: 'no_existe' } | { estado: 'sin_bd' } | { estado: 'invalido'; motivo: string };

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Anota los números de una pieza ya publicada. El cliente solo dice cuál (día e id) y los números:
 * el formato y el título salen de la acción «hecho» guardada, y sin esa acción no se anota nada.
 */
export async function registrarResultado(
  bandId: string,
  datos: { fecha?: unknown; tarjetaId?: unknown; alcance?: unknown; guardados?: unknown; alcanceNoSeguidores?: unknown },
  ahora = new Date()
): Promise<ResultadoMedida> {
  const medidas = sanearMedidas(datos);
  if (typeof medidas === 'string') return { estado: 'invalido', motivo: medidas };
  if (typeof datos.fecha !== 'string' || !FECHA_ISO.test(datos.fecha) || typeof datos.tarjetaId !== 'string') return { estado: 'no_existe' };

  const hoy = hoyIso(ahora);
  const acciones = await dbAccionesDesde(bandId, sumarDias(hoy, -DIAS_APRENDIZAJE));
  const hecha = acciones.find((a) => a.accion === 'hecho' && a.fecha === datos.fecha && a.tarjetaId === datos.tarjetaId);
  if (!hecha) return { estado: 'no_existe' };

  const titulo = tituloDe(hecha);
  if (!(await dbGuardarResultado(bandId, { fecha: hecha.fecha, tarjetaId: hecha.tarjetaId, formato: hecha.formato, titulo, ...medidas }))) return { estado: 'sin_bd' };
  const lectura = lecturaDe(medidas);
  return { estado: 'ok', titulo, veredicto: lectura.veredicto, mensaje: lectura.mensaje };
}

/* ----------------------------------------------------------------- la pieza */

/** El perfil de la banda y su ficha para los prompts. Un fallo de contexto nunca tumba la generación. */
async function contextoBanda(bandId: string): Promise<{ bloque: string; perfil: BandProfile }> {
  try {
    const perfil = await loadBandProfile(bandId, {
      getBand: (id) => dbGetRegisteredBandById(id),
      getEpk: (id) => dbGetEpkConfig(id),
      getState: () => loadState(),
    });
    return { bloque: buildBandContextBlock(perfil), perfil };
  } catch (e) {
    console.warn('[Asesor] Sin perfil de banda:', (e as Error)?.message || e);
    const perfil = emptyBandProfile(bandId);
    return { bloque: buildBandContextBlock(perfil), perfil };
  }
}

/** Lo que el sistema ya aprendió de cómo quiere sonar la banda (términos a evitar y reglas suyas). */
async function vozAprendida(bandId: string) {
  const registrada = await dbGetRegisteredBandById(bandId).catch(() => null);
  return vozAprendidaDe(registrada?.dna_expresion);
}

/** El bolo o el estreno de hoy, en una línea. Lo escribe la banda: se sanea. */
function momentoDe(d: Diagnostico, e: EstrategiaMarketing): string {
  if (d.modo === 'concierto' && d.concierto) {
    const c = d.concierto;
    return `Bolo: ${fechaCorta(c.fecha)} en ${sanitizeExternalText(c.sala, 80)}${c.ciudad ? `, ${sanitizeExternalText(c.ciudad, 60)}` : ''}.`;
  }
  if (d.modo === 'lanzamiento' && e.lanzamiento) return `Estreno: «${sanitizeExternalText(e.lanzamiento.titulo, 80)}», ${fechaCorta(e.lanzamiento.fecha)}.`;
  return '';
}

export type ResultadoPieza = { pieza: Pieza } | { error: 'no_existe' | 'sin_bd' | 'sin_ia' };

/** Prepara con IA la pieza de una idea de hoy. El cliente solo manda el id: la idea la recalcula el servidor. */
export async function generarPieza(bandId: string, tarjetaId: unknown, ahora = new Date()): Promise<ResultadoPieza> {
  const ctx = await contextoDeHoy(bandId, ahora);
  if (!ctx) return { error: 'sin_bd' };
  const tarjeta = buscarTarjeta(ctx.diagnostico, ctx.estrategia, ctx.hoy, tarjetaId);
  if (!tarjeta) return { error: 'no_existe' };
  const client = getAiClient();
  if (!client) return { error: 'sin_ia' };

  const [{ bloque, perfil }, aprendida] = await Promise.all([contextoBanda(bandId), vozAprendida(bandId)]);
  const datos = {
    contextoBanda: bloque,
    vozAprendida: bloqueVozAprendida(aprendida),
    matices: { instagram: perfil.toneByPlatform.instagram || undefined, tiktok: perfil.toneByPlatform.tiktok || undefined },
    estrategia: ctx.estrategia,
    tarjeta,
    momento: momentoDe(ctx.diagnostico, ctx.estrategia),
  };

  const intentar = async (prohibidos: string[]): Promise<Pieza | null> => {
    const respuesta = await generateContentWithFallback(client, {
      contents: promptPieza({ ...datos, prohibidos }),
      config: { responseMimeType: 'application/json', temperature: 0.8 },
      bandId,
    });
    return sanearPieza(safeParseJson(respuesta.text || ''), tarjeta.formato, tarjeta.redes);
  };

  try {
    const primera = await intentar([]);
    if (!primera) return { error: 'sin_ia' };
    // Lo que la banda no quiere oír no se confía solo al prompt: se comprueba y, si se ha colado, se reintenta una vez.
    const colados = terminosProhibidosEn(primera, aprendida.evitar);
    if (!colados.length) return { pieza: primera };
    const segunda = await intentar(colados).catch(() => null);
    return { pieza: segunda && terminosProhibidosEn(segunda, aprendida.evitar).length < colados.length ? segunda : primera };
  } catch (e) {
    console.warn('[Asesor] La IA no pudo preparar la pieza:', (e as Error)?.message || e);
    return { error: 'sin_ia' };
  }
}

/* ----------------------------------------------------------------- estrategia */

/**
 * Borrador de estrategia a partir de lo que ya sabemos de la banda (bio, género, ciudad, tono).
 * Nunca se guarda solo: vuelve con `revisada: false` y la banda lo corrige. null si no hay IA o
 * lo que devuelve no sirve.
 */
export async function sugerirEstrategia(bandId: string): Promise<EstrategiaMarketing | null> {
  const client = getAiClient();
  if (!client) return null;

  const prompt = `Eres asesor de marketing digital de bandas de música. A partir de lo que sabemos de esta banda, propón un borrador de su estrategia en redes. La banda lo revisará: si un dato no se deduce, deja el valor más prudente y no inventes.

${(await contextoBanda(bandId)).bloque}

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
