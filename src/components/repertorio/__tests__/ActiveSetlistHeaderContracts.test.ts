import { describe, it, expect } from "vitest";
import { ActiveSetlistHeader } from "../ActiveSetlistHeader";

describe("ActiveSetlistHeader Contract", () => {
  it("exporta el componente de cabecera del setlist activo", () => {
    expect(ActiveSetlistHeader).toBeDefined();
    expect(typeof ActiveSetlistHeader).toBe("function");
  });
});
