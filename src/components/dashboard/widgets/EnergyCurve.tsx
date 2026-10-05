import React, { useEffect, useMemo, useRef, useState } from "react";
import { monotonePath } from "../../repertorio/EnergyChart";

export interface EnergyCurvePoint {
  num: number;
  title: string;
  energy: number;
}

interface EnergyCurveProps {
  data: EnergyCurvePoint[];
  height: number;
}

const PAD = { top: 12, right: 10, bottom: 22, left: 26 };
const Y_TICKS = [5, 10, 15, 20];

/**
 * Curva de energía de solo lectura para el dashboard: misma línea suave (interpolación monótona)
 * que el Mapa de Energía del setlist, medida al ancho real de su contenedor — nunca se sale de
 * la tarjeta, tenga 6 temas o 40.
 */
export function EnergyCurve({ data, height }: EnergyCurveProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(160, Math.floor(el.clientWidth)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const xOf = (i: number) =>
      PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const yOf = (v: number) => PAD.top + innerH - ((v - 1) / 19) * innerH;
    const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.energy) }));
    const line = monotonePath(pts);
    const baseY = PAD.top + innerH;
    const area =
      pts.length > 1
        ? `${line} L${pts[pts.length - 1].x},${baseY} L${pts[0].x},${baseY} Z`
        : "";
    return { pts, line, area, yOf, baseY };
  }, [data, width, height]);

  // Etiquetas del eje X: una cada `step` temas para que nunca se pisen (≥ 28 px entre etiquetas).
  const step = Math.max(
    1,
    Math.ceil(
      data.length /
        Math.max(1, Math.floor((width - PAD.left - PAD.right) / 28)),
    ),
  );

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let best = 0;
    let bestD = Infinity;
    geo.pts.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setActive(best);
  };

  const activePt = active !== null ? geo.pts[active] : null;
  const activeData = active !== null ? data[active] : null;
  const tipLeft = activePt
    ? Math.min(Math.max(activePt.x, 96), width - 96)
    : 0;

  return (
    <div ref={wrapRef} className="relative w-full min-w-0 overflow-hidden">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Curva de energía de ${data.length} temas, de 1 a 20`}
        className="block max-w-full touch-pan-y"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
      >
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={geo.yOf(t)}
              y2={geo.yOf(t)}
              stroke="var(--hair)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={geo.yOf(t) + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--ink-3)"
              className="tabular-nums"
            >
              {t}
            </text>
          </g>
        ))}

        {geo.area && <path d={geo.area} fill="var(--acc)" opacity={0.1} />}
        <path
          d={geo.line}
          fill="none"
          stroke="var(--acc)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {activePt && (
          <line
            x1={activePt.x}
            x2={activePt.x}
            y1={PAD.top}
            y2={geo.baseY}
            stroke="var(--hair)"
            strokeWidth={1}
          />
        )}

        {geo.pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={active === i ? 5 : data.length > 24 ? 2.5 : 3.5}
            fill={active === i ? "var(--acc)" : "var(--surface)"}
            stroke="var(--acc)"
            strokeWidth={2}
          />
        ))}

        {data.map((d, i) =>
          i % step === 0 ? (
            <text
              key={d.num}
              x={geo.pts[i].x}
              y={height - 6}
              textAnchor="middle"
              fontSize={11}
              fill="var(--ink-3)"
              className="tabular-nums"
            >
              {d.num}
            </text>
          ) : null,
        )}
      </svg>

      {activePt && activeData && (
        <div
          className="pointer-events-none absolute flex max-w-[15rem] -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-[var(--r-s)] bg-[var(--surface)] border border-[var(--line)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
          style={{ left: tipLeft, top: Math.max(activePt.y - 10, 24) }}
        >
          <span className="min-w-0 truncate">
            <span className="text-[var(--ink-2)]">{activeData.num}. </span>
            {activeData.title}
          </span>
          <span className="shrink-0 font-semibold tabular-nums">
            {activeData.energy}/20
          </span>
        </div>
      )}
    </div>
  );
}
