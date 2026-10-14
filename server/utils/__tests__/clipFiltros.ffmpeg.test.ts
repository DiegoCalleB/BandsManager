/**
 * Prueba de integración con el ffmpeg REAL (`ffmpeg-static`, el mismo que usa el servidor).
 * Existe porque el plan de filtros pasó los tests de texto y aun así rompía en ffmpeg 7:
 * `xfade` exigía frame rate constante y `acrossfade` no emitía audio. Solo ffmpeg lo detecta.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import { planearRenderClip } from "../clipFiltros.js";
import { buildHookAss } from "../hookRotulo.js";

const ffmpeg = ffmpegStatic as unknown as string;
const hayFfmpeg = Boolean(ffmpeg) && fs.existsSync(ffmpeg);
let dir = "";

function ejecutar(args: string[]): string {
  try {
    return execFileSync(ffmpeg, ["-y", "-hide_banner", "-nostats", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    const err = e as { stderr?: string };
    throw new Error(`ffmpeg falló: ${String(err.stderr).slice(-600)}`, { cause: e });
  }
}

/** Decodifica el fichero con el filtro dado y devuelve lo que ffmpeg escribe por stderr (info, `time=`, medidas). */
function medir(fichero: string, filtro: string): string {
  return spawnSync(ffmpeg, ["-hide_banner", "-i", fichero, ...filtro.split(" "), "-f", "null", "-"], { encoding: "utf8" }).stderr;
}

describe.skipIf(!hayFfmpeg)("render de clip con ffmpeg real", () => {
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "clip-test-"));
    ejecutar(["-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=6", "-f", "lavfi", "-i", "sine=frequency=440:duration=6", "-c:v", "libx264", "-c:a", "aac", "-shortest", path.join(dir, "src.mp4")]);
    fs.writeFileSync(path.join(dir, "hook.ass"), buildHookAss("Nadie esperaba este final")!);
  }, 60_000);
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("hook + volumen + loop: 1080x1920, vídeo y audio de la duración prevista, -14 LUFS", () => {
    const plan = planearRenderClip({ cropMode: "crop", duracion: 6, rutaHook: path.join(dir, "hook.ass"), normalizarVolumen: true, loop: true, calidad: "alta" });
    const salida = path.join(dir, "out.mp4");
    ejecutar(["-i", path.join(dir, "src.mp4"), "-t", "6", "-filter_complex", plan.filtroComplejo.join(";"),
      ...plan.mapas.flatMap((m) => m.split(" ")), ...plan.opcionesSalida.flatMap((o) => o.split(" ")), salida]);

    // ffmpeg-static no trae ffprobe: se decodifica cada pista y se lee hasta dónde llega.
    const segundos = (salidaFfmpeg: string) => {
      const marcas = [...salidaFfmpeg.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)].at(-1);
      return marcas ? Number(marcas[1]) * 3600 + Number(marcas[2]) * 60 + Number(marcas[3]) : NaN;
    };
    const infoVideo = medir(salida, "-map 0:v");
    expect(infoVideo).toMatch(/Video: h264.*1080x1920/);
    expect(segundos(infoVideo)).toBeCloseTo(plan.duracionFinal, 1);
    expect(segundos(medir(salida, "-map 0:a"))).toBeCloseTo(plan.duracionFinal, 1);

    // ebur128 imprime una línea por cada 100 ms; la integrada de verdad es la del resumen final.
    const lufs = [...medir(salida, "-map 0:a -af ebur128").matchAll(/\bI:\s+(-?\d+(?:\.\d+)?) LUFS/g)].at(-1);
    expect(lufs).not.toBeNull();
    expect(Number(lufs![1])).toBeGreaterThan(-15);
    expect(Number(lufs![1])).toBeLessThan(-13);
  }, 90_000);
});
