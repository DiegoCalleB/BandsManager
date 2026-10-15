/**
 * Panel desplegable de herramientas e IA (agentes, plantillas, importación, duplicados).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Activity, Bot, ChevronDown, Copy, Download, FileSpreadsheet, FileText, Loader2, MapPin, MessageSquareText, Search, Send, Sparkles, Wrench, X } from "lucide-react";
import { Button, IconButton } from "../../ui";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Panel desplegable de herramientas e IA (agentes, plantillas, importación, duplicados).
 * @returns Sección de interfaz.
 */
export function MobileToolsPanel() {
  const { isMobileToolsOpen, setIsMobileToolsOpen, isDispatchingEmails, handleTriggerEnviadorAgent, leads, setIsPlacesExplorerOpen, setIsExcelImportOpen, setIsDuplicatesModalOpen, duplicateGroupsCount, setIsContactEnricherOpen, setIsAgentConfigOpen, setIsQueueMonitorOpen, setIsTemplatesSectionOpen, setRoadbookModalLead, selectedLead, setIsRoadbookModalOpen, setIsExportLeadsOpen, isEnrichingAddresses, handleEnrichAddresses } = useBookingCrm();
  return (
    <>
      {/* EXPANDED IA TOOLS PANEL (Responsive on all screen sizes) */}
      {isMobileToolsOpen && (
        <div className="p-3.5 rounded-[var(--r-l)] bg-[var(--surface)] /40 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--acc)]/70 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Herramientas e inteligencia artificial
            </span>
            <IconButton
              label="Cerrar"
              size="icon-xs"
              type="button"
              onClick={() => setIsMobileToolsOpen(false)}
            >
              <X className="w-3.5 h-3.5" />
            </IconButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isDispatchingEmails}
              onClick={() => {
                setIsMobileToolsOpen(false);
                handleTriggerEnviadorAgent();
              }}
              className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--sunken)] hover:brightness-95 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97] disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                {isDispatchingEmails ? (
                  <Loader2 className="w-4 h-4 text-[var(--ink-2)] animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-[var(--ink-2)]" />
                )}
                <span>
                  {isDispatchingEmails
                    ? 'Despachando correos...'
                    : `Agente Enviador (${leads.filter((l) => ['aprobado', 'aprobado_propuesta', 'aprobado_respuesta'].includes(l.estado)).length} en cola de envío)`}
                </span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlacesExplorerOpen(true);
                setIsMobileToolsOpen(false);
              }}
              className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--sunken)] hover:brightness-95 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Scout descubridor (buscar nuevos leads)
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsExcelImportOpen(true);
                setIsMobileToolsOpen(false);
              }}
              className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--sunken)] hover:brightness-95 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[var(--ink-2)]" />
                Importar Excel / CSV (Bandas y salas)
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDuplicatesModalOpen(true);
                setIsMobileToolsOpen(false);
              }}
              className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--sunken)] hover:brightness-95 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-[var(--ink-2)]" />
                Detector y limpiador de duplicados
              </span>
              {duplicateGroupsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--acc)] text-[var(--on-acc)]">
                  {duplicateGroupsCount} {duplicateGroupsCount === 1 ? 'grupo' : 'grupos'}
                </span>
              ) : (
                <span className="text-micro text-[var(--ink-2)] font-normal">0 duplicados</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsContactEnricherOpen(true);
                setIsMobileToolsOpen(false);
              }}
              className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--tentative)]  hover:bg-[var(--tentative)]/80 text-[var(--on-tentative)] transition-ui cursor-pointer active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--tentative)]" />
                Agente Enriquecedor de Contactos ({
                  leads.filter((l) => !l.email_contacto || l.email_contacto.trim() === '').length
                }{' '}
                sin email)
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAgentConfigOpen(true);
                setIsMobileToolsOpen(false);
              }}
              className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--sunken)] hover:brightness-95 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[var(--ink-2)]" />
                Configurar agentes IA (Autonomía y tono)
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsQueueMonitorOpen(true);
                setIsMobileToolsOpen(false);
              }}
              className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--sunken)] hover:brightness-95 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">

                  <span className="relative inline-flex rounded-[var(--r-pill)] h-2 w-2 bg-[var(--ok)]"></span>
                </span>
                <Activity className="w-4 h-4 text-[var(--ink-2)]" />
                <span>Monitor de cola y workers en vivo</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMobileToolsOpen(false);
                setIsTemplatesSectionOpen(true);
                setTimeout(() => {
                  document.getElementById('ai-template-config-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 60);
              }}
              className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--sunken)] hover:brightness-95 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-[var(--ink-2)]" />
                <span>Plantillas y hilos de ejemplo (Redactor IA)</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMobileToolsOpen(false);
                setRoadbookModalLead(selectedLead || leads[0] || null);
                setIsRoadbookModalOpen(true);
              }}
              className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--ink)] transition-ui cursor-pointer active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--acc)]" />
                <span>Hoja de ruta (roadbook) y contratos</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 -rotate-90" />
            </button>

            <Button
              variant="neutral"
              type="button"
              onClick={() => {
                setIsMobileToolsOpen(false);
                setIsExportLeadsOpen(true);
              }}
              className="items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[var(--ok)]" />
              <span>Exportar leads (A la vista / todos / Excel)</span>
            </Button>

            <Button
              variant="neutral"
              type="button"
              disabled={isEnrichingAddresses}
              onClick={() => {
                setIsMobileToolsOpen(false);
                handleEnrichAddresses();
              }}
              className="items-center justify-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-[var(--ink-2)]" />
              <span>{isEnrichingAddresses ? 'Rellenando direcciones...' : 'Autocompletar Direcciones'}</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
