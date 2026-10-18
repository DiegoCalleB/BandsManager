// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RazonDelTramoPanel } from "../RazonDelTramoPanel";
import { razonDelTramo } from "../razonDelTramo";

afterEach(cleanup);

describe("RazonDelTramoPanel", () => {
  const razon = razonDelTramo({ start: 0, end: 30 }, [
    { start: 0, end: 30, energia: 40, arranque: 90, dinamismo: 60, publico: 70, score: 81, motivo: "El estribillo entra con toda la banda." }
  ])!;

  it("enseña la frase del análisis, la puntuación y qué pesó más", () => {
    render(<RazonDelTramoPanel razon={razon} />);
    expect(screen.getByText("El estribillo entra con toda la banda.")).toBeTruthy();
    expect(screen.getByText(/pesó más el arranque/)).toBeTruthy();
    expect(screen.getByText("81")).toBeTruthy();
  });

  it("pinta una barra por señal medida", () => {
    render(<RazonDelTramoPanel razon={razon} />);
    for (const etiqueta of ["Volumen", "Arranque", "Montaje", "Público"]) expect(screen.getByText(etiqueta)).toBeTruthy();
  });
});
