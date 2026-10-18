/**
 * Compone los hooks del exportador PDF (miembros, ajustes, marcas, persistencia y vista previa).
 * Extraído de PdfExportModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Setlist, Song } from "../../../../types";
import { BandMemberOption } from "../../../../utils/repertorioUtils";
import { useMemberSelection } from "./useMemberSelection";
import { usePrintMembers } from "./usePrintMembers";
import { usePrintPreview } from "./usePrintPreview";
import { usePrintSettings } from "./usePrintSettings";
import { usePrintSettingsPersistence } from "./usePrintSettingsPersistence";
import { useSongMarks } from "./useSongMarks";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PdfExportControllerParams {
  bandMembers: BandMemberOption[];
  bandLogoUrl: string;
  onUpdateSong: (updatedSong: Song) => void;
  activeSetlist: Setlist;
  songs: Song[];
  bandName: string;
  isOpen: boolean;
}

/**
 * Compone los hooks del exportador PDF (miembros, ajustes, marcas, persistencia y vista previa).
 * @param params Estado y callbacks del contenedor ({@link PdfExportControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePdfExportController({ bandMembers, bandLogoUrl, onUpdateSong, activeSetlist, songs, bandName, isOpen }: PdfExportControllerParams) {
  const { resolvedMembers, selectedMemberId, printMode, setPrintMode, setSelectedMemberId } = usePrintMembers({ bandMembers });

  const { markedSongs, setMarkedSongs, textAlign, columnsChoice, showGeneralNotes, showTonality, showBpm, showDuration, showBandLogo, showWatermark, showAppBranding, handwritingFont, handwritingColor, badgesScope, setTextAlign, setColumnsChoice, setShowGeneralNotes, setShowTonality, setShowBpm, setShowDuration, setShowBandLogo, setShowWatermark, setShowAppBranding, setHandwritingFont, setHandwritingColor, setBadgesScope, showSongNumbers, showSetlistNotes, stylePreset, customLogoUrl, isCentered, setShowAdvancedSettings, showAdvancedSettings, setShowMarksPanel, showMarksPanel } = usePrintSettings({ bandLogoUrl });

  const { currentPreviewMember, previewPageIndex, membersToExport, setPreviewPageIndex } = useMemberSelection({ resolvedMembers, selectedMemberId, printMode });

  const { markedCountForMember, setAllMarks, isMarked, setMark } = useSongMarks({ currentPreviewMember, markedSongs, setMarkedSongs, onUpdateSong, activeSetlist, songs });

  const { saveFailed } = usePrintSettingsPersistence({ textAlign, columnsChoice, showGeneralNotes, showTonality, showBpm, showDuration, showBandLogo, showWatermark, showAppBranding, handwritingFont, handwritingColor, badgesScope, markedSongs, setTextAlign, setColumnsChoice, setShowGeneralNotes, setShowTonality, setShowBpm, setShowDuration, setShowBandLogo, setShowWatermark, setShowAppBranding, setHandwritingFont, setHandwritingColor, setBadgesScope, setMarkedSongs });

  const { handlePrint, pagesChoice, setPagesChoice, previewDoc, previewBoxRef, previewScale, previewHeightPx, previewFrameRef, previewLoading, editingSongForNotes, setEditingSongForNotes } = usePrintPreview({ printMode, selectedMemberId, previewPageIndex, textAlign, columnsChoice, handwritingFont, handwritingColor, showBandLogo, showSongNumbers, showTonality, showBpm, showDuration, badgesScope, markedSongs, showSetlistNotes, showGeneralNotes, showAppBranding, showWatermark, stylePreset, bandName, customLogoUrl, resolvedMembers, songs, isOpen, membersToExport, activeSetlist, isCentered, currentPreviewMember });

  return { handlePrint, membersToExport, currentPreviewMember, printMode, setPrintMode, setPreviewPageIndex, resolvedMembers, selectedMemberId, setSelectedMemberId, columnsChoice, setColumnsChoice, textAlign, setTextAlign, pagesChoice, setPagesChoice, previewDoc, setShowAdvancedSettings, showAdvancedSettings, handwritingFont, setHandwritingFont, setHandwritingColor, handwritingColor, showBandLogo, setShowBandLogo, showWatermark, setShowWatermark, showTonality, setShowTonality, showBpm, setShowBpm, showDuration, setShowDuration, showGeneralNotes, setShowGeneralNotes, showAppBranding, setShowAppBranding, badgesScope, setBadgesScope, setShowMarksPanel, showMarksPanel, markedCountForMember, saveFailed, setAllMarks, isMarked, setMark, previewPageIndex, previewBoxRef, previewScale, previewHeightPx, previewFrameRef, previewLoading, editingSongForNotes, setEditingSongForNotes };
}
