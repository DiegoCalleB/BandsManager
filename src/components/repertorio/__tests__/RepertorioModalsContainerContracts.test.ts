import { describe, it, expect } from "vitest";
import { RepertorioModalsContainer } from "../RepertorioModalsContainer";

describe("RepertorioModalsContainer Contract", () => {
  it("exporta el componente contenedor de modales de repertorio", () => {
    expect(RepertorioModalsContainer).toBeDefined();
    expect(typeof RepertorioModalsContainer).toBe("function");
  });
});
