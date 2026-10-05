import { Song, SetlistItem } from "../../src/types.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { tonalidadesSonFiables } from "../../src/utils/harmonicAnalysis.js";
import { BandStyleContext, buildBandStyleContextBlock } from "./bandStyleContext.js";

export interface AISetlistSuggestion {
  priority: 'high' | 'medium' | 'low';
  category: 'pacing' | 'narrative' | 'psychology' | 'recovery' | 'contrast';
  title: string;
  issue: string;
  suggestion: string;
  impact: string;
  songs_involved?: string[];
  /** Reordenamiento concreto que aplicaría esta sugerencia, usando los números de posición EXACTOS
   * de la lista que se le pasó al modelo (1-indexados) — así "aplicar" una sugerencia de la IA
   * ejecuta justo estos dos números, nunca una interpretación nuestra del texto libre de arriba.
   * Ausente/null cuando la sugerencia no consiste en mover una canción de sitio (p.ej. una de
   * categoría "psychology" sobre cómo presentar un tema, no sobre su posición). */
  suggested_reorder?: { from_position: number; to_position: number } | null;
}

export interface AdvancedSetlistAnalysis {
  narrativeArc: string;
  psychologicalFlow: string;
  suggestions: AISetlistSuggestion[];
  overallScore: number; // 0-100
  strengths: string[];
  areasForImprovement: string[];
}

/**
 * Análisis avanzado de setlist usando IA (Gemini Flash o Claude).
 * Evalúa pacing, narrativa emocional, psicología del público, etc.
 */
export async function analyzeSetlistWithAI(
  songs: (Song & { position: number })[],
  bandContext?: BandStyleContext | null
): Promise<AdvancedSetlistAnalysis> {
  if (songs.length === 0) {
    throw new Error("No songs to analyze");
  }

  const sorted = songs.sort((a, b) => a.position - b.position);
  // Solo se manda la tonalidad al modelo (y se le pide razonar sobre ella) si el repertorio
  // tiene datos reales de verdad — si la mayoría sigue en "Mim" (el valor con el que la app
  // rellena el campo cuando nadie lo ha tocado), pedirle a la IA que analice "la secuencia
  // armónica" sería pedirle que opine sobre datos vacíos disfrazados de reales.
  const incluirTonalidad = tonalidadesSonFiables(sorted);

  const songList = sorted
    .map((s) => `${s.position}. ${s.titulo} (energía: ${s.energia || 10}/20${incluirTonalidad && s.tonalidad ? `, tonalidad: ${s.tonalidad}` : ''}${s.genero ? `, género: ${s.genero}` : ''})`)
    .join('\n');

  const prompt = `
Eres un experto en pacing de conciertos de rock. Analiza este setlist:
${buildBandStyleContextBlock(bandContext)}
${songList}
${incluirTonalidad ? `
Las tonalidades indicadas son datos reales: ten también en cuenta la SECUENCIA ARMÓNICA del
repertorio (círculo de quintas, relativas mayor/menor). Señala si hay saltos de tonalidad
bruscos entre temas consecutivos que rompan el flujo armónico del directo, y si un
reordenamiento razonable lo mejoraría, inclúyelo como una sugerencia más (categoría "contrast").` : ''}

Proporciona un análisis JSON VÁLIDO (sin markdown) con:
{
  "narrativeArc": "Descripción breve del arco narrativo (ej: Intro-Sube-Pico-Cae-Sube-Climax-Cierre)",
  "psychologicalFlow": "Cómo responde el público emocionalmente",
  "suggestions": [
    {
      "priority": "high|medium|low",
      "category": "pacing|narrative|psychology|recovery|contrast",
      "title": "Título corto",
      "issue": "Qué pasa ahora",
      "suggestion": "Qué cambiar y cómo",
      "impact": "Qué mejora",
      "songs_involved": ["Nombre exacto de canción 1", "Nombre exacto de canción 2"],
      "suggested_reorder": { "from_position": N, "to_position": M } o null
    }
  ],
  "overallScore": 0-100,
  "strengths": ["Fortaleza 1", "Fortaleza 2"],
  "areasForImprovement": ["Área 1", "Área 2"]
}

IMPORTANTE:
- En "songs_involved", usa EXACTAMENTE los títulos de las canciones de la lista (ej: "Bienvenidos", "Solo Batería")
- Máximo 3-4 sugerencias, solo las MÁS IMPORTANTES
- Si una sugerencia aplica a múltiples canciones consecutivas, lista todas
- Si aplica a una sola, puede ser un array de 1 elemento
- "suggested_reorder": SOLO cuando la sugerencia consiste literalmente en mover una canción a otra
  posición del setlist. Usa los números EXACTOS que aparecen delante de cada canción en la lista
  de arriba (from_position = posición actual de la canción a mover, to_position = posición donde
  debería quedar). Si la sugerencia es sobre otra cosa (cómo presentar un tema, cambiar de
  instrumento, hablar con el público, etc. — nada que cambie el ORDEN), pon "suggested_reorder": null.
  No inventes una canción nueva ni una posición fuera del rango de la lista.
`;

  try {
    const client = getAiClient();
    const response = await generateContentWithFallback(client, {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });

    const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) {
      throw new Error("No response from AI");
    }

    // Extraer JSON del response (puede venir con markdown o puro)
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const analysis = JSON.parse(jsonStr) as AdvancedSetlistAnalysis;

    // Saneado defensivo: solo se confía en un suggested_reorder si sus dos posiciones son
    // números reales de la lista que le pasamos al modelo (nunca inventados/fuera de rango) y son
    // distintas entre sí — de lo contrario se descarta a null en vez de dejar que el frontend
    // ejecute un índice fuera de rango o un "muévete a tu propio sitio" que no hace nada.
    const validPositions = new Set(sorted.map((s) => s.position));
    if (Array.isArray(analysis.suggestions)) {
      analysis.suggestions = analysis.suggestions.map((s) => {
        const r = s.suggested_reorder;
        const isValid = !!r
          && validPositions.has(r.from_position)
          && validPositions.has(r.to_position)
          && r.from_position !== r.to_position;
        return { ...s, suggested_reorder: isValid ? r : null };
      });
    }

    return analysis;
  } catch (error) {
    console.error("[SetlistAI] Error analyzing with AI:", error);
    throw new Error(`No se pudo analizar el setlist: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
