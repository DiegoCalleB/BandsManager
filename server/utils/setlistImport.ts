import { getAiClient, generateContentWithFallback } from "../ai.js";
import { SetlistItem } from "../../src/types.js";
import { BLOCK_TYPES } from "./perfectSetlistPlanner.js";

export type ParsedSetlistItemType = 'song' | 'block';

export interface ParsedSetlistItem {
  type: ParsedSetlistItemType;
  /** Título tal cual lo leyó la IA en la foto/PDF — para "song" es el nombre del tema; para
   * "block" es la etiqueta del bloque (p.ej. "BIS", "Pausa técnica"). */
  titulo: string;
  /** Solo cuando type === 'block'; validado contra BLOCK_TYPES antes de devolverlo. */
  blockType?: SetlistItem['bloqueSubtipo'];
}

export interface ParsedSetlistResult {
  /** Nombre de repertorio sugerido por la IA (p.ej. a partir de un título escrito a mano en la
   * foto, o genérico si no hay ninguno reconocible) — el usuario lo puede cambiar antes de crear. */
  nombreSugerido: string;
  items: ParsedSetlistItem[];
}

interface RawParsedItem {
  type?: string;
  titulo?: string;
  blockType?: string;
}

/**
 * Lee una foto o PDF de un repertorio ya impreso (a mano o a máquina) y devuelve la lista
 * ORDENADA de temas y bloques de estructura (BIS, pausa, presentación...) tal como aparecen.
 * No inventa energía/tonalidad/bpm — eso no suele venir en un papel impreso, y de todos modos el
 * repertorio importado se resuelve contra el catálogo real de la banda (ver la ruta que llama a
 * esta función), que es de donde sale la energía real de cada tema si ya existe.
 */
export async function parseSetlistFromFile(fileBuffer: Buffer, mimeType: string): Promise<ParsedSetlistResult> {
  const prompt = `Eres un experto leyendo repertorios/setlists de conciertos, ya sea una foto de una
hoja impresa o escrita a mano, o un PDF. Extrae TODOS los temas y marcas de estructura en el ORDEN
EXACTO en que aparecen (de arriba a abajo; si hay columnas, primero toda la izquierda y luego la
derecha, salvo que sea evidente que se leen en otro orden).

Distingue dos tipos de línea:
- "song": el nombre real de una canción.
- "block": una marca de estructura del show, NO una canción — cosas como "BIS", "PAUSA/DESCANSO",
  "PRESENTACIÓN", "CAMBIO DE INSTRUMENTO", "SOLO", una sección con nombre ("BLOQUE 2")... Usa
  block_type: "bis" | "descanso" | "presentacion" | "chapa" | "interludio" | "beatbox" |
  "intro_tema" | "solo_performance" | "cambio_instrumento" | "bloque_header" | "otro".

Si hay un título/nombre de repertorio escrito (p.ej. en la cabecera de la hoja), inclúyelo en
"nombreSugerido"; si no hay ninguno reconocible, pon algo genérico tipo "Repertorio importado".

Devuelve SOLO JSON válido (sin markdown), con esta forma exacta:
{
  "nombreSugerido": "string",
  "items": [
    { "type": "song", "titulo": "Nombre exacto tal como está escrito" },
    { "type": "block", "titulo": "Texto tal como está escrito", "blockType": "bis" }
  ]
}

IMPORTANTE:
- Transcribe los títulos TAL CUAL se leen, sin corregir ni traducir — el emparejamiento contra el
  catálogo real de la banda se hace después, en otro paso.
- Si la letra es ambigua o ilegible en algún punto, transcribe tu mejor lectura — no la omitas.
- No añadas temas que no estén escritos, ni completes un repertorio "típico".`;

  const client = getAiClient();
  const response = await generateContentWithFallback(client, {
    contents: [
      { inlineData: { mimeType, data: fileBuffer.toString('base64') } },
      { text: prompt }
    ]
  });

  const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) {
    throw new Error("No se pudo leer el repertorio (sin respuesta de la IA)");
  }

  let jsonStr = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  const raw = JSON.parse(jsonStr) as { nombreSugerido?: string; items?: RawParsedItem[] };
  const rawItems = Array.isArray(raw.items) ? raw.items : [];

  const items: ParsedSetlistItem[] = [];
  for (const it of rawItems) {
    const titulo = typeof it.titulo === 'string' ? it.titulo.trim() : '';
    if (!titulo) continue;

    if (it.type === 'block') {
      const blockType = BLOCK_TYPES.includes(it.blockType as SetlistItem['bloqueSubtipo'])
        ? (it.blockType as SetlistItem['bloqueSubtipo'])
        : 'otro';
      items.push({ type: 'block', titulo, blockType });
    } else {
      // Cualquier valor que no sea exactamente "block" se trata como canción — más seguro que
      // descartar la línea si la IA manda un type inesperado.
      items.push({ type: 'song', titulo });
    }
  }

  if (items.length === 0) {
    throw new Error("No se detectó ningún tema en la imagen/documento");
  }

  return {
    nombreSugerido: typeof raw.nombreSugerido === 'string' && raw.nombreSugerido.trim()
      ? raw.nombreSugerido.trim()
      : 'Repertorio importado',
    items
  };
}
