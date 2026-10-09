import { describe,expect,it } from "vitest";
import { VenueDetailPanel } from "../VenueDetailPanel";

const sections = import.meta.glob("../venue_panel/*.tsx", { eager: true });
const actionBuilders = import.meta.glob("../venue_panel/hooks/*.ts", { eager: true });

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === "function");

describe("VenueDetailPanel: contratos tras la modularización", () => {
  it("mantiene el export público del panel", () => {
    expect(VenueDetailPanel).toBeDefined();
  });

  it.each(Object.entries(sections))("%s exporta al menos un componente", (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(actionBuilders))("%s exporta al menos una función de acciones o hook", (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it("el contenedor respeta el límite de 800 líneas (AGENTS.md §5.6)", async () => {
    const raw = (await import("../VenueDetailPanel?raw")) as { default: string };
    expect(raw.default.split("\n").length).toBeLessThan(800);
  });
});
