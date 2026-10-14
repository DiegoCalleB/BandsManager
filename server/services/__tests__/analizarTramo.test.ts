import { beforeEach, describe, expect, it, vi } from "vitest";

const audio = vi.hoisted(() => ({ curva: vi.fn(), pcm: vi.fn(), onsets: vi.fn(), bpm: vi.fn() }));
vi.mock("../../utils/audioEnergy.js", () => ({ analizarEnergiaAudio: audio.curva }));
vi.mock("../../utils/audioKey.js", () => ({
  extraerPcmMono: audio.pcm,
  detectarOnsetsDesdePcm: audio.onsets,
  detectarBpmDesdeOnsets: audio.bpm,
  SAMPLE_RATE: 11025
}));

const { analizarTramo } = await import("../clipNovedades.js");

/** 120 BPM con pulsos en x.23 / x.73 del fichero; energía plana salvo lo que diga cada test. */
const onsets = Array.from({ length: 80 }, (_, i) => 0.23 + i * 0.5);
const curvaPlana = Array.from({ length: 400 }, (_, i) => ({ t: i / 10, db: -20 }));

beforeEach(() => {
  audio.curva.mockReset().mockResolvedValue(curvaPlana);
  audio.pcm.mockReset().mockResolvedValue(new Float32Array(10));
  audio.onsets.mockReset().mockReturnValue(onsets);
  audio.bpm.mockReset().mockReturnValue(120);
});

describe("analizarTramo", () => {
  it("sin loop ni beat-drop no toca el audio", async () => {
    expect(await analizarTramo("/v.mp4", 2, 20, { loop: false, beats: false })).toEqual({ duracionClip: 20, golpes: [] });
    expect(audio.pcm).not.toHaveBeenCalled();
  });

  it("con loop, el final cae en un pulso", async () => {
    const r = await analizarTramo("/v.mp4", 2, 20, { loop: true, beats: false });
    // Pulsos relativos al clip (inicio 2 s): 0.23, 0.73, … → el final queda en x.23 / x.73.
    const resto = (((r.duracionClip - 0.23) % 0.5) + 0.5) % 0.5;
    expect(Math.min(resto, 0.5 - resto)).toBeLessThan(1e-6);
    expect(Math.abs(r.duracionClip - 20)).toBeLessThanOrEqual(1.75);
    expect(r.golpes).toEqual([]);
  });

  it("beat-drop: un golpe por compás (cada 4 pulsos) dentro del clip", async () => {
    const r = await analizarTramo("/v.mp4", 2, 10, { loop: false, beats: true });
    expect(r.duracionClip).toBe(10);
    expect(r.golpes[0]).toBeCloseTo(0.23, 2);
    expect(r.golpes[1] - r.golpes[0]).toBeCloseTo(2, 5);
    expect(r.golpes.every((t) => t < 10)).toBe(true);
  });

  it("si no se detecta tempo, no hay golpes inventados y el loop se queda con la elección por volumen", async () => {
    audio.bpm.mockReturnValue(null);
    const r = await analizarTramo("/v.mp4", 2, 20, { loop: true, beats: true });
    expect(r.golpes).toEqual([]);
    expect(r.duracionClip).toBe(20); // energía plana: la duración pedida es la que mejor enlaza
  });
});
