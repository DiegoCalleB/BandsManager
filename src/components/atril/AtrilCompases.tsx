/**
 * Pestaña de letra y acordes en modo «Compases»: la rejilla de compases del audio con la letra
 * transcrita debajo. Separado de AtrilBody para mantenerlo bajo el límite de AGENTS.md §5.6.
 */
import { useMemo } from "react";
import { processChordText } from "../../utils/chordUtils";
import { analizarCuadricula } from "../../utils/cuadriculaCompases";
import { mensajeCompases } from "../../utils/ajusteCompases";
import { letraPorCompas } from "../../utils/vistaCompases";
import { VistaCompases } from "../chords/VistaCompases";
import { useAtril } from "./AtrilContext";
import { AjusteCompases } from "./AjusteCompases";
import { useAjusteCompases } from "../chords/useVistaAcordes";
import type { VistaAtril } from "../chords/useVistaAcordes";

/**
 * Selector «Cifrado · Compases» de la pestaña de letra y acordes.
 * @returns Sección de interfaz.
 */
export function SelectorVistaAtril({ vista, onVista }: { vista: VistaAtril; onVista: (v: VistaAtril) => void }) {
  const opciones: Array<[VistaAtril, string]> = [["cifrado", "Cifrado"], ["compases", "Compases"]];
  return (
    <div role="group" aria-label="Cómo ver la canción" className="inline-flex gap-1 p-1 rounded-[var(--r-pill)] bg-[var(--sunken)]">
      {opciones.map(([v, etiqueta]) => (
        <button
          key={v}
          type="button"
          aria-pressed={vista === v}
          onClick={() => onVista(v)}
          className={`px-3 py-1 rounded-[var(--r-pill)] text-xs font-bold cursor-pointer transition-ui ${vista === v ? "bg-[var(--acc)] text-[var(--on-acc)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"}`}
        >
          {etiqueta}
        </button>
      ))}
    </div>
  );
}

/**
 * Rejilla de compases de la canción que suena, o por qué no se puede dibujar.
 * @returns Sección de interfaz.
 */
export function AtrilCompases() {
  const { analisisAcordes, song, audioRef, isPlayingAudio, audioCurrentTime, transpose, notation, buscarEnAudio } = useAtril();
  const [ajuste, setAjuste] = useAjusteCompases(String(song.id));
  const { cuadricula, motivo } = useMemo(
    () => (analisisAcordes ? analizarCuadricula(analisisAcordes.segmentos, song.bpm, analisisAcordes.duracionSegundos, analisisAcordes.pulso, ajuste) : { cuadricula: null, motivo: undefined }),
    [analisisAcordes, song.bpm, ajuste],
  );
  const aviso = mensajeCompases(motivo, cuadricula);
  const letras = useMemo(() => (cuadricula ? letraPorCompas(cuadricula, analisisAcordes?.letra?.lineas) : undefined), [cuadricula, analisisAcordes?.letra?.lineas]);
  const nombre = (acorde: string) => processChordText(`[${acorde}]`, transpose, notation).replace(/[[\]]/g, "");

  const ajustes = analisisAcordes && <AjusteCompases cuadricula={cuadricula} ajuste={ajuste} onAjuste={setAjuste} audioRef={audioRef} />;
  if (!cuadricula) {
    return (
      <div className="space-y-3">
        <div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-6 text-center space-y-1.5">
          <p className="font-bold text-[var(--ink)]">Aquí no hay compás que marcar todavía.</p>
          <p className="text-sm text-[var(--ink-2)]">{analisisAcordes ? aviso : "Pulsa «Acordes del audio» y la canción aparecerá compás a compás."}</p>
        </div>
        {ajustes}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {ajustes}
      {aviso && <p className="text-sm text-[var(--ink-2)] bg-[var(--acc-soft)] rounded-[var(--r-m)] px-3 py-2">{aviso}</p>}
      <VistaCompases
        cuadricula={cuadricula}
        letras={letras}
        nombre={nombre}
        audioRef={audioRef}
        isPlaying={isPlayingAudio}
        tiempo={audioCurrentTime}
        onIr={buscarEnAudio}
      />
    </div>
  );
}
