// Velo bajo el texto: sombra de la propia imagen que se desvanece hacia el centro del cartel.

import type { Tinta } from './contraste';
import type { Rect } from './layout';

/** Color medio de la zona, muy oscurecido: la sombra del texto es de la propia imagen, no un negro de ordenador. */
export function sombraDe(ctx: CanvasRenderingContext2D, r: Rect): string | null {
  try {
    const d = ctx.getImageData(Math.max(0, Math.round(r.x)), Math.max(0, Math.round(r.y)), Math.max(1, Math.round(r.w)), Math.max(1, Math.round(r.h))).data;
    let R = 0, G = 0, B = 0, n = 0;
    for (let i = 0; i < d.length; i += 4 * 17) {
      R += d[i]; G += d[i + 1]; B += d[i + 2]; n++;
    }
    return n ? `${Math.round((R / n) * 0.22)},${Math.round((G / n) * 0.22)},${Math.round((B / n) * 0.22)}` : null;
  } catch {
    return null;
  }
}

/** Velo sobre la zona del texto que se desvanece hacia el centro del cartel (con curva suave, sin escalón). */
export function velar(ctx: CanvasRenderingContext2D, r: Rect, t: Tinta, haciaAbajo: boolean, fundido: number, color?: string | null) {
  if (!t.velo) return;
  const rgb = color ?? (t.tinta === 'clara' ? '15,16,20' : '244,241,234');
  const y0 = haciaAbajo ? r.y : r.y - fundido;
  const y1 = haciaAbajo ? r.y + r.h + fundido : r.y + r.h;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  const corte = fundido / (y1 - y0);
  // Rampa suave (smoothstep) en la parte que se desvanece.
  const PASOS = 6;
  for (let i = 0; i <= PASOS; i++) {
    const k = i / PASOS;
    const alfa = t.velo * (1 - k * k * (3 - 2 * k));
    if (haciaAbajo) g.addColorStop(1 - corte + corte * k, `rgba(${rgb},${alfa})`);
    else g.addColorStop(corte * (1 - k), `rgba(${rgb},${alfa})`);
  }
  if (haciaAbajo) g.addColorStop(0, `rgba(${rgb},${t.velo})`);
  else g.addColorStop(1, `rgba(${rgb},${t.velo})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, r.w, y1 - y0);
}
