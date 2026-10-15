import { beforeEach, describe, expect, it, vi } from "vitest";

const urlDeAudioDirecta = vi.hoisted(() => vi.fn());
const urlDeVideoDirecta = vi.hoisted(() => vi.fn());
const analizarEnergiaAudio = vi.hoisted(() => vi.fn());
const detectarCambiosDePlano = vi.hoisted(() => vi.fn());
const comentariosDelVideo = vi.hoisted(() => vi.fn());
vi.mock("../../utils/youtubeSource.js", () => ({ urlDeAudioDirecta, urlDeVideoDirecta }));
vi.mock("../comentariosYoutube.js", () => ({ comentariosDelVideo }));
vi.mock("../../utils/audioEnergy.js", async (orig) => ({ ...(await orig<typeof import("../../utils/audioEnergy.js")>()), analizarEnergiaAudio }));
vi.mock("../../utils/viralSignals.js", async (orig) => ({ ...(await orig<typeof import("../../utils/viralSignals.js")>()), detectarCambiosDePlano }));

const { medirSenalesDelVideo } = await import("../senalesVideo.js");
const curva = Array.from({ length: 120 }, (_, t) => ({ t, db: t >= 60 && t < 90 ? -10 : -30 }));
const ficha = { esMusica: true as boolean | null, heatmap: [] as { start: number; end: number; valor: number }[], duration: 120 };
const entrada = { videoId: "8Jdw41lYdak", objetivoClip: 30, tipoContenido: "concierto" as const, ficha };
const vacias = { ventanasEnergia: [], ventanasVirales: [], cambiosDePlano: [], publico: { curva: null, nota: "" } };

beforeEach(() => {
  vi.resetAllMocks();
  comentariosDelVideo.mockResolvedValue([]);
});

describe("medirSenalesDelVideo", () => {
  it("sin URL de audio devuelve señales vacías, sin lanzar", async () => {
    urlDeAudioDirecta.mockResolvedValue(null);
    expect(await medirSenalesDelVideo(entrada)).toEqual(vacias);
  });

  it("un fallo al medir no tumba el análisis", async () => {
    urlDeAudioDirecta.mockRejectedValue(new Error("antibot"));
    expect(await medirSenalesDelVideo(entrada)).toEqual(vacias);
  });

  it("mide audio y planos y propone tramos", async () => {
    urlDeAudioDirecta.mockResolvedValue("https://a");
    urlDeVideoDirecta.mockResolvedValue("https://v");
    analizarEnergiaAudio.mockResolvedValue(curva);
    detectarCambiosDePlano.mockResolvedValue([61, 70, 80]);
    const r = await medirSenalesDelVideo(entrada);
    expect(r.cambiosDePlano).toEqual([61, 70, 80]);
    expect(r.ventanasVirales.length).toBeGreaterThan(0);
    expect(r.ventanasEnergia.length).toBeGreaterThan(0);
  });

  it("un ensayo no pide cambios de plano", async () => {
    urlDeAudioDirecta.mockResolvedValue("https://a");
    analizarEnergiaAudio.mockResolvedValue(curva);
    await medirSenalesDelVideo({ ...entrada, tipoContenido: "ensayo" });
    expect(detectarCambiosDePlano).not.toHaveBeenCalled();
  });

  it("en un vídeo de música con heatmap, el tramo que la gente repite sube y queda anotado", async () => {
    urlDeAudioDirecta.mockResolvedValue("https://a");
    urlDeVideoDirecta.mockResolvedValue("https://v");
    analizarEnergiaAudio.mockResolvedValue(Array.from({ length: 120 }, (_, t) => ({ t, db: -30 })));
    detectarCambiosDePlano.mockResolvedValue([]);
    const heatmap = Array.from({ length: 60 }, (_, i) => ({ start: i * 2, end: i * 2 + 2, valor: i >= 35 && i < 50 ? 1 : 0.2 }));
    const r = await medirSenalesDelVideo({ ...entrada, ficha: { ...ficha, heatmap } });
    expect(r.publico.curva?.peso).toBe(0.4);
    expect(r.publico.nota).toMatch(/gráfico de repeticiones/);
    const mejor = [...r.ventanasVirales].sort((a, b) => b.score - a.score)[0];
    expect(mejor.start).toBeGreaterThanOrEqual(65);
    expect(mejor.start).toBeLessThanOrEqual(90);
    expect(mejor.publico).toBeGreaterThan(80);
  });

  it("si no es música no se miran ni comentarios ni heatmap", async () => {
    urlDeAudioDirecta.mockResolvedValue("https://a");
    urlDeVideoDirecta.mockResolvedValue("https://v");
    analizarEnergiaAudio.mockResolvedValue(curva);
    detectarCambiosDePlano.mockResolvedValue([]);
    const r = await medirSenalesDelVideo({ ...entrada, tipoContenido: "otro", ficha: { ...ficha, esMusica: false } });
    expect(r.publico.curva).toBeNull();
    expect(comentariosDelVideo).not.toHaveBeenCalled();
    expect(r.ventanasVirales.every((v) => v.publico === undefined)).toBe(true);
  });
});

describe("medirSenalesDelVideo · desactivado", () => {
  it("sin id de vídeo o con activo=false no toca la red", async () => {
    await medirSenalesDelVideo({ ...entrada, videoId: "" });
    await medirSenalesDelVideo({ ...entrada, activo: false });
    expect(urlDeAudioDirecta).not.toHaveBeenCalled();
  });
});
