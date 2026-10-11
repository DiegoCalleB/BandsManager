/**
 * Cajón para añadir una pista a una idea: grabar con la banda sonando, subir un archivo o cargar la base del tema
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Disc, Headphones, Mic, Radio, ShieldCheck, Square, Upload, X } from "lucide-react";
import { SongAudioIdea } from "../../types";
import { ideasConFondo } from "../../utils/ideaDeAtril";
import { cancionConIdeas, pistasDeCancion } from "../../utils/irisTracks";
import { Button, IconButton, Input } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useSongStudio } from "./SongStudioContext";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface SongStudioOverdubDrawerProps {
  isAddingTrack: boolean;
  idea: SongAudioIdea;
}

/**
 * Cajón para añadir una pista a una idea: grabar con la banda sonando, subir un archivo o cargar la base del tema
 * @param props Estado y callbacks del contenedor ({@link SongStudioOverdubDrawerProps}).
 * @returns Sección de interfaz.
 */
export function SongStudioOverdubDrawer({ isAddingTrack, idea }: SongStudioOverdubDrawerProps) {
  const { setAddingTrackIdeaId, autoLatencyTrimMs, useCleanDSPFilter, setUseCleanDSPFilter, useEchoCancellation, setUseEchoCancellation, setAutoLatencyTrimMs, newTrackName, setNewTrackName, newTrackInstrument, setNewTrackInstrument, song, onUpdateSong, isRecordingTrack, startRecordingTrackOverdub, stopRecordingTrackOverdub, formatTime, recordingTrackTime, isUploading, handleUploadTrackFile, selectedSongBaseUrl, saveNewTrackToIdea } = useSongStudio();
  return (
    <>
      {/* OVERDUB ADD TRACK DRAWER */}
      {isAddingTrack && (
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)]/20 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[var(--ink-2)]" />
              Añadir nueva pista (overdub / superponer audio)
            </span>
            <IconButton
              label="Cerrar"
              type="button"
              onClick={() => setAddingTrackIdeaId(null)}
            >
              <X className="w-3.5 h-3.5" />
            </IconButton>
          </div>

          <p className="px-1 text-micro font-sans text-[var(--ink-2)] flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 shrink-0" />
            Mejor con auriculares, así la mezcla no se cuela por el micro.
          </p>

          <details className="rounded-[var(--r-s)] bg-[var(--sunken)]">
            <summary className="cursor-pointer select-none px-3 py-2 text-micro font-sans text-[var(--ink-2)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
              Ajustes de grabación
              <span className="text-[var(--ink-3)]">· filtros y latencia ({autoLatencyTrimMs} ms)</span>
            </summary>

            <div className="px-3 pb-3 pt-1">
              <div className="flex flex-wrap items-center gap-3 text-micro font-sans">
                <label className="flex items-center gap-1.5 cursor-pointer text-[var(--ink-2)] hover:text-[var(--ink)]">
                  <input
                    type="checkbox"
                    checked={useCleanDSPFilter}
                    onChange={(e) => setUseCleanDSPFilter(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                  <span>Filtro DSP anti-Zumbido (high-Pass 80Hz + notch)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[var(--ink-2)] hover:text-[var(--ink)]">
                  <input
                    type="checkbox"
                    checked={useEchoCancellation}
                    onChange={(e) => setUseEchoCancellation(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                  <span>Cancelación de Eco</span>
                </label>

                <div className="space-y-1.5 pt-1.5">
                  <div className="flex items-center justify-between text-[var(--acc)]/70 font-bold text-micro flex-wrap gap-1">
                    <span><ShowIcon inline emoji="⚡" />Recorte de Latencia Micro: {autoLatencyTrimMs} ms</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAutoLatencyTrimMs(120)}
                        className={`px-1.5 py-0.5 rounded text-micro font-sans transition-colors ${autoLatencyTrimMs === 120 ? 'bg-[var(--ink)] text-[var(--bg)] font-bold' : 'bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]'}`}
                        title="Recorte estándar para altavoces o auriculares de cable en PC (120ms)"
                      >
                        PC (120ms)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAutoLatencyTrimMs(240)}
                        className={`px-1.5 py-0.5 rounded text-micro font-sans transition-colors ${autoLatencyTrimMs === 240 ? 'bg-[var(--ink)] text-[var(--bg)] font-bold' : 'bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]'}`}
                        title="Recorte para teléfonos móviles y tablets (240ms)"
                      >
                        Móvil (240ms)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAutoLatencyTrimMs(300)}
                        className={`px-1.5 py-0.5 rounded text-micro font-sans transition-colors ${autoLatencyTrimMs === 300 ? 'bg-[var(--ink)] text-[var(--bg)] font-bold' : 'bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]'}`}
                        title="Recorte para auriculares bluetooth tipo airPods o sony (300ms)"
                      >
                        Bluetooth (300ms)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAutoLatencyTrimMs(0)}
                        className={`px-1.5 py-0.5 rounded text-micro font-sans transition-colors ${autoLatencyTrimMs === 0 ? 'bg-[var(--alert)] text-[var(--on-alert)] font-bold' : 'bg-[var(--alert)]/20 text-[var(--ink)]'}`}
                        title="Sin recorte (0ms)"
                      >
                        0ms
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={400}
                    step={10}
                    value={autoLatencyTrimMs}
                    onChange={(e) => setAutoLatencyTrimMs(Number(e.target.value))}
                    className="w-full h-1.5 bg-[var(--surface)] rounded-[var(--r-s)] appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>
            </div>
          </details>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Nombre de la pista *</label>
              <Input
                size="sm"
                type="text"
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                placeholder="Ej: Voz Segunda / Solo Guitarra / Batería"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Instrumento (Opcional)</label>
              <Input
                size="sm"
                type="text"
                value={newTrackInstrument}
                onChange={(e) => setNewTrackInstrument(e.target.value)}
                placeholder="Ej: Voz, Guitarra, Bajo, Teclado"
                className="w-full"
              />
            </div>
          </div>

          {(() => {
            const pistasIris = pistasDeCancion(song);
            if (pistasIris.length === 0) return null;
            const elegidas = idea.sobrePistas ?? [];
            const alternar = (id: string) =>
              onUpdateSong(cancionConIdeas(song, ideasConFondo(
                song.audioIdeas || [],
                idea.id,
                elegidas.includes(id) ? elegidas.filter((x) => x !== id) : [...elegidas, id],
              )));
            return (
              <div className="space-y-1.5">
                <label className="text-micro font-sans text-[var(--ink-2)] block">
                  Pistas de Iris para grabar encima{elegidas.length > 0 ? ` · ${elegidas.length}` : ''}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {pistasIris.map((st) => {
                    const on = elegidas.includes(st.id);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        aria-pressed={on}
                        disabled={isRecordingTrack}
                        onClick={() => alternar(st.id)}
                        className={`px-3 py-1 rounded-[var(--r-pill)] text-xs font-sans transition-ui cursor-pointer disabled:opacity-50 ${
                          on ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold' : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {st.nombre || st.instrumento || 'Pista'}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Option 1: Live Mic Recording while backing tracks play */}
            <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-col items-center justify-center gap-2">
              {!isRecordingTrack ? (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => startRecordingTrackOverdub(idea)}
                  className="items-center gap-2"
                >
                  <Mic className="w-4 h-4" /> Grabar encima (Mic)
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  onClick={stopRecordingTrackOverdub}
                  className="items-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Detener ({formatTime(recordingTrackTime)})</span>
                </Button>
              )}
            </div>

            {/* Option 2: Upload audio file */}
            <label
              className={`p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Upload className={`w-5 h-5 text-[var(--ink-2)] ${isUploading ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-semibold text-[var(--ink)]">
                {isUploading ? 'Subiendo pista...' : 'Subir Archivo de Pista'}
              </span>
              <span className="text-micro text-[var(--ink-2)]">MP3, WAV, M4A, WEBM, OGG</span>
              <input
                type="file"
                accept="audio/*"
                disabled={isUploading}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    e.target.value = '';
                    handleUploadTrackFile(idea, file);
                  }
                }}
              />
            </label>

            {/* Option 3: Load Original Song Track as Backing Track */}
            {selectedSongBaseUrl && (
              <button
                type="button"
                onClick={() => {
                  saveNewTrackToIdea(idea, selectedSongBaseUrl, `🎵 Base: ${song.titulo} (Original)`, 'Tema Base');
                  setAddingTrackIdeaId(null);
                }}
                className="p-3 rounded-[var(--r-m)] bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui text-[var(--ink)] active:scale-[0.97]"
                title={`Importar la pista base del tema "${song.titulo}" directamente a esta mezcla multipista`}
              >
                <Disc className="w-5 h-5 text-[var(--acc)] animate-spin-slow" />
                <span className="text-xs font-bold text-center">Base tema original</span>
                <span className="text-micro text-[var(--acc)]/70 font-sans text-center">Usar "{song.titulo}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
