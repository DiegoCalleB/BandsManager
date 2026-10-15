import { Button } from '../ui';
import { PublicoSilhouette } from "../ui/PublicoSilhouette";

import { useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Pantalla del repertorio vacío.
 * @returns Aviso con botón de cierre.
 */
export function PerformanceEmptyState() {
  const { onClose } = useSetlistPerformance();
  return (
      <div className="fixed inset-0 z-[9999] bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center">
  <div className="text-center flex flex-col items-center gap-6">
    <PublicoSilhouette opacity={0.12} size="large" />
    <div>
      <p className="font-medium text-lg">Repertorio vacío</p>
      <p className="text-xs text-[var(--ink-2)] mt-2 max-w-xs">
  Añade canciones a tu repertorio para comenzar a ensayar.
      </p>
    </div>
    <Button
      variant="danger"
      onClick={onClose}
      className="mt-4"
    >
      Cerrar
    </Button>
  </div>
      </div>
    );
}
