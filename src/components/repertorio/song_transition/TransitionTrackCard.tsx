/**
 * Tarjeta de una pista: tono, BPM, energía, CUE detectados, fuente de audio y vúmetro.
 */
import { Check, Radio, Scissors, Upload } from "lucide-react";
import { STUDIO_SAMPLE_TRACKS } from "../../../utils/transitionAudioEngine";
import { Select } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useSongTransition } from "./SongTransitionContext";
import { formatSec } from "./transitionFormat";
import type { Pista } from "./types";
import { useFormatoTono } from "../../../hooks/useNotacion";

// Clases literales por pista (Tailwind solo genera las que aparecen enteras en el código).
// A acaba (color del módulo), B entra (en curso), según la gramática de color de Espectro.
const ESTILO = {
  A: {
    punto: "bg-[var(--acc)]",
    etiqueta: "Anterior",
    cueCaja: "bg-[var(--acc)]/10",
    cueTexto: "text-[var(--acc)]/70",
    tijera: "text-[var(--acc)]",
    guardar: "bg-[var(--acc)]/20 hover:bg-[var(--acc)]/40",
    vumetro: "bg-[var(--acc)]",
  },
  B: {
    punto: "bg-[var(--ok)]",
    etiqueta: "Siguiente",
    cueCaja: "bg-[var(--ok)]/10",
    cueTexto: "text-[var(--ink-2)]",
    tijera: "text-[var(--ok)]",
    guardar: "bg-[var(--ok)]/20 hover:bg-[var(--ok)]/40",
    vumetro: "bg-[var(--ok)]",
  },
} as const;

/**
 * Tarjeta de la pista A (tema que acaba) o B (tema que entra).
 * @param props.track Pista que pinta.
 */
export function TransitionTrackCard({ track }: { track: Pista }) {
  const fmtTono = useFormatoTono();
  const ctx = useSongTransition();
  const esA = track === "A";
  const song = esA ? ctx.songA : ctx.songB;
  const item = esA ? ctx.itemA : ctx.itemB;
  const index = esA ? ctx.indexA : ctx.indexB;
  const fileInputRef = esA ? ctx.fileInputRefA : ctx.fileInputRefB;
  const isPlaying = esA ? ctx.currentGains.isPlayingA : ctx.currentGains.isPlayingB;
  const cues = ctx.cueAnalysis[track];
  const energy = ctx.energyInfo[track];
  const sourceType = ctx.audioSourceType[track];
  const saved = ctx.savedCueSuccess[track];
  const estilo = ESTILO[track];

  // A muestra su salida (aplausos y silencio final); B su entrada (aplausos y silencio inicial).
  const silencio = cues ? (esA ? cues.outroSilenceSec : cues.introSilenceSec) : 0;
  const aplausos = cues ? (esA ? cues.hasApplauseOutro : cues.hasApplauseIntro) : false;
  const cueGuardado = esA ? song.cueOut : song.cueIn;
  const verCue = ctx.autoCueEnabled && cues && (silencio > 0.3 || aplausos || cueGuardado);

  return (
    <div
      className="md:col-span-5 p-2 rounded-[var(--r-m)] transition relative overflow-hidden flex flex-col justify-between"
      style={{
        backgroundColor: "var(--bg)",
        borderColor: isPlaying ? "var(--acc)" : "var(--sunken)",
        boxShadow: isPlaying ? "0 0 10px var(--acc-glow)" : "none",
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-micro font-bold text-[var(--ink-2)] flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-[var(--r-pill)] ${estilo.punto}`} />
            #{index + 1} {estilo.etiqueta}
          </span>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.2 rounded bg-[var(--sunken)] text-[var(--acc-ink)] font-sans text-micro font-semibold">
              <ShowIcon inline emoji="🎼" /> {fmtTono(item?.tonalidadDeseada || song.tonalidad) || "Sin tono"}
            </span>
            {song.bpm && (
              <span className="px-1.5 py-0.2 rounded bg-[var(--sunken)] text-[var(--ink-2)] font-sans text-micro font-semibold">
                <ShowIcon inline emoji="🥁" />{song.bpm} BPM
              </span>
            )}
            <span
              className="text-micro font-sans font-bold px-1.5 py-0.2 rounded-[var(--r-pill)]"
              style={{
                backgroundColor: `${energy.hexColor}20`,
                borderColor: `${energy.hexColor}50`,
                color: energy.hexColor,
              }}
            >
              <ShowIcon inline emoji={energy.icon} /> {Math.round((song.energia ?? 10) / 2)}/10
            </span>
          </div>
        </div>

        <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate mb-1">{song.titulo}</h3>

        {verCue && cues && (
          <div className={`flex items-center justify-between gap-1 mb-1 px-1.5 py-0.5 rounded ${estilo.cueCaja} text-micro`}>
            <span className={`${estilo.cueTexto} font-sans flex items-center gap-1 truncate`}>
              <Scissors className={`w-2.5 h-2.5 ${estilo.tijera} shrink-0`} />
              {esA ? `CUE Out: ${formatSec(cues.cueOut)}` : `CUE In: ${formatSec(cues.cueIn)}`}
              {aplausos && (
                <span className="text-[var(--ink)]">
                  <ShowIcon inline emoji="👏" />
                  {esA ? "Aplausos fin" : "Aplausos inicio"}
                </span>
              )}
              {silencio > 0.3 && (
                <span className="text-[var(--ink-2)]">
                  ({esA ? "-" : "+"}
                  {silencio.toFixed(1)}s)
                </span>
              )}
            </span>
            {ctx.onUpdateSong && (
              <button
                type="button"
                onClick={() => ctx.handleSaveCuesForSong(track)}
                className={`text-micro font-bold px-1.5 py-0.2 rounded ${estilo.guardar} text-[var(--ink)] transition cursor-pointer flex items-center gap-0.5 shrink-0`}
                title="Guardar punto CUE de recorte permanentemente en el repertorio"
              >
                {saved ? <Check className="w-2.5 h-2.5 text-[var(--ok)]" /> : null}
                <span>{saved ? "Guardado" : "Guardar CUE"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pt-1800/80 space-y-1">
        <div className="flex items-center justify-between text-micro">
          <div className="flex items-center gap-1">
            {sourceType === "maqueta" && (
              <span className="text-[var(--ok)] font-semibold flex items-center gap-1">
                <Radio className="w-3 h-3" />
                Maqueta
              </span>
            )}
            {sourceType === "custom" && (
              <span className="text-[var(--ink-2)] font-semibold flex items-center gap-1 truncate max-w-[130px]">
                <Upload className="w-3 h-3 shrink-0" />
                {ctx.customFileName[track] || "Local"}
              </span>
            )}
            {sourceType === "sample" && (
              <Select
                size="sm"
                value={ctx.selectedSample[track].id}
                onChange={(e) => ctx.selectSampleById(track, e.target.value)}
                wrapperClassName="max-w-[160px]"
              >
                {STUDIO_SAMPLE_TRACKS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.bpm} BPM)
                  </option>
                ))}
              </Select>
            )}
            {ctx.isDetectingCues[track] && <span className="text-micro text-[var(--ink-2)]">Analizando…</span>}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-micro text-[var(--ink-2)] hover:text-[var(--ink)] px-1.5 py-0.2 rounded bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 transition cursor-pointer shrink-0"
            title="Subir archivo .mp3/.wav propio para probar"
          >
            <ShowIcon inline emoji="📁" />Subir
          </button>
        </div>

        <div className="w-full bg-[var(--sunken)] h-1 rounded-[var(--r-pill)] overflow-hidden800">
          <div
            className={`h-full ${estilo.vumetro}  transition-ui duration-75`}
            style={{ width: `${Math.min(100, ctx.liveGain[track] * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
