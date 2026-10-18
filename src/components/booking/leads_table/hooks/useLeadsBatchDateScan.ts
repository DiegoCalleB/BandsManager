/**
 * Escaneo en lote de fechas libres de los recintos.
 * Extraído de LeadsTable.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { useEmailValidation } from "../../../../hooks/useEmailValidation";
import { Lead } from "../../../../types";
import { apiFetch } from "../../../../utils/api";

/** Respuesta del endpoint de detección de fechas en lote. */
interface BatchDatesResponse {
  success?: boolean;
  error?: string;
  updatedLeads?: Lead[];
  processedCount?: number;
  totalFreeDates?: number;
}

/** Dependencias que el componente contenedor inyecta al hook. */
export interface LeadsBatchDateScanParams {
  selectedLeadIds: string[];
  filteredLeads: Lead[];
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

/**
 * Escaneo en lote de fechas libres de los recintos.
 * @param params Estado y callbacks del contenedor ({@link LeadsBatchDateScanParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useLeadsBatchDateScan({ selectedLeadIds, filteredLeads, onUpdateLead }: LeadsBatchDateScanParams) {
  const [isScanningBatchDates, setIsScanningBatchDates] = useState(false);

  const [batchScanResult, setBatchScanResult] = useState<string | null>(null);

  const { emailValidities } = useEmailValidation();

  const handleBatchScanDates = async () => {
    try {
      setIsScanningBatchDates(true);
      setBatchScanResult(null);

      const targetIds =
        selectedLeadIds.length > 0
          ? selectedLeadIds
          : filteredLeads.map((l) => l.id);

      const data = await apiFetch<BatchDatesResponse>("/api/leads/detect-all-dates", {
        method: "POST",
        body: JSON.stringify({ leadIds: targetIds }),
      });

      if (data?.success && Array.isArray(data.updatedLeads)) {
        data.updatedLeads.forEach((updated: Lead) => {
          onUpdateLead(updated.id, updated);
        });
        setBatchScanResult(
          `✅ Escaneados ${data.processedCount} recintos. ¡${data.totalFreeDates} fechas libres detectadas en total!`,
        );
      } else {
        setBatchScanResult(
          `⚠️ ${data.error || "No se pudieron detectar fechas en lote"}`,
        );
      }
    } catch (err) {
      setBatchScanResult(`❌ Error: ${err instanceof Error ? err.message : "Error de conexión"}`);
    } finally {
      setIsScanningBatchDates(false);
    }
  };

  return { handleBatchScanDates, isScanningBatchDates, batchScanResult, setBatchScanResult, emailValidities };
}
