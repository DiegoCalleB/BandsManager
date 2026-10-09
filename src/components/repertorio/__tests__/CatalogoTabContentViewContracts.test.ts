import { describe, it, expect } from "vitest";
import { CatalogoTabContentView } from "../CatalogoTabContentView";

describe("CatalogoTabContentView Contract", () => {
  it("exporta la función componente CatalogoTabContentView", () => {
    expect(CatalogoTabContentView).toBeDefined();
    expect(typeof CatalogoTabContentView).toBe("function");
  });
});
