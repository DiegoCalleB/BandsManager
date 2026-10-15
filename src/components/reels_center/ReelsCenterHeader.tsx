/**
 * Cabecera del Centro de Reels: título, tono de voz y sincronización.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "../ui";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Cabecera del Centro de Reels: título, tono de voz y sincronización.
 * @returns Sección de interfaz.
 */
export function ReelsCenterHeader() {
  const { handleOpenToneModal, instagramHandle, nombreBanda, handleSyncReels, isSyncingReels } = useReelsCenter();
  return (
    <>
      {/* Header con Sincronización en Excel */}
      <div
      className={`flex justify-between items-start md:items-center pb-4 mb-2 gap-4 `}
      >
      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-2">
      <h1 className="page-title mb-1">
        Medios
      </h1>
      <p className="text-sm font-sans text-[var(--ink-2)]">
        Analítica social y prensa
      </p>
      </div>
      <div className="flex gap-2.5 items-center flex-wrap">
      <Button
        variant="neutral"
        size="xs"
        onClick={handleOpenToneModal}
        className="items-center gap-1.5"
        title={`Ver el tono de voz guardado de ${instagramHandle || nombreBanda}, o analizarlo si todavía no existe`}
      >
        <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
        <span>Tono de voz en redes</span>
      </Button>

      <button
        id="sync-reels-excel-btn"
        onClick={handleSyncReels}
        disabled={isSyncingReels}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold transition-ui cursor-pointer active:scale-[0.97] ${
          isSyncingReels
            ? "bg-[var(--surface)]/80 text-[var(--ink-2)]"
            : "bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--ink)] "
        }`}
        title="Sincronizar todas las publicaciones de redes sociales"
      >
        <RefreshCw
          className={`w-3 h-3 ${isSyncingReels ? "animate-spin" : ""}`}
        />
        {isSyncingReels ? "Sincronizando..." : "Actualizar en Excel"}
      </button>

      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--ok)]/10 text-[var(--ok)]`}
      >
        <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--ok)] shrink-0" />{" "}
        Auto-sync
      </span>
      </div>
      </div>
    </>
  );
}
