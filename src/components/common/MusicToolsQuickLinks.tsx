// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import React from 'react';
import { Clock, Guitar } from 'lucide-react';

interface MusicToolsQuickLinksProps {
  variant: 'desktop' | 'mobile';
  onOpenMetronome: () => void;
  onOpenTuner: () => void;
}

/**
 * Accesos directos a Metrónomo y Afinador, mostrados dentro del grupo "Música" del
 * menú (en vez de en un bloque "Herramientas" siempre visible aparte): son
 * herramientas de músico, tienen sentido junto a Repertorio/Calendario, y solo
 * ocupan espacio cuando ese grupo está abierto.
 */
export const MusicToolsQuickLinks: React.FC<MusicToolsQuickLinksProps> = ({ variant, onOpenMetronome, onOpenTuner }) => {
  if (variant === 'desktop') {
    return (
      <div className="grid grid-cols-2 gap-1.5 px-3 pb-1.5 pt-0.5">
        <button
          onClick={onOpenMetronome}
          className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all cursor-pointer text-left active:scale-95 group"
          title="Abrir Metrónomo WebAudio Pro"
        >
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold truncate leading-tight">Metrónomo</span>
            <span className="text-[9px] text-amber-400/80 font-mono truncate">Click & Tap</span>
          </div>
        </button>

        <button
          onClick={onOpenTuner}
          className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all cursor-pointer text-left active:scale-95 group"
          title="Abrir Afinador de Guitarra, Bajo y Ukelele"
        >
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Guitar className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold truncate leading-tight">Afinador</span>
            <span className="text-[9px] text-emerald-400/80 font-mono truncate">Guitar, Bass & Uke</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 px-3.5 pb-1.5 pt-0.5">
      <button
        onClick={onOpenMetronome}
        className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 transition-all cursor-pointer text-left active:scale-95"
        title="Abrir Metrónomo WebAudio Pro"
      >
        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-bold truncate leading-tight">Metrónomo</span>
          <span className="text-[9px] text-amber-400/70 font-mono truncate">Tap Tempo</span>
        </div>
      </button>

      <button
        onClick={onOpenTuner}
        className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 transition-all cursor-pointer text-left active:scale-95"
        title="Abrir Afinador de Guitarra, Bajo y Ukelele"
      >
        <Guitar className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-bold truncate leading-tight">Afinador</span>
          <span className="text-[9px] text-emerald-400/70 font-mono truncate">Guitar, Bass & Uke</span>
        </div>
      </button>
    </div>
  );
};
