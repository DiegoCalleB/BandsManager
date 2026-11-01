/**
 * Cadena de modelos Gemini, del preferido al último recurso. Los 1.5 y 2.0 están retirados: dejarlos
 * solo añadía 404 seguros antes de rendirse. Se sobrescribe sin tocar código con
 * `GEMINI_MODELS=modelo1,modelo2` (el test de ai_fallback vigila que no reaparezcan retirados).
 */
export const MODELOS_GEMINI_RETIRADOS = /gemini-(1\.|2\.0)/;
const MODELOS_GEMINI_POR_DEFECTO = ["gemini-3.7-flash", "gemini-3.8-flash", "gemini-2.5-flash"];
const modelosDeEntorno = (process.env.GEMINI_MODELS || "").split(",").map(m => m.trim()).filter(Boolean);
export const FALLBACK_MODELS: string[] = modelosDeEntorno.length > 0 ? modelosDeEntorno : MODELOS_GEMINI_POR_DEFECTO;

/** ¿Lleva el contenido una imagen, PDF o audio? DeepSeek solo lee texto: con binarios no puede responder. */
export function contieneBinarios(contents: unknown): boolean {
  if (!contents || typeof contents === "string") return false;
  const lista = Array.isArray(contents) ? contents : [contents];
  return lista.some((c: unknown) => {
    if (typeof c !== "object" || c === null) return false;
    const obj = c as { inlineData?: unknown; fileData?: unknown; parts?: unknown };
    return !!obj.inlineData || !!obj.fileData || (Array.isArray(obj.parts) && contieneBinarios(obj.parts));
  });
}
