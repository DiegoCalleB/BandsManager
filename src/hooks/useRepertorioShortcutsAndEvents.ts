import { useState, useRef } from "react";
import { SetlistItem, SetlistShortcut } from "../types";
import { getLowLatencyAudioStream } from "../utils/audioLatency";
import { uploadFileToServer } from "../utils/audioStorage";

export interface UseRepertorioShortcutsAndEventsProps {
  getHeaders: () => Record<string, string>;
  setCustomShortcuts: React.Dispatch<React.SetStateAction<SetlistShortcut[]>>;
  handleAddItemToSetlist: (
    songId?: string,
    tipoItem?: any,
    tituloCustom?: string,
    duracionEstimadaMinutos?: number,
    duracionEstimadaSegundos?: number,
    notaTema?: string,
  ) => void;
}

export function useRepertorioShortcutsAndEvents({
  getHeaders,
  setCustomShortcuts,
  handleAddItemToSetlist,
}: UseRepertorioShortcutsAndEventsProps) {
  // Accesos rápidos personalizados
  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [newShortcutIcon, setNewShortcutIcon] = useState("⭐");
  const [newShortcutLabel, setNewShortcutLabel] = useState("");
  const [newShortcutMinutes, setNewShortcutMinutes] = useState<number>(1);

  // Show Event / Interludio Modal State & Mic Recorder
  const [showShowItemModal, setShowShowItemModal] = useState(false);
  const [editingShowItem, setEditingShowItem] = useState<SetlistItem | null>(null);
  const [showItemAudioUrl, setShowItemAudioUrl] = useState<string>("");
  const [isRecordingShowItem, setIsRecordingShowItem] = useState<boolean>(false);
  const [recordingShowItemSecs, setRecordingShowItemSecs] = useState<number>(0);
  const showItemMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const showItemChunksRef = useRef<Blob[]>([]);
  const showItemTimerRef = useRef<any>(null);

  const handleUseCustomShortcut = (sc: SetlistShortcut) => {
    handleAddItemToSetlist(
      undefined,
      "otro",
      sc.tituloCustom,
      sc.duracionEstimadaMinutos,
      sc.duracionEstimadaSegundos,
      sc.notaTema,
    );
  };

  const handleCreateShortcut = async () => {
    const etiqueta = newShortcutLabel.trim();
    if (!etiqueta) return;
    try {
      const res = await fetch("/api/setlist-shortcuts", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          icono: newShortcutIcon.trim() || "⭐",
          etiqueta,
          tituloCustom: etiqueta,
          duracionEstimadaMinutos: newShortcutMinutes,
          duracionEstimadaSegundos: newShortcutMinutes * 60,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shortcut) {
          setCustomShortcuts((prev) => [...prev, data.shortcut]);
        }
      }
    } catch (err) {
      console.error("Error al crear el acceso rápido:", err);
    } finally {
      setNewShortcutLabel("");
      setNewShortcutIcon("⭐");
      setNewShortcutMinutes(1);
      setIsAddingShortcut(false);
    }
  };

  const handleDeleteShortcut = async (id: string) => {
    setCustomShortcuts((prev) => prev.filter((sc) => sc.id !== id));
    try {
      await fetch(`/api/setlist-shortcuts/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
    } catch (err) {
      console.error("Error al eliminar el acceso rápido:", err);
    }
  };

  const handleStartRecordingShowItem = async () => {
    try {
      const stream = await getLowLatencyAudioStream();
      const mediaRecorder = new MediaRecorder(stream);
      showItemMediaRecorderRef.current = mediaRecorder;
      showItemChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          showItemChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(showItemChunksRef.current, {
          type: "audio/webm",
        });
        const file = new File(
          [audioBlob],
          `recording-show-${Date.now()}.webm`,
          { type: "audio/webm" },
        );
        try {
          const serverUrl = await uploadFileToServer(file);
          setShowItemAudioUrl(serverUrl);
        } catch (err) {
          console.error("Error uploading show item recording to server disk:", err);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecordingShowItem(true);
      setRecordingShowItemSecs(0);

      showItemTimerRef.current = setInterval(() => {
        setRecordingShowItemSecs((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Microphone access warning:", err?.message || err);
      alert(
        "No se pudo acceder al micrófono (" +
          (err?.message || "permisos denegados") +
          "). Por favor, comprueba los permisos de audio en tu navegador.",
      );
    }
  };

  const handleStopRecordingShowItem = () => {
    if (showItemMediaRecorderRef.current && isRecordingShowItem) {
      showItemMediaRecorderRef.current.stop();
      setIsRecordingShowItem(false);
      if (showItemTimerRef.current) {
        clearInterval(showItemTimerRef.current);
      }
    }
  };

  const handleShowItemAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await uploadFileToServer(file);
      setShowItemAudioUrl(base64);

      const audioObj = new Audio(base64);
      audioObj.onloadedmetadata = () => {
        if (audioObj.duration && !isNaN(audioObj.duration)) {
          setRecordingShowItemSecs(Math.round(audioObj.duration));
        }
      };
    } catch (err) {
      console.error("Error uploading audio file for show item:", err);
    }
  };

  return {
    isAddingShortcut,
    setIsAddingShortcut,
    newShortcutIcon,
    setNewShortcutIcon,
    newShortcutLabel,
    setNewShortcutLabel,
    newShortcutMinutes,
    setNewShortcutMinutes,
    showShowItemModal,
    setShowShowItemModal,
    editingShowItem,
    setEditingShowItem,
    showItemAudioUrl,
    setShowItemAudioUrl,
    isRecordingShowItem,
    recordingShowItemSecs,
    handleUseCustomShortcut,
    handleCreateShortcut,
    handleDeleteShortcut,
    handleStartRecordingShowItem,
    handleStopRecordingShowItem,
    handleShowItemAudioFileUpload,
  };
}
