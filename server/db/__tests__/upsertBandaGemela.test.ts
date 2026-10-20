import { describe, it, expect, vi, beforeEach } from "vitest";

// Un upsert con el id SIN prefijo (`mi-banda`) no debe crear una fila gemela cuando ya existe
// la canónica (`band-mi-banda`): se reutiliza su band_id y su id.

let existentes: Array<{ id: string; band_id: string }> = [];
let ultimoUpsert: Record<string, unknown> | null = null;

function crearFromMock() {
  let filtro: string | undefined;
  const builder: any = {
    select: () => builder,
    eq: (_col: string, val: string) => {
      filtro = val;
      return builder;
    },
    maybeSingle: async () => ({ data: existentes.find((e) => e.band_id === filtro) || null, error: null }),
    single: async () => ({ data: ultimoUpsert, error: null }),
    upsert: (payload: Record<string, unknown>) => {
      ultimoUpsert = payload;
      return builder;
    },
  };
  return builder;
}

vi.mock("../core.js", () => ({
  getSupabase: () => ({ from: () => crearFromMock() }),
  cleanBandId: (id?: string) => (id || "").trim(),
  normalizePlan: (plan?: string) => plan || "ensayo",
}));

import { dbUpsertRegisteredBand } from "../bands";

describe("dbUpsertRegisteredBand con ids gemelos", () => {
  beforeEach(() => {
    existentes = [];
    ultimoUpsert = null;
  });

  it("un id sin prefijo reutiliza la fila canónica existente", async () => {
    existentes = [{ id: "reg-band-mi-banda", band_id: "band-mi-banda" }];
    await dbUpsertRegisteredBand({ band_id: "mi-banda", nombre_banda: "Mi Banda" });
    expect(ultimoUpsert).toMatchObject({ band_id: "band-mi-banda", id: "reg-band-mi-banda" });
  });

  it("si no existe la canónica, respeta el id pedido", async () => {
    await dbUpsertRegisteredBand({ band_id: "otra-banda", nombre_banda: "Otra" });
    expect(ultimoUpsert).toMatchObject({ band_id: "otra-banda" });
  });

  it("un id ya canónico no se toca", async () => {
    existentes = [{ id: "reg-band-mi-banda", band_id: "band-mi-banda" }];
    await dbUpsertRegisteredBand({ band_id: "band-mi-banda", id: "reg-band-mi-banda" });
    expect(ultimoUpsert).toMatchObject({ band_id: "band-mi-banda", id: "reg-band-mi-banda" });
  });
});
