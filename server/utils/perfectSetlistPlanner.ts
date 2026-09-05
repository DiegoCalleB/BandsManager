import { Song, SetlistItem } from "../../src/types.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { tonalidadesSonFiables } from "../../src/utils/harmonicAnalysis.js";
import { BandStyleContext, buildBandStyleContextBlock } from "./bandStyleContext.js";

export type PerfectSetlistActionType = 'reorder' | 'remove_song' | 'add_song' | 'add_block';

/** Todo tipo de item de setlist que no sea una canción — compartido con setlistImport.ts para
 * validar los bloques que la IA detecta al importar un repertorio desde foto/PDF. */
export const BLOCK_TYPES: SetlistItem['tipoItem'][] = [
  'chapa', 'descanso', 'bis', 'bloque_header', 'interludio',
  'presentacion', 'beatbox', 'intro_tema', 'solo_performance', 'cambio_instrumento', 'otro'
];

export interface PerfectSetlistAction {
  type: PerfectSetlistActionType;
  reason: string;
  // reorder
  from_position?: number;
  to_position?: number;
  // remove_song
  item_position?: number;
  // add_song (resuelto server-side a partir de catalog_index — nunca se manda al frontend un
  // índice sin resolver, para que aplicar la acción no dependa de que el frontend vuelva a
  // reconstruir la misma lista de catálogo en el mismo orden)
  song_id?: string;
  song_title?: string;
  insert_at_position?: number;
  // add_block
  block_type?: SetlistItem['tipoItem'];
  title?: string;
  duracion_minutos?: number;
}

export interface PerfectSetlistPlan {
  summary: string;
  actions: PerfectSetlistAction[];
}

interface RawAction {
  type?: string;
  reason?: string;
  from_position?: number;
  to_position?: number;
  item_position?: number;
  catalog_index?: number;
  insert_at_position?: number;
  block_type?: string;
  title?: string;
  duracion_minutos?: number;
}

/**
 * Genera un plan de cambios concretos (reordenar, quitar una canción, añadir una del catálogo,
 * añadir un bloque de presentación/pausa/bis...) para acercar un setlist al "perfecto", en vez de
 * solo señalar problemas de orden como el análisis existente (`setlistAIAnalyzer.ts`).
 *
 * `catalogCandidates` son canciones del repertorio que NO están ya en este setlist — son las
 * únicas que la IA puede proponer añadir. Se identifican ante la IA con un prefijo "C" distinto
 * de la numeración del setlist (1, 2, 3...) para que nunca confunda una posición del setlist con
 * un índice de catálogo — son dos espacios de números completamente separados.
 */
export async function generatePerfectSetlistPlan(
  items: SetlistItem[],
  songsById: Map<string, Song>,
  catalogCandidates: Song[],
  bandContext?: BandStyleContext | null,
  /** Feedback de ESTE intento concreto (ya formateado como bloque de texto) — a diferencia de
   * `bandContext.feedbackMemoryText` (memoria acumulada de intentos anteriores), esto se aplica
   * siempre a la generación actual sin importar el alcance que el usuario haya elegido. */
  immediateFeedbackBlock?: string
): Promise<PerfectSetlistPlan> {
  if (items.length === 0 && catalogCandidates.length === 0) {
    throw new Error("No hay canciones ni en el setlist ni en el catálogo para generar un plan");
  }

  const itemsList = items.map((item, idx) => {
    const position = idx + 1;
    if (item.tipoItem === 'cancion' && item.songId) {
      const song = songsById.get(item.songId);
      if (!song) return `${position}. [canción no encontrada en el catálogo]`;
      return `${position}. 🎵 ${song.titulo} (energía: ${song.energia || 10}/20${song.tonalidad ? `, tonalidad: ${song.tonalidad}` : ''}${song.genero ? `, género: ${song.genero}` : ''})`;
    }
    return `${position}. 📋 [BLOQUE: ${item.tipoItem}] ${item.tituloCustom || ''}`;
  }).join('\n');

  const catalogList = catalogCandidates.length > 0
    ? catalogCandidates.map((s, idx) => `C${idx + 1}. ${s.titulo} (energía: ${s.energia || 10}/20${s.tonalidad ? `, tonalidad: ${s.tonalidad}` : ''}${s.genero ? `, género: ${s.genero}` : ''})`).join('\n')
    : '(no hay canciones en el catálogo fuera de este setlist)';

  const songsInItems = items
    .filter((i) => i.tipoItem === 'cancion' && i.songId)
    .map((i) => songsById.get(i.songId!));
  const incluirTonalidad = tonalidadesSonFiables(songsInItems);

  const prompt = `
Eres un experto en diseñar setlists de conciertos de rock/covers en directo, maximizando el
impacto sobre el público: arco narrativo, curva de energía, variedad armónica y ritmo del show
completo (canciones + bloques de presentación, pausas, bises, cambios de instrumento...).
${buildBandStyleContextBlock(bandContext)}${immediateFeedbackBlock || ''}

SETLIST ACTUAL (posición. tipo):
${itemsList || '(vacío)'}
${incluirTonalidad ? `
Las tonalidades indicadas son datos reales: ten también en cuenta la secuencia armónica (círculo
de quintas, relativas mayor/menor) al proponer el orden.` : ''}

CANCIONES DEL CATÁLOGO DISPONIBLES PARA AÑADIR (NO están en este setlist), numeradas con prefijo "C":
${catalogList}

Tu tarea: proponer un PLAN de cambios concretos para acercar este setlist al "setlist perfecto" —
mejor curva de energía y narrativa, quitando canciones que no encajen bien y añadiendo (SOLO desde
la lista de catálogo de arriba) las que sí, y sugiriendo bloques donde el show lo necesite.

Devuelve SOLO un JSON válido (sin markdown) con esta forma:
{
  "summary": "Resumen de 1-2 frases del cambio global propuesto",
  "actions": [
    { "type": "reorder", "from_position": N, "to_position": M, "reason": "por qué" },
    { "type": "remove_song", "item_position": N, "reason": "por qué sobra o no encaja" },
    { "type": "add_song", "catalog_index": N, "insert_at_position": M, "reason": "por qué encaja aquí" },
    { "type": "add_block", "block_type": "chapa|descanso|bis|bloque_header|interludio|presentacion|beatbox|intro_tema|solo_performance|cambio_instrumento|otro", "title": "Título corto", "duracion_minutos": 1-5, "insert_at_position": M, "reason": "por qué aquí" }
  ]
}

REGLAS IMPORTANTES:
- "item_position", "from_position" y "to_position" son SIEMPRE los números de la lista "SETLIST ACTUAL" de arriba (1-indexados) — nunca los inventes ni salgas de rango.
- "catalog_index" es SIEMPRE el número que aparece tras la "C" en la lista de catálogo (ej. "C3" -> catalog_index: 3) — NUNCA una posición del setlist. Nunca repitas el mismo catalog_index en dos acciones "add_song".
- "insert_at_position" es dónde debería quedar el nuevo elemento tras insertarlo, contando sobre el setlist ACTUAL (1 = al principio, ${items.length + 1} = al final).
- Máximo 6-8 acciones en total, solo las que de verdad mejoren el show — si el setlist ya está bien, devuelve pocas o ninguna ("actions": []).
- Nunca propongas dejar el setlist vacío ni quitar todas las canciones.
`;

  const client = getAiClient();
  const response = await generateContentWithFallback(client, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) {
    throw new Error("No response from AI");
  }

  let jsonStr = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  const raw = JSON.parse(jsonStr) as { summary?: string; actions?: RawAction[] };
  const rawActions = Array.isArray(raw.actions) ? raw.actions : [];

  const maxPosition = items.length;
  const maxInsertPosition = items.length + 1;
  const usedCatalogIndices = new Set<number>();

  const actions: PerfectSetlistAction[] = [];
  for (const a of rawActions) {
    const reason = typeof a.reason === 'string' && a.reason.trim() ? a.reason.trim() : 'Mejora sugerida por la IA.';

    if (a.type === 'reorder') {
      const from = a.from_position;
      const to = a.to_position;
      if (
        typeof from === 'number' && typeof to === 'number' &&
        from >= 1 && from <= maxPosition && to >= 1 && to <= maxPosition && from !== to
      ) {
        actions.push({ type: 'reorder', from_position: from, to_position: to, reason });
      }
      continue;
    }

    if (a.type === 'remove_song') {
      const pos = a.item_position;
      if (typeof pos === 'number' && pos >= 1 && pos <= maxPosition) {
        const item = items[pos - 1];
        if (item.tipoItem === 'cancion' && item.songId) {
          const song = songsById.get(item.songId);
          actions.push({ type: 'remove_song', item_position: pos, song_id: item.songId, song_title: song?.titulo, reason });
        }
      }
      continue;
    }

    if (a.type === 'add_song') {
      const catalogIndex = a.catalog_index;
      const insertAt = a.insert_at_position;
      if (
        typeof catalogIndex === 'number' && catalogIndex >= 1 && catalogIndex <= catalogCandidates.length &&
        !usedCatalogIndices.has(catalogIndex) &&
        typeof insertAt === 'number' && insertAt >= 1 && insertAt <= maxInsertPosition
      ) {
        const song = catalogCandidates[catalogIndex - 1];
        usedCatalogIndices.add(catalogIndex);
        actions.push({ type: 'add_song', song_id: song.id, song_title: song.titulo, insert_at_position: insertAt, reason });
      }
      continue;
    }

    if (a.type === 'add_block') {
      const blockType = a.block_type as SetlistItem['tipoItem'];
      const insertAt = a.insert_at_position;
      if (
        BLOCK_TYPES.includes(blockType) &&
        typeof insertAt === 'number' && insertAt >= 1 && insertAt <= maxInsertPosition
      ) {
        const duracion = typeof a.duracion_minutos === 'number' && Number.isFinite(a.duracion_minutos)
          ? Math.min(15, Math.max(0.5, a.duracion_minutos))
          : 2;
        const title = typeof a.title === 'string' && a.title.trim() ? a.title.trim() : 'Nuevo bloque';
        actions.push({ type: 'add_block', block_type: blockType, title, duracion_minutos: duracion, insert_at_position: insertAt, reason });
      }
      continue;
    }
  }

  return {
    summary: typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary.trim() : 'Plan generado.',
    actions
  };
}
