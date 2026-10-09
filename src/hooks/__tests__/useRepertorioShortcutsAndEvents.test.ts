import { describe, it, expect } from "vitest";
import { useRepertorioShortcutsAndEvents } from "../useRepertorioShortcutsAndEvents";

describe("useRepertorioShortcutsAndEvents Contract", () => {
  it("exporta el hook useRepertorioShortcutsAndEvents correctamente", () => {
    expect(useRepertorioShortcutsAndEvents).toBeDefined();
    expect(typeof useRepertorioShortcutsAndEvents).toBe("function");
  });
});
