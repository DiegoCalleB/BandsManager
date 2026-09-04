import { Song, SetlistItem } from "../../src/types.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";

export interface AISetlistSuggestion {
  priority: 'high' | 'medium' | 'low';
  category: 'pacing' | 'narrative' | 'psychology' | 'recovery' | 'contrast';
  title: string;
  issue: string;
  suggestion: string;
  impact: string;
  songs_involved?: string[];
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
  songs: (Song & { position: number })[]
): Promise<AdvancedSetlistAnalysis> {
  if (songs.length === 0) {
    throw new Error("No songs to analyze");
  }

  const songList = songs
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.position}. ${s.titulo} (energía: ${s.energia || 10}/20)`)
    .join('\n');

  const prompt = `
Eres un experto en pacing de conciertos de rock. Analiza este setlist:

${songList}

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
      "songs_involved": ["Canción A", "Canción B"]
    }
  ],
  "overallScore": 0-100,
  "strengths": ["Fortaleza 1", "Fortaleza 2"],
  "areasForImprovement": ["Área 1", "Área 2"]
}

Máximo 3-4 sugerencias, solo las MÁS IMPORTANTES. Sé específico con nombres de canciones.
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
    return analysis;
  } catch (error) {
    console.error("[SetlistAI] Error analyzing with AI:", error);
    throw new Error(`No se pudo analizar el setlist: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
