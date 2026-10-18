// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { skinDe, type Plataforma } from "../plataformaSkin";
import { AccionesLaterales, BotonSeguir, CabeceraPlataforma } from "../PlataformaOverlay";

afterEach(cleanup);

const PLATAFORMAS: Plataforma[] = ["Instagram", "TikTok", "YouTube", "Facebook"];
const ids = (p: Plataforma) => skinDe(p).acciones.map((a) => a.id);

describe("skinDe", () => {
  it("cada plataforma tiene su propia interfaz, no la misma con otra etiqueta", () => {
    const huellas = PLATAFORMAS.map((p) => JSON.stringify(skinDe(p)));
    expect(new Set(huellas).size).toBe(PLATAFORMAS.length);
  });

  it("TikTok: Siguiendo | Para ti con «Para ti» activa, avatar en la columna y disco, sin botón seguir", () => {
    const s = skinDe("TikTok");
    expect(s.pestanas).toEqual(["Siguiendo", "Para ti"]);
    expect(s.pestanas[s.activa]).toBe("Para ti");
    expect(s.avatarEnColumna).toBe(true);
    expect(s.discoAudio).toBe(true);
    expect(s.seguir).toBeNull();
    expect(ids("TikTok")).toContain("save");
  });

  it("Shorts: cabecera Shorts, no me gusta y «Suscribirse»", () => {
    const s = skinDe("YouTube");
    expect(s.pestanas).toEqual(["Shorts"]);
    expect(ids("YouTube")).toContain("dislike");
    expect(s.seguir).toBe("Suscribirse");
    expect(s.discoAudio).toBe(false);
  });

  it("Instagram: Reels, enviar y más; Facebook: sin enviar ni disco", () => {
    expect(skinDe("Instagram").pestanas).toEqual(["Reels"]);
    expect(ids("Instagram")).toEqual(expect.arrayContaining(["like", "comment", "send", "more"]));
    expect(ids("Facebook")).not.toContain("send");
    expect(skinDe("Facebook").discoAudio).toBe(false);
  });

  it("un valor desconocido o vacío cae a Instagram, que es lo de siempre", () => {
    expect(skinDe("Myspace")).toBe(skinDe("Instagram"));
    expect(skinDe(undefined)).toBe(skinDe("Instagram"));
    expect(skinDe("")).toBe(skinDe("Instagram"));
  });

  it("ninguna plataforma deja la columna vacía", () => {
    for (const p of PLATAFORMAS) expect(skinDe(p).acciones.length).toBeGreaterThanOrEqual(3);
  });
});

describe("piezas del móvil", () => {
  it("la cabecera pinta todas las pestañas de la plataforma", () => {
    render(<CabeceraPlataforma skin={skinDe("TikTok")} />);
    expect(screen.getByText("Siguiendo")).toBeTruthy();
    expect(screen.getByText("Para ti")).toBeTruthy();
  });

  it("la pestaña activa se distingue de las demás", () => {
    render(<CabeceraPlataforma skin={skinDe("TikTok")} />);
    expect(screen.getByText("Para ti").className).toMatch(/text-\[var\(--ink\)\]/);
    expect(screen.getByText("Siguiendo").className).toMatch(/text-\[var\(--ink-3\)\]/);
  });

  it("la columna de TikTok lleva disco y avatar con +; la de Shorts no", () => {
    const { unmount } = render(<AccionesLaterales skin={skinDe("TikTok")} nombreBanda="Ruta 66" />);
    expect(screen.getByTestId("disco-audio")).toBeTruthy();
    expect(screen.getByText("+")).toBeTruthy();
    expect(screen.getByText("R")).toBeTruthy();
    unmount();
    render(<AccionesLaterales skin={skinDe("YouTube")} nombreBanda="Ruta 66" />);
    expect(screen.queryByTestId("disco-audio")).toBeNull();
    expect(screen.queryByText("+")).toBeNull();
    expect(screen.getByText("No me gusta")).toBeTruthy();
  });

  it("pinta un botón por acción de la plataforma", () => {
    const { container } = render(<AccionesLaterales skin={skinDe("Instagram")} nombreBanda="X" />);
    expect(container.querySelectorAll("[data-accion]").length).toBe(skinDe("Instagram").acciones.length);
  });

  it("el botón de seguir usa el texto de la plataforma", () => {
    render(<BotonSeguir etiqueta="Suscribirse" />);
    expect(screen.getByText(/Suscribirse/)).toBeTruthy();
  });
});
