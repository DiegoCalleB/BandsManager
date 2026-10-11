/**
 * Pestaña de auditoría y trazabilidad de las acciones de los agentes.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Activity, Clock, Download, Loader2, RefreshCw, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Pestaña de auditoría y trazabilidad de las acciones de los agentes.
 * @returns Sección de interfaz.
 */
export function AuditTab() {
  const { activeTab, handleExportAuditLogsCSV, auditLogs, loadAuditLogs, loadingAuditLogs, setAuditAgentFilter, auditAgentFilter } = useAgentAutonomy();
  return (
    <>
      {/* TAB 6: AUDITORÍA & TRAZABILIDAD */}
      {activeTab === "audit_logs" && (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-sans font-bold text-[var(--ok)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Registro de auditoría
              de ejecución de agentes
            </h4>
            <p className="text-xs text-[var(--ink-2)] mt-0.5">
              Trazabilidad de qué usuario o proceso disparó cada agente,
              duración y salas impactadas en Supabase.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={handleExportAuditLogsCSV}
              disabled={auditLogs.length === 0}
              className="items-center gap-1.5"
              title="Descargar historial de auditoría en formato CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </Button>
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={loadAuditLogs}
              disabled={loadingAuditLogs}
              className="items-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingAuditLogs ? "animate-spin" : ""}`}
              />
              <span>Refrescar</span>
            </Button>
          </div>
        </div>

        {/* Filtros por Agente */}
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 text-xs font-sans">
          <span className="text-[var(--ink-2)] text-micro font-bold mr-1">
            Filtrar:
          </span>
          {[
            { id: "all", label: "Todos" },
            { id: "scout", label: "Scout" },
            { id: "redactor", label: "Redactor" },
            { id: "enviador", label: "Enviador" },
            { id: "lector", label: "Lector" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setAuditAgentFilter(f.id)}
              className={`px-2.5 py-0.5 rounded-[var(--r-pill)] transition-ui cursor-pointer font-bold ${
                auditAgentFilter === f.id
                  ? "bg-[var(--ok)]/20 text-[var(--ink)]"
                  : "bg-[var(--surface)]/60 text-[var(--ink-2)] hover:text-[var(--ink-2)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loadingAuditLogs ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--ink-2)] font-sans text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--ok)]" />
            <span>
              Cargando registros de auditoría desde Supabase…
            </span>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center rounded-[var(--r-m)] bg-[var(--surface)]/60 text-[var(--ink-2)] font-sans text-xs space-y-2">
            <Activity className="w-6 h-6 mx-auto text-[var(--ink-2)]" />
            <p>
              Aún no hay registros de auditoría guardados en Supabase.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
            {auditLogs
              .filter(
                (l) =>
                  auditAgentFilter === "all" ||
                  (l.agente || "")
                    .toLowerCase()
                    .includes(auditAgentFilter),
              )
              .map((log) => {
                const isSuccess = log.estado === "success";
                const isError = log.estado === "error";
                const affectedCount =
                  log.conteo_afectados ||
                  (log.leads_afectados
                    ? log.leads_afectados.length
                    : 0);
                const formattedDate = new Date(
                  log.created_at,
                ).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:transition-colors space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-micro font-sans font-bold ${
                            log.agente === "enviador"
                              ? "bg-[var(--acc)]/10 text-[var(--ink)]"
                              : log.agente === "scout"
                                ? "bg-[var(--acc)]/10 text-[var(--ink-2)]"
                                : log.agente === "redactor"
                                  ? "bg-[var(--tentative)]/10 text-[var(--tentative)]"
                                  : "bg-[var(--ok)]/10 text-[var(--ink-2)]"
                          }`}
                        >
                          Agente {log.agente}
                        </span>
                        <span className="px-2 py-0.5 rounded text-micro font-sans bg-[var(--surface)]/80 text-[var(--ink-2)]">
                          {log.motor || "supabase_edge"}
                        </span>
                        <span
                          className={`text-micro font-sans font-bold ${isSuccess ? "text-[var(--ok)]" : isError ? "text-[var(--alert)]" : "text-[var(--acc)]"}`}
                        >
                          {isSuccess
                            ? "✓ Éxito"
                            : isError
                              ? "✕ Fallo"
                              : "Aviso"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-micro font-sans text-[var(--ink-2)]">
                        <Clock className="w-3 h-3 text-[var(--ink-2)]" />
                        <span>{formattedDate}</span>
                        {log.duracion_ms > 0 && (
                          <span className="text-[var(--ink-2)]">
                            ({log.duracion_ms}ms)
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--ink)] font-sans leading-relaxed">
                      {log.mensaje}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1  text-micro font-sans text-[var(--ink-2)]">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3 h-3 text-[var(--ink-2)]" />
                        <span>
                          Disparado por:{" "}
                          <strong className="text-[var(--ink-2)]">
                            {log.usuario_email ||
                              log.usuario_id ||
                              "Sistema"}
                          </strong>{" "}
                          ({log.disparado_por_tipo})
                        </span>
                      </div>
                      {affectedCount > 0 && (
                        <span className="text-[var(--acc)]/70 font-bold">
                          {affectedCount} sala(s) impactada(s)
                        </span>
                      )}
                    </div>

                    {/* Detalle de leads afectados si existen */}
                    {Array.isArray(log.leads_afectados) &&
                      log.leads_afectados.length > 0 && (
                        <div className="mt-2 pt-2  space-y-1.5">
                          <span className="text-micro font-sans font-bold text-[var(--ink-2)] flex items-center justify-between">
                            <span>
                              Salas / Leads Procesados (
                              {log.leads_afectados.length}):
                            </span>
                          </span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {log.leads_afectados.map(
                              (item, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/70 text-xs font-sans flex flex-wrap items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[var(--acc)] font-bold">
                                      <ShowIcon inline emoji="🏛️" />{" "}
                                      {item.nombre_sala ||
                                        "Sala sin nombre"}
                                    </span>
                                    {item.email_contacto && (
                                      <span className="text-[var(--ink-2)] text-micro truncate max-w-[200px]">
                                        &lt;{item.email_contacto}&gt;
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="px-1.5 py-0.5 rounded text-micro bg-[var(--surface)]/80 text-[var(--ink-2)]">
                                      ID: {item.id}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-micro font-bold bg-[var(--ok)]/10 text-[var(--ink-2)]">
                                      {item.estado_anterior ||
                                        "aprobado"}{" "}
                                      ➔{" "}
                                      {item.estado_nuevo ||
                                        "contactado"}
                                    </span>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
      )}
    </>
  );
}
