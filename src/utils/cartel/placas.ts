// Placas de papel: en un cartel impreso el texto no flota encima de la ilustración, tiene su sitio.
// Sobre un fondo de IA se pintan dos bandas lisas (arriba el nombre, abajo los datos) con un filete
// y una orla fina alrededor, así la ilustración respira en la ventana central y el texto se lee
// siempre, aunque el modelo de imagen haya puesto detalle donde no debía.
//
// `planPlacas` es puro (testeable sin canvas); `dibujarPlacas` solo pinta el plan.

import type { LayoutCartel, Rect } from './layout';

/** Papel claro y papel oscuro de la obra (como las tintas del cartel, no son tokens de la interfaz). */
export const PAPEL = { claro: '#EFE8D8', oscuro: '#16171B' } as const;
const FILETE = { claro: '#16171B', oscuro: '#EFE8D8' } as const;

/** Si las dos bandas juntas se comen más que esto del alto, la ilustración se quedaría sin ventana. */
const MAX_OCUPADO = 0.7;

export interface PlanPlacas {
  color: string;
  filete: string;
  /** Bandas lisas (arriba y/o abajo) y su filete en el borde que da a la ilustración. */
  bandas: Rect[];
  filetes: Rect[];
  /** Orla de papel alrededor de todo el cartel (4 lados). */
  orla: Rect[];
}

/** `luz`: luminosidad media del fondo (0 = negro, 1 = blanco). Un fondo claro lleva papel claro. */
export function planPlacas(L: LayoutCartel, luz: number): PlanPlacas {
  const u = L.ancho / 1080;
  const papel = luz >= 0.5 ? 'claro' : 'oscuro';
  const { arriba, abajo } = L.zonas;
  const grosorFilete = Math.max(2, Math.round(3 * u));
  const orlaGrosor = Math.round(18 * u);

  // Abajo siempre (ahí está la fecha y el QR). Arriba solo si queda ventana para la ilustración.
  const conArriba = arriba.h + abajo.h <= MAX_OCUPADO * L.alto;
  const bandas: Rect[] = [{ x: 0, y: abajo.y, w: L.ancho, h: L.alto - abajo.y }];
  const filetes: Rect[] = [{ x: 0, y: abajo.y, w: L.ancho, h: grosorFilete }];
  if (conArriba) {
    bandas.unshift({ x: 0, y: 0, w: L.ancho, h: arriba.h });
    filetes.unshift({ x: 0, y: arriba.h - grosorFilete, w: L.ancho, h: grosorFilete });
  }

  const orla: Rect[] = [
    { x: 0, y: 0, w: L.ancho, h: orlaGrosor },
    { x: 0, y: L.alto - orlaGrosor, w: L.ancho, h: orlaGrosor },
    { x: 0, y: 0, w: orlaGrosor, h: L.alto },
    { x: L.ancho - orlaGrosor, y: 0, w: orlaGrosor, h: L.alto },
  ];
  return { color: PAPEL[papel], filete: FILETE[papel], bandas, filetes, orla };
}

/**
 * Texto integrado: la ilustración llega de borde a borde y el texto se imprime encima (el velo de
 * contraste lo garantiza). Solo se conserva la orla de papel alrededor, como el margen de un cartel.
 */
export function plantillaIntegrada(plan: PlanPlacas): PlanPlacas {
  return { ...plan, bandas: [], filetes: [] };
}

export function dibujarPlacas(ctx: CanvasRenderingContext2D, plan: PlanPlacas): void {
  ctx.fillStyle = plan.color;
  for (const r of [...plan.bandas, ...plan.orla]) ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = plan.filete;
  for (const r of plan.filetes) ctx.fillRect(r.x, r.y, r.w, r.h);
}

/** Luminosidad media (0-1) de lo que hay ahora en el canvas, muestreada en pequeño. Claro si no se puede medir. */
export function luzMedia(canvas: HTMLCanvasElement): number {
  try {
    const mini = document.createElement('canvas');
    mini.width = 24;
    mini.height = 30;
    const c = mini.getContext('2d', { willReadFrequently: true });
    if (!c) return 1;
    c.drawImage(canvas, 0, 0, mini.width, mini.height);
    const d = c.getImageData(0, 0, mini.width, mini.height).data;
    let suma = 0;
    for (let i = 0; i < d.length; i += 4) suma += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    return suma / (d.length / 4);
  } catch (e) {
    console.warn('[Cartel] No se pudo medir la luz del fondo; se usa papel claro:', e);
    return 1;
  }
}
