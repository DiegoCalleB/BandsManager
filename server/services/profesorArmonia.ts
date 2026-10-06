import crypto from "crypto";
import type { AnalisisArmonico } from "../../src/utils/teoriaArmonica.js";
import { NOMBRE_FUNCION } from "../../src/utils/teoriaArmonica.js";

/**
 * «Profesor de armonía» con IA: redacta con palabras de profesor los HECHOS que ya ha calculado el
 * código (`analizarArmonia`). Nunca recibe el título ni el audio como fuente de verdad, solo hechos
 * numerados; la salida se valida contra esos hechos y lo opinable va en secciones de «ideas».
 */

export type Nivel = "principiante" | "intermedio" | "avanzado";
export type Instrumento = "guitarra" | "bajo" | "teclado" | "voz" | "bateria";

export const NIVELES: Nivel[] = ["principiante", "intermedio", "avanzado"];
export const INSTRUMENTOS: Instrumento[] = ["guitarra", "bajo", "teclado", "voz", "bateria"];

export interface Hechos {
  tonalidad: string;
  modo: string;
  tonalidadEstimada: boolean;
  bucle: { grados: string[]; veces: number; nombre: string | null } | null;
  acordes: Array<{ id: string; acorde: string; grado: string; funcion: string; porcentaje: number; veces: number; secundario?: string }>;
  funciones: Record<string, number>;
  cambiosPorMinuto: number;
  bpm?: number;
  cambiosDeTono?: Array<{ desde: number; tonalidad: string }>;
}

export function construirHechos(a: AnalisisArmonico, extra: { bpm?: number; cambiosDeTono?: Hechos["cambiosDeTono"] } = {}): Hechos {
  const total = a.acordes.reduce((x, r) => x + r.segundos, 0) || 1;
  return {
    tonalidad: `${a.tonalidad.nombre}${a.tonalidad.menor ? " (menor)" : " (mayor)"}`,
    modo: a.modo.nombre,
    tonalidadEstimada: a.tonalidadEstimada,
    bucle: a.bucle ? { grados: a.bucle.grados, veces: a.bucle.veces, nombre: a.bucle.nombre } : null,
    acordes: a.acordes.slice(0, 12).map((r, i) => ({
      id: `a${i + 1}`,
      acorde: r.acorde,
      grado: r.grado,
      funcion: NOMBRE_FUNCION[r.funcion],
      porcentaje: Math.round((r.segundos / total) * 100),
      veces: r.veces,
      ...(r.secundario ? { secundario: r.secundario } : {}),
    })),
    funciones: Object.fromEntries(Object.entries(a.funciones).filter(([, v]) => v > 0.005).map(([k, v]) => [NOMBRE_FUNCION[k as keyof typeof NOMBRE_FUNCION], Math.round(v * 100)])),
    cambiosPorMinuto: a.cambiosPorMinuto,
    ...(extra.bpm ? { bpm: Math.round(extra.bpm) } : {}),
    ...(extra.cambiosDeTono?.length ? { cambiosDeTono: extra.cambiosDeTono } : {}),
  };
}

/** Huella de los hechos + a quién se explica: si no cambia, se reutiliza la explicación guardada. */
export function huellaDeHechos(h: Hechos, nivel: Nivel, instrumento: Instrumento): string {
  return crypto.createHash("sha256").update(JSON.stringify({ h, nivel, instrumento, v: 1 })).digest("hex").slice(0, 24);
}

export function construirPrompt(h: Hechos, nivel: Nivel, instrumento: Instrumento): { sistema: string; usuario: string } {
  const sistema = `Eres un profesor de armonía y de instrumento, cercano y claro, que explica una canción a un músico de banda.
REGLAS (no negociables):
1. Usa SOLO los datos de «HECHOS». No inventes acordes, tonalidades, secciones, letra ni datos de la grabación. No hables del título ni de la discografía.
2. En «resumen» y «comoFunciona» cada frase debe poder comprobarse con los hechos; cita los ids de hechos que usas (a1, a2… o «tonalidad», «modo», «bucle»).
3. En «paraImprovisar», «paraComponer» y «dinamismo» puedes dar consejos de oficio, pero son SUGERENCIAS: dilo con verbos como «prueba», «puedes», «te sugiero». Nunca las presentes como hechos de la canción.
4. Si los hechos son ambiguos (tonalidad estimada, bucle poco claro), dilo en vez de afirmarlo.
5. Español de España, sin jerga innecesaria. Nivel: ${nivel}. Instrumento del músico: ${instrumento}.
6. Responde SOLO con JSON válido con esta forma exacta:
{"resumen": string, "comoFunciona": [{"texto": string, "hechos": string[]}], "paraImprovisar": string[], "paraComponer": string[], "dinamismo": [{"idea": string, "ejemplo": string}]}
Máximo 4 elementos por lista y 280 caracteres por texto.`;
  const usuario = `HECHOS (calculados por código, fiables):\n${JSON.stringify(h)}`;
  return { sistema, usuario };
}

export interface ExplicacionProfesor {
  resumen: string;
  comoFunciona: Array<{ texto: string; hechos: string[] }>;
  paraImprovisar: string[];
  paraComponer: string[];
  dinamismo: Array<{ idea: string; ejemplo: string }>;
}

const MAX_TEXTO = 320;
const MAX_ITEMS = 4;

/** Tokens que parecen un acorde con calidad o sostenido («Am», «F#m7», «Bb», «Cmaj7»…) o un grado romano no es. */
const ACORDE_EN_TEXTO = /(?<![A-Za-zÁ-úñ#])([A-G](?:#|b)?(?:m(?!aj)|maj7|m7|7|sus[24]?|dim|aug)?)(?![A-Za-zÁ-úñ#0-9])/g;
const ES_ACORDE = /^(Do|Re|Mi|Fa|Sol|La|Si)(#|b)?(m|7|maj7|m7)?$/;

function acordesDeLaCancion(h: Hechos): Set<string> {
  return new Set(h.acordes.map((a) => a.acorde));
}

/** ¿Nombra algún acorde (con calidad o alteración) que no es de la canción? Las notas sueltas («E») no cuentan: pueden ser una escala. */
export function mencionaAcordeAjeno(texto: string, h: Hechos): string | null {
  const propios = acordesDeLaCancion(h);
  for (const m of texto.matchAll(ACORDE_EN_TEXTO)) {
    const t = m[1];
    if (/^[A-G]$/.test(t)) continue; // una letra sola: nota o escala
    if (!propios.has(t)) return t;
  }
  for (const palabra of texto.split(/[\s,;.:()«»]+/)) {
    if (ES_ACORDE.test(palabra) && /m$|7$|#|b/.test(palabra)) {
      // acorde en español con calidad: se comprueba en su equivalente internacional
      const en = palabra.replace(/^Do/, "C").replace(/^Re/, "D").replace(/^Mi/, "E").replace(/^Fa/, "F").replace(/^Sol/, "G").replace(/^La/, "A").replace(/^Si/, "B");
      if (!propios.has(en)) return palabra;
    }
  }
  return null;
}

const limpio = (x: unknown): string => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO);

/**
 * Valida y limpia la salida del modelo contra los hechos. Lo que afirma hechos («resumen»,
 * «comoFunciona») se descarta frase a frase si nombra un acorde que no está en la canción o cita un
 * hecho que no existe. Devuelve null si no queda nada útil.
 */
export function validarExplicacion(bruto: any, h: Hechos): { explicacion: ExplicacionProfesor; descartadas: number } | null {
  if (!bruto || typeof bruto !== "object") return null;
  let descartadas = 0;
  const ids = new Set([...h.acordes.map((a) => a.id), "tonalidad", "modo", "bucle", "funciones", "ritmo"]);

  const resumen = limpio(bruto.resumen);
  const resumenOk = resumen && !mencionaAcordeAjeno(resumen, h) ? resumen : "";
  if (resumen && !resumenOk) descartadas++;

  const comoFunciona = (Array.isArray(bruto.comoFunciona) ? bruto.comoFunciona : [])
    .slice(0, MAX_ITEMS)
    .map((c: any) => ({ texto: limpio(c?.texto), hechos: (Array.isArray(c?.hechos) ? c.hechos : []).map(String).filter((id: string) => ids.has(id)) }))
    .filter((c: { texto: string; hechos: string[] }) => {
      const ok = c.texto && c.hechos.length > 0 && !mencionaAcordeAjeno(c.texto, h);
      if (!ok && c.texto) descartadas++;
      return ok;
    });

  const lista = (x: unknown): string[] => (Array.isArray(x) ? x : []).slice(0, MAX_ITEMS).map(limpio).filter(Boolean);
  const dinamismo = (Array.isArray(bruto.dinamismo) ? bruto.dinamismo : [])
    .slice(0, MAX_ITEMS)
    .map((d: any) => ({ idea: limpio(d?.idea), ejemplo: limpio(d?.ejemplo) }))
    .filter((d: { idea: string }) => d.idea);

  const explicacion: ExplicacionProfesor = {
    resumen: resumenOk,
    comoFunciona,
    paraImprovisar: lista(bruto.paraImprovisar),
    paraComponer: lista(bruto.paraComponer),
    dinamismo,
  };
  const hayAlgo = explicacion.resumen || comoFunciona.length || explicacion.paraImprovisar.length || explicacion.paraComponer.length || dinamismo.length;
  return hayAlgo ? { explicacion, descartadas } : null;
}
