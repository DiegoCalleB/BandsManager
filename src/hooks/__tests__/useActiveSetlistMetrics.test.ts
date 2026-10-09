import { describe, it, expect } from "vitest";
import { useActiveSetlistMetrics } from "../useActiveSetlistMetrics";

describe("useActiveSetlistMetrics Contract", () => {
  it("exporta la función hook useActiveSetlistMetrics", () => {
    expect(useActiveSetlistMetrics).toBeDefined();
    expect(typeof useActiveSetlistMetrics).toBe("function");
  });
});
