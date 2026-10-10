/**
 * Reordenar bandas con botones y arrastrando.
 * Extraído de BandSwitcherModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { cleanBandId } from "../../../utils/bandUtils";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandReorderParams {
  uniqueBands: { band_id: string; bandName: string; role?: string; logoUrl?: string; plan?: string; }[];
  saveOrder: (newOrder: string[]) => Promise<void>;
}

/**
 * Reordenar bandas con botones y arrastrando.
 * @param params Estado y callbacks del contenedor ({@link BandReorderParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandReorder({ uniqueBands, saveOrder }: BandReorderParams) {
  const [draggedBandId, setDraggedBandId] = useState<string | null>(null);

  const handleMoveBand = (
    bandId: string,
    direction: "left" | "right",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const currentCleanIds = uniqueBands.map((b) => cleanBandId(b.band_id));
    const cleanId = cleanBandId(bandId);
    const idx = currentCleanIds.indexOf(cleanId);
    if (idx === -1) return;

    const targetIdx = direction === "left" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentCleanIds.length) return;

    const newOrder = [...currentCleanIds];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, moved);
    saveOrder(newOrder);
  };

  const handleDragStart = (bandId: string, e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", bandId);
    setDraggedBandId(bandId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetBandId: string, e: React.DragEvent) => {
    e.preventDefault();
    const sourceBandId = e.dataTransfer.getData("text/plain") || draggedBandId;
    setDraggedBandId(null);
    if (!sourceBandId || sourceBandId === targetBandId) return;

    const currentCleanIds = uniqueBands.map((b) => cleanBandId(b.band_id));
    const sourceClean = cleanBandId(sourceBandId);
    const targetClean = cleanBandId(targetBandId);

    const sourceIdx = currentCleanIds.indexOf(sourceClean);
    const targetIdx = currentCleanIds.indexOf(targetClean);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newOrder = [...currentCleanIds];
    const [moved] = newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    saveOrder(newOrder);
  };

  return { draggedBandId, handleDragStart, handleDragOver, handleDrop, handleMoveBand };
}
