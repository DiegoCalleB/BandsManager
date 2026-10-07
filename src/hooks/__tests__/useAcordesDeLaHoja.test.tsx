import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useAcordesDeLaHoja } from "../useAcordesDeLaHoja";

function Sonda({ texto }: { texto: string }) {
  const { acordes, contexto } = useAcordesDeLaHoja(texto, null, 0);
  return <p>{acordes.join(",")}|{contexto.size}</p>;
}

describe("useAcordesDeLaHoja", () => {
  it("devuelve los acordes únicos y su contexto", () => {
    expect(renderToStaticMarkup(<Sonda texto="[C] hola [G] adiós [C]" />)).toBe("<p>C,G|2</p>");
  });
  it("sin cifrado no hay acordes", () => {
    expect(renderToStaticMarkup(<Sonda texto="" />)).toBe("<p>|0</p>");
  });
});
