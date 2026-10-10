/**
 * Tipos del selector de bandas.
 */
import type { EPKConfig } from '../../types';

/** Banda tal y como la recibe el selector; incluye los alias de logo heredados de distintas APIs. */
export interface SwitcherBand {
  band_id: string;
  bandName: string;
  role?: string;
  logoUrl?: string;
  logo_url?: string;
  imagen_url?: string;
  nombre_banda?: string;
  style?: string;
  plan?: string;
  is_main?: boolean;
}

/** Configuración de EPK que el selector lee (logo) y actualiza. */
export type SwitcherEpkConfig = Partial<EPKConfig>;
