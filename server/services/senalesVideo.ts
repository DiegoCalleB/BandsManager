/**
 * Señales medidas sobre el vídeo real: volumen, contraste al arrancar y cambios de plano.
 * Extraído de `routes/reels.ts` sin cambios de comportamiento.
 *
 * Medir solo el volumen encontraba "dónde suena fuerte", que en un concierto entero a todo trapo
 * no distingue nada; por eso se mide también el CONTRASTE al arrancar el corte y el ritmo de
 * montaje. Best-effort y con tope de tiempo: si no se pueden medir, el análisis sigue igual.
 */
import { analizarEnergiaAudio, ventanasConMasEnergia } from "../utils/audioEnergy.js";
import { detectarCambiosDePlano, ventanasMasVirales, type TipoContenido, type VentanaViral } from "../utils/viralSignals.js";
import { urlDeAudioDirecta, urlDeVideoDirecta } from "../utils/youtubeSource.js";
import { canonicalYouTubeUrl } from "./youtubeMeta.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

export interface SenalesVideo {
  ventanasEnergia: ReturnType<typeof ventanasConMasEnergia>;
  ventanasVirales: VentanaViral[];
  cambiosDePlano: number[];
}

export async function medirSenalesDelVideo(p: { videoId: string; objetivoClip: number; tipoContenido: TipoContenido }): Promise<SenalesVideo> {
  const { videoId, objetivoClip, tipoContenido } = p;
  const senales: SenalesVideo = { ventanasEnergia: [], ventanasVirales: [], cambiosDePlano: [] };
  try {
    const urlAudio = await urlDeAudioDirecta(canonicalYouTubeUrl(videoId));
    if (!urlAudio) return senales;
    const curva = await analizarEnergiaAudio(urlAudio, { timeoutMs: 120_000 });

    // La señal visual solo se pide cuando de verdad va a pesar en la puntuación: en un
    // ensayo grabado con el móvil en una silla, contar planos es gastar CPU para nada.
    if (curva.length > 0 && tipoContenido !== "ensayo") {
      // urlDeAudioDirecta/urlDeVideoDirecta, NO canonicalYouTubeUrl: esa es la URL de la
      // página de YouTube, y ffmpeg no puede decodificarla directamente con -i.
      const urlVideo = await urlDeVideoDirecta(canonicalYouTubeUrl(videoId));
      if (urlVideo) senales.cambiosDePlano = await detectarCambiosDePlano(urlVideo, { timeoutMs: 150_000 });
    }

    senales.ventanasVirales = ventanasMasVirales(curva, {
      duracion: objetivoClip,
      tipo: tipoContenido,
      cambiosDePlano: senales.cambiosDePlano,
      maxVentanas: 6
    });
    // Se mantiene la lista por energía pura para los cortes de respaldo sin IA.
    senales.ventanasEnergia = ventanasConMasEnergia(curva, { duracion: objetivoClip, maxVentanas: 6 });
    console.log(
      `[Reels] Señales: ${curva.length} puntos de audio, ${senales.cambiosDePlano.length} cambios de plano, ` +
      `${senales.ventanasVirales.length} tramos candidatos (tipo: ${tipoContenido}).`
    );
  } catch (eCapturado) {
    const e = comoErrorCapturado(eCapturado);
    console.log("[Reels] Análisis de señales omitido:", e?.message || e);
  }
  return senales;
}
