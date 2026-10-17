import type { ViralWindow } from "./reelsApiTypes";

export interface SenalDelTramo {
  clave: "volumen" | "arranque" | "montaje" | "publico";
  etiqueta: string;
  /** 0-100, relativo al resto del vídeo. */
  valor: number;
}

export interface RazonDelTramo {
  puntuacion: number;
  motivo: string;
  /** De mayor a menor: la primera es lo que más pesó. */
  senales: SenalDelTramo[];
  principal: SenalDelTramo;
}

const solape = (a: { start: number; end: number }, b: { start: number; end: number }): number =>
  Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));

/**
 * Por qué el análisis eligió un corte: la ventana medida que más se solapa con él, con sus señales
 * ordenadas. Devuelve null si no hay medición que lo respalde (no se inventa una razón).
 */
export function razonDelTramo(corte: { start: number; end: number }, ventanas: ViralWindow[]): RazonDelTramo | null {
  let mejor: ViralWindow | null = null;
  let mayorSolape = 0;
  for (const w of ventanas) {
    const s = solape(corte, w);
    if (s > mayorSolape) { mayorSolape = s; mejor = w; }
  }
  if (!mejor) return null;

  const senales: SenalDelTramo[] = [
    { clave: "volumen", etiqueta: "Volumen", valor: mejor.energia },
    { clave: "arranque", etiqueta: "Arranque", valor: mejor.arranque },
    { clave: "montaje", etiqueta: "Montaje", valor: mejor.dinamismo }
  ];
  if (typeof mejor.publico === "number") senales.push({ clave: "publico", etiqueta: "Público", valor: mejor.publico });
  senales.sort((a, b) => b.valor - a.valor);
  return { puntuacion: mejor.score, motivo: mejor.motivo, senales, principal: senales[0] };
}
