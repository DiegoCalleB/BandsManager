/**
 * Renderiza un clip vertical con ffmpeg a partir de un vídeo ya descargado.
 * Extraído de `routes/reels.ts` (thin controller, AGENTS.md §5.6): la ruta valida y responde; el
 * plan de filtros vive en `utils/clipFiltros.ts` y aquí solo se ejecuta.
 */
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { planearRenderClip, type OpcionesPlanClip, type PlanFfmpeg } from "../utils/clipFiltros.js";

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

export interface PeticionRender extends Omit<OpcionesPlanClip, "rutaSubtitulos" | "rutaHook" | "duracion"> {
  rutaEntrada: string;
  rutaSalida: string;
  /** Segundo del fichero de entrada donde empieza el corte. */
  inicioEnFichero: number;
  duracion: number;
  /** Contenido ASS ya construido; el servicio lo escribe en `rutaSubtitulos`/`rutaHook` y lo borra después. */
  rutaSubtitulos?: string;
  rutaHook?: string;
}

export async function renderizarClip(p: PeticionRender): Promise<PlanFfmpeg> {
  const plan = planearRenderClip(p);

  await new Promise<void>((resolve, reject) => {
    // Seek híbrido: un salto rápido de entrada hasta 5 s antes del corte (barato, salta al
    // keyframe) y el resto como seek de salida (exacto al fotograma). Con solo el seek de
    // salida, un corte del minuto 12 obligaba a decodificar 12 minutos de vídeo.
    const saltoEntrada = Math.max(0, p.inicioEnFichero - 5);
    const ajusteSalida = p.inicioEnFichero - saltoEntrada;

    const comando = ffmpeg(p.rutaEntrada);
    if (saltoEntrada > 0) comando.seekInput(saltoEntrada);
    if (ajusteSalida > 0) comando.setStartTime(ajusteSalida);
    comando.setDuration(p.duracion);

    if (plan.filtroComplejo.length) comando.complexFilter(plan.filtroComplejo);

    comando
      .outputOptions([...plan.mapas.flatMap((m) => m.split(" ")), ...plan.opcionesSalida.flatMap((o) => o.split(" "))])
      .output(p.rutaSalida)
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .run();
  });

  if (!fs.existsSync(p.rutaSalida) || fs.statSync(p.rutaSalida).size === 0) {
    throw new Error("ffmpeg no generó ningún archivo de salida.");
  }
  return plan;
}
