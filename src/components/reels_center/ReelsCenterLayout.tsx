/**
 * Maqueta del Centro de Reels: cabecera, pestañas, columnas de trabajo y modales.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Sparkles } from "lucide-react";
import { BandToneModal } from "../bandCRM/BandToneModal";
import { ReelsTheaterModal } from "../reels/ReelsTheaterModal";
import { Tabs } from "../ui/Tabs";
import { AnalyzerTab } from "./AnalyzerTab";
import { ConnectAccountDialog } from "./ConnectAccountDialog";
import { PipelineTab } from "./PipelineTab";
import { useReelsCenter } from "./ReelsCenterContext";
import { ReelsCenterHeader } from "./ReelsCenterHeader";
import { PLATFORM_UI_ICONS } from "./reelsConstants";
import { copyForPlatform } from "./reelsHelpers";
import { ReelsPhonePreviewPanel } from "./ReelsPhonePreviewPanel";
import { SyncNotices } from "./SyncNotices";

/**
 * Maqueta del Centro de Reels: cabecera, pestañas, columnas de trabajo y modales.
 * @returns Sección de interfaz.
 */
export function ReelsCenterLayout() {
  const { activeTab, setActiveTab, isExpandedPreview, setIsExpandedPreview, colors, nombreBanda, instagramHandle, bandName, selectedPlatform, setSelectedPlatform, phoneDuration, inputType, youtubeUrl, localVideoUrl, renderedClipUrl, renderedSubUrl, renderedBurnedSubs, renderedClipSize, renderedStoredPermanently, sinTranscripcionReal, subtitleCues, currentSubtitleText, setCurrentSubtitleText, wordOffsets, isPreviewMuted, setIsPreviewMuted, showSafeZone, ytLoopCount, setYtLoopCount, simulatedTime, setSimulatedTime, timelineDuration, highlights, setHighlights, selectedHighlightIndex, videoMeta, editedCopy, setEditedCopy, copySuccess, handleCopyToClipboard, cropMode, setCropMode, burnSubtitles, setBurnSubtitles, karaokeSubtitles, setKaraokeSubtitles, isCuttingVideo, cuttingProgressText, cuttingError, handleCutPhysicalVideo, handleAdjustCrop, setDraggingBoundary, scheduledDate, setScheduledDate, scheduledTime, setScheduledTime, optimalTime, isScheduling, schedulingSuccess, scheduleErrors, scheduleWarnings, handleSchedulePost, isBandToneModalOpen, setIsBandToneModalOpen, bandToneData, isAnalyzingBandTone, toneAnalysisSaved, setBandToneData, setToneAnalysisSaved, handleAnalyzeBandTone, handleRefreshLearnedRules } = useReelsCenter();
  return (
    <>
      <div
      data-modulo="reels"
      className={`space-y-6 text-[var(--ink)] font-sans w-full max-w-full overflow-x-hidden`}
    >
      <ReelsCenterHeader />

      <SyncNotices />

      {/* Dynamic Segment Tab Selector */}
      <Tabs<typeof activeTab>
      className="mb-4"
      aria-label="Herramientas de Reels"
      value={activeTab}
      onChange={setActiveTab}
      items={[
      { id: "pipeline", domId: "tab-btn-pipeline", label: "Pipeline y redactor de copy" },
      { id: "analyzer", domId: "tab-btn-analyzer", icon: Sparkles, label: "Analizador de vídeos IA" },
      ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      {/* LEFT COLUMN: ACTIVE WORKSPACE TAB (8 columns) */}
      <div className="xl:col-span-8 space-y-6 flex flex-col justify-between min-w-0">
      {activeTab === "pipeline" ? (
        /* TAB 1: KANBAN PIPELINE AND COPY GENERATOR */
        <PipelineTab />
      ) : (
        /* TAB 2: BRAND NEW AI VIDEO HIGHLIGHT EXTRACTOR */
        <AnalyzerTab />
      )}
      </div>

      {/* RIGHT COLUMN: HIGH-FIDELITY PHONE PREVIEW MOCKUP (4 columns) */}
      <ReelsPhonePreviewPanel />
      </div>

      {/* 🎬 MODO CINE / PREVISUALIZADOR EXPANDIDO MODULAR */}
      <ReelsTheaterModal
      isOpen={isExpandedPreview}
      onClose={() => setIsExpandedPreview(false)}
      colors={colors}
      nombreBanda={nombreBanda}
      instagramHandle={instagramHandle}
      bandName={bandName}
      selectedPlatform={selectedPlatform}
      setSelectedPlatform={setSelectedPlatform}
      phoneDuration={phoneDuration}
      inputType={inputType}
      youtubeUrl={youtubeUrl}
      localVideoUrl={localVideoUrl}
      renderedClipUrl={renderedClipUrl}
      renderedSubUrl={renderedSubUrl}
      renderedBurnedSubs={renderedBurnedSubs}
      renderedClipSize={renderedClipSize}
      renderedStoredPermanently={renderedStoredPermanently}
      sinTranscripcionReal={sinTranscripcionReal}
      subtitleCues={subtitleCues}
      currentSubtitleText={currentSubtitleText}
      setCurrentSubtitleText={setCurrentSubtitleText}
      wordOffsets={wordOffsets}
      isPreviewMuted={isPreviewMuted}
      setIsPreviewMuted={setIsPreviewMuted}
      showSafeZone={showSafeZone}
      ytLoopCount={ytLoopCount}
      setYtLoopCount={setYtLoopCount}
      simulatedTime={simulatedTime}
      setSimulatedTime={setSimulatedTime}
      timelineDuration={timelineDuration}
      highlights={highlights}
      setHighlights={setHighlights}
      selectedHighlightIndex={selectedHighlightIndex}
      videoMeta={videoMeta}
      editedCopy={editedCopy}
      setEditedCopy={setEditedCopy}
      copySuccess={copySuccess}
      handleCopyToClipboard={handleCopyToClipboard}
      copyForPlatform={copyForPlatform}
      cropMode={cropMode}
      setCropMode={setCropMode}
      burnSubtitles={burnSubtitles}
      setBurnSubtitles={setBurnSubtitles}
      karaokeSubtitles={karaokeSubtitles}
      setKaraokeSubtitles={setKaraokeSubtitles}
      isCuttingVideo={isCuttingVideo}
      cuttingProgressText={cuttingProgressText}
      cuttingError={cuttingError}
      handleCutPhysicalVideo={handleCutPhysicalVideo}
      handleAdjustCrop={handleAdjustCrop}
      setDraggingBoundary={setDraggingBoundary}
      scheduledDate={scheduledDate}
      setScheduledDate={setScheduledDate}
      scheduledTime={scheduledTime}
      setScheduledTime={setScheduledTime}
      optimalTime={optimalTime}
      isScheduling={isScheduling}
      schedulingSuccess={schedulingSuccess}
      scheduleErrors={scheduleErrors}
      scheduleWarnings={scheduleWarnings}
      handleSchedulePost={handleSchedulePost}
      platformIcons={PLATFORM_UI_ICONS}
      />

      {/* Modal de Tono de Expresión de la banda activa */}
      <BandToneModal
      isOpen={isBandToneModalOpen}
      onClose={() => setIsBandToneModalOpen(false)}
      band={{
      id: instagramHandle || "",
      nombre_banda: bandName || "Tu Banda",
      estilo_musical: "",
      localizacion: "",
      estado_relacion: "colegas_aliados",
      ultimo_contacto: "Hoy",
      }}
      toneData={bandToneData}
      isLoading={isAnalyzingBandTone}
      isSaved={toneAnalysisSaved}
      editable
      onSaved={(data) => {
      setBandToneData(data);
      setToneAnalysisSaved(true);
      }}
      onReAnalyze={handleAnalyzeBandTone}
      onRefreshLearnedRules={handleRefreshLearnedRules}
      />

      {/* Modal de Conexión de Cuentas Oficiales (1-Clic sin fricción) */}
      <ConnectAccountDialog />
    </div>
    </>
  );
}
