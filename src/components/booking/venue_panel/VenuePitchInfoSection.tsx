/**
 * Pestaña de pitch y edición directa de la ficha del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any
*/
import { Edit3, Sparkles, Upload, Clock, Calendar, Coins, Sliders, Layers, Copy, MessageCircle, Loader2, CheckCircle2, CalendarCheck, Handshake, ShieldAlert, Star, MessageSquare, Undo2, RefreshCw, RotateCcw } from "lucide-react";
import { Input, Select, Button, Textarea, LinkButton } from "../../ui";
import { LeadType, Lead } from "../../../types";
import { ShowIcon } from "../../ui/ShowIcon";
import { toIsoDateString } from "../../../utils/festivalDateFormat";
import { isLeadNeedsFollowup, getDaysSinceContact, generateFollowupTemplate } from "../../../utils/bookingFollowup";
import { QuickDealSimulator } from "../QuickDealSimulator";
import { HolidayDateWarning } from "../../common/HolidayDateWarning";
import { getCommercialDealSnippets } from "../../../utils/bookingTourContext";
import { isStitchLight } from "./venueTheme";
import { VenuePitchFeedbackPanel } from "./VenuePitchFeedbackPanel";
import { VenuePitchComposer } from "./VenuePitchComposer";
import { VenuePlaybookBanner } from "./VenuePlaybookBanner";
import { VenueLeadInfoEditForm } from "./VenueLeadInfoEditForm";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenuePitchInfoSectionProps {
  activeTab: "info" | "emails" | "intelligence" | "copilot" | "bitacora";
  isEditingLeadInfo: boolean;
  selectedLead: Lead;
  setIsEditingLeadInfo: Dispatch<SetStateAction<boolean>>;
  handleSaveLeadInfo: () => void;
  editedLeadInfo: Partial<Lead>;
  setEditedLeadInfo: Dispatch<SetStateAction<Partial<Lead>>>;
  handleAutoSearchLogo: () => Promise<void>;
  isSearchingLogo: boolean;
  onLeadLogoUpload: (file: File) => void | Promise<string>;
  isUploadingLeadLogo: boolean;
  handleAutoExtractFestivalDates: () => Promise<void>;
  isExtractingDates: boolean;
  bandName: string;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setIsEditingPitch: Dispatch<SetStateAction<boolean>>;
  handleRecalculateFinancial: (overrideData?: { precioAnticipada: number; precioTaquilla: number; alquilerSalaFijo: number; porcentajeSala: number; gastosProduccionFijos: number; numMusicos: number; }) => Promise<void>;
  isRecalculatingFinancial: boolean;
  isReplyStage: boolean;
  setShowMultiModelModal: Dispatch<SetStateAction<boolean>>;
  handleCopyPitch: () => void;
  copiedPitch: boolean;
  setShowWhatsAppModal: Dispatch<SetStateAction<boolean>>;
  handleApprovePitchDirectly: () => void;
  isCreatingDraft: boolean;
  activeCampaign: any;
  handleRegeneratePitchWithFeedback: (targetProvider?: "gemini" | "deepseek") => Promise<void>;
  isRegeneratingPitch: boolean;
  editedPitch: string;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  isEditingPitch: boolean;
  handleSavePitch: () => void;
  setShowFeedbackHistory: Dispatch<SetStateAction<boolean>>;
  showFeedbackHistory: boolean;
  setToneRating: Dispatch<SetStateAction<number>>;
  toneRating: number;
  setContentRating: Dispatch<SetStateAction<number>>;
  contentRating: number;
  feedbackComment: string;
  setFeedbackComment: Dispatch<SetStateAction<string>>;
  setFeedbackScope: Dispatch<SetStateAction<"este_pitch" | "global">>;
  feedbackScope: "este_pitch" | "global";
  feedbackSuccessMsg: string;
  selectedAiModel: "gemini" | "deepseek";
  setSelectedAiModel: Dispatch<SetStateAction<"gemini" | "deepseek">>;
  handleRevertPitch: (targetLogId?: string) => Promise<void>;
  isRevertingPitch: boolean;
}

/**
 * Pestaña de pitch y edición directa de la ficha del lead.
 * @param props Estado y callbacks del contenedor ({@link VenuePitchInfoSectionProps}).
 * @returns Sección de interfaz.
 */
export function VenuePitchInfoSection({ activeTab, isEditingLeadInfo, selectedLead, setIsEditingLeadInfo, handleSaveLeadInfo, editedLeadInfo, setEditedLeadInfo, handleAutoSearchLogo, isSearchingLogo, onLeadLogoUpload, isUploadingLeadLogo, handleAutoExtractFestivalDates, isExtractingDates, bandName, setEditedPitch, setIsEditingPitch, handleRecalculateFinancial, isRecalculatingFinancial, isReplyStage, setShowMultiModelModal, handleCopyPitch, copiedPitch, setShowWhatsAppModal, handleApprovePitchDirectly, isCreatingDraft, activeCampaign, handleRegeneratePitchWithFeedback, isRegeneratingPitch, editedPitch, onUpdateLead, isEditingPitch, handleSavePitch, setShowFeedbackHistory, showFeedbackHistory, setToneRating, toneRating, setContentRating, contentRating, feedbackComment, setFeedbackComment, setFeedbackScope, feedbackScope, feedbackSuccessMsg, selectedAiModel, setSelectedAiModel, handleRevertPitch, isRevertingPitch }: VenuePitchInfoSectionProps) {
  return (
    <>
<VenueLeadInfoEditForm activeTab={activeTab} isEditingLeadInfo={isEditingLeadInfo} selectedLead={selectedLead} setIsEditingLeadInfo={setIsEditingLeadInfo} handleSaveLeadInfo={handleSaveLeadInfo} editedLeadInfo={editedLeadInfo} setEditedLeadInfo={setEditedLeadInfo} handleAutoSearchLogo={handleAutoSearchLogo} isSearchingLogo={isSearchingLogo} onLeadLogoUpload={onLeadLogoUpload} isUploadingLeadLogo={isUploadingLeadLogo} handleAutoExtractFestivalDates={handleAutoExtractFestivalDates} isExtractingDates={isExtractingDates} bandName={bandName} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} handleRecalculateFinancial={handleRecalculateFinancial} isRecalculatingFinancial={isRecalculatingFinancial} isReplyStage={isReplyStage} setShowMultiModelModal={setShowMultiModelModal} handleCopyPitch={handleCopyPitch} copiedPitch={copiedPitch} setShowWhatsAppModal={setShowWhatsAppModal} handleApprovePitchDirectly={handleApprovePitchDirectly} isCreatingDraft={isCreatingDraft} activeCampaign={activeCampaign} handleRegeneratePitchWithFeedback={handleRegeneratePitchWithFeedback} isRegeneratingPitch={isRegeneratingPitch} editedPitch={editedPitch} onUpdateLead={onUpdateLead} isEditingPitch={isEditingPitch} handleSavePitch={handleSavePitch} setShowFeedbackHistory={setShowFeedbackHistory} showFeedbackHistory={showFeedbackHistory} setToneRating={setToneRating} toneRating={toneRating} setContentRating={setContentRating} contentRating={contentRating} feedbackComment={feedbackComment} setFeedbackComment={setFeedbackComment} setFeedbackScope={setFeedbackScope} feedbackScope={feedbackScope} feedbackSuccessMsg={feedbackSuccessMsg} selectedAiModel={selectedAiModel} setSelectedAiModel={setSelectedAiModel} handleRevertPitch={handleRevertPitch} isRevertingPitch={isRevertingPitch} />
    </>
  );
}
