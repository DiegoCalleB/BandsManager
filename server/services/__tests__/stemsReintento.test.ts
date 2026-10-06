import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { acquireStemsSeparationLock, getStemsJobStatus, stemsMemoryCache } from "../../db/stemsCache.js";

/** Mini PostgREST en memoria: filtros .eq encadenables, select, update y insert. */
function crearTabla(rows: any[]) {
  const aplicar = (filtros: Array<[string, any]>) => rows.filter(r => filtros.every(([c, v]) => r[c] === v));
  return {
    select: () => {
      const filtros: Array<[string, any]> = [];
      const q: any = {
        eq: (c: string, v: any) => { filtros.push([c, v]); return q; },
        maybeSingle: async () => ({ data: aplicar(filtros)[0] || null, error: null }),
      };
      return q;
    },
    update: (campos: any) => {
      const filtros: Array<[string, any]> = [];
      let devolver = false;
      const q: any = {
        eq: (c: string, v: any) => { filtros.push([c, v]); return q; },
        select: () => { devolver = true; return q; },
        then: (ok: any) => {
          const hit = aplicar(filtros);
          hit.forEach(r => Object.assign(r, campos));
          return Promise.resolve({ data: devolver ? hit : null, error: null }).then(ok);
        },
      };
      return q;
    },
    insert: async (row: any) => {
      if (rows.some(r => r.band_id === row.band_id && r.song_hash === row.song_hash && r.engine === row.engine)) {
        return { error: { code: "23505", message: "duplicate key" } };
      }
      rows.push({ ...row });
      return { error: null };
    },
  };
}

describe("Reintento de separación de stems", () => {
  let rows: any[];
  beforeEach(async () => {
    stemsMemoryCache.clear();
    rows = [];
    vi.spyOn(await import("../../db/core.js"), "getSupabase").mockImplementation(
      () => ({ from: () => crearTabla(rows) }) as any
    );
  });

  const base = { band_id: "b1", song_hash: "h1", engine: "fal", stems_map: {} };

  it("un job 'failed' se puede reintentar (antes devolvía in_progress_by_other_instance para siempre)", async () => {
    rows.push({ ...base, status: "failed", degraded_reason: "error viejo" });
    const r = await acquireStemsSeparationLock("b1", "h1", "fal", "inst_A");
    expect(r.acquired).toBe(true);
    expect(rows[0].status).toBe("pending");
    expect(rows[0].locked_by).toBe("inst_A");
    expect(rows[0].degraded_reason).toBeNull();
  });

  it("tras reclamar un 'failed', una segunda instancia no lo reclama a la vez", async () => {
    rows.push({ ...base, status: "failed" });
    const a = await acquireStemsSeparationLock("b1", "h1", "fal", "inst_A");
    stemsMemoryCache.clear();
    const b = await acquireStemsSeparationLock("b1", "h1", "fal", "inst_B");
    expect(a.acquired).toBe(true);
    expect(b.acquired).toBe(false);
  });

  it("un pending caducado se informa como fallo recuperable, no como 'processing' eterno", async () => {
    rows.push({ ...base, status: "pending", locked_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() });
    const s = await getStemsJobStatus("b1", "h1", "fal");
    expect(s.state).toBe("failed");
  });

  it("un pending reciente sigue siendo pending", async () => {
    rows.push({ ...base, status: "pending", locked_at: new Date().toISOString() });
    const s = await getStemsJobStatus("b1", "h1", "fal");
    expect(s.state).toBe("pending");
  });
});

describe("Ruta /ai-stem-separation: garantías estáticas", () => {
  const ruta = fs.readFileSync(path.join(__dirname, "..", "..", "routes", "ai_music.ts"), "utf-8");
  const modal = fs.readFileSync(path.join(__dirname, "..", "..", "..", "src", "components", "song_studio", "SongStudioMoisesStemsModal.tsx"), "utf-8");

  it("nunca escribe tokens del cliente en process.env", () => {
    expect(ruta).not.toMatch(/process\.env\.REPLICATE_API_TOKEN\s*=/);
  });

  it("marca el job como fallido cuando ningún motor devuelve stems", () => {
    expect(ruta).toContain("errorType: 'empty_result'");
  });

  it("el modal Iris no pasa el preset como motor", () => {
    expect(modal).not.toMatch(/handlePerformAiStemSeparation\(targetIdea,\s*moisesPreset\)/);
  });

  it("el modal Iris no ofrece una pestaña de subida que no hace nada", () => {
    expect(modal).not.toContain('type="file"');
  });
});
