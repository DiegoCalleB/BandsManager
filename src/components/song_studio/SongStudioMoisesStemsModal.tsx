import React from 'react';
import { Sliders, X, Sparkles, Upload, Info } from 'lucide-react';
import { SongAudioIdea, Song } from '../../types';
import { MoisesSeparationPreset, MOISES_PRESETS_CONFIG } from '../SongStudioModal';
import { Button, IconButton } from '../ui';

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
    <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-2xl w-full p-5 sm:p-6 space-y-5 text-[var(--ink)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--acc)]/30 pb-3">
          <div className="flex items-center gap-2 text-[var(--acc)] font-mono font-bold text-sm">
            <Sliders className="w-5 h-5 text-[var(--acc)]" />
            <span>Iris Espectro — Separador de Pistas con IA</span>
          </div>
          <IconButton
            label="Cerrar"
            size="icon-xs"
            type="button"
            onClick={() => setShowMoisesStemsModal(null)}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="flex items-center gap-2 border-b border-[var(--hair)]/10 pb-2 font-mono text-xs">
          <Button
            variant={moisesTab === 'stems' ? "inverse" : "neutral"}
            size="xs"
            type="button"
            onClick={() => setMoisesTab('stems')}
            className="items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" /> Separar pistas
          </Button>
          <Button
            variant={moisesTab === 'how_it_works' ? "inverse" : "neutral"}
            size="xs"
            type="button"
            onClick={() => setMoisesTab('how_it_works')}
            className="items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5" /> ¿Cómo funciona?
          </Button>
          <Button
            variant={moisesTab === 'upload' ? "inverse" : "neutral"}
            size="xs"
            type="button"
            onClick={() => setMoisesTab('upload')}
            className="items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Subir pistas
          </Button>
        </div>

        {moisesTab === 'stems' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/30 space-y-1">
              <p className="font-bold text-[var(--acc)] font-mono">Pista a procesar: {targetIdea.titulo}</p>
              <p className="text-xs text-[var(--ink-2)] font-sans">
                Aislamiento de voz, batería, bajo e instrumentos utilizando red neuronal en la nube.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[var(--ink-2)] mb-2">
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
                      className={`p-3 rounded-[var(--r-m)] text-left transition-ui cursor-pointer ${
                        moisesPreset === presetKey
                          ? 'bg-[var(--acc)]/20 text-[var(--ink)]'
                          : 'bg-[var(--sunken)]/60 text-[var(--ink-2)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      <p className="font-bold text-[var(--acc)]">{cfg.label}</p>
                      <p className="text-micro text-[var(--ink-2)] mt-0.5">{cfg.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--hair)]/10">
              <Button
                variant="neutral"
                size="sm"
                type="button"
                onClick={() => setShowMoisesStemsModal(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => {
                  if (handlePerformAiStemSeparation && targetIdea) {
                    handlePerformAiStemSeparation(targetIdea, moisesPreset);
                    setShowMoisesStemsModal(null);
                  }
                }}
                className="items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Comenzar separación</span>
              </Button>
            </div>
          </div>
        )}

        {moisesTab === 'how_it_works' && (
          <div className="space-y-3 text-xs text-[var(--ink-2)] leading-relaxed font-sans">
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
          <div className="space-y-3 text-xs text-[var(--ink-2)] leading-relaxed font-sans">
            <p className="font-bold text-[var(--acc)]">Subir stems generados externamente</p>
            <p className="text-xs text-[var(--ink-2)]">
              Si ya separaste las pistas en otro software, sube los archivos de audio aquí para integrarlos directamente en la mezcla.
            </p>
            <input
              type="file"
              accept="audio/*"
              className="w-full bg-[var(--sunken)] rounded-[var(--r-m)] p-2.5 text-[var(--ink-2)] text-xs cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-[var(--r-m)] file:border-0 file:text-xs file:font-bold file:bg-[var(--ok)] file:text-[var(--ink)] hover:file:bg-[var(--ok)]"
            />
          </div>
        )}
      </div>
    </div>
  );
};
