import { describe, it, expect } from "vitest";
import { useSetlistEnergyAnalysis } from "../useSetlistEnergyAnalysis";

describe("useSetlistEnergyAnalysis Contract", () => {
  it("exporta el hook useSetlistEnergyAnalysis como función", () => {
    expect(useSetlistEnergyAnalysis).toBeDefined();
    expect(typeof useSetlistEnergyAnalysis).toBe("function");
  });
});
