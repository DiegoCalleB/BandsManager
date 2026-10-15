import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { comentariosDelVideo } from "../comentariosYoutube.js";

const CLAVE = process.env.YOUTUBE_API_KEY;
beforeEach(() => {
  process.env.YOUTUBE_API_KEY = "AIzaSyA-clave-larga-de-prueba";
});
afterEach(() => {
  if (CLAVE === undefined) delete process.env.YOUTUBE_API_KEY;
  else process.env.YOUTUBE_API_KEY = CLAVE;
});

const respuesta = (items: unknown[], ok = true, status = 200) => ({ ok, status, json: async () => ({ items }) }) as unknown as Response;
const hilo = (textOriginal: string, likeCount: number) => ({ snippet: { topLevelComment: { snippet: { textOriginal, likeCount } } } });

describe("comentariosDelVideo", () => {
  it("devuelve texto y likes de cada comentario", async () => {
    const f = vi.fn(async () => respuesta([hilo("2:34 🔥", 12), hilo("", 3)]));
    expect(await comentariosDelVideo("8Jdw41lYdak", f as unknown as typeof fetch)).toEqual([{ texto: "2:34 🔥", likes: 12 }]);
  });

  it("pide los más relevantes con la clave y el id codificados", async () => {
    const f = vi.fn(async (..._a: unknown[]) => respuesta([]));
    await comentariosDelVideo("8Jdw41lYdak", f as unknown as typeof fetch);
    const url = String(f.mock.calls[0][0]);
    expect(url).toContain("order=relevance");
    expect(url).toContain("videoId=8Jdw41lYdak");
  });

  it("comentarios desactivados (403) → [] sin lanzar", async () => {
    const f = async () => respuesta([], false, 403);
    expect(await comentariosDelVideo("8Jdw41lYdak", f as unknown as typeof fetch)).toEqual([]);
  });

  it("fallo de red → []", async () => {
    const f = async () => {
      throw new Error("ECONNRESET");
    };
    expect(await comentariosDelVideo("8Jdw41lYdak", f as unknown as typeof fetch)).toEqual([]);
  });

  it("sin clave o con un id raro ni siquiera llama a la red", async () => {
    const f = vi.fn();
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.YT_API_KEY;
    expect(await comentariosDelVideo("8Jdw41lYdak", f as unknown as typeof fetch)).toEqual([]);
    process.env.YOUTUBE_API_KEY = "AIzaSyA-clave-larga-de-prueba";
    expect(await comentariosDelVideo("../../etc", f as unknown as typeof fetch)).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});
