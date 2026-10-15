import { describe, expect, it } from "vitest";
import { derechosDelClip, nombreDeCanalEnUrl } from "../derechosClip.js";

describe("derechosDelClip", () => {
  const banda = { youtubeDeLaBanda: "https://www.youtube.com/@LosPeregrinos", nombreDeLaBanda: "Los Peregrinos" };

  it("el canal coincide con el YouTube de la banda", () => {
    expect(derechosDelClip({ ...banda, canalOrigen: "LosPeregrinos" })).toBe("canal_de_la_banda");
  });

  it("o con el nombre de la banda, sin tildes ni mayúsculas", () => {
    expect(derechosDelClip({ nombreDeLaBanda: "Los Peregrinos Ñ", canalOrigen: "los peregrinos n" })).toBe("canal_de_la_banda");
  });

  it("un canal ajeno no da derechos", () => {
    expect(derechosDelClip({ ...banda, canalOrigen: "VEVO" })).toBeNull();
    expect(derechosDelClip({ ...banda, canalOrigen: "" })).toBeNull();
  });

  it("la declaración expresa los da, pero queda registrada como declarada", () => {
    expect(derechosDelClip({ ...banda, canalOrigen: "VEVO", declaradoPorLaBanda: true })).toBe("declarado_por_la_banda");
  });

  it("si coincide el canal gana la verificación sobre la declaración", () => {
    expect(derechosDelClip({ ...banda, canalOrigen: "LosPeregrinos", declaradoPorLaBanda: true })).toBe("canal_de_la_banda");
  });

  it("un nombre demasiado corto no puede coincidir por casualidad", () => {
    expect(derechosDelClip({ nombreDeLaBanda: "U2", canalOrigen: "U2" })).toBeNull();
  });
});

describe("nombreDeCanalEnUrl", () => {
  it("extrae @handle, /c/ y /user/; ignora /channel/UC", () => {
    expect(nombreDeCanalEnUrl("https://youtube.com/@Los-Peregrinos?si=x")).toBe("losperegrinos");
    expect(nombreDeCanalEnUrl("https://www.youtube.com/c/LosPeregrinos")).toBe("losperegrinos");
    expect(nombreDeCanalEnUrl("https://www.youtube.com/user/lp")).toBe("lp");
    expect(nombreDeCanalEnUrl("https://www.youtube.com/channel/UCabc123")).toBe("");
    expect(nombreDeCanalEnUrl("")).toBe("");
  });
});
