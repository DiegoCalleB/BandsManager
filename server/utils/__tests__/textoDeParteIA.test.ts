import { describe, it, expect } from "vitest";
import { textoDeParte } from "../textoDeParteIA.js";
import { extractTextFromContents } from "../../ai.js";

describe("textoDeParte", () => {
  it("devuelve el texto de una parte de texto", () => {
    expect(textoDeParte({ text: "hola" })).toBe("hola");
  });

  it("renderiza el resultado de una herramienta para los proveedores que solo leen texto", () => {
    expect(textoDeParte({ functionResponse: { name: "ver_lead", response: { nombre: "Apolo" } } })).toBe('[Resultado de ver_lead]: {"nombre":"Apolo"}');
  });

  it("ignora partes vacías o que no son objetos", () => {
    expect(textoDeParte(null)).toBe("");
    expect(textoDeParte("x")).toBe("");
    expect(textoDeParte({ functionCall: { name: "buscar_leads" } })).toBe("");
  });

  it("el failover conserva el resultado de la lectura al aplanar los turnos", () => {
    const turnos = [
      { role: "user", parts: [{ text: "¿qué pasó con Apolo?" }] },
      { role: "user", parts: [{ functionResponse: { name: "ver_lead", response: { nombre: "Apolo" } } }] },
    ];
    expect(extractTextFromContents(turnos)).toContain("[Resultado de ver_lead]");
  });
});
