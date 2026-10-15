import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DrawerDiagramas } from "../components/chords/DrawerDiagramas";
import { contextoDeAcordes } from "../utils/vistaAcordes";

const base = { acordes: ["C", "G"], contexto: contextoDeAcordes("C G", ["C", "G"], null), vista: "guitarra" as const, onVista: () => {}, onCerrar: () => {} };

describe("DrawerDiagramas", () => {
  it("muestra el recuento y una caja por acorde", () => {
    const html = renderToStaticMarkup(<DrawerDiagramas {...base} />);
    expect(html).toContain("Acordes");
    expect(html).toContain("(2)");
    expect(html).toContain(">C<");
    expect(html).toContain(">G<");
  });
  it("ilumina el acorde que suena", () => {
    const html = renderToStaticMarkup(<DrawerDiagramas {...base} sonando="G" />);
    expect(html.match(/data-sonando="true"/g)?.length).toBe(1);
  });
  it("la tira horizontal usa el título largo y avisa si no hay acordes", () => {
    expect(renderToStaticMarkup(<DrawerDiagramas {...base} disposicion="tira" />)).toContain("Diagramas de Acordes de este Tema");
    expect(renderToStaticMarkup(<DrawerDiagramas {...base} acordes={[]} />)).toContain("No se detectaron acordes");
  });
});
