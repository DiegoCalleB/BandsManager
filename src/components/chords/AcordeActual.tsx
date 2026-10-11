import React, { useEffect, useState } from 'react';
import { Pause, Play, ChevronDown, ChevronUp } from 'lucide-react';
import type { ContextoAcorde, VistaAcorde } from '../../utils/vistaAcordes';
import { gradoVisible, type EstiloArmonia } from '../../utils/estiloArmonia';
import { CajaAcorde, SelectorVistaAcorde } from './AcordeEnInstrumento';

interface Props {
  /** Acorde que suena ahora (transpuesto, como se ve en la hoja). */
  sonando: string | null;
  /** Los que vienen después (el primero es «Siguiente»), si la hoja está sincronizada con el audio. */
  proximos?: string[];
  /** Compatibilidad: un solo siguiente. */
  siguiente?: string | null;
  contexto: Map<string, ContextoAcorde>;
  vista: VistaAcorde;
  onVista: (v: VistaAcorde) => void;
  estiloArmonia?: EstiloArmonia;
  /** Play/pausa siempre a mano: la barra se queda pegada arriba aunque se baje por la hoja. */
  reproduciendo?: boolean;
  onToggle?: () => void;
}

const CLAVE_DIAGRAMAS = 'bm_acorde_actual_diagramas';

/**
 * Barra fija sobre la hoja (se queda pegada arriba al hacer scroll): play/pausa, el acorde que suena y los
 * que vienen, como una tira de diagramas que avanza con la canción. Se pliega a solo nombres para ganar sitio.
 * Al pausar conserva el último acorde para poder mirarlo con calma.
 */
export const AcordeActual: React.FC<Props> = ({ sonando, proximos, siguiente, contexto, vista, onVista, estiloArmonia, reproduciendo, onToggle }) => {
  const [ultimo, setUltimo] = useState<string | null>(sonando);
  useEffect(() => { if (sonando) setUltimo(sonando); }, [sonando]);
  const [diagramas, setDiagramas] = useState<boolean>(() => {
    try { return localStorage.getItem(CLAVE_DIAGRAMAS) !== '0'; } catch { return true; }
  });
  const alternarDiagramas = () => {
    const v = !diagramas;
    setDiagramas(v);
    try { localStorage.setItem(CLAVE_DIAGRAMAS, v ? '1' : '0'); } catch { /* vale solo esta sesión */ }
  };

  const acorde = sonando ?? ultimo;
  const lista = (proximos ?? (siguiente ? [siguiente] : [])).filter((c) => c !== acorde).slice(0, 3);
  const gradoDe = (c: string) => {
    const info = contexto.get(c)?.info;
    return info && estiloArmonia && estiloArmonia.mostrar !== 'nombre' ? gradoVisible(info.grado, estiloArmonia) : undefined;
  };

  return (
    <section translate="no" aria-label="Acorde actual" className="notranslate sticky top-0 z-10 mx-4 mt-3 bg-[var(--sunken)] rounded-[var(--r-l)] p-2.5 space-y-2 shrink-0">
      <div className="flex items-center gap-2">
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
            className={`p-2.5 rounded-[var(--r-pill)] shrink-0 cursor-pointer transition-ui ${reproduciendo ? 'bg-[var(--ink)] text-[var(--bg)]' : 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'}`}
          >
            {reproduciendo ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
          </button>
        )}
        {acorde ? (
          <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto">
            <span className="px-3 py-1 rounded-[var(--r-pill)] bg-[var(--acc-soft)] text-[var(--acc-ink)] text-lg font-bold leading-none">{acorde}</span>
            {lista.length > 0 && <span className="text-xs font-sans text-[var(--ink-2)] shrink-0">Siguiente</span>}
            {lista.map((c, i) => (
              <span key={`${c}-${i}`} className={`px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--surface)] text-sm font-bold text-[var(--ink)] shrink-0 ${i > 0 ? 'opacity-60' : ''}`}>{c}</span>
            ))}
          </div>
        ) : (
          <p className="text-xs font-sans text-[var(--ink-2)] flex-1">{onToggle ? 'Dale al play' : 'Con audio'}: aquí verás cómo se toca el acorde que suena.</p>
        )}
        <button
          type="button"
          onClick={alternarDiagramas}
          aria-expanded={diagramas}
          aria-label={diagramas ? 'Ocultar diagramas' : 'Ver diagramas'}
          className="ml-auto p-2 rounded-[var(--r-pill)] bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer shrink-0"
        >
          {diagramas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {diagramas && acorde && (
        <>
          <div className="flex items-start gap-2 overflow-x-auto pb-1" aria-label="Diagramas de los acordes que vienen">
            <div className="w-32 shrink-0"><CajaAcorde chord={acorde} vista={vista} contexto={contexto.get(acorde)} grado={gradoDe(acorde)} sonando={Boolean(sonando)} /></div>
            {lista.map((c, i) => (
              <div key={`${c}-${i}`} className={`w-28 shrink-0 ${i > 0 ? 'opacity-70' : ''}`}><CajaAcorde chord={c} vista={vista} contexto={contexto.get(c)} grado={gradoDe(c)} /></div>
            ))}
          </div>
          <div className="flex justify-end"><SelectorVistaAcorde vista={vista} onCambio={onVista} /></div>
        </>
      )}
    </section>
  );
};
