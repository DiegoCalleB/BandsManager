/**
 * Flujo de dos pasos para crear una banda nueva con su plan.
 * Extraído de BandSwitcherModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction,useState } from "react";
import { api } from "../../../services/api";
import { User } from "../../../types";
import { getErrorMessage } from "../../../utils/errorMessage";
import { SIMPLE_PROMO_ONLY_BAND_CREATION } from "../bandSwitcherConfig";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CreateBandParams {
  currentUser: User;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  setSuccessMessage: Dispatch<SetStateAction<string>>;
  onSwitchBand: (bandId: string) => Promise<unknown>;
  onRefreshData: () => void;
}

/**
 * Flujo de dos pasos para crear una banda nueva con su plan.
 * @param params Estado y callbacks del contenedor ({@link CreateBandParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCreateBand({ currentUser, setErrorMessage, setSuccessMessage, onSwitchBand, onRefreshData }: CreateBandParams) {
  // Create new band state (2-step flow identical to Login registration)
  const [showCreateBandModal, setShowCreateBandModal] = useState(false);

  const [createBandStep, setCreateBandStep] = useState<1 | 2>(1);

  const [newBandName, setNewBandName] = useState("");

  const [newBandLeaderName, setNewBandLeaderName] = useState("");

  const [newBandStyle, setNewBandStyle] = useState("");

  const [newBandLocation, setNewBandLocation] = useState("España");

  const [newBandFeatureCategory, setNewBandFeatureCategory] = useState<
    "all" | "booking" | "media" | "finance"
  >("all");

  const [isCreatingBand, setIsCreatingBand] = useState(false);

  const [creatingPlanKey, setCreatingPlanKey] = useState<string | null>(null);

  const openCreateBandModal = () => {
    setCreateBandStep(1);
    setNewBandName("");
    setNewBandLeaderName(currentUser?.name || currentUser?.username || "");
    setNewBandStyle("");
    setNewBandLocation("España");
    setNewBandFeatureCategory("all");
    setCreatingPlanKey(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowCreateBandModal(true);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBandName.trim()) {
      setErrorMessage("Por favor, introduce el nombre del proyecto o banda");
      return;
    }
    setErrorMessage(null);
    if (SIMPLE_PROMO_ONLY_BAND_CREATION) {
      handleSelectPlanForCreation("promo");
      return;
    }
    setCreateBandStep(2);
  };

  const handleSelectPlanForCreation = async (planKey: string) => {
    if (isCreatingBand) return;
    if (!newBandName.trim()) {
      setErrorMessage("Por favor, introduce el nombre del proyecto");
      setCreateBandStep(1);
      return;
    }

    setIsCreatingBand(true);
    setCreatingPlanKey(planKey);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.createBand({
        bandName: newBandName.trim(),
        leaderName: newBandLeaderName.trim() || currentUser?.name || "Líder",
        plan: planKey,
        estilo_musical: newBandStyle.trim() || undefined,
        localizacion: newBandLocation.trim() || undefined,
      });

      if (res && res.success) {
        if (res.user) {
          localStorage.setItem("bandmanager_user", JSON.stringify(res.user));
        }
        if (onSwitchBand && res.band_id) {
          await onSwitchBand(res.band_id);
        }

        // If paid plan, redirect to Stripe Checkout!
        if (
          planKey !== "ensayo" &&
          planKey !== "promo" &&
          planKey !== "promo_plus" &&
          res.band_id
        ) {
          try {
            await api.startCheckout({
              planId: planKey,
              billingInterval: "monthly",
              bandId: res.band_id,
              userEmail:
                currentUser?.email && currentUser.email.includes("@")
                  ? currentUser.email
                  : undefined,
            });
            setShowCreateBandModal(false);
            setCreateBandStep(1);
            setIsCreatingBand(false);
            setCreatingPlanKey(null);
            return;
          } catch (stripeErr) {
            console.error(
              "Error initiating Stripe checkout on band creation:",
              stripeErr,
            );
          }
        }

        setSuccessMessage(
          `¡Proyecto "${newBandName.trim()}" creado y configurado correctamente!`,
        );
        setShowCreateBandModal(false);
        setCreateBandStep(1);
        setNewBandName("");
        setNewBandLeaderName("");
        setNewBandStyle("");
        setNewBandLocation("España");

        if (onRefreshData) await onRefreshData();
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } else {
        setErrorMessage((res as { error?: string })?.error || "Error al crear el proyecto");
        setIsCreatingBand(false);
        setCreatingPlanKey(null);
      }
    } catch (err) {
      console.error("Error creating band in modal:", err);
      setErrorMessage(getErrorMessage(err) || "Error al crear el proyecto musical");
      setIsCreatingBand(false);
      setCreatingPlanKey(null);
    }
  };

  return { openCreateBandModal, showCreateBandModal, createBandStep, setShowCreateBandModal, handleStep1Submit, newBandName, setNewBandName, newBandLeaderName, setNewBandLeaderName, newBandStyle, setNewBandStyle, newBandLocation, setNewBandLocation, isCreatingBand, setCreateBandStep, newBandFeatureCategory, setNewBandFeatureCategory, handleSelectPlanForCreation, creatingPlanKey };
}
