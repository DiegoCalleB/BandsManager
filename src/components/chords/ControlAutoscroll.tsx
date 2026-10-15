import React from 'react';
import { Pause, Play } from 'lucide-react';
import type { AutoScroll } from '../../hooks/useAutoScroll';

const VELOCIDADES = [1, 2, 3];

/** Botón de autoscroll + selector de velocidad, igual en el visor, el ensayo y el atril. */
export const ControlAutoscroll: React.FC<{ auto: AutoScroll; velocidadSiempre?: boolean }> = ({ auto, velocidadSiempre }) => (
  <div className="flex items-center gap-1.5 bg-[var(--sunken)] px-2 py-1 rounded-[var(--r-m)]">
    <button
      type="button"
      onClick={auto.alternar}
      aria-pressed={auto.activo}
      title="Iniciar o pausar el desplazamiento automático"
      className={`px-2.5 py-0.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1 transition-ui cursor-pointer ${auto.activo ? 'bg-[var(--ok)] text-[var(--on-ok)]' : 'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
    >
      {auto.activo ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
      <span>{auto.activo ? 'Pausar' : 'Autoscroll'}</span>
    </button>
    {(auto.activo || velocidadSiempre) && (
      <span className="flex items-center gap-0.5" role="group" aria-label="Velocidad">
        {VELOCIDADES.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={auto.velocidad === v}
            onClick={() => auto.setVelocidad(v)}
            className={`w-6 h-5 rounded-[var(--r-s)] text-micro font-bold cursor-pointer transition-ui ${auto.velocidad === v ? 'bg-[var(--ok)] text-[var(--on-ok)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
          >
            {v}x
          </button>
        ))}
      </span>
    )}
  </div>
);
