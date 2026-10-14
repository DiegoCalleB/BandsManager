// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClipQualityReport } from "../ClipQualityReport";

afterEach(cleanup);

describe("ClipQualityReport", () => {
  it("sin render no pinta nada", () => {
    const { container } = render(<ClipQualityReport informe={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("si no se pudo medir lo dice y avisa de que no saldrá solo", () => {
    render(<ClipQualityReport informe={null} />);
    expect(screen.getByRole("status").textContent).toMatch(/no se publicará solo/);
  });

  it("clip limpio: una sola línea tranquila", () => {
    render(<ClipQualityReport informe={{ aprobado: true, bloqueantes: [], avisos: [] }} />);
    expect(screen.getByRole("status").textContent).toBe("Clip revisado: imagen, sonido y formato en orden.");
  });

  it("con bloqueantes y avisos enseña cada motivo", () => {
    render(
      <ClipQualityReport
        informe={{
          aprobado: false,
          bloqueantes: [{ codigo: "sin_audio", mensaje: "El vídeo no tiene pista de audio." }],
          avisos: [{ codigo: "silencio", mensaje: "Hay silencio en 0:08 (2.0 s)." }]
        }}
      />
    );
    const texto = screen.getByRole("status").textContent;
    expect(texto).toContain("Este clip no se publicará solo:");
    expect(texto).toContain("El vídeo no tiene pista de audio.");
    expect(texto).toContain("Hay silencio en 0:08");
  });
});
