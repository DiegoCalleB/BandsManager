/**
 * Integración con el ffmpeg REAL: se fabrican clips con defectos concretos y se comprueba que el
 * control los detecta. Es la red contra el fallo que motivó la Fase 6: un MP4 sin audio, o con
 * negro al principio, sale de ffmpeg sin ningún error.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import { controlarCalidadClip, medirClip } from "../controlCalidad.js";

const ffmpeg = ffmpegStatic as unknown as string;
const hayFfmpeg = Boolean(ffmpeg) && fs.existsSync(ffmpeg);
let dir = "";
const esperado = { hookPedido: false, hookQuemado: false, volumenNormalizado: true };

function generar(nombre: string, args: string[]): string {
  const salida = path.join(dir, nombre);
  execFileSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...args, salida]);
  return salida;
}

describe.skipIf(!hayFfmpeg)("control de calidad con ffmpeg real", () => {
  let bueno = "", defectuoso = "", mudo = "";

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "calidad-test-"));
    const video = "testsrc2=size=1080x1920:rate=30:duration=6";
    const codif = ["-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest"];
    // Bueno: imagen en movimiento + tono normalizado a -14 LUFS.
    bueno = generar("bueno.mp4", ["-f", "lavfi", "-i", video, "-f", "lavfi", "-i", "sine=frequency=440:duration=6", "-af", "loudnorm=I=-14:TP=-1:LRA=11", ...codif]);
    // Defectuoso: 1,5 s de negro al principio y 2 s de silencio en medio.
    defectuoso = generar("defectuoso.mp4", [
      "-f", "lavfi", "-i", video, "-f", "lavfi", "-i", "sine=frequency=440:duration=6",
      "-vf", "drawbox=enable='lt(t,1.5)':x=0:y=0:w=iw:h=ih:color=black:t=fill",
      "-af", "volume=enable='between(t,2,4)':volume=0,loudnorm=I=-14:TP=-1:LRA=11",
      ...codif
    ]);
    // Mudo: sin pista de audio.
    mudo = generar("mudo.mp4", ["-f", "lavfi", "-i", video, "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p"]);
  }, 120_000);
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("un clip correcto se aprueba y mide 1080x1920, ~6 s y ~-14 LUFS", async () => {
    const m = await medirClip(bueno);
    expect([m.ancho, m.alto, m.tieneAudio]).toEqual([1080, 1920, true]);
    expect(m.duracion).toBeCloseTo(6, 0);
    expect(m.lufs!).toBeGreaterThan(-15.5);
    expect(m.lufs!).toBeLessThan(-12.5);
    const informe = await controlarCalidadClip(bueno, esperado);
    expect(informe?.bloqueantes).toEqual([]);
  }, 60_000);

  it("detecta el negro del principio (bloquea) y el silencio (avisa)", async () => {
    const informe = await controlarCalidadClip(defectuoso, esperado);
    expect(informe?.aprobado).toBe(false);
    expect(informe?.bloqueantes.map((p) => p.codigo)).toContain("negro");
    expect(informe?.avisos.map((p) => p.codigo)).toContain("silencio");
  }, 60_000);

  it("un MP4 sin audio no pasa", async () => {
    const informe = await controlarCalidadClip(mudo, esperado);
    expect(informe?.bloqueantes.map((p) => p.codigo)).toContain("sin_audio");
  }, 60_000);

  it("si el fichero no existe devuelve null (no 'aprobado')", async () => {
    expect(await controlarCalidadClip(path.join(dir, "no-existe.mp4"), esperado)).toBeNull();
  }, 30_000);
});
