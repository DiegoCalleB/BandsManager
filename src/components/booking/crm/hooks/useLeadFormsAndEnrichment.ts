/**
 * Formulario de nuevo lead, logo, estado del rastreo, email manual, simulación y enriquecimiento de direcciones.
 * Extraído de BookingCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useState } from "react";
import { useNegotiationSimulation } from "../../../../hooks/useNegotiationSimulation";
import { Lead, LeadType } from "../../../../types";
import { apiFetch } from "../../../../utils/api";
import { uploadFileToServer } from "../../../../utils/audioStorage";
import type { EnrichAddressesResponse } from "../crmTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface LeadFormsAndEnrichmentParams {
  currentBandId: string;
  setEditedLeadInfo: Dispatch<SetStateAction<Partial<Lead>>>;
  selectedLead: Lead;
  setSelectedLead: Dispatch<SetStateAction<Lead>>;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
}

/**
 * Formulario de nuevo lead, logo, estado del rastreo, email manual, simulación y enriquecimiento de direcciones.
 * @param params Estado y callbacks del contenedor ({@link LeadFormsAndEnrichmentParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useLeadFormsAndEnrichment({ currentBandId, setEditedLeadInfo, selectedLead, setSelectedLead, onUpdateLead }: LeadFormsAndEnrichmentParams) {
  const [isAddingLeadModalOpen, setIsAddingLeadModalOpen] = useState(false);

  const [newLeadData, setNewLeadData] = useState({
    nombre_sala: '',
    ciudad: '',
    region: 'Nacional',
    direccion: '',
    aforo: 0,
    tipo: 'medio' as LeadType,
    email_contacto: '',
    email_secundario: '',
    telefono: '',
    telefono_movil: '',
    telefono_fijo: '',
    website: '',
    instagram: '',
    fuente: '',
    genero: 'Radio',
    notas: '',
    pitch_generado: '',
    icono: '📻',
    imagen_url: '',
  });

  const [isUploadingLeadLogo, setIsUploadingLeadLogo] = useState(false);

  const handleLeadLogoUpload = async (file: File, isEdit: boolean): Promise<string | null> => {
    if (!currentBandId) {
      alert('No hay ninguna banda activa para subir la imagen.');
      return null;
    }
    try {
      setIsUploadingLeadLogo(true);
      const targetBandId = currentBandId;
      const url = await uploadFileToServer(file, {
        bandId: targetBandId,
        category: 'leads',
      });
      if (url) {
        if (isEdit) {
          setEditedLeadInfo((prev) => ({ ...prev, imagen_url: url }));
          if (selectedLead?.id) {
            setSelectedLead((prev) => (prev ? { ...prev, imagen_url: url } : null));
            onUpdateLead(selectedLead.id, { imagen_url: url });
          }
        } else {
          setNewLeadData((prev) => ({ ...prev, imagen_url: url }));
        }
        return url;
      }
    } catch (err) {
      console.error('Error uploading lead logo:', err);
      alert('Error al subir la imagen del logo a Supabase');
    } finally {
      setIsUploadingLeadLogo(false);
    }
  };

  // Modal AI Scout Scraping state
  const [isModalScraping, setIsModalScraping] = useState(false);

  const [modalScrapeStatus, setModalScrapeStatus] = useState('');

  const [modalScrapeError, setModalScrapeError] = useState('');

  const [modalScrapeSuccessMsg, setModalScrapeSuccessMsg] = useState('');

  // Selected Lead AI Scout Scraping state
  const [, setIsScrapingLead] = useState(false);

  const [, setScrapingLeadStatus] = useState('');

  const [scrapedDataForLead, setScrapedDataForLead] = useState<Record<string, unknown> | null>(null);

  const [, setScrapingLeadError] = useState<string | null>(null);

  // Email thread and manual dispatch states
  const [, setActiveTab] = useState<'info' | 'emails' | 'copilot' | 'bitacora'>('info');

  const [manualEmailBody, setManualEmailBody] = useState('');

  const [manualEmailSubject, setManualEmailSubject] = useState('');

  const [manualEmailSender] = useState('Agent Manager IA');

  const [, setManualEmailStatus] = useState('');

  const {
    isSimulatingAvanzado,
    setIsSimulatingAvanzado,
    simulationRole,
    simulationScenario,
    simulationCustomInstruction,
    setSimulationCustomInstruction,
    simulationSenderName,
    setSimulationSenderName,
    simulationSubject,
    setSimulationSubject,
    simulationMessage,
    setSimulationMessage,
    isGeneratingSimulation,
    simulationGenerated,
    PREDEFINED_SCENARIOS,
    handleRoleChange,
    handleScenarioChange,
    handleGenerateSimulationEmail,
    handleCommitSimulation,
  } = useNegotiationSimulation(selectedLead, setSelectedLead, onUpdateLead, setManualEmailStatus);

  // Bulk enrich addresses for all venues & festivals
  const [isEnrichingAddresses, setIsEnrichingAddresses] = useState(false);

  const [enrichStatusMsg, setEnrichStatusMsg] = useState('');

  const handleEnrichAddresses = async () => {
    setIsEnrichingAddresses(true);
    setEnrichStatusMsg('Buscando y autocompletando direcciones exactas para salas y festivales...');
    try {
      const res = await apiFetch('/api/leads/enrich-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      // apiFetch devuelve el JSON ya parseado (y lanza si la respuesta no fue 2xx).
      const data = res as EnrichAddressesResponse;
      if (data) {
        if (data.enrichedCount > 0) {
          setEnrichStatusMsg(`¡Éxito! Se han completado y guardado en Supabase ${data.enrichedCount} direcciones de salas/festivales.`);
          if (Array.isArray(data.leads)) {
            data.leads.forEach((updatedLead: Lead) => {
              if (updatedLead.direccion) {
                onUpdateLead(updatedLead.id, {
                  direccion: updatedLead.direccion,
                });
              }
            });
          }
        } else {
          setEnrichStatusMsg(`Todas las salas y festivales ya tienen su dirección informada (${data.totalLeads} total).`);
        }
      } else {
        setEnrichStatusMsg('Fallo al autocompletar las direcciones en el servidor.');
      }
    } catch (err) {
      console.error(err);
      setEnrichStatusMsg('Error de conexión al autocompletar direcciones.');
    } finally {
      setIsEnrichingAddresses(false);
      setTimeout(() => {
        setEnrichStatusMsg('');
      }, 7000);
    }
  };

  return { newLeadData, setIsModalScraping, setModalScrapeStatus, setModalScrapeError, setModalScrapeSuccessMsg, setNewLeadData, setIsScrapingLead, setScrapingLeadStatus, setScrapingLeadError, setScrapedDataForLead, scrapedDataForLead, setIsAddingLeadModalOpen, setActiveTab, setManualEmailBody, setManualEmailSubject, setManualEmailStatus, manualEmailBody, manualEmailSender, manualEmailSubject, isEnrichingAddresses, handleEnrichAddresses, enrichStatusMsg, setEnrichStatusMsg, handleLeadLogoUpload, isUploadingLeadLogo, isSimulatingAvanzado, simulationRole, simulationScenario, simulationSenderName, simulationSubject, simulationCustomInstruction, simulationMessage, simulationGenerated, isGeneratingSimulation, PREDEFINED_SCENARIOS, setIsSimulatingAvanzado, handleRoleChange, handleScenarioChange, setSimulationSenderName, setSimulationSubject, setSimulationCustomInstruction, setSimulationMessage, handleGenerateSimulationEmail, handleCommitSimulation, isAddingLeadModalOpen, isModalScraping, modalScrapeStatus, modalScrapeError, modalScrapeSuccessMsg };
}
