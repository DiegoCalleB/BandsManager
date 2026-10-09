/**
 * Barra de Iris a nivel de canción: resumen de pistas y entrada a la hoja de Iris
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Cpu, Sliders } from "lucide-react";
import { useSongStudio } from "./SongStudioContext";

/**
 * Barra de Iris a nivel de canción: resumen de pistas y entrada a la hoja de Iris
 * @returns Sección de interfaz.
 */
export function SongStudioIrisBar() {
  const { irisIdea, metaStems, setShowIrisPanel, setShowMoisesStemsModal, fuenteIris, isSeparatingStemsAi } = useSongStudio();
  return (
    <>
      {/* Sleek Top Action Bar:"Atajos" y"Cargar Tema Original" viven ya en Herramientas
     y en el propio formulario de nueva idea — un único botón de acción aquí basta */}
      {/* Iris es de la canción, no de una toma: tiene su propia hoja (mezclador, motor, separar). Aquí solo la entrada */}
      <div className="flex items-center justify-between gap-3 p-2 sm:p-3 bg-[var(--acc-soft)] rounded-[var(--r-l)] flex-wrap">
        <span className="text-xs font-sans font-bold text-[var(--acc-ink)] flex items-center gap-1.5">
          <Cpu className="w-4 h-4" /> Iris · pistas de la canción
          {irisIdea && (
            <span className="font-semibold text-[var(--ink-2)]">
              {' '}
              · {irisIdea.pistas?.length ?? 0} pistas
              {metaStems?.motor ? ` · ${metaStems.motor.split('(')[0].trim()}` : ''}
              {metaStems?.degradado ? ' (degradado)' : ''}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => (irisIdea ? setShowIrisPanel(true) : setShowMoisesStemsModal(fuenteIris))}
          disabled={!irisIdea && (isSeparatingStemsAi || !fuenteIris)}
          className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:brightness-110 text-[var(--on-acc)] font-bold text-xs flex items-center gap-1.5 transition-ui cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Abrir Iris: mezclador y separación de pistas"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isSeparatingStemsAi ? 'Separando...' : irisIdea ? 'Abrir Iris' : 'Separar con Iris'}</span>
        </button>
      </div>
    </>
  );
}
