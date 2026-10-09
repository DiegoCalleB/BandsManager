import { describe, it, expect } from "vitest";
import RepertorioSetlists from "../../RepertorioSetlists";

const hooks = import.meta.glob("../hooks/*.ts", { eager: true });
const views = import.meta.glob("../Repertorio*View.tsx", { eager: true });

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === "function");

describe("RepertorioSetlists: contratos tras la modularización", () => {
  it("mantiene el export por defecto del contenedor", () => {
    expect(typeof RepertorioSetlists).toBe("function");
  });

  it("el contenedor respeta el límite de 800 líneas (AGENTS.md §5.6)", async () => {
    const raw = (await import("../../RepertorioSetlists?raw")) as { default: string };
    expect(raw.default.split("\n").length).toBeLessThan(800);
  });

  it.each(Object.entries(hooks))("%s exporta un hook o constructor de acciones", (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(views))("%s exporta un componente de vista", (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });
});
