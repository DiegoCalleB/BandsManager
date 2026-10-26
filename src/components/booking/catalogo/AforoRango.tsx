/** Escalones del slider: no lineal, porque la diferencia entre 50 y 100 personas pesa más que entre 3000 y 3050. */
const ESCALONES_AFORO = [0, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000];
const ULTIMO = ESCALONES_AFORO.length - 1;

const indiceDe = (valor: string, porDefecto: number) => {
  const i = ESCALONES_AFORO.findIndex((e) => e === Number(valor));
  return valor.trim() && i >= 0 ? i : porDefecto;
};

const PULGAR = [
  'pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent outline-none',
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--acc)]',
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--acc)]',
  'focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-[var(--acc-soft)]',
].join(' ');

interface AforoRangoProps {
  min: string;
  max: string;
  onChange: (rango: { aforoMin: string; aforoMax: string }) => void;
}

/** Rango de aforo en una línea: dos tiradores. En los extremos significa «sin límite» y no se manda al servidor. */
export function AforoRango({ min, max, onChange }: AforoRangoProps) {
  const a = indiceDe(min, 0);
  const b = indiceDe(max, ULTIMO);
  const emitir = (i: number, j: number) => onChange({ aforoMin: i === 0 ? '' : String(ESCALONES_AFORO[i]), aforoMax: j === ULTIMO ? '' : String(ESCALONES_AFORO[j]) });
  const pct = (i: number) => (i / ULTIMO) * 100;
  const texto = a === 0 && b === ULTIMO ? 'Cualquier aforo' : a === 0 ? `Hasta ${ESCALONES_AFORO[b]} personas` : b === ULTIMO ? `Más de ${ESCALONES_AFORO[a]} personas` : `${ESCALONES_AFORO[a]} – ${ESCALONES_AFORO[b]} personas`;

  return (
    <div className="space-y-1.5 sm:col-span-3 sm:max-w-sm">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-[var(--ink-2)]">Aforo</span>
        <span className="font-semibold tabular-nums" aria-live="polite">{texto}</span>
      </div>
      <div className="relative mx-2.5 h-5">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-[var(--r-pill)] bg-[var(--sunken)]" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-[var(--r-pill)] bg-[var(--acc)]" style={{ left: `${pct(a)}%`, right: `${100 - pct(b)}%` }} />
        <input type="range" aria-label="Aforo mínimo" min={0} max={ULTIMO} step={1} value={a} onChange={(e) => emitir(Math.min(Number(e.target.value), b), b)} className={PULGAR} style={{ zIndex: a > ULTIMO / 2 ? 30 : 10 }} />
        <input type="range" aria-label="Aforo máximo" min={0} max={ULTIMO} step={1} value={b} onChange={(e) => emitir(a, Math.max(Number(e.target.value), a))} className={PULGAR} style={{ zIndex: 20 }} />
      </div>
    </div>
  );
}
