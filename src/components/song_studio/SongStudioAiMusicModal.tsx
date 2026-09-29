import React, { useState } from "react";
import {
  Wand2,
  X,
  Sparkles,
  RefreshCw,
  Play,
  Download,
  Music,
  Radio,
} from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { Song } from "../../types";

interface SongStudioAiMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  song?: Song;
  onAddGeneratedAudio?: (audioUrl: string, title: string) => void;
}

export const SongStudioAiMusicModal: React.FC<SongStudioAiMusicModalProps> = ({
  isOpen,
  onClose,
  song,
  onAddGeneratedAudio,
}) => {
  const [prompt, setPrompt] = useState(
    song
      ? `Soundtrack or background vibe for song"${song.titulo}" (${song.tonalidad || "C"}, ${song.bpm || 120} BPM)`
      : "Epic energetic rock soundtrack for indie band",
  );
  const [style, setStyle] = useState("rock independiente / alternativo");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(
    null,
  );
  const [generatedLyrics, setGeneratedLyrics] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedAudioUrl(null);
    setGeneratedLyrics("");

    try {
      const res = await fetch("/api/ai-music/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style,
          lyrics:
            song?.notasInternas ||
            song?.titulo ||
            "Bakandeya independent spirit",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al generar la música con IA");
      }

      // Convert base64 audio to Blob URL
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: data.mimeType || "audio/wav",
      });
      const audioUrl = URL.createObjectURL(blob);

      setGeneratedAudioUrl(audioUrl);
      setGeneratedLyrics(data.lyrics || "");
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Error de conexión con el motor de audio Lyria AI",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
        <div className="w-full max-w-xl rounded-[var(--r-l)] bg-[var(--bg)] p-6 space-y-5 text-[var(--ink)] my-auto max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--acc)] flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  Generador AI de Soundtracks & Jingles (Lyria)
                </h3>
                <p className="text-xs text-[var(--acc)]/70 font-sans">
                  Creación de música basada en el estilo y letras de la banda
                </p>
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

          <div className="p-3 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-xs text-[var(--ink)] space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" /> Motor de
              Audio Generativo IA
            </p>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              Genera bandas sonoras originales, jingles corporativos o música de
              fondo para teasers de redes sociales y directos usando el estilo
              musical, ideología y letras de tu banda.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">
                Estilo Musical de la Banda
              </label>
              <input
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Ej: Rock alternativo, post-punk, psicodelia..."
                className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs text-[var(--ink)] focus:outline-none focus:font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">
                Prompt / Descripción del Soundtrack o Jingle
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe la atmósfera, energía, instrumentación o propósito..."
                className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs text-[var(--ink)] focus:outline-none focus:font-sans resize-none leading-relaxed"
              />
            </div>

            {error && (
              <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert)]/40 text-xs text-[var(--alert)] font-sans">
                ⚠️ {error}
              </div>
            )}

            {generatedAudioUrl && (
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--bg)] space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-sans text-[var(--acc)] flex items-center gap-1.5">
                    <Music className="w-4 h-4" /> Soundtrack Generado con Éxito
                  </span>
                  <a
                    href={generatedAudioUrl}
                    download={`soundtrack-${song?.titulo || "band"}.wav`}
                    className="px-3 py-1 bg-[var(--acc)] text-[var(--on-acc)] text-xs font-bold rounded-[var(--r-s)] flex items-center gap-1 hover:bg-[var(--acc)]/60 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar WAV
                  </a>
                </div>

                {generatedAudioUrl && (
                  <audio
                    controls
                    src={generatedAudioUrl}
                    className="w-full h-10"
                    onError={(e) => e.preventDefault()}
                  />
                )}

                {generatedLyrics && (
                  <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)] text-xs font-sans text-[var(--ink-2)] max-h-32 overflow-y-auto whitespace-pre-line">
                    <p className="text-[10px] text-[var(--acc)] font-bold mb-1">
                      Notas / Letra generada:
                    </p>
                    {generatedLyrics}
                  </div>
                )}

                {onAddGeneratedAudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddGeneratedAudio(
                        generatedAudioUrl,
                        `AI Soundtrack: ${prompt.slice(0, 30)}...`,
                      );
                      onClose();
                    }}
                    className="w-full py-2 bg-[var(--acc)]  hover:bg-[var(--acc)] text-[var(--ink)] font-bold text-xs rounded-[var(--r-m)] transition"
                  >
                    + Añadir Soundtrack a la Canción / Estudio
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)]"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-5 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)]  hover:bg-[var(--acc)] disabled:opacity-50 text-[var(--ink)] font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Componiendo Soundtrack IA...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generar Soundtrack IA
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
