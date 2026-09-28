import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Lead, LeadStatus, Concert } from "../../types";
import { VenueDetailPanel } from "./VenueDetailPanel";
import { X, Building2 } from "lucide-react";

interface MobileBottomSheetProps {
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
  activeCampaign?: any;
  onLeadLogoUpload?: (file: File) => void;
  isUploadingLeadLogo?: boolean;
  onFilterByRouteCity?: (city: string) => void;
  bandName?: string;
  concerts?: Concert[];
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  selectedLead,
  onClose,
  onUpdateLead,
  onDeleteLead,
  getStatusBadgeClass,
  getStatusLabel,
  getStatusDotColor,
  normalizeStatus,
  normalizeType,
  autoDetectVenueAddress,
  sectionTab,
  activeCampaign,
  onLeadLogoUpload,
  isUploadingLeadLogo = false,
  onFilterByRouteCity,
  bandName,
  concerts = [],
}) => {
  useEffect(() => {
    if (selectedLead) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedLead]);

  if (!selectedLead) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] lg:hidden flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[var(--scrim)]/80 transition-opacity cursor-pointer z-[999998]"
      />

      {/* Sheet Drawer Container */}
      <div className="relative z-[999999] w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-[var(--bg)] sm:border-2 rounded-t-3xl sm:rounded-[var(--r-l)] p-4 sm:p-6 flex flex-col text-[var(--ink)] overflow-hidden">
        {/* Header Bar */}
        <div className="w-full flex justify-between items-center pb-3800 mb-3 shrink-0">
          <div className="flex items-center gap-2 truncate pr-2">
            <Building2 className="w-4 h-4 text-[var(--acc)] shrink-0" />
            <span className="text-xs font-sans tracking-widest text-[var(--acc)] font-bold truncate">
              Ficha: {selectedLead.nombre_sala}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--acc)]/70 hover:bg-[var(--acc)]/30 transition-colors cursor-pointer text-xs font-bold shrink-0 gap-1"
            title="Cerrar ficha"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Content Panel - Scrollable container */}
        <div className="flex-1 overflow-y-auto pr-1">
          <VenueDetailPanel
            selectedLead={selectedLead}
            onClose={onClose}
            onUpdateLead={onUpdateLead}
            onDeleteLead={onDeleteLead}
            getStatusBadgeClass={getStatusBadgeClass}
            getStatusLabel={getStatusLabel}
            getStatusDotColor={getStatusDotColor}
            normalizeStatus={normalizeStatus}
            normalizeType={normalizeType}
            autoDetectVenueAddress={autoDetectVenueAddress}
            sectionTab={sectionTab}
            activeCampaign={activeCampaign}
            onLeadLogoUpload={onLeadLogoUpload}
            isUploadingLeadLogo={isUploadingLeadLogo}
            onFilterByRouteCity={onFilterByRouteCity}
            bandName={bandName}
            concerts={concerts}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};
