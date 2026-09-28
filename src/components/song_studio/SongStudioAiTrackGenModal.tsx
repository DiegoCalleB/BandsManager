import React, { useState } from "react";
import { Sparkles, X, Wand2, RefreshCw, Music, CheckCircle2, Check } from "lucide-react";
import { SongAudioIdea, Song } from "../../types";

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
  const [aiTrackGenInstrument, setAiTrackGenInstrument] = useState("bajo");
  const [aiTrackGenPrompt, setAiTrackGenPrompt] = useState("");
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
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-gradient-to-b from-zinc-900 via-indigo-950/80 to-zinc-950 border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2.5 text-purple-300 font-mono font-bold text-sm">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            <span>Generador de Pista de Acompañamiento IA</span>
          </div>
          <button
            type="button"
            onClick={() => { setShowAiTrackGenModal(null); setAiTrackGenPreview(null); setAiTrackGenError(null); }}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 space-y-1">
            <p className="font-bold font-mono flex items-center gap-1.5 text-purple-300">
              <Music className="w-4 h-4 text-purple-400" /> Pista base: {idea.titulo}
            </p>
            <p className="text-[11px] text-purple-300/80 leading-relaxed font-sans">
              La IA escuchará esta idea y creará un arreglo instrumental complementario sincronizado en tempo y armonía.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-purple-300 mb-1.5 uppercase tracking-wider">
              1. Instrumento que quieres generar
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              {[
                { id: "bajo", label: "🎸 Bajo eléctrico" },
                { id: "bateria", label: "🥁 Batería / Beat" },
                { id: "teclado", label: "🎹 Teclados / Synthe" },
                { id: "guitarra", label: "🎸 Guitarra solista" },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAiTrackGenInstrument(item.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                    aiTrackGenInstrument === item.id
                      ? "bg-purple-600 text-white border-purple-400 shadow-md"
                      : "bg-black/40 border-neutral-800 text-neutral-300 hover:bg-black/70"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-purple-300 mb-1.5 uppercase tracking-wider">
              2. Indicaciones de estilo / Prompt (Opcional)
            </label>
            <textarea
              value={aiTrackGenPrompt}
              onChange={(e) => setAiTrackGenPrompt(e.target.value)}
              placeholder="Ej: Solo virtuosista y energético con aire rock balkan para dar la máxima potencia al estribillo..."
              className="w-full h-20 bg-black/60 border border-purple-500/40 rounded-xl p-2.5 text-white placeholder-neutral-500 font-sans text-xs focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>

          {aiTrackGenError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-[11px] font-mono">
              ⚠️ {aiTrackGenError}
            </div>
          )}

          {aiTrackGenPreview && (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-emerald-300 font-mono font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> {aiTrackGenPreview.trackName}
              </div>
              <audio controls src={aiTrackGenPreview.audioUrl} className="w-full h-9" onError={(e) => e.preventDefault()} />
              <p className="text-[10px] text-neutral-300 font-sans italic leading-relaxed">{aiTrackGenPreview.arrangementNotes}</p>
              <p className="text-[10px] text-emerald-400/80 font-mono">Escúchala antes de decidir — si no te convence, regenera o prueba otro preset.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-500/20">
          <button
            type="button"
            onClick={() => { setShowAiTrackGenModal(null); setAiTrackGenPreview(null); setAiTrackGenError(null); }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-mono text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
          {aiTrackGenPreview && (
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4" /> Añadir a la mezcla
            </button>
          )}
          <button
            type="button"
            disabled={isGeneratingAiTrack}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {isGeneratingAiTrack ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>{aiTrackGenPreview ? "Regenerar" : "Generar Pista con IA"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
