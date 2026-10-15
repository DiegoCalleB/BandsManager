/**
 * Barra de acciones masivas sobre las bandas seleccionadas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { BulkBandActionBar } from "../bands/BulkBandActionBar";
import { useBandCrm } from "./BandCrmContext";

/**
 * Barra de acciones masivas sobre las bandas seleccionadas.
 * @returns Sección de interfaz.
 */
export function BulkBandsBar() {
  const { selectedBandIds, filteredBands, handleSelectAllFilteredBands, handleDeselectAllBands, handleBulkBandStatusChange, handleBulkGenerateSwaps, handleBulkBandToggleFavorite, handleBulkBandExportCsv, handleBulkBandDelete } = useBandCrm();
  return (
    <>
      {/* 🎯 GMAIL-STYLE BULK ACTIONS BAR (STICKY AT TOP OF LIST) */}
      <BulkBandActionBar
        selectedCount={selectedBandIds.length}
        totalFilteredCount={filteredBands.length}
        isAllSelected={
          filteredBands.length > 0 &&
          selectedBandIds.length === filteredBands.length
        }
        onSelectAll={handleSelectAllFilteredBands}
        onDeselectAll={handleDeselectAllBands}
        onBulkStatusChange={handleBulkBandStatusChange}
        onBulkGeneratePitch={handleBulkGenerateSwaps}
        onBulkToggleFavorite={handleBulkBandToggleFavorite}
        onBulkExportCsv={handleBulkBandExportCsv}
        onBulkDelete={handleBulkBandDelete}
      />
    </>
  );
}
