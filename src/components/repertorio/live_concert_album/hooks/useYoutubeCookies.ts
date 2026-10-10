/**
 * Gestiona la sesión/cookies de YouTube de la banda para descargar audio sin bloqueos.
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import { getErrorMessage } from "../../../../utils/errorMessage";
import type { CookiesStatusResponse, SaveCookiesResponse } from "../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface YoutubeCookiesParams {
  isOpen: boolean;
  setErrorMessage: Dispatch<SetStateAction<string>>;
}

/**
 * Gestiona la sesión/cookies de YouTube de la banda para descargar audio sin bloqueos.
 * @param params Estado y callbacks del contenedor ({@link YoutubeCookiesParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useYoutubeCookies({ isOpen, setErrorMessage }: YoutubeCookiesParams) {
  // YouTube Band Account & Cookies Authentication State
  const [hasYoutubeCookies, setHasYoutubeCookies] = useState(false);

  const [cookieModalOpen, setCookieModalOpen] = useState(false);

  const [cookiesInputText, setCookiesInputText] = useState("");

  const [isSavingCookies, setIsSavingCookies] = useState(false);

  const [cookieSuccessMsg, setCookieSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    apiFetch<CookiesStatusResponse>("/api/concert-to-album/cookies-status")
      .then((data) => {
        if (!cancelled && data) setHasYoutubeCookies(Boolean(data.hasCookies));
      })
      .catch(() => {
        // Sin estado de cookies se asume "no vinculado": el usuario puede vincularlas a mano.
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSaveCookies = async () => {
    if (!cookiesInputText.trim()) return;
    setIsSavingCookies(true);
    try {
      const data = await apiFetch<SaveCookiesResponse>("/api/concert-to-album/save-cookies", {
        method: "POST",
        body: JSON.stringify({ cookiesText: cookiesInputText.trim() }),
      });
      if (data?.success) {
        setHasYoutubeCookies(true);
        setCookieSuccessMsg(
          "¡Acceso verificado! Ahora el servidor puede descargar vídeos del canal directamente sin bloqueos.",
        );
        setTimeout(() => {
          setCookieSuccessMsg(null);
          setCookieModalOpen(false);
        }, 2200);
      } else {
        setErrorMessage(
          data?.error || "Error al guardar las cookies de YouTube.",
        );
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Error al conectar con el servidor."));
    } finally {
      setIsSavingCookies(false);
    }
  };

  const handleDeleteCookies = async () => {
    try {
      await apiFetch("/api/concert-to-album/delete-cookies", { method: "POST" });
      setHasYoutubeCookies(false);
      setCookiesInputText("");
      setCookieSuccessMsg("Cookies eliminadas del servidor.");
      setTimeout(() => setCookieSuccessMsg(null), 2000);
    } catch {
      // El borrado es idempotente: si falla, el estado local no cambia y el usuario puede reintentar.
    }
  };

  const handleUploadCookieFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCookiesInputText(content);
      }
    };
    reader.readAsText(file);
  };

  return { setCookieModalOpen, hasYoutubeCookies, cookieModalOpen, cookieSuccessMsg, handleUploadCookieFile, cookiesInputText, setCookiesInputText, handleDeleteCookies, handleSaveCookies, isSavingCookies };
}
