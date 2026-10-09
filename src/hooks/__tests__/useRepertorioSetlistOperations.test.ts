import { describe, it, expect } from "vitest";
import { useRepertorioSetlistOperations } from "../useRepertorioSetlistOperations";

describe("useRepertorioSetlistOperations Contract", () => {
  it("exporta el hook useRepertorioSetlistOperations correctamente", () => {
    expect(useRepertorioSetlistOperations).toBeDefined();
    expect(typeof useRepertorioSetlistOperations).toBe("function");
  });
});
