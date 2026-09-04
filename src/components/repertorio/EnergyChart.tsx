import React from 'react';
import { ResponsiveContainer, ComposedChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ReferenceArea } from 'recharts';
import { titlesMatch } from '../../utils/songTitleMatch';

export interface EnergyChartPoint {
  idx: number;
  id: string;
  name: string;
  score: number;
  range: [number, number];
  color: string;
  icon: string;
  label: string;
  variance: number;
  isSong: boolean;
}

export interface EnergyChartZone {
  min: number;
  max: number;
  color: string;
  y1: number;
  y2: number;
}

interface EnergyChartProps {
  /** Identifica el setlist para el `key` del chart — remonta (y re-anima) al cambiar de setlist, nunca por interacciones de UI. */
  setlistKey: string;
  chartData: EnergyChartPoint[];
  yDomain: [number, number];
  zonasEnergia: EnergyChartZone[];
  highlightedSongIds?: string[];
  selectedSetlistItemId?: string | null;
  onSelectItem?: (id: string) => void;
  /** Alto del contenedor del gráfico en px. Default 256 (el tamaño del Mapa de Energía grande). */
  height?: number;
  /** Versión reducida para espacios pequeños (p.ej. dentro del modal de Análisis IA): sin glow, ejes/puntos más pequeños. */
  compact?: boolean;
}

/**
 * El Mapa de Energía del show, extraído a un componente reutilizable para poder mostrarlo tanto
 * en el editor de setlist como (en tamaño reducido) dentro del modal de Análisis IA — así las
 * sugerencias pueden mostrar el gráfico con el highlighting integrado en vez de depender de que
 * el usuario vea el modal y el gráfico grande a la vez sin que se tapen.
 */
export function EnergyChart({
  setlistKey,
  chartData,
  yDomain,
  zonasEnergia,
  highlightedSongIds = [],
  selectedSetlistItemId = null,
  onSelectItem,
  height = 256,
  compact = false
}: EnergyChartProps) {
  const gradientSuffix = compact ? '-compact' : '';
  const fontSize = compact ? 8 : 9;
  const dotDefault = compact ? 3.5 : 5.5;
  const dotSelected = compact ? 6 : 8;
  const dotHighlighted = compact ? 7 : 10;

  return (
    <div
      className={compact ? 'w-full bg-black/70 rounded-lg overflow-hidden' : 'energy-map-glow w-full bg-black/70 rounded-lg overflow-hidden'}
      style={{ height }}
    >
      {!compact && (
        <style>{`
          .energy-map-glow .recharts-area-curve { filter: drop-shadow(0 0 5px rgba(255,255,255,0.25)) drop-shadow(0 0 10px rgba(255,255,255,0.12)); }
        `}</style>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart key={setlistKey} data={chartData} margin={compact ? { top: 8, right: 8, left: -22, bottom: 0 } : { top: 14, right: 14, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`energyStrokeGradient${gradientSuffix}`} x1="0" y1="0" x2="1" y2="0">
              {chartData.map((d, i) => (
                <stop
                  key={d.id}
                  offset={`${chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 0}%`}
                  stopColor={d.color}
                />
              ))}
            </linearGradient>
            {/* El relleno bajo la curva usa los mismos colores por canción que el trazo (a opacidad
                baja) en vez de un dorado plano fijo — así el "aura" bajo la curva también cambia
                de color según la categoría de energía. */}
            <linearGradient id={`energyFillGradient${gradientSuffix}`} x1="0" y1="0" x2="1" y2="0">
              {chartData.map((d, i) => (
                <stop
                  key={d.id}
                  offset={`${chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 0}%`}
                  stopColor={d.color}
                  stopOpacity={0.22}
                />
              ))}
            </linearGradient>
          </defs>

          {zonasEnergia.map((z) => (
            <ReferenceArea key={z.min} y1={z.y1} y2={z.y2} fill={z.color} fillOpacity={0.07} stroke="none" ifOverflow="hidden" />
          ))}

          <CartesianGrid horizontal vertical={false} stroke="#2c2c2a" strokeDasharray="0" />

          <XAxis
            dataKey="idx"
            tickFormatter={(v: number) => `#${v + 1}`}
            stroke="#666666"
            fontSize={fontSize}
            tickLine={false}
            axisLine={false}
            hide={compact}
          />
          <YAxis domain={yDomain} stroke="#666666" fontSize={fontSize} tickLine={false} axisLine={false} width={compact ? 0 : 22} hide={compact} />

          <RechartsTooltip
            cursor={{ stroke: '#666', strokeDasharray: '3 3' }}
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-black text-white text-[9px] font-mono py-1.5 px-2.5 rounded-lg shadow-xl border border-neutral-700 max-w-[180px]">
                  <p className="font-bold text-[#d1b375] text-[10px]">#{d.idx + 1} {d.name}</p>
                  <p className="text-neutral-300 flex items-center gap-1 mt-0.5">
                    <span>{d.icon}</span> {d.label} ({d.score}/20)
                  </p>
                  {d.variance > 0 && (
                    <p className="text-sky-300 mt-0.5">
                      🎧 Dinámica interna: {d.variance >= 6 ? 'alta (sube y baja mucho)' : d.variance >= 3 ? 'media' : 'suave'}
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Banda de dinámica interna detectada del audio (temas "anchos" varían mucho por dentro) */}
          <Area
            type="monotone"
            dataKey="range"
            stroke="none"
            fill="#d1b375"
            fillOpacity={0.12}
            isAnimationActive={!compact}
            animationDuration={1200}
            animationEasing="ease-out"
          />

          {/* Curva principal de energía tema a tema */}
          <Area
            type="monotone"
            dataKey="score"
            stroke={`url(#energyStrokeGradient${gradientSuffix})`}
            strokeWidth={compact ? 2 : 3}
            fill={`url(#energyFillGradient${gradientSuffix})`}
            fillOpacity={1}
            isAnimationActive={!compact}
            animationDuration={1200}
            animationEasing="ease-out"
            activeDot={{ r: dotSelected, strokeWidth: 2, stroke: '#ffffff' }}
            dot={(dotProps: any) => {
              const { cx, cy, payload, index } = dotProps;
              if (cx == null || cy == null) return <React.Fragment key={`dot-${index}`} />;
              const isSelected = payload.id === selectedSetlistItemId;
              const isHighlighted = highlightedSongIds.length > 0 && titlesMatch(payload.name, highlightedSongIds);
              return (
                <circle
                  key={`dot-${payload.id}`}
                  cx={cx}
                  cy={cy}
                  r={isHighlighted ? dotHighlighted : isSelected ? dotSelected : dotDefault}
                  fill={payload.color}
                  stroke={isHighlighted ? payload.color : isSelected ? '#ffffff' : '#0a0a0a'}
                  strokeWidth={isHighlighted ? 3 : isSelected ? 2 : 1.5}
                  style={{
                    cursor: onSelectItem ? 'pointer' : 'default',
                    opacity: 1,
                    filter: isHighlighted
                      ? `drop-shadow(0 0 10px ${payload.color}ff) drop-shadow(0 0 20px ${payload.color}aa)`
                      : `drop-shadow(0 0 5px ${payload.color}bb)`,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => onSelectItem?.(payload.id)}
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
