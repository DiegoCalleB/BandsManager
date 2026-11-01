/**
 * Pestaña de letra y acordes en modo «Compases»: la rejilla de compases del audio con la letra
 * transcrita debajo. Separado de AtrilBody para mantenerlo bajo el límite de AGENTS.md §5.6.
 */
import { useMemo, useState } from "react";
import { processChordText } from "../../utils/chordUtils";
import { analizarCuadricula } from "../../utils/cuadriculaCompases";
import { mensajeCompases } from "../../utils/ajusteCompases";
import { moverCambio, moverCambioA, ponerAcordeEnRango } from "../../utils/lineaTiempoAcordes";
import { cambiosHermanos, moverHermanos, movimientoHecho, type Movimiento } from "../../utils/ajusteEnBloque";
import type { SegmentoAcordeAnalizado } from "../../types";
import { filasDeCompases, letraPorCompas } from "../../utils/vistaCompases";
import { VistaCompases } from "../chords/VistaCompases";
import { useAtril } from "./AtrilContext";
import { AjusteCompases } from "./AjusteCompases";
import { AjusteCambioAcorde } from "./AjusteCambioAcorde";
import { EditorAcordeCasilla } from "./EditorAcordeCasilla";
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
  const { analisisAcordes, guardarAjusteCompases, handleCorregirAcordes, song, audioRef, isPlayingAudio, audioCurrentTime, transpose, notation, buscarEnAudio } = useAtril();
  const ajuste = useMemo(() => analisisAcordes?.ajusteCompases ?? {}, [analisisAcordes?.ajusteCompases]);
  const [elegida, setElegida] = useState<{ cancion: string; t0: number } | null>(null);
  const seleccion = elegida?.cancion === String(song.id) ? elegida.t0 : null;
  const { cuadricula, motivo } = useMemo(
    () => (analisisAcordes ? analizarCuadricula(analisisAcordes.segmentos, song.bpm, analisisAcordes.duracionSegundos, analisisAcordes.pulso, ajuste) : { cuadricula: null, motivo: undefined }),
    [analisisAcordes, song.bpm, ajuste],
  );
  const aviso = mensajeCompases(motivo, cuadricula);
  const letras = useMemo(() => (cuadricula ? letraPorCompas(cuadricula, analisisAcordes?.letra?.lineas) : undefined), [cuadricula, analisisAcordes?.letra?.lineas]);
  const nombre = (acorde: string) => processChordText(`[${acorde}]`, transpose, notation).replace(/[[\]]/g, "");

  const casillas = useMemo(() => (cuadricula ? filasDeCompases(cuadricula, cuadricula.compases.length).flatMap((f) => f.compases.flatMap((c) => c.casillas)) : []), [cuadricula]);
  const acordeElegido = seleccion === null ? undefined : casillas.find((k) => k.t0 === seleccion);
  // Último cambio movido y el bloque donde cayó: permite ofrecer el mismo ajuste a sus iguales.
  const [ultimo, setUltimo] = useState<{ cancion: string; mov: Movimiento } | null>(null);
  const bloque = ultimo ? cuadricula?.bloques.find((b) => ultimo.mov.t0 >= b.t0 && ultimo.mov.t0 < b.t1) : undefined;
  const hermanos = useMemo(
    () => (analisisAcordes && ultimo?.cancion === String(song.id) && bloque ? cambiosHermanos(analisisAcordes.segmentos, ultimo.mov, { desde: bloque.t0, hasta: bloque.t1 }, ultimo.mov.t0) : []),
    [analisisAcordes, ultimo, bloque, song.id],
  );
  const aplicarCorreccion = (antes: SegmentoAcordeAnalizado[], despues: SegmentoAcordeAnalizado[]) => {
    handleCorregirAcordes(despues);
    const mov = movimientoHecho(antes, despues);
    setUltimo(mov ? { cancion: String(song.id), mov } : null);
  };
  const moverComoElUltimo = () => {
    if (!analisisAcordes || !ultimo || !bloque) return;
    const { segmentos, movidos } = moverHermanos(analisisAcordes.segmentos, ultimo.mov, { desde: bloque.t0, hasta: bloque.t1 }, ultimo.mov.t0);
    if (movidos > 0) handleCorregirAcordes(segmentos);
    setUltimo(null);
  };
  const moverElegido = (direccion: -1 | 1) => {
    if (!analisisAcordes || seleccion === null) return;
    const tiempos = casillas.map((k) => k.t0);
    const segmentos = moverCambio(analisisAcordes.segmentos, tiempos, seleccion, direccion);
    if (!segmentos) return;
    aplicarCorreccion(analisisAcordes.segmentos, segmentos);
    const actual = casillas.findIndex((k) => k.t0 === seleccion);
    setElegida({ cancion: String(song.id), t0: tiempos[actual + direccion] });
  };

  // Fin del compás de la casilla elegida: el acorde escrito vale hasta ahí, no arrastra los compases siguientes.
  const finDeCompas = useMemo(() => {
    if (!cuadricula || seleccion === null) return undefined;
    const i = cuadricula.compases.findIndex((c) => seleccion >= c.t0 - 1e-6 && seleccion < c.t1 - 1e-6);
    return i < 0 ? undefined : cuadricula.compases[i].t1;
  }, [cuadricula, seleccion]);
  const lugarElegido = useMemo(() => {
    const c = cuadricula?.compases.find((x) => seleccion !== null && seleccion >= x.t0 - 1e-6 && seleccion < x.t1 - 1e-6);
    if (!c || seleccion === null) return "Casilla";
    const tiempo = casillas.findIndex((k) => k.t0 === seleccion) - casillas.findIndex((k) => k.t0 >= c.t0 - 1e-6);
    return `Compás ${c.n}, tiempo ${tiempo + 1}`;
  }, [cuadricula, seleccion, casillas]);
  const ponerAcorde = (texto: string): boolean => {
    if (!analisisAcordes || seleccion === null || finDeCompas === undefined) return false;
    const segmentos = ponerAcordeEnRango(analisisAcordes.segmentos, seleccion, finDeCompas, texto);
    if (!segmentos) return false;
    aplicarCorreccion(analisisAcordes.segmentos, segmentos);
    return true;
  };

  const arrastrarA = (origen: number, destino: number) => {
    if (!analisisAcordes) return;
    const segmentos = moverCambioA(analisisAcordes.segmentos, casillas.map((k) => k.t0), origen, destino);
    if (!segmentos) return;
    aplicarCorreccion(analisisAcordes.segmentos, segmentos);
    setElegida({ cancion: String(song.id), t0: destino });
  };

  const ajustes = analisisAcordes && <AjusteCompases cuadricula={cuadricula} ajuste={ajuste} onAjuste={guardarAjusteCompases} audioRef={audioRef} />;
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
      {acordeElegido && <EditorAcordeCasilla key={seleccion} actual={acordeElegido.acorde === "N" ? "" : nombre(acordeElegido.acorde)} lugar={lugarElegido} onAplicar={ponerAcorde} onCerrar={() => { setElegida(null); setUltimo(null); }} />}
      {acordeElegido?.cambia && <AjusteCambioAcorde acorde={nombre(acordeElegido.acorde)} onMover={moverElegido} hermanos={hermanos.length} onHermanos={moverComoElUltimo} onCerrar={() => { setElegida(null); setUltimo(null); }} />}
      <VistaCompases
        cuadricula={cuadricula}
        letras={letras}
        nombre={nombre}
        audioRef={audioRef}
        isPlaying={isPlayingAudio}
        tiempo={audioCurrentTime}
        onIr={buscarEnAudio}
        seleccion={seleccion}
        onMover={arrastrarA}
        onSeleccion={(t0) => setElegida(t0 === null ? null : { cancion: String(song.id), t0 })}
      />
    </div>
  );
}
