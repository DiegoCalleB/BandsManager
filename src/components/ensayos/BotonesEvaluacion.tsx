import { Button } from '../ui';
import { ShowIcon } from '../ui/ShowIcon';
import type { EvaluacionPista } from '../../hooks/useSeguimientoEnsayo';

/** Evaluación de 1 toque de la pista (bordada / regular / repetir). `compacto` = barra del atril. */
export function BotonesEvaluacion({
  actual,
  onElegir,
  compacto = false,
}: {
  actual?: EvaluacionPista | null;
  onElegir: (e: EvaluacionPista) => void;
  compacto?: boolean;
}) {
  const gap = compacto ? 'gap-1' : 'gap-1.5';
  const tamano = compacto ? 'xs' : 'sm';
  const relleno = compacto ? 'py-1.5' : 'py-2';
  return (
    <>
      {!compacto && (
        <span className="text-xs font-sans text-[var(--ink-2)] mr-1 hidden xs:inline">Evaluación:</span>
      )}
      <Button
        variant={actual === 'bordada' ? 'primary' : 'neutral'}
        size={tamano}
        onClick={() => onElegir('bordada')}
        className={`flex-1 sm:flex-none items-center justify-center ${gap}`}
      >
        <span><ShowIcon inline emoji="🟢" />{compacto ? 'Bordada' : ' Bordada'}</span>
      </Button>
      <Button
        variant="primary"
        size={tamano}
        onClick={() => onElegir('regular')}
        className={`flex-1 sm:flex-none items-center justify-center ${gap}`}
      >
        <span><ShowIcon inline emoji="🟡" />{compacto ? 'Regular' : ' Regular'}</span>
      </Button>
      <button
        onClick={() => onElegir('repetir')}
        className={`flex-1 sm:flex-none flex items-center justify-center ${gap} px-3 ${relleno} rounded-[var(--r-pill)] text-xs font-sans font-bold transition-ui cursor-pointer ${
          actual === 'repetir'
            ? 'bg-[var(--alert)] text-[var(--on-alert)]'
            : 'bg-[var(--alert)]/15 text-[var(--ink)] hover:bg-[var(--alert)]/25'
        }`}
      >
        <span><ShowIcon inline emoji="🔴" />{compacto ? 'Repetir' : ' Repetir'}</span>
      </button>
    </>
  );
}
