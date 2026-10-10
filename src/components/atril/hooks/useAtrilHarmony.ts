import type { AutoScroll } from "../../../hooks/useAutoScroll";
/**
 * Armonía del cifrado: alineación con la letra, tiempos, acorde activo, funciones y vibración.
 * Extraído de Atril.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,RefObject,SetStateAction,useEffect,useMemo,useRef,useState } from "react";
import { useAcordesDeLaHoja } from "../../../hooks/useAcordesDeLaHoja";
import { AnalisisAcordes,Song } from "../../../types";
import { acordeActivoPorTiempo,acordesDelCifrado,Alineacion,alinearCifradoConAudio,asociarLineasConLetra,lineaDeCadaAcorde,tiemposDeAcordes } from "../../../utils/alineacionAcordes";
import { extractUniqueChords,processChordText } from "../../../utils/chordUtils";
import { EstiloArmonia,gradoVisible,guardarEstiloArmonia,leerEstiloArmonia } from "../../../utils/estiloArmonia";
import { indiceSegmentoEn,normalizarAcorde } from "../../../utils/lineaTiempoAcordes";
import { AnalisisArmonico,analizarArmonia,Funcion,nombreDeNota,usaBemoles } from "../../../utils/teoriaArmonica";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AtrilHarmonyParams {
  cifradoTexto: string;
  transpose: number;
  notation: "ES" | "EN";
  analisisAcordes: AnalisisAcordes;
  seguirEnCifrado: boolean;
  showAnalisisAcordes: boolean;
  audioCurrentTime: number;
  isPlayingAudio: boolean;
  scrollContainerRef: RefObject<HTMLDivElement>;
  activeTab: "chords" | "substitute" | "armonia" | "edit";
  song: Song;
  autoScroll: AutoScroll;
  setCopiedText: Dispatch<SetStateAction<boolean>>;
}

/**
 * Armonía del cifrado: alineación con la letra, tiempos, acorde activo, funciones y vibración.
 * @param params Estado y callbacks del contenedor ({@link AtrilHarmonyParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAtrilHarmony({ cifradoTexto, transpose, notation, analisisAcordes, seguirEnCifrado, showAnalisisAcordes, audioCurrentTime, isPlayingAudio, scrollContainerRef, activeTab, song, autoScroll, setCopiedText }: AtrilHarmonyParams) {
  // Process text according to current transpose and notation
  const processedText = processChordText(cifradoTexto, transpose, notation);

  // Fusión cifrado ↔ audio: cada acorde del texto hereda el tiempo del tramo detectado con el que
  // casa. Se calcula sobre el texto SIN transponer (la transposición es solo de pantalla).
  const alineacion = useMemo<Alineacion | null>(
    () => (analisisAcordes ? alinearCifradoConAudio(cifradoTexto, analisisAcordes.segmentos) : null),
    [cifradoTexto, analisisAcordes],
  );
  const sincronizado = Boolean(alineacion?.usable && seguirEnCifrado && showAnalisisAcordes);

  // Letra con tiempos (Whisper): cada línea del cifrado sabe cuándo suena y la actual se resalta.
  const letraTranscrita = analisisAcordes?.letra?.lineas;
  const lineasConLetra = useMemo(
    () => (letraTranscrita && letraTranscrita.length > 0 ? asociarLineasConLetra(cifradoTexto, letraTranscrita) : null),
    [cifradoTexto, letraTranscrita],
  );

  // Instante de CADA acorde del cifrado. Los que no casan con un cambio del audio (el acorde que se repite
  // al empezar una frase) toman el inicio de su frase: sin esto el resaltado se saltaba esos acordes.
  const tiemposAcordes = useMemo(() => {
    if (!alineacion || !analisisAcordes) return [];
    const lineas = lineaDeCadaAcorde(cifradoTexto);
    const porLinea = lineas.map((l) => {
      const k = lineasConLetra?.[l];
      return k !== null && k !== undefined && letraTranscrita?.[k] ? letraTranscrita[k].t0 : null;
    });
    return tiemposDeAcordes(alineacion, analisisAcordes.segmentos, porLinea);
  }, [alineacion, analisisAcordes, cifradoTexto, lineasConLetra, letraTranscrita]);
  const acordeActivo = sincronizado ? acordeActivoPorTiempo(tiemposAcordes, audioCurrentTime) : -1;

  // El acorde que suena ahora, tal como se ve (transpuesto): ilumina su diagrama en el cajón.
  const acordeSonando = useMemo(() => {
    if (acordeActivo < 0 || !isPlayingAudio) return null;
    const visible = acordesDelCifrado(processedText)[acordeActivo];
    const k = normalizarAcorde(visible);
    return k ? extractUniqueChords(processedText).find((c) => normalizarAcorde(c) === k) ?? null : null;
  }, [acordeActivo, isPlayingAudio, processedText]);

  // Al cambiar de pestaña se empieza arriba: el scroll de la anterior dejaba la nueva a medias.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- el ref es estable; solo el cambio de pestaña devuelve el scroll arriba
  useEffect(() => { scrollContainerRef.current?.scrollTo({ top: 0 }); }, [activeTab]);

  // Armonía (grados romanos y funciones): del audio si está analizado (con las correcciones de la banda)
  // y, si no, de los acordes escritos en el cifrado.
  const [estiloArmonia, setEstiloArmonia] = useState<EstiloArmonia>(() => leerEstiloArmonia());
  const cambiarEstiloArmonia = (e: EstiloArmonia) => { setEstiloArmonia(e); guardarEstiloArmonia(e); };
  const armonia = useMemo<AnalisisArmonico | null>(() => {
    const tramos = analisisAcordes
      ? analisisAcordes.segmentos.map((x) => ({ t0: x.t0, t1: x.t1, acorde: x.acorde }))
      : acordesDelCifrado(cifradoTexto).map((a, i) => ({ t0: i, t1: i + 1, acorde: a }));
    return analizarArmonia(tramos, song.tonalidad);
  }, [analisisAcordes, cifradoTexto, song.tonalidad]);
  // Tonalidad tal como se ve (transpuesta y en el idioma elegido) y acordes de la canción por función, para
  // explicar los colores con ejemplos reales.
  const nombreTonalidadVista = armonia
    ? `${nombreDeNota(armonia.tonalidad.tonica + transpose, usaBemoles(armonia.tonalidad, armonia.modo.id), notation)}${armonia.tonalidad.menor ? " menor" : " mayor"}`
    : "";
  const acordesPorFuncion = useMemo(() => {
    const salida: Partial<Record<Funcion, Array<{ nombre: string; grado: string }>>> = {};
    for (const r of armonia?.acordes ?? []) {
      (salida[r.funcion] ??= []).push({ nombre: processChordText(`[${r.acorde}]`, transpose, notation).replace(/[[\]]/g, ""), grado: gradoVisible(r.grado, estiloArmonia) });
    }
    return salida;
  }, [armonia, transpose, notation, estiloArmonia]);
  const funcionesPresentes = useMemo<Funcion[]>(
    () => (armonia ? (Object.keys(armonia.funciones) as Funcion[]).filter((f) => armonia.funciones[f] > 0.005) : []),
    [armonia],
  );

  // Vibración al cambiar de acorde (móvil): se «siente» el cambio sin mirar la pantalla. Opcional y por dispositivo.
  const [vibrarAlCambiar, setVibrarAlCambiar] = useState<boolean>(() => {
    try { return localStorage.getItem("bm_vibrar_acorde") === "1"; } catch { return false; }
  });
  const alternarVibracion = (v: boolean) => {
    setVibrarAlCambiar(v);
    try { localStorage.setItem("bm_vibrar_acorde", v ? "1" : "0"); } catch { /* sin almacenamiento: vale solo esta sesión */ }
    if (v) navigator.vibrate?.(40); // prueba inmediata
  };
  const ultimoAcordeVibrado = useRef(-1);
  useEffect(() => {
    if (acordeActivo === ultimoAcordeVibrado.current) return;
    ultimoAcordeVibrado.current = acordeActivo;
    if (vibrarAlCambiar && isPlayingAudio && acordeActivo >= 0) navigator.vibrate?.(35);
  }, [acordeActivo, vibrarAlCambiar, isPlayingAudio]);
  const letraActiva =
    lineasConLetra && letraTranscrita && seguirEnCifrado && (isPlayingAudio || audioCurrentTime > 0)
      ? indiceSegmentoEn(letraTranscrita, audioCurrentTime)
      : -1;

  // Mantiene a la vista lo que está sonando: la línea de la letra si hay letra con tiempos y, si no,
  // el acorde (con el autoscroll manual apagado, para no pelearse con él).
  useEffect(() => {
    if (!isPlayingAudio || autoScroll.activo) return;
    const objetivo = letraActiva >= 0 ? `letra-linea-${letraActiva}` : acordeActivo >= 0 ? `cifrado-acorde-${acordeActivo}` : null;
    if (objetivo) document.getElementById(objetivo)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [acordeActivo, letraActiva, isPlayingAudio, autoScroll.activo]);
  const { acordes: uniqueChords, contexto: contextoAcordes } = useAcordesDeLaHoja(processedText, armonia?.tonalidad ?? null, transpose);

  // Copy chords to clipboard
  const handleCopyChords = () => {
    navigator.clipboard.writeText(processedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return { handleCopyChords, alineacion, armonia, estiloArmonia, nombreTonalidadVista, vibrarAlCambiar, alternarVibracion, cambiarEstiloArmonia, funcionesPresentes, acordesPorFuncion, processedText, lineasConLetra, letraTranscrita, letraActiva, sincronizado, tiemposAcordes, acordeActivo, uniqueChords, contextoAcordes, acordeSonando };
}
