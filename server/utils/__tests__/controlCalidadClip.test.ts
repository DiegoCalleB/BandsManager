import { describe, expect, it } from "vitest";
import { evaluarCalidadClip, parsearMedicionFfmpeg, type MedicionClip } from "../controlCalidadClip.js";

const buena: MedicionClip = {
  ancho: 1080,
  alto: 1920,
  duracion: 15,
  tieneAudio: true,
  lufs: -14.1,
  negros: [],
  congelados: [],
  silencios: []
};
const esperado = { hookPedido: false, hookQuemado: false, volumenNormalizado: true };

describe("evaluarCalidadClip", () => {
  it("un clip limpio se aprueba sin avisos", () => {
    expect(evaluarCalidadClip(buena, esperado)).toEqual({ aprobado: true, bloqueantes: [], avisos: [] });
  });

  it("sin pista de audio bloquea (el MP4 mudo que no da error)", () => {
    const r = evaluarCalidadClip({ ...buena, tieneAudio: false, lufs: null }, esperado);
    expect(r.aprobado).toBe(false);
    expect(r.bloqueantes.map((p) => p.codigo)).toContain("sin_audio");
  });

  it("negro: ≥1 s bloquea, entre 0,5 y 1 s solo avisa", () => {
    expect(evaluarCalidadClip({ ...buena, negros: [{ inicio: 3, duracion: 1.2 }] }, esperado).bloqueantes[0].codigo).toBe("negro");
    const leve = evaluarCalidadClip({ ...buena, negros: [{ inicio: 3, duracion: 0.6 }] }, esperado);
    expect(leve.aprobado).toBe(true);
    expect(leve.avisos[0].codigo).toBe("negro");
  });

  it("imagen congelada: ≥3 s bloquea, 2-3 s avisa", () => {
    expect(evaluarCalidadClip({ ...buena, congelados: [{ inicio: 5, duracion: 3.5 }] }, esperado).aprobado).toBe(false);
    expect(evaluarCalidadClip({ ...buena, congelados: [{ inicio: 5, duracion: 2.2 }] }, esperado).avisos[0].codigo).toBe("congelado");
  });

  it("silencio largo solo avisa (puede ser una pausa dramática real)", () => {
    const r = evaluarCalidadClip({ ...buena, silencios: [{ inicio: 8, duracion: 2 }] }, esperado);
    expect(r.aprobado).toBe(true);
    expect(r.avisos[0]).toMatchObject({ codigo: "silencio" });
    expect(r.avisos[0].mensaje).toContain("0:08");
  });

  it("volumen: >2 LU de desvío bloquea, 1-2 LU avisa, sin normalizar no se juzga", () => {
    expect(evaluarCalidadClip({ ...buena, lufs: -18 }, esperado).bloqueantes[0].codigo).toBe("volumen");
    expect(evaluarCalidadClip({ ...buena, lufs: -15.5 }, esperado).avisos[0].codigo).toBe("volumen");
    expect(evaluarCalidadClip({ ...buena, lufs: -24 }, { ...esperado, volumenNormalizado: false }).aprobado).toBe(true);
  });

  it("formato: tiene que ser 1080x1920 y durar entre 3 y 90 s", () => {
    expect(evaluarCalidadClip({ ...buena, ancho: 1920, alto: 1080 }, esperado).bloqueantes[0].codigo).toBe("formato");
    expect(evaluarCalidadClip({ ...buena, duracion: 2 }, esperado).bloqueantes[0].codigo).toBe("duracion");
    expect(evaluarCalidadClip({ ...buena, duracion: 120 }, esperado).bloqueantes[0].codigo).toBe("duracion");
  });

  it("si se pidió hook y no se quemó, bloquea", () => {
    expect(evaluarCalidadClip(buena, { ...esperado, hookPedido: true, hookQuemado: false }).bloqueantes[0].codigo).toBe("hook");
    expect(evaluarCalidadClip(buena, { ...esperado, hookPedido: true, hookQuemado: true }).aprobado).toBe(true);
  });
});

describe("parsearMedicionFfmpeg", () => {
  const info = `Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'out.mp4':
  Duration: 00:00:11.60, start: 0.000000, bitrate: 1200 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1080x1920 [SAR 1:1 DAR 9:16], 900 kb/s, 30 fps
  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 192 kb/s`;
  const analisis = `[blackdetect @ 0x1] black_start:2.5 black_end:3.7 black_duration:1.2
[freezedetect @ 0x2] lavfi.freezedetect.freeze_start: 5
[freezedetect @ 0x2] lavfi.freezedetect.freeze_duration: 2.5
[freezedetect @ 0x2] lavfi.freezedetect.freeze_end: 7.5
[silencedetect @ 0x3] silence_start: 8.2
[silencedetect @ 0x3] silence_end: 10.4 | silence_duration: 2.2
[Parsed_ebur128_0 @ 0x4] t: 0.1 TARGET:-23 LUFS M: -70.0 S:-120.7 I: -70.0 LUFS LRA: 0.0 LU
[Parsed_ebur128_0 @ 0x4] Summary:

  Integrated loudness:
    I:         -14.2 LUFS
    Threshold: -24.4 LUFS`;

  it("extrae formato, audio, eventos y la sonoridad integrada del resumen (no la primera línea)", () => {
    expect(parsearMedicionFfmpeg(info, analisis)).toEqual({
      ancho: 1080,
      alto: 1920,
      duracion: 11.6,
      tieneAudio: true,
      lufs: -14.2,
      negros: [{ inicio: 2.5, duracion: 1.2 }],
      congelados: [{ inicio: 5, duracion: 2.5 }],
      silencios: [{ inicio: 8.2, duracion: 2.2 }]
    });
  });

  it("un silencio sin cierre dura hasta el final del clip", () => {
    const m = parsearMedicionFfmpeg(info, "[silencedetect @ 0x3] silence_start: 10");
    expect(m.silencios).toEqual([{ inicio: 10, duracion: 1.6 }]);
  });

  it("sin pista de audio", () => {
    const m = parsearMedicionFfmpeg(info.split("\n").slice(0, 3).join("\n"), "");
    expect(m.tieneAudio).toBe(false);
    expect(m.lufs).toBeNull();
  });
});
