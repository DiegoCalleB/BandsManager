/**
 * Controlador del selector de bandas: estado, lista, orden, creación y acciones.
 * Extraído de BandSwitcherModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useState } from "react";
import { User } from "../../../types";
import { cleanBandId } from "../../../utils/bandUtils";
import type { SwitcherBand,SwitcherEpkConfig } from "../bandSwitcherTypes";
import { useBandActions } from "./useBandActions";
import { useBandList } from "./useBandList";
import { useBandOrdering } from "./useBandOrdering";
import { useBandReorder } from "./useBandReorder";
import { useCreateBand } from "./useCreateBand";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandSwitcherControllerParams {
  currentUser: User;
  availableBands: SwitcherBand[];
  epkConfig: SwitcherEpkConfig | undefined;
  onSwitchBand: (bandId: string) => Promise<unknown>;
  onRefreshData: () => void;
  onSetMainBand: (bandId: string) => Promise<unknown>;
  onUpdateEpkConfig: (config: SwitcherEpkConfig) => void | Promise<unknown>;
  onClose: () => void;
}

/**
 * Controlador del selector de bandas: estado, lista, orden, creación y acciones.
 * @param params Estado y callbacks del contenedor ({@link BandSwitcherControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandSwitcherController({ currentUser, availableBands, epkConfig, onSwitchBand, onRefreshData, onSetMainBand, onUpdateEpkConfig, onClose }: BandSwitcherControllerParams) {
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
    useState<SwitcherBand | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

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

  const currentActiveBandId = currentUser?.band_id || "";

  const activeClean = cleanBandId(currentActiveBandId);

  const [localMainBandId, setLocalMainBandId] = useState<string>(mainBandId);

  useEffect(() => {
    if (currentUser?.main_band_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado local con el usuario actualizado
      setLocalMainBandId(currentUser.main_band_id);
    } else if (currentUser?.band_id) {
      setLocalMainBandId(currentUser.band_id);
    }
  }, [currentUser?.main_band_id, currentUser?.band_id]);

  const { bandOrder, saveOrder } = useBandOrdering({ currentUser });

  const { uniqueBands } = useBandList({ availableBands, customLogos, currentActiveBandId, epkConfig, currentUser, activeClean, mainBandId, bandOrder });

  const { draggedBandId, handleDragStart, handleDragOver, handleDrop, handleMoveBand } = useBandReorder({ uniqueBands, saveOrder });

  const { openCreateBandModal, showCreateBandModal, createBandStep, setShowCreateBandModal, handleStep1Submit, newBandName, setNewBandName, newBandLeaderName, setNewBandLeaderName, newBandStyle, setNewBandStyle, newBandLocation, setNewBandLocation, isCreatingBand, setCreateBandStep, newBandFeatureCategory, setNewBandFeatureCategory, handleSelectPlanForCreation, creatingPlanKey } = useCreateBand({ currentUser, setErrorMessage, setSuccessMessage, onSwitchBand, onRefreshData });

  const { handleSelectBand, handleSetMainBandAction, handleRequestLeaveBand, handleUploadLogo, handleConfirmLeaveBand } = useBandActions({ setBandToDelete, bandToDelete, setLeavingBandId, setErrorMessage, setSuccessMessage, onSwitchBand, onRefreshData, settingMainBandId, setSettingMainBandId, setLocalMainBandId, onSetMainBand, setUploadingBandId, setCustomLogos, currentActiveBandId, onUpdateEpkConfig, epkConfig, onClose, setSwitchingBandId });

  return { switchingBandId, uniqueBands, searchQuery, setSearchQuery, errorMessage, successMessage, currentActiveBandId, localMainBandId, mainBandId, settingMainBandId, leavingBandId, draggedBandId, handleDragStart, handleDragOver, handleDrop, handleSelectBand, handleSetMainBandAction, handleMoveBand, setSelectedBandForSettings, handleRequestLeaveBand, failedLogos, setFailedLogos, setSelectedBandForUpgrade, setShowUpgradeModal, openCreateBandModal, selectedBandForSettings, customLogos, uploadingBandId, handleUploadLogo, showCreateBandModal, createBandStep, setShowCreateBandModal, handleStep1Submit, newBandName, setNewBandName, newBandLeaderName, setNewBandLeaderName, newBandStyle, setNewBandStyle, newBandLocation, setNewBandLocation, isCreatingBand, setCreateBandStep, newBandFeatureCategory, setNewBandFeatureCategory, handleSelectPlanForCreation, creatingPlanKey, bandToDelete, setBandToDelete, handleConfirmLeaveBand, showUpgradeModal, selectedBandForUpgrade, setSuccessMessage };
}
