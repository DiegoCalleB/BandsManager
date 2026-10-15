// Formatos de salida. Un mismo diseño se recompone para cada uno: el layout trabaja en
// proporciones del ancho, así que la vista previa (1080 px) y la exportación coinciden.

export type FormatoCartel = 'feed' | 'historia' | 'imprimir';

export interface DefFormato {
  id: FormatoCartel;
  etiqueta: string;
  /** Ancho de exportación en píxeles. */
  ancho: number;
  /** alto / ancho. */
  proporcion: number;
  /** En digital la gente ya está en el móvil: un QR no sirve, se pone la URL corta. */
  digital: boolean;
  /** Franjas que tapa la interfaz de Instagram en una historia (fracción del alto). */
  seguroArriba: number;
  seguroAbajo: number;
}

export const FORMATOS: Record<FormatoCartel, DefFormato> = {
  feed: { id: 'feed', etiqueta: 'Feed', ancho: 1080, proporcion: 1350 / 1080, digital: true, seguroArriba: 0, seguroAbajo: 0 },
  historia: { id: 'historia', etiqueta: 'Historia', ancho: 1080, proporcion: 1920 / 1080, digital: true, seguroArriba: 0.12, seguroAbajo: 0.16 },
  // A4 a 300 ppp.
  imprimir: { id: 'imprimir', etiqueta: 'Imprimir A4', ancho: 2480, proporcion: 3508 / 2480, digital: false, seguroArriba: 0, seguroAbajo: 0 },
};

export const ORDEN_FORMATOS: FormatoCartel[] = ['feed', 'historia', 'imprimir'];

export function dimensiones(def: DefFormato, ancho = def.ancho): { ancho: number; alto: number } {
  return { ancho, alto: Math.round(ancho * def.proporcion) };
}
