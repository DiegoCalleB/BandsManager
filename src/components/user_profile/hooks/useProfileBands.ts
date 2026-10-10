import { SIMPLE_PROMO_ONLY_BAND_CREATION } from "../profileModel";
/**
 * Bandas del usuario en el perfil: alta de una banda nueva y baja de una existente.
 * Extraído de UserProfileModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 react-hooks/exhaustive-deps
*/
import React,{ Dispatch,SetStateAction,useEffect,useState } from "react";
import { api } from "../../../services/api";
import { User } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ProfileBandsParams {
  setLocalAvailableBands: Dispatch<SetStateAction<{ band_id: string; bandName: string; role?: string; logoUrl?: string; plan?: string; is_main?: boolean; }[]>>;
  availableBands: { band_id: string; bandName: string; role?: string; logoUrl?: string; plan?: string; is_main?: boolean; }[];
  currentUser: User;
  setError: Dispatch<SetStateAction<string>>;
  setSuccessMsg: Dispatch<SetStateAction<string>>;
  onUpdateUser: (updatedUser: User) => void;
  setSelectedMainBandId: Dispatch<SetStateAction<string>>;
  onRefreshData: () => void;
}

/**
 * Bandas del usuario en el perfil: alta de una banda nueva y baja de una existente.
 * @param params Estado y callbacks del contenedor ({@link ProfileBandsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useProfileBands({ setLocalAvailableBands, availableBands, currentUser, setError, setSuccessMsg, onUpdateUser, setSelectedMainBandId, onRefreshData }: ProfileBandsParams) {
  useEffect(() => {
    setLocalAvailableBands(availableBands);
  }, [availableBands]);

  // Band creation inside Profile Modal
  const [showCreateBandSection, setShowCreateBandSection] = useState(false);

  const [createBandName, setCreateBandName] = useState("");

  const [createBandLeaderName, setCreateBandLeaderName] = useState(
    currentUser.name || currentUser.username || "",
  );

  const [createBandStyle, setCreateBandStyle] = useState("");

  const [createBandLocation, setCreateBandLocation] = useState("España");

  const [createBandPlan, setCreateBandPlan] = useState<
    "emergente" | "profesional" | "elite" | "promo" | "promo_plus"
  >("profesional");

  const [isCreatingBand, setIsCreatingBand] = useState(false);

  // Band deletion inside Profile Modal
  const [bandToDeleteInProfile, setBandToDeleteInProfile] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [deletingBandId, setDeletingBandId] = useState<string | null>(null);

  const handleCreateBandInProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createBandName.trim()) {
      setError("Por favor, introduce el nombre del proyecto o banda");
      return;
    }
    setIsCreatingBand(true);
    setError(null);
    setSuccessMsg(null);
    const effectivePlan = SIMPLE_PROMO_ONLY_BAND_CREATION
      ? "promo"
      : createBandPlan;
    try {
      const res = await api.createBand({
        bandName: createBandName.trim(),
        leaderName:
          createBandLeaderName.trim() ||
          currentUser.name ||
          currentUser.username ||
          "Líder",
        plan: effectivePlan,
        estilo_musical: createBandStyle.trim() || undefined,
        localizacion: createBandLocation.trim() || undefined,
      });

      if (res && res.success) {
        if (res.user) {
          localStorage.setItem("bandmanager_user", JSON.stringify(res.user));
          onUpdateUser(res.user as User);
        }
        if (res.availableBands && Array.isArray(res.availableBands)) {
          setLocalAvailableBands(res.availableBands);
        }
        if (res.band_id) {
          setSelectedMainBandId(res.band_id);
        }

        // Redirect to Stripe Checkout for paid plans
        if (
          (effectivePlan as string) !== "ensayo" &&
          effectivePlan !== "promo" &&
          effectivePlan !== "promo_plus" &&
          res.band_id
        ) {
          try {
            await api.startCheckout({
              planId: effectivePlan,
              billingInterval: "monthly",
              bandId: res.band_id,
              userEmail:
                currentUser?.email && currentUser.email.includes("@")
                  ? currentUser.email
                  : undefined,
            });
            setShowCreateBandSection(false);
            setCreateBandName("");
            setCreateBandStyle("");
            return;
          } catch (stripeErr) {
            console.error(
              "Error initiating Stripe checkout on create band in profile:",
              stripeErr,
            );
          }
        }

        setSuccessMsg(
          `¡Proyecto "${createBandName.trim()}" creado y configurado con éxito!`,
        );
        setShowCreateBandSection(false);
        setCreateBandName("");
        setCreateBandLeaderName(currentUser.name || currentUser.username || "");
        setCreateBandStyle("");
        if (onRefreshData) await onRefreshData();
      } else {
        setError((res as { error?: string })?.error || "No se pudo crear el proyecto musical");
      }
    } catch (err) {
      console.error("Error creating band in profile modal:", err);
      setError((err instanceof Error && err.message) || "Error al crear el nuevo proyecto");
    } finally {
      setIsCreatingBand(false);
    }
  };

  const handleConfirmDeleteBandInProfile = async () => {
    if (!bandToDeleteInProfile) return;
    const { id: targetBandId, name: targetBandName } = bandToDeleteInProfile;
    setDeletingBandId(targetBandId);
    setBandToDeleteInProfile(null);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.leaveBand(targetBandId);
      if (res && res.success) {
        if (res.user) {
          localStorage.setItem("bandmanager_user", JSON.stringify(res.user));
          onUpdateUser(res.user as User);
          setSelectedMainBandId(
            res.user.main_band_id || res.user.band_id || "",
          );
        }
        if (res.availableBands && Array.isArray(res.availableBands)) {
          setLocalAvailableBands(res.availableBands);
        }
        setSuccessMsg(
          `"${targetBandName}" eliminada correctamente de tu cuenta.`,
        );
        if (onRefreshData) await onRefreshData();
      } else {
        setError(res?.message || "Error al eliminar la banda");
      }
    } catch (err) {
      console.error("Error deleting band in profile modal:", err);
      const rawMsg = (err instanceof Error && err.message) || "";
      const isNetworkErr =
        rawMsg === "Failed to fetch" ||
        rawMsg.includes("NetworkError") ||
        rawMsg.includes("fetch");
      const userFriendlyMsg = isNetworkErr
        ? "Error de conexión con el servidor. Por favor, reintenta en unos instantes."
        : rawMsg || "Error al eliminar la banda de tu usuario";
      setError(userFriendlyMsg);
    } finally {
      setDeletingBandId(null);
    }
  };

  return { setShowCreateBandSection, showCreateBandSection, createBandName, setCreateBandName, createBandStyle, setCreateBandStyle, createBandLocation, setCreateBandLocation, createBandPlan, setCreateBandPlan, handleCreateBandInProfile, isCreatingBand, bandToDeleteInProfile, setBandToDeleteInProfile, handleConfirmDeleteBandInProfile, deletingBandId };
}
