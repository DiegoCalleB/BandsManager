/**
 * Barra superior: título del tema, selector de modo, accesos y datos pasivos.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Battery,BatteryCharging,BatteryWarning,Headphones,ListMusic,MoreVertical,WifiOff,X } from "lucide-react";
import { getIdeaTracks } from "../../utils/irisTracks";
import { Button } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { PerformanceMoreMenu } from "./PerformanceMoreMenu";
import { useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Barra superior: título del tema, selector de modo, accesos y datos pasivos.
 * @returns Sección de interfaz.
 */
export function PerformanceTopBar() {
  const { glareMode, isBlock, blockMeta, currentItem, currentSong, isOffline, setModeArchetype, modeArchetype, setShowSongListDrawer, songsWithIrisCount, irisStemIdea, handleLaunchPractice, setShowMoreMenu, showMoreMenu, onClose, currentIndex, allItems, batteryLevel, batteryCharging } = useSetlistPerformance();
  return (
    <>
      <div
  className={`shrink-0 px-3 sm:px-4 pt-2 pb-1.5 z-20 ${glareMode ? "bg-gradient-to-b from-white to-white/0" : "bg-gradient-to-b from-black to-[var(--sunken)]/0"}`}
      >
  <div className="flex items-center justify-between gap-2">
    <div className="min-w-0 flex items-center gap-2 flex-1">
      <span className="text-lg shrink-0">
      {isBlock ? blockMeta!.icon : "🎤"}
      </span>
      <h1
      className={`text-base sm:text-lg font-bold truncate ${glareMode ? "text-[var(--ink)]" : "text-[var(--acc)]/70"}`}
      >
      {isBlock
        ? currentItem.tituloCustom || blockMeta!.label
        : currentSong?.titulo}
      </h1>
      {isOffline && (
      <span
        className="shrink-0 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-mono font-bold bg-[var(--acc)]/20 text-[var(--ink)] flex items-center gap-1"
        title="Modo Escenario Offline Guard activo — Letras y acordes guardados localmente"
      >
        <WifiOff className="w-3 h-3 text-[var(--acc)]" />
        <span className="hidden sm:inline">Offline seguro</span>
      </span>
      )}
    </div>

    <div className="flex items-center gap-1.5 shrink-0 relative">
      {/* Toggle Directo / Ensayo */}
      <div
      className={`flex items-center rounded-[var(--r-s)] p-0.5 text-xs font-bold shrink-0 ${
        glareMode ? "bg-[var(--surface)]" : "bg-[var(--sunken)]"
      }`}
      >
      <button
        type="button"
        onClick={() => setModeArchetype("directo")}
        className={`px-2.5 py-1 rounded-[var(--r-pill)] transition-ui cursor-pointer ${
          modeArchetype === "directo"
            ? glareMode
              ? "bg-[var(--ink)] text-[var(--bg)]"
              : "bg-[var(--acc)] text-[var(--on-acc)]"
            : glareMode
              ? "text-[var(--ink-2)] hover:text-[var(--ink)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
        }`}
      >
        Directo
      </button>
      <button
        type="button"
        onClick={() => setModeArchetype("ensayo")}
        className={`px-2.5 py-1 rounded-[var(--r-pill)] transition-ui flex items-center gap-1 cursor-pointer ${
          modeArchetype === "ensayo"
            ? "bg-[var(--ok)] text-[var(--on-ok)]"
            : glareMode
              ? "text-[var(--ink-2)] hover:text-[var(--ok)]"
              : "text-[var(--ink-2)] hover:text-[var(--ok)]"
        }`}
      >
        <Headphones className="w-3 h-3" />
        <span>Ensayo</span>
      </button>
      </div>

      {/* Quick action: Repertorio completo & Pistas Iris drawer */}
      <button
      id="btn-stage-songlist-drawer"
      type="button"
      onClick={() => setShowSongListDrawer(true)}
      className={`px-2.5 py-1 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
        glareMode
          ? "bg-[var(--accent-alt)]/10 hover:bg-[var(--accent-alt)]/30 text-[var(--accent-alt)]"
          : "bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--ink)]"
      }`}
      title="Repertorio completo: ver todos los temas, estado de pistas Iris y accesos directos a Studio"
      >
      <ListMusic className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Pistas y repertorio</span>
      <span className="sm:hidden">Temas</span>
      {songsWithIrisCount > 0 && (
        <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro font-sans bg-[var(--ok)]/30 text-[var(--ink)]">
          {songsWithIrisCount}
        </span>
      )}
      </button>

      {/* Quick action: Ensayo con pistas Iris */}
      {!isBlock && currentSong && irisStemIdea && (
      <Button
        variant={glareMode ? "neutral" : "neutral"}
        size="xs"
        id="btn-stage-practice-mode"
        type="button"
        onClick={() => handleLaunchPractice()}
        className="items-center gap-1.5 shrink-0"
        title="Modo Ensayo: practica este tema con pistas separadas por Iris (silenciar/aislar pistas, tempo, bucle A/B)"
      >
        <Headphones className="w-3.5 h-3.5 text-[var(--ok)]" />
        <span className="hidden sm:inline">Ensayo Iris</span>
        <span className="sm:hidden">Ensayo</span>
      </Button>
      )}

      <button
      onClick={() => setShowMoreMenu((v) => !v)}
      className={`p-1.5 rounded-[var(--r-pill)] transition ${showMoreMenu ? (glareMode ? "bg-[var(--sunken)]" : "bg-[var(--ink)]/15") : glareMode ? "hover:bg-[var(--sunken)] text-[var(--ink-2)]" : "hover:bg-[var(--ink)]/10 text-[var(--ink-2)]"}`}
      title="Más opciones"
      >
      <MoreVertical className="w-5 h-5" />
      </button>

      <button
      onClick={onClose}
      className={`p-1.5 rounded-[var(--r-pill)] transition ${glareMode ? "hover:bg-[var(--sunken)] text-[var(--ink)]" : "hover:bg-[var(--ink)]/10 text-[var(--ink)]"}`}
      title="Cerrar (ESC)"
      >
      <X className="w-5 h-5" />
      </button>

      <PerformanceMoreMenu />
    </div>
  </div>

  {/* Segunda línea: datos pasivos que no compiten con el título — posición en el
 repertorio, batería (si el navegador la soporta) y si hace falta revisar los
 acordes de este tema. */}
  <div className="flex items-center gap-2 mt-1 pl-7 text-xs font-sans flex-wrap">
    <span
      className={
      glareMode ? "text-[var(--ink-2)]" : "text-[var(--ink-2)]"
      }
    >
      {currentIndex + 1}/{allItems.length}
    </span>

    {batteryLevel !== null && (
      <span
      className={`flex items-center gap-1 ${
        batteryCharging
          ? "text-[var(--ok)]"
          : batteryLevel < 0.2
            ? "text-[var(--alert)] font-bold"
            : glareMode
              ? "text-[var(--ink-2)]"
              : "text-[var(--ink-2)]"
      }`}
      title={
        batteryCharging
          ? "Cargando"
          : batteryLevel < 0.2
            ? "Batería baja — busca un cargador"
            : "Batería"
      }
      >
      {batteryCharging ? (
        <BatteryCharging className="w-3 h-3" />
      ) : batteryLevel < 0.2 ? (
        <BatteryWarning className="w-3 h-3" />
      ) : (
        <Battery className="w-3 h-3" />
      )}
      {Math.round(batteryLevel * 100)}%
      </span>
    )}

    {!isBlock && irisStemIdea && (
      <Button
      variant={glareMode ? "neutral" : "neutral"}
      size="xs"
      type="button"
      onClick={() => handleLaunchPractice()}
      className="items-center gap-1"
      title="Pistas separadas por Iris disponibles. Clic para abrir el Modo Ensayo"
      >
      <Headphones className="w-2.5 h-2.5 text-[var(--ok)]" />
      <span>Pistas Iris ({getIdeaTracks(irisStemIdea).length})</span>
      </Button>
    )}

    {!isBlock &&
      currentSong?.estructuraDocumentoUrl &&
      !currentSong?.estructuraVerificada && (
      <span
        className="font-bold px-1.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--ink)]"
        title="Los acordes de este tema vienen de una subida sin verificar todavía por nadie de la banda"
      >
        <ShowIcon inline emoji="⚠️" />sin verificar
      </span>
      )}
  </div>
      </div>
    </>
  );
}
