/**
 * Edición del pitch y de la ficha de un lead, rechazo, ventanas auxiliares y disparo del enviador.
 * Extraído de BookingCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useMemo, useState } from "react";
import { Lead } from "../../../../types";
import { apiFetch } from "../../../../utils/api";
import { findDuplicateLeads } from "../../../../utils/duplicateLeads";
import { getErrorMessage } from "../../../../utils/errorMessage";
import type { EnviadorResponse } from "../crmTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface LeadEditingParams {
  leads: Lead[];
}

/**
 * Edición del pitch y de la ficha de un lead, rechazo, ventanas auxiliares y disparo del enviador.
 * @param params Estado y callbacks del contenedor ({@link LeadEditingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useLeadEditing({ leads }: LeadEditingParams) {
  const [, setIsEditingPitch] = useState(false);

  const [editedPitch, setEditedPitch] = useState('');

  const [rejectionNotes, setRejectionNotes] = useState('');

  const [, setIsRejecting] = useState(false);

  // Editable Lead Info state
  const [, setIsEditingLeadInfo] = useState(false);

  const [editedLeadInfo, setEditedLeadInfo] = useState<Partial<Lead>>({});

  // New Lead / Medio Modal
  const [isPlacesExplorerOpen, setIsPlacesExplorerOpen] = useState(false);

  const [isContactEnricherOpen, setIsContactEnricherOpen] = useState(false);

  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

  const [isExportLeadsOpen, setIsExportLeadsOpen] = useState(false);

  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);

  const [isQueueMonitorOpen, setIsQueueMonitorOpen] = useState(false);

  const duplicateGroups = useMemo(() => findDuplicateLeads(leads), [leads]);

  const duplicateGroupsCount = duplicateGroups.length;

  const [isDispatchingEmails, setIsDispatchingEmails] = useState(false);

  // Roadbook & Contract Modal State
  const [isRoadbookModalOpen, setIsRoadbookModalOpen] = useState(false);

  const [roadbookModalLead, setRoadbookModalLead] = useState<Lead | null>(null);

  const [venueDetailInitialTab, setVenueDetailInitialTab] = useState<'info' | 'emails' | 'copilot' | 'bitacora'>('info');

  const handleTriggerEnviadorAgent = async (leadId?: string) => {
    setIsDispatchingEmails(true);
    try {
      const data = await apiFetch<EnviadorResponse>('/api/trigger-agent', {
        method: 'POST',
        body: JSON.stringify({
          agentName: 'enviador',
          params: { id: leadId, trigger_type: 'usuario_manual' },
        }),
      });

      try {
        window.dispatchEvent(new CustomEvent('app-data-updated'));
      } catch {
        // Ignorado a propósito: el evento de refresco es opcional.
      }

      if (data.dispatchedCount > 0) {
        alert(`¡Agente Enviador ejecutado con éxito! ${data.message || ''}`);
      } else if (data.results && data.results.some((r) => r.status === 'error')) {
        const errMsgs = data.results
          .filter((r) => r.status === 'error')
          .map((r) => `${r.nombre_sala}: ${r.error}`)
          .join('\n');
        alert(`Aviso del Agente Enviador:\n${data.message || ''}\n\nDetalles:\n${errMsgs}`);
      } else {
        alert(data.message || 'No se encontraron correos aprobados pendientes de despacho.');
      }
    } catch (err) {
      console.error('Error al ejecutar Agente Enviador:', err);
      alert(`Error al ejecutar el Agente Enviador: ${getErrorMessage(err, 'Error de conexión')}`);
    } finally {
      setIsDispatchingEmails(false);
    }
  };

  return { setEditedLeadInfo, setEditedPitch, setIsEditingPitch, setIsEditingLeadInfo, setIsRejecting, setRejectionNotes, setVenueDetailInitialTab, editedLeadInfo, editedPitch, rejectionNotes, setIsExportLeadsOpen, duplicateGroupsCount, isDispatchingEmails, handleTriggerEnviadorAgent, setIsPlacesExplorerOpen, setIsExcelImportOpen, setIsDuplicatesModalOpen, setIsContactEnricherOpen, setIsQueueMonitorOpen, setRoadbookModalLead, setIsRoadbookModalOpen, venueDetailInitialTab, isPlacesExplorerOpen, isExcelImportOpen, isContactEnricherOpen, isExportLeadsOpen, isDuplicatesModalOpen, isRoadbookModalOpen, roadbookModalLead, isQueueMonitorOpen };
}
