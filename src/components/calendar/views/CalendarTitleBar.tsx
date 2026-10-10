/**
 * Título del calendario, contadores y botones de acción (alta, sincronización, menú).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Calendar, ChevronDown, DoorClosed, HelpCircle, Mic, MoreHorizontal, Plus, Radio, Search } from "lucide-react";
import { ModuleTutorialTrigger } from "../../common/ModuleTutorialTrigger";
import { Button } from "../../ui";
import { PopoverAncla } from "../../ui/PopoverAncla";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";

/**
 * Título del calendario, contadores y botones de acción (alta, sincronización, menú).
 * @returns Sección de interfaz.
 */
export function CalendarTitleBar() {
  const { filteredConcerts, filteredRehearsals, concerts, rehearsals, openTutorial, setShowAddEventDropdown, showAddEventDropdown, setConcIsPosible, setShowCreateModal, isPromoPlan, setShowSyncModal, showMobileSearch, setShowMobileSearch, setShowCalMoreMenu, showCalMoreMenu } = useCalendar();
  return (
    <>
      <div className={`pb-4 mb-4 ${''}`}>
        {/* Top title & Action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="page-title">Calendario</h4>
            <p className="hidden sm:block text-xs text-[var(--ink-2)] mt-0.5">Directos, ensayos y reuniones</p>
            <div className="hidden sm:flex items-center gap-1.5 text-micro font-sans font-bold mt-2 flex-wrap max-w-full">
              <span
                className="shrink-0 px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--ink)] flex items-center gap-1"
                title="Eventos visibles vs Total"
              >
                <Calendar className="w-3 h-3" /> {filteredConcerts.length + filteredRehearsals.length}/
                {concerts.length + rehearsals.length}
              </span>
              <span
                className="shrink-0 px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/15 text-[var(--ink)] flex items-center gap-1"
                title="Directos y conciertos públicos"
              >
                <Mic className="w-3 h-3 text-[var(--ok)]" /> {filteredConcerts.length} directos
              </span>
              <span
                className="shrink-0 px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--tentative)]/15 text-[var(--tentative)] flex items-center gap-1"
                title="Ensayos de banda"
              >
                <DoorClosed className="w-3 h-3 text-[var(--tentative)]" />{' '}
                {filteredRehearsals.filter((r) => r.tipo_evento !== 'reunion').length} ensayos
              </span>
              {filteredRehearsals.filter((r) => r.tipo_evento === 'reunion').length > 0 && (
                <span
                  className="shrink-0 px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--tentative)]/15 text-[var(--tentative)] flex items-center gap-1"
                  title="Reuniones de coordinación"
                >
                  <span><ShowIcon inline emoji="🤝" /></span> {filteredRehearsals.filter((r) => r.tipo_evento === 'reunion').length} reuniones
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <div className="hidden sm:block"><ModuleTutorialTrigger moduleId="calendario" onClick={openTutorial} label="Guía rápida" /></div>

            {/* Unified Add Event Button (Prevents button clutter) */}
            <div className="relative inline-block text-left">
              <Button
                variant="primary"
                size="xs"
                id="create-event-unified-btn"
                onClick={() => setShowAddEventDropdown(!showAddEventDropdown)}
                className="items-center justify-center gap-1.5"
                title="Añadir concierto, ensayo o reunión"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Evento</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
              </Button>

              {showAddEventDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAddEventDropdown(false)} />
                  <PopoverAncla
                    className={`absolute right-0 mt-1.5 w-48 rounded-[var(--r-m)] z-50 py-1.5 overflow-hidden animate-in fade-in duration-150 ${'bg-[var(--surface)]/95 text-[var(--ink)]'}`}
                  >
                    <div className="px-3 py-1 text-micro font-sans text-[var(--ink-2)] /40 mb-1">
                      Añadir al calendario
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddEventDropdown(false);
                        setConcIsPosible(false);
                        setShowCreateModal('concert');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-sans font-bold flex items-center gap-2 hover:bg-[var(--acc)]/15 hover:text-[var(--acc)] transition-colors cursor-pointer"
                    >
                      <span><ShowIcon inline emoji="🎸" /></span>
                      <span>+ Concierto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddEventDropdown(false);
                        setConcIsPosible(true);
                        setShowCreateModal('concert');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-sans font-bold flex items-center gap-2 hover:bg-[var(--tentative)]/15 hover:text-[var(--tentative)] transition-colors cursor-pointer"
                    >
                      <span><ShowIcon inline emoji="🎯" /></span>
                      <span>+ Bolo posible</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddEventDropdown(false);
                        setShowCreateModal('rehearsal');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-sans font-bold flex items-center gap-2 hover:bg-[var(--ok)]/15 hover:text-[var(--ok)] transition-colors cursor-pointer"
                    >
                      <span><ShowIcon inline emoji="🥁" /></span>
                      <span>+ Ensayo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddEventDropdown(false);
                        setShowCreateModal('reunion');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-sans font-bold flex items-center gap-2 hover:bg-[var(--tentative)]/15 hover:text-[var(--tentative)] transition-colors cursor-pointer"
                    >
                      <span><ShowIcon inline emoji="🤝" /></span>
                      <span>+ Reunión</span>
                    </button>
                  </PopoverAncla>
                </>
              )}
            </div>

            {!isPromoPlan && (
              <button
                id="export-ics-btn"
                onClick={() => setShowSyncModal(true)}
                className={`hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold transition-ui cursor-pointer active:scale-[0.97] ${'bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc-ink)]'}`}
                title="Sincronizar automáticamente con Google Calendar, Apple Calendar o Outlook"
              >
                <Radio className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span>Sincronizar</span>
              </button>
            )}

            {/* Móvil: lo secundario, fuera de la vista (AGENTS.md §6) */}
            <Button
              variant={showMobileSearch ? "inverse" : "neutral"}
              size="sm"
              type="button"
              onClick={() => setShowMobileSearch((v) => !v)}
              className="sm:hidden"
              aria-label="Buscar en el calendario"
              aria-expanded={showMobileSearch}
            >
              <Search className="w-4 h-4" />
            </Button>
            <div className="relative sm:hidden">
              <Button
                variant="neutral"
                size="sm"
                type="button"
                onClick={() => setShowCalMoreMenu((v) => !v)}
                aria-label="Más opciones del calendario"
                aria-expanded={showCalMoreMenu}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              {showCalMoreMenu && (
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setShowCalMoreMenu(false)} />
                  <PopoverAncla className="menu-pop absolute right-0 mt-1.5 w-52 rounded-[var(--r-m)] bg-[var(--surface)] p-1.5 z-[9999] border border-[var(--line)]">
                    <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-s)] text-sm text-[var(--ink)] hover:bg-[var(--sunken)] cursor-pointer" onClick={() => { setShowCalMoreMenu(false); openTutorial(); }}>
                      <HelpCircle className="w-4 h-4 text-[var(--ink-2)]" /> Guía rápida
                    </button>
                    {!isPromoPlan && (
                      <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-s)] text-sm text-[var(--ink)] hover:bg-[var(--sunken)] cursor-pointer" onClick={() => { setShowCalMoreMenu(false); setShowSyncModal(true); }}>
                        <Radio className="w-4 h-4 text-[var(--ink-2)] shrink-0" /> <span className="whitespace-nowrap">Sincronizar con mi móvil</span>
                      </button>
                    )}
                  </PopoverAncla>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
