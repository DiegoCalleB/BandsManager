/**
 * Leyenda de colores de los tipos de evento.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */

/**
 * Leyenda de colores de los tipos de evento.
 * @returns Sección de interfaz.
 */
export function CalendarLegend() {
  return (
    <>
      {/* Legend */}
      <div className={`flex flex-wrap gap-4 text-micro font-sans pt-4 mt-6 ${'text-[var(--ink-2)]'}`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-[var(--r-pill)] ${'bg-[var(--acc)]'}`} />
          <span>Concierto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-[var(--r-pill)] ${'bg-[var(--ok)]'}`} />
          <span>Ensayo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--tentative)]" />
          <span>Reunión</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--tentative)]" />
          <span>Posible concierto</span>
        </div>
      </div>
    </>
  );
}
