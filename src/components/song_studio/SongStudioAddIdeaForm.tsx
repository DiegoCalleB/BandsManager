/**
 * Formulario de nueva idea de audio: fuente (tema base, archivo, micrófono, Drive o IA), pistas de Iris y acompañamiento
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check, Disc, Mic, Music, Upload, Wand2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { DrumPatternStyle, SongAudioIdea } from "../../types";
import { pistasDeCancion } from "../../utils/irisTracks";
import { Button, IconButton, Input, Select, Textarea } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { LiveMicWaveformCanvas } from "./LiveMicWaveformCanvas";
import { useSongStudio } from "./SongStudioContext";
import { SECCIONES_TEMA } from "./studioConstants";

/**
 * Formulario de nueva idea de audio: fuente (tema base, archivo, micrófono, Drive o IA), pistas de Iris y acompañamiento
 * @returns Sección de interfaz.
 */
export function SongStudioAddIdeaForm() {
  const { showAddIdea, setShowAddIdea, ideaTitle, setIdeaTitle, ideaSection, setIdeaSection, ideaUploader, setIdeaUploader, ideaInstrument, setIdeaInstrument, song, nuevaIdeaPistasIris, setNuevaIdeaPistasIris, useSongBaseTrack, setUseSongBaseTrack, selectedSongBaseUrl, setSelectedSongBaseUrl, selectedAudioFile, setSelectedAudioFile, setRecordedAudioUrl, setDriveAudioUrl, isRecording, startRecording, stopRecording, formatTime, recordingTime, activeRecordingStream, studioAudioCtxRef, recordedAudioUrl, driveAudioUrl, setGenAiOnNewIdea, genAiOnNewIdea, newIdeaStyle, setNewIdeaStyle, newIdeaBpm, setNewIdeaBpm, newIdeaKey, setNewIdeaKey, newIdeaIncludeDrums, setNewIdeaIncludeDrums, newIdeaIncludeBass, setNewIdeaIncludeBass, ideaNotes, setIdeaNotes, handleSaveIdea, isUploading } = useSongStudio();
  return (
    <>
      {/* Add New Audio Idea Form */}
      <AnimatePresence>
        {showAddIdea && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-[var(--r-l)] bg-[var(--ok-soft)] space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[var(--ink-2)] font-sans flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[var(--ok)]" /> Aportar idea o arreglo de audio
                </h4>
                <IconButton label="Cerrar" type="button" onClick={() => setShowAddIdea(false)}>
                  <X className="w-4 h-4" />
                </IconButton>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Título de la idea / arreglo *</label>
                  <Input
                    size="sm"
                    type="text"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    placeholder="Ej: Riff Estribillo / Arreglo Vientos / Base Acústica"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Sección del tema *</label>
                  <Select size="sm" aria-label="Sección del tema"
                    value={ideaSection}
                    onChange={(e) => setIdeaSection(e.target.value as SongAudioIdea['seccion'])}
                    wrapperClassName="w-full"
                  >
                    {SECCIONES_TEMA.map((sec) => (
                      <option key={sec.key} value={sec.key} className="bg-[var(--bg)] text-[var(--ink)]">
                        {sec.icon} {sec.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Aportado por (Tu nombre)</label>
                  <Input size="sm" aria-label="Aportado por (Tu nombre)"
                    type="text"
                    value={ideaUploader}
                    onChange={(e) => setIdeaUploader(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Instrumento / rol (Opcional)</label>
                  <Input
                    size="sm"
                    type="text"
                    value={ideaInstrument}
                    onChange={(e) => setIdeaInstrument(e.target.value)}
                    placeholder="Ej: Guitarra, Trompeta, Batería, Voz"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Source Selector */}
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3">
                <span className="text-xs font-sans font-bold text-[var(--ink-2)] block">
                  Fuente de Audio Principal / Base Rítmica:
                </span>

                {/* Pistas de Iris que sonarán al grabar encima de esta idea */}
                {pistasDeCancion(song).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-micro font-sans font-bold text-[var(--ink-2)] block">
                      Pistas de Iris para grabar encima · {nuevaIdeaPistasIris.length}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pistasDeCancion(song).map((st) => {
                        const on = nuevaIdeaPistasIris.includes(st.id);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              setNuevaIdeaPistasIris((prev) => (on ? prev.filter((id) => id !== st.id) : [...prev, st.id]))
                            }
                            className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans cursor-pointer transition-ui ${
                              on ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold' : 'bg-[var(--ink)]/5 text-[var(--ink-2)] hover:bg-[var(--ink)]/10'
                            }`}
                          >
                            {st.nombre || st.instrumento || 'Pista'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5 [&>*]:min-w-0">
                  {/* Option 1: Tema Base Original */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !useSongBaseTrack;
                      setUseSongBaseTrack(next);
                      if (next && !selectedSongBaseUrl) {
                        setSelectedSongBaseUrl(song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || '');
                      }
                    }}
                    className={`p-3 rounded-[var(--r-m)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui text-center ${
                      useSongBaseTrack
                        ? 'bg-[var(--acc-soft)] text-[var(--ink)] ring-1 ring-[var(--acc)]/60'
                        : 'bg-[var(--acc-soft)]/50 text-[var(--acc-ink)] hover:bg-[var(--acc-soft)]'
                    }`}
                  >
                    <Disc className={`w-5 h-5 text-[var(--acc)] ${useSongBaseTrack ? 'animate-spin-slow' : ''}`} />
                    <span className="text-xs font-bold text-center">Tema original</span>
                    <span className="text-micro text-[var(--acc)]/70 text-center font-sans">
                      {useSongBaseTrack ? '✓ Base Cargada' : `Usar "${song.titulo}"`}
                    </span>
                  </button>

                  {/* Option 2: File Upload */}
                  <label className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui">
                    <Upload className="w-5 h-5 text-[var(--ok)]" />
                    <span className="text-xs font-semibold text-[var(--ink)] text-center w-full truncate" title={selectedAudioFile?.name}>
                      {selectedAudioFile ? selectedAudioFile.name : 'Subir Archivo'}
                    </span>
                    <span className="text-micro text-[var(--ink-2)]">MP3, WAV, M4A</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedAudioFile(e.target.files[0]);
                          setRecordedAudioUrl(null);
                          setDriveAudioUrl('');
                        }
                      }}
                    />
                  </label>

                  {/* Mic Recording */}
                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex flex-col items-center justify-center gap-2">
                    {!isRecording ? (
                      <Button
                        variant="danger"
                        size="xs"
                        type="button"
                        onClick={startRecording}
                        className="items-center gap-1.5 w-full justify-center whitespace-nowrap"
                      >
                        <Mic className="w-3.5 h-3.5 shrink-0" /> Grabar micro
                      </Button>
                    ) : (
                      <div className="w-full space-y-2">
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--alert)] hover:bg-[var(--alert)] text-[var(--on-alert)] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <ShowIcon inline emoji="⏹️" />Detener ({formatTime(recordingTime)})
                        </button>
                        <div className="w-full h-11 relative rounded overflow-hidden">
                          <LiveMicWaveformCanvas
                            stream={activeRecordingStream}
                            audioCtxRef={studioAudioCtxRef}
                            isRecording={isRecording}
                            color="#f43f5e"
                            height={44}
                          />
                        </div>
                      </div>
                    )}

                    {recordedAudioUrl && (
                      <span className="text-micro text-[var(--ok)] font-sans font-bold text-center">✓ Grabación lista</span>
                    )}
                  </div>

                  {/* Drive Link */}
                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex flex-col justify-center gap-1">
                    <span className="text-micro font-sans font-bold text-[var(--acc)]/70 flex items-center gap-1 min-w-0">
                      <Music className="w-3 h-3 text-[var(--acc)] shrink-0" /> <span className="truncate">Enlace Google Drive:</span>
                    </span>
                    <Input
                      size="sm"
                      type="text"
                      value={driveAudioUrl}
                      onChange={(e) => {
                        setDriveAudioUrl(e.target.value);
                        setSelectedAudioFile(null);
                        setRecordedAudioUrl(null);
                      }}
                      placeholder="https://drive.google.com/…"
                      className="w-full"
                    />
                  </div>

                  {/* AI Base Generator Card */}
                  <button
                    type="button"
                    onClick={() => setGenAiOnNewIdea(!genAiOnNewIdea)}
                    className={`p-3 rounded-[var(--r-m)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui text-center ${
                      genAiOnNewIdea
                        ? 'bg-[var(--tentative)]/15 text-[var(--tentative)] ring-1 ring-[var(--tentative)]/50'
                        : 'bg-[var(--tentative)]/5 text-[var(--ink)] hover:bg-[var(--tentative)]/10'
                    }`}
                  >
                    <Wand2 className="w-5 h-5 text-[var(--tentative)]" />
                    <span className="text-xs font-bold text-center">Base IA (Batería + bajo)</span>
                    <span className="text-micro text-[var(--tentative)]/80 text-center font-sans">
                      {genAiOnNewIdea ? '✓ Activado' : 'Generar Sintética'}
                    </span>
                  </button>
                </div>

                {/* ORIGINAL SONG BASE TRACK BANNER & SELECTOR */}
                {useSongBaseTrack && (
                  <div className="mt-3 p-3.5 rounded-[var(--r-m)] bg-[var(--acc-soft)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans text-[var(--ink)] animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
                        <Disc className="w-5 h-5 animate-spin-slow" />
                      </div>
                      <div>
                        <span className="font-bold text-[var(--ink)] block text-sm">Pista base creada sobre: "{song.titulo}"</span>
                        <span className="text-micro text-[var(--acc)]/70 block mt-0.5 font-sans">
                          {selectedAudioFile || recordedAudioUrl || driveAudioUrl
                            ? 'Se cargará el tema original como Pista Base de fondo para sonar sincronizado junto a tu idea/grabación.'
                            : 'Se cargará la pista original en la idea para que puedas usar el botón "+ Pista" o "Grabar encima (Mic)" e improvisar sobre el tema.'}
                        </span>
                      </div>
                    </div>

                    {((song.audioIdeas && song.audioIdeas.length > 0) || song.audioPrincipalUrl) && (
                      <div className="flex items-center gap-2 min-w-0 bg-[var(--sunken)] p-2 rounded-[var(--r-m)] w-full sm:w-auto sm:max-w-[60%]">
                        <span className="text-micro text-[var(--acc)] font-bold shrink-0 whitespace-nowrap">Seleccionar Maqueta:</span>
                        <Select
                          size="sm"
                          value={selectedSongBaseUrl}
                          onChange={(e) => setSelectedSongBaseUrl(e.target.value)}
                          wrapperClassName="flex-1 min-w-0"
                        >
                          {song.audioPrincipalUrl && <option value={song.audioPrincipalUrl}>Tema Original ({song.titulo})</option>}
                          {song.audioIdeas?.map((idItem) => (
                            <option key={idItem.id} value={idItem.audioUrl}>
                              Idea: {idItem.titulo} ({idItem.seccion})
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* AI ACCOMPANIMENT GENERATION CONTROLS ON NEW IDEA */}
                {genAiOnNewIdea && (
                  <div className="mt-3 bg-[var(--tentative)]/5 p-3.5 rounded-[var(--r-m)] space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans font-bold text-[var(--tentative)]/80 flex items-center gap-1.5">
                        Ajustes de la base IA (Batería + bajo)
                      </span>
                      <span className="text-micro font-sans text-[var(--ink)] bg-[var(--tentative)]/10 px-2 py-0.5 rounded">
                        {selectedAudioFile || recordedAudioUrl || driveAudioUrl
                          ? 'Se añadirá como Pista 2'
                          : 'Será la Pista Principal'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Estilo Rítmico</label>
                        <Select size="sm" aria-label="Estilo Rítmico"
                          value={newIdeaStyle}
                          onChange={(e) => setNewIdeaStyle(e.target.value as DrumPatternStyle)}
                          wrapperClassName="w-full"
                        >
                          <option value="rock">Rock / pop standard</option>
                          <option value="pop">Pop / Disco 4-on-floor</option>
                          <option value="funk">Funk Syncopated</option>
                          <option value="reggae">Reggae One-Drop</option>
                          <option value="ska">Ska Skank</option>
                          <option value="cumbia">Cumbia Tresillo</option>
                          <option value="punk">Punk Corcheas</option>
                        </Select>
                      </div>

                      <div>
                        <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Tempo (BPM)</label>
                        <Input size="sm" aria-label="Tempo (BPM)"
                          type="number"
                          value={newIdeaBpm}
                          onChange={(e) => setNewIdeaBpm(parseInt(e.target.value) || 120)}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Tonalidad base</label>
                        <Input
                          size="sm"
                          type="text"
                          value={newIdeaKey}
                          onChange={(e) => setNewIdeaKey(e.target.value)}
                          className="w-full"
                          placeholder="Do, Re, Mi…"
                        />
                      </div>

                      <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-[var(--ink-2)] pt-1">
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newIdeaIncludeDrums}
                              onChange={(e) => setNewIdeaIncludeDrums(e.target.checked)}
                              className="accent-purple-500"
                            />
                            <span><ShowIcon inline emoji="🥁" />Batería Synth</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newIdeaIncludeBass}
                              onChange={(e) => setNewIdeaIncludeBass(e.target.checked)}
                              className="accent-purple-500"
                            />
                            <span><ShowIcon inline emoji="🎸" />Bajo</span>
                          </label>
                        </div>

                        <span className="text-micro text-[var(--tentative)]/80 italic">
                          <ShowIcon inline emoji="⚡" />Se sintetizará un bucle rítmico automático al guardar la idea.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Notas o explicación para el grupo</label>
                <Textarea
                  value={ideaNotes}
                  onChange={(e) => setIdeaNotes(e.target.value)}
                  placeholder="Explica qué has grabado o la propuesta…"
                  rows={2}
                  className="w-full"
                />
              </div>

              {/* Status Indicator of Primary Audio Track */}
              <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-wrap items-center justify-between gap-2 font-sans text-xs text-[var(--ink-2)]">
                <span className="font-bold flex items-center gap-1.5 text-[var(--tentative)]/80">
                  <Disc className="w-4 h-4 text-[var(--tentative)]" /> Pista 1 de la Idea:
                </span>
                <div>
                  {selectedAudioFile ? (
                    <span className="text-[var(--ok)] font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Archivo: {selectedAudioFile.name}
                    </span>
                  ) : isRecording ? (
                    <span className="text-[var(--alert)] font-bold flex items-center gap-1">
                      <Mic className="w-4 h-4" /> Grabando micro ({Math.floor(recordingTime / 60)}:
                      {String(recordingTime % 60).padStart(2, '0')})…
                    </span>
                  ) : recordedAudioUrl ? (
                    <span className="text-[var(--ok)] font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Grabación de micrófono lista ({recordingTime}s)
                    </span>
                  ) : driveAudioUrl.trim() ? (
                    <span className="text-[var(--acc)] font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Google Drive vinculado
                    </span>
                  ) : useSongBaseTrack && selectedSongBaseUrl ? (
                    <span className="text-[var(--acc)]/70 font-bold flex items-center gap-1">
                      <Disc className="w-4 h-4 text-[var(--acc)] animate-spin-slow" /> Base: Tema Original ({song.titulo})
                    </span>
                  ) : genAiOnNewIdea ? (
                    <span className="text-[var(--tentative)]/80 font-bold flex items-center gap-1">
                      Base IA ({newIdeaStyle.toUpperCase()} - {newIdeaKey})
                    </span>
                  ) : (
                    <span className="text-[var(--acc)]/90 italic text-xs">
                      <ShowIcon inline emoji="⚠️" />Selecciona un archivo, carga el Tema Original, graba con el micro o activa Base IA
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="neutral"
                  size="sm"
                  type="button"
                  onClick={() => setShowAddIdea(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={handleSaveIdea}
                  disabled={isUploading}
                >
                  {isUploading ? 'Guardando en Servidor...' : 'Guardar Idea'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
