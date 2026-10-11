import { describe, it, expect } from "vitest";
import { itemDeBloqueImportado } from "../bloqueImportado";

describe("itemDeBloqueImportado", () => {
  it("guarda el subtipo en bloqueSubtipo y deja tipoItem en «bloque»", () => {
    expect(itemDeBloqueImportado("it-1", "Chapa", "chapa")).toEqual({
      id: "it-1",
      tipoItem: "bloque",
      bloqueSubtipo: "chapa",
      tituloCustom: "Chapa",
    });
  });

  it("sin subtipo usa «otro»", () => {
    expect(itemDeBloqueImportado("it-2", "X", undefined).bloqueSubtipo).toBe("otro");
  });
});
