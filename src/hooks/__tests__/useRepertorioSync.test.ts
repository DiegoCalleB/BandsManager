import { describe, it, expect } from "vitest";
import { useRepertorioSync } from "../useRepertorioSync";

describe("useRepertorioSync Contract", () => {
  it("exporta la función hook useRepertorioSync", () => {
    expect(useRepertorioSync).toBeDefined();
    expect(typeof useRepertorioSync).toBe("function");
  });
});
