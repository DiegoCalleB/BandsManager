/**
 * Modal de exportación del setlist a PDF/impresión: ajustes de diseño, vista previa paginada y hojas por miembro.
 * Orquesta controlador, contexto y maqueta; la lógica vive en `pdf_export/` (AGENTS.md §5.6).
 */
import type { Setlist, Song } from "../../types";
import type { BandMemberOption } from "../../utils/repertorioUtils";
import { usePdfExportController } from "./pdf_export/hooks/usePdfExportController";
import { PdfExportLayout } from "./pdf_export/PdfExportLayout";
import { PdfExportProvider } from "./pdf_export/PdfExportProvider";
import { type SetlistStylePreset } from "./pdf_export/printLayout";

export type { SetlistStylePreset };

interface PdfExportModalProps {
  isOpen: boolean;
  activeSetlist: Setlist | null;
  activeSetlistMetrics: {
    formattedTime: string;
    songCount: number;
    avgBpm?: number;
    totalSeconds?: number;
  };
  songs: Song[];
  bandMembers?: BandMemberOption[];
  bandName?: string;
  bandLogoUrl?: string;
  onClose: () => void;
  onUpdateSong?: (updatedSong: Song) => void;
}

/**
 * Exportador PDF del setlist activo. Solo existe mientras está abierto: así sus hooks (estado y efectos de la
 * vista previa) no conviven con un `return null` intermedio.
 * @param props Setlist, canciones, miembros y callbacks de cierre/edición.
 * @returns El modal o `null` si está cerrado o no hay setlist.
 */
export function PdfExportModal(props: PdfExportModalProps) {
  if (!props.isOpen || !props.activeSetlist) return null;
  return <PdfExportModalBody {...props} activeSetlist={props.activeSetlist} />;
}

function PdfExportModalBody({
  bandMembers = [],
  bandName = "Tu Banda",
  bandLogoUrl = "",
  ...props
}: PdfExportModalProps & { activeSetlist: Setlist }) {
  const controller = usePdfExportController({
    bandMembers,
    bandLogoUrl,
    onUpdateSong: props.onUpdateSong,
    activeSetlist: props.activeSetlist,
    songs: props.songs,
    bandName,
    isOpen: props.isOpen,
  });

  return (
    <PdfExportProvider value={{ ...controller, ...props, bandMembers, bandName, bandLogoUrl }}>
      <PdfExportLayout />
    </PdfExportProvider>
  );
}
