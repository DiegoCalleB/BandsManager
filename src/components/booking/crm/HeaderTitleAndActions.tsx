/**
 * Título de la sección y botones de acción unificados.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Bot, ChevronDown, ChevronUp, Download, MessageSquareText, PlusCircle } from "lucide-react";
import { ModuleTutorialTrigger } from "../../common/ModuleTutorialTrigger";
import { Button } from "../../ui";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Título de la sección y botones de acción unificados.
 * @returns Sección de interfaz.
 */
export function HeaderTitleAndActions() {
  const { sectionTab, setNewLeadData, setIsAddingLeadModalOpen, bookingTutorial, setIsExportLeadsOpen, setIsTemplatesSectionOpen, isMobileToolsOpen, setIsMobileToolsOpen, leads, duplicateGroupsCount } = useBookingCrm();
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="page-title">
            {sectionTab === 'medios' ? 'Medios' : sectionTab === 'grupos' ? 'Management y grupos' : 'Escenarios'}
          </h1>
          <p className="text-xs text-[var(--ink-2)] mt-1">
            {sectionTab === 'medios'
              ? 'Radios, webs y prensa que pueden dar voz a tu banda.'
              : sectionTab === 'grupos'
                ? 'Agencias, managers, productoras y bandas amigas.'
                : 'Salas y festivales donde tocar, con su estado de contacto.'}
          </p>
        </div>
        {/* UNIFIED ACTION BUTTONS */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-stretch sm:justify-end">
          <Button
            variant="primary"
            size="xs"
            id="add-new-lead-btn"
            type="button"
            onClick={() => {
              setNewLeadData({
                nombre_sala: '',
                ciudad: '',
                region: 'Nacional',
                direccion: '',
                aforo: 0,
                tipo: sectionTab === 'medios' ? 'medio' : sectionTab === 'grupos' ? 'productora' : 'sala',
                email_contacto: '',
                email_secundario: '',
                telefono: '',
                telefono_movil: '',
                telefono_fijo: '',
                website: '',
                instagram: '',
                fuente: '',
                genero: sectionTab === 'medios' ? 'Radio' : sectionTab === 'grupos' ? 'Management / Booking' : 'Variado',
                notas: '',
                pitch_generado: '',
                icono: sectionTab === 'medios' ? '📻' : sectionTab === 'grupos' ? '💼' : '🏛️',
                imagen_url: '',
              });
              setIsAddingLeadModalOpen(true);
            }}
            className="items-center gap-1.5"
            title="Añadir contacto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ {sectionTab === 'medios' ? 'Medio' : sectionTab === 'grupos' ? 'Contacto' : 'Escenario'}</span>
          </Button>

          <div className="hidden sm:inline-flex">
            <ModuleTutorialTrigger moduleId="booking" onClick={bookingTutorial.openTutorial} />
          </div>

          {/* Botón Exportar — Solo en PC */}
          <Button
            variant="neutral"
            size="xs"
            id="export-leads-btn"
            type="button"
            onClick={() => setIsExportLeadsOpen(true)}
            className="hidden items-center gap-1.5"
            title="Exportar base de datos a Excel / CSV o JSON"
          >
            <Download className="w-3.5 h-3.5 text-[var(--ink-2)]" />
            <span>Exportar leads</span>
          </Button>

          <Button
            variant="neutral"
            size="xs"
            id="open-templates-direct-btn"
            type="button"
            onClick={() => {
              setIsTemplatesSectionOpen(true);
              setTimeout(() => {
                document.getElementById('ai-template-config-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 60);
            }}
            className="hidden items-center gap-1.5"
            title="Configurar plantillas de correo y entrenar el Redactor con hilos reales de conversación"
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Plantillas y hilos IA</span>
          </Button>

          {/* Botón Herramientas & IA */}
          <Button
            variant={isMobileToolsOpen ? "inverse" : "neutral"}
            size="xs"
            id="open-tools-btn"
            type="button"
            onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
            className="items-center gap-1.5"
            title="Herramientas, scout, Excel y agentes IA"
          >
            <Bot className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
            <span>IA y Herramientas</span>
            {leads.filter((l) => !l.email_contacto || l.email_contacto.trim() === '').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--alert-soft)] text-[var(--alert)] text-micro font-semibold tabular-nums">
                {leads.filter((l) => !l.email_contacto || l.email_contacto.trim() === '').length}
              </span>
            )}
            {duplicateGroupsCount > 0 && (
              <span
                className="px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--alert-soft)] text-[var(--alert)] text-micro font-bold"
                title={`${duplicateGroupsCount} grupos de duplicados detectados`}
              >
                {duplicateGroupsCount} dup
              </span>
            )}
            {isMobileToolsOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </Button>
        </div>
      </div>
    </>
  );
}
