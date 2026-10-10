/**
 * Cuentas sociales conectadas y publicación directa del clip.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useState } from "react";
import { BandSocialAccount, SocialPost } from "../../../types";
import { apiFetch } from "../../../utils/api";
import type { PublishNowResponse, SocialAccountsResponse } from "../reelsApiTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SocialPublishingParams {
  bandName: string;
  selectedPlatform: "Instagram" | "TikTok" | "YouTube" | "Facebook";
  scheduledDate: string;
  scheduledTime: string;
  editedCopy: string;
  renderedClipUrl: string;
  youtubeUrl: string;
  onAddPost: (post: SocialPost) => Promise<void>;
}

/**
 * Cuentas sociales conectadas y publicación directa del clip.
 * @param params Estado y callbacks del contenedor ({@link SocialPublishingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSocialPublishing({ bandName, selectedPlatform, scheduledDate, scheduledTime, editedCopy, renderedClipUrl, youtubeUrl, onAddPost }: SocialPublishingParams) {
  // Despacho Automático y Cuentas Sociales Oficiales
  const [autoPublishEnabled, setAutoPublishEnabled] = useState<boolean>(true);

  const [socialAccounts, setSocialAccounts] = useState<BandSocialAccount[]>([]);

  const [isPublishingNow, setIsPublishingNow] = useState<boolean>(false);

  const [publishNowSuccess, setPublishNowSuccess] = useState<string | null>(
    null,
  );

  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
    null,
  );

  const [connectHandleInput, setConnectHandleInput] = useState<string>("");

  // Cargar cuentas vinculadas
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await apiFetch<SocialAccountsResponse>("/api/social/accounts");
        if (res?.success && Array.isArray(res.accounts)) {
          setSocialAccounts(res.accounts);
        }
      } catch (err) {
        console.warn("No se pudieron cargar las cuentas sociales:", err);
      }
    };
    fetchAccounts();
  }, []);

  // Conectar cuenta social en 1 clic
  const handleConnectSocialAccount = async (
    platform: "Instagram" | "TikTok" | "YouTube",
  ) => {
    setConnectingPlatform(platform);
    try {
      const defaultHandle = `@${(bandName || "banda").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      const handleToUse = connectHandleInput.trim() || defaultHandle;
      const res = await apiFetch<SocialAccountsResponse>("/api/social/accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plataforma: platform,
          handle: handleToUse,
          account_name: `${bandName || "Banda"} Oficial`,
        }),
      });
      if (res?.success && res.account) {
        setSocialAccounts((prev) => [
          res.account,
          ...prev.filter((a) => a.plataforma !== platform),
        ]);
        setShowConnectModal(false);
        setConnectHandleInput("");
      }
    } catch (err) {
      console.error("Error conectando cuenta:", err);
      alert("No se pudo vincular la cuenta.");
    } finally {
      setConnectingPlatform(null);
    }
  };

  // Publicación inmediata 1-clic
  const handlePublishNowDirectly = async () => {
    setIsPublishingNow(true);
    setPublishNowSuccess(null);
    try {
      const newPostId = `post-${Date.now()}`;
      const activeAccount = socialAccounts.find(
        (a) => a.plataforma?.toLowerCase() === selectedPlatform.toLowerCase(),
      );
      const handleToUse =
        activeAccount?.handle ||
        `@${(bandName || "banda").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

      const newPost: SocialPost = {
        id: newPostId,
        fecha: scheduledDate,
        hora_programada: scheduledTime,
        plataforma: selectedPlatform,
        contenido: editedCopy,
        estado: "en_cola",
        responsable: "Banda",
        video_url: renderedClipUrl || youtubeUrl,
        media_type: "reel",
        auto_publish: true,
        account_handle: handleToUse,
      };

      await onAddPost(newPost);

      const res = await apiFetch<PublishNowResponse>(`/api/social/publish-now/${newPostId}`, {
        method: "POST",
      });

      if (res?.success) {
        setPublishNowSuccess(
          `¡Publicado con éxito en ${selectedPlatform}! (${handleToUse}) 🎉`,
        );
        setTimeout(() => setPublishNowSuccess(null), 6000);
      } else {
        alert(res?.error || "Error al publicar.");
      }
    } catch (err) {
      console.error("Error en publicación directa:", err);
      alert("Error de conexión al despachar el Reel.");
    } finally {
      setIsPublishingNow(false);
    }
  };

  return { socialAccounts, autoPublishEnabled, setAutoPublishEnabled, setShowConnectModal, setConnectHandleInput, handlePublishNowDirectly, isPublishingNow, publishNowSuccess, showConnectModal, connectHandleInput, connectingPlatform, handleConnectSocialAccount };
}
