/**
 * Controlador del perfil de usuario: compone identidad, plan y bandas, y gestiona contraseña,
 * paneles y guardado.
 * Extraído de UserProfileModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import {
leerPreferencia as leerPreferenciaEspectro,
PreferenciaTema
} from "../../../utils/temaEspectro";

import type { ResolvedUserProfileProps } from "../../UserProfileModal";
import { usePlanSummary } from "./usePlanSummary";
import { useProfileBands } from "./useProfileBands";
import { useProfileIdentity } from "./useProfileIdentity";

/**
 * Estado y acciones del perfil de usuario.
 * @param params Props del perfil con sus valores por defecto ya aplicados.
 * @returns Todo lo que consumen las vistas.
 */
export function useUserProfileController({
  currentUser,
  onClose,
  onUpdateUser,
  epkConfig,
  onUpdateEpkConfig,
  onRefreshData,
  availableBands,
  onSetMainBand,}: ResolvedUserProfileProps) {
  const { language, setLanguage } = useLanguage();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Available bands local state & synchronization
  const [localAvailableBands, setLocalAvailableBands] =
    useState(availableBands);

  const { setSelectedMainBandId, selectedMainBandId, name, instrument, avatarColor, setName, setInstrument, setAvatarColor, bandLogoUrl, logoImgError, setLogoImgError, uploadingLogo, handleLogoChangeInProfile } = useProfileIdentity({ currentUser, epkConfig, availableBands, setLocalAvailableBands, setError, setSuccessMsg, onUpdateEpkConfig, onRefreshData });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [showAppearance, setShowAppearance] = useState(false);

  const [prefEspectro, setPrefEspectro] = useState<PreferenciaTema>(() =>
    leerPreferenciaEspectro(),
  );

  const [showAgentConfig, setShowAgentConfig] = useState(false);

  const { currentPlanDef, isHighestPlan, isPromoUser } = usePlanSummary({ availableBands, currentUser });

  // Password change state
  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const { setShowCreateBandSection, showCreateBandSection, createBandName, setCreateBandName, createBandStyle, setCreateBandStyle, createBandLocation, setCreateBandLocation, createBandPlan, setCreateBandPlan, handleCreateBandInProfile, isCreatingBand, bandToDeleteInProfile, setBandToDeleteInProfile, handleConfirmDeleteBandInProfile, deletingBandId } = useProfileBands({ setLocalAvailableBands, availableBands, currentUser, setError, setSuccessMsg, onUpdateUser, setSelectedMainBandId, onRefreshData });

  const colors = [
    "var(--ok)", // Emerald'#3b82f6', // Blue'#ec4899', // Pink'var(--acc)', // Amber'var(--acc)', // Purple'#06b6d4', // Cyan'#f97316', // Orange'#ef4444' // Red
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    if (newPassword && newPassword.length < 3) {
      setError("La nueva contraseña debe tener al menos 3 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("bandmanager_token");
      if (
        selectedMainBandId &&
        selectedMainBandId !==
          (currentUser.main_band_id || currentUser.band_id) &&
        onSetMainBand
      ) {
        await onSetMainBand(selectedMainBandId).catch((e: unknown) =>
          console.warn("Could not set main band:", e),
        );
      }
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          instrument: instrument.trim(),
          avatarColor,
          main_band_id: selectedMainBandId,
          ...(newPassword ? { newPassword: newPassword.trim() } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el perfil");
      }

      setSuccessMsg("¡Perfil y contraseña actualizados correctamente!");
      setNewPassword("");
      setConfirmPassword("");
      onUpdateUser(data);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError((err instanceof Error && err.message) || "Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return { language, setLanguage, setSelectedMainBandId, selectedMainBandId, name, instrument, avatarColor, setName, setInstrument, setAvatarColor, bandLogoUrl, logoImgError, setLogoImgError, uploadingLogo, handleLogoChangeInProfile, currentPlanDef, isHighestPlan, isPromoUser, setShowCreateBandSection, showCreateBandSection, createBandName, setCreateBandName, createBandStyle, setCreateBandStyle, createBandLocation, setCreateBandLocation, createBandPlan, setCreateBandPlan, handleCreateBandInProfile, isCreatingBand, bandToDeleteInProfile, setBandToDeleteInProfile, handleConfirmDeleteBandInProfile, deletingBandId, loading, setLoading, error, setError, successMsg, setSuccessMsg, localAvailableBands, setLocalAvailableBands, showUpgradeModal, setShowUpgradeModal, showAppearance, setShowAppearance, prefEspectro, setPrefEspectro, showAgentConfig, setShowAgentConfig, newPassword, setNewPassword, confirmPassword, setConfirmPassword, colors, handleSubmit };
}
