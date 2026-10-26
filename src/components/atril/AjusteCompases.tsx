/**
 * Correcciones rápidas de los compases: tap tempo, «compás 1 aquí», desplazar un pulso, ½×/2×,
 * 3/4 ↔ 4/4 y restablecer. Todo con un toque, pensado para usarlo con la canción sonando.
 */
import { useState } from "react";
import type { RefObject } from "react";
import type { AjusteCompases as Ajuste, Cuadricula } from "../../utils/cuadriculaCompases";
import { bpmDeToques, desplazar, escalarTempo, sumarToque } from "../../utils/ajusteCompases";

const PILDORA = "px-3 py-2 min-h-11 rounded-[var(--r-pill)] bg-[var(--sunken)] text-xs font-bold text-[var(--ink)] cursor-pointer transition-ui hover:bg-[var(--acc-soft)] active:bg-[var(--acc-soft)]";

interface Props {
  cuadricula: Cuadricula | null;
  ajuste: Ajuste;
  onAjuste: (a: Ajuste) => void;
  audioRef: RefObject<HTMLAudioElement | null>;
}

/**
 * Barra de correcciones de compases.
 * @returns Sección de interfaz.
 */
export function AjusteCompases({ cuadricula, ajuste, onAjuste, audioRef }: Props) {
  const [toques, setToques] = useState<number[]>([]);
  const tap = () => {
    const siguientes = sumarToque(toques, performance.now());
    setToques(siguientes);
    const bpm = bpmDeToques(siguientes);
    if (bpm) onAjuste({ ...ajuste, bpm });
  };
  const aqui = () => onAjuste({ ...ajuste, inicio: audioRef.current?.currentTime ?? 0 });
  const mover = (pulsos: number) => cuadricula && onAjuste(desplazar(cuadricula, ajuste, pulsos));
  const escalar = (f: 0.5 | 2) => {
    const nuevo = cuadricula && escalarTempo(cuadricula, ajuste, f);
    if (nuevo) onAjuste(nuevo);
  };
  const tiempos = cuadricula?.tiemposPorCompas ?? 4;
  const hayAjuste = Object.keys(ajuste).length > 0;
  return (
    <div role="group" aria-label="Corregir compases" className="flex flex-wrap items-center gap-1.5">
      <button type="button" className={PILDORA} onClick={tap} aria-label="Tap tempo: toca el pulso">Tap{toques.length > 0 ? ` · ${toques.length}` : ""}</button>
      <button type="button" className={PILDORA} onClick={aqui}>Compás 1 aquí</button>
      {cuadricula && (
        <>
          <button type="button" className={PILDORA} onClick={() => mover(-1)} aria-label="Adelantar la rejilla un pulso">◀ 1 pulso</button>
          <button type="button" className={PILDORA} onClick={() => mover(1)} aria-label="Retrasar la rejilla un pulso">1 pulso ▶</button>
          <button type="button" className={PILDORA} onClick={() => escalar(0.5)}>½×</button>
          <button type="button" className={PILDORA} onClick={() => escalar(2)}>2×</button>
        </>
      )}
      <button type="button" className={PILDORA} onClick={() => onAjuste({ ...ajuste, tiempos: tiempos === 4 ? 3 : 4 })} aria-label="Cambiar entre 3 y 4 tiempos por compás">{tiempos === 4 ? "4/4 → 3/4" : "3/4 → 4/4"}</button>
      {hayAjuste && <button type="button" className={`${PILDORA} text-[var(--ink-2)]`} onClick={() => { setToques([]); onAjuste({}); }}>Restablecer</button>}
    </div>
  );
}
