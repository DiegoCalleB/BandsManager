/**
 * Registro de auditoría de acciones de los agentes: carga, filtro y exportación CSV.
 * Extraído de AgentAutonomySettingsModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { AuditLogEntry } from "../autonomyTypes";
import { useEffect, useState } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AutonomyAuditLogsParams {
  bandId: string;
  activeTab: "autonomy" | "email_dispatch" | "schedules" | "tone" | "response_strategies" | "audit_logs";
}

/**
 * Registro de auditoría de acciones de los agentes: carga, filtro y exportación CSV.
 * @param params Estado y callbacks del contenedor ({@link AutonomyAuditLogsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAutonomyAuditLogs({ bandId, activeTab }: AutonomyAuditLogsParams) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [loadingAuditLogs, setLoadingAuditLogs] = useState<boolean>(false);

  const [auditAgentFilter, setAuditAgentFilter] = useState<string>("all");

  // Cargar logs de auditoría
  const loadAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const res = await fetch(
        `/api/agent-logs?band_id=${encodeURIComponent(bandId)}`,
      );
      if (res.ok) {
        const json = (await res.json()) as { logs?: AuditLogEntry[] };
        setAuditLogs(json.logs || []);
      }
    } catch (e) {
      console.warn("Error cargando logs de auditoría:", e);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleExportAuditLogsCSV = () => {
    if (!auditLogs || auditLogs.length === 0) return;
    const headers = [
      "Fecha",
      "Agente",
      "Motor",
      "Disparado Por",
      "Email Usuario",
      "Estado",
      "Mensaje",
      "Conteo Afectados",
      "Duración (ms)",
    ];
    const rows = auditLogs.map((l) => [
      `"${new Date(l.created_at).toLocaleString("es-ES")}"`,
      `"${l.agente || ""}"`,
      `"${l.motor || ""}"`,
      `"${l.disparado_por_tipo || ""}"`,
      `"${l.usuario_email || l.usuario_id || ""}"`,
      `"${l.estado || ""}"`,
      `"${(l.mensaje || "").replace(/"/g, '""')}"`,
      l.conteo_afectados || 0,
      l.duracion_ms || 0,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `auditoria_agentes_${bandId}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (activeTab === "audit_logs") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- recarga el registro al abrir la pestaña de auditoría
      loadAuditLogs();
    }
  }, [activeTab, bandId]);

  return { auditLogs, handleExportAuditLogsCSV, loadAuditLogs, loadingAuditLogs, setAuditAgentFilter, auditAgentFilter };
}
