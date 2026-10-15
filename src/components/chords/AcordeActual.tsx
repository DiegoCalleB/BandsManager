import React from 'react';
import { Pause, Play, ChevronDown, ChevronUp } from 'lucide-react';
import type { ContextoAcorde, VistaAcorde } from '../../utils/vistaAcordes';
import { gradoVisible, type EstiloArmonia } from '../../utils/estiloArmonia';
import type { NivelAcorde } from '../../utils/voicings';
import { CajaAcorde, SelectorNivel, SelectorVistaAcorde } from './AcordeEnInstrumento';
import { RelojEnAcorde } from './RelojEnAcorde';
import { duracionAcorde } from '../../utils/relojAcorde';
import { proximosVisibles, type EstadoAcordeActual } from './acordeActualEstado';

interface BarraProps {
  estado: EstadoAcordeActual;
  /** Los que vienen después, si la hoja está sincronizada con el audio. */
  proximos?: string[];
  /** Compatibilidad: un solo siguiente. */
  siguiente?: string | null;
  /** Play/pausa siempre a mano: la barra se queda pegada arriba aunque se baje por la hoja. */
  reproduciendo?: boolean;
  onToggle?: () => void;
}

/**
 * Barra fija sobre la hoja (se queda pegada arriba al hacer scroll): play/pausa, el acorde que suena y los
 * que vienen. Los diagramas van aparte, debajo de la línea de acordes del audio.
 */
export const BarraAcordeActual: React.FC<BarraProps> = ({ estado, proximos, siguiente, reproduciendo, onToggle }) => {
  const { acorde, diagramas, alternarDiagramas } = estado;
  const lista = proximosVisibles(proximos, siguiente);
  return (
    <section translate="no" aria-label="Acorde actual" className="notranslate sticky top-0 z-10 mx-4 mt-3 bg-[var(--sunken)] rounded-[var(--r-l)] p-2.5 shrink-0">
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
    </section>
  );
};

interface DiagramasProps {
  estado: EstadoAcordeActual;
  proximos?: string[];
  siguiente?: string | null;
  /** ¿Suena ahora? (en pausa se enseña el último sin iluminarlo). */
  sonando: string | null;
  contexto: Map<string, ContextoAcorde>;
  vista: VistaAcorde;
  onVista: (v: VistaAcorde) => void;
  nivel?: NivelAcorde;
  onNivel?: (n: NivelAcorde) => void;
  estiloArmonia?: EstiloArmonia;
  /** Con la hoja sincronizada, el borde del acorde actual es un reloj que se llena hasta el cambio. */
  reloj?: { indice: number; tiempos: number[]; duracion: number; audioRef: React.RefObject<HTMLAudioElement | null> };
  /** Posición en el cifrado de cada uno de `proximos` (mismo orden), para saltar el audio al tocarlos. */
  indices?: number[];
  /** Tocar un diagrama lleva el audio a ese acorde. */
  onIr?: (indiceCifrado: number) => void;
}

/** Cuánto dura un acorde, como barra proporcional al más largo de los que se ven y los segundos al lado. */
const BarraDuracion: React.FC<{ segundos: number; maximo: number }> = ({ segundos, maximo }) => (
  <div className="flex items-center gap-1.5 px-1 pt-1" title={`Dura ${segundos.toFixed(1).replace('.', ',')} s`}>
    <div className="flex-1 h-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]" aria-hidden>
      <div className="h-full rounded-[var(--r-pill)] bg-[var(--acc)]" style={{ width: `${Math.max(12, Math.min(100, (segundos / Math.max(maximo, 0.001)) * 100))}%` }} />
    </div>
    <span className="text-micro font-sans tabular-nums text-[var(--ink-2)] shrink-0">{segundos.toFixed(1).replace('.', ',')} s</span>
  </div>
);

/** El acorde actual y los que vienen, como diagramas que avanzan con la canción. */
export const DiagramasAcordeActual: React.FC<DiagramasProps> = ({ estado, proximos, siguiente, sonando, contexto, vista, onVista, nivel = 'normal', onNivel, estiloArmonia, reloj, indices, onIr }) => {
  const { acorde, previo, diagramas } = estado;
  if (!diagramas || !acorde) return null;
  const origen = proximos ?? (siguiente ? [siguiente] : []);
  const lista = origen.map((c, k) => ({ c, indice: indices?.[k] })).slice(0, 3);
  const duraciones = lista.map(({ indice }) => (reloj && indice !== undefined ? duracionAcorde(reloj.tiempos, indice, reloj.duracion) : null));
  const maxDur = Math.max(0, ...duraciones.map((d) => d ?? 0));
  const gradoDe = (c: string) => {
    const info = contexto.get(c)?.info;
    return info && estiloArmonia && estiloArmonia.mostrar !== 'nombre' ? gradoVisible(info.grado, estiloArmonia) : undefined;
  };
  const actual = <CajaAcorde key={acorde} chord={acorde} vista={vista} contexto={contexto.get(acorde)} grado={gradoDe(acorde)} sonando={Boolean(sonando)} nivel={nivel} previo={previo} conReloj={Boolean(reloj)} />;
  return (
    <section translate="no" aria-label="Diagramas de los acordes que vienen" className="notranslate mx-4 mt-3 bg-[var(--sunken)] rounded-[var(--r-l)] p-2.5 space-y-2 shrink-0">
      <div className="flex items-start gap-2 overflow-x-auto p-1">
        <div className="w-32 shrink-0">
          {reloj ? (
            <RelojEnAcorde diagrama activo={Boolean(sonando)} indice={reloj.indice} tiempos={reloj.tiempos} duracionTotal={reloj.duracion} audioRef={reloj.audioRef}>{actual}</RelojEnAcorde>
          ) : actual}
        </div>
        {lista.map(({ c, indice }, i) => {
          const ir = onIr && indice !== undefined ? () => onIr(indice) : undefined;
          return (
            <div
              key={`${c}-${i}`}
              role={ir ? 'button' : undefined}
              tabIndex={ir ? 0 : undefined}
              aria-label={ir ? `Ir al acorde ${c}` : undefined}
              onClick={ir && ((e) => { if (!(e.target as HTMLElement).closest('button')) ir(); })}
              onKeyDown={ir && ((e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ir(); } })}
              className={`w-28 shrink-0 rounded-[var(--r-m)] ${ir ? 'cursor-pointer' : ''} ${i > 0 ? 'opacity-70' : ''}`}
            >
              <CajaAcorde chord={c} vista={vista} contexto={contexto.get(c)} grado={gradoDe(c)} nivel={nivel} previo={i === 0 ? acorde : lista[i - 1].c} sonar={!ir} />
              {duraciones[i] !== null && maxDur > 0 && <BarraDuracion segundos={duraciones[i] as number} maximo={maxDur} />}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 flex-wrap"><SelectorVistaAcorde vista={vista} onCambio={onVista} />{onNivel && <SelectorNivel nivel={nivel} onCambio={onNivel} />}</div>
    </section>
  );
};
