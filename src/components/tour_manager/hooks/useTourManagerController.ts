/**
 * Controlador del gestor de giras: formulario, modal, guardado y borrado.
 * Extraído de TourManager.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Concert,Lead,Payment,Tour } from "../../../types";
import { useTourDelete } from "./useTourDelete";
import { useTourForm } from "./useTourForm";
import { useTourModal } from "./useTourModal";
import { useTourSave } from "./useTourSave";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface TourManagerControllerParams {
  bandUsers: { id: string; name: string; username?: string; role?: string; instrument?: string; band_id?: string; bandName?: string; }[];
  leads: Lead[];
  currentBandId: string;
  currentBandName: string;
  concerts: Concert[];
  onUpdateConcert: (id: string, updatedFields: Partial<Concert>) => void;
  onAddConcert: (concert: Concert) => void;
  onSaveTour: (tour: Tour) => void;
  onAddPayment: (payment: Payment) => void;
  onDeleteTour: (id: string) => void;
}

/**
 * Controlador del gestor de giras: formulario, modal, guardado y borrado.
 * @param params Estado y callbacks del contenedor ({@link TourManagerControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTourManagerController({ bandUsers, leads, currentBandId, currentBandName, concerts, onUpdateConcert, onAddConcert, onSaveTour, onAddPayment, onDeleteTour }: TourManagerControllerParams) {
  const { setFormNombre, setFormVehiculos, setFormEstado, setFormConvocatoriaTipo, setFormConvocadosIds, availableMembers, setFormSincronizarCalendario, setFormSincronizarFinanzas, setFormStops, formNombre, formStops, formVehiculos, formConvocatoriaTipo, formConvocadosIds, formSincronizarCalendario, formEstado, formSincronizarFinanzas, handleSelectAllMembers, handleToggleMember, dietaPerPersona, setDietaPerPersona, handleAutoCalculateDietas, handleAddVehicle, recalculateAllFuelStops, handleRemoveVehicle, handleApplyPresetToVehicle, VEHICLE_PRESETS, handleUpdateVehicle, totalFleetCostPer100Km, addStop, removeStop, handleSelectVenueForStop, updateStop } = useTourForm({ bandUsers, leads });

  const { editingTour, setIsModalOpen, handleOpenCreateModal, handleOpenEditModal, isModalOpen } = useTourModal({ setFormNombre, setFormVehiculos, setFormEstado, setFormConvocatoriaTipo, setFormConvocadosIds, availableMembers, setFormSincronizarCalendario, setFormSincronizarFinanzas, setFormStops });

  const { syncFeedback, handleVolcarEnFinanzas, handleSave } = useTourSave({ formNombre, formStops, formVehiculos, formConvocatoriaTipo, availableMembers, formConvocadosIds, editingTour, formSincronizarCalendario, currentBandId, currentBandName, formEstado, concerts, onUpdateConcert, onAddConcert, formSincronizarFinanzas, onSaveTour, setIsModalOpen, onAddPayment });

  const { handleDelete, tourToDelete, setTourToDelete, confirmDelete } = useTourDelete({ onDeleteTour });

  return { handleOpenCreateModal, syncFeedback, availableMembers, handleOpenEditModal, handleDelete, handleVolcarEnFinanzas, isModalOpen, setIsModalOpen, editingTour, handleSave, formNombre, setFormNombre, formEstado, setFormEstado, formConvocatoriaTipo, setFormConvocatoriaTipo, setFormConvocadosIds, handleSelectAllMembers, formConvocadosIds, handleToggleMember, dietaPerPersona, setDietaPerPersona, handleAutoCalculateDietas, formVehiculos, handleAddVehicle, recalculateAllFuelStops, handleRemoveVehicle, handleApplyPresetToVehicle, VEHICLE_PRESETS, handleUpdateVehicle, totalFleetCostPer100Km, addStop, formStops, removeStop, handleSelectVenueForStop, updateStop, formSincronizarCalendario, setFormSincronizarCalendario, tourToDelete, setTourToDelete, confirmDelete };
}
