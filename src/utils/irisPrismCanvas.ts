export const IRIS_PRISM_PERIOD = 6;

export const IRIS_PRISM_LANES = [
  { color: '#f43f5e', label: 'Voz', k: 2 },
  { color: '#f97316', label: 'Batería', k: 3 },
  { color: '#eab308', label: 'Bajo', k: 1 },
  { color: '#22c55e', label: 'Guitarras', k: 2 },
  { color: '#06b6d4', label: 'Teclados', k: 3 },
  { color: '#a855f7', label: 'Arreglos', k: 1 },
];

const TAU = Math.PI * 2;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const STARS = (() => {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 70 }, () => ({ x: r(), y: r(), z: r(), p: Math.floor(r() * 3) }));
})();

/**
 * Dibuja un fotograma. Todo es periódico en `IRIS_PRISM_PERIOD` segundos (frecuencias enteras),
 * así que el bucle no tiene salto. El prisma no se mueve; solo viaja la onda.
 */
export function drawIrisPrism(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, labels = false) {
  const ph = (time % IRIS_PRISM_PERIOD) / IRIS_PRISM_PERIOD;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, w, h);

  for (const st of STARS) {
    const tw = 0.5 + 0.5 * Math.sin(TAU * (ph * (1 + st.p) + st.x));
    ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.35 * st.z * tw})`;
    ctx.fillRect(st.x * w, st.y * h, 1 + st.z * 1.2, 1 + st.z * 1.2);
  }

  const cy = h * 0.5;
  const cx = w * 0.4;
  const ph2 = h * 0.8;
  const side = (ph2 * 2) / Math.sqrt(3);
  const ex = cx - side / 4;
  const xx = cx + side / 4;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.globalCompositeOperation = 'lighter';
  const lanesEnd = labels ? w - Math.min(110, w * 0.16) : w - 6;
  const len = lanesEnd - xx;
  const lam = Math.max(40, w * 0.085);

  IRIS_PRISM_LANES.forEach((lane, i) => {
    const spread = (i - (IRIS_PRISM_LANES.length - 1) / 2) / ((IRIS_PRISM_LANES.length - 1) / 2);
    const slope = spread * h * 0.3 / len;
    ctx.strokeStyle = lane.color;
    ctx.shadowColor = lane.color;
    for (const pass of [0, 1]) {
      ctx.lineWidth = pass === 0 ? 5 : 1.8;
      ctx.globalAlpha = pass === 0 ? 0.14 : 0.95;
      ctx.shadowBlur = pass === 0 ? 0 : 8;
      ctx.beginPath();
      for (let s = 0; s <= len; s += 3) {
        const env = smooth(0, len * 0.18, s) * (1 - 0.35 * smooth(len * 0.6, len, s));
        const amp = h * 0.05 * env;
        const y = cy + slope * s + amp * Math.sin(TAU * (s / lam - lane.k * ph) + i);
        if (s === 0) ctx.moveTo(xx + s, y);
        else ctx.lineTo(xx + s, y);
      }
      ctx.stroke();
    }
    if (labels) {
      const endY = cy + slope * len;
      ctx.globalAlpha = 0.9;
      ctx.shadowBlur = 0;
      ctx.fillStyle = lane.color;
      ctx.font = `600 ${Math.max(10, Math.min(22, h * 0.05))}px ui-monospace, monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillText(lane.label, lanesEnd + 8, endY);
    }
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  for (const pass of [0, 1]) {
    ctx.lineWidth = pass === 0 ? 7 : 2.4;
    ctx.globalAlpha = pass === 0 ? 0.14 : 0.95;
    ctx.shadowBlur = pass === 0 ? 0 : 10;
    ctx.beginPath();
    for (let x = 0; x <= ex; x += 3) {
      const u = x / ex;
      const env = smooth(0, 0.3, u) * (1 - smooth(0.78, 1, u));
      const a = h * 0.18 * env;
      const wv =
        Math.sin(TAU * (x / lam - ph)) * 0.6 +
        Math.sin(TAU * (x / (lam * 0.5) - 2 * ph) + 1) * 0.3 +
        Math.sin(TAU * (x / (lam * 0.33) - 3 * ph) + 2) * 0.15;
      const y = cy + a * wv;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  const apex = [cx, cy - ph2 / 2];
  const bl = [cx - side / 2, cy + ph2 / 2];
  const br = [cx + side / 2, cy + ph2 / 2];
  const g = ctx.createLinearGradient(bl[0], apex[1], br[0], br[1]);
  g.addColorStop(0, 'rgba(255,255,255,0.10)');
  g.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.beginPath();
  ctx.moveTo(apex[0], apex[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.65 + 0.35 * Math.sin(TAU * 2 * ph);
  for (const [fx, r] of [[ex, h * 0.16], [xx, h * 0.2]] as const) {
    const rg = ctx.createRadialGradient(fx, cy, 0, fx, cy, r);
    rg.addColorStop(0, `rgba(255,255,255,${0.85 * pulse})`);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(fx - r, cy - r, r * 2, r * 2);
  }
  ctx.strokeStyle = `rgba(255,255,255,${0.35 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex, cy);
  ctx.lineTo(xx, cy);
  ctx.stroke();
  ctx.restore();
}
