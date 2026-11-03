/**
 * ÚNICA fuente de verdad de los modelos de IA de Google/DeepSeek que usa el servidor.
 *
 * Por qué existe: los modelos se retiran (Gemini 1.5/2.0, text-embedding-004, Imagen 3...) y cuando
 * el ID estaba escrito en 20 sitios, el fallo era silencioso y se descubría por un usuario. Reglas:
 *  - Ningún `.ts` fuera de este fichero escribe un ID de modelo entre comillas (lo comprueba
 *    `server/__tests__/modelosIA.test.ts`).
 *  - Cada familia se puede cambiar SIN tocar código con su variable de entorno (listas separadas por comas).
 *  - Si un modelo responde "no existe / retirado" en producción, se aparta solo durante un rato
 *    (`registrarFalloModelo`) y se usa el siguiente, en vez de gastar un intento fallido en cada petición.
 *  - `npm run check:modelos` (y el workflow semanal) compara esta lista con `models.list()` de Google.
 */

const lista = (valor: string | undefined, porDefecto: string[]): string[] => {
  const modelos = (valor || "").split(",").map(m => m.trim()).filter(Boolean);
  return modelos.length > 0 ? modelos : porDefecto;
};

/** IDs que Google ya retiró: ninguno puede aparecer en este registro. */
export const MODELOS_RETIRADOS = /gemini-(1\.|2\.0)|text-embedding-00|imagen-[23]/;
/** Compatibilidad con el test anterior. */
export const MODELOS_GEMINI_RETIRADOS = MODELOS_RETIRADOS;

/** Texto/visión: del preferido al último recurso. Override: `GEMINI_MODELS=a,b`. */
export const FALLBACK_MODELS: string[] = lista(process.env.GEMINI_MODELS, ["gemini-3.7-flash", "gemini-3.8-flash", "gemini-2.5-flash"]);
/** Modelo preferido por defecto de las rutas de texto. */
export const MODELO_TEXTO = FALLBACK_MODELS[0];

/** Embeddings (768 dim, columna `vector(768)`). Override: `GEMINI_EMBEDDING_MODELS`. */
export const MODELOS_EMBEDDING: string[] = lista(process.env.GEMINI_EMBEDDING_MODELS, ["gemini-embedding-001"]);

/** Logo con IA (Imagen). Override: `IMAGEN_LOGO_MODELS`. */
export const MODELOS_IMAGEN_LOGO: string[] = lista(process.env.IMAGEN_LOGO_MODELS, ["imagen-4.0-generate-001", "imagen-4.0-fast-generate-001"]);

/** Cartelería (imagen multimodal de Gemini). Override del principal: `CARTEL_MODELO_IMAGEN`. */
export const MODELO_IMAGEN_BASE_ID = "gemini-2.5-flash-image";
export const MODELO_IMAGEN_PRO_ID = "gemini-3-pro-image-preview";

/** Música (Lyria). Override: `LYRIA_MODEL_CLIP`, `LYRIA_MODEL_PRO`. */
export const MODELO_LYRIA_CLIP = process.env.LYRIA_MODEL_CLIP?.trim() || "lyria-3-clip-preview";
export const MODELO_LYRIA_PRO = process.env.LYRIA_MODEL_PRO?.trim() || "lyria-3-pro-preview";

/** Failover de texto. Override: `DEEPSEEK_MODEL`. */
export const MODELO_DEEPSEEK = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";

/** Todo lo que el servidor puede pedir a la API de Google (lo comprueba `check:modelos`). */
export function modelosGoogleEnUso(): { id: string; uso: string }[] {
  const etiquetar = (ids: string[], uso: string) => ids.map(id => ({ id, uso }));
  return [
    ...etiquetar(FALLBACK_MODELS, "texto/visión"),
    ...etiquetar(MODELOS_EMBEDDING, "embeddings"),
    ...etiquetar(MODELOS_IMAGEN_LOGO, "logo (Imagen)"),
    ...etiquetar([process.env.CARTEL_MODELO_IMAGEN || MODELO_IMAGEN_PRO_ID, MODELO_IMAGEN_BASE_ID], "cartelería"),
    ...etiquetar([MODELO_LYRIA_CLIP, MODELO_LYRIA_PRO], "música (Lyria)"),
  ].filter((m, i, todos) => todos.findIndex(o => o.id === m.id) === i);
}

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

// ── Modelos que Google ya no sirve: se apartan solos ───────────────────────────────────────────
const APARTADO_MS = 6 * 60 * 60 * 1000;
const apartados = new Map<string, number>();

/** ¿Significa este error que el MODELO no existe/está retirado (y no un fallo puntual o de cuota)? */
export function esErrorModeloNoDisponible(err: unknown): boolean {
  const e = (typeof err === "object" && err !== null ? err : {}) as { message?: unknown; status?: unknown; code?: unknown };
  const msg = String(e.message ?? err ?? "").toLowerCase();
  const estado = String(e.status ?? e.code ?? "");
  return (
    estado === "404" || estado === "NOT_FOUND" ||
    (msg.includes("not found") && msg.includes("model")) ||
    msg.includes("is not supported for generatecontent") ||
    msg.includes("no longer available") || msg.includes("has been deprecated") || msg.includes("was shut down") || msg.includes("retired")
  );
}

/** Registra un fallo de un modelo; si es "no disponible" lo aparta y AVISA (nunca en silencio). */
export function registrarFalloModelo(modelo: string, err: unknown): void {
  if (!esErrorModeloNoDisponible(err)) return;
  if (!apartados.has(modelo) || Date.now() > (apartados.get(modelo) as number)) {
    console.error(`[Modelos IA] '${modelo}' ya no está disponible en Google (404/retirado). Se aparta ${APARTADO_MS / 3_600_000} h. Actualiza modelosGemini.ts o la variable de entorno correspondiente.`);
  }
  apartados.set(modelo, Date.now() + APARTADO_MS);
}

export const modeloApartado = (modelo: string): boolean => (apartados.get(modelo) ?? 0) > Date.now();
export const reiniciarModelosApartados = (): void => apartados.clear();

/** Lista de modelos a probar: el preferido primero, sin duplicados y sin los apartados (salvo que no quede ninguno). */
export function modelosAProbar(preferido?: string, base: string[] = FALLBACK_MODELS): string[] {
  const todos = (preferido ? [preferido, ...base] : base).filter((m, i, a) => a.indexOf(m) === i);
  const vivos = todos.filter(m => !modeloApartado(m));
  return vivos.length > 0 ? vivos : todos;
}
