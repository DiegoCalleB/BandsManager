/**
 * Hook Doctor: audita el gancho y el copy de un Reel y propone una versión mejor.
 * Extraído de `routes/reels.ts`. Cambios respecto a la versión anterior, a propósito:
 *  - Usa `generateContentWithFallback`: si el modelo preferido falla, prueba los demás, y el
 *    consumo de tokens queda en el ledger de IA de la banda (antes llamaba directo al SDK).
 *  - `estimatedRetention3s` es una estimación del modelo, no una métrica: sin IA es `null` en
 *    lugar de un número inventado que el panel mostraba como si fuera un dato.
 */
import { getAiClient, GEMINI_MODEL, generateContentWithFallback } from "../ai.js";
import { buildBandContextBlock, displayBandName, type BandProfile } from "../utils/bandProfile.js";
import { extractJsonObject } from "../utils/reelsCore.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

export interface PeticionHookDoctor {
  hookText?: unknown;
  copyText?: unknown;
  songTitle?: unknown;
  platform?: unknown;
  contentType?: unknown;
}

export interface DiagnosticoHook {
  cringeScore: number;
  /** Estimación del modelo (0-100). `null` cuando no hay IA: entonces no se inventa un número. */
  estimatedRetention3s: number | null;
  verdict: string;
  cringeReasons: string[];
  improvedHook: string;
  improvedCopy: string;
  pinnedComment: string;
  pinnedCommentGoal: string;
}

export interface ResultadoHookDoctor {
  generatedByAI: boolean;
  diagnosis: DiagnosticoHook;
}

function construirPrompt(perfil: BandProfile, nombreBanda: string, d: { hook: string; copy: string; tema: string; platform: string; contentType: string }): string {
  const { hook: hookLimpio, copy: copyLimpio, tema: temaLimpio, platform, contentType } = d;
  return `Eres el Director de Virality & Anti-Cringe Strategist de BandManager.io.
Tu misión es auditar un Reel de una banda de música independiente (${nombreBanda}), eliminar cualquier rastro de marketing amateur/cliché o 'cringe' (postureo falso, pedir favores, frases de teletienda) y maximizar la retención y comentarios orgánicos.

${buildBandContextBlock(perfil)}

DATOS DEL REEL:
- Banda: "${nombreBanda}"
- Canción/Tema: "${temaLimpio || 'Directo / Ensayo'}"
- Plataforma: "${platform}"
- Tipo de material: "${contentType}"
- Gancho visual actual (0-3s): "${hookLimpio || '(Vacío)'}"
- Copy actual: "${copyLimpio || '(Vacío)'}"

TU AUDITORÍA DEBE DEVOLVER:
1. "cringeScore": Número entero de 0 a 100.
   - 0-20: Cero cringe, máxima autenticidad y misterio.
   - 21-50: Aceptable pero con margen de mejora.
   - 51-100: Cringe alto (suena a influencer de pacotilla, pide likes descaradamente, o suena aburrido).
2. "estimatedRetention3s": Porcentaje estimado (ej: 88).
3. "verdict": Dictamen corto y memorable en español (ej: "Potencial Viral Alto", "Demasiado Genérico", "Falta Curiosidad").
4. "cringeReasons": Array de 1 a 3 motivos honestos de por qué falla o cómo se percibe.
5. "improvedHook": Gancho de alto impacto (máximo 8 palabras) sin clichés, con curiosidad o debate real.
6. "improvedCopy": Copy optimizado para ${platform}, con lore/conexión auténtica y llamada sutil.
7. "pinnedComment": EL PRIMER COMENTARIO FIJADO (Pinned Comment). Una pregunta o reto polarizante para que la gente responda inmediatamente en los primeros 10 minutos de subida (crucial para el algoritmo).
8. "pinnedCommentGoal": Explicación de por qué este comentario fuerza el debate.

Responde ÚNICAMENTE con JSON válido:
{
  "cringeScore": 15,
  "estimatedRetention3s": 89,
  "verdict": "Gancho Magnético Auténtico",
  "cringeReasons": ["..."],
  "improvedHook": "...",
  "improvedCopy": "...",
  "pinnedComment": "...",
  "pinnedCommentGoal": "..."
}`;
}

export async function diagnosticarHook(perfil: BandProfile, bandId: string, req: PeticionHookDoctor): Promise<ResultadoHookDoctor> {
  const nombreBanda = displayBandName(perfil) || "La Banda";
  const hookLimpio = String(req.hookText || "").replace(/[\r\n\t]/g, " ").trim();
  const copyLimpio = String(req.copyText || "").trim();
  const temaLimpio = String(req.songTitle || "").replace(/[\r\n\t]/g, " ").trim();
  const platform = String(req.platform || "Instagram");
  const contentType = String(req.contentType || "concierto");

  const ai = getAiClient();
  if (ai) {
    try {
      const response = await generateContentWithFallback(ai, {
        contents: construirPrompt(perfil, nombreBanda, { hook: hookLimpio, copy: copyLimpio, tema: temaLimpio, platform, contentType }),
        preferredModel: GEMINI_MODEL,
        config: { responseMimeType: "application/json", temperature: 0.7 },
        bandId
      });
      const parsed = extractJsonObject(response?.text || "");
      if (parsed && typeof parsed === "object") {
        const retencion = Number(parsed.estimatedRetention3s);
        return {
          generatedByAI: true,
          diagnosis: {
            cringeScore: Math.min(100, Math.max(0, Number(parsed.cringeScore) || 20)),
            estimatedRetention3s: Number.isFinite(retencion) ? Math.min(99, Math.max(30, retencion)) : null,
            verdict: String(parsed.verdict || "Auditoría completada"),
            cringeReasons: Array.isArray(parsed.cringeReasons) ? parsed.cringeReasons.map(String) : [],
            improvedHook: String(parsed.improvedHook || hookLimpio),
            improvedCopy: String(parsed.improvedCopy || copyLimpio),
            pinnedComment: String(parsed.pinnedComment || "¿Qué nota le dais a este momento del 1 al 10? 👇🎸"),
            pinnedCommentGoal: String(parsed.pinnedCommentGoal || "Dispara el debate orgánico en comentarios.")
          }
        };
      }
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.warn("[AI Hook Doctor Error]:", err?.message || err);
    }
  }

  // Sin IA (o respuesta inservible): diagnóstico por reglas, sin cifras de retención inventadas.
  const fallbackDiagnosis = {
    cringeScore: hookLimpio.includes("nuevo tema") || hookLimpio.includes("escucha") ? 65 : 25,
    estimatedRetention3s: null,
    verdict: hookLimpio.length > 5 ? "Buen Gancho Rítmico" : "Gancho Mejorable",
    cringeReasons: hookLimpio.includes("nuevo tema") 
      ? ["Evita anunciar 'nuestro nuevo tema', es más efectivo abrir un hueco de misterio o debate."] 
      : ["Asegúrate de que los primeros 2 segundos retienen con una pregunta o detalle inesperado."],
    improvedHook: hookLimpio || `El momento exacto en que la sala entera explotó 🤯⚡`,
    improvedCopy: copyLimpio || `Nadie en la sala se dio cuenta hasta el final... ¿Vosotros lo habéis visto? Dejadnos en comentarios 👇🎸\n\n#${nombreBanda.replace(/\s+/g, '')} #Directo`,
    pinnedComment: `Sinceramente... ¿este solo os parece demasiado rápido o está en su punto exacto? Os leemos 👇🥁`,
    pinnedCommentGoal: "Provoca opiniones polarizadas que aumentan el engagement en la primera hora."
  };

  return { generatedByAI: false, diagnosis: fallbackDiagnosis };
}
