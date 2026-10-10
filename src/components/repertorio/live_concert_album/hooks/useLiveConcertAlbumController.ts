/**
 * Compone todos los hooks del flujo concierto→álbum y expone el estado y handlers que consumen las vistas.
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import type { ConcertSetlistDraft, TrackCutItem } from "../types";
import { useAlbumGeneration } from "./useAlbumGeneration";
import { useConcertAnalysis } from "./useConcertAnalysis";
import { useConcertSourceMedia } from "./useConcertSourceMedia";
import { useConcertTranscription } from "./useConcertTranscription";
import { useSnippetPreview } from "./useSnippetPreview";
import { useSnippetScrubber } from "./useSnippetScrubber";
import { useTrackEditing } from "./useTrackEditing";
import { useTrackHistory } from "./useTrackHistory";
import { useYoutubeCookies } from "./useYoutubeCookies";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface LiveConcertAlbumControllerParams {
  bandName: string;
  isOpen: boolean;
  onSaveSetlist?: (newSetlist: ConcertSetlistDraft) => void;
  onSaveAlbumToCatalog: (albumTitle: string, tracks: TrackCutItem[]) => void;
}

/**
 * Compone todos los hooks del flujo concierto→álbum y expone el estado y handlers que consumen las vistas.
 * @param params Estado y callbacks del contenedor ({@link LiveConcertAlbumControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useLiveConcertAlbumController({ bandName, isOpen, onSaveSetlist, onSaveAlbumToCatalog }: LiveConcertAlbumControllerParams) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [analysisStatus, setAnalysisStatus] = useState("");

  const [albumTitle, setAlbumTitle] = useState("");

  const [artistName, setArtistName] = useState(bandName);

  const [generatedResult, setGeneratedResult] = useState<{
    albumId: string;
    deliverablePath: string;
    tracks: TrackCutItem[];
  } | null>(null);

  const { pushHistorySnapshot, setTracks, tracks, setSelectedIndices, selectedIndices, handleUndo, history, handleRedo, redoStack } = useTrackHistory();

  const { setCookieModalOpen, hasYoutubeCookies, cookieModalOpen, cookieSuccessMsg, handleUploadCookieFile, cookiesInputText, setCookiesInputText, handleDeleteCookies, handleSaveCookies, isSavingCookies } = useYoutubeCookies({ isOpen, setErrorMessage });

  const { youtubeUrl, analyzedSourcePath, uploadedFile, uploadFileBinary, setAnalyzedSourcePath, setYoutubeBlocked, setAudioAvailable, setYoutubeUrl, setUploadedFile, audioAvailable, youtubeBlocked, handleLoadDemoAudio, isLinkingLocalFile, handleAttachLocalAudioFile } = useConcertSourceMedia({ setErrorMessage, setAnalysisStatus });

  const { activeSnippet, snippetCurrentTime, setActiveSnippet, snippetAudioRef, setSnippetCurrentTime, setSnippetIsPlaying, snippetIsPlaying, setSnippetDuration, snippetDuration, handleSeekSnippet, handleSkipSnippet, handleChangeSnippetSpeed, snippetSpeed } = useSnippetScrubber();

  const { handleUpdateTrack, setShowQuickNamingModal, handleMergeSelectedTracks, handleAddCutTrack, handleToggleSelectTrack, handleSplitTrack, handleMergeWithNext, handleMoveTrack, handleDeleteTrack, handleSuggestTitleFromSpeech, showQuickNamingModal, setQuickNamingActiveTab, quickNamingActiveTab, batchPastedText, setBatchPastedText, handleApplyBatchPastedNames } = useTrackEditing({ pushHistorySnapshot, setTracks, tracks, setSelectedIndices, selectedIndices, activeSnippet, snippetCurrentTime, setActiveSnippet });

  const { loadingSnippetIndex, playingTrackUrl, handlePlaySnippetPreview, handleSetStartFromCurrentSnippet, handleSetEndFromCurrentSnippet, getYouTubeVideoId } = useSnippetPreview({ activeSnippet, snippetAudioRef, setSnippetCurrentTime, setSnippetIsPlaying, snippetIsPlaying, setActiveSnippet, youtubeUrl, analyzedSourcePath, handleUpdateTrack, snippetCurrentTime });

  const { useAi, setUseAi, handleAnalyzeConcert, transcribeFirst, setTranscribeFirst, handleAutoDetectCues, isDetectingCues, handleSnapAllTracksToCues, handleAutoClassifyTracks, isClassifying, handleSnapTrackStartToCue } = useConcertAnalysis({ youtubeUrl, uploadedFile, setErrorMessage, setIsAnalyzing, setAnalysisStatus, setGeneratedResult, uploadFileBinary, setAnalyzedSourcePath, artistName, bandName, setAlbumTitle, setArtistName, setTracks, setYoutubeBlocked, setAudioAvailable, tracks, albumTitle, analyzedSourcePath, pushHistorySnapshot });

  const { isTranscribingAll, handleTranscribeAllConcert, transcribeAllProgress, setExpandAllChords, expandAllChords, expandedChordsIndex, setExpandedChordsIndex, handleTranscribeSongChordsAndLyrics, transcribingChordsIndex, handleTranscribeSpeech, transcribingIndex } = useConcertTranscription({ youtubeUrl, analyzedSourcePath, artistName, bandName, handleUpdateTrack, selectedIndices, tracks, pushHistorySnapshot });

  const { handleProcessAndSlice, isProcessing, processingStatus, handleCreateSetlistFromConcert, handleSaveToCatalog, savedSuccessMsg } = useAlbumGeneration({ tracks, setErrorMessage, youtubeUrl, analyzedSourcePath, albumTitle, artistName, bandName, setGeneratedResult, setTracks, generatedResult, onSaveSetlist, onSaveAlbumToCatalog });

  return { errorMessage, setErrorMessage, setCookieModalOpen, hasYoutubeCookies, youtubeUrl, setYoutubeUrl, setUploadedFile, useAi, setUseAi, handleAnalyzeConcert, isAnalyzing, uploadedFile, transcribeFirst, setTranscribeFirst, analysisStatus, tracks, audioAvailable, youtubeBlocked, handleLoadDemoAudio, isLinkingLocalFile, handleAttachLocalAudioFile, analyzedSourcePath, handleUndo, history, handleRedo, redoStack, albumTitle, setAlbumTitle, setShowQuickNamingModal, handleAutoDetectCues, isDetectingCues, handleSnapAllTracksToCues, handleAutoClassifyTracks, isClassifying, isTranscribingAll, handleTranscribeAllConcert, transcribeAllProgress, selectedIndices, setExpandAllChords, expandAllChords, handleMergeSelectedTracks, handleAddCutTrack, handleUpdateTrack, expandedChordsIndex, setExpandedChordsIndex, loadingSnippetIndex, playingTrackUrl, handleToggleSelectTrack, handlePlaySnippetPreview, handleSnapTrackStartToCue, handleSplitTrack, handleMergeWithNext, handleMoveTrack, handleDeleteTrack, handleSuggestTitleFromSpeech, handleTranscribeSongChordsAndLyrics, transcribingChordsIndex, handleTranscribeSpeech, transcribingIndex, activeSnippet, snippetAudioRef, setSnippetCurrentTime, handleSetStartFromCurrentSnippet, snippetCurrentTime, handleSetEndFromCurrentSnippet, setActiveSnippet, getYouTubeVideoId, setSnippetDuration, setSnippetIsPlaying, snippetDuration, handleSeekSnippet, handleSkipSnippet, snippetIsPlaying, handleChangeSnippetSpeed, snippetSpeed, handleProcessAndSlice, isProcessing, processingStatus, generatedResult, handleCreateSetlistFromConcert, handleSaveToCatalog, savedSuccessMsg, cookieModalOpen, cookieSuccessMsg, handleUploadCookieFile, cookiesInputText, setCookiesInputText, handleDeleteCookies, handleSaveCookies, isSavingCookies, showQuickNamingModal, setQuickNamingActiveTab, quickNamingActiveTab, batchPastedText, setBatchPastedText, handleApplyBatchPastedNames };
}
