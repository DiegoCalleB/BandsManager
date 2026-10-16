/**
 * Detecta datos concretos de un pitch que no constan en los hechos reales de la banda o de la sala.
 * Un pitch que promete un precio, una fecha, un teléfono o un enlace inventados compromete a la banda.
 */

const PATRONES: Array<{ tipo: string; regex: RegExp }> = [
  { tipo: "email", regex: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { tipo: "url", regex: /\b(?:https?:\/\/|www\.)[^\s,;)]+/gi },
  { tipo: "importe", regex: /\d[\d.,]*\s?(?:€|(?:euros?|eur)\b)/gi },
  { tipo: "telefono", regex: /(?:\+\d{1,3}[\s-]?)?\b\d{3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{0,3}\b/g },
  { tipo: "fecha", regex: /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi },
];

const normalizar = (s: string) => s.toLowerCase().replace(/[\s.-]/g, "");

export interface DatoInventado {
  tipo: string;
  texto: string;
}

export function detectarDatosInventados(pitch: string, hechos: string): DatoInventado[] {
  const base = normalizar(hechos || "");
  const encontrados: DatoInventado[] = [];
  const vistos = new Set<string>();
  for (const { tipo, regex } of PATRONES) {
    for (const m of (pitch || "").matchAll(regex)) {
      const texto = m[0].trim();
      const clave = normalizar(texto);
      if (vistos.has(clave) || base.includes(clave)) continue;
      // El teléfono se solapa con importes/fechas ya vistos: no lo contamos dos veces.
      if (tipo === "telefono" && [...vistos].some(v => v.includes(clave))) continue;
      vistos.add(clave);
      encontrados.push({ tipo, texto });
    }
  }
  return encontrados;
}
