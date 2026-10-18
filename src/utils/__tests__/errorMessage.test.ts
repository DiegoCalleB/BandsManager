import { describe, it, expect } from "vitest";
import { getErrorMessage } from "../errorMessage";

describe("getErrorMessage", () => {
  it("devuelve el mensaje de un Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });
  it("usa el fallback si el valor no es un Error", () => {
    expect(getErrorMessage("texto", "fallo")).toBe("fallo");
    expect(getErrorMessage(null, "fallo")).toBe("fallo");
  });
  it("usa el fallback si el Error no tiene mensaje", () => {
    expect(getErrorMessage(new Error(""), "fallo")).toBe("fallo");
  });
});
