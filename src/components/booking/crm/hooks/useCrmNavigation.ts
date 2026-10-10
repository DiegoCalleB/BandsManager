/**
 * Lead seleccionado, sección activa, filtros y paneles móviles del CRM de booking.
 * Extraído de BookingCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useEffect, useState } from "react";
import { useModuleTutorial } from "../../../../hooks/useModuleTutorial";
import { useSavedFilters } from "../../../../hooks/useSavedFilters";
import { Lead, LeadStatus } from "../../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CrmNavigationParams {
  bandName: string;
  initialSection: "salas" | "medios" | "grupos";
  onSectionChange: (section: "salas" | "medios" | "grupos" | "bandas") => void;
  initialStatusFilter: LeadStatus | "todos";
  initialSelectedLeadId: string;
  leads: Lead[];
}

/**
 * Lead seleccionado, sección activa, filtros y paneles móviles del CRM de booking.
 * @param params Estado y callbacks del contenedor ({@link CrmNavigationParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCrmNavigation({ bandName, initialSection, onSectionChange, initialStatusFilter, initialSelectedLeadId, leads }: CrmNavigationParams) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const interventionPanelRef = React.useRef<HTMLDivElement>(null);

  const bookingTutorial = useModuleTutorial('booking');

  const effectiveBandName = bandName || 'Tu Banda';

  const [sectionTab, setSectionTab] = useState<'salas' | 'medios' | 'grupos'>(initialSection || 'salas');

  const handleSelectSectionTab = (tab: 'salas' | 'medios' | 'grupos') => {
    setSectionTab(tab);
    setTypeFilter('todos');
    onSectionChange?.(tab);
  };

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    selectedCityFilter,
    setSelectedCityFilter,
    minCapacityFilter,
    setMinCapacityFilter,
    onlyFavoritesFilter,
    setOnlyFavoritesFilter,
    onlyVerifiedFilter,
    setOnlyVerifiedFilter,
    savedFilters,
    isSavingFilterOpen,
    setIsSavingFilterOpen,
    newFilterName,
    setNewFilterName,
    activeSavedFilterId,
    setActiveSavedFilterId,
    handleApplySavedFilter,
    handleSaveCurrentFilter,
    handleDeleteSavedFilter,
    handleClearAllFilters,
  } = useSavedFilters(sectionTab, setSectionTab, initialStatusFilter);

  const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);

  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [isTemplatesSectionOpen, setIsTemplatesSectionOpen] = useState(false);

  const [routeAnchorCity, setRouteAnchorCity] = useState<string | null>(null);

  useEffect(() => {
    if (initialSection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza la sección con la prop inicial
      setSectionTab(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    if (initialSelectedLeadId) {
      const found = leads.find((l) => l.id === initialSelectedLeadId);
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- abre el lead pedido por la navegación
        setSelectedLead(found);
        setTimeout(() => {
          if (interventionPanelRef.current) {
            interventionPanelRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 150);
      }
    }
  }, [initialSelectedLeadId, leads]);

  return { sectionTab, selectedCityFilter, setSelectedCityFilter, selectedLead, setSelectedLead, setMinCapacityFilter, setTypeFilter, setStatusFilter, setSearchTerm, searchTerm, statusFilter, typeFilter, minCapacityFilter, routeAnchorCity, effectiveBandName, interventionPanelRef, onlyFavoritesFilter, onlyVerifiedFilter, activeSavedFilterId, bookingTutorial, setIsTemplatesSectionOpen, isMobileToolsOpen, setIsMobileToolsOpen, setIsAgentConfigOpen, isMobileFiltersOpen, setIsMobileFiltersOpen, handleSelectSectionTab, setOnlyFavoritesFilter, setOnlyVerifiedFilter, isSavingFilterOpen, setIsSavingFilterOpen, newFilterName, setNewFilterName, handleSaveCurrentFilter, savedFilters, handleApplySavedFilter, handleDeleteSavedFilter, handleClearAllFilters, setActiveSavedFilterId, setRouteAnchorCity, isTemplatesSectionOpen, isAgentConfigOpen };
}
