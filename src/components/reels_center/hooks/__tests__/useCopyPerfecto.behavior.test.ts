// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HighlightClip } from "../../../../utils/reelsUtils";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("../../../../utils/api", () => ({ apiFetch }));

import { useCopyPerfecto } from "../useCopyPerfecto";

const clip: HighlightClip = { id: "h1", range: "0:10-0:25", title: "El público canta", hookText: "Viejo hook", recommendedCopy: "Viejo copy", hashtags: ["#viejo"] };
const opcion = (hook: string) => ({
  copy: { hookText: hook, recommendedCopy: `${hook}. Copy IG.`, copyTikTok: `${hook} TT`, copyYouTube: `${hook} YT`, copyFacebook: `${hook} FB`, hashtags: ["#nuevo"] },
  arquetipo: "curiosidad",
  auditoria: { puntuacion: 100, apto: true, problemas: [] }
});

function montar(platform: "Instagram" | "TikTok" = "TikTok") {
  const setHighlights = vi.fn();
  const setEditedCopy = vi.fn();
  const hook = renderHook(() =>
    useCopyPerfecto({ highlights: [clip], selectedHighlightIndex: 0, setHighlights, setEditedCopy, selectedPlatform: platform, contentType: "concierto" })
  );
  return { ...hook, setHighlights, setEditedCopy };
}

beforeEach(() => {
  apiFetch.mockReset();
});

describe("useCopyPerfecto", () => {
  it("manda el copy actual del corte y deja ganador + alternativas listos para elegir", async () => {
    apiFetch.mockResolvedValue({ success: true, ganador: opcion("A"), alternativas: [opcion("B")], motivo: "Más concreto" });
    const { result } = montar();
    await act(() => result.current.mejorarCopy());
    const cuerpo = JSON.parse(apiFetch.mock.calls[0][1].body);
    expect(apiFetch.mock.calls[0][0]).toBe("/api/reels/copy-perfecto");
    expect(cuerpo).toMatchObject({ title: "El público canta", hookText: "Viejo hook", recommendedCopy: "Viejo copy", contentType: "concierto" });
    expect(result.current.opcionesCopy.map((o) => o.copy.hookText)).toEqual(["A", "B"]);
    expect(result.current.motivoCopy).toBe("Más concreto");
    expect(result.current.mejorandoCopy).toBe(false);
  });

  it("aplicar cambia TODOS los textos del corte y el editor muestra el de la plataforma activa", async () => {
    apiFetch.mockResolvedValue({ success: true, ganador: opcion("A"), alternativas: [] });
    const { result, setHighlights, setEditedCopy } = montar("TikTok");
    await act(() => result.current.mejorarCopy());
    act(() => result.current.aplicarCopy(result.current.opcionesCopy[0]));
    const actualizar = setHighlights.mock.calls[0][0] as (prev: HighlightClip[]) => HighlightClip[];
    expect(actualizar([clip])[0]).toMatchObject({ id: "h1", hookText: "A", recommendedCopy: "A. Copy IG.", copyTikTok: "A TT", hashtags: ["#nuevo"] });
    expect(setEditedCopy).toHaveBeenCalledWith("A TT");
    expect(result.current.opcionesCopy).toEqual([]);
  });

  it("si el servidor falla, enseña el error y no deja opciones a medias", async () => {
    apiFetch.mockResolvedValue({ success: false, error: "Sin cuota de IA" });
    const { result } = montar();
    await act(() => result.current.mejorarCopy());
    expect(result.current.errorCopy).toBe("Sin cuota de IA");
    expect(result.current.opcionesCopy).toEqual([]);
  });
});
