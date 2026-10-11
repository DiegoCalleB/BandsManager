import { describe, it, expect } from "vitest";
import { resolveRepertorioTab, useRepertorioTabs } from "../useRepertorioTabs";

describe("resolveRepertorioTab", () => {
  it("catalogo abre el catálogo en modo canciones", () => {
    expect(resolveRepertorioTab("catalogo")).toEqual({ tab: "catalogo", catalogoMode: "canciones" });
  });
  it("discografia abre el catálogo en modo álbumes", () => {
    expect(resolveRepertorioTab("discografia")).toEqual({ tab: "catalogo", catalogoMode: "albumes" });
  });
  it.each(["repertorio", "directo", undefined, "", "<script>"])(
    "valor %s aterriza en setlists sin tocar el modo",
    (view) => {
      expect(resolveRepertorioTab(view as string | undefined)).toEqual({ tab: "setlists", catalogoMode: null });
    },
  );
  it("exporta el hook", () => {
    expect(typeof useRepertorioTabs).toBe("function");
  });
});
