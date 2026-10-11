/**
 * Cabecera del CRM de bandas: título, sub-pestañas y acciones rápidas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { FileSpreadsheet, Music, Plus, RefreshCw, Repeat, Sparkles, Users } from "lucide-react";
import { ActionMenu, Button } from "../ui";
import { useBandCrm } from "./BandCrmContext";

/**
 * Cabecera del CRM de bandas: título, sub-pestañas y acciones rápidas.
 * @returns Sección de interfaz.
 */
export function BandCrmHeader() {
  const { colors, totalBands, registeredBands, subTab, setSubTab, fetchRegisteredBands, bands, setSelectedPitchBand, setIsPitchModalOpen, setIsScoutModalOpen, actualizarMetricas, actualizandoMetricas, setIsSpotifySweepOpen, handleOpenCreateModal } = useBandCrm();
  return (
    <>
      {/* 1. HEADER COMPACTO Y CONTROLES */}
      <div
      className={`p-3 sm:p-3.5 rounded-[var(--r-m)] transition-ui ${colors.card} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}
      >
      {/* Izquierda: Título y sub-pestañas */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-[var(--ink)] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[var(--acc)]" />
            <span>Grupos</span>
          </h2>
          <span className="text-xs font-sans text-[var(--ink-2)] bg-[var(--surface)] px-2 py-0.5 rounded-[var(--r-pill)]">
            {totalBands}
          </span>
        </div>

        <div className="h-4 w-px bg-[var(--surface)]/80 hidden sm:block" />

        {/* Sub-tabs segmentadas: solo si hay algo a lo que cambiar */}
        <div className={`items-center gap-1 bg-[var(--surface)]/80 p-0.5 rounded-[var(--r-s)] ${registeredBands.length > 0 ? 'flex' : 'hidden'}`}>
          <Button
            variant={subTab === "co_booking" ? "selected" : "ghost"}
            size="xs"
            type="button"
            onClick={() => setSubTab("co_booking")}
            className="items-center gap-1.5"
          >
            <span>Bandas Amigas</span>
          </Button>

          {registeredBands.length > 0 && (
            <Button
              variant={subTab === "registered_bands" ? "selected" : "ghost"}
              size="xs"
              type="button"
              onClick={() => {
                setSubTab("registered_bands");
                fetchRegisteredBands();
              }}
              className="items-center gap-1.5"
            >
              <span>Registro</span>
              <span className="text-micro px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--ok)]/30 text-[var(--ink)] font-bold">
                {registeredBands.length}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Derecha: Acciones rápidas en una sola fila */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button
          variant="neutral"
          size="xs"
          id="band-btn-[#date-swap-pitch]"
          type="button"
          onClick={() => {
            if (bands.length > 0) {
              setSelectedPitchBand(bands[0]);
              setIsPitchModalOpen(true);
            } else {
              alert(
                "Añade primero una banda para generar un pitch de intercambio.",
              );
            }
          }}
          className="items-center gap-1.5 max-sm:hidden"
          title="Generar pitch de intercambio de fechas (date swap)"
        >
          <Repeat className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
          <span>Date Swap</span>
        </Button>

        <Button
          variant="neutral"
          size="xs"
          type="button"
          onClick={() => setIsScoutModalOpen(true)}
          className="items-center gap-1.5 max-sm:hidden"
          title="Scout IA: Buscar bandas para co-booking"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
          <span>Scout IA</span>
        </Button>

        <Button
          variant="neutral"
          size="xs"
          type="button"
          onClick={actualizarMetricas}
          disabled={actualizandoMetricas}
          className="items-center gap-1.5 max-sm:hidden"
          title="Actualizar seguidores y suscriptores de todas las bandas (se hace solo cada mes)"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0 ${actualizandoMetricas ? "animate-spin" : ""}`} />
          <span>{actualizandoMetricas ? "Actualizando…" : "Métricas"}</span>
        </Button>

        <Button
          variant="neutral"
          size="xs"
          type="button"
          onClick={() => setIsSpotifySweepOpen(true)}
          className="items-center gap-1.5 max-sm:hidden"
          title="Buscar el Spotify de todas las bandas y revisar antes de guardar"
        >
          <Music className="w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0" />
          <span>Spotify</span>
        </Button>

        <Button
          variant="primary"
          size="xs"
          id="band-btn-add-new"
          type="button"
          onClick={handleOpenCreateModal}
          className="items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Nueva banda</span>
        </Button>

        <a
          href="/api/export-excel"
          download="band_data.xlsx"
          className="max-sm:hidden px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-medium bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-ui flex items-center gap-1.5 active:scale-[0.97] cursor-pointer"
          title="Exportar Excel completo (.xlsx)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--ok)]" />
          <span className="hidden sm:inline">Excel</span>
        </a>
        <ActionMenu
          className="sm:hidden"
          label="Más acciones de grupos"
          items={[
            { label: "Date Swap", icon: Repeat, onSelect: () => { if (bands.length > 0) { setSelectedPitchBand(bands[0]); setIsPitchModalOpen(true); } else { alert("Añade primero una banda para generar un pitch de intercambio."); } } },
            { label: "Scout IA", icon: Sparkles, onSelect: () => setIsScoutModalOpen(true) },
            { label: "Exportar Excel", icon: FileSpreadsheet, onSelect: () => { const a = document.createElement("a"); a.href = "/api/export-excel"; a.download = "band_data.xlsx"; a.click(); } },
          ]}
        />
      </div>
      </div>
    </>
  );
}
