/**
 * Conmutador de vistas (1M, 2M, semana, agenda), pantalla completa y preferencias por dispositivo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CalendarDays, Check, Cloud, List, Maximize2, Minimize2, Monitor, Settings, Smartphone } from "lucide-react";
import { PopoverAncla } from "../../ui/PopoverAncla";
import { useCalendar } from "../CalendarContext";

/**
 * Conmutador de vistas (1M, 2M, semana, agenda), pantalla completa y preferencias por dispositivo.
 * @returns Sección de interfaz.
 */
export function ViewSwitchers() {
  const { viewConfigRef, setCalendarViewMode, setTwoMonthsMode, devicePrefs, currentDeviceType, calendarViewMode, setShowViewConfigPopover, showViewConfigPopover, toggleCalendarFullscreen, isCalendarFullscreen, setSelectedConfigDevice, selectedConfigDevice, isSavingPref, handleSetDefaultMonthsForDevice, configToast } = useCalendar();
  return (
    <>
      {/* Vistas estilo Google Calendar: 1M | 2M | Semana | Agenda + Configuración */}
      <div className="relative inline-flex items-center shrink-0" ref={viewConfigRef}>
        <div className={`flex items-center rounded-[var(--r-s)] p-0.5 ${'bg-[var(--sunken)]'}`}>
          <button
            id="calendar-view-1m-btn"
            onClick={() => {
              setCalendarViewMode('1m');
              setTwoMonthsMode(false);
            }}
            title={
              devicePrefs[currentDeviceType] === '1' ? 'Ver 1 mes (predeterminado al iniciar en este dispositivo)' : 'Ver 1 mes'
            }
            className={`px-2 py-0.5 text-micro font-sans font-bold rounded transition-ui cursor-pointer ${
              calendarViewMode === '1m'
                ? 'bg-[var(--ink)] text-[var(--bg)] font-bold'
                : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
            }`}
          >
            1M
          </button>
          <button
            id="calendar-view-2m-btn"
            onClick={() => {
              setCalendarViewMode('2m');
              setTwoMonthsMode(true);
            }}
            title={
              devicePrefs[currentDeviceType] === '2' ? 'Ver 2 meses (predeterminado al iniciar en este dispositivo)' : 'Ver 2 meses'
            }
            className={`hidden sm:inline-block px-2 py-0.5 text-micro font-sans font-bold rounded transition-ui cursor-pointer ${
              calendarViewMode === '2m'
                ? 'bg-[var(--ink)] text-[var(--bg)] font-bold'
                : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
            }`}
          >
            2M
          </button>
          <button
            id="calendar-view-week-btn"
            onClick={() => setCalendarViewMode('week')}
            title="Vista Semana estilo Google Calendar (7 días detallados)"
            className={`px-2 py-0.5 text-micro font-sans font-bold rounded transition-ui cursor-pointer flex items-center gap-1 ${
              calendarViewMode === 'week'
                ? 'bg-[var(--ink)] text-[var(--bg)] font-bold'
                : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
            }`}
          >
            <CalendarDays className="w-3 h-3" />
            <span className="hidden sm:inline">Semana</span>
          </button>
          <button
            id="calendar-view-agenda-btn"
            onClick={() => setCalendarViewMode('agenda')}
            title="Vista agenda / lista estilo Google Calendar"
            className={`px-2 py-0.5 text-micro font-sans font-bold rounded transition-ui cursor-pointer flex items-center gap-1 ${
              calendarViewMode === 'agenda'
                ? 'bg-[var(--ink)] text-[var(--bg)] font-bold'
                : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
            }`}
          >
            <List className="w-3 h-3" />
            <span className="hidden sm:inline">Agenda</span>
          </button>
          <button
            id="calendar-view-config-btn"
            onClick={() => setShowViewConfigPopover((prev) => !prev)}
            title="Configurar vista por defecto (1M o 2M) diferenciada por tipo de dispositivo y sincronizada en Supabase"
            className={`hidden sm:flex px-1.5 py-0.5 text-micro rounded transition-ui cursor-pointer items-center justify-center relative ${
              showViewConfigPopover ? 'bg-[var(--surface)]/80 text-[var(--acc)]' : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
            }`}
          >
            <Settings className="w-3 h-3" />
            {devicePrefs[currentDeviceType] === '2' && (
              <span
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)]"
                title="Vista personalizada activa: 2 meses"
              />
            )}
          </button>
        </div>

        {/* Botón de Pantalla Completa */}
        <button
          id="calendar-fullscreen-btn"
          onClick={toggleCalendarFullscreen}
          title={isCalendarFullscreen ? 'Salir de pantalla completa (Esc)' : 'Ver el calendario a pantalla completa'}
          className={`hidden sm:flex px-2 py-1 text-micro font-sans font-bold rounded-[var(--r-pill)] transition-ui cursor-pointer items-center gap-1.5 shrink-0 ${
            isCalendarFullscreen
              ? 'bg-[var(--ink)] text-[var(--bg)] font-bold'
              : 'bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--acc)]/70 /30'
          }`}
        >
          {isCalendarFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isCalendarFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
        </button>

        {/* Popover desplegable de configuración de vista por defecto por dispositivo */}
        {showViewConfigPopover && (
          <PopoverAncla izquierda="sm"
            className={`absolute top-full right-0 sm:left-0 sm:right-auto mt-2 z-50 w-80 sm:w-96 rounded-[var(--r-l)] p-4 ${'bg-[var(--surface)] text-[var(--ink)]'} animate-in fade-in zoom-in-95 duration-150`}
          >
            <div className="flex items-center justify-between pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)]">
                  <Settings className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-display">Vista por defecto</h4>
                  <p className={`text-micro font-sans ${'text-[var(--ink-2)]'}`}>Distinta en móvil y en ordenador</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewConfigPopover(false)}
                className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] text-xs cursor-pointer"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Selector de dispositivo (Móvil vs Escritorio) */}
            <div className={`p-1 rounded-[var(--r-m)] flex items-center gap-1 mb-3 ${'bg-[var(--sunken)]'}`}>
              <button
                onClick={() => setSelectedConfigDevice('mobile')}
                className={`flex-1 py-1.5 px-2 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-ui cursor-pointer ${
                  selectedConfigDevice === 'mobile'
                    ? 'bg-[var(--surface)]/80 text-[var(--acc-ink)]'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Móvil</span>
                <span className="text-micro px-1 py-0.2 rounded bg-[var(--sunken)]">{devicePrefs.mobile}M</span>
                {currentDeviceType === 'mobile' && (
                  <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--ok)]" title="Dispositivo actual" />
                )}
              </button>
              <button
                onClick={() => setSelectedConfigDevice('desktop')}
                className={`flex-1 py-1.5 px-2 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-ui cursor-pointer ${
                  selectedConfigDevice === 'desktop'
                    ? 'bg-[var(--surface)]/80 text-[var(--acc-ink)]'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Ordenador</span>
                <span className="text-micro px-1 py-0.2 rounded bg-[var(--sunken)]">{devicePrefs.desktop}M</span>
                {currentDeviceType === 'desktop' && (
                  <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--ok)]" title="Dispositivo actual" />
                )}
              </button>
            </div>

            <div className="mb-2">
              <span className={`text-micro font-sans block ${'text-[var(--ink-2)]'}`}>
                Al entrar desde un{' '}
                <strong>{selectedConfigDevice === 'mobile' ? 'móvil o pantalla estrecha' : 'ordenador o pantalla ancha'}</strong>:
              </span>
            </div>

            <div className="space-y-2">
              {/* Opción 1: 1 Mes */}
              <button
                disabled={isSavingPref}
                onClick={() => handleSetDefaultMonthsForDevice('1', selectedConfigDevice)}
                className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-ui cursor-pointer flex items-start justify-between gap-3 ${
                  devicePrefs[selectedConfigDevice] === '1'
                    ? 'bg-[var(--acc)]/10 text-[var(--ink)]'
                    : 'bg-[var(--bg)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs font-sans">1 Mes</span>
                    <span
                      className={`text-micro font-sans px-1.5 py-0.2 rounded font-semibold ${
                        devicePrefs[selectedConfigDevice] === '1'
                          ? 'bg-[var(--ink)] text-[var(--bg)] font-bold'
                          : 'bg-[var(--sunken)] text-[var(--ink-2)]'
                      }`}
                    >
                      {devicePrefs[selectedConfigDevice] === '1' ? 'Predeterminado' : 'Recomendado móvil'}
                    </span>
                  </div>
                  <p className={`text-micro mt-1 leading-snug ${'text-[var(--ink-2)]'}`}>
                    Vista limpia y despejada de 1 mes (por defecto en dispositivos móviles).
                  </p>
                </div>
                {devicePrefs[selectedConfigDevice] === '1' && <Check className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />}
              </button>

              {/* Opción 2: 2 Meses */}
              <button
                disabled={isSavingPref}
                onClick={() => handleSetDefaultMonthsForDevice('2', selectedConfigDevice)}
                className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-ui cursor-pointer flex items-start justify-between gap-3 ${
                  devicePrefs[selectedConfigDevice] === '2'
                    ? 'bg-[var(--acc)]/10 text-[var(--ink)]'
                    : 'bg-[var(--bg)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs font-sans">2 Meses</span>
                    <span
                      className={`text-micro font-sans px-1.5 py-0.2 rounded font-semibold ${
                        devicePrefs[selectedConfigDevice] === '2'
                          ? 'bg-[var(--ink)] text-[var(--bg)] font-bold'
                          : 'bg-[var(--sunken)] text-[var(--ink-2)]'
                      }`}
                    >
                      {devicePrefs[selectedConfigDevice] === '2' ? 'Predeterminado' : 'Recomendado ordenador'}
                    </span>
                  </div>
                  <p className={`text-micro mt-1 leading-snug ${'text-[var(--ink-2)]'}`}>
                    Vista bimestral extendida (por defecto al entrar desde ordenador o pantalla grande).
                  </p>
                </div>
                {devicePrefs[selectedConfigDevice] === '2' && <Check className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />}
              </button>
            </div>

            {/* Toast feedback */}
            {configToast && (
              <div className="mt-3 p-2 rounded-[var(--r-s)] bg-[var(--ok)]/15 text-[var(--ink)] text-micro font-sans flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{configToast}</span>
              </div>
            )}

            <div className={`mt-3 pt-2.5 flex items-center justify-between text-micro font-sans ${'text-[var(--ink-2)]'}`}>
              <span className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span>Sincronizado con tu cuenta</span>
              </span>
              <span className="font-bold text-[var(--acc)]">
                {selectedConfigDevice === 'mobile' ? 'Móvil' : 'Ordenador'}: {devicePrefs[selectedConfigDevice]}M
              </span>
            </div>
          </PopoverAncla>
        )}
      </div>
    </>
  );
}
