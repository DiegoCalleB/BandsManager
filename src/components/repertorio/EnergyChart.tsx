import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ReferenceArea, ReferenceLine } from 'recharts';
import { titlesMatch } from '../../utils/songTitleMatch';
import { getEnergyInfo } from '../../utils/energyPacingUtils';
import { EvaluacionUnion } from '../../utils/setlistCompatibility';

export interface EnergyChartPoint {
 idx: number;
 id: string;
 name: string;
 /** id de la canción real detrás de este punto — solo presente en canciones (no en eventos de
 *"speech"/bis). Necesario para saber qué punto se puede editar arrastrando en vertical. */
 songId?: string;
 /** null en los eventos de"speech" (chapa, presentación, interludio...) — no tienen una energía
 * real que valga la pena dibujar en la curva, y contarlos como un bajón sería un falso positivo.
 * Con `connectNulls` en el Area/Line, la curva pasa por encima de ellos sin dibujar un valle. */
 score: number | null;
 /** Curva de energía"ideal" de referencia para este mismo punto (ver calcularCurvaEnergiaIdeal)
 * — se pinta por debajo de la curva real para ver de un vistazo dónde se aleja más. También
 * null en los eventos de"speech", por la misma razón que `score`. */
 idealScore?: number | null;
 range: [number, number];
 color: string;
 icon: string;
 label: string;
 variance: number;
 isSong: boolean;
 /** true en cualquier evento que no sea una canción (chapa, presentación, interludio, pausa,
 * bis...) — el"bis" en sí es solo la marca de"aquí empieza", no una canción con energía
 * propia (las canciones reales del bis puntúan por su cuenta justo después). Se marcan en el
 * gráfico con una línea vertical propia en vez de contar como un punto más de la curva. */
 isSpeechEvent?: boolean;
 /** BPM de la canción (detectado o manual) — null/undefined si no hay dato o es un evento de
 *"speech". Se pinta como línea fina en un eje secundario, superpuesta a la curva de energía. */
 bpm?: number | null;
 /** true si la transición de ESTA canción a la SIGUIENTE es un choque de tonalidad (círculo de
 * quintas) — ver evaluarTransicionArmonica en harmonicAnalysis.ts. Se marca con un aviso entre
 * ambos puntos, igual que ya se hace con los eventos de"speech". */
 harmonyClash?: boolean;
 /** Tonalidad de la canción (detectada o manual, p.ej."Am","C","F#"), null/undefined si no
 * hay dato o es un evento de"speech". Se muestra como etiqueta de texto junto al punto. */
 tonalidad?: string | null;
 /** Evaluación integral de la unión (✓ o ✕) con la SIGUIENTE canción del repertorio. */
 transitionToNext?: EvaluacionUnion | null;
 /** Evaluación integral de la unión (✓ o ✕) desde la ANTERIOR canción del repertorio. */
 transitionFromPrev?: EvaluacionUnion | null;
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
 /** Versión reducida para espacios pequeños (p.ej. dentro del modal de Análisis IA): sin, ejes/puntos más pequeños. */
 compact?: boolean;
 /** Si se pasa, arrastrar un punto horizontalmente reordena el setlist a esa posición — la
 * altura del punto sigue sin poder tocarse (es la energía calculada, no un valor editable).
 * Se omite en el gráfico compacto del modal de Análisis IA, donde solo es lectura. */
 onReorder?: (fromIndex: number, toIndex: number) => void;
 /** Si se pasa, arrastrar un punto verticalmente cambia su energía (1-20) y la fija como manual
 * — mismo efecto que el popover 1-10 de la fila de canción, pero directo desde el gráfico.
 * Solo aplica a puntos con `songId` (una canción real, no un evento de"speech"/bis). El eje del
 * arrastre se bloquea al primer movimiento (el que más se mueva primero, horizontal=reordenar,
 * vertical=energía) para que un gesto en diagonal no haga las dos cosas sin querer. */
 onEnergyChange?: (point: EnergyChartPoint, newScore: number) => void;
 /** Muestra/oculta la curva"ideal" de referencia (línea discontinua por debajo de la curva
 * real). Por defecto visible; el toggle vive en el componente que llama a EnergyChart. */
 showIdealCurve?: boolean;
 /** Muestra/oculta la línea de BPM (eje secundario a la derecha). Por defecto visible. */
 showBpmLine?: boolean;
 /** Muestra/oculta la etiqueta de tonalidad junto a cada punto. Apagada por defecto — con el
 * gráfico ya lleno de curvas y avisos, es otra capa de texto que solo conviene cuando se busca
 * específicamente la tonalidad (normalmente en modo zoom, con más espacio entre puntos). */
 showTonalidad?: boolean;
 /** Muestra/oculta los indicadores de unión (✓ / ✕) en cada transición del gráfico. */
 showTransitionBadges?: boolean;
 /** Callback para probar la unión de audio/acústica con la canción anterior en el setlist al seleccionar un punto. */
 onPreviewTransition?: (selectedIndex: number) => void;
 /** Ancho fijo en px para el gráfico (en vez de 100% del contenedor) —"modo zoom": más espacio
 * horizontal entre puntos para leer etiquetas (tonalidad, BPM) sin que se pisen. El que llama
 * es responsable de envolver el componente en un contenedor con scroll horizontal. */
 expandedWidthPx?: number;
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
 onEnergyChange,
 showIdealCurve = true,
 showBpmLine = false,
 showTonalidad = false,
 showTransitionBadges = true,
 onPreviewTransition,
 expandedWidthPx
}: EnergyChartProps) {
 const gradientSuffix = compact ?'-compact' :'';
 const fontSize = compact ? 8 : 9;
 const dotDefault = compact ? 3.5 : 5.5;
 const dotSelected = compact ? 6 : 8;
 // Highlighted apenas un poco más grande que selected — antes saltaba mucho más (7/10) y el
 // efecto resultaba chillón al pasar el ratón por varias sugerencias seguidas.
 const dotHighlighted = compact ? 5 : 7;

 // Tres velocidades de animación según el motivo del cambio — nunca la misma para las tres,
 // porque cada una pide algo distinto:
 // -'entrance': la PRIMERÍSIMA vez que este gráfico se pinta en esta visita a Repertorio (el
 //"momento wow" de verdad — lenta y vistosa a propósito, para que se note la curva
 // dibujándose de principio a fin, ver GRAND_ENTRANCE_MS).
 // -'switch': cada vez que se cambia de setlist DESPUÉS de esa primera vez — sigue teniendo su
 // propio ritmo, pero ya no hace falta la misma puesta en escena.
 // -'fast': cualquier edición suelta (joystick, arrastre, reordenar) — tiene que sentirse
 // instantánea; reusar el ritmo de'entrance'/'switch' aquí es justo lo que se quejó de lento
 // hace unas iteraciones.
 // `setlistKey` es lo único que fuerza un remount real (ver key en ComposedChart más abajo), así
 // que es la señal correcta de"esto es una apertura, no una edición". El ref (no state) recuerda
 // si la entrada ya se reprodujo en este montaje del componente, sin resetearse entre setlists.
 const GRAND_ENTRANCE_MS = 2800;
 const SETLIST_SWITCH_MS = 1200;
 const FAST_EDIT_MS = 180;
 const hasPlayedGrandEntranceRef = useRef(false);
 const [animMode, setAnimMode] = useState<'entrance' |'switch' |'fast'>('entrance');
 useEffect(() => {
 const isFirstEverPaint = !hasPlayedGrandEntranceRef.current;
 hasPlayedGrandEntranceRef.current = true;
 setAnimMode(isFirstEverPaint ?'entrance' :'switch');
 const t = setTimeout(() => setAnimMode('fast'), (isFirstEverPaint ? GRAND_ENTRANCE_MS : SETLIST_SWITCH_MS) + 100);
 return () => clearTimeout(t);
 
 }, [setlistKey]);
 const curveAnimationDuration = animMode ==='entrance' ? GRAND_ENTRANCE_MS : animMode ==='switch' ? SETLIST_SWITCH_MS : FAST_EDIT_MS;
 const curveAnimationEasing = animMode ==='entrance' ?'ease-in-out' :'ease-out';

 // Arrastrar un punto horizontalmente reordena el setlist — la posición se calcula sobre el
 // ancho real del contenedor (ratio 0-1 mapeado a índice), no sobre coordenadas internas de
 // recharts, así que no depende de sus internals de layout/escala.
 //
 // Se usa Pointer Events (no mouse+touch por separado): unifica ratón/dedo/lápiz en un solo
 // modelo, evita que un handler React de touchstart/touchmove sea `passive` por defecto (ahí
 // `preventDefault` no funciona ni sirve de nada) y evita el"ghost click" de mouse sintético que
 // los navegadores móviles disparan tras un toque. `setPointerCapture` sustituye a preventDefault
 // para decirle al navegador que ese puntero ya está siendo gestionado por nosotros.
 const containerRef = useRef<HTMLDivElement>(null);
 const [draggingFromIndex, setDraggingFromIndex] = useState<number | null>(null);
 const [hoverIndex, setHoverIndex] = useState<number | null>(null);
 const draggingFromIndexRef = useRef<number | null>(null);
 const activePointerIdRef = useRef<number | null>(null);
 const dragStartClientXRef = useRef<number | null>(null);

 // Arrastrar en vertical cambia la energía (1-20) del punto en vez de su posición — el eje se
 // decide al primer movimiento que supere el umbral (el que más se haya movido gana) y queda
 // fijo el resto del gesto, para que una diagonal no reordene y cambie energía a la vez.
 const [dragAxis, setDragAxis] = useState<'x' |'y' | null>(null);
 const dragAxisRef = useRef<'x' |'y' | null>(null);
 const dragStartClientYRef = useRef<number | null>(null);
 const dragStartScoreRef = useRef<number | null>(null);
 const [liveEnergyScore, setLiveEnergyScore] = useState<number | null>(null);
 // Ref en paralelo al state: handlePointerUp necesita leer el valor más reciente sin forzar que
 // el useEffect se re-suscriba a los listeners en cada pointermove (el state es solo para pintar
 // la burbuja en pantalla).
 const liveEnergyScoreRef = useRef<number | null>(null);
 // Posición del puntero (relativa al contenedor) mientras se arrastra en vertical, para pintar la
 // burbuja de energía justo al lado del dedo/cursor en vez de fija arriba en el centro — así se
 // ve claramente el número subir/bajar a la altura real a la que se está arrastrando.
 const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);
 //'touch' |'mouse' |'pen' (de PointerEvent.pointerType) — en touch, el propio dedo tapa el
 // punto de contacto, así que la burbuja se planta encima del dedo en vez de al lado (ver render).
 const [dragPointerType, setDragPointerType] = useState<string | null>(null);

 // Umbral mínimo antes de considerar el gesto un arrastre real. Sin esto, el jitter normal del
 // dedo entre el toque y la suelta (aunque la intención fuera un simple tap) podía redondear a un
 // índice de canción distinto al de partida y reordenar solo sin querer, con"ningún control".
 const MIN_DRAG_PX = 10;

 const getIndexFromClientX = (clientX: number): number => {
 const rect = containerRef.current?.getBoundingClientRect();
 if (!rect || chartData.length === 0) return 0;
 const ratio = (clientX - rect.left) / rect.width;
 return Math.max(0, Math.min(chartData.length - 1, Math.round(ratio * (chartData.length - 1))));
 };

 // Conversión aproximada de píxeles verticales a unidades de energía, a partir del alto real del
 // área de trazado (contenedor menos márgenes del ComposedChart y el alto reservado por el eje X
 // cuando es visible). No es una réplica exacta de la escala interna de recharts, pero el usuario
 // ve el número en vivo en la burbuja mientras arrastra — la sensación de arrastre es lo que
 // importa, no un mapeo píxel-perfecto.
 const pxPerEnergyUnit = useMemo(() => {
 const marginTop = compact ? 8 : 14;
 const xAxisReserve = compact ? 0 : 20;
 const plotHeight = Math.max(1, height - marginTop - xAxisReserve);
 return plotHeight / Math.max(1, yDomain[1] - yDomain[0]);
 }, [height, compact, yDomain]);

 const startDrag = (fromIndex: number, clientX: number, clientY: number, pointerId: number, pointerType: string) => {
 draggingFromIndexRef.current = fromIndex;
 dragStartClientXRef.current = clientX;
 dragStartClientYRef.current = clientY;
 dragAxisRef.current = null;
 dragStartScoreRef.current = null;
 activePointerIdRef.current = pointerId;
 liveEnergyScoreRef.current = null;
 setDraggingFromIndex(fromIndex);
 setHoverIndex(fromIndex);
 setDragAxis(null);
 setLiveEnergyScore(null);
 setDragPointerPos(null);
 setDragPointerType(pointerType);
 };

 useEffect(() => {
 if (draggingFromIndex === null) return;

 const isActivePointer = (e: PointerEvent) =>
 activePointerIdRef.current === null || e.pointerId === activePointerIdRef.current;

 const resetDragState = () => {
 draggingFromIndexRef.current = null;
 dragStartClientXRef.current = null;
 dragStartClientYRef.current = null;
 dragAxisRef.current = null;
 dragStartScoreRef.current = null;
 activePointerIdRef.current = null;
 liveEnergyScoreRef.current = null;
 setDraggingFromIndex(null);
 setHoverIndex(null);
 setDragAxis(null);
 setLiveEnergyScore(null);
 setDragPointerPos(null);
 setDragPointerType(null);
 };

 const handlePointerMove = (e: PointerEvent) => {
 if (!isActivePointer(e)) return;
 const from = draggingFromIndexRef.current;

 if (dragAxisRef.current === null) {
 const dx = dragStartClientXRef.current !== null ? Math.abs(e.clientX - dragStartClientXRef.current) : 0;
 const dy = dragStartClientYRef.current !== null ? Math.abs(e.clientY - dragStartClientYRef.current) : 0;
 // Todavía no supera el umbral en ningún eje: sigue mostrando la posición tentativa (como
 // antes), pero sin decidir todavía si esto es un reordenamiento o un cambio de energía.
 if (dx < MIN_DRAG_PX && dy < MIN_DRAG_PX) {
 setHoverIndex(getIndexFromClientX(e.clientX));
 return;
 }
 const canEditEnergy = !!onEnergyChange && from !== null && chartData[from]?.songId != null;
 dragAxisRef.current = dy > dx && canEditEnergy ?'y' :'x';
 setDragAxis(dragAxisRef.current);
 if (dragAxisRef.current ==='y' && from !== null) {
 dragStartScoreRef.current = chartData[from]?.score ?? null;
 }
 }

 if (dragAxisRef.current ==='y') {
 if (from === null || dragStartScoreRef.current === null || dragStartClientYRef.current === null) return;
 const dyUp = dragStartClientYRef.current - e.clientY; // positivo = arrastrado hacia arriba
 const rawScore = dragStartScoreRef.current + dyUp / pxPerEnergyUnit;
 const clamped = Math.max(1, Math.min(20, Math.round(rawScore)));
 // Vibración corta cada vez que el número cambia de unidad (no en cada píxel) — un"tick"
 // háptico al estilo slider nativo, para notar el cambio sin tener que mirar la burbuja
 // constantemente. Android Chrome lo soporta; iOS Safari ignora la llamada sin más, así
 // que no hace falta detectar la plataforma.
 if (liveEnergyScoreRef.current !== null && clamped !== liveEnergyScoreRef.current) {
 try { navigator.vibrate?.(10); } catch { /* no-op: vibración no soportada */ }
 }
 liveEnergyScoreRef.current = clamped;
 setLiveEnergyScore(clamped);
 const rect = containerRef.current?.getBoundingClientRect();
 if (rect) setDragPointerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
 } else {
 setHoverIndex(getIndexFromClientX(e.clientX));
 }
 };

 const handlePointerUp = (e: PointerEvent) => {
 if (!isActivePointer(e)) return;
 const from = draggingFromIndexRef.current;

 if (dragAxisRef.current ==='y') {
 const finalScore = liveEnergyScoreRef.current;
 if (from !== null && finalScore !== null && finalScore !== dragStartScoreRef.current) {
 onEnergyChange?.(chartData[from], finalScore);
 }
 } else {
 const to = getIndexFromClientX(e.clientX);
 const movedEnough =
 dragStartClientXRef.current !== null &&
 Math.abs(e.clientX - dragStartClientXRef.current) >= MIN_DRAG_PX;
 if (dragAxisRef.current ==='x' && from !== null && to !== from && movedEnough) onReorder?.(from, to);
 // Soltar sin moverse lo suficiente en ningún eje (o en el mismo punto de partida) es un
 // tap/clic normal: selecciona ese tema. La diana táctil que arranca el arrastre tiene
 // pointer-events encima del punto visible, así que su onClick nativo ya no llega — se
 // resuelve aquí.
 else if (from !== null) onSelectItem?.(chartData[from]?.id);
 }
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
 }, [draggingFromIndex, pxPerEnergyUnit]);

 return (
 <div
 ref={containerRef}
 className={`relative w-full bg-[var(--sunken)] rounded-[var(--r-s)] overflow-hidden`}
 style={{
 height,
 width: expandedWidthPx ? `${expandedWidthPx}px` : undefined,
 minWidth: expandedWidthPx ? `${expandedWidthPx}px` : undefined,
 cursor: draggingFromIndex !== null ? (dragAxis ==='y' ?'ns-resize' :'ew-resize') : undefined
 }}
 >
 {!compact && (
 <style>{`
 /* Espectro flat design: removed effects per Law 1 */
 `}</style>
 )}
 {/* Arrastrando en vertical: burbuja con la energía en vivo, pegada al dedo/cursor (no fija
 arriba en el centro) para que se note claramente cómo sube y baja el número al mover.
 En ratón/lápiz se coloca a un lado (izquierda o derecha según de qué mitad del gráfico se
 tire); en dedo se planta ENCIMA del punto de contacto, porque el propio dedo tapa una
 zona bastante más grande que un cursor y a un lado seguiría quedando oculta debajo. */}
 {draggingFromIndex !== null && dragAxis ==='y' && liveEnergyScore !== null && dragPointerPos && (() => {
 const info = getEnergyInfo(liveEnergyScore);
 const isTouch = dragPointerType ==='touch';
 const containerWidth = containerRef.current?.clientWidth ?? 300;
 const sideGap = 20;
 const placeOnLeft = dragPointerPos.x > containerWidth * 0.6;
 return (
 <div
 className="absolute z-20 bg-[var(--sunken)] rounded-[var(--r-s)] px-3 py-1.5 text-[12px] font-sans text-[var(--ink)] pointer-events-none whitespace-nowrap"
 style={{
 boxShadow: `0 0 0 2px ${info.hexColor}66`,
 ...(isTouch
 ? { left: dragPointerPos.x, top: dragPointerPos.y, transform:'translate(-50%, calc(-100% - 34px))' }
 : {
 top: dragPointerPos.y,
 transform:'translateY(-50%)',
 ...(placeOnLeft
 ? { right: containerWidth - dragPointerPos.x + sideGap }
 : { left: dragPointerPos.x + sideGap })
 })
 }}
 >
 <span className="font-bold text-base" style={{ color: info.hexColor }}>{info.icon} {liveEnergyScore}</span>
 <span className="text-[var(--ink-2)]">/20 · {info.label}</span>
 </div>
 );
 })()}
 {/* Arrastrando en horizontal (o gesto aún sin decidir): nombre + destino del reordenamiento,
 para saber qué se está moviendo sin tener que leer el número de posición en el eje X. */}
 {draggingFromIndex !== null && dragAxis !=='y' && hoverIndex !== null && (
 <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 bg-[var(--sunken)] rounded-[var(--r-s)] px-3 py-1.5 text-[11px] font-sans text-[var(--ink)] pointer-events-none whitespace-nowrap">
 <span className="text-[var(--acc)]/70 font-bold">{chartData[draggingFromIndex]?.name}</span>
 {hoverIndex !== draggingFromIndex && (
 <>
 <span className="text-[var(--ink-2)]"> → posición de </span>
 <span className="text-[var(--ink-2)]">"{chartData[hoverIndex]?.name}"</span>
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
 baja) en vez de un dorado plano fijo — así el"aura" bajo la curva también cambia
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

 <CartesianGrid horizontal vertical={false} stroke="var(--ink-3)" strokeDasharray="0" />

 {/* Mientras se arrastra un punto en horizontal, esta línea marca dónde caería la canción
 al soltar. En vertical, marca la altura (energía) a la que quedaría en su lugar. */}
 {draggingFromIndex !== null && dragAxis !=='y' && hoverIndex !== null && (
 <ReferenceLine x={hoverIndex} stroke="var(--acc-soft)" strokeWidth={2} strokeDasharray="4 3" ifOverflow="extendDomain" />
 )}
 {draggingFromIndex !== null && dragAxis ==='y' && liveEnergyScore !== null && (
 <ReferenceLine y={liveEnergyScore} stroke="var(--acc-soft)" strokeWidth={2} strokeDasharray="4 3" ifOverflow="extendDomain" />
 )}

 {/* Eventos de"speech" (chapa, presentación, interludio...): no cuentan como un bajón de
 energía (score null + connectNulls en la curva de abajo), pero se marcan con su
 propia línea vertical + el icono de su subtipo (💬 chapa, 🎤 presentación, 💣 bis...)
 para que se lea de un vistazo qué es cada marcador, sin confundirlo con la curva. */}
 {chartData.filter((d) => d.isSpeechEvent).map((d) => (
 <ReferenceLine
 key={`speech-${d.id}`}
 x={d.idx}
 stroke="var(--ink-2)"
 strokeWidth={1.5}
 strokeDasharray="2 3"
 ifOverflow="extendDomain"
 label={{ value: d.icon, position:'insideTop', fontSize: compact ? 13 : 20, fill:'var(--surface)' }}
 />
 ))}

 {/* Choque de tonalidad con la SIGUIENTE canción (círculo de quintas) — se marca a medio
 camino entre ambos puntos, mismo patrón que los eventos de"speech" de arriba. */}
 {!showTransitionBadges && chartData.filter((d) => d.harmonyClash).map((d) => (
 <ReferenceLine
 key={`clash-${d.id}`}
 x={d.idx + 0.5}
 stroke="var(--alert)"
 strokeDasharray="3 3"
 strokeOpacity={0.8}
 ifOverflow="extendDomain"
 label={{ value:'⚡', position:'insideTop', fontSize: compact ? 10 : 13 }}
 />
 ))}

 {/* Indicadores de unión (✓ o ✕) entre temas consecutivos calculados por armonía, BPM y energía */}
 {showTransitionBadges && chartData.filter((d) => d.transitionToNext).map((d) => {
 const tr = d.transitionToNext!;
 const isOk = tr.status ==='ok';
 return (
 <ReferenceLine
 key={`trans-${d.id}`}
 x={d.idx + 0.5}
 stroke={isOk ?'var(--ok)' :'var(--alert)'}
 strokeWidth={isOk ? 1 : 1.5}
 strokeDasharray={isOk ?'2 3' :'3 2'}
 strokeOpacity={isOk ? 0.45 : 0.85}
 ifOverflow="extendDomain"
 label={{
 value: isOk ?'✓' : tr.coste.harmonyRelation ==='choque' ?'✕ ⚡' :'✕',
 position:'insideTop',
 fill: isOk ?'var(--ok)' :'var(--alert)',
 fontSize: compact ? (isOk ? 9 : 10) : (isOk ? 11 : 12),
 fontWeight: 900
 }}
 />
 );
 })}

 <XAxis
 dataKey="idx"
 tickFormatter={(v: number) => `#${v + 1}`}
 stroke="var(--ink-2)"
 fontSize={fontSize}
 tickLine={false}
 axisLine={false}
 hide={compact}
 />
 {/* tickFormatter a propósito: los datos y el dominio siguen en la escala interna 1-20
 (energia se guarda así en toda la app — ver getEnergyInfo/handleSetEnergiaManual),
 pero de cara al usuario el gráfico debe leerse en 1-10, igual que el popover de
 energía del grid. Es una transformación puramente de presentación (÷2 en la
 etiqueta), no cambia la posición real de la curva. */}
 <YAxis
 yAxisId="energy"
 domain={yDomain}
 tickFormatter={(v: number) => `${Math.round(v / 2)}`}
 stroke="var(--ink-2)"
 fontSize={fontSize}
 tickLine={false}
 axisLine={false}
 width={compact ? 0 : 22}
 hide={compact}
 />
 {/* Eje secundario de BPM, a la derecha — misma curva temporal, escala independiente
 (60-200 vs 1-20 de energía no tienen nada que ver, superponerlas en el mismo eje
 sería ilegible). Dominio con margen para que la línea no toque los bordes. */}
 {showBpmLine && (
 <YAxis
 yAxisId="bpm"
 orientation="right"
 domain={['dataMin - 15','dataMax + 15']}
 stroke="var(--acc)"
 fontSize={fontSize}
 tickLine={false}
 axisLine={false}
 width={compact ? 0 : 26}
 hide={compact}
 />
 )}

 <RechartsTooltip
 cursor={{ stroke:'var(--ink-2)', strokeDasharray:'3 3' }}
 content={({ active, payload }: any) => {
 if (!active || !payload?.length) return null;
 const d = payload[0].payload;
 return (
 <div className="bg-[var(--sunken)] text-[var(--ink)] text-[9px] font-sans py-1.5 px-2.5 rounded-[var(--r-s)] max-w-[200px]">
 <p className="font-bold text-[var(--acc)] text-[10px]">#{d.idx + 1} {d.name}</p>
 {d.isSpeechEvent ? (
 <p className="text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
 <span>{d.icon}</span> Interludio / Pausa — meseta de energía
 </p>
 ) : (
 <>
 <p className="text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
 <span>{d.icon}</span> {d.label} ({d.score}/20)
 </p>
 {typeof d.bpm ==='number' && (
 <p className="text-[var(--ink-3)] mt-0.5">🥁 {d.bpm} BPM</p>
 )}
 {d.tonalidad && (
 <p className="text-[var(--acc)]/70 mt-0.5">🎼 {d.tonalidad}</p>
 )}
 {d.variance > 0 && (
 <p className="text-[var(--ink-3)] mt-0.5">
 🎧 Dinámica interna: {d.variance >= 6 ?'alta (sube y baja mucho)' : d.variance >= 3 ?'media' :'suave'}
 </p>
 )}
 {showIdealCurve && typeof d.idealScore ==='number' && Math.abs(d.idealScore - d.score) >= 2 && (
 <p className="text-[var(--ink-2)] mt-0.5">
 〰️ Ideal aquí: ~{d.idealScore}/20
 </p>
 )}
 {d.transitionFromPrev && (
 <div className={`mt-1.5 pt-1 ${
 d.transitionFromPrev.status ==='ok' ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'
 }`}>
 <div className="flex items-center gap-1 font-bold">
 <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
 d.transitionFromPrev.status ==='ok'
 ?'bg-[var(--ok)]/20 text-[var(--ink-2)]'
 :'bg-[var(--alert)]/20 text-[var(--ink-2)]'
 }`}>
 {d.transitionFromPrev.icon}
 </span>
 <span>Unión con #{d.idx}: {d.transitionFromPrev.status ==='ok' ?'Fluida' :'Revisar'} ({d.transitionFromPrev.scorePercent}%)</span>
 </div>
 {d.transitionFromPrev.motivos.length > 0 && (
 <p className="text-[8px] text-[var(--ink-2)] pl-4 mt-0.5 leading-tight">
 {d.transitionFromPrev.motivos.join( '·')}
 </p>
 )}
 </div>
 )}
 {d.idx > 0 && onPreviewTransition && (
 <p className="text-[var(--acc)] font-semibold mt-1 pt-1 flex items-center gap-1 cursor-pointer hover:underline">
 🎧 Probar unión con #{d.idx}
 </p>
 )}
 </>
 )}
 </div>
 );
 }}
 />

 {/* Curva"ideal" de referencia — dibujada ANTES (por debajo, en capas) que la curva real
 para poder comparar de un vistazo dónde se aleja más, sin depender del texto del
 análisis. Discontinua y en gris neutro para no competir con los colores reales. */}
 {showIdealCurve && (
 <Line
 yAxisId="energy"
 type="monotone"
 dataKey="idealScore"
 stroke="var(--ink-2)"
 strokeWidth={compact ? 1.5 : 2}
 strokeDasharray="5 4"
 strokeOpacity={0.6}
 dot={false}
 activeDot={false}
 isAnimationActive={!compact}
 animationDuration={curveAnimationDuration}
 animationEasing={curveAnimationEasing}
 legendType="none"
 connectNulls
 />
 )}

 {/* Curva principal de energía tema a tema — connectNulls hace que la curva pase por
 encima de los eventos de"speech" (score null) sin dibujar un bajón ahí, uniendo
 directamente las canciones real de antes y de después. */}
 <Area
 yAxisId="energy"
 type="monotone"
 dataKey="score"
 stroke={`url(#energyStrokeGradient${gradientSuffix})`}
 strokeWidth={compact ? 2 : 3}
 fill={`url(#energyFillGradient${gradientSuffix})`}
 fillOpacity={1}
 connectNulls
 isAnimationActive={!compact}
 animationDuration={curveAnimationDuration}
 animationEasing={curveAnimationEasing}
 // Recharts dibuja su propio"activeDot" ENCIMA del dot personalizado al pasar el
 // ratón cerca — con onReorder eso tapa el <circle> real y se traga el mousedown
 // antes de que llegue a nuestro handler de arrastre, así que se desactiva aquí.
 activeDot={(onReorder || onEnergyChange) ? false : (activeDotProps: any) => {
 if (activeDotProps?.payload?.isSpeechEvent) return <React.Fragment key="speech-act-dot" />;
 return (
 <circle
 cx={activeDotProps.cx}
 cy={activeDotProps.cy}
 r={dotSelected}
 strokeWidth={2}
 stroke="var(--surface)"
 fill={activeDotProps.payload?.color ||'var(--acc-soft)'}
 />
 );
 }}
 dot={(dotProps: any) => {
 const { cx, cy, payload, index } = dotProps;
 // payload.score null (eventos de"speech") no tiene una posición real que dibujar —
 // Number.isNaN cubre el caso de que recharts calcule cy como NaN en vez de null/undefined.
 if (cx == null || cy == null || Number.isNaN(cx) || Number.isNaN(cy) || payload?.isSpeechEvent) {
 return <React.Fragment key={`dot-${index}`} />;
 }
 const isSelected = payload.id === selectedSetlistItemId;
 const isHighlighted = highlightedSongIds.length > 0 && titlesMatch(payload.name, highlightedSongIds);
 const isDraggingThis = draggingFromIndex === payload.idx;
 const canEditThisEnergy = !!onEnergyChange && payload.songId != null;
 const canDragThis = !!onReorder || canEditThisEnergy;
 const dotRadius = isDraggingThis ? dotHighlighted : isHighlighted ? dotHighlighted : isSelected ? dotSelected : dotDefault;
 return (
 <React.Fragment key={`dot-${payload.id}`}>
 {/* Diana táctil invisible: el punto visible (r=3.5-8px) es demasiado pequeño
 para tocarlo con el dedo con precisión — este círculo transparente más
 grande (r=18) capta el toque/clic sin cambiar el tamaño visual del punto.
 onPointerDown cubre ratón y dedo con el mismo handler; setPointerCapture
 le dice al navegador que este puntero ya lo gestionamos nosotros, en vez de
 depender de preventDefault (que en un handler de touch de React es passive
 y no tiene efecto). */}
 {canDragThis && (
 <circle
 cx={cx}
 cy={cy}
 r={18}
 fill="transparent"
 style={{ cursor: onReorder && canEditThisEnergy ?'move' : canEditThisEnergy ?'ns-resize' :'ew-resize', touchAction:'none' }}
 onPointerDown={(e) => {
 e.stopPropagation();
 (e.target as Element).setPointerCapture?.(e.pointerId);
 startDrag(payload.idx, e.clientX, e.clientY, e.pointerId, e.pointerType);
 }}
 />
 )}
 <circle
 cx={cx}
 cy={cy}
 r={dotRadius}
 fill={payload.color}
 stroke={isHighlighted ? payload.color : isSelected ?'var(--surface)' :'var(--bg)'}
 strokeWidth={isHighlighted ? 2 : isSelected ? 2 : 1.5}
 style={{
 // move (cuatro flechas) cuando el punto admite ambos gestos (reordenar +
 // cambiar energía); ew-resize/ns-resize cuando solo admite uno de los dos.
 cursor: canDragThis
 ? (onReorder && canEditThisEnergy ?'move' : canEditThisEnergy ?'ns-resize' :'ew-resize')
 : (onSelectItem ?'pointer' :'default'),
 opacity: isDraggingThis ? 0.5 : isHighlighted ? 1 : 0.6,
 // Espectro: zero/drop-shadow. Highlight via opacity change instead.
 filter: 'none',
 transition: isDraggingThis ?'none' :'all 0.2s ease',
 pointerEvents: canDragThis ?'none' :'auto'
 }}
 onClick={() => { if (draggingFromIndex === null) onSelectItem?.(payload.id); }}
 />
 {/* Etiqueta de tonalidad — puramente informativa, nunca captura el puntero (si
 no, taparía la diana táctil del punto justo debajo). Los picos de energía
 más alta caen cerca del borde superior del gráfico (que recorta con
 overflow-hidden) — por debajo de este margen, la etiqueta se pinta DEBAJO
 del punto en vez de encima para que nunca se corte. */}
 {showTonalidad && payload.tonalidad && (() => {
 const labelFontSize = compact ? 7.5 : 9;
 const espacioArriba = cy - dotRadius - 6 - labelFontSize;
 const margenSuperior = compact ? 8 : 14; // mismo valor que el margin.top del ComposedChart
 const pintarAbajo = espacioArriba < margenSuperior;
 const textoY = pintarAbajo ? cy + dotRadius + labelFontSize + 4 : cy - dotRadius - 6;
 // Monoespaciada: el ancho de cada carácter es constante, así que el pill de
 // fondo se calcula sin medir texto (evita el efecto "manchado" de un
 // stroke SVG desproporcionado al tamaño de fuente, ver AGENTS.md).
 const anchoTexto = payload.tonalidad.length * labelFontSize * 0.62 + 6;
 return (
 <g pointerEvents="none">
 <rect
 x={cx - anchoTexto / 2}
 y={textoY - labelFontSize}
 width={anchoTexto}
 height={labelFontSize + 4}
 rx={labelFontSize / 2}
 fill="var(--surface)"
 opacity={0.92}
 />
 <text
 x={cx}
 y={textoY}
 textAnchor="middle"
 fontSize={labelFontSize}
 fontFamily="monospace"
 fontWeight={600}
 fill="var(--ink)"
 >
 {payload.tonalidad}
 </text>
 </g>
 );
 })()}
 </React.Fragment>
 );
 }}
 />

 {/* Línea de BPM, en el eje secundario — puramente informativa (no arrastrable, no
 afecta al reordenamiento): deja ver de un vistazo si el orden actual tiene saltos
 de tempo bruscos entre temas consecutivos. connectNulls salta los eventos de"speech" igual que la curva de energía. */}
 {showBpmLine && (
 <Line
 yAxisId="bpm"
 type="monotone"
 dataKey="bpm"
 stroke="var(--acc)"
 strokeWidth={compact ? 1.5 : 2}
 strokeOpacity={0.85}
 dot={{ r: compact ? 2 : 3, fill:'var(--acc)', strokeWidth: 0 }}
 activeDot={{ r: compact ? 3 : 4.5, fill:'var(--acc)' }}
 isAnimationActive={!compact}
 animationDuration={curveAnimationDuration}
 animationEasing={curveAnimationEasing}
 legendType="none"
 connectNulls
 />
 )}
 </ComposedChart>
 </ResponsiveContainer>
 </div>
 );
}
