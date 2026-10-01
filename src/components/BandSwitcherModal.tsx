import React, { useState, useEffect } from "react";
import {
  Guitar,
  Check,
  Plus,
  Sparkles,
  X,
  Shield,
  ArrowRight,
  Loader2,
  Camera,
  Upload,
  Trash2,
  Crown,
  Mail,
  ArrowUpRight,
  Star,
  Search,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  GripVertical,
  Music,
  MapPin,
  Zap,
  User as UserIcon,
  ArrowUpDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
  Users,
} from "lucide-react";
import { User } from "../types";
import { cleanBandId, isSameBandId } from "../utils/bandUtils";
import { uploadFileToServer } from "../utils/audioStorage";
import { api, getAuthHeaders } from "../services/api";
import {
  getPlanDefinition,
  getPlanChangeType,
  PLANS,
} from "../utils/planPermissions";
import { BandNameStylerHelper } from "./common/BandNameStylerHelper";
import { ModalPortal } from "./common/ModalPortal";
import { ShowIcon } from './ui/ShowIcon';
import { Button, IconButton, Input } from './ui';

// Fase beta: crear una banda nueva desde aquí va directa al plan Promo, sin pasar por la
// parrilla de planes de pago (mismo criterio que SimplePromoLoginModal.tsx). El selector de
// planes de este modal (paso 2) se conserva intacto más abajo para cuando se quiera reabrir
// la creación de bandas con todos los planes — basta con volver a poner esto a false.
const SIMPLE_PROMO_ONLY_BAND_CREATION = true;

interface BandSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  availableBands: Array<{
    band_id: string;
    bandName: string;
    role?: string;
    logoUrl?: string;
    style?: string;
    plan?: string;
    is_main?: boolean;
  }>;
  onSwitchBand: (bandId: string) => Promise<any>;
  onSetMainBand?: (bandId: string) => Promise<any>;
  onOpenRegisterBand?: () => void;
  onOpenBandManagement?: (bandId?: string) => void;
  epkConfig?: any;
  onUpdateEpkConfig?: (config: any) => Promise<any> | void;
  onRefreshData?: () => void;
}

export const BandSwitcherModal: React.FC<BandSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  availableBands,
  onSwitchBand,
  onSetMainBand,
  onOpenRegisterBand,
  onOpenBandManagement,
  epkConfig,
  onUpdateEpkConfig,
  onRefreshData,
}) => {
  const [switchingBandId, setSwitchingBandId] = useState<string | null>(null);
  const [settingMainBandId, setSettingMainBandId] = useState<string | null>(
    null,
  );
  const [leavingBandId, setLeavingBandId] = useState<string | null>(null);
  const [uploadingBandId, setUploadingBandId] = useState<string | null>(null);
  const [customLogos, setCustomLogos] = useState<Record<string, string>>({});
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedBandForUpgrade, setSelectedBandForUpgrade] =
    useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedBandId, setDraggedBandId] = useState<string | null>(null);

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
  const [bandOrder, setBandOrder] = useState<string[]>(() => {
    if (
      currentUser?.band_order &&
      Array.isArray(currentUser.band_order) &&
      currentUser.band_order.length > 0
    ) {
      return currentUser.band_order;
    }
    try {
      const saved = localStorage.getItem(
        `bandmanager_band_order_${currentUser?.id || "default"}`,
      );
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bandToDelete, setBandToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedBandForSettings, setSelectedBandForSettings] = useState<{
    band_id: string;
    bandName: string;
    role?: string;
    logoUrl?: string;
    plan?: string;
  } | null>(null);

  const mainBandId = currentUser?.main_band_id || currentUser?.band_id || "";
  const [localMainBandId, setLocalMainBandId] = useState<string>(mainBandId);

  // Sync if currentUser updates
  useEffect(() => {
    if (
      currentUser?.band_order &&
      Array.isArray(currentUser.band_order) &&
      currentUser.band_order.length > 0
    ) {
      setBandOrder(currentUser.band_order);
    }
  }, [currentUser?.band_order]);

  useEffect(() => {
    if (currentUser?.main_band_id) {
      setLocalMainBandId(currentUser.main_band_id);
    } else if (currentUser?.band_id) {
      setLocalMainBandId(currentUser.band_id);
    }
  }, [currentUser?.main_band_id, currentUser?.band_id]);

  const saveOrder = async (newOrder: string[]) => {
    setBandOrder(newOrder);
    try {
      localStorage.setItem(
        `bandmanager_band_order_${currentUser?.id || "default"}`,
        JSON.stringify(newOrder),
      );
    } catch (e) {
      console.warn("Could not save band order locally:", e);
    }
    try {
      await api.setBandOrder(newOrder);
    } catch (e) {
      console.warn("Could not sync band order to database:", e);
    }
  };

  if (!isOpen) return null;

  const currentActiveBandId = currentUser?.band_id || "";
  const activeClean = cleanBandId(currentActiveBandId);

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
          localStorage.setItem("bakandeya_user", JSON.stringify(res.user));
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
    } catch (err: any) {
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
              "bakandeya_user",
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
      } catch {}
      const rawMsg = err?.message || "";
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
          localStorage.setItem("bakandeya_user", JSON.stringify(res.user));
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
          } catch (stripeErr: any) {
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
        setErrorMessage((res as any)?.error || "Error al crear el proyecto");
        setIsCreatingBand(false);
        setCreatingPlanKey(null);
      }
    } catch (err: any) {
      console.error("Error creating band in modal:", err);
      setErrorMessage(err.message || "Error al crear el proyecto musical");
      setIsCreatingBand(false);
      setCreatingPlanKey(null);
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
    } catch (err: any) {
      console.error("Error setting main band:", err);
      setErrorMessage(err.message || "Error al establecer la banda principal");
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
      const authHeaders = getAuthHeaders() as Record<string, string>;
      const res = await fetch("/api/users/upload-logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          "x-band-id": bandId,
        },
        body: JSON.stringify({
          bandId,
          logoUrl: uploadedUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Error al guardar el logotipo en el servidor",
        );
      }

      setCustomLogos((prev) => ({ ...prev, [clean]: uploadedUrl }));

      if (isSameBandId(bandId, currentActiveBandId) && onUpdateEpkConfig) {
        await onUpdateEpkConfig({ ...epkConfig, logoUrl: uploadedUrl, bandId });
      }

      if (onRefreshData) {
        onRefreshData();
      }

      setSuccessMessage("¡Logo actualizado correctamente!");
    } catch (err: any) {
      console.error("Error uploading logo in BandSwitcherModal:", err);
      setErrorMessage("Error al subir el logo. Inténtalo de nuevo.");
    } finally {
      setUploadingBandId(null);
    }
  };

  // Ensure unique list of bands mapped by clean band ID
  const bandListMap = new Map<
    string,
    {
      band_id: string;
      bandName: string;
      role?: string;
      logoUrl?: string;
      plan?: string;
    }
  >();

  if (availableBands && availableBands.length > 0) {
    availableBands.forEach((b) => {
      const bid = b.band_id;
      if (bid) {
        const clean = cleanBandId(bid);
        let logo =
          customLogos[clean] ||
          b.logoUrl ||
          (b as any).logo_url ||
          (b as any).imagen_url ||
          "";
        if (
          isSameBandId(bid, currentActiveBandId) &&
          epkConfig?.logoUrl &&
          !customLogos[clean]
        ) {
          logo = epkConfig.logoUrl;
        }
        if (!logo && clean === "bakandeya") {
          logo = "/logo_bakandeya_bueno_sin_fondo.png";
        }
        if (!bandListMap.has(clean)) {
          bandListMap.set(clean, {
            band_id: bid,
            bandName: b.bandName || "Banda",
            role: b.role || "member",
            logoUrl: logo,
            plan:
              b.plan ||
              (isSameBandId(bid, currentActiveBandId)
                ? currentUser?.plan
                : "emergente"),
          });
        }
      }
    });
  }

  // Ensure active band is present
  if (!bandListMap.has(activeClean)) {
    let logo = customLogos[activeClean] || epkConfig?.logoUrl || "";
    if (!logo && activeClean === "bakandeya") {
      logo = "/logo_bakandeya_bueno_sin_fondo.png";
    }
    bandListMap.set(activeClean, {
      band_id: currentActiveBandId,
      bandName: currentUser?.bandName || currentUser?.name || "BAKANDEYA",
      role: currentUser?.role || "leader",
      logoUrl: logo,
      plan: currentUser?.plan || "ensayo",
    });
  }

  const rawBands = Array.from(bandListMap.values());
  const uniqueBands = [...rawBands].sort((a, b) => {
    const aIsMain = isSameBandId(a.band_id, mainBandId);
    const bIsMain = isSameBandId(b.band_id, mainBandId);
    if (aIsMain && !bIsMain) return -1;
    if (!aIsMain && bIsMain) return 1;

    const aIdx = bandOrder.indexOf(cleanBandId(a.band_id));
    const bIdx = bandOrder.indexOf(cleanBandId(b.band_id));
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.bandName.localeCompare(b.bandName);
  });

  const handleMoveBand = (
    bandId: string,
    direction: "left" | "right",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const currentCleanIds = uniqueBands.map((b) => cleanBandId(b.band_id));
    const cleanId = cleanBandId(bandId);
    const idx = currentCleanIds.indexOf(cleanId);
    if (idx === -1) return;

    const targetIdx = direction === "left" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentCleanIds.length) return;

    const newOrder = [...currentCleanIds];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, moved);
    saveOrder(newOrder);
  };

  const handleDragStart = (bandId: string, e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", bandId);
    setDraggedBandId(bandId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetBandId: string, e: React.DragEvent) => {
    e.preventDefault();
    const sourceBandId = e.dataTransfer.getData("text/plain") || draggedBandId;
    setDraggedBandId(null);
    if (!sourceBandId || sourceBandId === targetBandId) return;

    const currentCleanIds = uniqueBands.map((b) => cleanBandId(b.band_id));
    const sourceClean = cleanBandId(sourceBandId);
    const targetClean = cleanBandId(targetBandId);

    const sourceIdx = currentCleanIds.indexOf(sourceClean);
    const targetIdx = currentCleanIds.indexOf(targetClean);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newOrder = [...currentCleanIds];
    const [moved] = newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    saveOrder(newOrder);
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
    } catch (err: any) {
      console.error("Error switching band:", err);
      setErrorMessage(err.message || "Error al cambiar de banda");
      setSwitchingBandId(null);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/90 overflow-y-auto overscroll-contain animate-fadeIn">
        {/* Background ambient */}

        {/* Main Container */}
        <div className="relative w-full max-w-4xl bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden flex flex-col p-6 md:p-10 text-center my-auto max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <Button
            variant="neutral"
            size="sm"
            onClick={onClose}
            disabled={!!switchingBandId}
            className="absolute top-5 right-5"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Top Header */}
          <div className="flex flex-col items-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--r-pill)] bg-[var(--acc)]/10 text-[var(--acc-ink)] text-xs font-sans font-bold mb-3">
              <span>Perfil y selección de banda</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black font-display text-[var(--ink)]">
              ¿Quién toca hoy?
            </h2>
            <p className="text-[var(--ink-2)] text-xs md:text-sm font-sans max-w-lg mt-2">
              Elige tu proyecto musical activo, marca tu{" "}
              <strong className="text-[var(--acc)] font-semibold">
                Banda principal
              </strong>{" "}
              o reordena tus proyectos arrastrándolos o con las flechas.
            </p>

            {/* Search bar if multiple bands */}
            {uniqueBands.length > 2 && (
              <div className="relative w-full max-w-xs mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-2)]" />
                <Input
                  size="sm"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar proyecto…"
                  className="w-full pl-9 pr-3"
                />
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-[var(--alert)]/15 text-[var(--ink)] text-xs rounded-[var(--r-m)] font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-[var(--ok)]/15 text-[var(--ink)] text-xs rounded-[var(--r-m)] font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-[var(--ok)]" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Band Cards Grid (Sleek Profile Switcher) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 justify-center items-stretch max-h-[55vh] overflow-y-auto p-2 no-scrollbar">
            {uniqueBands
              .filter(
                (band) =>
                  !searchQuery ||
                  band.bandName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
              )
              .map((band, index, array) => {
                const isActive = isSameBandId(
                  band.band_id,
                  currentActiveBandId,
                );
                const isMain = isSameBandId(
                  band.band_id,
                  localMainBandId || mainBandId,
                );
                const isSwitching = switchingBandId === band.band_id;
                const isSettingMain = settingMainBandId === band.band_id;
                const isLeavingThis = leavingBandId === band.band_id;
                const isDragged = draggedBandId === band.band_id;
                const planDef = getPlanDefinition(band.plan);

                return (
                  <div
                    key={`netflix-band-${band.band_id}`}
                    draggable={!switchingBandId && !isLeavingThis}
                    onDragStart={(e) => handleDragStart(band.band_id, e)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(band.band_id, e)}
                    onClick={() =>
                      !switchingBandId &&
                      !isSettingMain &&
                      !isLeavingThis &&
                      handleSelectBand(band.band_id)
                    }
                    className={`group relative flex flex-col items-center p-3 sm:p-4 rounded-[var(--r-l)] min-h-[175px] transition-ui duration-300 cursor-pointer select-none ${
                      isDragged ? "opacity-30 scale-95" : ""
                    } ${
                      isActive
                        ? "bg-[var(--acc)]/20 ring-1 ring-[var(--acc)]/40"
                        : "bg-[var(--sunken)] hover:bg-[var(--surface)]"
                    } ${switchingBandId && !isSwitching ? "opacity-40 grayscale pointer-events-none" : ""}`}
                  >
                    {/* Top Bar on Card: Star (Principal) + Reorder arrows on left, Settings + Delete on right */}
                    <div className="w-full flex items-center justify-between gap-1 z-20 mb-2 shrink-0">
                      {/* Left: Star (Principal) + Reorder arrows */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Star Button (Principal) */}
                        <button
                          type="button"
                          onClick={(e) =>
                            handleSetMainBandAction(e, band.band_id)
                          }
                          disabled={isMain || !!settingMainBandId}
                          className={`p-1.5 rounded-[var(--r-pill)] transition-ui cursor-pointer flex items-center justify-center z-30 ${
                            isMain
                              ? "text-[var(--on-acc)] bg-[var(--acc)]"
                              : "text-[var(--ink-2)] hover:text-[var(--acc)]/70 bg-[var(--surface)] hover:bg-[var(--surface)]/80 "
                          }`}
                          title={
                            isMain
                              ? "Banda Principal por defecto"
                              : "Fijar como Banda Principal"
                          }
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${isMain ? "fill-[var(--acc)] text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
                          />
                        </button>

                        {/* Quick Reorder (left/right) */}
                        <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {array.length > 1 && (
                            <>
                              <IconButton
                                label="Mover a la izquierda"
                                size="icon-xs"
                                type="button"
                                disabled={index === 0}
                                onClick={(e) =>
                                  handleMoveBand(band.band_id, "left", e)
                                }
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </IconButton>
                              <IconButton
                                label="Mover a la derecha"
                                size="icon-xs"
                                type="button"
                                disabled={index === array.length - 1}
                                onClick={(e) =>
                                  handleMoveBand(band.band_id, "right", e)
                                }
                              >
                                <ArrowRightIcon className="w-3 h-3" />
                              </IconButton>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Top Right: Manage Settings & Logo (Gear) + Delete Button (Trash) */}
                      <div className="flex items-center gap-1 z-30 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSelectedBandForSettings(band);
                          }}
                          className="p-1.5 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--acc-ink)] bg-[var(--surface)] hover:brightness-95 transition-ui cursor-pointer"
                          title={`Ajustes mínimos y logotipo de ${band.bandName}`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>

                        <IconButton
                          label="Eliminar esta banda de mi usuario"
                          variant="danger"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleRequestLeaveBand(band.band_id, band.bandName);
                          }}
                          disabled={!!leavingBandId}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconButton>
                      </div>
                    </div>

                    {/* Central Logo Avatar */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[var(--r-l)] overflow-hidden bg-[var(--surface)] transition-ui flex items-center justify-center p-2 my-1 shrink-0">
                      {band.logoUrl && !failedLogos.has(band.band_id) ? (
                        <img
                          src={band.logoUrl}
                          alt={band.bandName}
                          onError={() =>
                            setFailedLogos((prev) =>
                              new Set(prev).add(band.band_id),
                            )
                          }
                          className="w-full h-full object-contain filter transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[var(--r-m)] bg-[var(--acc)]/15 flex flex-col items-center justify-center text-[var(--acc-ink)] gap-1">
                          <Guitar className="w-8 h-8 opacity-80" />
                          <span className="text-xs font-bold font-sans text-[var(--ink-2)]">
                            {band.bandName.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Loading Spinner Overlay */}
                      {(isSwitching || isSettingMain || isLeavingThis) && (
                        <div className="absolute inset-0 bg-[var(--scrim)]/85 flex flex-col items-center justify-center text-[var(--on-scrim)] gap-1 z-30">
                          <Loader2 className="w-5 h-5 animate-spin text-[var(--acc)]" />
                          <span className="text-micro font-sans text-[var(--acc)] font-bold">
                            {isSettingMain
                              ? "Guardando"
                              : isLeavingThis
                                ? "Eliminando"
                                : "Cambiando"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Band Title */}
                    <div className="w-full text-center mt-2 shrink-0">
                      <h3
                        className="text-sm font-bold font-display text-[var(--ink)] group-hover:text-[var(--acc)]/70 transition-colors truncate px-1"
                        title={band.bandName}
                      >
                        {band.bandName}
                      </h3>
                    </div>

                    {/* Plan Badge */}
                    <div className="mt-1 flex items-center justify-center shrink-0">
                      {SIMPLE_PROMO_ONLY_BAND_CREATION ||
                      band.plan === "promo" ||
                      band.plan === "promo_plus" ? (
                        <span
                          className="inline-flex items-center gap-1 text-micro font-sans font-semibold px-2 py-0.5 rounded-[var(--r-s)]"
                          style={{
                            backgroundColor: `${planDef.color}18`,
                            color: planDef.color,
                            borderColor: `${planDef.color}40`,
                          }}
                          title={`Plan actual: ${planDef.name}`}
                        >
                          <Crown className="w-2.5 h-2.5" />
                          <span>{planDef.name}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSelectedBandForUpgrade(band);
                            setShowUpgradeModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-micro font-sans font-semibold px-2 py-0.5 rounded-[var(--r-s)] transition-ui cursor-pointer group/plan"
                          style={{
                            backgroundColor: `${planDef.color}18`,
                            color: planDef.color,
                            borderColor: `${planDef.color}40`,
                          }}
                          title={`Plan actual: ${planDef.name}. Clic para Cambiar Plan (Upgrade / Downgrade)`}
                        >
                          <Crown className="w-2.5 h-2.5" />
                          <span>{planDef.name}</span>
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-60 group-hover/plan:opacity-100" />
                        </button>
                      )}
                    </div>

                    {/* Active Status Badge */}
                    <div className="mt-1.5 flex items-center justify-center h-5 shrink-0">
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-micro font-sans font-bold px-2.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/15 text-[var(--ink)]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>Activa</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Option Card: Add/Register Band */}
            <div
              onClick={openCreateBandModal}
              className="group flex flex-col items-center justify-center p-5 rounded-[var(--r-l)] bg-[var(--sunken)] hover:bg-[var(--surface)] transition-ui duration-300 cursor-pointer text-[var(--ink-2)] hover:text-[var(--acc)]/70 min-h-[170px]"
            >
              <div className="w-12 h-12 rounded-[var(--r-l)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink-2)] group-hover:text-[var(--acc)] transition-ui mb-2">
                <Plus className="w-5 h-5 transition-transform" />
              </div>
              <span className="text-xs font-bold font-display text-center">
                Añadir proyecto
              </span>
              <span className="text-micro font-sans text-[var(--ink-2)] mt-0.5 text-center">
                Registrar otra banda
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-8 pt-4/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--ink-2)]">
            <span className="font-sans">
              {uniqueBands.length}{" "}
              {uniqueBands.length === 1
                ? "proyecto disponible"
                : "proyectos disponibles"}
            </span>
            <Button
              variant="neutral"
              size="sm"
              onClick={onClose}
            >
              Mantener banda actual
            </Button>
          </div>
        </div>

        {/* Band Minimal Settings & Logo Modal (Gear Icon) */}
        {selectedBandForSettings && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[var(--scrim)]/85 animate-in fade-in duration-150 overflow-y-auto">
            <div className="w-full max-w-md rounded-[var(--r-xl)] bg-[var(--surface)] text-[var(--ink)] p-6 sm:p-7 space-y-5 my-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--hair)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/15 flex items-center justify-center text-[var(--acc-ink)] shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-base text-[var(--ink)] font-display truncate max-w-[200px] sm:max-w-xs"
                      title={selectedBandForSettings.bandName}
                    >
                      Ajustes de {selectedBandForSettings.bandName}
                    </h3>
                    <p className="text-xs text-[var(--acc-ink)]/80 font-mono">
                      Configuración básica y logotipo
                    </p>
                  </div>
                </div>
                <IconButton
                  label="Cerrar"
                  type="button"
                  onClick={() => setSelectedBandForSettings(null)}
                >
                  <X className="w-5 h-5" />
                </IconButton>
              </div>

              {/* Logo Upload Section */}
              <div className="space-y-3 bg-[var(--sunken)] p-4 rounded-[var(--r-l)]">
                <label className="text-xs font-mono font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                  <span>Logotipo oficial de la banda</span>
                </label>

                <div className="flex items-center gap-4 pt-1">
                  {/* Logo Preview */}
                  <div className="relative w-20 h-20 rounded-[var(--r-m)] bg-[var(--surface)] overflow-hidden flex items-center justify-center shrink-0 p-2 ">
                    {(() => {
                      const clean = cleanBandId(
                        selectedBandForSettings.band_id,
                      );
                      const currentLogo =
                        customLogos[clean] || selectedBandForSettings.logoUrl;
                      if (
                        currentLogo &&
                        !failedLogos.has(selectedBandForSettings.band_id)
                      ) {
                        return (
                          <img
                            src={currentLogo}
                            alt={selectedBandForSettings.bandName}
                            onError={() =>
                              setFailedLogos((prev) =>
                                new Set(prev).add(
                                  selectedBandForSettings.band_id,
                                ),
                              )
                            }
                            className="w-full h-full object-contain filter "
                            referrerPolicy="no-referrer"
                          />
                        );
                      }
                      return (
                        <div className="flex flex-col items-center justify-center text-[var(--acc-ink)] gap-0.5">
                          <Guitar className="w-6 h-6 opacity-80" />
                          <span className="text-micro font-bold font-mono text-[var(--ink-2)]">
                            {selectedBandForSettings.bandName
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      );
                    })()}

                    {uploadingBandId === selectedBandForSettings.band_id && (
                      <div className="absolute inset-0 bg-[var(--scrim)]/80 flex flex-col items-center justify-center text-[var(--on-scrim)] gap-1">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--acc-ink)]" />
                        <span className="text-micro font-mono text-[var(--acc-ink)] ">
                          Subiendo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] text-xs font-bold transition-ui cursor-pointer active:scale-[0.97]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingBandId === selectedBandForSettings.band_id
                          ? "Guardando..."
                          : "Subir Imagen de Logo"}
                      </span>
                      <input aria-label="Logotipo oficial de la banda"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={
                          uploadingBandId === selectedBandForSettings.band_id
                        }
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleUploadLogo(
                              selectedBandForSettings.band_id,
                              file,
                            );
                          }
                        }}
                      />
                    </label>
                    <p className="text-micro text-[var(--ink-2)] font-sans leading-tight">
                      PNG, JPG, SVG o WebP. Fondo transparente recomendado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Band Info */}
              <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-l)] text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-2)] font-mono">
                    Nombre del Proyecto:
                  </span>
                  <span className="font-bold text-[var(--ink)] ">
                    {selectedBandForSettings.bandName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-2)] font-mono">
                    Plan Actual:
                  </span>
                  <span className="font-sans font-semibold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--acc-ink)] text-micro">
                    {selectedBandForSettings.plan
                      ? selectedBandForSettings.plan.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
                      : "Emergente"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-2)] font-mono">
                    ID de Banda:
                  </span>
                  <span className="font-mono text-micro text-[var(--ink-2)] truncate max-w-[160px]">
                    {cleanBandId(selectedBandForSettings.band_id)}
                  </span>
                </div>
              </div>

              {/* Actions: Team Management + Close */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-[var(--hair)]">
                {onOpenBandManagement && (
                  <Button
                    variant="neutral"
                    type="button"
                    onClick={async () => {
                      const bId = selectedBandForSettings.band_id;
                      setSelectedBandForSettings(null);
                      if (
                        !isSameBandId(bId, currentActiveBandId) &&
                        onSwitchBand
                      ) {
                        await onSwitchBand(bId);
                      }
                      onClose();
                      onOpenBandManagement(bId);
                    }}
                    className="w-full sm:flex-1 items-center justify-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                    <span>Gestionar músicos</span>
                  </Button>
                )}

                <Button
                  variant="neutral"
                  type="button"
                  onClick={() => setSelectedBandForSettings(null)}
                  className="w-full sm:w-auto"
                >
                  Listo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* In-App Create / Add Band Modal with Full 2-Step Flow & Plans */}
        {showCreateBandModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[var(--scrim)]/85 animate-in fade-in duration-150 overflow-y-auto">
            <div
              className={`w-full ${createBandStep === 1 ? "max-w-lg" : "max-w-5xl"} rounded-[var(--r-l)] bg-[var(--surface)] text-[var(--ink-2)] p-6 sm:p-8 space-y-6 transition-ui duration-300 my-auto`}
            >
              {/* Step 1: Band Details */}
              {createBandStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-[var(--r-l)] bg-[var(--acc)]/15 flex items-center justify-center text-[var(--acc-ink)] shrink-0">
                        <Guitar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[var(--ink)] font-display ">
                          Añadir nuevo proyecto musical
                        </h3>
                        <p className="text-xs text-[var(--acc)]/80 font-sans">
                          {SIMPLE_PROMO_ONLY_BAND_CREATION
                            ? "Información del proyecto"
                            : "Paso 1 de 2 • Información del proyecto"}
                        </p>
                      </div>
                    </div>
                    <IconButton
                      label="Cerrar"
                      type="button"
                      onClick={() => setShowCreateBandModal(false)}
                    >
                      <X className="w-5 h-5" />
                    </IconButton>
                  </div>

                  <form onSubmit={handleStep1Submit} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                          <Guitar className="w-3.5 h-3.5 text-[var(--acc)]" />
                          <span>Nombre del proyecto / banda *</span>
                        </label>
                        <BandNameStylerHelper
                          value={newBandName}
                          onChange={(styled) => setNewBandName(styled)}
                        />
                      </div>
                      <Input
                        type="text"
                        value={newBandName}
                        onChange={(e) => setNewBandName(e.target.value)}
                        placeholder="Ej: Los Nocturnos, KoЯn, 𝕭𝖑𝖆𝖈𝖐 𝕸𝖊𝖙𝖆𝖑, Bakandeya…"
                        required
                        autoFocus
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-[var(--acc)]" />
                        <span>Tu rol o nombre en este proyecto</span>
                      </label>
                      <Input
                        size="sm"
                        type="text"
                        value={newBandLeaderName}
                        onChange={(e) => setNewBandLeaderName(e.target.value)}
                        placeholder="Ej: Kurt Cobain (Guitarra y Mánager)"
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-[var(--acc)]" />
                          <span>Estilo musical / género</span>
                        </label>
                        <Input
                          size="sm"
                          type="text"
                          value={newBandStyle}
                          onChange={(e) => setNewBandStyle(e.target.value)}
                          placeholder="Ej: Rock, Indie, Mestizaje, Ska…"
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[var(--acc)]" />
                          <span>Ciudad / ubicación base</span>
                        </label>
                        <Input
                          size="sm"
                          type="text"
                          value={newBandLocation}
                          onChange={(e) => setNewBandLocation(e.target.value)}
                          placeholder="Ej: Madrid, Barcelona, Valencia…"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        variant="neutral"
                        type="button"
                        onClick={() => setShowCreateBandModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={
                          !newBandName.trim() ||
                          (SIMPLE_PROMO_ONLY_BAND_CREATION && isCreatingBand)
                        }
                        className="items-center gap-2"
                      >
                        {SIMPLE_PROMO_ONLY_BAND_CREATION ? (
                          isCreatingBand ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Creando…</span>
                            </>
                          ) : (
                            <>
                              <span>Crear proyecto</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )
                        ) : (
                          <>
                            <span>Continuar a elegir plan</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 2: Plans Selection View (Identical to Login Registration Flow) */}
              {createBandStep === 2 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="neutral"
                      size="xs"
                      type="button"
                      onClick={() => setCreateBandStep(1)}
                      disabled={isCreatingBand}
                      className="items-center gap-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver a datos de la banda</span>
                    </Button>
                    <IconButton
                      label="Cerrar"
                      type="button"
                      onClick={() => setShowCreateBandModal(false)}
                      disabled={isCreatingBand}
                    >
                      <X className="w-5 h-5" />
                    </IconButton>
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ink-2)] ">
                      Elige el plan para{" "}
                      <span className="text-[var(--acc)]">
                        {newBandName.trim() || "tu Proyecto"}
                      </span>
                    </h2>
                    <p className="text-[var(--ink-2)] max-w-xl mx-auto text-xs sm:text-sm">
                      Sube de nivel tu carrera musical. Puedes cambiar de plan
                      en cualquier momento.
                    </p>

                    {/* Filter category pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                      <Button
                        variant={newBandFeatureCategory === "all" ? "inverse" : "neutral"}
                        size="xs"
                        type="button"
                        onClick={() => setNewBandFeatureCategory("all")}
                      >
                        Todas las funciones
                      </Button>
                      <Button
                        variant={newBandFeatureCategory === "booking" ? "inverse" : "neutral"}
                        size="xs"
                        type="button"
                        onClick={() => setNewBandFeatureCategory("booking")}
                      >
                        <ShowIcon inline emoji="🎯" />Booking y salas
                      </Button>
                      <Button
                        variant={newBandFeatureCategory === "media" ? "inverse" : "neutral"}
                        size="xs"
                        type="button"
                        onClick={() => setNewBandFeatureCategory("media")}
                      >
                        <ShowIcon inline emoji="📱" />Redes, EPK y fans
                      </Button>
                      <Button
                        variant={newBandFeatureCategory === "finance" ? "inverse" : "neutral"}
                        size="xs"
                        type="button"
                        onClick={() => setNewBandFeatureCategory("finance")}
                      >
                        <ShowIcon inline emoji="💼" />Finanzas y agentes 360
                      </Button>
                    </div>
                  </div>

                  {/* 4 Pricing & Plan Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch pt-2">
                    {/* PLAN 1: ENSAYO */}
                    <div className="bg-[var(--sunken)] rounded-[var(--r-xl)] p-5 flex flex-col hover:transition-colors">
                      <div className="mb-3">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-micro font-sans font-bold px-2 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--ink-2)]">
                            Gratis
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--ink-2)]">
                          Ensayo
                        </h3>
                        <div className="mt-1.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[var(--ink)]">
                            0€
                          </span>
                          <span className="text-xs text-[var(--ink-2)] font-medium">
                            / siempre
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] mt-1.5 min-h-[32px]">
                          Para proyectos noveles que arrancan su local.
                        </p>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1 text-xs">
                        {[
                          { text: "10 salas en CRM", cat: "booking" },
                          { text: "Calendario y bolos", cat: "booking" },
                          { text: "EPK Dossier básico", cat: "media" },
                          { text: "Repertorio y afinador", cat: "media" },
                        ].map((f, i) => {
                          const isHighlighted =
                            newBandFeatureCategory === "all" ||
                            newBandFeatureCategory === f.cat;
                          return (
                            <li
                              key={i}
                              className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? "text-[var(--ink-2)] opacity-100" : "text-[var(--ink-2)] opacity-40"}`}
                            >
                              <Check
                                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? "text-[var(--ink-2)]" : "text-[var(--ink-2)]"}`}
                              />
                              <span
                                className={
                                  isHighlighted &&
                                  newBandFeatureCategory !== "all"
                                    ? "font-bold text-[var(--acc)]"
                                    : ""
                                }
                              >
                                {f.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      <button
                        type="button"
                        onClick={() => handleSelectPlanForCreation("ensayo")}
                        disabled={isCreatingBand}
                        className="w-full py-2.5 rounded-[var(--r-l)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCreatingBand && creatingPlanKey === "ensayo" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--ink)]" />
                            <span>Configurando…</span>
                          </>
                        ) : (
                          <span>Empezar gratis</span>
                        )}
                      </button>
                    </div>

                    {/* PLAN 2: LOCAL */}
                    <div className="bg-[var(--sunken)] rounded-[var(--r-xl)] p-5 flex flex-col hover:transition-colors relative">
                      <div className="mb-3">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-micro font-sans font-bold px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--ink-2)]">
                            Iniciación
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--ink-2)]">
                          Local
                        </h3>
                        <div className="mt-1.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[var(--ink)]">
                            12€
                          </span>
                          <span className="text-xs text-[var(--ink-2)]">
                            / mes
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] mt-1.5 min-h-[32px]">
                          El kit esencial para bandas tocando en su circuito
                          local.
                        </p>
                      </div>

                      <div className="mb-3 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--surface)]/80 flex items-center gap-1.5 text-micro font-sans text-[var(--ink-2)] font-bold">
                        <span>250 pegatinas gratis</span>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1 text-xs">
                        {[
                          { text: "50 salas de conciertos", cat: "booking" },
                          { text: "20 medios y radios", cat: "booking" },
                          { text: "100 fans con QR", cat: "media" },
                          { text: "Reels & Social Center", cat: "media" },
                        ].map((f, i) => {
                          const isHighlighted =
                            newBandFeatureCategory === "all" ||
                            newBandFeatureCategory === f.cat;
                          return (
                            <li
                              key={i}
                              className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? "text-[var(--ink-2)] opacity-100" : "text-[var(--ink-2)] opacity-40"}`}
                            >
                              <Check
                                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? "text-[var(--ink-2)]" : "text-[var(--ink-2)]"}`}
                              />
                              <span
                                className={
                                  isHighlighted &&
                                  newBandFeatureCategory !== "all"
                                    ? "font-bold text-[var(--acc)]"
                                    : ""
                                }
                              >
                                {f.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      <button
                        type="button"
                        onClick={() => handleSelectPlanForCreation("local")}
                        disabled={isCreatingBand}
                        className="w-full py-2.5 rounded-[var(--r-l)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCreatingBand && creatingPlanKey === "local" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--ink)]" />
                            <span>Configurando…</span>
                          </>
                        ) : (
                          <span>Elegir local</span>
                        )}
                      </button>
                    </div>

                    {/* PLAN 3: DE GIRA (Destacado) */}
                    <div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-5 flex flex-col relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--acc)] text-[var(--on-acc)] text-micro font-bold py-0.5 px-2.5 rounded-[var(--r-pill)] flex items-center gap-1 whitespace-nowrap">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Más Popular
                      </div>

                      <div className="mb-3 mt-1">
                        <h3 className="text-base font-bold text-[var(--acc)]">
                          De Gira
                        </h3>
                        <div className="mt-1.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[var(--ink)]">
                            29€
                          </span>
                          <span className="text-xs text-[var(--ink-2)]">
                            / mes
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] mt-1.5 min-h-[32px]">
                          Para bandas que tocan con frecuencia y automatizan con
                          IA.
                        </p>
                      </div>

                      <div className="mb-3 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center gap-1.5 text-micro font-sans text-[var(--acc-ink)] font-bold">
                        <span>500 pegatinas gratis</span>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1 text-xs">
                        {[
                          { text: "Salas & medios ilimitados", cat: "booking" },
                          {
                            text: "Agente Booking IA en batch",
                            cat: "booking",
                          },
                          { text: "Rutas de Gira & Dietas", cat: "booking" },
                          { text: "Fans & Reels ilimitados", cat: "media" },
                        ].map((f, i) => {
                          const isHighlighted =
                            newBandFeatureCategory === "all" ||
                            newBandFeatureCategory === f.cat;
                          return (
                            <li
                              key={i}
                              className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? "text-[var(--ink-2)] opacity-100" : "text-[var(--ink-2)] opacity-40"}`}
                            >
                              <Zap
                                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? "text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
                              />
                              <span
                                className={
                                  isHighlighted &&
                                  newBandFeatureCategory !== "all"
                                    ? "font-bold text-[var(--acc)]"
                                    : ""
                                }
                              >
                                {f.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      <button
                        type="button"
                        onClick={() => handleSelectPlanForCreation("de_gira")}
                        disabled={isCreatingBand}
                        className="w-full py-2.5 rounded-[var(--r-l)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold text-xs transition-colors cursor-pointer/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isCreatingBand && creatingPlanKey === "de_gira" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--ink)]" />
                            <span>Configurando…</span>
                          </>
                        ) : (
                          <>
                            <span>Elegir de Gira</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* PLAN 4: CABEZA DE CARTEL */}
                    <div className="bg-[var(--sunken)] rounded-[var(--r-xl)] p-5 flex flex-col hover:bg-[var(--ok-soft)] transition-colors">
                      <div className="mb-3">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-micro font-sans font-bold px-2 py-0.5 rounded bg-[var(--ok-soft)] text-[var(--ink-2)]">
                            Élite 360
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--ink-2)]">
                          Cabeza de cartel
                        </h3>
                        <div className="mt-1.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[var(--ink)]">
                            79€
                          </span>
                          <span className="text-xs text-[var(--ink-2)]">
                            / mes
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] mt-1.5 min-h-[32px]">
                          Control total para proyectos profesionales y agencias.
                        </p>
                      </div>

                      <div className="mb-3 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--ok-soft)] flex items-center gap-1.5 text-micro font-sans text-[var(--ink-2)] font-bold">
                        <span>1.000 pegatinas + Express</span>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1 text-xs">
                        {[
                          { text: "Hasta 5 bandas multi-proyecto", cat: "all" },
                          { text: "Finanzas & Balances Pro", cat: "finance" },
                          {
                            text: "Taller Merchan & Inventario",
                            cat: "finance",
                          },
                          {
                            text: "IA Multi-Agente & Soporte VIP",
                            cat: "finance",
                          },
                        ].map((f, i) => {
                          const isHighlighted =
                            newBandFeatureCategory === "all" ||
                            newBandFeatureCategory === f.cat;
                          return (
                            <li
                              key={i}
                              className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? "text-[var(--ink-2)] opacity-100" : "text-[var(--ink-2)] opacity-40"}`}
                            >
                              <Shield
                                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? "text-[var(--ok)]" : "text-[var(--ink-2)]"}`}
                              />
                              <span
                                className={
                                  isHighlighted &&
                                  newBandFeatureCategory !== "all"
                                    ? "font-bold text-[var(--acc)]"
                                    : ""
                                }
                              >
                                {f.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      <button
                        type="button"
                        onClick={() =>
                          handleSelectPlanForCreation("cabeza_de_cartel")
                        }
                        disabled={isCreatingBand}
                        className="w-full py-2.5 rounded-[var(--r-l)] bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ink)] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCreatingBand &&
                        creatingPlanKey === "cabeza_de_cartel" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--ink)]" />
                            <span>Configurando…</span>
                          </>
                        ) : (
                          <span>Seleccionar 360</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* In-App Delete Band Confirmation Modal */}
        {bandToDelete && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/85 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-[var(--r-l)] bg-[var(--surface)] text-[var(--ink-2)] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--alert)]/15 flex items-center justify-center text-[var(--ink)] shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--ink)] font-sans">
                    ¿Eliminar proyecto?
                  </h3>
                  <p className="text-xs text-[var(--ink-2)]">
                    Desvincular de tu usuario
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                ¿Estás seguro de que deseas eliminar{" "}
                <strong className="text-[var(--ink)]">
                  "{bandToDelete.name}"
                </strong>{" "}
                de tu cuenta? Perderás el acceso a sus salas, eventos y
                repertorio.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={() => setBandToDelete(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  type="button"
                  onClick={handleConfirmLeaveBand}
                  className="items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sí, eliminar</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Plan Modal */}
        {showUpgradeModal &&
          (() => {
            const targetBand = selectedBandForUpgrade ||
              availableBands.find((b) =>
                isSameBandId(b.band_id, currentUser?.band_id),
              ) || {
                band_id: currentUser?.band_id,
                bandName: currentUser?.bandName,
                plan: currentUser?.plan,
              };
            const targetBandName =
              targetBand.bandName ||
              targetBand.nombre_banda ||
              currentUser?.bandName ||
              "tu banda";
            const targetBandPlan =
              targetBand.plan ||
              (isSameBandId(targetBand.band_id, currentUser?.band_id)
                ? currentUser?.plan
                : "ensayo");
            const currentPlanDef = getPlanDefinition(targetBandPlan);

            return (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/85 animate-in fade-in duration-200 text-left">
                <div className="w-full max-w-lg rounded-[var(--r-l)] bg-[var(--surface)] text-[var(--ink-2)] overflow-hidden flex flex-col">
                  <div className="px-6 py-4 bg-[var(--acc)] flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--acc)]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--acc)]/70 font-sans">
                          Planes y Upgrade — {targetBandName}
                        </h3>
                        <p className="text-micro text-[var(--ink-2)] font-sans">
                          Plan independiente para {targetBandName}
                        </p>
                      </div>
                    </div>
                    <IconButton
                      label="Cerrar"
                      size="icon-xs"
                      onClick={() => setShowUpgradeModal(false)}
                    >
                      <X className="w-5 h-5" />
                    </IconButton>
                  </div>

                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-3">
                      {Object.values(PLANS)
                        .filter(
                          (p) =>
                            !SIMPLE_PROMO_ONLY_BAND_CREATION ||
                            p.id === "promo",
                        )
                        .map((plan) => {
                          const isCurrent = currentPlanDef.id === plan.id;
                          return (
                            <div
                              key={plan.id}
                              className={`p-4 rounded-[var(--r-m)] transition-ui ${
                                isCurrent
                                  ? "bg-[var(--acc)]/10 ring-1 ring-[var(--acc)]/30"
                                  : "bg-[var(--surface)]/60 hover:"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-[var(--ink)] font-sans">
                                    {plan.name}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-micro font-sans font-bold px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc-ink)]">
                                      Plan actual
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-bold font-sans text-[var(--acc)]">
                                  {plan.price}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--ink-2)] mt-1">
                                {plan.description}
                              </p>
                              <ul className="mt-2.5 space-y-1 font-sans">
                                {plan.features.map((feat, idx) => (
                                  <li
                                    key={idx}
                                    className="text-micro text-[var(--ink-2)] flex items-center gap-1.5"
                                  >
                                    <Check className="w-3 h-3 text-[var(--ok)] shrink-0" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>

                              <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 ">
                                <span className="text-micro font-sans text-[var(--ink-2)]">
                                  {isCurrent
                                    ? "Plan activo para esta banda"
                                    : "Cambio de plan inmediato"}
                                </span>
                                {isCurrent ? (
                                  <span className="text-micro font-sans font-bold px-2.5 py-1 rounded bg-[var(--acc)]/20 text-[var(--acc-ink)] flex items-center gap-1">
                                    <Check className="w-3 h-3 text-[var(--acc)]" />
                                    <span>Activo</span>
                                  </span>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    type="button"
                                    onClick={async () => {
                                      const isLeaderOrAdmin =
                                        targetBand?.role === "leader" ||
                                        targetBand?.role === "admin" ||
                                        currentUser?.role === "leader" ||
                                        currentUser?.role === "admin";
                                      if (!isLeaderOrAdmin) {
                                        alert(
                                          "Sólo los administradores o líderes de esta banda pueden cambiar o mejorar su plan de suscripción.",
                                        );
                                        return;
                                      }
                                      try {
                                        const targetBandId =
                                          targetBand.band_id ||
                                          currentUser?.band_id;

                                        // If it's a paid plan, initiate Stripe Checkout session!
                                        if (plan.id !== "ensayo") {
                                          await api.startCheckout({
                                            planId: plan.id,
                                            billingInterval: "monthly",
                                            bandId: targetBandId,
                                            userEmail:
                                              currentUser?.email &&
                                              currentUser.email.includes("@")
                                                ? currentUser.email
                                                : undefined,
                                          });
                                          setShowUpgradeModal(false);
                                          return;
                                        }

                                        // Free plan (ensayo)
                                        if (currentUser?.id) {
                                          await api.updateUser(currentUser.id, {
                                            plan: plan.id,
                                            band_id: targetBandId,
                                          } as any);
                                        }
                                        if (
                                          isSameBandId(
                                            targetBandId,
                                            currentUser?.band_id,
                                          ) &&
                                          currentUser
                                        ) {
                                          const updatedUser = {
                                            ...currentUser,
                                            plan: plan.id,
                                          };
                                          localStorage.setItem(
                                            "bakandeya_user",
                                            JSON.stringify(updatedUser),
                                          );
                                        }
                                        setShowUpgradeModal(false);
                                        setSuccessMessage(
                                          `¡Plan de ${targetBandName} cambiado a ${plan.name}!`,
                                        );
                                        if (onRefreshData)
                                          await onRefreshData();
                                      } catch (e: any) {
                                        console.error(
                                          "Error al cambiar plan:",
                                          e,
                                        );
                                        alert(
                                          e?.message ||
                                            "No se pudo actualizar el plan. Reintenta en unos instantes.",
                                        );
                                      }
                                    }}
                                    className="items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3 fill-[var(--ink-3)]" />
                                    <span>Seleccionar {plan.name}</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-[var(--sunken)] flex justify-end">
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="px-4 py-1.5 rounded-[var(--r-pill)] text-xs font-sans bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </ModalPortal>
  );
};
