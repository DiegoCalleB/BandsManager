import React from 'react';
import { Sliders, X, Sparkles, Upload, Info } from 'lucide-react';
import { SongAudioIdea, Song } from '../../types';
import { MoisesSeparationPreset, MOISES_PRESETS_CONFIG } from '../SongStudioModal';

interface SongStudioMoisesStemsModalProps {
  showMoisesStemsModal: SongAudioIdea | null;
  setShowMoisesStemsModal: (val: SongAudioIdea | null) => void;
  moisesTab: 'stems' | 'how_it_works' | 'upload';
  setMoisesTab: (tab: 'stems' | 'how_it_works' | 'upload') => void;
  moisesPreset?: MoisesSeparationPreset;
  setMoisesPreset?: (preset: MoisesSeparationPreset) => void;
  handlePerformAiStemSeparation?: (targetIdea: SongAudioIdea, overrideEngine?: any, stemsToInclude?: string[]) => void;
  song?: Song | null;
  onUpdateSong?: (updatedSong: Song) => void;
}

export const SongStudioMoisesStemsModal: React.FC<SongStudioMoisesStemsModalProps> = ({
  showMoisesStemsModal,
  setShowMoisesStemsModal,
  moisesTab,
  setMoisesTab,
  moisesPreset = '6_stems',
  setMoisesPreset,
  handlePerformAiStemSeparation,
  song,
  onUpdateSong,
}) => {
  if (!showMoisesStemsModal) return null;

  const targetIdea = showMoisesStemsModal;

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--scrim)]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-[var(--acc)]/40 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--acc)]/20 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Iris Espectro — Separador de Pistas con IA</span>
          </div>
          <button
            type="button"
            onClick={() => setShowMoisesStemsModal(null)}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-[var(--hair)]/10 pb-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setMoisesTab('stems')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              moisesTab === 'stems' ? 'bg-amber-500 text-zinc-950 font-black shadow-md' : 'bg-zinc-800 text-neutral-300 hover:bg-zinc-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Separar Pistas
          </button>
          <button
            type="button"
            onClick={() => setMoisesTab('how_it_works')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              moisesTab === 'how_it_works'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'bg-zinc-800 text-neutral-300 hover:bg-zinc-700'
            }`}
          >
            <Info className="w-3.5 h-3.5" /> ¿Cómo funciona?
          </button>
          <button
            type="button"
            onClick={() => setMoisesTab('upload')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              moisesTab === 'upload' ? 'bg-amber-500 text-zinc-950 font-black shadow-md' : 'bg-zinc-800 text-neutral-300 hover:bg-zinc-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Subir Pistas
          </button>
        </div>

        {moisesTab === 'stems' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-[var(--acc)]/30 space-y-1">
              <p className="font-bold text-amber-300 font-mono">Pista a procesar: {targetIdea.titulo}</p>
              <p className="text-[11px] text-neutral-300 font-sans">
                Aislamiento de voz, batería, bajo e instrumentos utilizando red neuronal en la nube.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-neutral-300 mb-2 uppercase tracking-wider">
                Selecciona tipo de separación:
              </label>
              <div className="grid grid-cols-2 gap-2 font-mono">
                {(['2_stems', '4_stems', '6_stems', 'custom'] as MoisesSeparationPreset[]).map((presetKey) => {
                  const cfg = MOISES_PRESETS_CONFIG[presetKey] || { label: presetKey, subtitle: '', badge: '' };
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => setMoisesPreset && setMoisesPreset(presetKey)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        moisesPreset === presetKey
                          ? 'bg-amber-500/20 border-[var(--acc)] text-white shadow-md'
                          : 'bg-zinc-800/60 border-[var(--hair)] text-neutral-300 hover:bg-zinc-800'
                      }`}
                    >
                      <p className="font-bold text-amber-300">{cfg.label}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{cfg.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--hair)]/10">
              <button
                type="button"
                onClick={() => setShowMoisesStemsModal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-neutral-300 font-mono text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (handlePerformAiStemSeparation && targetIdea) {
                    handlePerformAiStemSeparation(targetIdea, moisesPreset);
                    setShowMoisesStemsModal(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-black flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Comenzar Separación</span>
              </button>
            </div>
          </div>
        )}

        {moisesTab === 'how_it_works' && (
          <div className="space-y-3 text-xs text-neutral-300 leading-relaxed font-sans">
            <p>
              <strong>¿Cómo funciona Iris Espectro?</strong>
            </p>
            <p>
              Iris utiliza modelos de inteligencia artificial alojados en GPU dedicadas para analizar el espectro frecuencial de tus
              maquetas y separar cada instrumento en pistas independientes.
            </p>
          </div>
        )}

        {moisesTab === 'upload' && (
          <div className="space-y-3 text-xs text-neutral-300 leading-relaxed font-sans">
            <p className="font-bold text-amber-300">Subir stems generados externamente</p>
            <p className="text-[11px] text-neutral-400">
              Si ya separaste las pistas en otro software, sube los archivos de audio aquí para integrarlos directamente en la mezcla.
            </p>
            <input
              type="file"
              accept="audio/*"
              className="w-full bg-[var(--sunken)] border border-[var(--hair)] rounded-xl p-2.5 text-neutral-300 text-xs cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-500 file:text-zinc-950 hover:file:bg-emerald-400"
            />
          </div>
        )}
      </div>
    </div>
  );
};
