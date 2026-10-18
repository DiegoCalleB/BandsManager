// Placas de papel: en un cartel impreso el texto no flota encima de la ilustración, tiene su sitio.
// Sobre un fondo de IA el cartel es papel con dos bandas lisas (arriba el nombre, abajo los datos), un
// filete y una orla fina, y la ilustración va ENTERA en la ventana que queda entre las bandas: nunca
// cortada por ellas, y el texto se lee siempre.
//
// `planPlacas` es puro (testeable sin canvas); `dibujarPlacas` solo pinta el plan.

import type { LayoutCartel, Rect } from './layout';
import type { ArtePapel } from './papel';

/** Papel claro y papel oscuro de la obra (como las tintas del cartel, no son tokens de la interfaz). */
export const PAPEL = { claro: '#EFE8D8', oscuro: '#16171B' } as const;
const FILETE = { claro: '#16171B', oscuro: '#EFE8D8' } as const;

/** Si las dos bandas juntas se comen más que esto del alto, la ilustración se quedaría sin ventana. */
const MAX_OCUPADO = 0.78;
/** Y la ventana, al menos este tanto del alto: por debajo la ilustración sería un sello. */
const MIN_VENTANA = 0.22;
/** Qué fracción de la altura del nombre solapa la ilustración (solo si está fundida con el papel). */
const SOLAPE_TITULO = 0.38;

export interface PlanPlacas {
  /**
   * `fundido`: la ilustración está dibujada sobre un papel liso y el cartel es de ese MISMO papel; se funde
   * con él, sin caja ni filetes. `marco`: el borde de la ilustración está lleno de dibujo, se enmarca.
   */
  modo: 'fundido' | 'marco';
  color: string;
  filete: string;
  /** Bandas lisas (arriba y/o abajo) y su filete en el borde que da a la ilustración. */
  bandas: Rect[];
  filetes: Rect[];
  /** Orla de papel alrededor de todo el cartel (4 lados). */
  orla: Rect[];
  /** El hueco para la ilustración: entre las bandas y dentro de la orla. */
  ventana: Rect;
}

/** `luz`: luminosidad media del fondo (0 = negro, 1 = blanco). Un fondo claro lleva papel claro. */
export function planPlacas(L: LayoutCartel, luz: number, arte?: ArtePapel | null): PlanPlacas {
  const u = L.ancho / 1080;
  const papel = luz >= 0.5 ? 'claro' : 'oscuro';
  const { arriba, abajo } = L.zonas;
  const grosorFilete = Math.max(2, Math.round(3 * u));
  const orlaGrosor = Math.round(18 * u);

  // Abajo siempre (ahí está la fecha y el QR). Arriba solo si queda ventana para la ilustración.
  const conArriba = arriba.h + abajo.h <= MAX_OCUPADO * L.alto && abajo.y - arriba.h >= MIN_VENTANA * L.alto;
  const bandas: Rect[] = [{ x: 0, y: abajo.y, w: L.ancho, h: L.alto - abajo.y }];
  const filetes: Rect[] = [{ x: 0, y: abajo.y, w: L.ancho, h: grosorFilete }];
  if (conArriba) {
    bandas.unshift({ x: 0, y: 0, w: L.ancho, h: arriba.h });
    filetes.unshift({ x: 0, y: arriba.h - grosorFilete, w: L.ancho, h: grosorFilete });
  }

  const fundido = !!arte?.limpio;
  const orla: Rect[] = fundido
    ? []
    : [
        { x: 0, y: 0, w: L.ancho, h: orlaGrosor },
        { x: 0, y: L.alto - orlaGrosor, w: L.ancho, h: orlaGrosor },
        { x: 0, y: 0, w: orlaGrosor, h: L.alto },
        { x: L.ancho - orlaGrosor, y: 0, w: orlaGrosor, h: L.alto },
      ];
  // Fundido: la ilustración llega de lado a lado (su borde se difumina contra el papel). Marco: dentro de la orla.
  const margen = fundido ? 0 : orlaGrosor;
  // Fundido: la ilustración se solapa con el nombre (se imprime «oscureciendo» sobre las letras, sin tapar su
  // papel): sube por encima del final del nombre si este va arriba y baja por encima de su comienzo si va abajo.
  // Más cartel para el dibujo y las dos cosas enlazadas, como en un cartel de gira.
  const tituloAbajo = !!L.titulo && L.titulo.y >= abajo.y;
  const solape = fundido && L.titulo && (tituloAbajo || conArriba) ? L.titulo.h * SOLAPE_TITULO : 0;
  const arribaLibre = (conArriba ? arriba.h : margen) - (tituloAbajo ? 0 : solape);
  const finVentana = abajo.y + (tituloAbajo ? solape : 0);
  const ventana: Rect = { x: margen, y: arribaLibre, w: L.ancho - 2 * margen, h: Math.max(1, finVentana - arribaLibre) };
  return {
    modo: fundido ? 'fundido' : 'marco',
    color: fundido ? arte!.papel : PAPEL[papel],
    filete: FILETE[papel],
    bandas,
    filetes: fundido ? [] : filetes,
    orla,
    ventana,
  };
}

export function dibujarPlacas(ctx: CanvasRenderingContext2D, plan: PlanPlacas): void {
  ctx.fillStyle = plan.color;
  for (const r of [...plan.bandas, ...plan.orla]) ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = plan.filete;
  for (const r of plan.filetes) ctx.fillRect(r.x, r.y, r.w, r.h);
}

/** Luminosidad media (0-1) de una imagen, muestreada en pequeño. Claro si no se puede medir. */
export function luzDeImagen(img: CanvasImageSource): number {
  try {
    const mini = document.createElement('canvas');
    mini.width = 24;
    mini.height = 24;
    const c = mini.getContext('2d', { willReadFrequently: true });
    if (!c) return 1;
    c.drawImage(img, 0, 0, mini.width, mini.height);
    const d = c.getImageData(0, 0, mini.width, mini.height).data;
    let suma = 0;
    for (let i = 0; i < d.length; i += 4) suma += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    return suma / (d.length / 4);
  } catch (e) {
    console.warn('[Cartel] No se pudo medir la luz del fondo; se usa papel claro:', e);
    return 1;
  }
}
