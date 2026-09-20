import React from'react';
import { Wand2, X, Sparkles, RefreshCw } from'lucide-react';
import { ModalPortal } from'../common/ModalPortal';
import { SongAudioIdea, DrumPatternStyle } from'../../types';

interface SongStudioAiGeneratorModalProps {
 // Solo se usa como"hay idea seleccionada o no", pero el estado real es la idea completa.
 showGenModalForIdea: SongAudioIdea | null;
 onClose: () => void;
 genBpm: number;
 setGenBpm: (bpm: number) => void;
 genKey: string;
 setGenKey: (key: string) => void;
 includeDrums: boolean;
 setIncludeDrums: (v: boolean) => void;
 includeBass: boolean;
 setIncludeBass: (v: boolean) => void;
 drumStyle: DrumPatternStyle;
 setDrumStyle: (style: DrumPatternStyle) => void;
 genDuration: number;
 setGenDuration: (duration: number) => void;
 isGeneratingAccompaniment: boolean;
 handleGenerateAccompaniment: () => void;
}

export const SongStudioAiGeneratorModal: React.FC<SongStudioAiGeneratorModalProps> = ({
 showGenModalForIdea,
 onClose,
 genBpm,
 setGenBpm,
 genKey,
 setGenKey,
 includeDrums,
 setIncludeDrums,
 includeBass,
 setIncludeBass,
 drumStyle,
 setDrumStyle,
 genDuration,
 setGenDuration,
 isGeneratingAccompaniment,
 handleGenerateAccompaniment,
}) => {
 if (!showGenModalForIdea) return null;

 return (
 <ModalPortal isOpen={!!showGenModalForIdea} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
 <div className="w-full max-w-lg rounded-[var(--r-l)] bg-zinc-950 p-6 space-y-5 text-[var(--ink)] shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between border-b border-[var(--hair)] pb-3">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-[var(--r-m)] bg-purple-600/30 text-purple-400 flex items-center justify-center">
 <Wand2 className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold">Generar Base de Batería y Bajo</h3>
 <p className="text-xs text-purple-300 font-mono">Sintetizador Web Audio de Referencia</p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)]"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-purple-950/30 text-xs text-purple-200 space-y-1">
 <p className="font-semibold flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Pista de Referencia Orientativa
 </p>
 <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
 Genera una secuencia rítmica sintetizada de bajo y batería para escuchar cómo sonaría tu guitarra o voz con acompañamiento. Podrás añadirla como una pista más en el mezclador multipista.
 </p>
 </div>

 <div className="space-y-4">
 {/* BPM & Tonalidad */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-mono text-[var(--ink-2)] block mb-1">Tempo (BPM)</label>
 <input
 type="number"
 min={60}
 max={220}
 value={genBpm}
 onChange={(e) => setGenBpm(parseInt(e.target.value) || 120)}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-black text-xs text-[var(--ink)] focus:outline-none focus:border-purple-500 font-mono"
 />
 </div>
 <div>
 <label className="text-xs font-mono text-[var(--ink-2)] block mb-1">Tonalidad (Raíz del Bajo)</label>
 <select
 value={genKey}
 onChange={(e) => setGenKey(e.target.value)}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-black text-xs text-[var(--ink)] focus:outline-none focus:border-purple-500 font-mono"
 >
 <option value="Do">Do (C)</option>
 <option value="Re">Re (D)</option>
 <option value="Mi">Mi (E)</option>
 <option value="Fa">Fa (F)</option>
 <option value="Sol">Sol (G)</option>
 <option value="La">La (A)</option>
 <option value="Si">Si (B)</option>
 </select>
 </div>
 </div>

 {/* Instrument Checkboxes */}
 <div className="space-y-2">
 <label className="text-xs font-mono text-[var(--ink-2)] block">Instrumentos a incluir:</label>
 <div className="grid grid-cols-2 gap-3">
 <label className={`p-3 rounded-[var(--r-m)] flex items-center gap-2 cursor-pointer transition-all ${
 includeDrums ?'bg-purple-900/30 border-purple-500 text-[var(--ink)]' :'bg-black/40 text-[var(--ink-2)]'
 }`}>
 <input
 type="checkbox"
 checked={includeDrums}
 onChange={(e) => setIncludeDrums(e.target.checked)}
 className="accent-purple-500"
 />
 <span className="text-xs font-bold font-mono">🥁 Batería Synth</span>
 </label>

 <label className={`p-3 rounded-[var(--r-m)] flex items-center gap-2 cursor-pointer transition-all ${
 includeBass ?'bg-purple-900/30 border-purple-500 text-[var(--ink)]' :'bg-black/40 text-[var(--ink-2)]'
 }`}>
 <input
 type="checkbox"
 checked={includeBass}
 onChange={(e) => setIncludeBass(e.target.checked)}
 className="accent-purple-500"
 />
 <span className="text-xs font-bold font-mono">🎸 Bajo Tónica</span>
 </label>
 </div>
 </div>

 {/* Drum Style Selector */}
 {includeDrums && (
 <div>
 <label className="text-xs font-mono text-[var(--ink-2)] block mb-1">Patrón Rítmico de Batería</label>
 <div className="grid grid-cols-4 gap-2">
 {(['rock','pop','funk','reggae','ska','cumbia','punk'] as const).map(style => (
 <button
 key={style}
 type="button"
 onClick={() => setDrumStyle(style)}
 className={`py-2 px-1 rounded-[var(--r-m)] text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
 drumStyle === style
 ?'bg-purple-600 text-[var(--ink)] shadow-lg'
 :'bg-black/40 text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {style}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Duration */}
 <div>
 <label className="text-xs font-mono text-[var(--ink-2)] block mb-1">Duración del Bucle ({genDuration} segundos)</label>
 <input
 type="range"
 min={10}
 max={120}
 step={10}
 value={genDuration}
 onChange={(e) => setGenDuration(parseInt(e.target.value))}
 className="w-full accent-purple-500"
 />
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex justify-end gap-3 pt-3 border-t border-[var(--hair)]">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-mono text-[var(--ink-2)] hover:text-[var(--ink)]"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleGenerateAccompaniment}
 disabled={isGeneratingAccompaniment || (!includeDrums && !includeBass)}
 className="px-5 py-2.5 rounded-[var(--r-m)] bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-[var(--ink)] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
 >
 {isGeneratingAccompaniment ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" />
 Sintetizando Pistas...
 </>
 ) : (
 <>
 <Wand2 className="w-4 h-4" />
 Sintetizar y Añadir al Mezclador
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 );
};
