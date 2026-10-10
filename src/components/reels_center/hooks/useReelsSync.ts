/**
 * Sincroniza los reels publicados desde la hoja de cálculo.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { apiFetch } from "../../../utils/api";
import { getErrorMessage } from "../../../utils/errorMessage";
import type { SyncPostsResponse } from "../reelsApiTypes";

/**
 * Sincroniza los reels publicados desde la hoja de cálculo.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useReelsSync() {
  // Sync state
  const [isSyncingReels, setIsSyncingReels] = useState(false);

  const [syncSuccessMessage, setSyncSuccessMessage] = useState("");

  const [syncErrorMessage, setSyncErrorMessage] = useState("");

  const handleSyncReels = async () => {
    setIsSyncingReels(true);
    setSyncSuccessMessage("");
    setSyncErrorMessage("");
    try {
      const data = await apiFetch<SyncPostsResponse>("/api/posts/sync", {
        method: "POST",
      });
      if (data?.success) {
        setSyncSuccessMessage(
          data.message || "Publicaciones y Reels sincronizados con éxito.",
        );
        // clear after 6 seconds
        setTimeout(() => setSyncSuccessMessage(""), 6000);
      } else {
        setSyncErrorMessage(
          data?.error || "Error al intentar sincronizar los Reels.",
        );
      }
    } catch (error) {
      console.error("Error synchronizing reels:", error);
      setSyncErrorMessage(getErrorMessage(error, "Error de conexión con el servidor."));
    } finally {
      setIsSyncingReels(false);
    }
  };

  return { handleSyncReels, isSyncingReels, syncSuccessMessage, setSyncSuccessMessage, syncErrorMessage, setSyncErrorMessage };
}
