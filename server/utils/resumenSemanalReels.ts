/**
 * Resumen de la semana de los Reels de una banda: cuáles funcionaron mejor y qué probar después.
 * Se apoya solo en métricas reales ya medidas; con pocos datos no saca patrones.
 */
import { NOMBRE_FORMATO, type Formato, type Recomendacion } from "./aprendizajeReels.js";

export interface ReelSemana {
  postId: string;
  texto: string;
  medidoEn: string;
  formato: Formato;
  rewatch: number | null;
  tasaCompartir: number | null;
  tasaGuardar: number | null;
}

export interface MejorReel {
  postId: string;
  texto: string;
  formato: Formato;
  rewatch: number;
  tasaCompartir: number | null;
  tasaGuardar: number | null;
}

export interface ResumenSemanal {
  reelsMedidos: number;
  mejores: MejorReel[];
  /** Lo que comparten los mejores, solo si hay al menos 2 y coinciden. */
  patron: string | null;
  /** Qué hacer con el siguiente Reel. */
  proximo: string;
}

const DIAS = 7;
const MAX_MEJORES = 3;
const MAX_TEXTO = 80;

const recortar = (t: string): string => {
  const limpio = t.replace(/\s+/g, " ").trim();
  return limpio.length > MAX_TEXTO ? `${limpio.slice(0, MAX_TEXTO)}…` : limpio;
};

export function resumenSemanal(reels: ReelSemana[], recomendacion: Recomendacion | null, ahora: Date): ResumenSemanal {
  const desde = ahora.getTime() - DIAS * 24 * 3_600_000;
  const medidos = reels.filter((r) => r.rewatch !== null && Date.parse(r.medidoEn) >= desde);
  const mejores: MejorReel[] = [...medidos]
    .sort((a, b) => (b.rewatch as number) - (a.rewatch as number))
    .slice(0, MAX_MEJORES)
    .map((r) => ({ postId: r.postId, texto: recortar(r.texto), formato: r.formato, rewatch: r.rewatch as number, tasaCompartir: r.tasaCompartir, tasaGuardar: r.tasaGuardar }));

  const patron =
    mejores.length >= 2 && mejores.every((m) => m.formato === mejores[0].formato)
      ? `Tus ${mejores.length} mejores Reels son de formato ${NOMBRE_FORMATO[mejores[0].formato]}.`
      : null;

  const proximo =
    recomendacion?.modo === "aprovechando"
      ? `Para el siguiente: ${NOMBRE_FORMATO[recomendacion.formato]}. ${recomendacion.explicacion}`
      : "Sigue publicando y midiendo: aún hay pocos Reels medidos para decir qué formato te funciona mejor.";

  return { reelsMedidos: medidos.length, mejores, patron, proximo };
}
