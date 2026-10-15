/**
 * Identidad del usuario: nombre, instrumento, color, banda principal y logo de la banda.
 * Extraído de UserProfileModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction,useEffect,useState } from "react";
import type { EPKConfig, User } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { uploadFileToServer } from "../../../utils/audioStorage";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ProfileIdentityParams {
  currentUser: User;
  epkConfig?: Partial<EPKConfig> | null;
  availableBands: { band_id: string; bandName: string; role?: string; logoUrl?: string; plan?: string; is_main?: boolean; }[];
  setLocalAvailableBands: Dispatch<SetStateAction<{ band_id: string; bandName: string; role?: string; logoUrl?: string; plan?: string; is_main?: boolean; }[]>>;
  setError: Dispatch<SetStateAction<string>>;
  setSuccessMsg: Dispatch<SetStateAction<string>>;
  onUpdateEpkConfig?: (newConfig: EPKConfig) => void | Promise<unknown>;
  onRefreshData: () => void;
}

/**
 * Identidad del usuario: nombre, instrumento, color, banda principal y logo de la banda.
 * @param params Estado y callbacks del contenedor ({@link ProfileIdentityParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useProfileIdentity({ currentUser, epkConfig, availableBands, setLocalAvailableBands, setError, setSuccessMsg, onUpdateEpkConfig, onRefreshData }: ProfileIdentityParams) {
  const [name, setName] = useState(currentUser.name || "");

  const [instrument, setInstrument] = useState(currentUser.instrument || "");

  const [avatarColor, setAvatarColor] = useState(
    currentUser.avatarColor || "var(--ok)",
  );

  const [selectedMainBandId, setSelectedMainBandId] = useState(
    currentUser.main_band_id || currentUser.band_id || "",
  );

  const [bandLogoUrl, setBandLogoUrl] = useState<string>(
    epkConfig?.logoUrl || "",
  );

  useEffect(() => {
    if (currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el formulario se resincroniza con el usuario que llega por props
      setName(currentUser.name || "");
      setInstrument(currentUser.instrument || "");
      setAvatarColor(currentUser.avatarColor || "var(--ok)");
      setSelectedMainBandId(
        currentUser.main_band_id || currentUser.band_id || "",
      );
    }
  }, [currentUser]);

  useEffect(() => {
    if (availableBands) {
      setLocalAvailableBands(availableBands);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- el setter de useState es estable; se resincroniza solo cuando cambian las bandas
  }, [availableBands]);

  useEffect(() => {
    if (epkConfig?.logoUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el formulario se resincroniza con el logo del EPK que llega por props
      setBandLogoUrl(epkConfig.logoUrl);
    }
  }, [epkConfig?.logoUrl]);

  const [logoImgError, setLogoImgError] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoChangeInProfile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    setSuccessMsg(null);
    const targetBand = selectedMainBandId || currentUser.band_id;
    if (!targetBand) {
      setError("No hay ninguna banda activa para actualizar el logo.");
      setUploadingLogo(false);
      return;
    }
    try {
      const userBandId = targetBand;
      const url = await uploadFileToServer(file, {
        bandId: userBandId,
        category: "logo",
      });
      setBandLogoUrl(url);

      // El servidor fusiona con el EPK guardado, de ahí que baste con el logo y la banda.
      const updatedEpk = { ...epkConfig, logoUrl: url, bandId: userBandId } as EPKConfig;
      await apiFetch("/api/users/upload-logo", {
        method: "POST",
        body: JSON.stringify({ logoUrl: url, bandId: userBandId }),
      });

      if (onUpdateEpkConfig) {
        await onUpdateEpkConfig(updatedEpk);
      }
      if (onRefreshData) onRefreshData();
      setSuccessMsg("¡Logo del proyecto actualizado con éxito!");
    } catch (err) {
      console.error("Error uploading band logo in profile:", err);
      setError("Error al subir el logo de la banda.");
    } finally {
      setUploadingLogo(false);
    }
  };

  return { setSelectedMainBandId, selectedMainBandId, name, instrument, avatarColor, setName, setInstrument, setAvatarColor, bandLogoUrl, logoImgError, setLogoImgError, uploadingLogo, handleLogoChangeInProfile };
}
