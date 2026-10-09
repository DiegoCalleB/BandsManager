import {
History,
Mail,
Sparkles,
X
} from "lucide-react";
import React,{ useEffect,useRef,useState } from "react";
import type { BookingCampaign } from "../../types";
import {
Concert,
InteractionLog,
Lead,
LeadStatus
} from "../../types";
import { apiFetch } from "../../utils/api";
import { getErrorMessage } from "../../utils/errorMessage";
import { IconButton } from '../ui';
import { BoloConfirmadoSetlistModal } from "./BoloConfirmadoSetlistModal";
import { DealAndLogisticsCopilot } from "./DealAndLogisticsCopilot";
import { FastDealModal } from "./FastDealModal";
import { MultiModelPitchComparatorModal } from "./MultiModelPitchComparatorModal";
import { WhatsAppPreviewModal } from "./WhatsAppPreviewModal";
import { VenueBitacoraSection } from "./venue_panel/VenueBitacoraSection";
import { VenueContactRosterCards } from "./venue_panel/VenueContactRosterCards";
import { VenueEmailsSection } from "./venue_panel/VenueEmailsSection";
import { VenueIntelligenceSection } from "./venue_panel/VenueIntelligenceSection";
import { VenuePitchInfoSection } from "./venue_panel/VenuePitchInfoSection";
import { VenueTitleBar } from "./venue_panel/VenueTitleBar";
import type { LeadMutationResponse } from "./venue_panel/apiResponses";
import { buildVenuePanelActions } from "./venue_panel/hooks/buildVenuePanelActions";
import { useVenueEnrichment } from "./venue_panel/hooks/useVenueEnrichment";
import { useVenueMessageThread } from "./venue_panel/hooks/useVenueMessageThread";
import { useVenueScoutActions } from "./venue_panel/hooks/useVenueScoutActions";
import type { VenuePanelTab } from "./venue_panel/venuePanelTypes";
import { isStitchLight } from "./venue_panel/venueTheme";

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.

interface VenueDetailPanelProps {
  selectedLead: Lead | null;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead?: (id: string, name: string) => void;
  getStatusBadgeClass: (status: LeadStatus | string) => string;
  getStatusLabel: (status: LeadStatus | string) => string;
  getStatusDotColor: (status: LeadStatus | string) => string;
  normalizeStatus: (status: string) => LeadStatus;
  normalizeType: (type?: string) => string;
  autoDetectVenueAddress: (venueName: string, city: string) => string;
  sectionTab: "salas" | "medios" | "grupos";
  activeCampaign?: BookingCampaign | null;
  onLeadLogoUpload?: (file: File) => Promise<string | null> | void;
  isUploadingLeadLogo?: boolean;
  initialTab?: "info" | "emails" | "copilot" | "bitacora";
  onOpenRoadbookModal?: (lead: Lead) => void;
  onFilterByRouteCity?: (city: string) => void;
  bandName?: string;
  concerts?: Concert[];
}

export const VenueDetailPanel: React.FC<VenueDetailPanelProps> = ({
  selectedLead,
  onClose,
  onUpdateLead,
  onDeleteLead,
  getStatusDotColor,
  normalizeStatus,
  autoDetectVenueAddress,
  activeCampaign,
  onLeadLogoUpload,
  isUploadingLeadLogo = false,
  initialTab = "info",
  onOpenRoadbookModal,
  onFilterByRouteCity,
  bandName,
  concerts = [],
}) => {
  // Active Tab inside panel
  const [activeTab, setActiveTab] = useState<VenuePanelTab>(initialTab);
  // Vuelve a la pestaña inicial al cambiar de lead o de pestaña solicitada. Se ajusta durante el
  // render (patrón recomendado por React) en lugar de con un efecto que llama a setState.
  const initialTabKey = `${initialTab}:${selectedLead?.id ?? ""}`;
  const [syncedInitialTabKey, setSyncedInitialTabKey] = useState(initialTabKey);
  if (syncedInitialTabKey !== initialTabKey) {
    setSyncedInitialTabKey(initialTabKey);
    if (initialTab) setActiveTab(initialTab);
  }

  // Edit Lead State
  const [isEditingLeadInfo, setIsEditingLeadInfo] = useState(false);
  // Foto del lead en el momento de pulsar «Editar»: sirve para mandar al guardar SOLO lo que
  // el usuario ha cambiado (ver src/utils/camposCambiados.ts).
  const leadAlEditarRef = useRef<Partial<Lead> | null>(null);

  const [editedLeadInfo, setEditedLeadInfo] = useState<Partial<Lead>>({
    ...selectedLead,
  });

  useEffect(() => {
    setEditedLeadInfo({ ...selectedLead });
  }, [selectedLead]);

  // Pitch Editing & Feedback State
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [editedPitch, setEditedPitch] = useState(
    selectedLead?.pitch_generado || "",
  );
  const [isEnrichingApis, setIsEnrichingApis] = useState(false);
  const [toneRating, setToneRating] = useState<number>(0);
  const [contentRating, setContentRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [feedbackScope, setFeedbackScope] = useState<"este_pitch" | "global">(
    "este_pitch",
  );
  const [isRegeneratingPitch, setIsRegeneratingPitch] = useState(false);
  const [isRevertingPitch, setIsRevertingPitch] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(
    null,
  );
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);
  const [showMultiModelModal, setShowMultiModelModal] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState<"gemini" | "deepseek">(
    "gemini",
  );

  // Bolo Confirmado -> Setlist Optimization Modal
  const [showBoloConfirmadoModal, setShowBoloConfirmadoModal] = useState(false);
  const [feedbackBoloMsg, setFeedbackBoloMsg] = useState<string | null>(null);

  // Bitácora state
  const [interactionType, setInteractionType] =
    useState<InteractionLog["tipo"]>("Llamada");
  const [interactionAutor, setInteractionAutor] = useState("Mánager / Booking");
  const [interactionNotes, setInteractionNotes] = useState("");
  const [interactionResultado, setInteractionResultado] =
    useState<InteractionLog["resultado"]>("Interesado");

  // Quick Copy status
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isSearchingLogo, setIsSearchingLogo] = useState(false);
  const [isEnrichingLead, setIsEnrichingLead] = useState(false);
  const [enrichStatusMsg, setEnrichStatusMsg] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isExtractingDates, setIsExtractingDates] = useState(false);

  // WhatsApp Modal & External Intelligence Tools (Jina, Wegow Radar, Instagram)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showFastDealModal, setShowFastDealModal] = useState(false);
  const [isScanningJina, setIsScanningJina] = useState(false);
  const [isDetectingDates, setIsDetectingDates] = useState(false);
  const [isEnrichingInstagram, setIsEnrichingInstagram] = useState(false);
  const [scoutActionFeedback, setScoutActionFeedback] = useState<string | null>(
    null,
  );

  const { handleScanWithJina, handleDetectVenueDates, handleEnrichInstagram } = useVenueScoutActions({ selectedLead, editedLeadInfo, setScoutActionFeedback, setIsScanningJina, onUpdateLead, setEditedLeadInfo, setIsDetectingDates, setIsEnrichingInstagram });

  const handleAutoExtractFestivalDates = async () => {
    if (!selectedLead) return;
    try {
      setIsExtractingDates(true);
      const res = await apiFetch<LeadMutationResponse>(
"/api/leads/enrich-lead", {
        method: "POST",
        body: JSON.stringify({ leadId: selectedLead.id, force: true }),
      });
      if (res?.lead) {
        if (res.lead.festival_start_date) {
          setEditedLeadInfo((prev) => ({
            ...prev,
            festival_start_date: res.lead.festival_start_date,
            festival_end_date:
              res.lead.festival_end_date || res.lead.festival_start_date,
          }));
        }
        if (onUpdateLead) {
          onUpdateLead(selectedLead.id, res.lead);
        }
      }
    } catch (err: unknown) {
      console.warn("Error enriqueciendo fechas:", err);
    } finally {
      setIsExtractingDates(false);
    }
  };

  const { setIsEnrichingCoBooking, handleRecalculateFinancial, isRecalculatingFinancial, handleEnrichAllApis, routeOrigin, setRouteOrigin, handleCalculateRoute, isCalculatingRoute, handleFetchSocial, isEnrichingSocial, handleFetchBookingWindow, isEnrichingBookingWindow, handleFetchLocalEvents, isEnrichingLocalEvents, handleFetchPressMedia, isEnrichingPressMedia, isEnrichingCoBooking, simAnticipada, setSimAnticipada, simTaquilla, setSimTaquilla, simAlquiler, setSimAlquiler, simPctSala, setSimPctSala, simGastosProd, setSimGastosProd, simNumMusicos, setSimNumMusicos } = useVenueEnrichment({ selectedLead, setIsEnrichingApis, setScoutActionFeedback, onUpdateLead, setEditedLeadInfo });

  const handleFetchCoBooking = async () => {
    if (!selectedLead) return;
    try {
      setIsEnrichingCoBooking(true);
      setScoutActionFeedback(
        `Buscando bandas locales afines para co-booking en ${selectedLead.ciudad || "la ciudad"}...`,
      );
      const res = await apiFetch<LeadMutationResponse>(
`/api/leads/${selectedLead.id}/enrich-co-booking`,
        {
          method: "POST",
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback("✓ Bandas locales para co-booking encontradas.");
      }
    } catch (err: unknown) {
      setScoutActionFeedback(`Error bandas locales: ${getErrorMessage(err)}`);
    } finally {
      setIsEnrichingCoBooking(false);
      setTimeout(() => setScoutActionFeedback(null), 4000);
    }
  };

  const { cleanVal, hiloCompleto, handleAnalyzeMessageSentiment, isAnalyzingMessageSentiment } = useVenueMessageThread({ selectedLead, onUpdateLead });

  // Sync state when selected lead changes or pitch updates
  useEffect(() => {
    if (!selectedLead) return;
    setEditedPitch(selectedLead.pitch_generado || "");
    setEditedLeadInfo({
      ...selectedLead,
      telefono: cleanVal(selectedLead.telefono),
      telefono_movil: cleanVal(selectedLead.telefono_movil),
      telefono_fijo: cleanVal(selectedLead.telefono_fijo),
      contacto_nombre: cleanVal(selectedLead.contacto_nombre),
      email_contacto: cleanVal(selectedLead.email_contacto),
      direccion: cleanVal(selectedLead.direccion),
    });
  }, [
    selectedLead?.id,
    selectedLead?.pitch_generado,
    selectedLead?.imagen_url,
    selectedLead?.icono,
  ]);

  // Los hooks de arriba tienen que ejecutarse siempre en el mismo orden (ver
  // react-hooks/rules-of-hooks): este guard vivía ANTES de ellos, así que abrir el panel con
  // una sala nueva cambiaba cuántos hooks se ejecutaban entre un render y el siguiente.
  if (!selectedLead) return null;

  const { handleStartEdit, handleCorrectStatus, isReplyStage, handleApprovePitchDirectly, handleEnrichLead, handleSaveLeadInfo, handleAutoSearchLogo, handleCopyPitch, handleRegeneratePitchWithFeedback, handleSavePitch, handleRevertPitch, handleAddInteractionLog, handleDeleteInteractionLog, handleConfirmWithSetlist, handleConfirmWithoutSetlist } = buildVenuePanelActions({ setIsRegeneratingPitch, setFeedbackSuccessMsg, selectedAiModel, selectedLead, toneRating, contentRating, feedbackComment, feedbackScope, activeCampaign, setEditedPitch, setIsEditingPitch, onUpdateLead, setToneRating, setContentRating, setFeedbackComment, setIsRevertingPitch, setIsEnrichingLead, setEnrichStatusMsg, setEditedLeadInfo, editedLeadInfo, setIsSearchingLogo, cleanVal, leadAlEditarRef, setActiveTab, setIsEditingLeadInfo, setShowBoloConfirmadoModal, setFeedbackBoloMsg, hiloCompleto, setIsCreatingDraft, setDraftError, editedPitch, interactionNotes, interactionType, interactionAutor, interactionResultado, setInteractionNotes, setCopiedPitch });

  return (
    <div className="w-full space-y-5 relative">
      {/* Feedback Alert for Bolo Confirmado */}
      {feedbackBoloMsg && (
        <div className="p-3.5 rounded-[var(--r-l)] bg-[var(--ok)]/20 text-[var(--ink)] font-sans text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>{feedbackBoloMsg}</span>
          </div>
          <IconButton
            label="Cerrar"
            onClick={() => setFeedbackBoloMsg(null)}
          >
            <X className="w-4 h-4" />
          </IconButton>
        </div>
      )}

      <VenueTitleBar selectedLead={selectedLead} onFilterByRouteCity={onFilterByRouteCity} onClose={onClose} onUpdateLead={onUpdateLead} handleStartEdit={handleStartEdit} onDeleteLead={onDeleteLead} getStatusDotColor={getStatusDotColor} normalizeStatus={normalizeStatus} handleCorrectStatus={handleCorrectStatus} setShowFastDealModal={setShowFastDealModal} setShowWhatsAppModal={setShowWhatsAppModal} handleScanWithJina={handleScanWithJina} isScanningJina={isScanningJina} handleDetectVenueDates={handleDetectVenueDates} isDetectingDates={isDetectingDates} editedLeadInfo={editedLeadInfo} handleEnrichInstagram={handleEnrichInstagram} isEnrichingInstagram={isEnrichingInstagram} scoutActionFeedback={scoutActionFeedback} activeCampaign={activeCampaign} concerts={concerts} bandName={bandName} editedPitch={editedPitch} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} isReplyStage={isReplyStage} handleApprovePitchDirectly={handleApprovePitchDirectly} isCreatingDraft={isCreatingDraft} draftError={draftError} setIsCreatingDraft={setIsCreatingDraft} setDraftError={setDraftError} />

      <VenueContactRosterCards selectedLead={selectedLead} handleEnrichLead={handleEnrichLead} isEnrichingLead={isEnrichingLead} enrichStatusMsg={enrichStatusMsg} autoDetectVenueAddress={autoDetectVenueAddress} onUpdateLead={onUpdateLead} />

      {/* NAVIGATION TABS (Pitch/Info | Email Thread | Bitácora) */}
      <div className="flex800 gap-2 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 cursor-pointer ${
            activeTab === "info"
              ? "border-b-2 text-[var(--acc)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          Propuesta / pitch
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("emails")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "emails"
              ? "border-b-2 text-[var(--acc)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Correos</span>
          {hiloCompleto.length > 0 && (
            <span className="text-micro font-bold px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)]">
              {hiloCompleto.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("intelligence")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "intelligence"
              ? "border-b-2 border-[var(--acc)]/40 text-[var(--acc)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
          <span>Inteligencia y APIs</span>
          {(selectedLead.spotify_city_demand ||
            selectedLead.google_places_info) && (
            <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("copilot")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "copilot"
              ? "border-b-2 border-[var(--ok)]/40 text-[var(--ok)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--ok)]" />
          <span>Copiloto y P&L</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bitacora")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "bitacora"
              ? "border-b-2 text-[var(--acc)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Bitácora ({selectedLead.historial_contacto?.length || 0})</span>
        </button>
      </div>

      <VenuePitchInfoSection activeTab={activeTab} isEditingLeadInfo={isEditingLeadInfo} selectedLead={selectedLead} setIsEditingLeadInfo={setIsEditingLeadInfo} handleSaveLeadInfo={handleSaveLeadInfo} editedLeadInfo={editedLeadInfo} setEditedLeadInfo={setEditedLeadInfo} handleAutoSearchLogo={handleAutoSearchLogo} isSearchingLogo={isSearchingLogo} onLeadLogoUpload={onLeadLogoUpload} isUploadingLeadLogo={isUploadingLeadLogo} handleAutoExtractFestivalDates={handleAutoExtractFestivalDates} isExtractingDates={isExtractingDates} bandName={bandName} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} handleRecalculateFinancial={handleRecalculateFinancial} isRecalculatingFinancial={isRecalculatingFinancial} isReplyStage={isReplyStage} setShowMultiModelModal={setShowMultiModelModal} handleCopyPitch={handleCopyPitch} copiedPitch={copiedPitch} setShowWhatsAppModal={setShowWhatsAppModal} handleApprovePitchDirectly={handleApprovePitchDirectly} isCreatingDraft={isCreatingDraft} activeCampaign={activeCampaign} handleRegeneratePitchWithFeedback={handleRegeneratePitchWithFeedback} isRegeneratingPitch={isRegeneratingPitch} editedPitch={editedPitch} onUpdateLead={onUpdateLead} isEditingPitch={isEditingPitch} handleSavePitch={handleSavePitch} setShowFeedbackHistory={setShowFeedbackHistory} showFeedbackHistory={showFeedbackHistory} setToneRating={setToneRating} toneRating={toneRating} setContentRating={setContentRating} contentRating={contentRating} feedbackComment={feedbackComment} setFeedbackComment={setFeedbackComment} setFeedbackScope={setFeedbackScope} feedbackScope={feedbackScope} feedbackSuccessMsg={feedbackSuccessMsg} selectedAiModel={selectedAiModel} setSelectedAiModel={setSelectedAiModel} handleRevertPitch={handleRevertPitch} isRevertingPitch={isRevertingPitch} />

      <VenueEmailsSection activeTab={activeTab} selectedLead={selectedLead} bandName={bandName} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} onUpdateLead={onUpdateLead} setActiveTab={setActiveTab} hiloCompleto={hiloCompleto} handleAnalyzeMessageSentiment={handleAnalyzeMessageSentiment} isAnalyzingMessageSentiment={isAnalyzingMessageSentiment} editedPitch={editedPitch} />

      <VenueIntelligenceSection activeTab={activeTab} handleEnrichAllApis={handleEnrichAllApis} isEnrichingApis={isEnrichingApis} selectedLead={selectedLead} onUpdateLead={onUpdateLead} setEditedPitch={setEditedPitch} setScoutActionFeedback={setScoutActionFeedback} routeOrigin={routeOrigin} setRouteOrigin={setRouteOrigin} handleCalculateRoute={handleCalculateRoute} isCalculatingRoute={isCalculatingRoute} handleFetchSocial={handleFetchSocial} isEnrichingSocial={isEnrichingSocial} handleFetchBookingWindow={handleFetchBookingWindow} isEnrichingBookingWindow={isEnrichingBookingWindow} handleFetchLocalEvents={handleFetchLocalEvents} isEnrichingLocalEvents={isEnrichingLocalEvents} handleFetchPressMedia={handleFetchPressMedia} isEnrichingPressMedia={isEnrichingPressMedia} handleFetchCoBooking={handleFetchCoBooking} isEnrichingCoBooking={isEnrichingCoBooking} handleRecalculateFinancial={handleRecalculateFinancial} isRecalculatingFinancial={isRecalculatingFinancial} simAnticipada={simAnticipada} setSimAnticipada={setSimAnticipada} simTaquilla={simTaquilla} setSimTaquilla={setSimTaquilla} simAlquiler={simAlquiler} setSimAlquiler={setSimAlquiler} simPctSala={simPctSala} setSimPctSala={setSimPctSala} simGastosProd={simGastosProd} setSimGastosProd={setSimGastosProd} simNumMusicos={simNumMusicos} setSimNumMusicos={setSimNumMusicos} />

      {/* TAB 3: COPILOTO DE CIERRE, LOGÍSTICA & P&L */}
      {activeTab === "copilot" && (
        <DealAndLogisticsCopilot
          lead={selectedLead}
          latestIncomingMessage={
            hiloCompleto.filter((m) => m.remitente === "sala").slice(-1)[0]
              ?.mensaje || selectedLead.ultimo_mensaje_recibido
          }
          isStitchLight={isStitchLight}
          onOpenRoadbookModal={onOpenRoadbookModal}
        />
      )}

      <VenueBitacoraSection activeTab={activeTab} selectedLead={selectedLead} handleAddInteractionLog={handleAddInteractionLog} setInteractionType={setInteractionType} interactionType={interactionType} interactionAutor={interactionAutor} setInteractionAutor={setInteractionAutor} setInteractionResultado={setInteractionResultado} interactionResultado={interactionResultado} interactionNotes={interactionNotes} setInteractionNotes={setInteractionNotes} handleDeleteInteractionLog={handleDeleteInteractionLog} />

      {/* Multi-Model Parallel Pitch Comparator Modal (A/B/C Testing) */}
      <MultiModelPitchComparatorModal
        isOpen={showMultiModelModal}
        onClose={() => setShowMultiModelModal(false)}
        lead={selectedLead}
        activeCampaign={activeCampaign}
        onSelectProposal={(text, providerName) => {
          setEditedPitch(text);
          onUpdateLead(selectedLead.id, { pitch_generado: text });
          const label =
            providerName === "deepseek" ? "DeepSeek V3" : "Gemini 3.7 Flash";
          setFeedbackSuccessMsg(
            `¡Propuesta de ${label} seleccionada y aplicada a la sala!`,
          );
          setTimeout(() => setFeedbackSuccessMsg(null), 5000);
        }}
      />

      {/* Modal de Conexión CRM -> Bolo -> Repertorio Óptimo */}
      <BoloConfirmadoSetlistModal
        isOpen={showBoloConfirmadoModal}
        lead={selectedLead}
        onClose={() => setShowBoloConfirmadoModal(false)}
        onConfirmWithSetlist={handleConfirmWithSetlist}
        onConfirmWithoutSetlist={handleConfirmWithoutSetlist}
      />

      {/* Modal / Drawer WhatsApp Preview Interactivo */}
      {selectedLead && (
        <WhatsAppPreviewModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          lead={selectedLead}
          isStitchLight={isStitchLight}
          onLogInteraction={(leadId, logData) => {
            const nowStr = new Date()
              .toISOString()
              .replace("T", " ")
              .slice(0, 16);
            const newLog: InteractionLog = {
              id: `log-${Date.now()}`,
              fecha: nowStr,
              tipo: "WhatsApp",
              autor: interactionAutor || "Mánager / Booking",
              notas: logData.notas,
              resultado: (logData.resultado as InteractionLog["resultado"]) || "Interesado",
            };
            const existingLogs = selectedLead.historial_contacto || [];
            onUpdateLead(leadId, {
              historial_contacto: [newLog, ...existingLogs],
              fecha_ultima_respuesta: new Date().toISOString().slice(0, 10),
            });
          }}
          onUpdateLeadPhone={(leadId, updates) => {
            onUpdateLead(leadId, updates);
            setEditedLeadInfo((prev) => ({ ...prev, ...updates }));
          }}
        />
      )}

      {/* Modal Hoja de Acuerdo 1-Click */}
      {selectedLead && (
        <FastDealModal
          isOpen={showFastDealModal}
          onClose={() => setShowFastDealModal(false)}
          lead={selectedLead}
          bandName={bandName || 'Nuestra Banda'}
          onDealConfirmed={() => {
            onUpdateLead(selectedLead.id, { estado: 'confirmado' });
          }}
        />
      )}
    </div>
  );
};
