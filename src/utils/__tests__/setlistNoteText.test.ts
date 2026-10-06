import { describe, it, expect } from "vitest";
import { cleanPrintedNote, cleanSetlistName, isAutoVersionNote } from "../setlistNoteText";

describe("cleanPrintedNote", () => {
  it("quita el historial de edición pegado a la nota", () => {
    expect(cleanPrintedNote("Nota del grupo nueva 15:56 EDITADA 2 veces")).toBe("Nota del grupo nueva");
    expect(cleanPrintedNote("Cuidadín con el final 9:05 EDITADO 1 vez")).toBe("Cuidadín con el final");
  });

  it("no toca el texto normal, ni horas que no son historial de edición", () => {
    expect(cleanPrintedNote("Entrar a las 21:30 sin intro")).toBe("Entrar a las 21:30 sin intro");
    expect(cleanPrintedNote("  En A  ")).toBe("En A");
  });

  it("vacío o nulo da cadena vacía", () => {
    expect(cleanPrintedNote(undefined)).toBe("");
    expect(cleanPrintedNote(null)).toBe("");
    expect(cleanPrintedNote("")).toBe("");
  });
});

describe("isAutoVersionNote", () => {
  it("detecta la nota autogenerada de versión original, con o sin corchetes", () => {
    expect(isAutoVersionNote("[Versión Original: Rock Clásico - E, 120 BPM]")).toBe(true);
    expect(isAutoVersionNote("Versión original: Rock Clásico - Mim, 120 BPM")).toBe(true);
    expect(isAutoVersionNote("Version Original: algo")).toBe(true);
  });

  it("no confunde una nota real del músico", () => {
    expect(isAutoVersionNote("Single debut. Enerxía 92%")).toBe(false);
    expect(isAutoVersionNote("Hacemos la versión original de Stones")).toBe(false);
    expect(isAutoVersionNote(undefined)).toBe(false);
  });
});

describe("cleanSetlistName", () => {
  it("colapsa un paréntesis repetido", () => {
    expect(cleanSetlistName('RUTA 66. “Classic” 2026 (Setlist Perfecto) (Setlist Perfecto)')).toBe(
      'RUTA 66. “Classic” 2026 (Setlist Perfecto)',
    );
  });

  it("deja intacto un nombre sin repeticiones", () => {
    expect(cleanSetlistName("Directo Festivais Galegos 2026 (45 min)")).toBe("Directo Festivais Galegos 2026 (45 min)");
    expect(cleanSetlistName("Acústico (Sala A) (Sala B)")).toBe("Acústico (Sala A) (Sala B)");
  });
});
