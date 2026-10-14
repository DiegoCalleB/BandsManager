import { describe, expect, it } from "vitest";
import { instanteProgramado, postsVencidos, estaColgadoPublicando } from "../programacionPosts.js";
import type { SocialPost } from "../../../src/types.js";

const post = (p: Partial<SocialPost>): SocialPost => ({
  id: "p1",
  fecha: "2026-10-14",
  plataforma: "Instagram",
  contenido: "",
  estado: "aprobado",
  responsable: "",
  ...p
});

describe("instanteProgramado", () => {
  it("interpreta la hora en la zona de la banda, no en la del servidor", () => {
    // Madrid en octubre (antes del cambio) = UTC+2.
    expect(instanteProgramado("2026-10-14", "20:30", "Europe/Madrid").toISOString()).toBe("2026-10-14T18:30:00.000Z");
  });

  it("respeta el cambio de hora (invierno = UTC+1)", () => {
    expect(instanteProgramado("2026-11-02", "20:30", "Europe/Madrid").toISOString()).toBe("2026-11-02T19:30:00.000Z");
  });

  it("el mismo día del cambio de hora usa el desfase correcto", () => {
    // 25-oct-2026: a las 03:00 CEST vuelve a ser 02:00 CET. Las 20:30 ya son CET.
    expect(instanteProgramado("2026-10-25", "20:30", "Europe/Madrid").toISOString()).toBe("2026-10-25T19:30:00.000Z");
  });

  it("sin hora, es medianoche local; zona inválida cae a Europe/Madrid", () => {
    expect(instanteProgramado("2026-10-14", undefined, "Europe/Madrid").toISOString()).toBe("2026-10-13T22:00:00.000Z");
    expect(instanteProgramado("2026-10-14", "20:30", "No/Existe").toISOString()).toBe("2026-10-14T18:30:00.000Z");
  });

  it("otras zonas", () => {
    expect(instanteProgramado("2026-10-14", "09:00", "America/Mexico_City").toISOString()).toBe("2026-10-14T15:00:00.000Z");
  });
});

describe("postsVencidos", () => {
  const ahora = new Date("2026-10-14T18:31:00Z"); // 20:31 en Madrid

  it("solo publica lo aprobado o en cola cuya hora local ya pasó", () => {
    const lista = [
      post({ id: "ya", hora_programada: "20:30" }),
      post({ id: "luego", hora_programada: "20:45" }),
      post({ id: "cola", estado: "en_cola", hora_programada: "08:00" }),
      post({ id: "borrador-auto", estado: "borrador", auto_publish: true, hora_programada: "08:00" }),
      post({ id: "hecho", estado: "publicado", hora_programada: "08:00" }),
      post({ id: "fallo", estado: "fallido", hora_programada: "08:00" }),
      post({ id: "enCurso", estado: "publicando", hora_programada: "08:00" })
    ];
    expect(postsVencidos(lista, "Europe/Madrid", ahora).map((p) => p.id)).toEqual(["ya", "cola"]);
  });

  it("un post sin fecha válida no se publica nunca solo", () => {
    expect(postsVencidos([post({ fecha: "" })], "Europe/Madrid", ahora)).toEqual([]);
  });
});

describe("estaColgadoPublicando", () => {
  const ahora = new Date("2026-10-14T18:30:00Z");
  it("detecta un 'publicando' abandonado hace más de 15 min", () => {
    expect(estaColgadoPublicando(post({ estado: "publicando", publish_started_at: "2026-10-14T18:00:00Z" }), ahora)).toBe(true);
    expect(estaColgadoPublicando(post({ estado: "publicando", publish_started_at: "2026-10-14T18:25:00Z" }), ahora)).toBe(false);
    expect(estaColgadoPublicando(post({ estado: "publicando" }), ahora)).toBe(true);
    expect(estaColgadoPublicando(post({ estado: "aprobado" }), ahora)).toBe(false);
  });
});
