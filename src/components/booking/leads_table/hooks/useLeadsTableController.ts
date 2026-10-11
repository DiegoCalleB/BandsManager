/**
 * Controlador de la tabla/rejilla de leads: selección de cabecera, filtrado por tipo de medio,
 * imagen en edición, escaneo de fechas en lote y acciones rápidas.
 * Extraído de LeadsTable.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useEffect,useRef,useState } from "react";
import type { Lead } from "../../../../types";
import type { ResolvedLeadsTableProps } from "../../LeadsTable";
import { useLeadsBatchDateScan } from "./useLeadsBatchDateScan";

/**
 * Estado y acciones de la tabla de leads.
 * @param params Props de la tabla con sus valores por defecto ya aplicados.
 * @returns Todo lo que consumen las vistas.
 */
export function useLeadsTableController({
  leads,
  onUpdateLead,
  mediaTypeFilter,
  setMediaTypeFilter,
  selectedLeadIds,
  isAllSelected,
  isSomeSelected,
}: ResolvedLeadsTableProps) {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        isSomeSelected && !isAllSelected;
    }
  }, [isSomeSelected, isAllSelected]);

  const filteredLeads =
    mediaTypeFilter === "todos" || !setMediaTypeFilter
      ? leads
      : leads.filter((l) => l.genero?.toLowerCase() === mediaTypeFilter);

  const [leadForImageChange, setLeadForImageChange] = useState<Lead | null>(
    null,
  );

  const { handleBatchScanDates, isScanningBatchDates, batchScanResult, setBatchScanResult, emailValidities } = useLeadsBatchDateScan({ selectedLeadIds, filteredLeads, onUpdateLead });

  const handleQuickApprovePitch = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    onUpdateLead(lead.id, { estado: "aprobado" });
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  return { headerCheckboxRef, filteredLeads, leadForImageChange, setLeadForImageChange, handleBatchScanDates, isScanningBatchDates, batchScanResult, setBatchScanResult, emailValidities, handleQuickApprovePitch, cleanPhone };
}
