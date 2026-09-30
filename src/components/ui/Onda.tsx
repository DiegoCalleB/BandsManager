import React, { useMemo } from 'react';

export interface OndaBar {
  label: string;
  value: number;
  /** Token CSS completo, p. ej. 'var(--ok)'. Por defecto el acento del módulo activo. */
  color?: string;
}

export interface OndaProps {
  data: OndaBar[];
  height?: number;
  barWidth?: number;
  gap?: number;
  className?: string;
  showLabels?: boolean;
  /** Pinta el valor encima de cada barra (útil con pocas barras). */
  showValues?: boolean;
  animated?: boolean;
  tooltipFormatter?: (value: number) => string;
  /** Formato del número sobre la barra (por defecto el valor tal cual, sin texto largo). */
  valueFormatter?: (value: number) => string;
  /** Texto cuando no hay ninguna barra con datos. */
  emptyText?: string;
}

/**
 * La Onda — el único lenguaje de datos de BandManager (visual-identity §2).
 * Barras verticales de punta redondeada, inspiradas en el espectro del logo.
 *
 * Gramática de color: --acc = consumado/pico · --ok = en curso · --hair = inerte / sin dato.
 * Los colores van como `var(--token)` (no getComputedStyle): así siguen al tema y al módulo
 * activo aunque se pinten dentro de un portal.
 */
export const Onda: React.FC<OndaProps> = ({
  data,
  height = 120,
  barWidth = 16,
  gap = 8,
  className = '',
  showLabels = true,
  showValues = false,
  animated = true,
  tooltipFormatter = (v) => v.toString(),
  valueFormatter = (v) => v.toLocaleString('es-ES'),
  emptyText,
}) => {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const hasData = data.some((d) => d.value > 0);

  if (!data.length || (!hasData && emptyText)) {
    return (
      <div
        className={className}
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', fontSize: 12 }}
      >
        {emptyText || 'Aún no hay cifras'}
      </div>
    );
  }

  const valueRoom = showValues ? 18 : 0;

  return (
    <div className={className}>
      <div
        style={{
          display: 'flex',
          gap,
          alignItems: 'flex-end',
          justifyContent: 'center',
          height: height + valueRoom,
        }}
      >
        {data.map((bar, index) => {
          const inert = bar.value <= 0;
          const barHeight = inert ? 3 : Math.max(4, (bar.value / maxValue) * height);
          return (
            <div
              key={`${bar.label}-${index}`}
              style={{
                flex: `0 1 ${barWidth + gap}px`,
                minWidth: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {showValues && (
                <span style={{ fontSize: 10, lineHeight: '14px', color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                  {valueFormatter(bar.value)}
                </span>
              )}
              <div
                title={`${bar.label}: ${tooltipFormatter(bar.value)}`}
                style={{
                  width: '100%',
                  maxWidth: barWidth,
                  height: barHeight,
                  backgroundColor: inert ? 'var(--hair)' : bar.color || 'var(--acc)',
                  borderRadius: 'var(--r-pill) var(--r-pill) 0 0',
                  transition: animated ? 'height 0.3s ease-out' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div style={{ display: 'flex', gap, justifyContent: 'center', marginTop: 8 }}>
          {data.map((bar, index) => (
            <div
              key={`l-${bar.label}-${index}`}
              style={{
                flex: `0 1 ${barWidth + gap}px`,
                minWidth: 4,
                textAlign: 'center',
                fontSize: 11,
                color: 'var(--ink-2)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={bar.label}
            >
              {bar.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * OndaSeries — varias series agrupadas por etiqueta del eje X.
 * Cada serie lleva su color (por defecto el acento del módulo).
 */
export interface OndaSeriesProps {
  series: {
    label: string;
    data: OndaBar[];
    color?: string;
  }[];
  height?: number;
  barWidth?: number;
  gap?: number;
  className?: string;
  showLabels?: boolean;
}

export const OndaSeries: React.FC<OndaSeriesProps> = ({
  series,
  height = 120,
  barWidth = 12,
  gap = 4,
  className = '',
  showLabels = true,
}) => {
  const maxValue = Math.max(...series.flatMap((s) => s.data.map((d) => d.value)), 1);
  const labels = series[0]?.data.map((d) => d.label) || [];

  return (
    <div className={className}>
      <div style={{ display: 'flex', gap: gap * 2, alignItems: 'flex-end', justifyContent: 'center', height }}>
        {labels.map((label, labelIndex) => (
          <div key={`group-${label}`} style={{ display: 'flex', gap, alignItems: 'flex-end', minWidth: 0 }}>
            {series.map((s) => {
              const value = s.data[labelIndex]?.value || 0;
              return (
                <div
                  key={`${s.label}-${label}`}
                  title={`${s.label} · ${label}: ${value}`}
                  style={{
                    width: barWidth,
                    height: value <= 0 ? 3 : Math.max(4, (value / maxValue) * height),
                    backgroundColor: value <= 0 ? 'var(--hair)' : s.color || 'var(--acc)',
                    borderRadius: 'var(--r-pill) var(--r-pill) 0 0',
                    transition: 'height 0.3s ease-out',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      {showLabels && (
        <>
          <div style={{ display: 'flex', gap: gap * 2, justifyContent: 'center', marginTop: 8 }}>
            {labels.map((label) => (
              <div
                key={`x-${label}`}
                style={{ width: series.length * barWidth + (series.length - 1) * gap, textAlign: 'center', fontSize: 11, color: 'var(--ink-2)' }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: 12 }}>
            {series.map((s) => (
              <div key={`legend-${s.label}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{ width: 10, height: 10, backgroundColor: s.color || 'var(--acc)', borderRadius: 'var(--r-pill)' }}
                />
                <span style={{ color: 'var(--ink-2)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Onda;
