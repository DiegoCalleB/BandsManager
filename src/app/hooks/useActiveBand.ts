/**
 * Banda activa del usuario: id, nombre, logo, plan y comparación de ids.
 * Extraído de App.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction,useEffect } from "react";
import type { SwitcherBand } from "../../components/band_switcher/bandSwitcherTypes";
import type { EPKConfig,User } from "../../types";
import { normalizePlan } from "../../utils/planPermissions";
import { isOnboardingCompleted } from "../../utils/userPreferences";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ActiveBandParams {
  currentUser: User;
  availableBands: SwitcherBand[];
  epkConfig: Partial<EPKConfig>;
  isLoggedIn: boolean;
  setShowProfileWizardModal: Dispatch<SetStateAction<boolean>>;
  setShowOnboardingModal: Dispatch<SetStateAction<boolean>>;
}

/**
 * Banda activa del usuario: id, nombre, logo, plan y comparación de ids.
 * @param params Estado y callbacks del contenedor ({@link ActiveBandParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useActiveBand({ currentUser, availableBands, epkConfig, isLoggedIn, setShowProfileWizardModal, setShowOnboardingModal }: ActiveBandParams) {
  // Antes, sin banda activa (cuenta nueva sin banda asignada todavía, o un estado transitorio),
  // se caía en una banda por defecto en silencio y la app operaba -en lectura y escritura- sobre los
  // datos reales de esa banda. Sin id de banda, cleanActiveBandId queda vacío (no coincide con
  // ninguna banda) y el resto de componentes deben tratarlo como "sin banda seleccionada".
  const currentActiveBandId = currentUser?.band_id || "";

  const cleanActiveBandId = currentActiveBandId.replace(/^(band|reg)-/, "");

  const activeBandFromList = (availableBands || []).find(
    (b) =>
      (b.band_id &&
        (b.band_id === currentActiveBandId ||
          b.band_id.replace(/^(band|reg)-/, "") === cleanActiveBandId)) ||
      (b.id &&
        (b.id === currentActiveBandId ||
          b.id.replace(/^(band|reg)-/, "") === cleanActiveBandId)),
  );

  const currentActiveBandName =
    activeBandFromList?.nombre_banda ||
    activeBandFromList?.bandName ||
    currentUser?.bandName ||
    currentUser?.name ||
    "Mi Banda";

  const currentActiveBandLogo =
    epkConfig?.logoUrl && epkConfig.logoUrl.trim().length > 0
      ? epkConfig.logoUrl
      : activeBandFromList?.logo_url || activeBandFromList?.imagen_url || "";

  const isSameBand = (
    id1?: string,
    id2?: string,
    name1?: string,
    name2?: string,
  ) => {
    if (
      name1 &&
      name2 &&
      name1.trim().toLowerCase() === name2.trim().toLowerCase()
    ) {
      return true;
    }
    if (!id1 && !id2) return true;
    if (!id1 || !id2) return false;
    if (id1 === id2) return true;
    const clean1 = id1
      .replace(/^(band|reg)-/, "")
      .replace(/-\d+$/, "")
      .trim()
      .toLowerCase();
    const clean2 = id2
      .replace(/^(band|reg)-/, "")
      .replace(/-\d+$/, "")
      .trim()
      .toLowerCase();
    if (clean1 === clean2) return true;
    if (
      clean1 &&
      clean2 &&
      (clean1.includes(clean2) || clean2.includes(clean1))
    )
      return true;
    return false;
  };

  const currentActiveBandPlan = React.useMemo(() => {
    if (
      availableBands &&
      Array.isArray(availableBands) &&
      availableBands.length > 0
    ) {
      const match = availableBands.find((b) =>
        isSameBand(
          b.band_id || b.id,
          currentActiveBandId,
          b.bandName || b.nombre_banda || b.name,
          currentActiveBandName,
        ),
      );
      if (match && match.plan) {
        return normalizePlan(match.plan);
      }
    }
    return normalizePlan(currentUser?.plan || "ensayo");
  }, [
    availableBands,
    currentActiveBandId,
    currentActiveBandName,
    currentUser?.plan,
  ]);

  // Plan Promo y Promo+ (fase beta, festivales): a diferencia del resto de planes, que enseñan los
  // módulos no incluidos con un candado "Plan" (invitando a mejorar), Promo no debe ni
  // enseñar que esos módulos existen — así que el nav los oculta del todo en vez de bloquearlos.
  const isPromoPlan =
    currentActiveBandPlan === "promo" || currentActiveBandPlan === "promo_plus";

  // Disparar reactivamente el asistente de perfil o bienvenida si la banda activa actual aún no lo ha completado
  useEffect(() => {
    if (isLoggedIn && cleanActiveBandId) {
      try {
        const { wizardCompleted, onboardingCompleted } = isOnboardingCompleted(
          cleanActiveBandId,
          currentUser,
        );

        // Si es una banda nueva o sin asistente completado para este usuario, abrir el asistente
        if (!wizardCompleted) {
          setShowProfileWizardModal(true);
        }
        if (!onboardingCompleted) {
          setShowOnboardingModal(true);
        }
      } catch {
        // En caso de modo incógnito o localStorage restringido
      }
    }
  }, [isLoggedIn, cleanActiveBandId, currentUser]);

  return { currentActiveBandPlan, isPromoPlan, currentActiveBandId, isSameBand, currentActiveBandName, currentActiveBandLogo, cleanActiveBandId };
}
