/**
 * Columna derecha con la maqueta de móvil que previsualiza el reel seleccionado.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ReelsPhoneMockup } from "../reels/ReelsPhoneMockup";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Columna derecha con la maqueta de móvil que previsualiza el reel seleccionado.
 * @returns Sección de interfaz.
 */
export function ReelsPhonePreviewPanel() {
  const { colors, activeTab, selectedPlatform, nombreBanda, instagramHandle, phoneTitle, phoneText, phoneDuration, inputType, youtubeUrl, localVideoUrl, renderedClipUrl, renderedSubUrl, renderedBurnedSubs, subtitleCues, currentSubtitleText, setCurrentSubtitleText, setLocalVideoDuration, isPreviewMuted, setIsPreviewMuted, isExpandedPreview, setIsExpandedPreview, showSafeZone, setShowSafeZone, ytLoopCount, simulatedTime, highlights, selectedHighlightIndex, videoMeta, isSeamlessLoop, isPunchInZoom, activeSubtitleStyle, showSpotifyBadge, showRetentionProgressBar, showTourSticker, tourStickerText, uploadProgress, handleSimulateUpload } = useReelsCenter();
  return (
    <>
      <div
      className={`xl:col-span-4 rounded-[var(--r-m)] p-5 flex flex-col justify-between select-none ${colors.card}`}
      >
      <div className="space-y-3">
        <div className={` pb-2 `}>
          <h3 className={`text-xs font-sans text-[var(--acc)]`}>
            Vista previa en redes
          </h3>
          <p className="text-micro text-[var(--ink-2)] font-sans mt-0.5">
            Visualiza cómo se verá la copia y el contenido en directo
          </p>
        </div>

        <ReelsPhoneMockup
          colors={colors}
          activeTab={activeTab}
          selectedPlatform={selectedPlatform}
          nombreBanda={nombreBanda}
          instagramHandle={instagramHandle}
          phoneTitle={phoneTitle}
          phoneText={phoneText}
          phoneDuration={phoneDuration}
          inputType={inputType}
          youtubeUrl={youtubeUrl}
          localVideoUrl={localVideoUrl}
          renderedClipUrl={renderedClipUrl}
          renderedSubUrl={renderedSubUrl}
          renderedBurnedSubs={renderedBurnedSubs}
          subtitleCues={subtitleCues}
          currentSubtitleText={currentSubtitleText}
          setCurrentSubtitleText={setCurrentSubtitleText}
          setLocalVideoDuration={setLocalVideoDuration}
          isPreviewMuted={isPreviewMuted}
          setIsPreviewMuted={setIsPreviewMuted}
          isExpandedPreview={isExpandedPreview}
          setIsExpandedPreview={setIsExpandedPreview}
          showSafeZone={showSafeZone}
          setShowSafeZone={setShowSafeZone}
          ytLoopCount={ytLoopCount}
          simulatedTime={simulatedTime}
          highlights={highlights}
          selectedHighlightIndex={selectedHighlightIndex}
          videoMeta={videoMeta}
          isSeamlessLoop={isSeamlessLoop}
          isPunchInZoom={isPunchInZoom}
          activeSubtitleStyle={activeSubtitleStyle}
          showSpotifyBadge={showSpotifyBadge}
          showRetentionProgressBar={showRetentionProgressBar}
          showTourSticker={showTourSticker}
          tourStickerText={tourStickerText}
          uploadProgress={uploadProgress}
          handleSimulateUpload={handleSimulateUpload}
        />
      </div>
      </div>
    </>
  );
}
