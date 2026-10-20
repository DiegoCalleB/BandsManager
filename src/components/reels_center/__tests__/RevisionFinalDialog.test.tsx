// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RevisionFinalDialog } from "../RevisionFinalDialog";
import { prepararRevisionFinal, type EntradaRevision } from "../revisionFinal";

// Siempre en el futuro: una fecha fija caduca y el test falla el día que se cumple.
const MANANA = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);

afterEach(cleanup);

const CLIP = "https://x.supabase.co/storage/v1/object/public/clips/band/c.mp4";
const entrada = (p: Partial<EntradaRevision> = {}): EntradaRevision => ({
  copy: "Nuevo directo #rock", fecha: MANANA, hora: "20:30", plataforma: "Instagram", videoUrl: CLIP,
  calidad: { aprobado: true, bloqueantes: [], avisos: [] }, derechosDeclarados: true, autoPublish: true, cuentaConectada: true, avisosCadencia: [], ...p
});
const montar = (e: EntradaRevision, extra: Partial<React.ComponentProps<typeof RevisionFinalDialog>> = {}) => {
  const onAprobar = vi.fn();
  const onVolver = vi.fn();
  render(<RevisionFinalDialog entrada={e} revision={prepararRevisionFinal(e)} onAprobar={onAprobar} onVolver={onVolver} {...extra} />);
  return { onAprobar, onVolver };
};

describe("RevisionFinalDialog", () => {
  it("muestra el texto, la red y la hora, y un único botón de aprobar", () => {
    const { onAprobar } = montar(entrada());
    expect(screen.getByText("Nuevo directo #rock")).toBeTruthy();
    expect(screen.getByText(/20:30/)).toBeTruthy();
    expect(screen.getByText(/saldrá solo/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Aprobar y programar" }));
    expect(onAprobar).toHaveBeenCalledTimes(1);
  });

  it("con un bloqueo no deja aprobar y dice por qué", () => {
    const { onAprobar } = montar(entrada({ copy: "sin hashtag" }));
    const boton = screen.getByRole("button", { name: "Aprobar y programar" }) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    fireEvent.click(boton);
    expect(onAprobar).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toMatch(/hashtag/);
  });

  it("si no saldrá solo lo dice antes de aprobar", () => {
    montar(entrada({ cuentaConectada: false }));
    expect(screen.getByRole("status").textContent).toMatch(/no saldrá solo/);
    expect(screen.getByText(/Quedará en tu calendario/)).toBeTruthy();
  });

  it("volver a editar no aprueba nada", () => {
    const { onAprobar, onVolver } = montar(entrada());
    fireEvent.click(screen.getByRole("button", { name: "Volver a editar" }));
    expect(onVolver).toHaveBeenCalledTimes(1);
    expect(onAprobar).not.toHaveBeenCalled();
  });
});
