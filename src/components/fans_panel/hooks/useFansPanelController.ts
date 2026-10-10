/**
 * Controlador del panel de fans: pestañas, filtros, ciudades, incentivo, QR y alta manual.
 * Extraído de FansPanel.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useState } from "react";
import { useModuleTutorial } from "../../../hooks/useModuleTutorial";
import { Concert,EPKConfig,Fan } from "../../../types";
import { useCityChips } from "./useCityChips";
import { useFanIncentive } from "./useFanIncentive";
import { useFansFilters } from "./useFansFilters";
import { useManualFanForm } from "./useManualFanForm";
import { useQrCustomization } from "./useQrCustomization";
import { useQrLink } from "./useQrLink";
import { useQrSharing } from "./useQrSharing";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FansPanelControllerParams {
  currentBandName: string;
  epkConfig: Partial<EPKConfig>;
  currentBandLogo: string;
  currentBandId: string;
  initialConcertId: string;
  isPromo: boolean;
  onUpdateIncentive: (newIncentive: { mensajeAgradecimiento?: string; enlaceDescarga?: string; codigoDescuento?: string; fraseGancho?: string; premioTexto?: string; recompensaTipo?: string; }) => void;
  onUpdateEpkConfig: (newConfig: Partial<EPKConfig>) => void;
  fans: Fan[];
  concerts: Concert[];
  onAddFan: (fan: Fan) => void;
}

/**
 * Controlador del panel de fans: pestañas, filtros, ciudades, incentivo, QR y alta manual.
 * @param params Estado y callbacks del contenedor ({@link FansPanelControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFansPanelController({ currentBandName, epkConfig, currentBandLogo, currentBandId, initialConcertId, isPromo, onUpdateIncentive, onUpdateEpkConfig, fans, concerts, onAddFan }: FansPanelControllerParams) {
  const effectiveBandName =
    currentBandName ||
    epkConfig?.contactoBooking?.nombre ||
    "Tu Banda";

  const effectiveBandLogo = currentBandLogo || epkConfig?.logoUrl || "";

  const cleanBandId =
    (currentBandId || "").toLowerCase().replace(/^(band|reg)-/, "") || "banda";

  const [activeTab, setActiveTab] = useState<
    "metrics" | "fans" | "qr" | "dashboard"
  >(initialConcertId || isPromo ? "qr" : "metrics");

  const [viewMode, setViewMode] = useState<"feed" | "grid" | "table" | "map">(
    "feed",
  );

  const [selectedConcertId, setSelectedConcertId] = useState<string>(
    initialConcertId || "",
  );

  const [savedToConcertFeedback, setSavedToConcertFeedback] = useState(false);

  const { clickStats, qrCustomConfig, handleQrConfigChange } = useQrCustomization({ currentBandId });

  const { savedIncentive, incentivo, setIncentivo, handleSaveIncentive } = useFanIncentive({ epkConfig, onUpdateIncentive, onUpdateEpkConfig });

  const { setSelectedCityFilter, selectedCityFilter, handleExportCSV, evolutionaryGrowthData, originData, searchQuery, setSearchQuery, filterOrigen, setFilterOrigen, uniqueConcertIds, selectedNivelFilter, setSelectedNivelFilter, filteredFans } = useFansFilters({ fans, concerts, effectiveBandName });

  const { customCityChips, handleRemoveCityTab, isAddingCity, handleAddCityTab, newCityInput, setNewCityInput, setIsAddingCity } = useCityChips({ epkConfig, onUpdateEpkConfig, setSelectedCityFilter, selectedCityFilter });

  const { setShowAddModal, showAddModal, handleManualAddSubmit, newNombre, setNewNombre, newEmail, setNewEmail, newCiudad, setNewCiudad, newOrigen, setNewOrigen, newNivel, setNewNivel, newInstagram, setNewInstagram, newCancionFavorita, setNewCancionFavorita, newMensaje, setNewMensaje } = useManualFanForm({ onAddFan });

  const { qrConcertUrl, selectedConcert, setUseCustomDomain, useCustomDomain, customDomain, setCustomDomain, routePrefix, setRoutePrefix, customSlug, setCustomSlug, setQrLanguage, qrLanguage } = useQrLink({ concerts, selectedConcertId, currentBandId, cleanBandId });

  const { copyLink, handleCopyQrUrl, copiedQrUrl, handlePrintQr, setShowQrMoreMenu, showQrMoreMenu, handleDownloadSvg, isExportingDirect, handleDownloadPng4k, setShowQrExportModal, handleShareWhatsApp, handleShareNative, setShowAdvancedQrConfig, showAdvancedQrConfig, showQrExportModal } = useQrSharing({ qrConcertUrl, selectedConcert, effectiveBandName, effectiveBandLogo });

  const {
    isOpen: isTutorialOpen,
    openTutorial,
    closeTutorial,
  } = useModuleTutorial("fans");

  useEffect(() => {
    if (initialConcertId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado local con la prop o la banda activa
      setSelectedConcertId(initialConcertId);
      setActiveTab("qr");
    }
  }, [initialConcertId]);

  const [showFansPreviewModal, setShowFansPreviewModal] = useState(false);

  const [showFansHeaderMenu, setShowFansHeaderMenu] = useState(false);

  return { openTutorial, setShowFansHeaderMenu, showFansHeaderMenu, setShowFansPreviewModal, copyLink, setShowAddModal, handleExportCSV, activeTab, setActiveTab, clickStats, effectiveBandName, evolutionaryGrowthData, originData, selectedCityFilter, setSelectedCityFilter, customCityChips, handleRemoveCityTab, isAddingCity, handleAddCityTab, newCityInput, setNewCityInput, setIsAddingCity, searchQuery, setSearchQuery, filterOrigen, setFilterOrigen, uniqueConcertIds, selectedNivelFilter, setSelectedNivelFilter, viewMode, setViewMode, filteredFans, effectiveBandLogo, selectedConcertId, setSelectedConcertId, qrConcertUrl, qrCustomConfig, selectedConcert, handleCopyQrUrl, copiedQrUrl, handlePrintQr, setShowQrMoreMenu, showQrMoreMenu, handleDownloadSvg, isExportingDirect, handleDownloadPng4k, setShowQrExportModal, handleShareWhatsApp, handleShareNative, handleQrConfigChange, setShowAdvancedQrConfig, showAdvancedQrConfig, savedIncentive, incentivo, setIncentivo, handleSaveIncentive, setUseCustomDomain, useCustomDomain, customDomain, setCustomDomain, routePrefix, setRoutePrefix, customSlug, setCustomSlug, setQrLanguage, qrLanguage, setSavedToConcertFeedback, savedToConcertFeedback, showQrExportModal, showAddModal, handleManualAddSubmit, newNombre, setNewNombre, newEmail, setNewEmail, newCiudad, setNewCiudad, newOrigen, setNewOrigen, newNivel, setNewNivel, newInstagram, setNewInstagram, newCancionFavorita, setNewCancionFavorita, newMensaje, setNewMensaje, showFansPreviewModal, isTutorialOpen, closeTutorial };
}
