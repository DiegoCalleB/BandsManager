import { describe, it, expect } from "vitest";
import { useSetlistTransitionsOptimizer } from "../useSetlistTransitionsOptimizer";

describe("useSetlistTransitionsOptimizer Contract", () => {
  it("exporta el hook useSetlistTransitionsOptimizer", () => {
    expect(useSetlistTransitionsOptimizer).toBeDefined();
    expect(typeof useSetlistTransitionsOptimizer).toBe("function");
  });
});
