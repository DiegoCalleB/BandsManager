/**
 * Campos que el asistente guarda en el EPK y que aún no figuran en el tipo `EPKConfig`.
 * Centraliza el acceso tipado en lugar de `(epkConfig as any)` repartido por los hooks.
 */
import type { EPKConfig } from "../../../types";

export interface EpkWizardExtras {
  riderTecnico?: string;
  riderPdfUrl?: string;
  riderPdfName?: string;
  canalesMesa?: number;
  llevaMicrofoniaPropia?: boolean;
  llevaInEars?: boolean;
  necesitaBacklineBateria?: boolean;
  /** Texto libre con los festivales destacados (uno por línea o separados por comas). */
  festivalesDestacados?: string;
  bandName?: string;
  datosContratacion?: { cacheMinimo?: number; cacheMaximo?: number };
  tiendaMerchUrl?: string;
  merchDestacado?: string;
  condicionesKm?: string;
  cacheFestival?: number;
  fotos?: string[];
}

/**
 * Vista del EPK con los campos extra del asistente tipados.
 * @param epk Configuración del EPK, si existe.
 * @returns El mismo objeto (o `null`), tipado con los campos opcionales del asistente.
 */
export function epkDe(epk: EPKConfig | null | undefined): (EPKConfig & EpkWizardExtras) | null {
  return epk ?? null;
}
