import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Loader,
  AlertCircle,
  Brain,
  TrendingUp,
  Zap,
  Move,
  Printer,
  Share2,
  Download,
} from "lucide-react";
import html2canvas from "html2canvas";
import { api } from "../../services/api";
import { titlesMatch } from "../../utils/songTitleMatch";
import { EnergyChart, EnergyChartPoint, EnergyChartZone } from "./EnergyChart";
import { PacingWarning } from "../../utils/energyPacingUtils";
import {
  IndexChange,
  adjustPosition1,
} from "../../utils/setlistActionPositionAdjust";
import { openWhatsAppChat } from "../../utils/whatsapp";
import { ShowIcon } from '../ui/ShowIcon';

interface SetlistAIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  setlistId: string;
  setlistName?: string;
  /** Análisis ya guardado para este setlist (si existe), para no obligar a re-analizar solo para verlo. */
  initialAnalysis?: Analysis | null;
  onAnalysisComplete?: (analysis: Analysis) => void;
  onHighlightSongs?: (songIds: string[]) => void;
  highlightedSongIds?: string[];
  /** Datos del Mapa de Energía para mostrar un mini-gráfico integrado en el modal — así no hace
   * falta ver el modal y el gráfico grande a la vez sin que se tapen: las sugerencias resaltan
   * directamente sobre esta versión compacta. */
  chartData?: EnergyChartPoint[];
  yDomain?: [number, number];
  zonasEnergia?: EnergyChartZone[];
  /** Avisos del análisis básico (heurístico) del setlist activo — se muestran aquí igual que en
   * el editor de setlist, con su botón"Aplicar" cuando hay un reordenamiento determinista
   * disponible, para no obligar a cerrar el modal solo para aplicar una sugerencia. */
  warnings?: PacingWarning[];
  /** Reordena el setlist (usado tanto por el botón"Aplicar" de los avisos/sugerencias como por
   * arrastrar un punto en el mini-gráfico de aquí dentro). Si se omite, el mini-gráfico queda solo
   * de lectura. `sourceKey` identifica qué acción lo pidió (p.ej."ai-suggestion-2") — así ESE
   * botón concreto puede saber si es el que"Deshacer" revertiría ahora mismo. */
  onReorder?: (fromIndex: number, toIndex: number, sourceKey?: string) => void;
  /** Arrastrar un punto en vertical cambia su energía (1-20) directamente desde este mini-gráfico. */
  onEnergyChange?: (point: EnergyChartPoint, newScore: number) => void;
  /** true si hay un último reordenamiento (desde aquí o desde el editor de fondo) que se puede
   * deshacer. Se muestra un botón"Deshacer" en el modal para no obligar a cerrarlo solo para eso. */
  canUndo?: boolean;
  onUndo?: () => void;
  /** sourceKey de la acción que dejó el snapshot que"Deshacer" revertiría ahora — null si no hay
   * nada que deshacer. Permite que el botón"Aplicar" de UNA sugerencia concreta se convierta en
   *"Deshacer" solo mientras siga siendo la acción más reciente (la única que un snapshot de un
   * solo nivel puede revertir de verdad). */
  undoSourceKey?: string | null;
}

interface Suggestion {
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  issue: string;
  suggestion: string;
  impact: string;
  songs_involved?: string[];
  /** Posiciones 1-indexadas (tal como las vio el modelo) del reordenamiento que resolvería esta
   * sugerencia — ya validadas en el servidor contra la lista real, nunca inventadas por el
   * frontend. Null/ausente cuando la sugerencia no es sobre mover una canción de sitio. */
  suggested_reorder?: { from_position: number; to_position: number } | null;
}

interface Analysis {
  narrativeArc: string;
  psychologicalFlow: string;
  suggestions: Suggestion[];
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
}

export function SetlistAIAnalysisModal({
  isOpen,
  onClose,
  setlistId,
  setlistName,
  initialAnalysis,
  onAnalysisComplete,
  onHighlightSongs,
  highlightedSongIds = [],
  chartData,
  yDomain,
  zonasEnergia,
  warnings = [],
  onReorder,
  onEnergyChange,
  canUndo = false,
  onUndo,
  undoSourceKey = null,
}: SetlistAIAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  // Al abrir, si ya hay un análisis guardado para este setlist, mostrarlo directamente en vez
  // de forzar al usuario a pulsar"Iniciar Análisis IA" solo para ver lo que ya se calculó.
  useEffect(() => {
    if (isOpen) {
      setAnalysis(initialAnalysis ?? null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, setlistId]);

  // Copia local de las sugerencias que SÍ se reajusta tras cada"Aplicar" — aplicar una sugerencia
  // cambia el orden real del setlist, y las demás sugerencias pendientes seguían apuntando a la
  // posición de CUANDO se generó el análisis. Antes eso hacía que solo se pudiera aplicar una con
  // confianza: la segunda podía mover la canción equivocada sin avisar. Ahora se reajustan las
  // posiciones de las pendientes tras cada aplicación (ver adjustPosition1), o se marcan como ya
  // no aplicables si la canción que necesitaban movió justo a la posición que ya no existe.
  const [liveSuggestions, setLiveSuggestions] = useState<Suggestion[] | null>(
    null,
  );
  const [appliedSuggestionIndices, setAppliedSuggestionIndices] = useState<
    Set<number>
  >(new Set());
  const [invalidSuggestionIndices, setInvalidSuggestionIndices] = useState<
    Set<number>
  >(new Set());
  const [preApplySnapshot, setPreApplySnapshot] = useState<{
    suggestions: Suggestion[];
    invalidIndices: Set<number>;
  } | null>(null);

  useEffect(() => {
    setLiveSuggestions(analysis ? analysis.suggestions : null);
    setAppliedSuggestionIndices(new Set());
    setInvalidSuggestionIndices(new Set());
    setPreApplySnapshot(null);
  }, [analysis]);

  const handleApplySuggestion = (idx: number) => {
    if (!liveSuggestions || !onReorder) return;
    const sugg = liveSuggestions[idx];
    const reorder = sugg.suggested_reorder;
    if (!reorder) return;
    const sourceKey = `ai-suggestion-${idx}`;

    setPreApplySnapshot({
      suggestions: liveSuggestions,
      invalidIndices: new Set(invalidSuggestionIndices),
    });
    onReorder(reorder.from_position - 1, reorder.to_position - 1, sourceKey);
    setAppliedSuggestionIndices((prev) => new Set(prev).add(idx));

    const change: IndexChange = {
      type: "move",
      from: reorder.from_position - 1,
      to: reorder.to_position - 1,
    };
    const next = [...liveSuggestions];
    const nextInvalid = new Set(invalidSuggestionIndices);
    for (let i = 0; i < next.length; i++) {
      if (
        i === idx ||
        appliedSuggestionIndices.has(i) ||
        invalidSuggestionIndices.has(i)
      )
        continue;
      const other = next[i].suggested_reorder;
      if (!other) continue;
      const from_position = adjustPosition1(other.from_position, change);
      const to_position = adjustPosition1(other.to_position, change);
      if (from_position == null || to_position == null) {
        nextInvalid.add(i);
      } else {
        next[i] = {
          ...next[i],
          suggested_reorder: { from_position, to_position },
        };
      }
    }
    setLiveSuggestions(next);
    setInvalidSuggestionIndices(nextInvalid);
  };

  const handleUndoSuggestion = (idx: number) => {
    onUndo?.();
    setAppliedSuggestionIndices((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    if (preApplySnapshot) {
      setLiveSuggestions(preApplySnapshot.suggestions);
      setInvalidSuggestionIndices(preApplySnapshot.invalidIndices);
      setPreApplySnapshot(null);
    }
  };

  // Modal arrastrable: el usuario puede moverlo a un lado para ver el gráfico de energía
  // (con el highlighting) mientras pasa el ratón por las sugerencias dentro del modal.
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) setDragOffset({ x: 0, y: 0 });
  }, [isOpen]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      const dx = e.clientX - dragStateRef.current.startX;
      const dy = e.clientY - dragStateRef.current.startY;
      setDragOffset({
        x: dragStateRef.current.originX + dx,
        y: dragStateRef.current.originY + dy,
      });
    };
    const handleUp = () => {
      dragStateRef.current = null;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: dragOffset.x,
      originY: dragOffset.y,
    };
  };

  // Referencia al contenedor del mini-gráfico para poder capturar su SVG real (con gradientes y
  // colores exactos) al exportar/compartir, en vez de recrearlo aproximadamente en CSS.
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // Referencia al bloque completo (header + gráfico + score + arco narrativo + sugerencias +
  // áreas de mejora) para exportarlo entero como una única imagen con html2canvas — a diferencia
  // del PDF (que es texto real seleccionable), esto es lo que hace falta para compartir de un
  // vistazo por WhatsApp: una captura tal cual se ve en pantalla.
  const analysisContentRef = useRef<HTMLDivElement>(null);
  // Contenedor con scroll propio del modal (overflow-y-auto) — al lanzar un (re)análisis se hace
  // scroll a top aquí, para que el usuario vea el estado de progreso desde arriba en vez de
  // quedarse mirando donde estuviera desplazado (normalmente abajo del todo, tras pulsar
  //"Reanalizar" al final de un análisis anterior).
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /** Serializa el SVG del gráfico ya renderizado a un data: URI, listo para <img src="..."> o para dibujar en un canvas. Null si el gráfico no está montado (p.ej. setlist vacío). */
  const getChartSvgDataUrl = (): string | null => {
    const svgEl = chartContainerRef.current?.querySelector("svg");
    if (!svgEl) return null;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!clone.getAttribute("width"))
      clone.setAttribute("width", String(svgEl.clientWidth || 600));
    if (!clone.getAttribute("height"))
      clone.setAttribute("height", String(svgEl.clientHeight || 200));
    const svgString = new XMLSerializer().serializeToString(clone);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  };

  /** Convierte el SVG del gráfico a PNG (dibujándolo en un <canvas>) para compartir como archivo de imagen — la Web Share API y WhatsApp entienden PNG universalmente, no todos los destinos aceptan SVG. Resuelve null si no hay gráfico o el navegador bloquea el canvas (raro, pero posible en algunos navegadores muy restrictivos). */
  const getChartPngBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const svgDataUrl = getChartSvgDataUrl();
      if (!svgDataUrl) return resolve(null);
      const img = new Image();
      img.onload = () => {
        const scale = 2; // más nítido al compartir/imprimir que el tamaño real en pantalla
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/png");
      };
      img.onerror = () => resolve(null);
      img.src = svgDataUrl;
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const result = await api.analyzeSetlistWithAI(setlistId);
      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
        onAnalysisComplete?.(result.analysis);
      } else {
        setError(result.error || "Error al analizar el setlist");
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟠";
      case "low":
        return "🟡";
      default:
        return "⚪";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "pacing":
        return "⏱️";
      case "narrative":
        return "📖";
      case "psychology":
        return "🧠";
      case "recovery":
        return "💨";
      case "contrast":
        return "⚡";
      default:
        return "📌";
    }
  };

  const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Exporta el análisis a una hoja imprimible/PDF (mismo patrón que la Hoja de Escenario del
  // repertorio: una ventana nueva con HTML autocontenido + window.print()). El gráfico se
  // incrusta como el SVG real ya renderizado (mismos gradientes y colores exactos que en
  // pantalla) en vez de recrearlo aproximadamente — capturarlo así no necesita html2canvas ni
  // ninguna dependencia nueva, un SVG se sirve tal cual como imagen.
  const handlePrintAnalysis = () => {
    if (!analysis) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const chartSvgUrl = getChartSvgDataUrl();

    const suggestionsHtml = analysis.suggestions
      .map(
        (sugg) => `
 <div style="background:#1a1a1a; border-radius:12px; padding:14px; margin-bottom:12px; break-inside:avoid;">
 <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
 <span>${getPriorityIcon(sugg.priority)}</span>
 <strong style="font-size:15px;">${escapeHtml(sugg.title)}</strong>
 <span style="font-size:11px; color:#888; margin-left:auto;">${getCategoryIcon(sugg.category)} ${escapeHtml(sugg.category)}</span>
 </div>
 <p style="font-size:12px; color:#aaa; margin:4px 0;"><strong style="color:#ccc;">🔍 Problema:</strong> ${escapeHtml(sugg.issue)}</p>
 <p style="font-size:12px; color:#aaa; margin:4px 0;"><strong style="color:#ccc;">💡 Sugerencia:</strong> ${escapeHtml(sugg.suggestion)}</p>
 <p style="font-size:12px; color:#aaa; margin:4px 0;"><strong style="color:#ccc;">⭐ Impacto:</strong> ${escapeHtml(sugg.impact)}</p>
 ${sugg.songs_involved?.length ? `<p style="font-size:12px; color:#aaa; margin:4px 0;"><strong style="color:#ccc;">🎵 Canciones:</strong> ${escapeHtml(sugg.songs_involved.join(","))}</p>` : ""}
 </div>
 `,
      )
      .join("");

    printWindow.document.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <title>Análisis IA - ${escapeHtml(setlistName || setlistId)}</title>
 <style>
 body { font-family: system-ui, -apple-system, sans-serif; margin: 24px; background: #0a0a0a; color: #eee; }
 .header { padding-bottom: 14px; margin-bottom: 20px; }
 h1 { font-size: 26px; margin: 0; color: #c084fc; letter-spacing: 0.5px; }
 .meta { font-size: 13px; font-family: monospace; color: #999; margin-top: 4px; }
 .score-box { background: #1a1a1a; border-radius: 18px; padding: 14px; margin-bottom: 16px; }
 .score-bar-bg { width: 100%; background: #333; border-radius: 999px; height: 8px; margin-top: 6px; }
 .score-bar-fill { height: 8px; border-radius: 999px; background: linear-gradient(90deg, #a855f7, #c084fc); }
 .chart-box { background: #1a1a1a; border-radius: 18px; padding: 14px; margin-bottom: 16px; }
 .chart-box img { width: 100%; height: auto; display: block; }
 .info-box { background: #1a1a1a; border-radius: 18px; padding: 14px; margin-bottom: 16px; }
 .info-box p.label { font-size: 12px; color: #999; margin: 0 0 6px 0; }
 .info-box p.value { font-size: 14px; color: #eee; margin: 0; line-height: 1.5; }
 .strengths { background: #ddf1ee; border-radius: 18px; padding: 14px; margin-bottom: 16px; }
 .improvements { background: #fde9e7; border-radius: 18px; padding: 14px; margin-bottom: 16px; }
 ul { margin: 6px 0 0 0; padding-left: 18px; font-size: 13px; }
 .footer { margin-top: 24px; font-size: 11px; font-family: monospace; color: #666; text-align: center; }
 @media print { body { background: #fff; color: #111; } .score-box, .chart-box, .info-box { background: #f5f5f5; } .strengths { background: #ecfdf5; } .improvements { background: #fffbeb; } }
 </style>
 </head>
 <body>
 <div class="header">
 <h1>🧠 Análisis Avanzado con IA</h1>
 <div class="meta">${escapeHtml(setlistName || setlistId)} • ${new Date().toLocaleDateString("es-ES")}</div>
 </div>

 <div class="score-box">
 <div style="display:flex; justify-content:space-between; align-items:center;">
 <span style="font-size:13px; color:#999;">Score General</span>
 <strong style="font-size:20px; color:#c084fc;">${analysis.overallScore}/100</strong>
 </div>
 <div class="score-bar-bg"><div class="score-bar-fill" style="width:${analysis.overallScore}%;"></div></div>
 </div>

 ${chartSvgUrl ? `<div class="chart-box"><img src="${chartSvgUrl}" alt="Mapa de Energía" /></div>` : ""}

 <div class="info-box">
 <p class="label">📖 Arco Narrativo</p>
 <p class="value">${escapeHtml(analysis.narrativeArc)}</p>
 </div>

 <div class="info-box">
 <p class="label">🧠 Flujo Psicológico</p>
 <p class="value">${escapeHtml(analysis.psychologicalFlow)}</p>
 </div>

 ${
   analysis.strengths.length > 0
     ? `
 <div class="strengths">
 <p class="label" style="color:var(--ok);">✓ Fortalezas</p>
 <ul>${analysis.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
 </div>`
     : ""
 }

 <h2 style="font-size:16px; margin-bottom:10px;">⚡ Sugerencias (${analysis.suggestions.length})</h2>
 ${suggestionsHtml}

 ${
   analysis.areasForImprovement.length > 0
     ? `
 <div class="improvements">
 <p class="label" style="color:var(--acc);">🎯 Áreas de Mejora</p>
 <ul>${analysis.areasForImprovement.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
 </div>`
     : ""
 }

 <div class="footer">Análisis IA exportado • BandManager.io</div>

 <script>
 window.onload = function() { window.print(); }
 </script>
 </body>
 </html>
 `);
    printWindow.document.close();
  };

  /** Texto resumen del análisis, usado tanto por Web Share como por el fallback de WhatsApp. */
  const buildShareText = (a: Analysis) => {
    const topSuggestions = a.suggestions
      .slice(0, 3)
      .map((s) => `• ${s.title}: ${s.suggestion}`)
      .join("\n");
    return [
      `🧠 Análisis IA — ${setlistName || "Setlist"}`,
      `Score: ${a.overallScore}/100`,
      "",
      `📖 ${a.narrativeArc}`,
      "",
      topSuggestions ? `Top sugerencias:\n${topSuggestions}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  /** Captura TODO el bloque de análisis (header, gráfico, score, arco, sugerencias, áreas de
   * mejora) tal como se ve en pantalla, en una sola imagen PNG — a diferencia del PDF (texto
   * real), esto es lo que hace falta para compartir de un vistazo por WhatsApp. */
  const getFullAnalysisImageBlob = async (): Promise<Blob | null> => {
    if (!analysisContentRef.current) return null;
    const canvas = await html2canvas(analysisContentRef.current, {
      backgroundColor: "#171717",
      scale: 2,
      useCORS: true,
    });
    return new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/png"),
    );
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  /** Guarda la captura completa como PNG — el camino que funciona siempre, incluido en
   * escritorio, donde la Web Share API con archivos casi nunca está disponible. */
  const handleDownloadImage = async () => {
    if (!analysis) return;
    setExportingImage(true);
    try {
      const blob = await getFullAnalysisImageBlob();
      if (blob) downloadBlob(blob, `analisis-ia-${setlistId}.png`);
    } finally {
      setExportingImage(false);
    }
  };

  // Compartir: usa la Web Share API nativa cuando el navegador la soporta con archivos (Chrome
  // y Safari en móvil, principalmente) para adjuntar directamente la imagen completa del
  // análisis + texto resumen a WhatsApp/Telegram/Mail/lo que sea — es el propio sistema el que
  // ofrece las apps instaladas, no hay forma de"elegir WhatsApp" desde web sin ese selector
  // nativo. En escritorio esa API casi nunca soporta archivos, así que ahí se descarga la
  // imagen directamente y se abre wa.me con el texto para poder adjuntarla a mano.
  const handleShareAnalysis = async () => {
    if (!analysis) return;
    setSharing(true);
    try {
      const text = buildShareText(analysis);
      const imageBlob = await getFullAnalysisImageBlob();
      const shareTitle = `Análisis IA — ${setlistName || "Setlist"}`;

      if (imageBlob && typeof navigator.share === "function") {
        const file = new File([imageBlob], `analisis-ia-${setlistId}.png`, {
          type: "image/png",
        });
        const canShareFiles =
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] });
        if (canShareFiles) {
          await navigator.share({ title: shareTitle, text, files: [file] });
          return;
        }
      }
      if (typeof navigator.share === "function") {
        // Sin soporte de archivos pero sí de texto (algunos navegadores) — igual de válido.
        try {
          await navigator.share({ title: shareTitle, text });
          return;
        } catch {
          // el usuario canceló el share sheet, o falló — sigue al fallback de abajo
        }
      }
      // Fallback de escritorio: descarga la imagen y abre WhatsApp Web con el texto — wa.me no
      // admite adjuntar archivos por URL, así que la imagen hay que arrastrarla a mano al chat.
      if (imageBlob) downloadBlob(imageBlob, `analisis-ia-${setlistId}.png`);
      openWhatsAppChat(undefined, text);
    } catch (err: any) {
      // AbortError = el usuario cerró el selector de compartir sin elegir nada: no es un fallo.
      if (err?.name !== "AbortError") {
        openWhatsAppChat(undefined, buildShareText(analysis));
      }
    } finally {
      setSharing(false);
    }
  };

  const hasChart = !!chartData && chartData.length > 0 && !!yDomain;

  return (
    // Centrado y con el Mapa de Energía integrado dentro (justo debajo del header) — así las
    // sugerencias resaltan directamente sobre este mini-gráfico en vez de depender de ver el
    // modal y el gráfico grande de fondo a la vez sin que se tapen. El drag (más abajo) se deja
    // por si aun así el usuario quiere apartarlo a un lado.
    <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-12 pointer-events-none">
      <div
        ref={scrollContainerRef}
        className="bg-[var(--surface)] rounded-[var(--r-s)] w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto"
        style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
      >
        {/* Todo lo de aquí dentro (header, gráfico, score, arco, sugerencias, áreas de mejora) es
 lo que se captura al exportar/compartir como imagen — los Action Buttons quedan fuera
 del ref, más abajo, para no salir en la captura. */}
        <div ref={analysisContentRef}>
          {/* Header + Mapa de Energía en un único bloque sticky: así ambos quedan fijos arriba al
 hacer scroll por las sugerencias, sin depender de calcular a mano la altura del
 header para un segundo"top" (frágil — ya se rompió una vez al hacer el header más
 compacto). Un solo contenedor sticky con top-0 no necesita ningún offset. */}
          <div className="sticky top-0 z-10 bg-[var(--surface)]">
            {/* Header — arrastrable por si hace falta apartar el modal */}
            <div
              className="p-3 flex justify-between items-center cursor-move select-none"
              onMouseDown={handleDragStart}
            >
              <div className="flex items-center gap-2.5">
                <Move className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
                <Brain className="w-5 h-5 text-[var(--acc)]" />
                <div>
                  <h2 className="text-base font-bold">
                    Análisis Avanzado con IA
                  </h2>
                  {setlistName && (
                    <p className="text-xs text-[var(--ink-2)]">{setlistName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {canUndo && (
                  <button
                    onClick={onUndo}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="px-2 py-1 rounded-[var(--r-s)] bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc)]/70 hover:text-[var(--acc)] transition text-xs font-sans font-medium flex items-center gap-1"
                    title="Deshacer el último reordenamiento del setlist"
                  >
                    <ShowIcon inline emoji="↩️" />Deshacer
                  </button>
                )}
                <button
                  onClick={onClose}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-2 hover:bg-[var(--surface)]/80 rounded-[var(--r-s)] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mapa de Energía integrado: las sugerencias de abajo resaltan aquí mismo al hacer hover/click.
 El ref permite capturar el SVG real (gradientes y colores incluidos) al exportar/compartir. */}
            {hasChart && (
              <div ref={chartContainerRef} className="p-3">
                <EnergyChart
                  setlistKey={setlistId}
                  chartData={chartData!}
                  yDomain={yDomain!}
                  zonasEnergia={zonasEnergia || []}
                  highlightedSongIds={highlightedSongIds}
                  height={190}
                  compact
                  onReorder={onReorder}
                  onEnergyChange={onEnergyChange}
                />
              </div>
            )}

            {/* Avisos del análisis básico (heurístico) — mismos badges que en el editor de setlist,
 para poder aplicar un reordenamiento sugerido sin salir del modal. */}
            {warnings.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3">
                {warnings.map((w, i) => {
                  const hasSongs = !!w.songTitles && w.songTitles.length > 0;
                  const isHighlighted =
                    hasSongs &&
                    highlightedSongIds.length > 0 &&
                    w.songTitles!.some((t) =>
                      titlesMatch(t, highlightedSongIds),
                    );
                  return (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-micro font-sans font-medium flex items-center gap-1 transition ${
                        w.type === "warning"
                          ? "bg-[var(--acc)]/10 text-[var(--acc)]/70 "
                          : w.type === "success"
                            ? "bg-[var(--ok)]/10 text-[var(--ink-2)]/30"
                            : "bg-[var(--acc)]/10 text-[var(--ink-2)]/30"
                      } ${isHighlighted ? "ring-2 ring-[var(--ink)]/60" : ""}`}
                      style={{ cursor: hasSongs ? "pointer" : "default" }}
                      onMouseEnter={() => {
                        if (hasSongs) onHighlightSongs?.(w.songTitles!);
                      }}
                      onMouseLeave={() => onHighlightSongs?.([])}
                      onClick={() => {
                        if (hasSongs)
                          onHighlightSongs?.(
                            isHighlighted ? [] : w.songTitles!,
                          );
                      }}
                      title={
                        hasSongs
                          ? `Resalta: ${w.songTitles!.join(",")}`
                          : undefined
                      }
                    >
                      <span><ShowIcon inline emoji={w.icon} /></span>
                      <span>{w.message}</span>
                      {w.suggestedReorder && onReorder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorder(
                              w.suggestedReorder!.fromIndex,
                              w.suggestedReorder!.toIndex,
                              `warning-${i}`,
                            );
                          }}
                          className="ml-1 px-1.5 py-0.5 rounded bg-[var(--ink)]/10 hover:bg-[var(--ink)]/25 text-[var(--ink)] font-bold transition"
                          title={w.suggestedReorder.description}
                        >
                          ✓ Aplicar
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {!analysis && !loading && !error && (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-[var(--acc)]/50 mx-auto mb-4" />
                <p className="text-[var(--ink-2)] mb-6">
                  Haz un análisis profundo de tu setlist con IA. Te daremos
                  sugerencias personalizadas sobre pacing, narrativa y
                  psicología del público.
                </p>
                <button
                  onClick={handleAnalyze}
                  className="bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] px-6 py-2 rounded-[var(--r-s)] transition font-medium"
                >
                  Iniciar Análisis IA
                </button>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 animate-spin text-[var(--acc)] mx-auto mb-4" />
                <p className="text-[var(--ink-2)]">Analizando tu setlist...</p>
              </div>
            )}

            {error && (
              <div className="bg-[var(--alert)]/10 rounded-[var(--r-s)] p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--alert)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--alert)]/40">Error</p>
                  <p className="text-sm text-[var(--alert)]/60">{error}</p>
                  <button
                    onClick={handleAnalyze}
                    className="mt-3 text-sm text-[var(--alert)]/60 hover:text-[var(--alert)]/40 underline"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Score */}
                <div className="bg-[var(--surface)]/80 rounded-[var(--r-s)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--ink-2)] font-medium">
                      Score General
                    </span>
                    <span className="text-lg font-bold text-[var(--acc)]">
                      {analysis.overallScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-[var(--surface)]/70 rounded-[var(--r-pill)] h-1.5">
                    <div
                      className="bg-[var(--acc)]  h-1.5 rounded-[var(--r-pill)] transition-ui"
                      style={{ width: `${analysis.overallScore}%` }}
                    />
                  </div>
                </div>

                {/* Narrative Arc */}
                <div className="bg-[var(--surface)]/80 rounded-[var(--r-s)] p-3">
                  <p className="text-xs text-[var(--ink-2)] mb-1.5">
                    <ShowIcon inline emoji="📖" />Arco Narrativo
                  </p>
                  <p className="text-sm text-[var(--ink-2)]">
                    {analysis.narrativeArc}
                  </p>
                </div>

                {/* Psychological Flow */}
                <div className="bg-[var(--surface)]/80 rounded-[var(--r-s)] p-3">
                  <p className="text-xs text-[var(--ink-2)] mb-1.5">
                    <ShowIcon inline emoji="🧠" />Flujo Psicológico
                  </p>
                  <p className="text-sm text-[var(--ink-2)]">
                    {analysis.psychologicalFlow}
                  </p>
                </div>

                {/* Strengths */}
                {analysis.strengths.length > 0 && (
                  <div className="bg-[var(--ok)]/10 rounded-[var(--r-s)] p-3">
                    <p className="text-xs font-medium text-[var(--ok)] mb-1.5">
                      ✓ Fortalezas
                    </p>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="text-xs text-[var(--ok)]/60">
                          • {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--ink-2)] mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[var(--acc)]" />
                    Sugerencias (
                    {(liveSuggestions || analysis.suggestions).length})
                  </h3>
                  <div className="space-y-3">
                    {(liveSuggestions || analysis.suggestions).map(
                      (sugg, idx) => {
                        const isHighlighted =
                          sugg.songs_involved?.some((songName) =>
                            titlesMatch(songName, highlightedSongIds),
                          ) ?? false;
                        const isInvalid = invalidSuggestionIndices.has(idx);
                        return (
                          <div
                            key={idx}
                            className={`rounded-[var(--r-s)] p-3 transition cursor-pointer ${
                              isInvalid
                                ? "bg-[var(--sunken)] opacity-50"
                                : isHighlighted
                                  ? "bg-[var(--acc)]/80 ring-2 ring-[var(--acc)]/30"
                                  : "bg-[var(--surface)]/80 hover:"
                            }`}
                            onMouseEnter={() => {
                              if (sugg.songs_involved?.length) {
                                onHighlightSongs?.(sugg.songs_involved);
                              }
                            }}
                            onMouseLeave={() => onHighlightSongs?.([])}
                          >
                            <div className="flex items-start gap-2.5 mb-2">
                              <span className="text-sm">
                                {getPriorityIcon(sugg.priority)}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--ink-2)]">
                                      {sugg.title}
                                    </p>
                                    <p className="text-xs text-[var(--ink-2)] mt-0.5">
                                      {getCategoryIcon(sugg.category)}{" "}
                                      {sugg.category}
                                    </p>
                                  </div>
                                  {sugg.suggested_reorder &&
                                    onReorder &&
                                    (() => {
                                      const sourceKey = `ai-suggestion-${idx}`;
                                      if (isInvalid) {
                                        return (
                                          <span
                                            className="text-micro text-[var(--ink-2)] font-sans font-medium whitespace-nowrap"
                                            title="Un cambio anterior afectó a la canción que esta sugerencia necesitaba"
                                          >
                                            <ShowIcon inline emoji="⚠️" />Ya no aplica
                                          </span>
                                        );
                                      }
                                      // Mientras esta aplicación siga siendo la más reciente, el propio
                                      // botón"Aplicar" se convierte en"Deshacer" — no hace falta ir a
                                      // buscar el botón genérico de arriba para revertir justo esto.
                                      if (undoSourceKey === sourceKey) {
                                        return (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleUndoSuggestion(idx);
                                            }}
                                            className="shrink-0 px-2 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc)]/70 hover:text-[var(--acc)] font-bold text-micro font-sans transition whitespace-nowrap"
                                            title="Deshacer este cambio de orden"
                                          >
                                            <ShowIcon inline emoji="↩️" />Deshacer
                                          </button>
                                        );
                                      }
                                      if (appliedSuggestionIndices.has(idx)) {
                                        // Se aplicó, pero luego se aplicó/arrastró otra cosa encima — el
                                        // snapshot de un solo nivel ya no puede revertir justo esto.
                                        return (
                                          <span className="text-micro text-[var(--ok)] font-sans font-medium whitespace-nowrap">
                                            ✓ Aplicado
                                          </span>
                                        );
                                      }
                                      return (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApplySuggestion(idx);
                                          }}
                                          className="shrink-0 px-2 py-0.5 rounded bg-[var(--acc)]/50 hover:bg-[var(--acc)] text-[var(--ink)] font-bold text-micro font-sans transition whitespace-nowrap"
                                          title="Mover la canción a la posición sugerida"
                                        >
                                          ✓ Aplicar
                                        </button>
                                      );
                                    })()}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs ml-7">
                              <div>
                                <p className="text-[var(--ink-2)]">
                                  <ShowIcon inline emoji="🔍" />Problema:
                                </p>
                                <p className="text-[var(--ink-2)]">
                                  {sugg.issue}
                                </p>
                              </div>
                              <div>
                                <p className="text-[var(--ink-2)]">
                                  <ShowIcon inline emoji="💡" />Sugerencia:
                                </p>
                                <p className="text-[var(--ink-2)] font-medium">
                                  {sugg.suggestion}
                                </p>
                              </div>
                              <div>
                                <p className="text-[var(--ink-2)]">
                                  <ShowIcon inline emoji="⭐" />Impacto:
                                </p>
                                <p className="text-[var(--ink-2)]">
                                  {sugg.impact}
                                </p>
                              </div>
                              {sugg.songs_involved &&
                                sugg.songs_involved.length > 0 && (
                                  <div>
                                    <p className="text-[var(--ink-2)]">
                                      <ShowIcon inline emoji="🎵" />Canciones:
                                    </p>
                                    <p className="text-[var(--ink-2)]">
                                      {sugg.songs_involved.join(",")}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Areas for Improvement */}
                {analysis.areasForImprovement.length > 0 && (
                  <div className="bg-[var(--acc-soft)] rounded-[var(--r-s)] p-3">
                    <p className="text-xs font-medium text-[var(--acc)]/70 mb-1.5">
                      <ShowIcon inline emoji="🎯" />Áreas de Mejora
                    </p>
                    <ul className="space-y-1">
                      {analysis.areasForImprovement.map((area, idx) => (
                        <li key={idx} className="text-xs text-[var(--ink)]">
                          • {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Action Buttons — deliberadamente FUERA de analysisContentRef: no deben salir en la
 imagen/PDF exportado. */}
        {analysis && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handlePrintAnalysis}
                className="flex-1 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] px-3 py-2 rounded-[var(--r-s)] transition font-medium text-sm flex items-center justify-center gap-1.5"
                title="Exportar el análisis a PDF/impresión"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </button>
              <button
                onClick={handleDownloadImage}
                disabled={exportingImage}
                className="flex-1 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] px-3 py-2 rounded-[var(--r-s)] transition font-medium text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                title="Descargar el análisis completo como imagen PNG"
              >
                {exportingImage ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Imagen
              </button>
              <button
                onClick={handleShareAnalysis}
                disabled={sharing}
                className="flex-1 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] px-3 py-2 rounded-[var(--r-s)] transition font-medium text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                title="Compartir por WhatsApp u otra app"
              >
                {sharing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                Compartir
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                className="flex-1 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] px-4 py-2 rounded-[var(--r-s)] transition font-medium text-sm"
              >
                <ShowIcon inline emoji="🔄" />Re-analizar
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-[var(--surface)]/70 hover:bg-[var(--sunken)] text-[var(--ink)] px-4 py-2 rounded-[var(--r-s)] transition font-medium text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
