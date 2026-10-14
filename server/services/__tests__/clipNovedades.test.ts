import { beforeEach, describe, expect, it, vi } from "vitest";

const orden = vi.hoisted(() => [] as string[]);
const m = vi.hoisted(() => ({
  calidad: vi.fn(),
  subir: vi.fn(),
  borrar: vi.fn(),
  registrar: vi.fn()
}));
vi.mock("../controlCalidad.js", () => ({ controlarCalidadClip: m.calidad }));
vi.mock("../../utils/storage.js", () => ({ uploadToSupabaseIfAvailable: m.subir, rutaAlmacenamientoClip: (b: string, n: string) => `reels/${b}/${n}` }));
vi.mock("../clipArchivos.js", () => ({ borrarSiExiste: m.borrar }));
vi.mock("../../db/reelClips.js", () => ({ dbRegistrarReelClip: m.registrar }));

const { guardarClipRenderizado } = await import("../clipNovedades.js");

const INFORME = { aprobado: true, bloqueantes: [], avisos: [] };
const entrada = {
  bandId: "band-a",
  rutaLocal: "/tmp/clip.mp4",
  nombreFichero: "clip.mp4",
  esperado: { hookPedido: true, hookQuemado: true, volumenNormalizado: true },
  procedencia: {
    sourceUrl: "https://www.youtube.com/watch?v=abcdefghijk",
    canalOrigen: "LosPeregrinos",
    youtubeDeLaBanda: "https://youtube.com/@LosPeregrinos",
    nombreDeLaBanda: "Los Peregrinos",
    declaradoPorLaBanda: false,
    loopPerfecto: true,
    hookText: "Nadie lo vio venir",
    duracionSeg: 11.6
  }
};

beforeEach(() => {
  orden.length = 0;
  m.calidad.mockReset().mockImplementation(async () => { orden.push("medir"); return INFORME; });
  m.subir.mockReset().mockImplementation(async () => { orden.push("subir"); return "https://x.supabase.co/clip.mp4"; });
  m.borrar.mockReset().mockImplementation(async () => { orden.push("borrar"); });
  m.registrar.mockReset().mockResolvedValue(undefined);
});

describe("guardarClipRenderizado", () => {
  it("mide la calidad ANTES de subir y borrar el fichero local", async () => {
    await guardarClipRenderizado(entrada);
    expect(orden).toEqual(["medir", "subir", "borrar"]);
    expect(m.calidad).toHaveBeenCalledWith("/tmp/clip.mp4", entrada.esperado);
  });

  it("registra procedencia, derechos y calidad con la URL permanente", async () => {
    const r = await guardarClipRenderizado(entrada);
    expect(r).toEqual({ clipUrl: "https://x.supabase.co/clip.mp4", guardadoPermanente: true, derechos: "canal_de_la_banda", calidad: INFORME });
    expect(m.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ clip_url: "https://x.supabase.co/clip.mp4", derechos: "canal_de_la_banda", control_calidad: INFORME, loop_perfecto: true, duracion_seg: 11.6 }),
      "band-a"
    );
  });

  it("si la subida falla, sirve el clip local y no lo registra (no se puede autopublicar)", async () => {
    m.subir.mockRejectedValue(new Error("Storage caído"));
    const r = await guardarClipRenderizado(entrada);
    expect(r).toMatchObject({ clipUrl: "/clips/clip.mp4", guardadoPermanente: false, derechos: null });
    expect(m.borrar).not.toHaveBeenCalled();
    expect(m.registrar).not.toHaveBeenCalled();
  });

  it("si el registro falla, el clip sigue siendo válido", async () => {
    m.registrar.mockRejectedValue(new Error("tabla ausente"));
    await expect(guardarClipRenderizado(entrada)).resolves.toMatchObject({ guardadoPermanente: true });
  });
});
