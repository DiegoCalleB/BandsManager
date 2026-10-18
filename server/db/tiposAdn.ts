/**
 * Forma de `registered_bands.dna_expresion`: el ADN de tono de la banda emisora.
 *
 * Es una columna JSONB que van rellenando por partes el análisis de redes (`/api/bands/analyze-tone`),
 * el auto-refinamiento por categoría (pitchLearning), las ediciones manuales y los historiales de
 * feedback. Se declaran los campos que el servidor lee; el resto se conserva tal cual al reescribir.
 */
import type { BandToneDnaExpression } from '../../src/types.js';

/** Reglas aprendidas (y escritas a mano) para una categoría de destinatario. */
export interface ReglasDeCategoria {
  reglas_estilo_aprendidas?: string[];
  reglas_manuales?: string[];
  vocabulario_aprendido?: string[];
  terminos_a_evitar?: string[];
  actualizado?: string;
  [campo: string]: unknown;
}

/** ADN de expresión guardado. Todo es opcional: se completa con el uso. */
export type AdnExpresion = BandToneDnaExpression & {
  /** Reglas por categoría para pitches iniciales y para respuestas, respectivamente. */
  reglas_por_categoria?: Record<string, ReglasDeCategoria>;
  reglas_por_categoria_respuesta?: Record<string, ReglasDeCategoria>;
  reglas_manuales?: string[];
  /** Frases reales de directo extraídas de transcripciones (últimas 25). */
  frases_directo_extraidas?: string[];
  /** Historiales de feedback (últimas 30 entradas cada uno). */
  historial_feedback_reels?: unknown[];
  historial_feedback_setlist?: unknown[];
  [campo: string]: unknown;
};
