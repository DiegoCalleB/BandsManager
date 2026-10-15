import { beforeEach, describe, expect, it, vi } from "vitest";

const urlDeAudioDirecta = vi.hoisted(() => vi.fn());
const urlDeVideoDirecta = vi.hoisted(() => vi.fn());
const analizarEnergiaAudio = vi.hoisted(() => vi.fn());
const detectarCambiosDePlano = vi.hoisted(() => vi.fn());
vi.mock("../../utils/youtubeSource.js", () => ({ urlDeAudioDirecta, urlDeVideoDirecta }));
vi.mock("../../utils/audioEnergy.js", async (orig) => ({ ...(await orig<typeof import("../../utils/audioEnergy.js")>()), analizarEnergiaAudio }));
vi.mock("../../utils/viralSignals.js", async (orig) => ({ ...(await orig<typeof import("../../utils/viralSignals.js")>()), detectarCambiosDePlano }));

const { medirSenalesDelVideo } = await import("../senalesVideo.js");
const curva = Array.from({ length: 120 }, (_, t) => ({ t, db: t >= 60 && t < 90 ? -10 : -30 }));
const entrada = { videoId: "8Jdw41lYdak", objetivoClip: 30, tipoContenido: "concierto" as const };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("medirSenalesDelVideo", () => {
  it("sin URL de audio devuelve señales vacías, sin lanzar", async () => {
    urlDeAudioDirecta.mockResolvedValue(null);
    expect(await medirSenalesDelVideo(entrada)).toEqual({ ventanasEnergia: [], ventanasVirales: [], cambiosDePlano: [] });
  });

  it("un fallo al medir no tumba el análisis", async () => {
    urlDeAudioDirecta.mockRejectedValue(new Error("antibot"));
    expect(await medirSenalesDelVideo(entrada)).toEqual({ ventanasEnergia: [], ventanasVirales: [], cambiosDePlano: [] });
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
});
