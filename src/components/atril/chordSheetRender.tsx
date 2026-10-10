/**
 * Render del cifrado con acordes resaltados, alineación con la letra y armonía.
 * Extraído de Atril.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React from "react";
import { Alineacion,esLineaCabecera,esTokenAcorde } from "../../utils/alineacionAcordes";
import { infoDeAcordeVisible } from "../../utils/armoniaVisor";
import {
parseRootNote
} from "../../utils/chordUtils";
import { CLASE_FUNCION,gradoVisible,textoDeAcorde,type EstiloArmonia } from "../../utils/estiloArmonia";
import { explicarAcorde,type AnalisisArmonico } from "../../utils/teoriaArmonica";
import { RelojEnAcorde } from "../chords/RelojEnAcorde";



// RENDER FUNCTION FOR FORMATTED CHORD SHEET WITH HIGHLIGHTED CHORDS
interface SincronizacionCifrado {
  pares: Alineacion["pares"];
  /** Instante (s) de cada acorde del cifrado, en orden de aparición. */
  tiempos: number[];
  activo: number;
  /** Para el reloj de cada acorde: el audio que suena y la duración total. */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  duracion: number;
  onSeek: (segundos: number) => void;
}

interface ArmoniaVisible {
  tonalidad: AnalisisArmonico["tonalidad"];
  transpose: number;
  estilo: EstiloArmonia;
  /** Tonalidad tal como se ve («Mi mayor»), para explicar los acordes. */
  nombreTonalidad: string;
}

interface SincronizacionLetra {
  porLinea: Array<number | null>; // por cada línea del cifrado, la línea de letra transcrita (o null)
  lineas: Array<{ t0: number; t1: number }>;
  activa: number; // línea de letra que suena ahora (-1 ninguna)
  onSeek: (segundos: number) => void;
}

export function renderFormattedChordSheet(text: string, letra?: SincronizacionLetra, sync?: SincronizacionCifrado, armonia?: ArmoniaVisible) {
  if (!text)
    return (
      <span className="text-[var(--ink-2)] italic">
        Sin cifrado todavía. Escríbelo, sube un PDF o imagen, o pulsa «Letra del audio» para transcribirlo de la voz.
      </span>
    );

  const lines = text.split("\n");
  // Orden de aparición de los acordes entre corchetes: debe coincidir con acordesDelCifrado().
  let ordinal = 0;

  // Propiedades de una línea de letra con tiempos: resaltada si suena ahora, y clicable para saltar.
  const propsDeLetra = (idx: number) => {
    const k = letra ? letra.porLinea[idx] : null;
    if (!letra || k === null || k === undefined || !letra.lineas[k]) return {};
    return {
      id: `letra-linea-${k}`,
      onClick: () => letra.onSeek(letra.lineas[k].t0),
      title: "Saltar a esta frase",
      className: `${k === letra.activa ? "bg-[var(--acc-soft)] rounded-[var(--r-s)] ring-1 ring-[var(--acc)]" : "hover:bg-[var(--surface)] rounded-[var(--r-s)]"} cursor-pointer transition-ui py-0.5`,
    };
  };

  return lines.map((line, idx) => {
    // Check if section header like [Intro], [Estribillo], [Solo], etc.
    if (esLineaCabecera(line)) {
      return (
        <div
          key={idx}
          className="text-[var(--acc)] font-bold text-base my-2 pt-2 flex items-center gap-2"
        >
          <span className="px-2.5 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)]">
            {line.trim()}
          </span>
        </div>
      );
    }

    // Check if inline bracket chord format: [Do] Que tiene tu [Sol] veneno
    if (line.includes("[")) {
      const letraProps = propsDeLetra(idx);

      // Un acorde de la línea, listo para pintar (botón si está sincronizado con el audio).
      const nodoAcorde = (chordName: string, key: string) => {
        const k = esTokenAcorde(chordName) ? ordinal++ : -1;
        const par = sync && k >= 0 ? sync.pares[k] : undefined;
        // Armonía: grado y función de este acorde, y cómo se pinta según el estilo elegido.
        const info = armonia && k >= 0 ? infoDeAcordeVisible(chordName, armonia.tonalidad, armonia.transpose) : null;
        const colorear = armonia?.estilo.colorear === "funcion" && info;
        const clasePasiva = colorear ? CLASE_FUNCION[info.funcion] : "text-[var(--acc)] bg-[var(--acc-soft)]";
        const texto = textoDeAcorde(chordName, info && armonia ? gradoVisible(info.grado, armonia.estilo) : undefined, armonia?.estilo.mostrar ?? "nombre");
        const contenido = (
          <>
            {texto.principal}
            {texto.secundario && <sup className="ml-0.5 text-micro font-normal opacity-80">{texto.secundario}</sup>}
          </>
        );
        const funcionTitulo = info && armonia ? ` · ${explicarAcorde(info, chordName, armonia.nombreTonalidad, armonia.estilo.grados)}` : "";
        if (sync && par && sync.tiempos[k] !== undefined) {
          const instante = sync.tiempos[k];
          return (
            <RelojEnAcorde key={key} activo={k === sync.activo} indice={k} tiempos={sync.tiempos} duracionTotal={sync.duracion} audioRef={sync.audioRef}>
            <button
              id={`cifrado-acorde-${k}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sync.onSeek(instante);
              }}
              title={`Saltar a ${Math.floor(instante / 60)}:${String(Math.floor(instante % 60)).padStart(2, "0")}${par.coincide ? "" : " · en el audio suena otro acorde"}${funcionTitulo}`}
              className={`font-bold px-1 rounded text-xs leading-5 cursor-pointer transition-ui ${
                k === sync.activo
                  ? "bg-[var(--surface)] text-[var(--ink)]"
                  : `${clasePasiva} hover:brightness-95`
              } ${par.coincide ? "" : "underline decoration-dashed decoration-2 underline-offset-4"}`}
            >
              {contenido}
            </button>
            </RelojEnAcorde>
          );
        }
        return (
          <span key={key} title={funcionTitulo ? funcionTitulo.slice(3) : undefined} className={`font-bold ${clasePasiva} px-1 rounded mr-0.5 text-xs leading-5`}>
            {contenido}
          </span>
        );
      };

      // Estilo cifrado clásico: el acorde va ENCIMA del texto, sobre la sílaba en la que cambia.
      // Cada palabra es una unidad que no se parte (puede llevar un acorde a mitad: «imagi|nación»);
      // entre palabras hay espacios normales, así que la línea se ajusta sola al ancho.
      return (
        <div key={idx} className="py-0.5" {...letraProps}>
          {line.split(/(\s+)/).map((token, tIdx) => {
            if (token === "" || /^\s+$/.test(token)) return token;
            const piezas: { acorde: React.ReactNode; texto: string }[] = [];
            let pendiente: React.ReactNode = null;
            token.split(/(\[[A-Za-z0-9#/]+\])/g).forEach((parte, pIdx) => {
              if (parte.startsWith("[") && parte.endsWith("]")) {
                if (pendiente) piezas.push({ acorde: pendiente, texto: "" });
                pendiente = nodoAcorde(parte.slice(1, -1), `${tIdx}-${pIdx}`);
              } else if (parte) {
                piezas.push({ acorde: pendiente, texto: parte });
                pendiente = null;
              }
            });
            if (pendiente) piezas.push({ acorde: pendiente, texto: "" });
            return (
              <span key={tIdx} className="inline-block whitespace-nowrap align-bottom">
                {piezas.map((pz, i) => (
                  <span key={i} className="inline-flex flex-col align-bottom">
                    <span className="h-7 leading-7 mr-0.5">{pz.acorde ?? "\u00A0"}</span>
                    <span className="whitespace-pre text-[var(--ink-2)]">{pz.texto || "\u00A0"}</span>
                  </span>
                ))}
              </span>
            );
          })}
        </div>
      );
    }

    // Otherwise check if line contains chords separated by spaces. Usa el mismo validador de
    // acordes (parseRootNote) que la transposición y la lista de diagramas: antes esta línea
    // tenía su propia regex duplicada que solo miraba si el token EMPEZABA por una nota, sin
    // validar el resto ("Get","Fire","Baby" contaban como acordes en letras en inglés).
    const tokens = line.trim().split(/\s+/);
    const chordCount = tokens.filter((t) => parseRootNote(t) !== null).length;
    const isChordLine = chordCount > 0 && chordCount / tokens.length >= 0.7;

    if (isChordLine) {
      return (
        <div
          key={idx}
          className="font-bold text-[var(--acc)] text-sm py-0.5 leading-none select-none"
        >
          {line}
        </div>
      );
    }

    // Standard lyrics line
    return (
      <div key={idx} className="text-[var(--ink-2)] py-0.5" {...propsDeLetra(idx)}>
        {line || "\u00A0"}
      </div>
    );
  });
}
