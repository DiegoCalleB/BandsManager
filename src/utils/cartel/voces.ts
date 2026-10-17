// La «letra» del cartel: la tipografía de exhibición del nombre y del día. Un cartel de verdad no usa la
// letra de una web: usa una de cartel. Tres voces, y el resto del texto (sala, horas, enlace) va siempre en
// Onest, que se lee bien pequeña.
//
//   moderna  Onest, gruesa: minimal, neón, cualquier cosa limpia.
//   cartel   Anton, condensada y alta: rock, punk, collage, serigrafía de gira.
//   clasica  DM Serif Display: vintage, jazz, bolo de club.
//
// Los tamaños son máximos en unidades `u` (ancho / 1080): el layout los reduce hasta que el nombre cabe.

import type { EstiloCartel } from './estilos';

export type VozCartel = 'moderna' | 'cartel' | 'clasica';
export type LetraCartel = 'auto' | VozCartel;

export const VOCES_CARTEL: readonly VozCartel[] = ['moderna', 'cartel', 'clasica'];
export const LETRAS_CARTEL: readonly LetraCartel[] = ['auto', ...VOCES_CARTEL];

export interface DefVoz {
  etiqueta: string;
  familia: string;
  peso: number;
  /** Tamaño máximo del nombre, normal y con una ilustración de IA (que necesita sitio). */
  titulo: number;
  tituloCompacto: number;
  /** Avance entre líneas del nombre, como fracción del cuerpo. */
  interlinea: number;
  /** Cuerpo del número del día en la fecha. */
  numeral: number;
}

export const VOCES: Record<VozCartel, DefVoz> = {
  moderna: { etiqueta: 'Moderna', familia: '"Onest Variable", Onest', peso: 800, titulo: 210, tituloCompacto: 150, interlinea: 0.94, numeral: 150 },
  cartel: { etiqueta: 'Cartel', familia: 'Anton', peso: 400, titulo: 330, tituloCompacto: 250, interlinea: 0.9, numeral: 190 },
  clasica: { etiqueta: 'Clásica', familia: '"DM Serif Display"', peso: 400, titulo: 250, tituloCompacto: 185, interlinea: 0.95, numeral: 170 },
};

export const ETIQUETA_LETRA: Record<LetraCartel, string> = {
  auto: 'Automática, según vuestro estilo',
  moderna: 'Moderna',
  cartel: 'Cartel (condensada)',
  clasica: 'Clásica (con serifa)',
};

const VOZ_POR_ESTILO: Record<EstiloCartel, VozCartel> = {
  gigposter: 'cartel',
  collage: 'cartel',
  neon: 'moderna',
  minimal: 'moderna',
  vintage: 'clasica',
};

/** La voz que se usa: la elegida o, en automático, la del estilo de la banda. */
export const resolverVoz = (letra: LetraCartel, estilo: EstiloCartel): VozCartel => (letra === 'auto' ? VOZ_POR_ESTILO[estilo] : letra);
