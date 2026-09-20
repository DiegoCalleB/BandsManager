import React from 'react';
import { Clock, Guitar } from 'lucide-react';

interface MusicToolsQuickLinksProps {
 variant:'desktop' |'mobile';
 onOpenMetronome: () => void;
 onOpenTuner: () => void;
}

/**
 * Accesos directos a Metrónomo y Afinador, mostrados dentro del grupo"Música" del
 * menú (en vez de en un bloque"Herramientas" siempre visible aparte): son
 * herramientas de músico, tienen sentido junto a Repertorio/Calendario, y solo
 * ocupan espacio cuando ese grupo está abierto.
 */
export const MusicToolsQuickLinks: React.FC<MusicToolsQuickLinksProps> = ({ variant, onOpenMetronome, onOpenTuner }) => {
 if (variant ==='desktop') {
 return (
 <div className="grid grid-cols-2 gap-1.5 px-3 pb-1.5 pt-0.5">
 <button
 onClick={onOpenMetronome}
 className="flex items-center gap-2 p-2 rounded-[var(--r-m)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)]/70 transition-all cursor-pointer text-left active:scale-95 group"
 title="Abrir Metrónomo WebAudio Pro"
 >
 <div className="p-1 rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--acc)] group-hover:scale-105 transition-transform shrink-0">
 <Clock className="w-3.5 h-3.5" />
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[11px] font-bold truncate leading-tight">Metrónomo</span>
 <span className="text-[9px] text-[var(--acc)]/80 font-sans truncate">Click & Tap</span>
 </div>
 </button>

 <button
 onClick={onOpenTuner}
 className="flex items-center gap-2 p-2 rounded-[var(--r-m)] bg-[var(--ok)]/10 hover:bg-[var(--ok)]/20 text-[var(--ink-2)] transition-all cursor-pointer text-left active:scale-95 group"
 title="Abrir Afinador de Guitarra, Bajo y Ukelele"
 >
 <div className="p-1 rounded-[var(--r-s)] bg-[var(--ok)]/20 text-[var(--ok)] group-hover:scale-105 transition-transform shrink-0">
 <Guitar className="w-3.5 h-3.5" />
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[11px] font-bold truncate leading-tight">Afinador</span>
 <span className="text-[9px] text-[var(--ok)]/80 font-sans truncate">Guitar, Bass & Uke</span>
 </div>
 </button>
 </div>
 );
 }

 return (
 <div className="grid grid-cols-2 gap-2 px-3.5 pb-1.5 pt-0.5">
 <button
 onClick={onOpenMetronome}
 className="flex items-center gap-2 p-2 rounded-[var(--r-m)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)]/70 transition-all cursor-pointer text-left active:scale-95"
 title="Abrir Metrónomo WebAudio Pro"
 >
 <Clock className="w-4 h-4 text-[var(--acc)] shrink-0" />
 <div className="flex flex-col min-w-0">
 <span className="text-[11px] font-bold truncate leading-tight">Metrónomo</span>
 <span className="text-[9px] text-[var(--acc)]/70 font-sans truncate">Tap Tempo</span>
 </div>
 </button>

 <button
 onClick={onOpenTuner}
 className="flex items-center gap-2 p-2 rounded-[var(--r-m)] bg-[var(--ok)]/10 hover:bg-[var(--ok)]/20 text-[var(--ink-2)] transition-all cursor-pointer text-left active:scale-95"
 title="Abrir Afinador de Guitarra, Bajo y Ukelele"
 >
 <Guitar className="w-4 h-4 text-[var(--ok)] shrink-0" />
 <div className="flex flex-col min-w-0">
 <span className="text-[11px] font-bold truncate leading-tight">Afinador</span>
 <span className="text-[9px] text-[var(--ok)]/70 font-sans truncate">Guitar, Bass & Uke</span>
 </div>
 </button>
 </div>
 );
};
