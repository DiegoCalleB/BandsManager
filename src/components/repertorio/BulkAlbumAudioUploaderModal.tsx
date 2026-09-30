import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Music,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  FileAudio,
  FolderUp,
  ArrowRight,
  Disc3,
  Check,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { Song, ThemeColors } from "../../types";
import { ModalPortal } from "../common/ModalPortal";
import { uploadFileToServer } from "../../utils/audioStorage";
import { formatSecondsToMmSs } from "../../utils/repertorioUtils";

interface BulkAlbumAudioUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumName?: string;
  albumSongs?: Song[];
  colors: ThemeColors;
  bandId?: string;
  isNewAlbumMode?: boolean;
  onSaveUpdatedSongs: (updatedSongs: Song[], newAlbumName?: string) => void;
}

interface UploadMatchItem {
  id: string;
  file: File;
  objectUrl: string;
  fileName: string;
  title: string;
  trackNumber: number;
  fileSizeFormatted: string;
  durationSeconds: number;
  matchedSongId: string | null; // null if unassigned or if creating new
  status: "idle" | "uploading" | "transcribing" | "success" | "error";
  uploadedUrl?: string;
  errorMsg?: string;
  chordsSource?: "audio_real" | "ia_sin_audio" | "plantilla_generica";
  esAproximado?: boolean;
}

export function BulkAlbumAudioUploaderModal({
  isOpen,
  onClose,
  albumName: initialAlbumName = "",
  albumSongs = [],
  colors,
  bandId,
  isNewAlbumMode = false,
  onSaveUpdatedSongs,
}: BulkAlbumAudioUploaderModalProps) {
  const [currentAlbumName, setCurrentAlbumName] = useState<string>(
    initialAlbumName || "",
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");
  const [items, setItems] = useState<UploadMatchItem[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  }>({
    current: 0,
    total: 0,
    currentName: "",
  });
  const [playingItemIndex, setPlayingItemIndex] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isCreatingBrandNewAlbum =
    isNewAlbumMode || !initialAlbumName || albumSongs.length === 0;

  // Stop audio when unmounting or closing
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Los hooks de arriba tienen que ejecutarse siempre (ver react-hooks/rules-of-hooks): este
  // guard vivía antes de ellos, así que abrir/cerrar el modal cambiaba cuántos hooks corrían.
  if (!isOpen) return null;

  const stopPreview = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setPlayingItemIndex(null);
  };

  const togglePlayAudio = (index: number) => {
    if (playingItemIndex === index) {
      stopPreview();
      return;
    }

    stopPreview();

    const target = items[index];
    if (!target) return;

    try {
      const audio = new Audio(target.objectUrl);
      audio.volume = 0.8;
      audio.onended = () => setPlayingItemIndex(null);
      audio.onerror = () => {
        setPlayingItemIndex(null);
      };
      audio.play().catch(() => setPlayingItemIndex(null));
      audioPlayerRef.current = audio;
      setPlayingItemIndex(index);
    } catch {
      setPlayingItemIndex(null);
    }
  };

  // Helper to format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Helper to clean up filenames into clean song titles
  const cleanFileNameToTitle = (
    filename: string,
  ): { title: string; trackNumber: number } => {
    const rawNoExt = filename.replace(/\.[^/.]+$/, "");
    let trackNumber = 1;

    // Detect leading track number: e.g."01 - Title","01. Title","01_Title","1 Title"
    const leadNumMatch = rawNoExt.match(/^0?(\d+)[\s._-]+(.+)$/);
    if (leadNumMatch) {
      trackNumber = parseInt(leadNumMatch[1], 10) || 1;
      const cleanTitle = leadNumMatch[2].replace(/[-_]+/g, " ").trim();
      return {
        title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
        trackNumber,
      };
    }

    const cleanTitle = rawNoExt.replace(/[-_]+/g, " ").trim();
    return {
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      trackNumber: 1,
    };
  };

  // Smart Matching algorithm: finds the best song for a given audio file when matching existing songs
  const findBestMatchingSong = (
    fileName: string,
    songs: Song[],
    alreadyAssignedSongIds: Set<string>,
  ): string | null => {
    const cleanName = fileName.toLowerCase().replace(/\.[^/.]+$/, "");

    // 1. Try track number regex match: e.g."01 - Song","1. Song","track 02","01_Song"
    const numMatch =
      cleanName.match(/^(?:track\s*[-_]?)?0?(\d+)/i) ||
      cleanName.match(/(?:[-_]|\s)0?(\d+)$/);
    if (numMatch && numMatch[1]) {
      const trackNum = parseInt(numMatch[1], 10);
      const songByTrack = songs.find(
        (s, idx) =>
          !alreadyAssignedSongIds.has(s.id) &&
          (s.ordenAlbum === trackNum || idx + 1 === trackNum),
      );
      if (songByTrack) return songByTrack.id;
    }

    // 2. Try exact/contains title match
    for (const s of songs) {
      if (alreadyAssignedSongIds.has(s.id)) continue;
      const sTitle = s.titulo.toLowerCase().trim();
      if (cleanName.includes(sTitle) || sTitle.includes(cleanName)) {
        return s.id;
      }
    }

    // 3. Default: first unassigned song in order
    const nextUnassigned = songs.find((s) => !alreadyAssignedSongIds.has(s.id));
    return nextUnassigned ? nextUnassigned.id : null;
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const handleFilesSelected = async (filesList: FileList | File[]) => {
    const rawFiles = Array.from(filesList).filter(
      (f) =>
        f.type.startsWith("audio/") ||
        /\.(mp3|wav|m4a|flac|ogg|aac|wma)$/i.test(f.name),
    );

    if (rawFiles.length === 0) {
      setFeedbackMsg({
        type: "error",
        text: "Por favor selecciona archivos de audio válidos (.mp3, .wav, .m4a, .flac, etc.).",
      });
      return;
    }

    setIsProcessingFiles(true);
    setFeedbackMsg(null);

    // Sort files naturally by name/track number
    rawFiles.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    const assignedSet = new Set<string>();
    const newItems: UploadMatchItem[] = [];

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      const objectUrl = URL.createObjectURL(file);
      const { title, trackNumber } = cleanFileNameToTitle(file.name);

      // Detect duration accurately
      let durationSec = 210;
      try {
        durationSec = await new Promise<number>((resolve) => {
          const tempA = new Audio(objectUrl);
          tempA.onloadedmetadata = () => {
            if (
              tempA.duration &&
              !isNaN(tempA.duration) &&
              tempA.duration > 0
            ) {
              resolve(Math.round(tempA.duration));
            } else {
              resolve(210);
            }
          };
          tempA.onerror = () => resolve(210);
          setTimeout(() => resolve(210), 2000);
        });
      } catch {
        durationSec = 210;
      }

      let matchedSongId: string | null = null;
      if (!isCreatingBrandNewAlbum) {
        matchedSongId = findBestMatchingSong(
          file.name,
          albumSongs,
          assignedSet,
        );
        if (matchedSongId) assignedSet.add(matchedSongId);
      }

      newItems.push({
        id: `upload_item_${Date.now()}_${i}`,
        file,
        objectUrl,
        fileName: file.name,
        title,
        trackNumber: trackNumber || i + 1,
        fileSizeFormatted: formatBytes(file.size),
        durationSeconds: durationSec,
        matchedSongId,
        status: "idle",
      });
    }

    setItems(newItems);
    setIsProcessingFiles(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleAssignChange = (itemIndex: number, newSongId: string) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === itemIndex) {
          return { ...item, matchedSongId: newSongId || null };
        }
        if (newSongId && item.matchedSongId === newSongId) {
          return { ...item, matchedSongId: null };
        }
        return item;
      }),
    );
  };

  const handleTitleChange = (itemIndex: number, newTitle: string) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === itemIndex ? { ...item, title: newTitle } : item,
      ),
    );
  };

  const handleStartUpload = async () => {
    const finalAlbumTitle = currentAlbumName.trim() || "Nuevo Álbum";

    if (items.length === 0) {
      setFeedbackMsg({
        type: "error",
        text: "Debes arrastrar o seleccionar los archivos de audio del disco.",
      });
      return;
    }

    if (!bandId) {
      setFeedbackMsg({
        type: "error",
        text: "No hay ninguna banda activa para subir este álbum.",
      });
      return;
    }

    if (!isCreatingBrandNewAlbum) {
      const validMatches = items.filter((it) => it.matchedSongId !== null);
      if (validMatches.length === 0) {
        setFeedbackMsg({
          type: "error",
          text: "Debes emparejar al menos un archivo de audio con una canción existente.",
        });
        return;
      }
    }

    setIsUploading(true);
    stopPreview();
    setFeedbackMsg(null);

    const token = localStorage.getItem("bakandeya_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // 1. Upload Cover if present
    let uploadedCoverUrl = coverPreviewUrl;
    if (coverFile) {
      try {
        uploadedCoverUrl = await uploadFileToServer(coverFile, {
          bandId: bandId,
          category: "portada",
          folder: `portadas/${finalAlbumTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
        });
      } catch (covErr) {
        console.warn("Cover upload fallback:", covErr);
      }
    }

    const updatedSongsMap = new Map<string, Song>();
    albumSongs.forEach((s) => updatedSongsMap.set(s.id, s));

    const newlyCreatedSongs: Song[] = [];
    let successCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      setUploadProgress({
        current: i + 1,
        total: items.length,
        currentName: item.fileName,
      });

      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i ? { ...it, status: "uploading" } : it,
        ),
      );

      try {
        // Upload audio file to backend / Supabase Storage
        const uploadedUrl = await uploadFileToServer(item.file, {
          bandId: bandId,
          category: "audio",
          folder: `discografia/${finalAlbumTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
        });

        const newDurationFormatted = formatSecondsToMmSs(item.durationSeconds);
        const newDurationMins = Math.max(
          1,
          Math.round(item.durationSeconds / 60),
        );

        if (isCreatingBrandNewAlbum || !item.matchedSongId) {
          // CREATE NEW SONG IN DATABASE
          const newSong: Song = {
            id: `song_bulk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            titulo: item.title || `Pista ${i + 1}`,
            artista: bandId,
            album: finalAlbumTitle,
            albumDisco: finalAlbumTitle,
            ordenAlbum: item.trackNumber || i + 1,
            duracion: newDurationFormatted,
            duracionSegundos: item.durationSeconds,
            duracionMinutos: newDurationMins,
            audioPrincipalUrl: uploadedUrl,
            portadaUrl: uploadedCoverUrl || undefined,
            estadoTema: "listo",
            bpm: 120,
            tonalidad: "Am",
            audioIdeas: [
              {
                id: `idea_master_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                titulo: "Audio Máster Completo (Estudio)",
                seccion: "general",
                audioUrl: uploadedUrl,
                subidoPor: "Subida Disco",
                fecha: new Date().toISOString(),
              },
            ],
          };

          const postRes = await fetch("/api/songs", {
            method: "POST",
            headers,
            body: JSON.stringify(newSong),
          });

          if (postRes.ok) {
            const savedData = await postRes.json();
            const savedSong = savedData?.song || newSong;
            newlyCreatedSongs.push(savedSong);
            successCount++;
            setItems((prev) =>
              prev.map((it, idx) =>
                idx === i ? { ...it, status: "transcribing", uploadedUrl } : it,
              ),
            );
            try {
              const chordRes = await fetch("/api/generate-song-chords", {
                method: "POST",
                headers,
                body: JSON.stringify({
                  songId: savedSong.id,
                  titulo: savedSong.titulo,
                  tonalidad: savedSong.tonalidad,
                  bpm: savedSong.bpm,
                  audioUrl: uploadedUrl,
                }),
              });
              const chordData = await chordRes.json();
              setItems((prev) =>
                prev.map((it, idx) =>
                  idx === i
                    ? {
                        ...it,
                        status: "success",
                        uploadedUrl,
                        chordsSource: chordData?.chordsSource,
                        esAproximado: chordData?.esAproximado,
                      }
                    : it,
                ),
              );
            } catch (chordErr) {
              console.warn(
                "No se pudieron analizar los acordes de",
                savedSong.titulo,
                chordErr,
              );
              setItems((prev) =>
                prev.map((it, idx) =>
                  idx === i ? { ...it, status: "success", uploadedUrl } : it,
                ),
              );
            }
          } else {
            throw new Error(`HTTP ${postRes.status}`);
          }
        } else {
          // UPDATE EXISTING SONG
          const targetSong = updatedSongsMap.get(item.matchedSongId);
          if (targetSong) {
            const updatedSong: Song = {
              ...targetSong,
              duracion: newDurationFormatted,
              duracionSegundos: item.durationSeconds,
              duracionMinutos: newDurationMins,
              audioPrincipalUrl: uploadedUrl,
              portadaUrl: uploadedCoverUrl || targetSong.portadaUrl,
              audioIdeas: [
                {
                  id: `idea_master_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  titulo: "Audio Máster Completo (Estudio)",
                  seccion: "general",
                  audioUrl: uploadedUrl,
                  subidoPor: "Subida Disco",
                  fecha: new Date().toISOString(),
                },
                ...(targetSong.audioIdeas || []).filter(
                  (a) => !a.titulo.toLowerCase().includes("preview oficial"),
                ),
              ],
            };

            const putRes = await fetch(
              `/api/songs/${encodeURIComponent(updatedSong.id)}`,
              {
                method: "PUT",
                headers,
                body: JSON.stringify(updatedSong),
              },
            );

            if (putRes.ok) {
              const savedData = await putRes.json();
              const finalSaved = savedData?.song || updatedSong;
              updatedSongsMap.set(finalSaved.id, finalSaved);
              successCount++;
              setItems((prev) =>
                prev.map((it, idx) =>
                  idx === i
                    ? { ...it, status: "transcribing", uploadedUrl }
                    : it,
                ),
              );
              try {
                const chordRes = await fetch("/api/generate-song-chords", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({
                    songId: finalSaved.id,
                    titulo: finalSaved.titulo,
                    tonalidad: finalSaved.tonalidad,
                    bpm: finalSaved.bpm,
                    audioUrl: uploadedUrl,
                  }),
                });
                const chordData = await chordRes.json();
                setItems((prev) =>
                  prev.map((it, idx) =>
                    idx === i
                      ? {
                          ...it,
                          status: "success",
                          uploadedUrl,
                          chordsSource: chordData?.chordsSource,
                          esAproximado: chordData?.esAproximado,
                        }
                      : it,
                  ),
                );
              } catch (chordErr) {
                console.warn(
                  "No se pudieron analizar los acordes de",
                  finalSaved.titulo,
                  chordErr,
                );
                setItems((prev) =>
                  prev.map((it, idx) =>
                    idx === i ? { ...it, status: "success", uploadedUrl } : it,
                  ),
                );
              }
            } else {
              throw new Error(`HTTP ${putRes.status}`);
            }
          }
        }
      } catch (err: any) {
        console.error(`Error uploading track ${item.fileName}:`, err);
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: "error",
                  errorMsg: err?.message || "Error al subir",
                }
              : it,
          ),
        );
      }
    }

    setIsUploading(false);

    if (isCreatingBrandNewAlbum) {
      onSaveUpdatedSongs(newlyCreatedSongs, finalAlbumTitle);
    } else {
      const finalUpdatedList = Array.from(updatedSongsMap.values());
      onSaveUpdatedSongs(finalUpdatedList, finalAlbumTitle);
    }

    setFeedbackMsg({
      type: "success",
      text: `¡${successCount} pistas completas guardadas con éxito en el álbum "${finalAlbumTitle}"!`,
    });
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[var(--r-l)] overflow-hidden ${"bg-[var(--surface)] text-[var(--ink)]"}`}
      >
        {/* Modal Header */}
        <div className="p-6 flex items-center justify-between shrink-0 bg-[var(--ok)]/10 ">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[var(--r-l)] bg-[var(--surface)]/20 flex items-center justify-center text-[var(--ok)]">
              <FolderUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-display font-black tracking-tight flex items-center gap-2">
                <span>
                  {isCreatingBrandNewAlbum
                    ? "Crear Álbum desde Carpeta / MP3s"
                    : "Subir Canciones Completas del Disco"}
                </span>
              </h3>
              <p className="text-xs font-sans opacity-60 mt-0.5 flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span className="font-bold text-[var(--ok)]">
                  {currentAlbumName || "Nuevo Álbum"}
                </span>
                <span>
                  •{" "}
                  {isCreatingBrandNewAlbum
                    ? `${items.length} pistas seleccionadas`
                    : `${albumSongs.length} temas en catálogo`}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-2.5 rounded-[var(--r-l)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/10 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Form (Album Title & Cover for New Album) */}
          {isCreatingBrandNewAlbum && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-[var(--r-l)] bg-[var(--ink)]/5">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-sans font-bold text-[var(--ink-2)]">
                  Nombre del Álbum / Disco
                </label>
                <input
                  type="text"
                  value={currentAlbumName}
                  onChange={(e) => setCurrentAlbumName(e.target.value)}
                  placeholder="Ej. Grandes Éxitos, Maqueta 2026, Álbum Debut..."
                  className="w-full text-sm font-bold rounded-[var(--r-m)] px-4 py-2.5 outline-none transition bg-[var(--sunken)] text-[var(--ink)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-sans font-bold text-[var(--ink-2)]">
                  Portada del Disco
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className={`w-full py-2.5 px-3 rounded-[var(--r-m)] flex items-center justify-center gap-2 text-xs font-sans font-bold cursor-pointer transition ${
                    coverPreviewUrl
                      ? "text-[var(--ok)] bg-[var(--ok)]/10"
                      : "bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--ink-2)]"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>
                    {coverFile
                      ? coverFile.name.substring(0, 15) + "..."
                      : "Subir Portada"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 rounded-[var(--r-l)] text-center cursor-pointer transition-ui flex flex-col items-center justify-center gap-3 ${
              items.length > 0
                ? "bg-[var(--ok)]/10"
                : "bg-[var(--surface)]/5 hover:bg-[var(--ok)]/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg"
              onChange={(e) =>
                e.target.files && handleFilesSelected(e.target.files)
              }
              className="hidden"
            />

            <div className="w-14 h-14 rounded-[var(--r-l)] bg-[var(--ink)]/10 flex items-center justify-center text-[var(--ok)]">
              {isProcessingFiles ? (
                <RefreshCw className="w-7 h-7 animate-spin" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className="text-base font-bold">
                {items.length > 0
                  ? `${items.length} archivos de audio cargados`
                  : "Arrastra aquí todos los archivos de audio del disco"}
              </p>
              <p className="text-xs font-sans opacity-60 mt-1">
                o haz clic para explorar tu carpeta de música (MP3, WAV, FLAC,
                M4A)
              </p>
            </div>
          </div>

          {/* Feedback messages */}
          {feedbackMsg && (
            <div
              className={`p-4 rounded-[var(--r-l)] flex items-center gap-3 text-xs font-sans ${
                feedbackMsg.type === "success"
                  ? "bg-[var(--ok)]/10 text-[var(--ok)]"
                  : "bg-[var(--alert)]/10 text-[var(--alert)]"
              }`}
            >
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Upload Progress Bar (when active) */}
          {isUploading && (
            <div className="p-4 rounded-[var(--r-l)] bg-[var(--ink)]/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="flex items-center gap-2 text-[var(--ok)] font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Subiendo pista {uploadProgress.current} de{" "}
                  {uploadProgress.total}...
                </span>
                <span className="text-[var(--ink-2)] truncate max-w-[200px]">
                  {uploadProgress.currentName}
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--surface)]/80 rounded-[var(--r-pill)] overflow-hidden">
                <div
                  className="h-full bg-[var(--surface)] transition-ui duration-300 rounded-[var(--r-pill)]"
                  style={{
                    width: `${(uploadProgress.current / Math.max(1, uploadProgress.total)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Tracks List / Matching Table */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-sans font-bold text-[var(--ink-2)] px-1">
                <span>
                  {isCreatingBrandNewAlbum
                    ? "Pistas del Nuevo Álbum"
                    : "Archivos de Audio & Asignación"}
                </span>
                <span>
                  {items.length} {items.length === 1 ? "pista" : "pistas"}
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const isPlaying = playingItemIndex === idx;

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-[var(--r-l)] transition-ui flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        item.status === "success"
                          ? "bg-[var(--ok)]/10"
                          : item.status === "error"
                            ? "bg-[var(--alert)]/10"
                            : "bg-[var(--surface)]/90"
                      }`}
                    >
                      {/* Left: Audio file preview & details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => togglePlayAudio(idx)}
                          className={`w-9 h-9 rounded-[var(--r-m)] flex items-center justify-center shrink-0 transition-ui cursor-pointer ${
                            isPlaying
                              ? "bg-[var(--surface)] text-[var(--ink)]"
                              : "bg-[var(--ink)]/10 hover:bg-[var(--surface)] hover:text-[var(--ink)] text-[var(--ink-2)]"
                          }`}
                          title={isPlaying ? "Pausar audio" : "Escuchar previo"}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          {isCreatingBrandNewAlbum ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-sans text-[var(--ink-2)] w-5">
                                #{item.trackNumber || idx + 1}
                              </span>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) =>
                                  handleTitleChange(idx, e.target.value)
                                }
                                className={`text-xs font-bold rounded-[var(--r-s)] px-2.5 py-1 outline-none w-full bg-[var(--sunken)] text-[var(--ink)]`}
                                placeholder="Título de la canción"
                              />
                            </div>
                          ) : (
                            <p className="text-xs font-bold truncate flex items-center gap-2">
                              <FileAudio className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
                              <span className="truncate">{item.fileName}</span>
                            </p>
                          )}
                          <p className="text-xs font-sans text-[var(--ink-2)] mt-0.5">
                            {item.fileSizeFormatted} •{" "}
                            {formatSecondsToMmSs(item.durationSeconds)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Assigned song dropdown for existing album */}
                      {!isCreatingBrandNewAlbum && (
                        <div className="flex items-center gap-2 min-w-0 md:w-[320px]">
                          <select
                            value={item.matchedSongId || ""}
                            disabled={isUploading || item.status === "success"}
                            onChange={(e) =>
                              handleAssignChange(idx, e.target.value)
                            }
                            className={`w-full text-xs font-sans rounded-[var(--r-m)] px-3 py-2 cursor-pointer outline-none transition ${
                              item.matchedSongId
                                ? "bg-[var(--sunken)] text-[var(--ink)] font-bold"
                                : "bg-[var(--sunken)] text-[var(--ink-2)]"
                            }`}
                          >
                            <option value="">-- No asignar a ninguna --</option>
                            {albumSongs.map((s, sIdx) => (
                              <option key={s.id} value={s.id}>
                                Pista {s.ordenAlbum || sIdx + 1}: {s.titulo} (
                                {s.duracion || "3:30"})
                              </option>
                            ))}
                          </select>

                          {/* Status Icon */}
                          {item.status === "success" && (
                            <span
                              className={`p-1 ${item.chordsSource === "plantilla_generica" ? "text-[var(--acc)]" : "text-[var(--ok)]"}`}
                              title={
                                item.chordsSource === "plantilla_generica"
                                  ? "Cifrado de plantilla: revísalo antes de usar"
                                  : item.chordsSource === "audio_real"
                                    ? "Transcritos del audio real"
                                    : item.esAproximado
                                      ? "Acordes aproximados: verifícalos"
                                      : "Cifrado propuesto por IA"
                              }
                            >
                              <Check className="w-4 h-4" />
                            </span>
                          )}
                          {item.status === "uploading" && (
                            <span
                              className="p-1 text-[var(--ok)]"
                              title="Subiendo..."
                            >
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            </span>
                          )}
                          {item.status === "transcribing" && (
                            <span
                              className="p-1 text-[var(--acc)]"
                              title="Analizando letra y acordes con IA..."
                            >
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            </span>
                          )}
                        </div>
                      )}

                      {/* Status Icon for New Album */}
                      {isCreatingBrandNewAlbum && (
                        <div className="flex items-center justify-end">
                          {item.status === "success" && (
                            <span
                              className={`px-2 py-1 rounded text-xs font-sans flex items-center gap-1 ${
                                item.chordsSource === "plantilla_generica"
                                  ? "bg-[var(--acc)]/20 text-[var(--acc)]"
                                  : "bg-[var(--ok)]/20 text-[var(--ok)]"
                              }`}
                              title={
                                item.chordsSource === "plantilla_generica"
                                  ? "Cifrado de plantilla: revísalo antes de usar"
                                  : item.chordsSource === "audio_real"
                                    ? "Transcritos del audio real"
                                    : item.esAproximado
                                      ? "Acordes aproximados: verifícalos"
                                      : "Cifrado propuesto por IA"
                              }
                            >
                              <Check className="w-3.5 h-3.5" />
                              {" "}
                              {item.chordsSource === "plantilla_generica"
                                ? "Plantilla"
                                : "Guardado"}
                            </span>
                          )}
                          {item.status === "uploading" && (
                            <span className="px-2 py-1 rounded bg-[var(--ok)]/10 text-[var(--ok)] text-xs font-sans flex items-center gap-1">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />{" "}
                              Subiendo
                            </span>
                          )}
                          {item.status === "transcribing" && (
                            <span className="px-2 py-1 rounded bg-[var(--tentative)]/10 text-[var(--tentative)]/80 text-xs font-sans flex items-center gap-1">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />{" "}
                              Analizando acordes (IA)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 flex items-center justify-between shrink-0 bg-[var(--sunken)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-[var(--r-l)] hover:bg-[var(--ink)]/5 text-xs font-sans font-bold transition cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleStartUpload}
            disabled={isUploading || items.length === 0}
            className="px-6 py-2.5 rounded-[var(--r-l)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] text-xs font-sans font-bold flex items-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Guardando Pistas...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>
                  {isCreatingBrandNewAlbum
                    ? `Crear Disco con ${items.length} Pistas`
                    : `Guardar Pistas Completas`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
