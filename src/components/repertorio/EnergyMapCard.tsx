import React from "react";
import { Button, IconButton } from "../ui";
import { PopoverAncla } from "../ui/PopoverAncla";
import { EnergyChart, EnergyChartPoint } from "./EnergyChart";
import { ShowIcon } from "../ui/ShowIcon";
import { SugerenciaChapa } from "../../utils/setlistCompatibility";
import { getEnergyInfo } from "../../utils/energyPacingUtils";
import {
  TrendingUp,
  Undo2,
  Wand2,
  MessageCircle,
  Sliders,
  Eye,
  EyeOff,
  Pause,
  Play,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
} from "lucide-react";

export interface EnergyMapCardProps {
  setlistKey: string;
  energyAnalysis: {
    points: any[];
    warnings: any[];
    profileLabel: string;
  };
  chartData: EnergyChartPoint[];
  yDomain: [number, number];
  zonasEnergia: any[];
  canUndoReorder: boolean;
  undoLastReorder: () => void;
  showEnergyMap: boolean;
  setShowEnergyMap: React.Dispatch<React.SetStateAction<boolean>>;
  optimizeSetlistTransitions: () => void;
  suggestChapaSpot: () => void;
  showChartSettingsMenu: boolean;
  setShowChartSettingsMenu: React.Dispatch<React.SetStateAction<boolean>>;
  showIdealCurve: boolean;
  setShowIdealCurve: React.Dispatch<React.SetStateAction<boolean>>;
  showBpmLine: boolean;
  setShowBpmLine: React.Dispatch<React.SetStateAction<boolean>>;
  showTonalidad: boolean;
  setShowTonalidad: React.Dispatch<React.SetStateAction<boolean>>;
  chartZoom: boolean;
  setChartZoom: React.Dispatch<React.SetStateAction<boolean>>;
  showTransitionBadges: boolean;
  setShowTransitionBadges: React.Dispatch<React.SetStateAction<boolean>>;
  showConcertPlayer: boolean;
  setShowConcertPlayer: React.Dispatch<React.SetStateAction<boolean>>;
  optimizeSummary: string | null;
  chapaSuggestion: SugerenciaChapa | null;
  setChapaSuggestion: (val: SugerenciaChapa | null) => void;
  insertSuggestedChapa: () => void;
  highlightedSongIds: string[];
  setHighlightedSongIds: (ids: string[]) => void;
  selectedSetlistItemId: string | null;
  setSelectedSetlistItemId: (id: string | null) => void;
  playerCurrentSongId?: string;
  handleOpenTransitionPreview: (idxA: number, idxB: number) => void;
  reorderSetlistItems: (fromIndex: number, toIndex: number, sourceKey?: string) => void;
  handleEnergyChartDrag: (point: EnergyChartPoint, newScore: number) => void;
  showHeuristicWarnings: boolean;
  setShowHeuristicWarnings: React.Dispatch<React.SetStateAction<boolean>>;
  aiAnalysisResult: any | null;
  setShowAIAnalysisModal: (val: boolean) => void;
  titlesMatch: (title: string, list: string[]) => boolean;
}

export const EnergyMapCard: React.FC<EnergyMapCardProps> = ({
  setlistKey,
  energyAnalysis,
  chartData,
  yDomain,
  zonasEnergia,
  canUndoReorder,
  undoLastReorder,
  showEnergyMap,
  setShowEnergyMap,
  optimizeSetlistTransitions,
  suggestChapaSpot,
  showChartSettingsMenu,
  setShowChartSettingsMenu,
  showIdealCurve,
  setShowIdealCurve,
  showBpmLine,
  setShowBpmLine,
  showTonalidad,
  setShowTonalidad,
  chartZoom,
  setChartZoom,
  showTransitionBadges,
  setShowTransitionBadges,
  showConcertPlayer,
  setShowConcertPlayer,
  optimizeSummary,
  chapaSuggestion,
  setChapaSuggestion,
  insertSuggestedChapa,
  highlightedSongIds,
  setHighlightedSongIds,
  selectedSetlistItemId,
  setSelectedSetlistItemId,
  playerCurrentSongId,
  handleOpenTransitionPreview,
  reorderSetlistItems,
  handleEnergyChartDrag,
  showHeuristicWarnings,
  setShowHeuristicWarnings,
  aiAnalysisResult,
  setShowAIAnalysisModal,
  titlesMatch,
}) => {
  return (
    <div className="p-3 sm:p-4 rounded-[var(--r-l)] space-y-2.5 animate-fadeIn bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-2 text-xs text-[var(--ink-2)]">
        <span
          className="font-semibold text-[var(--ink-2)] truncate text-xs"
          title="Arrastra un punto en horizontal para reordenar el setlist, o en vertical para cambiar su energía. También puedes seleccionarlo y usar las flechas."
        >
          <TrendingUp className="mr-1.5 inline size-4 align-[-3px]" aria-hidden="true" />
          Mapa de energía
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {canUndoReorder && (
            <Button
              variant="neutral"
              size="sm"
              onClick={undoLastReorder}
              title="Deshacer el último reordenamiento del setlist"
              aria-label="Deshacer"
            >
              <Undo2 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Deshacer</span>
            </Button>
          )}
          {showEnergyMap && (
            <Button
              variant="neutral"
              size="sm"
              onClick={optimizeSetlistTransitions}
              title="Reordena las canciones (nunca las chapas/bloques) para suavizar los saltos de tonalidad, tempo y energía entre temas consecutivos — sin tocar tu canción de apertura"
              aria-label="Optimizar orden"
            >
              <Wand2 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Optimizar orden</span>
            </Button>
          )}
          {showEnergyMap && (
            <Button
              variant="neutral"
              size="sm"
              onClick={suggestChapaSpot}
              title="Busca la transición entre canciones que más chirría (tonalidad, tempo, energía) — ahí es donde una chapa/interludio hablado se nota menos"
              aria-label="¿Dónde chapa?"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">¿Dónde chapa?</span>
            </Button>
          )}
          {showEnergyMap && (
            <div className="relative">
              <IconButton
                label="Ajustes del gráfico (leyenda de colores, curva ideal)"
                size="icon-xs"
                type="button"
                onClick={() => setShowChartSettingsMenu((v) => !v)}
              >
                <Sliders className="w-3.5 h-3.5" />
              </IconButton>
              {showChartSettingsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowChartSettingsMenu(false)}
                  />
                  <PopoverAncla className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-[var(--r-m)] bg-[var(--sunken)] p-2.5 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setShowIdealCurve((v) => !v)}
                      className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                        showIdealCurve
                          ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                          : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                      }`}
                      title="Curva ideal de referencia: un arco de pacing clásico escalado al rango real de energías de tu repertorio"
                    >
                      <span>
                        <ShowIcon inline emoji="〰️" />Curva ideal
                      </span>
                      <span>{showIdealCurve ? "ON" : "OFF"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBpmLine((v) => !v)}
                      className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                        showBpmLine
                          ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                          : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                      }`}
                      title="Línea de BPM en un eje secundario — apagada por defecto para no saturar el gráfico en pantallas estrechas"
                    >
                      <span>
                        <ShowIcon inline emoji="🥁" />Línea de BPM
                      </span>
                      <span>{showBpmLine ? "ON" : "OFF"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTonalidad((v) => !v)}
                      className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                        showTonalidad
                          ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                          : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                      }`}
                      title="Tonalidad de cada canción junto a su punto — con muchos temas seguidos, usa el zoom (🔍) para separarlos y leerlos bien"
                    >
                      <span>
                        <ShowIcon inline emoji="🎼" />Tonalidad
                      </span>
                      <span>{showTonalidad ? "ON" : "OFF"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartZoom((v) => !v)}
                      className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                        chartZoom
                          ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                          : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                      }`}
                      title="Ensancha el gráfico y añade scroll horizontal — más espacio entre puntos para leer tonalidad/BPM por tramos"
                    >
                      <span>
                        <ShowIcon inline emoji="🔍" />Zoom (más espacio)
                      </span>
                      <span>{chartZoom ? "ON" : "OFF"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTransitionBadges((v) => !v)}
                      className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                        showTransitionBadges
                          ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                          : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                      }`}
                      title="Muestra u oculta los ticks (✓) y aspas (✕) de calidad de unión entre temas en el gráfico"
                    >
                      <span>✓ / ✕ Calidad de uniones</span>
                      <span>{showTransitionBadges ? "ON" : "OFF"}</span>
                    </button>
                    <div className="flex flex-col gap-1 text-micro text-[var(--ink)] pt-1">
                      <span className="flex items-center gap-1.5">
                        <i
                          className="w-2 h-2 rounded-[var(--r-pill)] inline-block"
                          style={{ background: "#0284c7" }}
                        />
                        <ShowIcon inline emoji="🌙" />Balada
                      </span>
                      <span className="flex items-center gap-1.5">
                        <i
                          className="w-2 h-2 rounded-[var(--r-pill)] inline-block"
                          style={{ background: "#059669" }}
                        />
                        <ShowIcon inline emoji="🎵" />Media
                      </span>
                      <span className="flex items-center gap-1.5">
                        <i
                          className="w-2 h-2 rounded-[var(--r-pill)] inline-block"
                          style={{ background: "#a16207" }}
                        />
                        <ShowIcon inline emoji="🔥" />Alta
                      </span>
                      <span className="flex items-center gap-1.5">
                        <i
                          className="w-2 h-2 rounded-[var(--r-pill)] inline-block"
                          style={{ background: "#a21caf" }}
                        />
                        <ShowIcon inline emoji="💣" />Explosiva
                      </span>
                    </div>
                  </PopoverAncla>
                </>
              )}
            </div>
          )}
          {showEnergyMap && (
            <button
              type="button"
              onClick={() => setShowTonalidad((v) => !v)}
              className={`p-1 rounded-[var(--r-pill)] transition-ui cursor-pointer ${
                showTonalidad
                  ? "bg-[var(--acc)]/20 text-[var(--ink)]"
                  : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
              title={
                showTonalidad
                  ? "Ocultar tonalidades del gráfico"
                  : "Mostrar tonalidades en el gráfico"
              }
            >
              <ShowIcon inline emoji="🎼" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowEnergyMap((v) => !v)}
            className="p-1 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] hover:text-[var(--ink)] transition-ui cursor-pointer"
            title={
              showEnergyMap
                ? "Ocultar el mapa de energía"
                : "Mostrar el mapa de energía"
            }
          >
            {showEnergyMap ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowConcertPlayer((v) => !v)}
            className="p-1 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] hover:text-[var(--ink)] transition-ui cursor-pointer"
            title={
              showConcertPlayer
                ? "Ocultar reproductor de concierto"
                : "Mostrar reproductor de concierto"
            }
          >
            {showConcertPlayer ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {showEnergyMap && (
        <>
          <p className="flex items-start gap-1.5 text-xs text-[var(--ink-2)]">
            <Lightbulb className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Toca un punto para reordenar o cambiar su energía. La energía es de la
              canción: se aplica en todos tus repertorios.
            </span>
          </p>
          {optimizeSummary && (
            <p className="text-micro font-sans text-[var(--ink-2)] bg-[var(--ok-soft)] rounded-[var(--r-s)] px-2 py-1">
              {optimizeSummary}
            </p>
          )}
          {chapaSuggestion &&
            (() => {
              const motivos: string[] = [];
              if (chapaSuggestion.coste.harmonyRelation === "choque")
                motivos.push("choque de tonalidad");
              if (
                chapaSuggestion.coste.bpmDiff != null &&
                chapaSuggestion.coste.bpmDiff >= 15
              )
                motivos.push(
                  `salto de ${Math.round(chapaSuggestion.coste.bpmDiff)} BPM`,
                );
              if (
                chapaSuggestion.coste.energyDiff != null &&
                chapaSuggestion.coste.energyDiff >= 6
              )
                motivos.push("salto grande de energía");
              return (
                <div className="flex flex-wrap items-center gap-2 text-micro font-sans text-[var(--ink-2)] bg-[var(--ok)]/10 rounded-[var(--r-s)] px-2 py-1">
                  <span>
                    <ShowIcon inline emoji="💬" />Mejor sitio para una chapa: entre{" "}
                    <b>"{chapaSuggestion.cancionAntes}"</b> y{" "}
                    <b>"{chapaSuggestion.cancionDespues}"</b>
                    {motivos.length > 0 ? ` — ${motivos.join(", ")}.` : "."}
                  </span>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={insertSuggestedChapa}
                    className="shrink-0"
                  >
                    <ShowIcon inline emoji="➕" />Insertar aquí
                  </Button>
                  <button
                    type="button"
                    onClick={() => setChapaSuggestion(null)}
                    className="text-[var(--ink-2)] hover:text-[var(--ok)] transition-ui cursor-pointer shrink-0"
                    title="Descartar sugerencia"
                  >
                    ✕
                  </button>
                </div>
              );
            })()}

          {/* Advanced Energy Chart */}
          <div className={chartZoom ? "overflow-x-auto -mx-1 px-1" : undefined}>
            <EnergyChart
              setlistKey={setlistKey}
              chartData={chartData}
              yDomain={yDomain}
              zonasEnergia={zonasEnergia}
              highlightedSongIds={highlightedSongIds}
              selectedSetlistItemId={selectedSetlistItemId}
              showTransitionBadges={showTransitionBadges}
              currentPlayingSongId={playerCurrentSongId}
              onSelectItem={(id) => {
                setSelectedSetlistItemId(id);
              }}
              onPreviewTransition={(selIdx) => {
                if (selIdx > 0) handleOpenTransitionPreview(selIdx - 1, selIdx);
              }}
              onReorder={reorderSetlistItems}
              onEnergyChange={handleEnergyChartDrag}
              height={256}
              showIdealCurve={showIdealCurve}
              showBpmLine={showBpmLine}
              showTonalidad={showTonalidad}
              expandedWidthPx={
                chartZoom ? Math.max(700, chartData.length * 60) : undefined
              }
              belowChartSlot={
                selectedSetlistItemId &&
                (() => {
                  const selectedIndex = chartData.findIndex(
                    (d) => d.id === selectedSetlistItemId,
                  );
                  if (selectedIndex === -1) return null;
                  const point = chartData[selectedIndex];
                  const canEditEnergy =
                    point.songId != null && typeof point.score === "number";
                  const info = canEditEnergy
                    ? getEnergyInfo(point.score as number)
                    : null;
                  const bumpEnergy = (delta: number) => {
                    if (!canEditEnergy || typeof point.score !== "number")
                      return;
                    const next = Math.max(
                      1,
                      Math.min(20, point.score + delta),
                    );
                    if (next !== point.score) handleEnergyChartDrag(point, next);
                  };
                  const dirBtnClass =
                    "w-8 h-8 rounded-[var(--r-pill)] flex items-center justify-center transition disabled:opacity-25 disabled:cursor-not-allowed shrink-0";
                  const reorderBtnClass = `${dirBtnClass} bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc-ink)] `;
                  const energyBtnStyle = info
                    ? {
                        color: info.hexColor,
                        borderColor: `${info.hexColor}55`,
                        background: "var(--sunken)",
                      }
                    : undefined;
                  const prevName =
                    selectedIndex > 0 ? chartData[selectedIndex - 1]?.name : null;
                  const nextName =
                    selectedIndex < chartData.length - 1
                      ? chartData[selectedIndex + 1]?.name
                      : null;
                  const hasPrevSong =
                    selectedIndex > 0 &&
                    chartData[selectedIndex - 1]?.songId &&
                    point.songId;
                  const hasNextSong =
                    selectedIndex < chartData.length - 1 &&
                    chartData[selectedIndex + 1]?.songId &&
                    point.songId;

                  return (
                    <div className="w-full flex flex-col items-center gap-1.5 pt-1.5 pb-0.5">
                      {canEditEnergy && (
                        <button
                          type="button"
                          disabled={(point.score as number) >= 20}
                          onClick={() => bumpEnergy(1)}
                          className={`${dirBtnClass} hover:brightness-125`}
                          style={energyBtnStyle}
                          title="Subir energía"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      )}
                      <div className="w-full flex items-center justify-center gap-2">
                        <span className="w-20 sm:w-28 line-clamp-3 text-micro text-[var(--ink-2)] font-sans text-right leading-tight">
                          {prevName || ""}
                        </span>
                        <button
                          type="button"
                          disabled={selectedIndex <= 0}
                          onClick={() =>
                            reorderSetlistItems(
                              selectedIndex,
                              selectedIndex - 1,
                              "stepper",
                            )
                          }
                          className={reorderBtnClass}
                          title={
                            prevName
                              ? `Mover antes de "${prevName}"`
                              : "Mover una posición hacia atrás"
                          }
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div
                          className="w-9 h-9 rounded-[var(--r-pill)] flex items-center justify-center text-xs font-bold shrink-0"
                          style={
                            info
                              ? {
                                  background: `${info.hexColor}25`,
                                  color: info.hexColor,
                                  borderColor: `${info.hexColor}55`,
                                }
                              : {
                                  background: "var(--surface)",
                                  color: "var(--ink-2)",
                                }
                          }
                          title={
                            info
                              ? `Energía: ${point.score}/20 (${info.label})`
                              : "Sin energía asignada"
                          }
                        >
                          {typeof point.score === "number" ? point.score : "—"}
                        </div>
                        <button
                          type="button"
                          disabled={selectedIndex >= chartData.length - 1}
                          onClick={() =>
                            reorderSetlistItems(
                              selectedIndex,
                              selectedIndex + 1,
                              "stepper",
                            )
                          }
                          className={reorderBtnClass}
                          title={
                            nextName
                              ? `Mover después de "${nextName}"`
                              : "Mover una posición hacia adelante"
                          }
                        >
                          <ChevronDown className="w-4 h-4 -rotate-90" />
                        </button>
                        <span className="w-20 sm:w-28 line-clamp-3 text-micro text-[var(--ink-2)] font-sans text-left leading-tight">
                          {nextName || ""}
                        </span>
                      </div>
                      {canEditEnergy && (
                        <button
                          type="button"
                          disabled={(point.score as number) <= 1}
                          onClick={() => bumpEnergy(-1)}
                          className={`${dirBtnClass} hover:brightness-125`}
                          style={energyBtnStyle}
                          title="Bajar energía"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      )}

                      {/* Botones de acción para probar transiciones de audio con tema anterior o siguiente */}
                      {(hasPrevSong || hasNextSong) &&
                        (() => {
                          const evalPrev = point.transitionFromPrev;
                          const evalNext = point.transitionToNext;
                          return (
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
                              {hasPrevSong && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenTransitionPreview(
                                      selectedIndex - 1,
                                      selectedIndex,
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-2 transition-ui cursor-pointer active:scale-[0.97] ${
                                    evalPrev?.status === "ok"
                                      ? "bg-[var(--ok)]/15 hover:bg-[var(--ok)]/25 text-[var(--ink)] hover:text-[var(--ink)]"
                                      : "bg-[var(--alert)]/15 hover:bg-[var(--alert)]/25 text-[var(--ink)] hover:text-[var(--ink)]"
                                  }`}
                                  title={
                                    evalPrev
                                      ? `${evalPrev.title}: ${evalPrev.motivos.join(", ")}`
                                      : `Comprobar cómo suena la unión de "${prevName}" con "${point.name}"`
                                  }
                                >
                                  <span
                                    className={`w-4 h-4 rounded-[var(--r-pill)] flex items-center justify-center text-micro font-bold shrink-0 ${
                                      evalPrev?.status === "ok"
                                        ? "bg-[var(--ok)]/30 text-[var(--ink)]"
                                        : "bg-[var(--alert)]/30 text-[var(--ink)]"
                                    }`}
                                  >
                                    {evalPrev ? evalPrev.icon : "⚡"}
                                  </span>
                                  <div className="flex flex-col text-left leading-none">
                                    <div className="flex items-center gap-1">
                                      <span>
                                        Unión con #{selectedIndex} ({prevName})
                                      </span>
                                      {evalPrev && (
                                        <span className="text-micro font-sans opacity-80">
                                          ({evalPrev.scorePercent}%)
                                        </span>
                                      )}
                                    </div>
                                    {evalPrev && evalPrev.motivos.length > 0 && (
                                      <span className="text-micro font-normal opacity-75 mt-0.5 max-w-[200px] truncate">
                                        {evalPrev.motivos[0]}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              )}
                              {hasNextSong && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenTransitionPreview(
                                      selectedIndex,
                                      selectedIndex + 1,
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-2 transition-ui cursor-pointer active:scale-[0.97] ${
                                    evalNext?.status === "ok"
                                      ? "bg-[var(--ok)]/15 hover:bg-[var(--ok)]/25 text-[var(--ink)] hover:text-[var(--ink)]"
                                      : "bg-[var(--alert)]/15 hover:bg-[var(--alert)]/25 text-[var(--ink)] hover:text-[var(--ink)]"
                                  }`}
                                  title={
                                    evalNext
                                      ? `${evalNext.title}: ${evalNext.motivos.join(", ")}`
                                      : `Comprobar cómo suena la unión de "${point.name}" con "${nextName}"`
                                  }
                                >
                                  <span
                                    className={`w-4 h-4 rounded-[var(--r-pill)] flex items-center justify-center text-micro font-bold shrink-0 ${
                                      evalNext?.status === "ok"
                                        ? "bg-[var(--ok)]/30 text-[var(--ink)]"
                                        : "bg-[var(--alert)]/30 text-[var(--ink)]"
                                    }`}
                                  >
                                    {evalNext ? evalNext.icon : "⚡"}
                                  </span>
                                  <div className="flex flex-col text-left leading-none">
                                    <div className="flex items-center gap-1">
                                      <span>
                                        Unión con #{selectedIndex + 2} ({nextName})
                                      </span>
                                      {evalNext && (
                                        <span className="text-micro font-sans opacity-80">
                                          ({evalNext.scorePercent}%)
                                        </span>
                                      )}
                                    </div>
                                    {evalNext && evalNext.motivos.length > 0 && (
                                      <span className="text-micro font-normal opacity-75 mt-0.5 max-w-[200px] truncate">
                                        {evalNext.motivos[0]}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  );
                })()
              }
            />
          </div>

          {/* Avisos y sugerencias */}
          {(energyAnalysis.warnings.length > 0 ||
            (aiAnalysisResult?.suggestions?.length ?? 0) > 0) && (
            <button
              type="button"
              onClick={() => setShowHeuristicWarnings((v) => !v)}
              className="w-full flex items-center justify-between px-2 py-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/80 text-[var(--ink)] text-micro font-sans transition-ui cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-[var(--ink-2)]" aria-hidden="true" />
                Avisos y sugerencias (
                {energyAnalysis.warnings.length +
                  (aiAnalysisResult?.suggestions?.length ?? 0)}
                )
              </span>
              <ChevronDown
                className={`size-4 transition-transform ${
                  showHeuristicWarnings ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          )}

          {/* Warnings & Suggestions (Heuristic) */}
          {showHeuristicWarnings && energyAnalysis.warnings.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {energyAnalysis.warnings.map((w, i) => {
                const hasSongs = !!w.songTitles && w.songTitles.length > 0;
                const isHighlighted =
                  hasSongs &&
                  highlightedSongIds.length > 0 &&
                  w.songTitles!.some((t) => titlesMatch(t, highlightedSongIds));
                return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded text-micro font-sans font-medium flex items-center gap-1 transition ${
                      w.type === "warning"
                        ? "bg-[var(--acc)]/10 text-[var(--ink)] "
                        : w.type === "success"
                          ? "bg-[var(--ok)]/10 text-[var(--ink-2)]"
                          : "bg-[var(--acc)]/10 text-[var(--ink-2)]"
                    } ${isHighlighted ? "ring-2 ring-[var(--ink)]/60" : ""}`}
                    style={{
                      cursor: hasSongs ? "pointer" : "default",
                    }}
                    onMouseEnter={() => {
                      if (hasSongs) setHighlightedSongIds(w.songTitles!);
                    }}
                    onMouseLeave={() => setHighlightedSongIds([])}
                    onClick={() => {
                      if (hasSongs)
                        setHighlightedSongIds(
                          isHighlighted ? [] : w.songTitles!,
                        );
                    }}
                    title={
                      hasSongs ? `Resalta: ${w.songTitles!.join(", ")}` : undefined
                    }
                  >
                    <span>
                      <ShowIcon inline emoji={w.icon} />
                    </span>
                    <span>{w.message}</span>
                    {w.suggestedReorder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderSetlistItems(
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

          {/* AI Analysis Summary (if available) */}
          {showHeuristicWarnings && aiAnalysisResult && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ok)]/80">
                  <ShowIcon inline emoji="🧠" />Análisis IA: {aiAnalysisResult.overallScore}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAIAnalysisModal(true)}
                  className="px-2 py-0.5 rounded text-micro bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--on-acc)] transition font-medium"
                >
                  Ver análisis completo
                </button>
              </div>
              {aiAnalysisResult.suggestions?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {aiAnalysisResult.suggestions.map((s: any, i: number) => {
                    const songsToHighlight: string[] =
                      s.songs_involved && s.songs_involved.length > 0
                        ? s.songs_involved
                        : [];
                    const hasSongs = songsToHighlight.length > 0;
                    const isHighlighted =
                      hasSongs &&
                      highlightedSongIds.length > 0 &&
                      songsToHighlight.some((songTitle: string) =>
                        titlesMatch(songTitle, highlightedSongIds),
                      );
                    return (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-micro font-sans font-medium flex items-center gap-1 transition"
                        style={{
                          backgroundColor: isHighlighted
                            ? "rgb(168 85 247 / 0.4)"
                            : "rgb(126 34 206 / 0.3)",
                          borderColor: isHighlighted
                            ? "rgb(168 85 247 / 0.8)"
                            : "rgb(147 51 234 / 0.4)",
                          color: "rgb(196 181 253)",
                          cursor: hasSongs ? "pointer" : "default",
                        }}
                        onMouseEnter={() => {
                          if (hasSongs) setHighlightedSongIds(songsToHighlight);
                        }}
                        onMouseLeave={() => setHighlightedSongIds([])}
                        onClick={() => {
                          if (hasSongs)
                            setHighlightedSongIds(
                              isHighlighted ? [] : songsToHighlight,
                            );
                        }}
                        title={
                          hasSongs
                            ? `Resalta: ${songsToHighlight.join(", ")}`
                            : s.title
                        }
                      >
                        <span>
                          {s.priority === "high" && "🔴"}
                          {s.priority === "medium" && "🟠"}
                          {s.priority === "low" && "🟡"}
                        </span>
                        <span>{s.title}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
