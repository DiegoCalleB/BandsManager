import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { titlesMatch } from "../../utils/songTitleMatch";
import { getEnergyInfo } from "../../utils/energyPacingUtils";
import { EvaluacionUnion } from "../../utils/setlistCompatibility";

export interface EnergyChartPoint {
  idx: number;
  /** Posición horizontal en el gráfico — distinta de `idx` (posición real en el setlist, usada
   * para identificar/reordenar). Las canciones son enteros consecutivos (0,1,2...) sin contar
   * bloques; un bloque se intercala entre sus dos canciones vecinas sin consumir su propio
   * hueco, así nunca separa visualmente dos canciones más de lo normal. */
  xPos: number;
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
  currentPlayingSongId?: string | null;
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
  /** Controles del punto seleccionado (joystick de reordenar/energía) que quien llama quiere
   * justo debajo del gráfico, ANTES del panel de detalle — que puede crecer bastante (unión,
   * botón de probar transición...) y dejarían el joystick"enterrado" varios scrolls más abajo
   * si se renderizase aparte, después de este componente. */
  belowChartSlot?: React.ReactNode;
}

/** Curva suave que nunca sobrepasa los datos (interpolación monótona, Fritsch–Carlson). */
function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0].x},${pts[0].y}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x || 1e-6);
    m.push((pts[i + 1].y - pts[i].y) / dx[i]);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = Math.hypot(a, b);
    if (h > 3) { t[i] = (3 * a * m[i]) / h; t[i + 1] = (3 * b * m[i]) / h; }
  }
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += ` C${pts[i].x + c},${pts[i].y + t[i] * c} ${pts[i + 1].x - c},${pts[i + 1].y - t[i + 1] * c} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
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
  currentPlayingSongId = null,
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
  expandedWidthPx,
  belowChartSlot,
}: EnergyChartProps) {
  const fontSize = compact ? 8 : 9;
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
  const GRAND_ENTRANCE_MS = 1000;
  const SETLIST_SWITCH_MS = 600;
  const hasPlayedGrandEntranceRef = useRef(false);
  const [animMode, setAnimMode] = useState<"entrance" | "switch" | "fast">(
    "entrance",
  );
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const isFirstEverPaint = !hasPlayedGrandEntranceRef.current;
    hasPlayedGrandEntranceRef.current = true;
    setAnimMode(isFirstEverPaint ? "entrance" : "switch");
    const t = setTimeout(
      () => setAnimMode("fast"),
      (isFirstEverPaint ? GRAND_ENTRANCE_MS : SETLIST_SWITCH_MS) + 100,
    );
    setRevealed(false);
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setRevealed(true)));
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(r);
    };
  }, [setlistKey]);
  // Arrastrar una barra horizontalmente reordena el setlist — la columna destino se calcula midiendo
  // las columnas reales del DOM, no una escala interna.
  //
  // Se usa Pointer Events (no mouse+touch por separado): unifica ratón/dedo/lápiz en un solo
  // modelo, evita que un handler React de touchstart/touchmove sea `passive` por defecto (ahí
  // `preventDefault` no funciona ni sirve de nada) y evita el"ghost click" de mouse sintético que
  // los navegadores móviles disparan tras un toque. `setPointerCapture` sustituye a preventDefault
  // para decirle al navegador que ese puntero ya está siendo gestionado por nosotros.
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingFromIndex, setDraggingFromIndex] = useState<number | null>(
    null,
  );
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // El panel de detalle vive FUERA del SVG, nunca como tooltip flotante encima de la curva (en
  // móvil, sin"salir con el ratón" para cerrarlo, se quedaba pegado tapando el gráfico entero).
  // Antes llevaba su propio índice (`activePointIndex`), separado de `selectedSetlistItemId` (el
  // que mueve el joystick) — dos"punto seleccionado" que no se enteraban el uno del otro, así que
  // tocar una canción movía el joystick pero el panel se quedaba con el último punto que sí había
  // pasado por el click-por-posición del contenedor. Ahora el panel se deriva directamente de
  // `selectedSetlistItemId`, la misma fuente que ya usa el joystick — un solo"seleccionado" real.
  // `dismissedId` es el único estado propio: qué selección se cerró a propósito con la ✕, para no
  // reabrir el panel solo porque `selectedSetlistItemId` no cambió.
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const activePoint =
    selectedSetlistItemId && selectedSetlistItemId !== dismissedId
      ? (chartData.find((d) => d.id === selectedSetlistItemId) ?? null)
      : null;
  // Único punto de entrada para seleccionar un punto (clic en el punto, en el contenedor, o tap
  // sin arrastre) — limpia el "cerrado a mano" para que volver a tocar el mismo punto tras cerrar
  // su panel lo vuelva a abrir, no lo deje muerto para siempre.
  const selectPoint = (id: string) => {
    setDismissedId(null);
    onSelectItem?.(id);
  };
  // Tooltip compacto al pasar el ratón — solo en dispositivos con hover real (ratón), nunca en
  // táctil: es justo el "se queda pegado tapando el gráfico" que forzó a sacar el detalle del
  // tooltip flotante en primer lugar (ver comentario de arriba). En PC no estorba porque
  // desaparece solo al mover el ratón fuera.
  const [isPointerFine, setIsPointerFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsPointerFine(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsPointerFine(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const draggingFromIndexRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartClientXRef = useRef<number | null>(null);

  // Arrastrar en vertical cambia la energía (1-20) del punto en vez de su posición — el eje se
  // decide al primer movimiento que supere el umbral (el que más se haya movido gana) y queda
  // fijo el resto del gesto, para que una diagonal no reordene y cambie energía a la vez.
  const [dragAxis, setDragAxis] = useState<"x" | "y" | null>(null);
  const dragAxisRef = useRef<"x" | "y" | null>(null);
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
  const [dragPointerPos, setDragPointerPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  //'touch' |'mouse' |'pen' (de PointerEvent.pointerType) — en touch, el propio dedo tapa el
  // punto de contacto, así que la burbuja se planta encima del dedo en vez de al lado (ver render).
  const [dragPointerType, setDragPointerType] = useState<string | null>(null);

  // Umbral mínimo antes de considerar el gesto un arrastre real. Sin esto, el jitter normal del
  // dedo entre el toque y la suelta (aunque la intención fuera un simple tap) podía redondear a un
  // índice de canción distinto al de partida y reordenar solo sin querer, con"ningún control".
  const MIN_DRAG_PX = 10;

  // Geometría del lienzo: arriba un hueco para insignias de unión / iconos de bloque, abajo la
  // fila de etiquetas (#n, tonalidad, BPM). El ancho se mide con ResizeObserver.
  const TOP_PAD = compact ? 12 : 18;
  const LABEL_H = compact && !showTonalidad && !showBpmLine ? 0 : compact ? 12 : 26;
  const PAD_L = compact ? 10 : 16;
  const PAD_R = compact ? 10 : 18;
  const plotHeight = Math.max(1, height - TOP_PAD - LABEL_H);
  const yRange = Math.max(1, yDomain[1] - yDomain[0]);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const maxX = useMemo(
    () => Math.max(1, ...chartData.filter((d) => d.isSong).map((d) => d.xPos)),
    [chartData],
  );
  const innerW = Math.max(1, width - PAD_L - PAD_R);
  const xAt = (xPos: number) => PAD_L + (xPos / maxX) * innerW;
  const yAt = (score: number) =>
    TOP_PAD + plotHeight * (1 - (Math.max(yDomain[0], Math.min(yDomain[1], score)) - yDomain[0]) / yRange);
  const baseY = TOP_PAD + plotHeight;

  // Columna más cercana a la X del puntero (incluye bloques como destino válido al reordenar).
  const getIndexFromClientX = (clientX: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || chartData.length === 0) return 0;
    const target = Math.max(0, Math.min(maxX, ((clientX - rect.left - PAD_L) / innerW) * maxX));
    let closest = 0;
    let closestDist = Infinity;
    chartData.forEach((d, i) => {
      const dist = Math.abs(d.xPos - target);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  };

  // Píxeles verticales → unidades de energía (escala interna 1-20).
  const pxPerEnergyUnit = plotHeight / yRange;

  // Cambios con teclado / botones — mismo camino que el arrastre (onEnergyChange / onReorder).
  const bumpEnergy = (i: number, delta: number) => {
    const pt = chartData[i];
    if (!onEnergyChange || !pt || pt.songId == null || typeof pt.score !== "number") return;
    const next = Math.max(1, Math.min(20, pt.score + delta));
    if (next !== pt.score) onEnergyChange(pt, next);
  };
  const moveItem = (i: number, delta: number) => {
    const to = i + delta;
    if (!onReorder || to < 0 || to >= chartData.length) return;
    onReorder(i, to);
  };
  const [tip, setTip] = useState<{ i: number; left: number } | null>(null);

  const startDrag = (
    fromIndex: number,
    clientX: number,
    clientY: number,
    pointerId: number,
    pointerType: string,
  ) => {
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
      activePointerIdRef.current === null ||
      e.pointerId === activePointerIdRef.current;

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
        const dx =
          dragStartClientXRef.current !== null
            ? Math.abs(e.clientX - dragStartClientXRef.current)
            : 0;
        const dy =
          dragStartClientYRef.current !== null
            ? Math.abs(e.clientY - dragStartClientYRef.current)
            : 0;
        // Todavía no supera el umbral en ningún eje: sigue mostrando la posición tentativa (como
        // antes), pero sin decidir todavía si esto es un reordenamiento o un cambio de energía.
        if (dx < MIN_DRAG_PX && dy < MIN_DRAG_PX) {
          setHoverIndex(getIndexFromClientX(e.clientX));
          return;
        }
        const canEditEnergy =
          !!onEnergyChange && from !== null && chartData[from]?.songId != null;
        dragAxisRef.current = dy > dx && canEditEnergy ? "y" : "x";
        setDragAxis(dragAxisRef.current);
        if (dragAxisRef.current === "y" && from !== null) {
          dragStartScoreRef.current = chartData[from]?.score ?? null;
        }
      }

      if (dragAxisRef.current === "y") {
        if (
          from === null ||
          dragStartScoreRef.current === null ||
          dragStartClientYRef.current === null
        )
          return;
        const dyUp = dragStartClientYRef.current - e.clientY; // positivo = arrastrado hacia arriba
        const rawScore = dragStartScoreRef.current + dyUp / pxPerEnergyUnit;
        const clamped = Math.max(1, Math.min(20, Math.round(rawScore)));
        // Vibración corta cada vez que el número cambia de unidad (no en cada píxel) — un"tick"
        // háptico al estilo slider nativo, para notar el cambio sin tener que mirar la burbuja
        // constantemente. Android Chrome lo soporta; iOS Safari ignora la llamada sin más, así
        // que no hace falta detectar la plataforma.
        if (
          liveEnergyScoreRef.current !== null &&
          clamped !== liveEnergyScoreRef.current
        ) {
          try {
            navigator.vibrate?.(10);
          } catch {
            /* no-op: vibración no soportada */
          }
        }
        liveEnergyScoreRef.current = clamped;
        setLiveEnergyScore(clamped);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect)
          setDragPointerPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
      } else {
        setHoverIndex(getIndexFromClientX(e.clientX));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isActivePointer(e)) return;
      const from = draggingFromIndexRef.current;

      if (dragAxisRef.current === "y") {
        const finalScore = liveEnergyScoreRef.current;
        if (
          from !== null &&
          finalScore !== null &&
          finalScore !== dragStartScoreRef.current
        ) {
          onEnergyChange?.(chartData[from], finalScore);
        }
      } else {
        const to = getIndexFromClientX(e.clientX);
        const movedEnough =
          dragStartClientXRef.current !== null &&
          Math.abs(e.clientX - dragStartClientXRef.current) >= MIN_DRAG_PX;
        if (
          dragAxisRef.current === "x" &&
          from !== null &&
          to !== from &&
          movedEnough
        )
          onReorder?.(from, to);
        // Soltar sin moverse lo suficiente en ningún eje (o en el mismo punto de partida) es un
        // tap/clic normal: selecciona ese tema. La diana táctil que arranca el arrastre tiene
        // pointer-events encima del punto visible, así que su onClick nativo ya no llega — se
        // resuelve aquí.
        else if (from !== null && chartData[from])
          selectPoint(chartData[from].id);
      }
      resetDragState();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (!isActivePointer(e)) return;
      resetDragState();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingFromIndex, pxPerEnergyUnit]);

  return (
    <div>
      <div
        ref={containerRef}
        onClick={(e) => {
          if (draggingFromIndex !== null) return;
          // Clic cerca de un punto sin acertarlo exactamente: mismo camino que clicar el punto
          // en sí (selectPoint), para que sea SIEMPRE la fuente que mueve panel + joystick a la
          // vez — nunca su propio índice suelto otra vez.
          const idx = getIndexFromClientX(e.clientX);
          const point = chartData[idx];
          if (point) selectPoint(point.id);
        }}
        className={`relative w-full bg-[var(--sunken)] rounded-[var(--r-s)] overflow-hidden`}
        style={{
          height,
          width: expandedWidthPx ? `${expandedWidthPx}px` : undefined,
          minWidth: expandedWidthPx ? `${expandedWidthPx}px` : undefined,
          cursor:
            draggingFromIndex !== null
              ? dragAxis === "y"
                ? "ns-resize"
                : "ew-resize"
              : onSelectItem || onReorder || onEnergyChange
                ? "pointer"
                : undefined,
        }}
      >
        {/* Arrastrando en vertical: burbuja con la energía en vivo, pegada al dedo/cursor (no fija
 arriba en el centro) para que se note claramente cómo sube y baja el número al mover.
 En ratón/lápiz se coloca a un lado (izquierda o derecha según de qué mitad del gráfico se
 tire); en dedo se planta ENCIMA del punto de contacto, porque el propio dedo tapa una
 zona bastante más grande que un cursor y a un lado seguiría quedando oculta debajo. */}
        {draggingFromIndex !== null &&
          dragAxis === "y" &&
          liveEnergyScore !== null &&
          dragPointerPos &&
          (() => {
            const info = getEnergyInfo(liveEnergyScore);
            const isTouch = dragPointerType === "touch";
            const containerWidth = containerRef.current?.clientWidth ?? 300;
            const sideGap = 20;
            const placeOnLeft = dragPointerPos.x > containerWidth * 0.6;
            return (
              <div
                className="absolute z-20 bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-1.5 text-[12px] font-sans text-[var(--ink)] pointer-events-none whitespace-nowrap"
                style={{
                  boxShadow: `0 0 0 2px ${info.hexColor}66`,
                  ...(isTouch
                    ? {
                        left: dragPointerPos.x,
                        top: dragPointerPos.y,
                        transform: "translate(-50%, calc(-100% - 34px))",
                      }
                    : {
                        top: dragPointerPos.y,
                        transform: "translateY(-50%)",
                        ...(placeOnLeft
                          ? {
                              right:
                                containerWidth - dragPointerPos.x + sideGap,
                            }
                          : { left: dragPointerPos.x + sideGap }),
                      }),
                }}
              >
                <span
                  className="font-bold text-base"
                  style={{ color: info.hexColor }}
                >
                  {info.icon} {Math.round(liveEnergyScore / 2)}
                </span>
                <span className="text-[var(--ink-2)]">/10 · {info.label}</span>
              </div>
            );
          })()}
        {/* Arrastrando en horizontal (o gesto aún sin decidir): nombre + destino del reordenamiento,
 para saber qué se está moviendo sin tener que leer el número de posición en el eje X. */}
        {draggingFromIndex !== null &&
          dragAxis !== "y" &&
          hoverIndex !== null && (
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-1.5 text-[11px] font-sans text-[var(--ink)] pointer-events-none whitespace-nowrap">
              <span className="text-[var(--acc)]/70 font-bold">
                {chartData[draggingFromIndex]?.name}
              </span>
              {hoverIndex !== draggingFromIndex && (
                <>
                  <span className="text-[var(--ink-2)]"> → posición de </span>
                  <span className="text-[var(--ink-2)]">
                    "{chartData[hoverIndex]?.name}"
                  </span>
                </>
              )}
            </div>
          )}
        {/* Zonas de energía: bandas horizontales de fondo (luminancia, sin líneas). */}
        <div className="absolute inset-x-0 pointer-events-none" style={{ top: TOP_PAD, height: plotHeight }}>
          {zonasEnergia.map((z) => (
            <div
              key={z.min}
              className="absolute inset-x-0"
              style={{
                bottom: `${((Math.max(z.y1, yDomain[0]) - yDomain[0]) / yRange) * 100}%`,
                height: `${((Math.min(z.y2, yDomain[1]) - Math.max(z.y1, yDomain[0])) / yRange) * 100}%`,
                background: z.color,
                opacity: 0.07,
              }}
            />
          ))}
        </div>

        {width > 0 && (() => {
          const liveOf = (d: EnergyChartPoint, i: number) =>
            i === draggingFromIndex && dragAxis === "y" && liveEnergyScore !== null ? liveEnergyScore : d.score;
          const pts = chartData
            .map((d, i) => ({ d, i, s: liveOf(d, i) }))
            .filter((q): q is { d: EnergyChartPoint; i: number; s: number } => q.d.isSong && typeof q.s === "number")
            .map((q) => ({ ...q, x: xAt(q.d.xPos), y: yAt(q.s) }));
          const line = monotonePath(pts);
          const area = pts.length > 1 ? `${line} L${pts[pts.length - 1].x},${baseY} L${pts[0].x},${baseY} Z` : "";
          const ideal = monotonePath(
            chartData
              .filter((d) => d.isSong && typeof d.idealScore === "number")
              .map((d) => ({ x: xAt(d.xPos), y: yAt(d.idealScore as number) })),
          );
          const bpmPts = chartData
            .filter((d) => d.isSong && typeof d.bpm === "number")
            .map((d) => ({ x: xAt(d.xPos), v: d.bpm as number }));
          const bMin = Math.min(...bpmPts.map((q) => q.v));
          const bMax = Math.max(...bpmPts.map((q) => q.v));
          const bpmLine = showBpmLine && bpmPts.length
            ? monotonePath(bpmPts.map((q) => ({ x: q.x, y: TOP_PAD + plotHeight * (1 - (0.12 + (bMax === bMin ? 0.4 : ((q.v - bMin) / (bMax - bMin)) * 0.76))) })))
            : "";
          const gid = `energia-${compact ? "c" : "n"}`;
          const reveal = animMode === "entrance" ? 1000 : animMode === "switch" ? 600 : 0;
          const okBadge = (d: EnergyChartPoint) => d.transitionToNext?.status === "ok";
          return (
            <>
              <svg width={width} height={height} className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <defs>
                  <linearGradient id={`${gid}-stroke`} gradientUnits="userSpaceOnUse" x1={PAD_L} x2={width - PAD_R} y1="0" y2="0">
                    {pts.map((q) => <stop key={q.d.id} offset={`${((q.x - PAD_L) / innerW) * 100}%`} stopColor={q.d.color} />)}
                  </linearGradient>
                  <linearGradient id={`${gid}-fill`} gradientUnits="userSpaceOnUse" x1={PAD_L} x2={width - PAD_R} y1="0" y2="0">
                    {pts.map((q) => <stop key={q.d.id} offset={`${((q.x - PAD_L) / innerW) * 100}%`} stopColor={q.d.color} stopOpacity={0.22} />)}
                  </linearGradient>
                </defs>

                {/* Bloques (chapa, pausa, bis…): línea vertical con su icono */}
                {chartData.filter((d) => d.isSpeechEvent).map((d) => (
                  <line key={`sp-${d.id}`} x1={xAt(d.xPos)} x2={xAt(d.xPos)} y1={TOP_PAD} y2={baseY} stroke={d.color} strokeWidth={2} strokeDasharray="4 3" strokeOpacity={0.7} />
                ))}
                {/* Uniones con la siguiente canción */}
                {chartData.filter((d) => showTransitionBadges ? d.transitionToNext : d.harmonyClash).map((d) => {
                  const bad = showTransitionBadges ? !okBadge(d) : true;
                  return (
                    <line key={`tr-${d.id}`} x1={xAt(d.xPos + 0.5)} x2={xAt(d.xPos + 0.5)} y1={TOP_PAD} y2={baseY}
                      stroke={bad ? "var(--alert)" : "var(--ok)"} strokeWidth={bad ? 1.5 : 1} strokeDasharray={bad ? "3 2" : "2 3"} strokeOpacity={bad ? 0.85 : 0.45} />
                  );
                })}
                {/* Guías de arrastre: dónde caería al soltar */}
                {draggingFromIndex !== null && dragAxis !== "y" && hoverIndex !== null && chartData[hoverIndex] && (
                  <line x1={xAt(chartData[hoverIndex].xPos)} x2={xAt(chartData[hoverIndex].xPos)} y1={TOP_PAD} y2={baseY} stroke="var(--acc)" strokeWidth={2} strokeDasharray="4 3" strokeOpacity={0.6} />
                )}
                {draggingFromIndex !== null && dragAxis === "y" && liveEnergyScore !== null && (
                  <line x1={PAD_L} x2={width - PAD_R} y1={yAt(liveEnergyScore)} y2={yAt(liveEnergyScore)} stroke="var(--acc)" strokeWidth={2} strokeDasharray="4 3" strokeOpacity={0.6} />
                )}

                {showIdealCurve && ideal && (
                  <path d={ideal} fill="none" stroke="var(--ink-2)" strokeWidth={compact ? 1.5 : 2} strokeDasharray="5 4" strokeOpacity={0.6} />
                )}
                <g style={{ clipPath: `inset(0 ${revealed ? 0 : 100}% 0 0)`, transition: revealed && reveal ? `clip-path ${reveal}ms ease-in-out` : "none" }}>
                  {area && <path d={area} fill={`url(#${gid}-fill)`} />}
                  {line && pts.length > 1 && <path d={line} fill="none" stroke={`url(#${gid}-stroke)`} strokeWidth={compact ? 2 : 3} strokeLinecap="round" strokeLinejoin="round" />}
                  {bpmLine && <path d={bpmLine} fill="none" stroke="var(--acc)" strokeWidth={compact ? 1.5 : 2} strokeOpacity={0.85} />}
                </g>

                {/* Insignias ✓ / ✕ de unión */}
                {showTransitionBadges && chartData.filter((d) => d.transitionToNext).map((d) => {
                  const tr = d.transitionToNext!;
                  const ok = tr.status === "ok";
                  return (
                    <text key={`tb-${d.id}`} x={xAt(d.xPos + 0.5)} y={TOP_PAD - 4} textAnchor="middle" fontWeight={900}
                      fontSize={compact ? (ok ? 9 : 10) : ok ? 11 : 12} fill={ok ? "var(--ok)" : "var(--alert)"}>
                      {ok ? "✓" : tr.coste.harmonyRelation === "choque" ? "✕ ⚡" : "✕"}
                    </text>
                  );
                })}
                {!showTransitionBadges && chartData.filter((d) => d.harmonyClash).map((d) => (
                  <text key={`hc-${d.id}`} x={xAt(d.xPos + 0.5)} y={TOP_PAD - 4} textAnchor="middle" fontSize={compact ? 10 : 13}>⚡</text>
                ))}
                {chartData.filter((d) => d.isSpeechEvent).map((d) => (
                  <text key={`si-${d.id}`} x={xAt(d.xPos)} y={TOP_PAD - 3} textAnchor="middle" fontSize={compact ? 13 : 18}>{d.icon}</text>
                ))}
              </svg>

              {/* Puntos: botones reales (foco, teclado y arrastre) sobre la curva */}
              {pts.map(({ d, i, x, y }) => {
                const isSelected = d.id === selectedSetlistItemId;
                const isHighlighted = highlightedSongIds.length > 0 && titlesMatch(d.name, highlightedSongIds);
                const isDraggingThis = draggingFromIndex === i;
                const isPlaying = !!currentPlayingSongId && d.songId === currentPlayingSongId;
                const canEditThisEnergy = !!onEnergyChange && d.songId != null;
                const canDragThis = !!onReorder || canEditThisEnergy;
                const r = isPlaying ? (compact ? 7 : 9) : isSelected || isHighlighted || isDraggingThis ? (compact ? 5.5 : 7.5) : compact ? 3.5 : 5.5;
                return (
                  <React.Fragment key={d.id}>
                    <button
                      type="button"
                      aria-label={`#${d.idx + 1} ${d.name}, energía ${Math.round((d.score as number) / 2)} de 10`}
                      aria-pressed={isSelected}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp") { e.preventDefault(); bumpEnergy(i, 1); }
                        else if (e.key === "ArrowDown") { e.preventDefault(); bumpEnergy(i, -1); }
                        else if (e.key === "ArrowLeft" && e.altKey) { e.preventDefault(); moveItem(i, -1); }
                        else if (e.key === "ArrowRight" && e.altKey) { e.preventDefault(); moveItem(i, 1); }
                      }}
                      onClick={(e) => { e.stopPropagation(); if (draggingFromIndex === null) selectPoint(d.id); }}
                      onPointerDown={(e) => {
                        if (!canDragThis) return;
                        e.stopPropagation();
                        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                        startDrag(i, e.clientX, e.clientY, e.pointerId, e.pointerType);
                      }}
                      onPointerEnter={() => { if (isPointerFine) setTip({ i, left: Math.max(70, Math.min(width - 70, x)) }); }}
                      onPointerLeave={() => setTip((t) => (t?.i === i ? null : t))}
                      className="absolute w-9 h-9 rounded-[var(--r-pill)] flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
                      style={{
                        left: x - 18, top: y - 18, touchAction: canDragThis ? "none" : undefined,
                        transition: isDraggingThis ? "none" : "top 150ms ease-out, left 150ms ease-out",
                        cursor: canDragThis ? (onReorder && canEditThisEnergy ? "move" : canEditThisEnergy ? "ns-resize" : "ew-resize") : "pointer",
                      }}
                    >
                      {(isSelected || isPlaying) && (
                        <span className="absolute rounded-[var(--r-pill)]" style={{ width: r * 2 + 8, height: r * 2 + 8, background: isPlaying ? "var(--ok)" : "var(--surface)", opacity: isPlaying ? 0.35 : 1 }} />
                      )}
                      <span className="relative rounded-[var(--r-pill)]" style={{ width: r * 2, height: r * 2, background: d.color, opacity: isDraggingThis ? 0.5 : isSelected || isHighlighted || isPlaying ? 1 : 0.75 }} />
                    </button>
                    {showTonalidad && d.tonalidad && (() => {
                      const fs = compact ? 7.5 : 9;
                      const abajo = y - r - 6 - fs < TOP_PAD;
                      return (
                        <span className="absolute pointer-events-none -translate-x-1/2 rounded-[var(--r-pill)] bg-[var(--surface)] px-1.5 font-mono font-semibold text-[var(--ink)] leading-[1.35]"
                          style={{ left: x, top: abajo ? y + r + 3 : y - r - 5 - fs - 3, fontSize: fs }}>
                          {d.tonalidad}
                        </span>
                      );
                    })()}
                  </React.Fragment>
                );
              })}

              {/* Eje X: #n y, si toca, BPM */}
              {LABEL_H > 0 && chartData.filter((d) => d.isSong).map((d) => (
                <span key={`lb-${d.id}`} className="absolute -translate-x-1/2 text-center leading-tight text-[var(--ink-2)] pointer-events-none"
                  style={{ left: xAt(d.xPos), top: baseY + 4, fontSize }}>
                  {!compact && <>#{d.xPos + 1}</>}
                  {showBpmLine && typeof d.bpm === "number" && <span className="block font-mono">{d.bpm}</span>}
                </span>
              ))}
              {/* Bloques seleccionables (icono clicable) */}
              {chartData.map((d, i) => d.isSpeechEvent ? (
                <button key={`sb-${d.id}`} type="button" aria-label={d.name} title={d.name}
                  onClick={(e) => { e.stopPropagation(); selectPoint(d.id); }}
                  className="absolute -translate-x-1/2 w-6 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] rounded-[var(--r-s)]"
                  style={{ left: xAt(d.xPos), top: 0, height: TOP_PAD + 4, opacity: 0 }} data-idx={i} />
              ) : null)}
            </>
          );
        })()}

        {/* Tooltip con ratón real; en táctil el detalle vive en el panel de debajo. */}
        {isPointerFine && tip && draggingFromIndex === null && chartData[tip.i] && (
          <div className="absolute z-30 top-1 -translate-x-1/2 bg-[var(--surface)] text-[var(--ink)] text-[10px] font-sans px-2.5 py-1.5 rounded-[var(--r-s)] max-w-[180px] pointer-events-none" style={{ left: tip.left }}>
            <p className="font-bold text-[var(--acc-ink)] truncate">{chartData[tip.i].name}</p>
            <p className="text-[var(--ink-2)] truncate">
              {chartData[tip.i].icon} {chartData[tip.i].label} ({typeof chartData[tip.i].score === "number" ? Math.round((chartData[tip.i].score as number) / 2) : "–"}/10)
              {chartData[tip.i].tonalidad ? ` · ${chartData[tip.i].tonalidad}` : ""}
              {typeof chartData[tip.i].bpm === "number" ? ` · ${chartData[tip.i].bpm} BPM` : ""}
            </p>
          </div>
        )}
      </div>
      {belowChartSlot ??
        (() => {
          if (!onEnergyChange && !onReorder) return null;
          const i = chartData.findIndex((d) => d.id === selectedSetlistItemId);
          const pt = i >= 0 ? chartData[i] : null;
          if (!pt) return null;
          const canEnergy = !!onEnergyChange && pt.songId != null && typeof pt.score === "number";
          const btn =
            "w-8 h-8 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink)] flex items-center justify-center hover:brightness-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0";
          return (
            <div className="mt-2 flex items-center justify-center gap-2" role="group" aria-label="Editar canción seleccionada">
              {onReorder && (
                <button type="button" className={btn} disabled={i <= 0} onClick={() => moveItem(i, -1)} title="Mover antes" aria-label="Mover antes">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {canEnergy && (
                <>
                  <button type="button" className={btn} disabled={(pt.score as number) <= 1} onClick={() => bumpEnergy(i, -1)} title="Bajar energía" aria-label="Bajar energía">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="min-w-[4.5rem] text-center text-xs font-sans text-[var(--ink)] tabular-nums">
                    {Math.round((pt.score as number) / 2)}/10
                  </span>
                  <button type="button" className={btn} disabled={(pt.score as number) >= 20} onClick={() => bumpEnergy(i, 1)} title="Subir energía" aria-label="Subir energía">
                    <Plus className="w-4 h-4" />
                  </button>
                </>
              )}
              {onReorder && (
                <button type="button" className={btn} disabled={i >= chartData.length - 1} onClick={() => moveItem(i, 1)} title="Mover después" aria-label="Mover después">
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })()}
      {/* Panel de detalle del punto activo — FUERA del contenedor del gráfico (que tiene
 overflow-hidden y alto fijo), debajo de él, nunca flotando encima de la curva. Ver
 comentario en RechartsTooltip más arriba sobre por qué se sacó de ahí. */}
      {activePoint &&
        (() => {
          const d = activePoint;
          return (
            <div className="mt-2 bg-[var(--sunken)] text-[var(--ink)] text-[9px] font-sans py-1.5 px-2.5 rounded-[var(--r-s)] relative">
              <button
                type="button"
                onClick={() => setDismissedId(d.id)}
                className="absolute top-1.5 right-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                title="Cerrar"
              >
                ✕
              </button>
              <p className="font-bold text-[var(--acc)] text-[10px] pr-4">
                #{d.idx + 1} {d.name}
              </p>
              {d.isSpeechEvent ? (
                <p className="text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
                  <span>{d.icon}</span> Interludio / Pausa — meseta de energía
                </p>
              ) : (
                <>
                  <p className="text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
                    <span>{d.icon}</span> {d.label} ({Math.round(d.score / 2)}
                    /10)
                  </p>
                  {typeof d.bpm === "number" && (
                    <p className="text-[var(--ink-2)] mt-0.5">🥁 {d.bpm} BPM</p>
                  )}
                  {d.tonalidad && (
                    <p className="text-[var(--acc)]/70 mt-0.5">
                      🎼 {d.tonalidad}
                    </p>
                  )}
                  {d.variance > 0 && (
                    <p className="text-[var(--ink-2)] mt-0.5">
                      🎧 Dinámica interna:{" "}
                      {d.variance >= 6
                        ? "alta (sube y baja mucho)"
                        : d.variance >= 3
                          ? "media"
                          : "suave"}
                    </p>
                  )}
                  {showIdealCurve &&
                    typeof d.idealScore === "number" &&
                    Math.abs(d.idealScore - d.score) >= 2 && (
                      <p className="text-[var(--ink-2)] mt-0.5">
                        〰️ Ideal aquí: ~{Math.round(d.idealScore / 2)}/10
                      </p>
                    )}
                  {d.transitionFromPrev && (
                    <div className="mt-1.5 pt-1">
                      <div className="flex items-center gap-1 font-bold">
                        <span
                          className={`w-3.5 h-3.5 rounded-[var(--r-pill)] flex items-center justify-center text-[9px] font-black shrink-0 ${
                            d.transitionFromPrev.status === "ok"
                              ? "bg-[var(--ok)]/20 text-[var(--ink-2)]"
                              : "bg-[var(--alert)]/20 text-[var(--ink-2)]"
                          }`}
                        >
                          {d.transitionFromPrev.icon}
                        </span>
                        <span>
                          Unión con #{d.idx}:{" "}
                          {d.transitionFromPrev.status === "ok"
                            ? "Fluida"
                            : "Revisar"}{" "}
                          ({d.transitionFromPrev.scorePercent}%)
                        </span>
                      </div>
                      {d.transitionFromPrev.motivos.length > 0 && (
                        <p className="text-[8px] text-[var(--ink-2)] pl-4 mt-0.5 leading-tight">
                          {d.transitionFromPrev.motivos.join("·")}
                        </p>
                      )}
                    </div>
                  )}
                  {d.idx > 0 && onPreviewTransition && (
                    <button
                      type="button"
                      onClick={() => onPreviewTransition(d.idx)}
                      className="text-[var(--acc)] font-semibold mt-1 pt-1 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      🎧 Probar unión con #{d.idx}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })()}
    </div>
  );
}
