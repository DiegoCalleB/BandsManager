import React, { useEffect, useMemo, useRef, useState } from 'react';
import { monotonePath } from '../../utils/curve';
import { cn } from '../../utils/cn';

export interface CurveSeriesProps {
  series: { label: string; color?: string; data: { label: string; value: number }[] }[];
  height?: number;
  className?: string;
  /** Formato del valor en ejes y tooltip (por defecto, es-ES con separador de millares). */
  formatValue?: (v: number) => string;
  /** Sombrea el área bajo la curva (solo con una serie). */
  area?: boolean;
}

const PAD = { top: 12, right: 14, bottom: 24, left: 44 };
const nf = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });

/** «Bonito» techo del eje Y: 1, 2, 2,5, 5 × 10ⁿ. */
function niceMax(v: number) {
  if (v <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) if (m * pow >= v) return m * pow;
  return 10 * pow;
}

/**
 * Evolución en el tiempo como curvas suaves (interpolación monótona, nunca se pasa de los datos).
 * Es el lenguaje de las series temporales de BandManager —crecimiento de redes, fans—; la Onda de barras queda para
 * comparar categorías discretas (bolos por mes, ingresos por canal). Varias series comparten eje; al pasar el puntero
 * (o tocar) aparece una guía con el valor de cada canal. Se mide al ancho real del contenedor: nunca desborda.
 */
export function CurveSeries({ series, height = 220, className, formatValue, area }: CurveSeriesProps) {
  const fmt = formatValue ?? ((v: number) => v.toLocaleString('es-ES'));
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(200, Math.floor(el.clientWidth)));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = series[0]?.data.length ?? 0;
  const geo = useMemo(() => {
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const max = niceMax(Math.max(...series.flatMap((s) => s.data.map((d) => d.value)), 1));
    const xOf = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yOf = (v: number) => PAD.top + innerH - (v / max) * innerH;
    const base = PAD.top + innerH;
    const lines = series.map((s) => {
      const pts = s.data.map((d, i) => ({ x: xOf(i), y: yOf(d.value) }));
      const line = monotonePath(pts);
      const areaPath = pts.length > 1 ? `${line} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z` : '';
      return { pts, line, areaPath };
    });
    return { max, xOf, yOf, base, lines, innerW };
  }, [series, width, height, n]);

  if (n === 0) return null;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * geo.max);
  const step = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(geo.innerW / 52))));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = Math.round(((x - PAD.left) / Math.max(1, geo.innerW)) * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, i)));
  };
  const ax = active !== null ? geo.xOf(active) : 0;
  const tipLeft = Math.min(Math.max(ax, 92), width - 92);

  return (
    <div ref={wrapRef} className={cn('relative w-full min-w-0 overflow-hidden', className)}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Evolución de ${series.map((s) => s.label).join(', ')}`}
        className="block max-w-full touch-pan-y"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={geo.yOf(t)} y2={geo.yOf(t)} stroke="var(--hair)" strokeWidth={1} />
            <text x={PAD.left - 8} y={geo.yOf(t) + 4} textAnchor="end" fontSize={11} fill="var(--ink-2)" className="tabular-nums">
              {t === 0 ? '0' : nf.format(t)}
            </text>
          </g>
        ))}

        {area && series.length === 1 && geo.lines[0].areaPath && (
          <path d={geo.lines[0].areaPath} fill={series[0].color || 'var(--acc)'} opacity={0.1} />
        )}
        {geo.lines.map((l, i) => (
          <path
            key={series[i].label}
            d={l.line}
            fill="none"
            stroke={series[i].color || 'var(--acc)'}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {active !== null && (
          <g>
            <line x1={ax} x2={ax} y1={PAD.top} y2={geo.base} stroke="var(--line-strong)" strokeWidth={1} />
            {geo.lines.map((l, i) => (
              <circle key={series[i].label} cx={l.pts[active].x} cy={l.pts[active].y} r={4.5} fill="var(--surface)" stroke={series[i].color || 'var(--acc)'} strokeWidth={2.25} />
            ))}
          </g>
        )}
        {active === null &&
          geo.lines.map((l, i) => (
            <circle key={series[i].label} cx={l.pts[n - 1].x} cy={l.pts[n - 1].y} r={3.5} fill={series[i].color || 'var(--acc)'} />
          ))}

        {series[0].data.map((d, i) =>
          i % step === 0 || i === n - 1 ? (
            <text key={i} x={geo.xOf(i)} y={height - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize={11} fill="var(--ink-2)" className="tabular-nums">
              {d.label}
            </text>
          ) : null,
        )}
      </svg>

      {active !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-[var(--r-s)] bg-[var(--sunken)] px-2.5 py-2 text-xs text-[var(--ink)]"
          style={{ left: tipLeft, top: PAD.top }}
        >
          <div className="mb-1 font-medium text-[var(--ink-2)] tabular-nums">{series[0].data[active].label}</div>
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-2 whitespace-nowrap">
              <span aria-hidden className="size-2 rounded-full" style={{ background: s.color || 'var(--acc)' }} />
              <span className="text-[var(--ink-2)]">{s.label}</span>
              <span className="ml-auto pl-3 font-semibold tabular-nums">{fmt(s.data[active].value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
