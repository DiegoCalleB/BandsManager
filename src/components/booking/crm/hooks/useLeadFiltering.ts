/**
 * Leads visibles de la sección activa tras aplicar campaña, ciudad, tipo, estado, capacidad y búsqueda.
 * Extraído de BookingCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useMemo } from "react";
import { BookingCampaign, Lead, LeadStatus, LeadType } from "../../../../types";
import { isLeadNeedsFollowup } from "../../../../utils/bookingFollowup";
import { normalizeStatus, normalizeType } from "../../../../utils/bookingUtils";
import { leadMatchesCampaignCapacity, leadMatchesCampaignCity, leadMatchesCampaignDates } from "../../../../utils/campaignMatch";
import { areCitiesLogisticallyCompatible } from "../../../../utils/tourRouting";
import { matchesGruposType, matchesMedioType } from "../leadTypeMatchers";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface LeadFilteringParams {
  leads: Lead[];
  sectionTab: "salas" | "medios" | "grupos";
  filterByCampaign: boolean;
  activeCampaign: BookingCampaign;
  searchTerm: string;
  statusFilter: LeadStatus | "todos" | "seguimientos";
  typeFilter: "todos" | LeadType | "radio" | "tv" | "prensa" | "redes" | "podcast";
  selectedCityFilter: string;
  minCapacityFilter: number;
  routeAnchorCity: string;
}

/**
 * Leads visibles de la sección activa tras aplicar campaña, ciudad, tipo, estado, capacidad y búsqueda.
 * @param params Estado y callbacks del contenedor ({@link LeadFilteringParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useLeadFiltering({ leads, sectionTab, filterByCampaign, activeCampaign, searchTerm, statusFilter, typeFilter, selectedCityFilter, minCapacityFilter, routeAnchorCity }: LeadFilteringParams) {

  // Filter leads by active section tab
  const sectionLeads = useMemo(() => {
    const seen = new Set<string>();
    const isGruposType = (norm: string) => ['grupo', 'agencia', 'manager', 'productora', 'sello'].includes(norm);
    return (leads || []).filter((lead) => {
      if (!lead) return false;
      const leadKey = lead.id ? String(lead.id).trim() : null;
      if (leadKey && seen.has(leadKey)) return false;
      if (leadKey) seen.add(leadKey);

      const norm = normalizeType(lead.tipo);
      if (sectionTab === 'medios') return norm === 'medio';
      if (sectionTab === 'grupos') return isGruposType(norm);
      return norm !== 'medio' && !isGruposType(norm);
    });
  }, [leads, sectionTab]);

  const filteredLeads = useMemo(() => {
    const seen = new Set<string>();
    return sectionLeads.filter((lead, idx) => {
      const leadKey = lead.id ? String(lead.id).trim() : `lead-${idx}`;
      if (seen.has(leadKey)) return false;
      seen.add(leadKey);

      if (
        sectionTab === 'salas' &&
        filterByCampaign &&
        activeCampaign &&
        (activeCampaign.isActive ?? activeCampaign.is_active ?? true)
      ) {
        // El filtrado por aforo, fechas y ciudad de campaña solo aplica a recintos y festivales (salas),
        // ya que los medios de comunicación y bandas no tienen aforo ni fechas de evento en campaña.
        if (
          !leadMatchesCampaignCity(lead, activeCampaign) ||
          !leadMatchesCampaignCapacity(lead, activeCampaign) ||
          !leadMatchesCampaignDates(lead, activeCampaign)
        )
          return false;
      }

      const matchesSearch =
        (lead.nombre_sala || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email_contacto && lead.email_contacto.toLowerCase().includes(searchTerm.toLowerCase()));
      const normSt = normalizeStatus(lead.estado);
      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'seguimientos'
          ? isLeadNeedsFollowup(lead)
          : normSt === statusFilter || (statusFilter === 'pendiente_aprobacion' && normSt === 'nuevo' && !!lead.pitch_generado));

      const matchesType =
        typeFilter === 'todos'
          ? true
          : sectionTab === 'medios'
            ? matchesMedioType(lead, typeFilter)
            : sectionTab === 'grupos'
              ? matchesGruposType(lead, typeFilter)
              : normalizeType(lead.tipo) === typeFilter;
      const matchesCity =
        !selectedCityFilter ||
        (lead.ciudad || '').toLowerCase().includes(selectedCityFilter.toLowerCase()) ||
        (lead.region || '').toLowerCase().includes(selectedCityFilter.toLowerCase());
      const matchesCapacity = !minCapacityFilter || (lead.aforo || 0) >= minCapacityFilter;
      const matchesRoute = !routeAnchorCity || areCitiesLogisticallyCompatible(routeAnchorCity, lead.ciudad || lead.region || '');
      return matchesSearch && matchesStatus && matchesType && matchesCity && matchesCapacity && matchesRoute;
    });
  }, [
    sectionLeads,
    searchTerm,
    statusFilter,
    typeFilter,
    selectedCityFilter,
    minCapacityFilter,
    sectionTab,
    filterByCampaign,
    activeCampaign,
    routeAnchorCity,
  ]);

  return { sectionLeads, filteredLeads };
}
