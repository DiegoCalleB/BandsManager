import type { BookingCampaign } from "../../../types";
/**
 * Barra de título del panel con avatar, estado y acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
 
import { Edit3,Trash2,X } from "lucide-react";
import { Dispatch,SetStateAction } from "react";
import { Concert,Lead,LeadStatus } from "../../../types";
import { formatFestivalDateRange } from "../../../utils/festivalDateFormat";
import { isLeadVerificado } from "../../../utils/leadReliability";
import { FavoriteButton } from "../../common/FavoriteButton";
import { HolidayDateWarning } from "../../common/HolidayDateWarning";
import { VerifiedBadge } from "../../common/VerifiedBadge";
import { Button,IconButton } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { LeadAvatar } from "../LeadAvatar";
import { VenueAgentWorkflowBanner } from "./VenueAgentWorkflowBanner";
import { VenueLeadHealthRow } from "./VenueLeadHealthRow";
import { VenueQuickActionBar } from "./VenueQuickActionBar";
import { VenueScoutToolbar } from "./VenueScoutToolbar";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueTitleBarProps {
  selectedLead: Lead;
  onFilterByRouteCity: (city: string) => void;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  handleStartEdit: () => void;
  onDeleteLead: (id: string, name: string) => void;
  getStatusDotColor: (status: string) => string;
  normalizeStatus: (status: string) => LeadStatus;
  handleCorrectStatus: (newStatus: LeadStatus) => void;
  setShowFastDealModal: Dispatch<SetStateAction<boolean>>;
  setShowWhatsAppModal: Dispatch<SetStateAction<boolean>>;
  handleScanWithJina: () => Promise<void>;
  isScanningJina: boolean;
  handleDetectVenueDates: () => Promise<void>;
  isDetectingDates: boolean;
  editedLeadInfo: Partial<Lead>;
  handleEnrichInstagram: () => Promise<void>;
  isEnrichingInstagram: boolean;
  scoutActionFeedback: string;
  activeCampaign: BookingCampaign | null | undefined;
  concerts: Concert[];
  bandName: string;
  editedPitch: string;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setIsEditingPitch: Dispatch<SetStateAction<boolean>>;
  isReplyStage: boolean;
  handleApprovePitchDirectly: () => void;
  isCreatingDraft: boolean;
  draftError: string;
  setIsCreatingDraft: Dispatch<SetStateAction<boolean>>;
  setDraftError: Dispatch<SetStateAction<string>>;
}

/**
 * Barra de título del panel con avatar, estado y acciones.
 * @param props Estado y callbacks del contenedor ({@link VenueTitleBarProps}).
 * @returns Sección de interfaz.
 */
export function VenueTitleBar({ selectedLead, onFilterByRouteCity, onClose, onUpdateLead, handleStartEdit, onDeleteLead, getStatusDotColor, normalizeStatus, handleCorrectStatus, setShowFastDealModal, setShowWhatsAppModal, handleScanWithJina, isScanningJina, handleDetectVenueDates, isDetectingDates, editedLeadInfo, handleEnrichInstagram, isEnrichingInstagram, scoutActionFeedback, activeCampaign, concerts, bandName, editedPitch, setEditedPitch, setIsEditingPitch, isReplyStage, handleApprovePitchDirectly, isCreatingDraft, draftError, setIsCreatingDraft, setDraftError }: VenueTitleBarProps) {
  return (
    <>
{/* HEADER CARD */}
      <div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-4 sm:p-5800 space-y-4">
        {/* Title Bar */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <LeadAvatar lead={selectedLead} size="lg" showCameraHover={false} />
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--ink)] notranslate"
                  translate="no"
                >
                  {selectedLead.nombre_sala}
                </h3>
                <VerifiedBadge
                  isVerified={isLeadVerificado(selectedLead)}
                  size="md"
                  showLabel={true}
                />
              </div>
              <div className="flex items-center flex-wrap gap-1.5 mt-0.5 text-xs sm:text-sm font-sans text-[var(--ink-2)]">
                <span className="font-semibold text-[var(--ink-2)]">
                  {selectedLead.ciudad}
                </span>
                {onFilterByRouteCity && selectedLead.ciudad && (
                  <button
                    type="button"
                    onClick={() => {
                      onFilterByRouteCity(selectedLead.ciudad!);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[var(--on-acc)] hover:text-[var(--acc)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                    title={`Filtrar salas en ruta para fin de semana doble desde ${selectedLead.ciudad} (<2.5h)`}
                  >
                    <span><ShowIcon inline emoji="🚗" />Enlazar ruta (&lt;2.5h)</span>
                  </button>
                )}
                <span>•</span>
                <span>{selectedLead.genero || "Variado"}</span>
                <span>•</span>
                <span
                  className={
                    selectedLead.roster ? "text-[var(--acc)] font-medium" : ""
                  }
                >
                  {selectedLead.roster
                    ? `Róster: ${selectedLead.roster}`
                    : ["agencia", "manager", "productora", "sello"].includes(
                          String(selectedLead.tipo || "").toLowerCase(),
                        )
                      ? "Agencia de Booking"
                      : selectedLead.aforo
                        ? `${selectedLead.aforo} pax`
                        : "Aforo n/d"}
                </span>
              </div>
              {selectedLead.festival_start_date &&
                selectedLead.festival_end_date && (
                  <div className="space-y-1 mt-1">
                    <p className="text-xs sm:text-sm font-sans text-[var(--acc)] flex items-center gap-1.5">
                      <span className="text-lg"><ShowIcon inline emoji="🎪" /></span>
                      <span className="font-semibold">Festival/Evento:</span>
                      <span>
                        {formatFestivalDateRange(
                          selectedLead.festival_start_date,
                          selectedLead.festival_end_date,
                        )}
                      </span>
                    </p>
                    <HolidayDateWarning
                      date={selectedLead.festival_start_date}
                      city={selectedLead.ciudad}
                      compact
                    />
                  </div>
                )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <FavoriteButton
              isFavorite={!!selectedLead.es_favorito}
              onToggle={(newVal) =>
                onUpdateLead(selectedLead.id, { es_favorito: newVal })
              }
              size="md"
            />
            <IconButton
              label="Editar ficha completa"
              onClick={handleStartEdit}
            >
              <Edit3 className="w-4 h-4" />
            </IconButton>
            {onDeleteLead && (
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  onDeleteLead(selectedLead.id, selectedLead.nombre_sala)
                }
                title="Eliminar y guardar en lista negra"
              >
                <Trash2 className="w-4 h-4 text-[var(--alert)]" />
              </Button>
            )}
            <IconButton
              label="Cerrar panel"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        <VenueLeadHealthRow selectedLead={selectedLead} onUpdateLead={onUpdateLead} getStatusDotColor={getStatusDotColor} normalizeStatus={normalizeStatus} handleCorrectStatus={handleCorrectStatus} />

        <VenueQuickActionBar setShowFastDealModal={setShowFastDealModal} setShowWhatsAppModal={setShowWhatsAppModal} selectedLead={selectedLead} />

        <VenueScoutToolbar handleScanWithJina={handleScanWithJina} isScanningJina={isScanningJina} handleDetectVenueDates={handleDetectVenueDates} isDetectingDates={isDetectingDates} selectedLead={selectedLead} editedLeadInfo={editedLeadInfo} handleEnrichInstagram={handleEnrichInstagram} isEnrichingInstagram={isEnrichingInstagram} scoutActionFeedback={scoutActionFeedback} activeCampaign={activeCampaign} concerts={concerts} bandName={bandName} editedPitch={editedPitch} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} onUpdateLead={onUpdateLead} setShowWhatsAppModal={setShowWhatsAppModal} />

        <VenueAgentWorkflowBanner selectedLead={selectedLead} normalizeStatus={normalizeStatus} isReplyStage={isReplyStage} handleApprovePitchDirectly={handleApprovePitchDirectly} isCreatingDraft={isCreatingDraft} draftError={draftError} setIsCreatingDraft={setIsCreatingDraft} setDraftError={setDraftError} onUpdateLead={onUpdateLead} />
      </div>
    </>
  );
}
