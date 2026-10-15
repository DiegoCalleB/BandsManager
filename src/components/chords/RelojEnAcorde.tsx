import React, { useEffect, useRef } from 'react';
import { estadoReloj, gradosDeProgreso } from '../../utils/relojAcorde';

interface Props {
  /** ¿Es el acorde que suena ahora? Solo ése tiene reloj y bucle de animación. */
  activo: boolean;
  /** Posición del acorde en el cifrado y los instantes de todos (para saber cuándo acaba). */
  indice: number;
  tiempos: number[];
  duracionTotal: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  children: React.ReactNode;
  /** Diagramas: el reloj ocupa todo el ancho, con las esquinas de la ficha, y no ilumina al siguiente (en la letra sí). */
  diagrama?: boolean;
}

/**
 * Envuelve el chip de un acorde de la letra. En el acorde activo dibuja alrededor un reloj que se
 * va llenando como las agujas, de modo que no hay que mirar el aro de arriba: el cambio se ve en el
 * propio acorde. En el último tramo el reloj cambia de color y el chip SIGUIENTE se ilumina para
 * ir preparando la mano. Va por animación directa del DOM (sin re-renderizar la letra a 60 fps).
 */
export const RelojEnAcorde: React.FC<Props> = ({ activo, indice, tiempos, duracionTotal, audioRef, children, diagrama }) => {
  const anillo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!activo) return;
    const elAnillo = anillo.current;
    let raf = 0;
    let siguiente: HTMLElement | null = null;
    const apagarSiguiente = () => {
      if (siguiente) { siguiente.style.outline = ''; siguiente.style.outlineOffset = ''; }
    };
    const paso = () => {
      const audio = audioRef.current;
      const el = anillo.current;
      if (audio && el) {
        const e = estadoReloj(tiempos, indice, audio.currentTime, duracionTotal);
        if (e) {
          const color = e.avisando ? 'var(--tentative)' : 'var(--acc)';
          // Esfera del reloj: el barrido avanza como una aguja sobre una pista tenue del mismo color.
          el.style.background = `conic-gradient(from 0deg, ${color} ${gradosDeProgreso(e.progreso)}deg, color-mix(in srgb, var(--acc) 22%, transparent) 0)`;
          if (!diagrama) siguiente ??= document.getElementById(`cifrado-acorde-${indice + 1}`);
          if (siguiente) {
            siguiente.style.outline = e.avisando ? '2px solid var(--tentative)' : '';
            siguiente.style.outlineOffset = e.avisando ? '2px' : '';
          }
        }
      }
      raf = requestAnimationFrame(paso);
    };
    paso();
    return () => {
      cancelAnimationFrame(raf);
      apagarSiguiente();
      if (elAnillo) elAnillo.style.background = '';
    };
  }, [activo, indice, tiempos, duracionTotal, audioRef, diagrama]);

  // Siempre con el mismo relleno (3 px) para que activarse no desplace la letra.
  return (
    <span ref={anillo} className={diagrama ? 'flex rounded-[calc(var(--r-m)+3px)] p-[3px]' : 'inline-flex rounded-[var(--r-s)] p-[3px] align-bottom'} data-reloj={activo ? 'activo' : undefined}>
      {children}
    </span>
  );
};
