import { describe, expect, it } from "vitest";
import { enlacesRedesPublicos } from "../enlacesPublicos.js";

describe("enlacesRedesPublicos", () => {
  it("nunca deja salir el token ni la cuenta privada de Instagram", () => {
    const publicos = enlacesRedesPublicos({
      instagram: "https://instagram.com/banda",
      spotify: "https://open.spotify.com/artist/x",
      instagram_access_token: "IGAA-secreto",
      instagram_account_id: "1789",
      instagram_verified_at: "2026-10-01T00:00:00Z",
      instagram_username: "banda"
    });
    expect(publicos).toEqual({
      instagram: "https://instagram.com/banda",
      spotify: "https://open.spotify.com/artist/x",
      instagram_username: "banda"
    });
  });

  it("tolera EPK sin enlaces", () => {
    expect(enlacesRedesPublicos(undefined)).toEqual({});
  });
});
