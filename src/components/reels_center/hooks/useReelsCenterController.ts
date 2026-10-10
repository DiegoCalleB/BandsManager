/**
 * Compone todos los hooks del Centro de Reels y expone el estado y los handlers que consumen las vistas.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { SocialPost } from "../../../types";
import { useAnalysisTimeline } from "./useAnalysisTimeline";
import { useBandToneAnalysis } from "./useBandToneAnalysis";
import { useClipFeedbackState } from "./useClipFeedbackState";
import { useClipReanalysis } from "./useClipReanalysis";
import { useClipRendering } from "./useClipRendering";
import { useCopyActions } from "./useCopyActions";
import { useCopyDraftState } from "./useCopyDraftState";
import { useHighlightEditing } from "./useHighlightEditing";
import { useReelsSync } from "./useReelsSync";
import { useReelStyleOptions } from "./useReelStyleOptions";
import { useRenderedClipState } from "./useRenderedClipState";
import { useSocialPublishing } from "./useSocialPublishing";
import { useVideoAnalyzer } from "./useVideoAnalyzer";
import { useVideoFileInput } from "./useVideoFileInput";
import { useVideoSource } from "./useVideoSource";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ReelsCenterControllerParams {
  bandName: string;
  instagramHandle: string;
  hasAnySocialLink: boolean;
  onAddPost: (post: SocialPost) => Promise<void>;
  posts: SocialPost[];
}

/**
 * Compone todos los hooks del Centro de Reels y expone el estado y los handlers que consumen las vistas.
 * @param params Estado y callbacks del contenedor ({@link ReelsCenterControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useReelsCenterController({ bandName, instagramHandle, hasAnySocialLink, onAddPost, posts }: ReelsCenterControllerParams) {
  // Tabs:'pipeline' (existing Kanban + Writer) vs'analyzer' (new AI Video Highlight Extractor)
  const [activeTab, setActiveTab] = useState<"pipeline" | "analyzer">(
    "pipeline",
  );

  // Esta pantalla estaba llena de"Bakandeya" a pelo, así que cualquier otra banda veía por
  // todas partes el nombre de la banda del fundador en vez del suyo.
  const nombreBanda = (bandName || "").trim() || "tu banda";

  const { handleOpenToneModal, isBandToneModalOpen, setIsBandToneModalOpen, bandToneData, isAnalyzingBandTone, toneAnalysisSaved, setBandToneData, setToneAnalysisSaved, handleAnalyzeBandTone, handleRefreshLearnedRules } = useBandToneAnalysis({ instagramHandle, hasAnySocialLink, bandName });

  const { handleSyncReels, isSyncingReels, syncSuccessMessage, setSyncSuccessMessage, syncErrorMessage, setSyncErrorMessage } = useReelsSync();

  const { localVideoUrl, youtubeUrl, inputType, localVideoDuration, setLocalVideoUrl, setDragActive, setSelectedFile, setLocalVideoDuration, selectedFile, setInputType, dragActive, setYoutubeUrl, isPreviewMuted, setIsPreviewMuted, isExpandedPreview, setIsExpandedPreview } = useVideoSource();

  const { renderedClipUrl, setLoadedFromSaveAt, setRenderedClipUrl, setRenderedClipSize, setRenderedBurnedSubs, setRenderedStoredPermanently, setRenderedSubUrl, setSubtitleCues, setWordOffsets, setCurrentSubtitleText, setCuttingError, setIsCuttingVideo, setCuttingProgressText, setSinTranscripcionReal, renderedSubUrl, setThumbnailCapturedSuccess, subtitleCues, setPackDownloadedSuccess, loadedFromSaveAt, packDownloadedSuccess, thumbnailCapturedSuccess, renderedBurnedSubs, currentSubtitleText, renderedClipSize, renderedStoredPermanently, sinTranscripcionReal, wordOffsets, isCuttingVideo, cuttingProgressText, cuttingError } = useRenderedClipState({ localVideoUrl });

  const { selectedPlatform, scheduledDate, scheduledTime, editedCopy, setEditedCopy, setDetectedContentType, contentType, setScheduledDate, setScheduledTime, copyObjective, setScheduleErrors, setScheduleWarnings, setIsScheduling, setSchedulingSuccess, setCopyObjective, setCopiedNotification, setCopySuccess, setIsGenerating, reelIdea, setGeneratedCopy, setUploadProgress, detectedContentType, selectedPostInPhone, generatedCopy, setSelectedPostInPhone, setReelIdea, isGenerating, setContentType, showSafeZone, setShowSafeZone, copiedNotification, setSelectedPlatform, isScheduling, schedulingSuccess, scheduleErrors, scheduleWarnings, uploadProgress, copySuccess } = useCopyDraftState();

  const { setClipUserNote, setReanalyzeSuccessMsg, setIsReanalyzingClip, clipUserNote, clipToneRating, clipContentRating, clipFeedbackScope, setClipToneRating, setClipContentRating, isReanalyzingClip, setClipFeedbackScope, reanalyzeSuccessMsg } = useClipFeedbackState();

  const { socialAccounts, autoPublishEnabled, setAutoPublishEnabled, setShowConnectModal, setConnectHandleInput, handlePublishNowDirectly, isPublishingNow, publishNowSuccess, showConnectModal, connectHandleInput, connectingPlatform, handleConnectSocialAccount } = useSocialPublishing({ bandName, selectedPlatform, scheduledDate, scheduledTime, editedCopy, renderedClipUrl, youtubeUrl, onAddPost });

  const { setVideoTopic, setIsAnalyzing, setAnalysisError, setAnalysisNotice, setEnergyWindows, setViralWindows, setLoadingStep, getLoadingSteps, videoDuration, videoMeta, videoTopic, setHighlights, setOptimalTime, setSelectedHighlightIndex, setVideoMeta, highlights, selectedHighlightIndex, setSimulatedTime, setYtLoopCount, cropMode, burnSubtitles, karaokeSubtitles, optimalTime, isFetchingMeta, metaError, setVideoDuration, isAnalyzing, loadingStep, analysisError, analysisNotice, viralWindows, energyWindows, timelineDuration, setCropMode, ytLoopCount, simulatedTime, setBurnSubtitles, setKaraokeSubtitles, setDraggingBoundary } = useAnalysisTimeline({ youtubeUrl, inputType, setEditedCopy, selectedPlatform, setDetectedContentType, setLoadedFromSaveAt, localVideoDuration, activeTab });

  const { handleFileDrop, handleFileSelect, cambiarVideoLocal } = useVideoFileInput({ setLocalVideoUrl, setDragActive, setSelectedFile, setLocalVideoDuration, setVideoTopic });

  const { handleAnalyzeVideo } = useVideoAnalyzer({ inputType, selectedFile, youtubeUrl, setRenderedClipUrl, setRenderedClipSize, setRenderedBurnedSubs, setRenderedStoredPermanently, setRenderedSubUrl, setSubtitleCues, setWordOffsets, setCurrentSubtitleText, setCuttingError, setIsAnalyzing, setAnalysisError, setAnalysisNotice, setEnergyWindows, setViralWindows, setLoadedFromSaveAt, setLoadingStep, setDetectedContentType, getLoadingSteps, videoDuration, localVideoDuration, videoMeta, contentType, videoTopic, setHighlights, setOptimalTime, setSelectedHighlightIndex, setVideoMeta, setEditedCopy, selectedPlatform, setScheduledDate, setScheduledTime });

  const { handleSelectHighlight, handleAdjustCrop } = useHighlightEditing({ setSelectedHighlightIndex, setRenderedClipUrl, setRenderedClipSize, setRenderedBurnedSubs, setRenderedStoredPermanently, setRenderedSubUrl, setSubtitleCues, setWordOffsets, setCurrentSubtitleText, setCuttingError, setClipUserNote, setReanalyzeSuccessMsg, highlights, copyObjective, setEditedCopy, selectedPlatform, selectedHighlightIndex, setHighlights, setSimulatedTime, setYtLoopCount });

  const { isSeamlessLoop, setIsSeamlessLoop, isPunchInZoom, setIsPunchInZoom, beatDropFx, setBeatDropFx, smartPan, setSmartPan, activeSubtitleStyle, setActiveSubtitleStyle, injectEmojis, setInjectEmojis, showSpotifyBadge, setShowSpotifyBadge, showRetentionProgressBar, setShowRetentionProgressBar, showTourSticker, setShowTourSticker, tourStickerText, setTourStickerText, handleSyncFromTourCRM, handleTriggerMagicAutopilot, magicAppliedNotification, layoutMode, setLayoutMode } = useReelStyleOptions({ highlights, handleSelectHighlight, selectedHighlightIndex, setHighlights, bandName });

  const { handleGenerateCopy, handleSchedulePost, handleSwitchCopyObjective, handleCopyFormattedPost, handleSimulateUpload, handleCopyToClipboard } = useCopyActions({ editedCopy, scheduledDate, scheduledTime, setScheduleErrors, setScheduleWarnings, posts, selectedPlatform, setIsScheduling, setSchedulingSuccess, socialAccounts, instagramHandle, bandName, renderedClipUrl, youtubeUrl, autoPublishEnabled, onAddPost, setCopyObjective, highlights, selectedHighlightIndex, setEditedCopy, setCopiedNotification, setCopySuccess, setIsGenerating, reelIdea, setGeneratedCopy, nombreBanda, setUploadProgress });

  const { handleDownloadCompletePack, handleCaptureThumbnail, handleCutPhysicalVideo } = useClipRendering({ highlights, selectedHighlightIndex, youtubeUrl, setIsCuttingVideo, setCuttingError, setCuttingProgressText, setWordOffsets, setSinTranscripcionReal, cropMode, burnSubtitles, karaokeSubtitles, renderedClipUrl, renderedSubUrl, setRenderedClipUrl, setRenderedClipSize, setRenderedBurnedSubs, setRenderedStoredPermanently, setRenderedSubUrl, setSubtitleCues, bandName, setThumbnailCapturedSuccess, selectedPlatform, editedCopy, optimalTime, nombreBanda, copyObjective, subtitleCues, setPackDownloadedSuccess });

  const { handleReanalyzeClip } = useClipReanalysis({ highlights, selectedHighlightIndex, setIsReanalyzingClip, setReanalyzeSuccessMsg, youtubeUrl, selectedFile, videoTopic, clipUserNote, inputType, contentType, detectedContentType, clipToneRating, clipContentRating, clipFeedbackScope, setHighlights, setEditedCopy, selectedPlatform, setClipToneRating, setClipContentRating });


  // Select dynamic display text for phone screen mock
  const phoneText = selectedPostInPhone
    ? selectedPostInPhone.contenido
    : activeTab === "analyzer" && highlights.length > 0
      ? editedCopy
      : generatedCopy;

  const phoneTitle = selectedPostInPhone
    ? `${selectedPostInPhone.plataforma} · ${selectedPostInPhone.responsable}`
    : activeTab === "analyzer" && highlights.length > 0
      ? highlights[selectedHighlightIndex]?.title || `Reel de ${nombreBanda}`
      : `Reels de ${nombreBanda}`;

  const phoneDuration = selectedPostInPhone
    ? selectedPostInPhone.fecha
    : activeTab === "analyzer" && highlights.length > 0
      ? highlights[selectedHighlightIndex]?.range || "0:30"
      : "0:30";

  const textTitle = "text-[var(--ink)]";

  const textSub = "text-[var(--ink-2)]";


  return { handleOpenToneModal, nombreBanda, handleSyncReels, isSyncingReels, syncSuccessMessage, setSyncSuccessMessage, syncErrorMessage, setSyncErrorMessage, activeTab, setActiveTab, textSub, setSelectedPostInPhone, selectedPostInPhone, textTitle, reelIdea, setReelIdea, handleGenerateCopy, isGenerating, generatedCopy, setGeneratedCopy, inputType, setInputType, setAnalysisError, setDragActive, handleFileDrop, dragActive, selectedFile, handleFileSelect, setSelectedFile, cambiarVideoLocal, setLocalVideoDuration, setHighlights, setOptimalTime, setEnergyWindows, setViralWindows, setLoadedFromSaveAt, setDetectedContentType, youtubeUrl, setYoutubeUrl, isFetchingMeta, metaError, videoMeta, contentType, detectedContentType, setContentType, videoTopic, setVideoTopic, videoDuration, setVideoDuration, loadedFromSaveAt, highlights, isAnalyzing, handleAnalyzeVideo, loadingStep, getLoadingSteps, analysisError, analysisNotice, viralWindows, energyWindows, timelineDuration, selectedHighlightIndex, handleSelectHighlight, handleSchedulePost, handleReanalyzeClip, isReanalyzingClip, clipUserNote, setClipUserNote, setClipToneRating, clipToneRating, setClipContentRating, clipContentRating, setClipFeedbackScope, clipFeedbackScope, reanalyzeSuccessMsg, editedCopy, setEditedCopy, isSeamlessLoop, setIsSeamlessLoop, isPunchInZoom, setIsPunchInZoom, beatDropFx, setBeatDropFx, smartPan, setSmartPan, cropMode, setCropMode, activeSubtitleStyle, setActiveSubtitleStyle, injectEmojis, setInjectEmojis, showSpotifyBadge, setShowSpotifyBadge, showRetentionProgressBar, setShowRetentionProgressBar, showTourSticker, setShowTourSticker, tourStickerText, setTourStickerText, handleSyncFromTourCRM, handleTriggerMagicAutopilot, magicAppliedNotification, layoutMode, setLayoutMode, showSafeZone, setShowSafeZone, handleSwitchCopyObjective, copyObjective, copiedNotification, handleCopyFormattedPost, optimalTime, setSelectedPlatform, selectedPlatform, scheduledDate, setScheduledDate, scheduledTime, setScheduledTime, autoPublishEnabled, setAutoPublishEnabled, socialAccounts, setShowConnectModal, setConnectHandleInput, handleDownloadCompletePack, packDownloadedSuccess, thumbnailCapturedSuccess, handleCaptureThumbnail, handlePublishNowDirectly, isPublishingNow, isScheduling, publishNowSuccess, schedulingSuccess, scheduleErrors, scheduleWarnings, phoneTitle, phoneText, phoneDuration, localVideoUrl, renderedClipUrl, renderedSubUrl, renderedBurnedSubs, subtitleCues, currentSubtitleText, setCurrentSubtitleText, isPreviewMuted, setIsPreviewMuted, isExpandedPreview, setIsExpandedPreview, ytLoopCount, simulatedTime, uploadProgress, handleSimulateUpload, renderedClipSize, renderedStoredPermanently, sinTranscripcionReal, wordOffsets, setYtLoopCount, setSimulatedTime, copySuccess, handleCopyToClipboard, burnSubtitles, setBurnSubtitles, karaokeSubtitles, setKaraokeSubtitles, isCuttingVideo, cuttingProgressText, cuttingError, handleCutPhysicalVideo, handleAdjustCrop, setDraggingBoundary, isBandToneModalOpen, setIsBandToneModalOpen, bandToneData, isAnalyzingBandTone, toneAnalysisSaved, setBandToneData, setToneAnalysisSaved, handleAnalyzeBandTone, handleRefreshLearnedRules, showConnectModal, connectHandleInput, connectingPlatform, handleConnectSocialAccount };
}
