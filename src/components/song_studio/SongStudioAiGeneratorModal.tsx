import React from 'react';
import { Wand2, X, RefreshCw } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { SongAudioIdea, DrumPatternStyle } from '../../types';
import { ShowIcon } from '../ui/ShowIcon';
import { Input, Select } from '../ui';

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
      <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
        <div className="w-full max-w-lg rounded-[var(--r-l)] bg-[var(--surface)] p-6 space-y-5 text-[var(--ink)] my-auto max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc)]/30 text-[var(--ink)] flex items-center justify-center">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Generar base de batería y bajo</h3>
                <p className="text-xs text-[var(--acc)] font-sans">Sintetizador web audio de referencia</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 rounded-[var(--r-m)] bg-[var(--acc)]/30 text-xs text-[var(--ink)] space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              Pista de referencia orientativa
            </p>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Genera una secuencia rítmica sintetizada de bajo y batería para escuchar cómo sonaría tu guitarra o voz con acompañamiento.
              Podrás añadirla como una pista más en el mezclador multipista.
            </p>
          </div>

          <div className="space-y-4">
            {/* BPM & Tonalidad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Tempo (BPM)</label>
                <Input size="sm" aria-label="Tempo (BPM)"
                  type="number"
                  min={60}
                  max={220}
                  value={genBpm}
                  onChange={(e) => setGenBpm(parseInt(e.target.value) || 120)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Tonalidad (Raíz del bajo)</label>
                <Select size="sm" aria-label="Tonalidad (Raíz del bajo)"
                  value={genKey}
                  onChange={(e) => setGenKey(e.target.value)}
                  wrapperClassName="w-full"
                >
                  <option value="Do">Do (C)</option>
                  <option value="Re">Re (D)</option>
                  <option value="Mi">Mi (E)</option>
                  <option value="Fa">Fa (F)</option>
                  <option value="Sol">Sol (G)</option>
                  <option value="La">La (A)</option>
                  <option value="Si">Si (B)</option>
                </Select>
              </div>
            </div>

            {/* Instrument Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-sans text-[var(--ink-2)] block">Instrumentos a incluir:</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-[var(--r-m)] flex items-center gap-2 cursor-pointer transition-ui ${
                    includeDrums ? 'bg-[var(--acc)]/30 text-[var(--ink)]' : 'bg-[var(--sunken)] text-[var(--ink-2)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includeDrums}
                    onChange={(e) => setIncludeDrums(e.target.checked)}
                    className="accent-purple-500"
                  />
                  <span className="text-xs font-bold font-sans"><ShowIcon inline emoji="🥁" />Batería Synth</span>
                </label>

                <label
                  className={`p-3 rounded-[var(--r-m)] flex items-center gap-2 cursor-pointer transition-ui ${
                    includeBass ? 'bg-[var(--acc)]/30 text-[var(--ink)]' : 'bg-[var(--sunken)] text-[var(--ink-2)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includeBass}
                    onChange={(e) => setIncludeBass(e.target.checked)}
                    className="accent-purple-500"
                  />
                  <span className="text-xs font-bold font-sans"><ShowIcon inline emoji="🎸" />Bajo Tónica</span>
                </label>
              </div>
            </div>

            {/* Drum Style Selector */}
            {includeDrums && (
              <div>
                <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Patrón rítmico de batería</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['rock', 'pop', 'funk', 'reggae', 'ska', 'cumbia', 'punk'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setDrumStyle(style)}
                      className={`py-2 px-1 rounded-[var(--r-pill)] text-xs font-sans font-bold transition-ui cursor-pointer ${
                        drumStyle === style
                          ? 'bg-[var(--acc)] text-[var(--on-acc)]'
                          : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
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
              <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Duración del Bucle ({genDuration} segundos)</label>
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
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerateAccompaniment}
              disabled={isGeneratingAccompaniment || (!includeDrums && !includeBass)}
              className="px-5 py-2.5 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 disabled:opacity-50 text-[var(--on-acc)] font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              {isGeneratingAccompaniment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sintetizando pistas…
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
