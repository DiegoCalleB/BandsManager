/**
 * d
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Wrench } from "lucide-react";
import { LinkButton } from "../../ui";
import { useCalendar } from "../CalendarContext";

/**
 * d
 * @returns Sección de interfaz.
 */
export function RunOfShowTab() {
  const { getCurrentRoadbook, selectedDateKey, selectedConcert, setModalActiveTab, setShowEventFichaModal } = useCalendar();
  return (
    <>
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-micro">
        {(() => {
          const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
          return (
            <div className="space-y-2.5">
              <div
                className={`p-2.5 rounded-[var(--r-m)] ${'bg-[var(--acc-soft)]/70 '}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold flex items-center gap-1 text-[var(--acc)] font-mono text-micro">
                    <Wrench className="w-3 h-3" /> 1. Logística técnica
                  </span>
                  <LinkButton
                    size="xs"
                    type="button"
                    onClick={() => {
                      setModalActiveTab('tecnica');
                      setShowEventFichaModal(true);
                    }}
                  >
                    Editar completo →
                  </LinkButton>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-micro">
                  <div className={`p-1.5 rounded ${'bg-[var(--surface)]'}`}>
                    <span className="block text-[var(--ink-2)] font-mono text-micro">Prueba de sonido</span>
                    <span className="font-bold text-[var(--acc)]">{currentRb.horaPruebaSonido || '18:00'}</span>
                  </div>
                  <div className={`p-1.5 rounded ${'bg-[var(--surface)]'}`}>
                    <span className="block text-[var(--ink-2)] font-mono text-micro">Horario show</span>
                    <span className="font-bold text-[var(--ok)]">{currentRb.horaShow || '21:30'}</span>
                  </div>
                  <div className={`p-1.5 rounded ${'bg-[var(--surface)]'}`}>
                    <span className="block text-[var(--ink-2)] font-mono text-micro">Técnico sonido FOH</span>
                    <span className="font-medium truncate">{currentRb.tecnicoSonido || 'Propio / Sala'}</span>
                  </div>
                  <div className={`p-1.5 rounded ${'bg-[var(--surface)]'}`}>
                    <span className="block text-[var(--ink-2)] font-mono text-micro">Sistema P.A.</span>
                    <span className="font-medium truncate">{currentRb.paEspecificaciones ? 'Especificado' : 'Estándar Sala'}</span>
                  </div>
                </div>
                {currentRb.backlineInfo && (
                  <div className={`mt-2 p-1.5 rounded text-micro ${'bg-[var(--surface)]'}`}>
                    <span className="block text-[var(--ink-2)] font-mono text-micro">Backline y rider</span>
                    <p className="line-clamp-2 text-[var(--ink-2)]">{currentRb.backlineInfo}</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalActiveTab('tecnica');
                  setShowEventFichaModal(true);
                }}
                className="w-full py-1.5 px-2 rounded-[var(--r-m)] text-micro font-mono font-bold bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Wrench className="w-3 h-3" />
                <span>Abrir logística técnica completa</span>
              </button>
            </div>
          );
        })()}
      </div>
    </>
  );
}
