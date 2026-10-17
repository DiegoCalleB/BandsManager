import { describe, expect, it } from "vitest";
import { destinatarioDeAvisoPublicacion, renderAvisoPublicacionesFallidas, type PostFallido } from "../avisoPublicacionFallida";

const fallo = (extra: Partial<PostFallido> = {}): PostFallido => ({
  plataforma: "Instagram", fecha: "2026-10-18", hora: "20:30", motivo: "Instagram no está conectado con una cuenta profesional.", asistido: true, ...extra
});
const base = { nombreBanda: "Los Ejemplo", appUrl: "https://app.ejemplo.io" };

describe("destinatarioDeAvisoPublicacion", () => {
  it("usa el email de avisos de la banda si lo ha puesto", () => {
    expect(destinatarioDeAvisoPublicacion({ ajustes: { email_notifications_enabled: true, recipient_email: "Avisos@Banda.es" }, emailBanda: "login@banda.es" })).toBe("avisos@banda.es");
  });
  it("sin email de avisos usa el de acceso de la banda", () => {
    expect(destinatarioDeAvisoPublicacion({ ajustes: null, emailBanda: "login@banda.es" })).toBe("login@banda.es");
    expect(destinatarioDeAvisoPublicacion({ ajustes: { email_notifications_enabled: true, recipient_email: "" }, emailBanda: "login@banda.es" })).toBe("login@banda.es");
  });
  it("si la banda ha desactivado los correos, no se manda nada", () => {
    expect(destinatarioDeAvisoPublicacion({ ajustes: { email_notifications_enabled: false, recipient_email: "a@b.es" }, emailBanda: "login@banda.es" })).toBeNull();
  });
  it("ignora direcciones inválidas o con inyección y cae a la siguiente válida", () => {
    expect(destinatarioDeAvisoPublicacion({ ajustes: { email_notifications_enabled: true, recipient_email: "a,b@evil.com" }, emailBanda: "ok@banda.es" })).toBe("ok@banda.es");
    expect(destinatarioDeAvisoPublicacion({ ajustes: null, emailBanda: "no-es-un-email" })).toBeNull();
    expect(destinatarioDeAvisoPublicacion({ ajustes: null, emailBanda: undefined })).toBeNull();
  });
});

describe("renderAvisoPublicacionesFallidas", () => {
  it("un Reel: asunto en singular con la banda, y el motivo exacto en el cuerpo", () => {
    const { subject, html } = renderAvisoPublicacionesFallidas({ ...base, posts: [fallo()] });
    expect(subject).toBe("Un Reel de Los Ejemplo no se ha publicado");
    expect(html).toContain("Instagram no está conectado con una cuenta profesional.");
    expect(html).toContain("18 oct");
    expect(html).toContain("20:30");
  });

  it("varios: asunto en plural con el número", () => {
    const { subject } = renderAvisoPublicacionesFallidas({ ...base, posts: [fallo(), fallo({ fecha: "2026-10-19" }), fallo({ fecha: "2026-10-20" })] });
    expect(subject).toBe("3 Reels de Los Ejemplo no se han publicado");
  });

  it("distingue lo que hay que subir a mano de lo que se puede reintentar", () => {
    const manual = renderAvisoPublicacionesFallidas({ ...base, posts: [fallo({ asistido: true })] }).html;
    const reintento = renderAvisoPublicacionesFallidas({ ...base, posts: [fallo({ asistido: false, motivo: "Meta rechazó el vídeo" })] }).html;
    expect(manual).toMatch(/súbelo tú|a mano/i);
    expect(reintento).toMatch(/reintent/i);
  });

  it("escapa el HTML del motivo y del nombre de la banda (el motivo puede traer texto de Meta)", () => {
    const { html, subject } = renderAvisoPublicacionesFallidas({ nombreBanda: "<b>Ban\ndа</b>", appUrl: "https://app.ejemplo.io", posts: [fallo({ motivo: '<script>alert(1)</script> "x"' })] });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(subject).not.toMatch(/[<>\r\n]/);
  });

  it("acota el motivo largo y el número de Reels listados, diciendo cuántos faltan", () => {
    const largos = Array.from({ length: 14 }, (_, i) => fallo({ fecha: `2026-10-${String(10 + i).padStart(2, "0")}`, motivo: "x".repeat(900) }));
    const { html } = renderAvisoPublicacionesFallidas({ ...base, posts: largos });
    expect(html).not.toContain("x".repeat(400));
    expect((html.match(/<li/g) || []).length).toBe(10);
    expect(html).toMatch(/y 4 más/);
  });

  it("enlaza a la app y aguanta una fecha o hora ausente", () => {
    const { html } = renderAvisoPublicacionesFallidas({ ...base, posts: [fallo({ fecha: "", hora: undefined })] });
    expect(html).toContain("https://app.ejemplo.io");
    expect(html).not.toContain("undefined");
  });
});
