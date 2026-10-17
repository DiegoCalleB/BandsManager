// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResumenSemanalView } from "../ResumenSemanalCard";

afterEach(cleanup);

describe("ResumenSemanalView", () => {
  it("enseña los mejores Reels con sus veces vistas, el patrón y qué probar", () => {
    render(<ResumenSemanalView resumen={{
      reelsMedidos: 3,
      mejores: [
        { postId: "a", texto: "Directo en Sala X", formato: "loop_corto", rewatch: 2.1, tasaCompartir: 0.02, tasaGuardar: 0.01 },
        { postId: "b", texto: "Ensayo con la furgo", formato: "loop_corto", rewatch: 1, tasaCompartir: null, tasaGuardar: null }
      ],
      patron: "Tus 2 mejores Reels son de formato loop corto (≤15 s).",
      proximo: "Para el siguiente: loop corto."
    }} />);
    expect(screen.getByText("Directo en Sala X")).toBeTruthy();
    expect(screen.getByText("2,1 veces vista")).toBeTruthy();
    expect(screen.getByText("1 vez vista")).toBeTruthy();
    expect(screen.getByText(/mejores Reels son de formato/)).toBeTruthy();
    expect(screen.getByText("Para el siguiente: loop corto.")).toBeTruthy();
  });

  it("sin Reels medidos esta semana, estado vacío con voz propia y el consejo", () => {
    render(<ResumenSemanalView resumen={{ reelsMedidos: 0, mejores: [], patron: null, proximo: "Sigue publicando y midiendo." }} />);
    expect(screen.getByText("Esta semana la sala ha estado callada.")).toBeTruthy();
    expect(screen.getByText("Sigue publicando y midiendo.")).toBeTruthy();
  });
});
