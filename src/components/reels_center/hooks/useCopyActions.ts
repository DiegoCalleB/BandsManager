/**
 * Genera, edita, copia y programa el texto del reel para cada plataforma.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction } from "react";
import { BandSocialAccount, SocialPost } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { getCadenceWarnings, HighlightClip, validateScheduleReadiness } from "../../../utils/reelsUtils";
import type { CopyGenerationResponse } from "../reelsApiTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CopyActionsParams {
  editedCopy: string;
  scheduledDate: string;
  scheduledTime: string;
  setScheduleErrors: Dispatch<SetStateAction<string[]>>;
  setScheduleWarnings: Dispatch<SetStateAction<string[]>>;
  posts: SocialPost[];
  selectedPlatform: "Instagram" | "TikTok" | "YouTube" | "Facebook";
  setIsScheduling: Dispatch<SetStateAction<boolean>>;
  setSchedulingSuccess: Dispatch<SetStateAction<boolean>>;
  socialAccounts: BandSocialAccount[];
  instagramHandle: string;
  bandName: string;
  renderedClipUrl: string;
  youtubeUrl: string;
  autoPublishEnabled: boolean;
  onAddPost: (post: SocialPost) => Promise<void>;
  setCopyObjective: Dispatch<SetStateAction<"viral" | "comunidad" | "conversion">>;
  highlights: HighlightClip[];
  selectedHighlightIndex: number;
  setEditedCopy: Dispatch<SetStateAction<string>>;
  setCopiedNotification: Dispatch<SetStateAction<boolean>>;
  setCopySuccess: Dispatch<SetStateAction<boolean>>;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  reelIdea: string;
  setGeneratedCopy: Dispatch<SetStateAction<string>>;
  nombreBanda: string;
  setUploadProgress: Dispatch<SetStateAction<number>>;
}

/**
 * Genera, edita, copia y programa el texto del reel para cada plataforma.
 * @param params Estado y callbacks del contenedor ({@link CopyActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCopyActions({ editedCopy, scheduledDate, scheduledTime, setScheduleErrors, setScheduleWarnings, posts, selectedPlatform, setIsScheduling, setSchedulingSuccess, socialAccounts, instagramHandle, bandName, renderedClipUrl, youtubeUrl, autoPublishEnabled, onAddPost, setCopyObjective, highlights, selectedHighlightIndex, setEditedCopy, setCopiedNotification, setCopySuccess, setIsGenerating, reelIdea, setGeneratedCopy, nombreBanda, setUploadProgress }: CopyActionsParams) {
  // Submit and Schedule Post
  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const problemas = validateScheduleReadiness({
      copy: editedCopy,
      scheduledDate,
      scheduledTime,
    });
    setScheduleErrors(problemas);
    // La cadencia es un aviso, no un bloqueo: se calcula igualmente para enseñarlo junto al post ya programado.
    setScheduleWarnings(
      getCadenceWarnings({
        posts,
        platform: selectedPlatform,
        scheduledDate,
        scheduledTime,
      }),
    );
    if (problemas.length > 0) return;

    setIsScheduling(true);
    setSchedulingSuccess(false);

    try {
      const activeAccount = socialAccounts.find(
        (a) => a.plataforma?.toLowerCase() === selectedPlatform.toLowerCase(),
      );
      const handleToUse =
        activeAccount?.handle ||
        instagramHandle ||
        `@${(bandName || "banda").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

      const newPost: SocialPost = {
        id: `post-${Date.now()}`,
        fecha: scheduledDate,
        hora_programada: scheduledTime,
        plataforma: selectedPlatform,
        contenido: editedCopy,
        estado: "aprobado",
        responsable: "Banda",
        video_url: renderedClipUrl || youtubeUrl,
        media_type: "reel",
        auto_publish: autoPublishEnabled,
        account_handle: handleToUse,
      };

      await onAddPost(newPost);
      setSchedulingSuccess(true);
      setScheduleErrors([]);

      // Auto-clear success state after a few seconds
      setTimeout(() => {
        setSchedulingSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error al programar publicación:", err);
      alert("Hubo un error al guardar la publicación en el servidor local.");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSwitchCopyObjective = (
    obj: "viral" | "comunidad" | "conversion",
  ) => {
    setCopyObjective(obj);
    const clip = highlights[selectedHighlightIndex];
    if (!clip) return;
    if (obj === "viral") {
      setEditedCopy(clip.copyViral || clip.recommendedCopy || "");
    } else if (obj === "comunidad") {
      setEditedCopy(clip.copyComunidad || clip.recommendedCopy || "");
    } else if (obj === "conversion") {
      setEditedCopy(clip.copyConversion || clip.recommendedCopy || "");
    }
  };

  const handleCopyFormattedPost = () => {
    const clip = highlights[selectedHighlightIndex];
    if (!clip) return;

    const hook = clip.hookText
      ? `🎯 [GANCHO EN PANTALLA: "${clip.hookText}"]\n\n`
      : "";
    const copyText = editedCopy.trim();
    const ctaText = clip.cta ? `\n\n👉 ${clip.cta}` : "";
    const tagsText =
      clip.hashtags && clip.hashtags.length > 0
        ? `\n\n${clip.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`
        : "";

    const fullFormatted = `${hook}${copyText}${ctaText}${tagsText}`;

    navigator.clipboard
      .writeText(fullFormatted)
      .then(() => {
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2500);
      })
      .catch((err) => {
        console.error("Error al copiar post formateado:", err);
      });
  };


  // Copy text to clipboard helper
  const handleCopyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error("Error copying to clipboard:", err);
      });
  };

  const handleGenerateCopy = async (style: "hype" | "chill") => {
    setIsGenerating(true);
    try {
      const response = await apiFetch("/api/write-reels-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: reelIdea, style }),
      });
      const data = response as CopyGenerationResponse;
      if (data?.success && data.text) {
        setGeneratedCopy(data.text);
      } else {
        alert(
          "Hubo un problema al generar el texto. Mostrando plantilla de respaldo.",
        );
      }
    } catch (err) {
      console.error(err);
      if (style === "hype") {
        setGeneratedCopy(
          `⚡️ ¡FUEGO EN EL ESCENARIO! 🔥\n\n${nombreBanda} no tiene freno: ${reelIdea}. ¡Prepárate para sudar la camiseta! 🔥🎸\n\n#MusicaEnDirecto #Directo`,
        );
      } else {
        setGeneratedCopy(
          `🌊 Respirando hondo, dejando fluir el ritmo... 🍀\n\n${nombreBanda} conectando ideas en el local: ${reelIdea}. Buenas energías para el camino. ✨\n\n#MusicaEnDirecto #Local`,
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setUploadProgress(null), 1500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return { handleGenerateCopy, handleSchedulePost, handleSwitchCopyObjective, handleCopyFormattedPost, handleSimulateUpload, handleCopyToClipboard };
}
