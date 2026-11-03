// @vitest-environment happy-dom
import { describe,expect,it } from "vitest";
import { accionDeAtajo } from "../useAtajosAtril";

const base = { ctrlKey: false, metaKey: false, altKey: false, target: document.body };

describe("accionDeAtajo", () => {
  it.each([
    [" ", "reproducir"], ["ArrowLeft", "atras"], ["ArrowRight", "adelante"], ["r", "inicio"], ["R", "inicio"],
    ["-", "tonoMenos"], ["+", "tonoMas"], ["=", "tonoMas"], ["0", "tonoOriginal"],
    ["m", "controles"], ["e", "escenario"], ["f", "pantallaCompleta"],
  ])("«%s» → %s", (key, esperada) => {
    expect(accionDeAtajo({ ...base, key })).toBe(esperada);
  });

  it("deja pasar teclas que no son atajo", () => {
    expect(accionDeAtajo({ ...base, key: "q" })).toBeNull();
    expect(accionDeAtajo({ ...base, key: "Enter" })).toBeNull();
  });

  it("respeta Ctrl, Cmd y Alt (copiar, recargar…)", () => {
    expect(accionDeAtajo({ ...base, key: "r", ctrlKey: true })).toBeNull();
    expect(accionDeAtajo({ ...base, key: "f", metaKey: true })).toBeNull();
    expect(accionDeAtajo({ ...base, key: "m", altKey: true })).toBeNull();
  });

  it("no roba el teclado a quien escribe o a un botón enfocado", () => {
    for (const tag of ["input", "textarea", "select", "button", "a"]) {
      expect(accionDeAtajo({ ...base, key: " ", target: document.createElement(tag) })).toBeNull();
    }
  });

  it("no actúa dentro de diálogos ni menús", () => {
    const dialogo = document.createElement("div");
    dialogo.setAttribute("role", "dialog");
    const hijo = document.createElement("span");
    dialogo.appendChild(hijo);
    expect(accionDeAtajo({ ...base, key: "e", target: hijo })).toBeNull();
  });
});
