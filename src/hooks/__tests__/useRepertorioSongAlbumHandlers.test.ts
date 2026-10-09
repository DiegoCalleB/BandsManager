import { describe, it, expect } from "vitest";
import { useRepertorioSongAlbumHandlers } from "../useRepertorioSongAlbumHandlers";

describe("useRepertorioSongAlbumHandlers Contract", () => {
  it("exporta el hook useRepertorioSongAlbumHandlers correctamente", () => {
    expect(useRepertorioSongAlbumHandlers).toBeDefined();
    expect(typeof useRepertorioSongAlbumHandlers).toBe("function");
  });
});
