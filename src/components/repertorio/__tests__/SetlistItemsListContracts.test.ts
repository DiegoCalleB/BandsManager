import { describe, it, expect } from "vitest";
import { SetlistItemsList } from "../SetlistItemsList";

describe("SetlistItemsList Contract", () => {
  it("exporta el componente de lista interactiva de items del setlist", () => {
    expect(SetlistItemsList).toBeDefined();
    expect(typeof SetlistItemsList).toBe("function");
  });
});
