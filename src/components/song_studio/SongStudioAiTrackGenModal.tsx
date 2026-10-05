import React, { useState } from 'react';
import { X, Wand2, RefreshCw, Music, CheckCircle2, Check } from 'lucide-react';
import { SongAudioIdea, Song } from '../../types';
import { ShowIcon } from '../ui/ShowIcon';
import { Button, IconButton, Textarea } from '../ui';

interface SongStudioAiTrackGenModalProps {
  showAiTrackGenModal: SongAudioIdea | null;
  setShowAiTrackGenModal: (val: SongAudioIdea | null) => void;
  isGeneratingAiTrack?: boolean;
  handleGenerateAiInstrumentTrack?: (idea: SongAudioIdea, instrument: string, prompt: string) => void;
  song?: Song | null;
}

export const SongStudioAiTrackGenModal: React.FC<SongStudioAiTrackGenModalProps> = ({
  showAiTrackGenModal,
  setShowAiTrackGenModal,
  isGeneratingAiTrack = false,
  handleGenerateAiInstrumentTrack,
  song,
}) => {
  const [aiTrackGenInstrument, setAiTrackGenInstrument] = useState('bajo');
  const [aiTrackGenPrompt, setAiTrackGenPrompt] = useState('');
  const [aiTrackGenError, setAiTrackGenError] = useState<string | null>(null);
  const [aiTrackGenPreview, setAiTrackGenPreview] = useState<any | null>(null);

  if (!showAiTrackGenModal) return null;

  const idea = showAiTrackGenModal;

  const handleSubmit = () => {
    if (handleGenerateAiInstrumentTrack && idea) {
      handleGenerateAiInstrumentTrack(idea, aiTrackGenInstrument, aiTrackGenPrompt);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-xl w-full p-6 space-y-5 relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--acc)]/30 pb-3">
          <div className="flex items-center gap-2.5 text-[var(--acc)] font-mono font-bold text-sm">
            <span>Generador de pista de acompañamiento IA</span>
          </div>
          <IconButton
            label="Cerrar"
            size="icon-xs"
            type="button"
            onClick={() => {
              setShowAiTrackGenModal(null);
              setAiTrackGenPreview(null);
              setAiTrackGenError(null);
            }}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/40 text-[var(--ink)] space-y-1">
            <p className="font-bold font-mono flex items-center gap-1.5 text-[var(--acc)]">
              <Music className="w-4 h-4 text-[var(--acc)]" /> Pista base: {idea.titulo}
            </p>
            <p className="text-xs text-[var(--acc)]/80 leading-relaxed font-sans">
              La IA escuchará esta idea y creará un arreglo instrumental complementario sincronizado en tempo y armonía.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[var(--acc)] mb-1.5">
              1. Instrumento que quieres generar
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {[
                { id: 'bajo', label: 'Bajo eléctrico' },
                { id: 'bateria', label: 'Batería / Beat' },
                { id: 'teclado', label: 'Teclados / Synthe' },
                { id: 'guitarra', label: 'Guitarra solista' },
              ].map((item) => (
                <Button
                  variant={aiTrackGenInstrument === item.id ? "inverse" : "neutral"}
                  key={item.id}
                  type="button"
                  onClick={() => setAiTrackGenInstrument(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[var(--acc)] mb-1.5">
              2. Indicaciones de estilo / Prompt (Opcional)
            </label>
            <Textarea
              value={aiTrackGenPrompt}
              onChange={(e) => setAiTrackGenPrompt(e.target.value)}
              placeholder="Ej: Solo virtuosista y energético con aire rock balkan para dar la máxima potencia al estribillo…"
              className="w-full h-20"
            />
          </div>

          {aiTrackGenError && (
            <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert)]/40 text-[var(--ink)] text-xs font-mono">
              <ShowIcon inline emoji="⚠️" />{aiTrackGenError}
            </div>
          )}

          {aiTrackGenPreview && (
            <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--ok)]/30 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-[var(--ok)] font-mono font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> {aiTrackGenPreview.trackName}
              </div>
              <audio controls src={aiTrackGenPreview.audioUrl} className="w-full h-9" onError={(e) => e.preventDefault()} />
              <p className="text-micro text-[var(--ink-2)] font-sans italic leading-relaxed">{aiTrackGenPreview.arrangementNotes}</p>
              <p className="text-micro text-[var(--ok)]/80 font-mono">
                Escúchala antes de decidir — si no te convence, regenera o prueba otro preset.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--hair)]">
          <button
            type="button"
            onClick={() => {
              setShowAiTrackGenModal(null);
              setAiTrackGenPreview(null);
              setAiTrackGenError(null);
            }}
            className="px-4 py-2 rounded-[var(--r-pill)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink-2)] font-mono text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
          {aiTrackGenPreview && (
            <Button
              variant="primary"
              type="button"
              className="items-center gap-2"
            >
              <Check className="w-4 h-4" /> Añadir a la mezcla
            </Button>
          )}
          <Button
            variant="primary"
            type="button"
            disabled={isGeneratingAiTrack}
            onClick={handleSubmit}
            className="items-center gap-2"
          >
            {isGeneratingAiTrack ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando…</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>{aiTrackGenPreview ? 'Regenerar' : 'Generar Pista con IA'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
