import { describe, it, expect } from "vitest";
import { useRepertorioItemPopovers } from "../useRepertorioItemPopovers";

describe("useRepertorioItemPopovers Contract", () => {
  it("exporta el hook useRepertorioItemPopovers correctamente", () => {
    expect(useRepertorioItemPopovers).toBeDefined();
    expect(typeof useRepertorioItemPopovers).toBe("function");
  });
});
