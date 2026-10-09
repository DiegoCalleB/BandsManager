import { describe, it, expect } from "vitest";
import { useRepertorioAuxModals } from "../useRepertorioAuxModals";

describe("useRepertorioAuxModals Contract", () => {
  it("exporta el hook useRepertorioAuxModals correctamente", () => {
    expect(useRepertorioAuxModals).toBeDefined();
    expect(typeof useRepertorioAuxModals).toBe("function");
  });
});
