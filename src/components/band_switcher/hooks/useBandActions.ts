/**
 * Salir de una banda, fijar banda principal, subir logo y cambiar de banda.
 * Extraído de BandSwitcherModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction } from "react";
import { api,getAuthHeaders } from "../../../services/api";
import { apiFetch } from "../../../utils/api";
import { uploadFileToServer } from "../../../utils/audioStorage";
import { cleanBandId,isSameBandId } from "../../../utils/bandUtils";
import { getErrorMessage } from "../../../utils/errorMessage";
import type { SwitcherEpkConfig } from "../bandSwitcherTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandActionsParams {
  setBandToDelete: Dispatch<SetStateAction<{ id: string; name: string; }>>;
  bandToDelete: { id: string; name: string; };
  setLeavingBandId: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  setSuccessMessage: Dispatch<SetStateAction<string>>;
  onSwitchBand: (bandId: string) => Promise<unknown>;
  onRefreshData: () => void;
  settingMainBandId: string;
  setSettingMainBandId: Dispatch<SetStateAction<string>>;
  setLocalMainBandId: Dispatch<SetStateAction<string>>;
  onSetMainBand: (bandId: string) => Promise<unknown>;
  setUploadingBandId: Dispatch<SetStateAction<string>>;
  setCustomLogos: Dispatch<SetStateAction<Record<string, string>>>;
  currentActiveBandId: string;
  onUpdateEpkConfig: (config: SwitcherEpkConfig) => void | Promise<unknown>;
  epkConfig: SwitcherEpkConfig | undefined;
  onClose: () => void;
  setSwitchingBandId: Dispatch<SetStateAction<string>>;
}

/**
 * Salir de una banda, fijar banda principal, subir logo y cambiar de banda.
 * @param params Estado y callbacks del contenedor ({@link BandActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandActions({ setBandToDelete, bandToDelete, setLeavingBandId, setErrorMessage, setSuccessMessage, onSwitchBand, onRefreshData, settingMainBandId, setSettingMainBandId, setLocalMainBandId, onSetMainBand, setUploadingBandId, setCustomLogos, currentActiveBandId, onUpdateEpkConfig, epkConfig, onClose, setSwitchingBandId }: BandActionsParams) {
  const handleRequestLeaveBand = (bandId: string, bandName: string) => {
    setBandToDelete({ id: bandId, name: bandName });
  };

  const handleConfirmLeaveBand = async () => {
    if (!bandToDelete) return;
    const { id: bandId, name: bandName } = bandToDelete;

    setLeavingBandId(bandId);
    setBandToDelete(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.leaveBand(bandId);
      if (res && res.success) {
        if (res.user) {
          localStorage.setItem("bandmanager_user", JSON.stringify(res.user));
          if (res.user.band_id && onSwitchBand) {
            await onSwitchBand(res.user.band_id);
          }
        }
        setSuccessMessage(`"${bandName}" eliminada de tu cuenta.`);
        if (onRefreshData) await onRefreshData();
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } else {
        setErrorMessage(res?.message || "Error al eliminar la banda");
        setLeavingBandId(null);
      }
    } catch (err) {
      console.error("Error al eliminar banda", err);
      try {
        const response = await fetch(
          `/api/users/leave-band/${encodeURIComponent(bandId)}`,
          {
            method: "DELETE",
            headers: getAuthHeaders() as Record<string, string>,
          },
        );
        if (response.ok) {
          const resData = await response.json();
          if (resData?.user) {
            localStorage.setItem(
              "bandmanager_user",
              JSON.stringify(resData.user),
            );
            if (resData.user.band_id && onSwitchBand) {
              await onSwitchBand(resData.user.band_id);
            }
          }
          setSuccessMessage(`"${bandName}" eliminada de tu cuenta.`);
          if (onRefreshData) await onRefreshData();
          setTimeout(() => {
            window.location.reload();
          }, 400);
          return;
        }
      } catch {
        // Sin respuesta utilizable del servidor: se informa con el error original.
      }
      const rawMsg = getErrorMessage(err);
      const isNetworkErr =
        rawMsg === "Failed to fetch" ||
        rawMsg.includes("NetworkError") ||
        rawMsg.includes("fetch");
      const userFriendlyMsg = isNetworkErr
        ? "Error de conexión con el servidor. Por favor, reintenta en unos instantes."
        : rawMsg || "Error al eliminar la banda de tu usuario";
      setErrorMessage(userFriendlyMsg);
      setLeavingBandId(null);
    }
  };

  const handleSetMainBandAction = async (
    e: React.MouseEvent,
    bandId: string,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (settingMainBandId) return;
    setSettingMainBandId(bandId);
    setLocalMainBandId(bandId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (onSetMainBand) {
        await onSetMainBand(bandId);
      } else {
        await api.setMainBand(bandId);
      }
      setSuccessMessage("¡Banda establecida como tu Proyecto Principal!");
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      console.error("Error setting main band:", err);
      setErrorMessage(getErrorMessage(err) || "Error al establecer la banda principal");
    } finally {
      setSettingMainBandId(null);
    }
  };

  const handleUploadLogo = async (bandId: string, file: File) => {
    setUploadingBandId(bandId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const uploadedUrl = await uploadFileToServer(file, {
        bandId,
        category: "logo",
      });
      const clean = cleanBandId(bandId);

      // Persist to EPK and upload-logo endpoints
      await apiFetch("/api/users/upload-logo", {
        method: "POST",
        body: JSON.stringify({
          bandId,
          logoUrl: uploadedUrl,
        }),
      });

      setCustomLogos((prev) => ({ ...prev, [clean]: uploadedUrl }));

      if (isSameBandId(bandId, currentActiveBandId) && onUpdateEpkConfig) {
        await onUpdateEpkConfig({ ...epkConfig, logoUrl: uploadedUrl, bandId });
      }

      if (onRefreshData) {
        onRefreshData();
      }

      setSuccessMessage("¡Logo actualizado correctamente!");
    } catch (err) {
      console.error("Error uploading logo in BandSwitcherModal:", err);
      setErrorMessage("Error al subir el logo. Inténtalo de nuevo.");
    } finally {
      setUploadingBandId(null);
    }
  };

  const handleSelectBand = async (bandId: string) => {
    if (isSameBandId(bandId, currentActiveBandId)) {
      onClose();
      return;
    }

    setSwitchingBandId(bandId);
    setErrorMessage(null);

    try {
      await onSwitchBand(bandId);
      setSwitchingBandId(null);
      onClose();
    } catch (err) {
      console.error("Error switching band:", err);
      setErrorMessage(getErrorMessage(err) || "Error al cambiar de banda");
      setSwitchingBandId(null);
    }
  };

  return { handleSelectBand, handleSetMainBandAction, handleRequestLeaveBand, handleUploadLogo, handleConfirmLeaveBand };
}
