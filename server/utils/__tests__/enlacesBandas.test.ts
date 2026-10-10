import { describe, it, expect } from "vitest";
import {
  clasificarEnlaceUnico,
  normalizarInstagram,
  planificarSincronizacion,
  valorVisibleSpotifyYoutube,
} from "../enlacesBandas.js";

const SPOTIFY = "https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF";
const YOUTUBE = "https://www.youtube.com/@bandaamiga";

describe("clasificarEnlaceUnico", () => {
  it("separa Spotify, YouTube y web del campo mezclado", () => {
    expect(clasificarEnlaceUnico(SPOTIFY)).toBe("spotify");
    expect(clasificarEnlaceUnico(YOUTUBE)).toBe("youtube");
    expect(clasificarEnlaceUnico("https://youtu.be/abc")).toBe("youtube");
    expect(clasificarEnlaceUnico("https://bandaamiga.es")).toBe("web");
  });

  it("vacío es null y cualquier spotify.com cuenta como Spotify (el barrido lo valida)", () => {
    expect(clasificarEnlaceUnico("  ")).toBeNull();
    expect(clasificarEnlaceUnico(undefined)).toBeNull();
    expect(clasificarEnlaceUnico("https://open.spotify.com/artist/ROTO")).toBe("spotify");
  });
});

describe("normalizarInstagram", () => {
  it("convierte @usuario en URL y respeta las URL", () => {
    expect(normalizarInstagram("@ejemplo")).toBe("https://instagram.com/ejemplo");
    expect(normalizarInstagram("ejemplo")).toBe("https://instagram.com/ejemplo");
    expect(normalizarInstagram("https://www.instagram.com/ejemplo/")).toBe("https://www.instagram.com/ejemplo/");
    expect(normalizarInstagram("")).toBe("");
  });
});

describe("valorVisibleSpotifyYoutube", () => {
  it("prioriza Spotify, luego YouTube y luego web", () => {
    expect(valorVisibleSpotifyYoutube({ youtube: { url: YOUTUBE, verificado: false }, spotify: { url: SPOTIFY, verificado: true } })).toBe(SPOTIFY);
    expect(valorVisibleSpotifyYoutube({ youtube: { url: YOUTUBE, verificado: false } })).toBe(YOUTUBE);
    expect(valorVisibleSpotifyYoutube({ web: { url: "https://x.es", verificado: false } })).toBe("https://x.es");
    expect(valorVisibleSpotifyYoutube(undefined)).toBe("");
  });
});

describe("planificarSincronizacion", () => {
  it("no toca nada si el formulario no envía los campos", () => {
    expect(planificarSincronizacion({}, undefined, undefined)).toEqual([]);
  });

  it("no escribe nada si el valor no ha cambiado (conserva el verificado)", () => {
    const actuales = { spotify: { url: SPOTIFY, verificado: true } };
    expect(planificarSincronizacion(actuales, SPOTIFY, undefined)).toEqual([]);
  });

  it("un enlace nuevo de Spotify se guarda como no verificado", () => {
    expect(planificarSincronizacion({}, SPOTIFY, undefined)).toEqual([
      { plataforma: "spotify", url: SPOTIFY, verificado: false },
    ]);
  });

  it("vaciar el campo borra las filas del campo mezclado, no Instagram", () => {
    const actuales = {
      spotify: { url: SPOTIFY, verificado: true },
      instagram: { url: "https://instagram.com/x", verificado: false },
    };
    expect(planificarSincronizacion(actuales, "", undefined)).toEqual([
      { plataforma: "spotify", url: null, verificado: false },
    ]);
  });

  it("Instagram: vacío borra y un usuario nuevo se normaliza", () => {
    expect(planificarSincronizacion({ instagram: { url: "https://instagram.com/x", verificado: false } }, undefined, "")).toEqual([
      { plataforma: "instagram", url: null, verificado: false },
    ]);
    expect(planificarSincronizacion({}, undefined, "@nueva")).toEqual([
      { plataforma: "instagram", url: "https://instagram.com/nueva", verificado: false },
    ]);
  });
});
