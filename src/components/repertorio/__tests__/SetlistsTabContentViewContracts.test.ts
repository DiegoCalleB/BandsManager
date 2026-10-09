import { describe, it, expect } from "vitest";
import { SetlistsTabContentView } from "../SetlistsTabContentView";

describe("SetlistsTabContentView Contract", () => {
  it("exporta el componente SetlistsTabContentView", () => {
    expect(SetlistsTabContentView).toBeDefined();
    expect(typeof SetlistsTabContentView).toBe("function");
  });
});
