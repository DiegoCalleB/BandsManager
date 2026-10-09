import React, { useEffect, useState } from 'react';
import type { ContextoAcorde, VistaAcorde } from '../../utils/vistaAcordes';
import { gradoVisible, type EstiloArmonia } from '../../utils/estiloArmonia';
import { CajaAcorde, SelectorVistaAcorde } from './AcordeEnInstrumento';

interface Props {
  /** Acorde que suena ahora (transpuesto, como se ve en la hoja). */
  sonando: string | null;
  /** El que viene después, si la hoja está sincronizada con el audio. */
  siguiente?: string | null;
  contexto: Map<string, ContextoAcorde>;
  vista: VistaAcorde;
  onVista: (v: VistaAcorde) => void;
  estiloArmonia?: EstiloArmonia;
}

/**
 * Tarjeta fija sobre la hoja: el diagrama del acorde que suena (y una miniatura del siguiente) sin tener
 * que buscarlo en el cajón lateral. Al pausar conserva el último acorde para poder mirarlo con calma.
 */
export const AcordeActual: React.FC<Props> = ({ sonando, siguiente, contexto, vista, onVista, estiloArmonia }) => {
  const [ultimo, setUltimo] = useState<string | null>(sonando);
  useEffect(() => { if (sonando) setUltimo(sonando); }, [sonando]);

  const acorde = sonando ?? ultimo;
  const gradoDe = (c: string) => {
    const info = contexto.get(c)?.info;
    return info && estiloArmonia && estiloArmonia.mostrar !== 'nombre' ? gradoVisible(info.grado, estiloArmonia) : undefined;
  };

  return (
    <section translate="no" aria-label="Acorde actual" className="notranslate bg-[var(--sunken)] rounded-[var(--r-l)] p-3 flex items-center gap-3 shrink-0">
      {acorde ? (
        <>
          <div className="w-40 shrink-0"><CajaAcorde chord={acorde} vista={vista} contexto={contexto.get(acorde)} grado={gradoDe(acorde)} sonando={Boolean(sonando)} /></div>
          {siguiente && siguiente !== acorde && (
            <div className="text-xs font-sans text-[var(--ink-2)]">
              Siguiente
              <div className="mt-1 px-3 py-1 rounded-[var(--r-pill)] bg-[var(--surface)] text-sm font-bold text-[var(--ink)] inline-block">{siguiente}</div>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs font-sans text-[var(--ink-2)] flex-1">Dale al play o toca un acorde: aquí verás cómo se toca el que suena.</p>
      )}
      <div className="ml-auto self-start"><SelectorVistaAcorde vista={vista} onCambio={onVista} /></div>
    </section>
  );
};
