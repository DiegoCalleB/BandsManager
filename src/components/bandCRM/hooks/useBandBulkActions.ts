/**
 * Acciones masivas sobre bandas: estado, favoritas, borrado, exportación CSV y generación de propuestas de swap.
 * Extraído de BandCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { DateSwapPitchResponse } from "../bandCrmTypes";
import { Dispatch, SetStateAction } from "react";
import { api } from "../../../services/api";
import { BandContact, BandRelationshipStatus } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { BulkProgressItem } from "../../booking/BulkProgressModal";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandBulkActionsParams {
  selectedBandIds: string[];
  setBands: Dispatch<SetStateAction<BandContact[]>>;
  setSelectedBandIds: Dispatch<SetStateAction<string[]>>;
  fetchBands: () => void;
  bands: BandContact[];
  setBulkProgressState: Dispatch<SetStateAction<{ isOpen: boolean; title: string; subtitle?: string; items: BulkProgressItem[]; currentIndex: number; totalCount: number; isCompleted: boolean; }>>;
  myBandName: string;
}

/**
 * Acciones masivas sobre bandas: estado, favoritas, borrado, exportación CSV y generación de propuestas de swap.
 * @param params Estado y callbacks del contenedor ({@link BandBulkActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandBulkActions({ selectedBandIds, setBands, setSelectedBandIds, fetchBands, bands, setBulkProgressState, myBandName }: BandBulkActionsParams) {
  const handleBulkBandStatusChange = async (
    newStatus: BandRelationshipStatus,
  ) => {
    if (selectedBandIds.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    setBands((prev) =>
      prev.map((b) =>
        selectedBandIds.includes(b.id)
          ? { ...b, estado_relacion: newStatus, ultimo_contacto: today }
          : b,
      ),
    );

    selectedBandIds.forEach((id) => {
      fetch(`/api/bands/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado_relacion: newStatus,
          ultimo_contacto: today,
        }),
      }).catch(console.error);
    });
  };

  const handleBulkBandToggleFavorite = (isFav: boolean) => {
    if (selectedBandIds.length === 0) return;
    setBands((prev) =>
      prev.map((b) =>
        selectedBandIds.includes(b.id) ? { ...b, es_favorito: isFav } : b,
      ),
    );
    selectedBandIds.forEach((id) => {
      fetch(`/api/bands/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ es_favorito: isFav }),
      }).catch(console.error);
    });
  };

  const handleBulkBandDelete = async () => {
    if (selectedBandIds.length === 0) return;
    const idsToDelete = [...selectedBandIds];
    setSelectedBandIds([]);
    setBands((prev) => prev.filter((b) => !idsToDelete.includes(b.id)));
    try {
      await api.bulkDeleteBands(idsToDelete);
    } catch (err) {
      console.error("Error bulk deleting bands:", err);
      fetchBands();
    }
  };

  const handleBulkBandExportCsv = () => {
    const bandsToExport = bands.filter((b) => selectedBandIds.includes(b.id));
    if (bandsToExport.length === 0) return;

    const headers = [
      "Nombre Banda",
      "Estilo Musical",
      "Localización",
      "Estado Relación",
      "Contacto",
      "Email",
      "Teléfono",
      "Instagram",
      "Spotify / Web",
      "Aforo Habitual",
      "Notas",
    ];
    const rows = bandsToExport.map((b) => [
      `"${(b.nombre_banda || "").replace(/"/g, '""')}"`,
      `"${(b.estilo_musical || "").replace(/"/g, '""')}"`,
      `"${(b.localizacion || "").replace(/"/g, '""')}"`,
      `"${(b.estado_relacion || "").replace(/"/g, '""')}"`,
      `"${(b.contacto_nombre || "").replace(/"/g, '""')}"`,
      `"${(b.email || "").replace(/"/g, '""')}"`,
      `"${(b.telefono || "").replace(/"/g, '""')}"`,
      `"${(b.instagram || "").replace(/"/g, '""')}"`,
      `"${(b.spotify_youtube || "").replace(/"/g, '""')}"`,
      `"${b.aforo_promedio || ""}"`,
      `"${(b.notas_colaboracion || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `bandmanager_bandas_seleccionadas_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkGenerateSwaps = async () => {
    const targetBands = bands.filter((b) => selectedBandIds.includes(b.id));
    if (targetBands.length === 0) return;

    const initialItems: BulkProgressItem[] = targetBands.map((b) => ({
      id: b.id,
      name: b.nombre_banda,
      status: "pending",
    }));

    setBulkProgressState({
      isOpen: true,
      title: "Generando Propuestas Date Swap con IA",
      subtitle: "Redactando propuestas de intercambio de fechas y cartel doble",
      items: initialItems,
      currentIndex: 0,
      totalCount: initialItems.length,
      isCompleted: false,
    });

    const updatedItems = [...initialItems];

    for (let i = 0; i < targetBands.length; i++) {
      const band = targetBands[i];
      updatedItems[i] = {
        ...updatedItems[i],
        status: "in_progress",
        detail: "Redactando propuesta swap...",
      };
      setBulkProgressState((prev) => ({
        ...prev,
        items: [...updatedItems],
        currentIndex: i,
      }));

      try {
        const data = await apiFetch<DateSwapPitchResponse>("/api/bands/generate-date-swap-pitch", {
          method: "POST",
          body: JSON.stringify({
            bandName: band.nombre_banda,
            bandLocation: band.localizacion,
            bandStyle: band.estilo_musical,
            aforo: band.aforo_promedio,
          }),
        });

        const pitchText =
          data?.pitch ||
          data?.data?.pitch ||
          `Hola compas de ${band.nombre_banda},\n\nOs escribimos desde ${myBandName}. Nos encanta vuestro estilo ${band.estilo_musical} y estamos planeando fechas por vuestra zona (${band.localizacion}). ¿Os cuadraría plantear un intercambio de fechas (Date Swap)? Nosotros os montamos fecha en nuestra ciudad y vosotros nos abrís en la vuestra.\n\n¡Un abrazo grande!`;

        const updatedBand = {
          ...band,
          estado_relacion: "propuesta_enviada" as BandRelationshipStatus,
          notas_colaboracion: `${band.notas_colaboracion ? band.notas_colaboracion + "\n\n" : ""}[Propuesta Swap IA]:\n${pitchText}`,
        };

        setBands((prev) =>
          prev.map((b) => (b.id === band.id ? updatedBand : b)),
        );
        await apiFetch(`/api/bands/${band.id}`, {
          method: "PUT",
          body: JSON.stringify(updatedBand),
        });

        updatedItems[i] = {
          ...updatedItems[i],
          status: "success",
          detail: "Propuesta lista",
        };
      } catch (err) {
        updatedItems[i] = {
          ...updatedItems[i],
          status: "error",
          detail: err.message || "Error al generar",
        };
      }

      setBulkProgressState((prev) => ({
        ...prev,
        items: [...updatedItems],
        currentIndex: i + 1,
      }));
    }

    setBulkProgressState((prev) => ({ ...prev, isCompleted: true }));
  };

  return { handleBulkBandStatusChange, handleBulkGenerateSwaps, handleBulkBandToggleFavorite, handleBulkBandExportCsv, handleBulkBandDelete };
}
