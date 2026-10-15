import { ShowIcon } from '../ui/ShowIcon';
import { itemLabel } from "./performanceModel";

import { useActivePerformanceItem,useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Pantalla negra del modo descanso: ahorra batería hasta que se toca.
 * @returns Pantalla de descanso.
 */
export function PerformanceRestScreen() {
  const { setIsResting, songs } = useSetlistPerformance();
  const currentItem = useActivePerformanceItem();
  // MODO DESCANSO: pantalla negra a pantalla completa, sin wake lock — la opción real más
  // parecida a"apagar la pantalla" que puede ofrecer una web. Cualquier toque la despierta.
  return (
      <div
  className="fixed inset-0 z-[9999] bg-[var(--surface)] flex flex-col items-center justify-center text-center p-8 cursor-pointer select-none"
  onClick={() => setIsResting(false)}
      >
  <span className="text-5xl mb-4"><ShowIcon inline emoji="😴" /></span>
  <p className="text-[var(--ink-2)] text-sm font-sans mb-1">
    Modo descanso — ahorrando batería
  </p>
  <p className="text-[var(--ink)] text-xs font-sans">
    Toca la pantalla para volver a "{itemLabel(currentItem, songs)}"
  </p>
      </div>
    );
}
