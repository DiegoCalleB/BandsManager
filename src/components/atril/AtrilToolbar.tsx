/**
 * Barra de controles: transposición, notación, audio, bucle, autoscroll y herramientas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,Copy,RotateCcw } from "lucide-react";
import { ideasConFondo } from "../../utils/ideaDeAtril";
import { cancionConIdeas,metaStemsDeCancion } from "../../utils/irisTracks";
import { ControlAutoscroll } from "../chords/ControlAutoscroll";
import { ControlBucle } from "../chords/ControlBucle";
import { ControlMetronomo } from "../chords/ControlMetronomo";
import { ControlTonoAudio } from "../chords/ControlTonoAudio";
import { ControlVelocidad } from "../chords/ControlVelocidad";
import { ControlTonoDestino } from "../chords/ControlTonoDestino";
import { usaBemoles } from "../../utils/teoriaArmonica";
import { GrabarIdea } from "../chords/GrabarIdea";
import { IrisStudio } from "../chords/IrisStudio";
import { MezclaPistas } from "../chords/MezclaPistas";
import { SelectorEscucha } from "../chords/SelectorEscucha";
import { TomasConFondo } from "../chords/TomasConFondo";
import { Button,IconButton } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useAtril } from "./AtrilContext";

/**
 * Barra de controles: transposición, notación, audio, bucle, autoscroll y herramientas.
 * @returns Sección de interfaz.
 */
export function AtrilToolbar() {
  const { activeTab, audioUrl, handleRestartAudio, formatAudioTime, audioCurrentTime, audioDuration, handleSeekAudio, stems, song, iris, separarConIris, modoEscucha, setModoEscucha, miId, setMiPistaId, velocidad, setVelocidad, transpose, audioSigueTono, setAudioSigueTono, bucle, marcarBucle, limpiarBucle, tomas, tomaActivaId, setTomaActivaId, onUpdateSong, pistasSonando, ajustesPistas, setAjustesPistas, modo, grabacion, guardandoIdea, guardarIdea, setTranspose, autoScroll, metronomo, setMasControles, masControles, setNotation, notation, showChordDiagrams, setShowChordDiagrams, handleCopyChords, copiedText, armonia } = useAtril();
  return (
    <>
      <div className="bg-[var(--surface)]/80 px-4 py-2.5 flex flex-wrap items-center justify-end gap-3 text-xs font-sans shrink-0">
        {/* INTERACTIVE CONTROLS (Only visible on chords tab) */}
        {activeTab === "chords" && (
          <div className="flex flex-wrap items-center gap-3">
            {/* MINI AUDIO PLAYER (REPRODUCTOR DE AUDIO INTEGRADO) */}
            <div className={`${audioUrl ? "flex" : "hidden"} items-center gap-2 bg-[var(--acc)]/10 px-3 py-1 rounded-[var(--r-s)] w-full sm:w-auto`}>
              {audioUrl ? (
                <>
                  <IconButton
                    label="Reiniciar desde el inicio (0:00)"
                    size="icon-xs"
                    type="button"
                    onClick={handleRestartAudio}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </IconButton>

                  <span className="text-xs text-[var(--acc-ink)] font-mono min-w-[32px] text-right font-semibold">
                    {formatAudioTime(audioCurrentTime)}
                  </span>

                  <input
                    type="range"
                    min={0}
                    max={audioDuration || 100}
                    step={0.1}
                    value={audioCurrentTime}
                    onChange={handleSeekAudio}
                    className="flex-1 sm:flex-none sm:w-28 h-1.5 bg-[var(--sunken)] rounded-[var(--r-s)] appearance-none cursor-pointer accent-[var(--acc)]"
                    title="Barra de posición de reproducción"
                  />

                  <span className="text-xs text-[var(--ink-2)] font-mono min-w-[32px]">
                    {formatAudioTime(audioDuration)}
                  </span>
                </>
              ) : null}
            </div>


            {modo === 'Ensayar' && (
              <GrabarIdea
                fase={grabacion.fase}
                segundos={grabacion.segundos}
                toma={grabacion.toma}
                offset={grabacion.offset}
                error={grabacion.error}
                guardando={guardandoIdea}
                disponible={!!audioUrl}
                onEmpezar={() => { void grabacion.empezar(); }}
                onParar={grabacion.parar}
                onOffset={grabacion.setOffset}
                onGuardar={() => { void guardarIdea(); }}
                onDescartar={grabacion.descartar}
              />
            )}

            {/* TRANSPOSITION CONTROL (tras «Más»: el panel de arriba es sitio que le quitamos a la letra) */}
            <div className={`${masControles ? 'flex' : 'hidden'} items-center gap-1 bg-[var(--sunken)] px-2 py-1 rounded-[var(--r-m)]`}>
              <span className="text-xs text-[var(--ink-2)] mr-1">
                Tono:
              </span>
              <button
                type="button"
                onClick={() => setTranspose((prev) => prev - 1)}
                className="px-2 py-0.5 rounded bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)] font-bold transition cursor-pointer"
                title="Bajar 1 semitono"
              >
                -1
              </button>
              <span
                className={`w-8 text-center font-bold ${transpose !== 0 ? "text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
              >
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
              <button
                type="button"
                onClick={() => setTranspose((prev) => prev + 1)}
                className="px-2 py-0.5 rounded bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)] font-bold transition cursor-pointer"
                title="Subir 1 semitono"
              >
                +1
              </button>
              {armonia && (
                <ControlTonoDestino tonica={armonia.tonalidad.tonica} menor={armonia.tonalidad.menor} bemoles={usaBemoles(armonia.tonalidad, armonia.modo.id)} notation={notation} transpose={transpose} onTranspose={setTranspose} />
              )}
              {transpose !== 0 && (
                <IconButton
                  label="Restablecer tono original"
                  size="icon-xs"
                  type="button"
                  onClick={() => setTranspose(0)}
                  className="ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                </IconButton>
              )}
            </div>

            <div className={masControles ? 'contents' : 'hidden'}>
              <ControlAutoscroll auto={autoScroll} />
              <ControlMetronomo metronomo={metronomo} />
            </div>

            {/* La velocidad es lo que más se toca al practicar: siempre a la vista, no tras «Más». */}
            {audioUrl && <ControlVelocidad velocidad={velocidad} onVelocidad={setVelocidad} />}

            <Button variant="neutral" size="xs" type="button" onClick={() => setMasControles((v) => !v)} aria-expanded={masControles}>
              {masControles ? 'Menos' : 'Más'}
            </Button>
            {/* Todo lo demás sigue montado (sus atajos y estados no se pierden) pero oculto hasta pulsar «Más». */}
            <div className={masControles ? 'contents' : 'hidden'}>
            <IrisStudio
              pistas={stems.length}
              motor={metaStemsDeCancion(song)?.motor?.split("(")[0].trim()}
              tieneAudio={!!audioUrl}
              separando={iris.isSeparatingStemsAi}
              onSeparar={separarConIris}
            />
            {stems.length > 1 && (
              <SelectorEscucha modo={modoEscucha} onModo={setModoEscucha} pistas={stems} miId={miId} onMiPista={setMiPistaId} />
            )}
            {audioUrl && (
              <div className="flex flex-wrap items-center gap-2">
                <ControlTonoAudio transpose={transpose} sigue={audioSigueTono} onSigue={setAudioSigueTono} />
                <ControlBucle bucle={bucle} onMarcar={marcarBucle} onLimpiar={limpiarBucle} />
              </div>
            )}
            <TomasConFondo
              tomas={tomas}
              stems={stems}
              activaId={tomaActivaId}
              onActiva={setTomaActivaId}
              onFondo={(ideaId, ids) => onUpdateSong(cancionConIdeas(song, ideasConFondo(song.audioIdeas || [], ideaId, ids)))}
            />
            <MezclaPistas pistas={pistasSonando} ajustes={ajustesPistas} onAjustes={setAjustesPistas} />
            </div>

            <div className={masControles ? 'contents' : 'hidden'}>
            {/* NOTATION TOGGLE (Latino / C-D-E) */}
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={() =>
                setNotation((prev) => (prev === "ES" ? "EN" : "ES"))
              }
              className="items-center gap-1"
              title="Cambiar entre cifrado latino (Do, Re, Mi) e inglés (C, D, E)"
            >
              <span>Cifrado:</span>
              <span className="text-[var(--acc)]">
                {notation === "ES" ? "Do - Re - Mi" : "C - D - E"}
              </span>
            </Button>

            {/* TOGGLE CHORD DIAGRAMS */}
            <Button
              variant={showChordDiagrams ? "inverse" : "neutral"}
              size="xs"
              type="button"
              onClick={() => setShowChordDiagrams(!showChordDiagrams)}
            >
              <ShowIcon inline emoji="🎸" />Diagramas
            </Button>

            {/* COPY BUTTON */}
            <button
              type="button"
              onClick={handleCopyChords}
              className="p-1.5 rounded-[var(--r-pill)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] transition cursor-pointer"
              title="Copiar texto de acordes"
            >
              {copiedText ? (
                <Check className="w-4 h-4 text-[var(--ok)]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
