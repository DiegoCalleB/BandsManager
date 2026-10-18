import { useApp } from './AppContext';

/**
 * Acceso a Planes para una banda Promo con la suscripción habilitada. Las bandas Promo no ven el
 * widget de créditos (no tienen créditos IA), pero esta puerta les deja llegar a la suscripción.
 */
export function EntradaPlanes() {
  const { isPromoPlan, suscripcionHabilitada, handleNavigate } = useApp();
  if (!isPromoPlan || !suscripcionHabilitada) return null;
  return (
    <button
      type="button"
      onClick={() => handleNavigate('planes')}
      className="mx-3 my-2 flex w-[calc(100%-1.5rem)] cursor-pointer items-center justify-between rounded-[var(--r-m)] bg-[var(--sunken)] px-3 py-2.5 text-xs font-semibold text-[var(--ink-2)] transition-ui hover:brightness-95"
    >
      <span>Suscripción</span>
      <span className="text-[var(--acc-ink)]">Planes →</span>
    </button>
  );
}
