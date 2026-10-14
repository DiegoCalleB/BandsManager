// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyPerfectoPanel } from "../CopyPerfectoPanel";

afterEach(cleanup);

const opcion = (hook: string, arquetipo: string) => ({
  copy: { hookText: hook, recommendedCopy: "Copy", copyTikTok: "", copyYouTube: "", copyFacebook: "", hashtags: [] },
  arquetipo,
  auditoria: { puntuacion: 100, apto: true, problemas: [] }
});
const base = { mejorando: false, opciones: [], motivo: "", error: "", onMejorar: vi.fn(), onAplicar: vi.fn() };

describe("CopyPerfectoPanel", () => {
  it("sin resultados solo ocupa un botón", () => {
    render(<CopyPerfectoPanel {...base} />);
    expect(screen.getByRole("button", { name: /Mejorar copy/ })).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("marca la recomendada, traduce el arquetipo y aplica la que se pulse", () => {
    const onAplicar = vi.fn();
    const opciones = [opcion("Nadie se quería ir", "contraste"), opcion("Último tema", "original")];
    render(<CopyPerfectoPanel {...base} opciones={opciones} motivo="Más concreto" onAplicar={onAplicar} />);
    const filas = screen.getAllByRole("listitem");
    expect(filas[0].textContent).toContain("Recomendada");
    expect(filas[0].textContent).toContain("Contraste");
    expect(filas[0].textContent).toContain("Más concreto");
    expect(filas[1].textContent).toContain("El tuyo");
    fireEvent.click(screen.getAllByRole("button", { name: "Usar esta" })[1]);
    expect(onAplicar).toHaveBeenCalledWith(opciones[1]);
  });

  it("mientras trabaja, el botón se desactiva", () => {
    render(<CopyPerfectoPanel {...base} mejorando />);
    expect((screen.getByRole("button", { name: /Probando versiones/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("muestra el error como alerta", () => {
    render(<CopyPerfectoPanel {...base} error="Sin cuota de IA" />);
    expect(screen.getByRole("alert").textContent).toBe("Sin cuota de IA");
  });
});
