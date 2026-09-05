import React, { useState, useRef, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ReferenceArea, ReferenceLine } from 'recharts';
import { titlesMatch } from '../../utils/songTitleMatch';

export interface EnergyChartPoint {
  idx: number;
  id: string;
  name: string;
  /** null en los eventos de "speech" (chapa, presentación, interludio...) — no tienen una energía
   * real que valga la pena dibujar en la curva, y contarlos como un bajón sería un falso positivo.
   * Con `connectNulls` en el Area/Line, la curva pasa por encima de ellos sin dibujar un valle. */
  score: number | null;
  /** Curva de energía "ideal" de referencia para este mismo punto (ver calcularCurvaEnergiaIdeal)
   * — se pinta por debajo de la curva real para ver de un vistazo dónde se aleja más. También
   * null en los eventos de "speech", por la misma razón que `score`. */
  idealScore?: number | null;
  range: [number, number];
  color: string;
  icon: string;
  label: string;
  variance: number;
  isSong: boolean;
  /** true en cualquier evento que no sea una canción (chapa, presentación, interludio, pausa,
   * bis...) — el "bis" en sí es solo la marca de "aquí empieza", no una canción con energía
   * propia (las canciones reales del bis puntúan por su cuenta justo después). Se marcan en el
   * gráfico con una línea vertical propia en vez de contar como un punto más de la curva. */
  isSpeechEvent?: boolean;
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
  /** Si se pasa, arrastrar un punto horizontalmente reordena el setlist a esa posición — la
   * altura del punto sigue sin poder tocarse (es la energía calculada, no un valor editable).
   * Se omite en el gráfico compacto del modal de Análisis IA, donde solo es lectura. */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Muestra/oculta la curva "ideal" de referencia (línea discontinua por debajo de la curva
   * real). Por defecto visible; el toggle vive en el componente que llama a EnergyChart. */
  showIdealCurve?: boolean;
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
  compact = false,
  onReorder,
  showIdealCurve = true
}: EnergyChartProps) {
  const gradientSuffix = compact ? '-compact' : '';
  const fontSize = compact ? 8 : 9;
  const dotDefault = compact ? 3.5 : 5.5;
  const dotSelected = compact ? 6 : 8;
  // Highlighted apenas un poco más grande que selected — antes saltaba mucho más (7/10) y el
  // efecto resultaba chillón al pasar el ratón por varias sugerencias seguidas.
  const dotHighlighted = compact ? 5 : 7;

  // Arrastrar un punto horizontalmente reordena el setlist — la posición se calcula sobre el
  // ancho real del contenedor (ratio 0-1 mapeado a índice), no sobre coordenadas internas de
  // recharts, así que no depende de sus internals de layout/escala.
  //
  // Se usa Pointer Events (no mouse+touch por separado): unifica ratón/dedo/lápiz en un solo
  // modelo, evita que un handler React de touchstart/touchmove sea `passive` por defecto (ahí
  // `preventDefault` no funciona ni sirve de nada) y evita el "ghost click" de mouse sintético que
  // los navegadores móviles disparan tras un toque. `setPointerCapture` sustituye a preventDefault
  // para decirle al navegador que ese puntero ya está siendo gestionado por nosotros.
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingFromIndex, setDraggingFromIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const draggingFromIndexRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartClientXRef = useRef<number | null>(null);

  // Umbral mínimo antes de considerar el gesto un arrastre real. Sin esto, el jitter normal del
  // dedo entre el toque y la suelta (aunque la intención fuera un simple tap) podía redondear a un
  // índice de canción distinto al de partida y reordenar solo sin querer, con "ningún control".
  const MIN_DRAG_PX = 10;

  const getIndexFromClientX = (clientX: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || chartData.length === 0) return 0;
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(chartData.length - 1, Math.round(ratio * (chartData.length - 1))));
  };

  const startDrag = (fromIndex: number, clientX: number, pointerId: number) => {
    draggingFromIndexRef.current = fromIndex;
    dragStartClientXRef.current = clientX;
    activePointerIdRef.current = pointerId;
    setDraggingFromIndex(fromIndex);
    setHoverIndex(fromIndex);
  };

  useEffect(() => {
    if (draggingFromIndex === null) return;

    const isActivePointer = (e: PointerEvent) =>
      activePointerIdRef.current === null || e.pointerId === activePointerIdRef.current;

    const resetDragState = () => {
      draggingFromIndexRef.current = null;
      dragStartClientXRef.current = null;
      activePointerIdRef.current = null;
      setDraggingFromIndex(null);
      setHoverIndex(null);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isActivePointer(e)) return;
      setHoverIndex(getIndexFromClientX(e.clientX));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isActivePointer(e)) return;
      const from = draggingFromIndexRef.current;
      const to = getIndexFromClientX(e.clientX);
      const movedEnough =
        dragStartClientXRef.current !== null &&
        Math.abs(e.clientX - dragStartClientXRef.current) >= MIN_DRAG_PX;
      if (from !== null && to !== from && movedEnough) onReorder?.(from, to);
      // Soltar sin moverse lo suficiente (o en el mismo punto de partida) es un tap/clic normal:
      // selecciona ese tema. La diana táctil que arranca el arrastre tiene pointer-events
      // encima del punto visible, así que su onClick nativo ya no llega — se resuelve aquí.
      else if (from !== null) onSelectItem?.(chartData[from]?.id);
      resetDragState();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (!isActivePointer(e)) return;
      resetDragState();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingFromIndex]);

  return (
    <div
      ref={containerRef}
      className={`relative ${compact ? 'w-full bg-black/70 rounded-lg overflow-hidden' : 'energy-map-glow w-full bg-black/70 rounded-lg overflow-hidden'}`}
      style={{ height, cursor: draggingFromIndex !== null ? 'ew-resize' : undefined }}
    >
      {!compact && (
        <style>{`
          .energy-map-glow .recharts-area-curve { filter: drop-shadow(0 0 5px rgba(255,255,255,0.25)) drop-shadow(0 0 10px rgba(255,255,255,0.12)); }
        `}</style>
      )}
      {/* Nombre de la canción que se arrastra + destino, para saber qué se está reordenando sin
          tener que leer el número de posición en el eje X. */}
      {draggingFromIndex !== null && hoverIndex !== null && (
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 bg-black/90 border border-amber-400/60 rounded-lg px-3 py-1.5 text-[11px] font-mono text-white shadow-xl pointer-events-none whitespace-nowrap">
          <span className="text-amber-300 font-bold">{chartData[draggingFromIndex]?.name}</span>
          {hoverIndex !== draggingFromIndex && (
            <>
              <span className="text-neutral-500"> → posición de </span>
              <span className="text-emerald-300">"{chartData[hoverIndex]?.name}"</span>
            </>
          )}
        </div>
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

          {/* Mientras se arrastra un punto, esta línea marca dónde caería la canción al soltar. */}
          {draggingFromIndex !== null && hoverIndex !== null && (
            <ReferenceLine x={hoverIndex} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" ifOverflow="extendDomain" />
          )}

          {/* Eventos de "speech" (chapa, presentación, interludio...): no cuentan como un bajón de
              energía (score null + connectNulls en la curva de abajo), pero se marcan con su
              propia línea vertical para que sigan siendo visibles en el gráfico. */}
          {chartData.filter((d) => d.isSpeechEvent).map((d) => (
            <ReferenceLine
              key={`speech-${d.id}`}
              x={d.idx}
              stroke="#52525b"
              strokeDasharray="2 3"
              ifOverflow="extendDomain"
              label={compact ? undefined : { value: d.icon, position: 'insideTop', fontSize: 11, fill: '#a1a1aa' }}
            />
          ))}

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
                  {d.isSpeechEvent ? (
                    <p className="text-neutral-400 flex items-center gap-1 mt-0.5">
                      <span>{d.icon}</span> Interludio — no cuenta como energía
                    </p>
                  ) : (
                    <>
                      <p className="text-neutral-300 flex items-center gap-1 mt-0.5">
                        <span>{d.icon}</span> {d.label} ({d.score}/20)
                      </p>
                      {d.variance > 0 && (
                        <p className="text-sky-300 mt-0.5">
                          🎧 Dinámica interna: {d.variance >= 6 ? 'alta (sube y baja mucho)' : d.variance >= 3 ? 'media' : 'suave'}
                        </p>
                      )}
                      {showIdealCurve && typeof d.idealScore === 'number' && Math.abs(d.idealScore - d.score) >= 2 && (
                        <p className="text-neutral-400 mt-0.5">
                          〰️ Ideal aquí: ~{d.idealScore}/20
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            }}
          />

          {/* Curva "ideal" de referencia — dibujada ANTES (por debajo, en capas) que la curva real
              para poder comparar de un vistazo dónde se aleja más, sin depender del texto del
              análisis. Discontinua y en gris neutro para no competir con los colores reales. */}
          {showIdealCurve && (
            <Line
              type="monotone"
              dataKey="idealScore"
              stroke="#9ca3af"
              strokeWidth={compact ? 1.5 : 2}
              strokeDasharray="5 4"
              strokeOpacity={0.6}
              dot={false}
              activeDot={false}
              isAnimationActive={!compact}
              animationDuration={1200}
              legendType="none"
              connectNulls
            />
          )}

          {/* Curva principal de energía tema a tema — connectNulls hace que la curva pase por
              encima de los eventos de "speech" (score null) sin dibujar un bajón ahí, uniendo
              directamente las canciones real de antes y de después. */}
          <Area
            type="monotone"
            dataKey="score"
            stroke={`url(#energyStrokeGradient${gradientSuffix})`}
            strokeWidth={compact ? 2 : 3}
            fill={`url(#energyFillGradient${gradientSuffix})`}
            fillOpacity={1}
            connectNulls
            isAnimationActive={!compact}
            animationDuration={1200}
            animationEasing="ease-out"
            // Recharts dibuja su propio "activeDot" ENCIMA del dot personalizado al pasar el
            // ratón cerca — con onReorder eso tapa el <circle> real y se traga el mousedown
            // antes de que llegue a nuestro handler de arrastre, así que se desactiva aquí.
            activeDot={onReorder ? false : { r: dotSelected, strokeWidth: 2, stroke: '#ffffff' }}
            dot={(dotProps: any) => {
              const { cx, cy, payload, index } = dotProps;
              // payload.score null (eventos de "speech") no tiene una posición real que dibujar —
              // Number.isNaN cubre el caso de que recharts calcule cy como NaN en vez de null/undefined.
              if (cx == null || cy == null || Number.isNaN(cx) || Number.isNaN(cy) || payload?.isSpeechEvent) {
                return <React.Fragment key={`dot-${index}`} />;
              }
              const isSelected = payload.id === selectedSetlistItemId;
              const isHighlighted = highlightedSongIds.length > 0 && titlesMatch(payload.name, highlightedSongIds);
              const isDraggingThis = draggingFromIndex === payload.idx;
              return (
                <React.Fragment key={`dot-${payload.id}`}>
                  {/* Diana táctil invisible: el punto visible (r=3.5-8px) es demasiado pequeño
                      para tocarlo con el dedo con precisión — este círculo transparente más
                      grande (r=18) capta el toque/clic sin cambiar el tamaño visual del punto.
                      onPointerDown cubre ratón y dedo con el mismo handler; setPointerCapture
                      le dice al navegador que este puntero ya lo gestionamos nosotros, en vez de
                      depender de preventDefault (que en un handler de touch de React es passive
                      y no tiene efecto). */}
                  {onReorder && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={18}
                      fill="transparent"
                      style={{ cursor: 'ew-resize', touchAction: 'none' }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.target as Element).setPointerCapture?.(e.pointerId);
                        startDrag(payload.idx, e.clientX, e.pointerId);
                      }}
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isDraggingThis ? dotHighlighted : isHighlighted ? dotHighlighted : isSelected ? dotSelected : dotDefault}
                    fill={payload.color}
                    stroke={isHighlighted ? payload.color : isSelected ? '#ffffff' : '#0a0a0a'}
                    strokeWidth={isHighlighted ? 2 : isSelected ? 2 : 1.5}
                    style={{
                      // ew-resize (flechas ↔) en vez de grab: el movimiento es siempre horizontal
                      // (reordenar), así que las flechas comunican mejor que "se puede arrastrar
                      // a los lados" que la mano de "grab", que sugiere arrastre libre.
                      cursor: onReorder ? 'ew-resize' : (onSelectItem ? 'pointer' : 'default'),
                      opacity: isDraggingThis ? 0.5 : 1,
                      // Glow sutil: antes el highlighted tenía un doble drop-shadow bastante más
                      // intenso que el resto, chillón al pasar por varias sugerencias seguidas.
                      filter: isHighlighted
                        ? `drop-shadow(0 0 6px ${payload.color}cc)`
                        : `drop-shadow(0 0 4px ${payload.color}99)`,
                      transition: isDraggingThis ? 'none' : 'all 0.2s ease',
                      pointerEvents: onReorder ? 'none' : 'auto'
                    }}
                    onClick={() => { if (draggingFromIndex === null) onSelectItem?.(payload.id); }}
                  />
                </React.Fragment>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
