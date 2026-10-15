import { describe, it, expect } from "vitest";
import type { SetlistItem } from "../../../types";
import { formDesdeSetlistItem, setlistItemDesdeForm, tipoDesdeSubtipo } from "../showItemForm";

const bloque = (extra: Partial<SetlistItem>): SetlistItem => ({ id: "it-1", tipoItem: "bloque", ...extra });

describe("showItemForm (momento del show ↔ SetlistItem)", () => {
  it("guarda título, duración y notas en los campos que pinta la lista", () => {
    const datos = setlistItemDesdeForm({ title: " Solo de batería ", type: "solo", durationMin: 2.5, notes: "Luces rojas", key: "Am" });
    expect(datos).toEqual({
      bloqueSubtipo: "solo_performance",
      tituloCustom: "Solo de batería",
      duracionEstimadaMinutos: 2.5,
      duracionEstimadaSegundos: 150,
      notaTema: "Luces rojas",
      tonalidadDeseada: "Am",
    });
    // Un tipoItem distinto de «cancion» haría que handleSaveShowItem lo reinterpretase como subtipo.
    expect(datos).not.toHaveProperty("tipoItem");
  });

  it("al editar rellena el formulario desde el ítem guardado", () => {
    const form = formDesdeSetlistItem(
      bloque({ bloqueSubtipo: "descanso", tituloCustom: "Pausa", duracionEstimadaMinutos: 5, notaTema: "Agua", tonalidadDeseada: "Re" }),
    );
    expect(form).toEqual({ title: "Pausa", type: "pause", durationMin: 5, notes: "Agua", key: "Re" });
  });

  it("sin duración en minutos la deduce de los segundos", () => {
    expect(formDesdeSetlistItem(bloque({ duracionEstimadaSegundos: 90 })).durationMin).toBe(1.5);
  });

  it("conserva un subtipo sin opción propia si el tipo no se cambia", () => {
    const original = bloque({ bloqueSubtipo: "chapa", tituloCustom: "Chapa" });
    const form = formDesdeSetlistItem(original);
    expect(form.type).toBe("interlude");
    expect(setlistItemDesdeForm(form, original).bloqueSubtipo).toBe("chapa");
    expect(setlistItemDesdeForm({ ...form, type: "encore" }, original).bloqueSubtipo).toBe("bis");
  });

  it("sin ítem devuelve el formulario vacío", () => {
    expect(formDesdeSetlistItem(null)).toEqual({ title: "", type: "interlude", durationMin: 2, notes: "", key: "" });
    expect(tipoDesdeSubtipo(undefined)).toBe("interlude");
  });
});
