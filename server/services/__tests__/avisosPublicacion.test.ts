import { describe, expect, it, vi } from "vitest";
import { avisarPublicacionesFallidas, type DepsAviso } from "../avisosPublicacion.js";
import type { PostFallido } from "../../utils/avisoPublicacionFallida.js";

const post: PostFallido = { plataforma: "Instagram", fecha: "2026-10-18", hora: "20:30", motivo: "Sin cuenta conectada.", asistido: true };
const deps = (extra: Partial<DepsAviso> = {}): DepsAviso & { enviar: ReturnType<typeof vi.fn> } => ({
  ajustes: async () => ({ email_notifications_enabled: true, recipient_email: "avisos@banda.es" }),
  banda: async () => ({ nombre_banda: "Los Ejemplo", email: "login@banda.es" }),
  enviar: vi.fn(async () => ({ success: true })),
  appUrl: () => "https://app.ejemplo.io",
  ...extra
}) as DepsAviso & { enviar: ReturnType<typeof vi.fn> };

describe("avisarPublicacionesFallidas", () => {
  it("manda UN correo por banda con todos los fallos, al email de avisos", async () => {
    const d = deps();
    const r = await avisarPublicacionesFallidas("band-1", [post, { ...post, fecha: "2026-10-19" }], d);
    expect(r).toEqual({ enviado: true });
    expect(d.enviar).toHaveBeenCalledTimes(1);
    const arg = d.enviar.mock.calls[0][0];
    expect(arg.to).toBe("avisos@banda.es");
    expect(arg.subject).toBe("2 Reels de Los Ejemplo no se han publicado");
  });

  it("sin fallos no envía nada ni consulta nada", async () => {
    const d = deps({ ajustes: vi.fn(async () => null) });
    expect(await avisarPublicacionesFallidas("band-1", [], d)).toEqual({ enviado: false, motivo: "sin_fallos" });
    expect(d.ajustes).not.toHaveBeenCalled();
  });

  it("si la banda desactivó los correos, respeta su decisión", async () => {
    const d = deps({ ajustes: async () => ({ email_notifications_enabled: false, recipient_email: "a@b.es" }) });
    expect(await avisarPublicacionesFallidas("band-1", [post], d)).toEqual({ enviado: false, motivo: "sin_destinatario" });
    expect(d.enviar).not.toHaveBeenCalled();
  });

  it("sin ningún email válido no envía", async () => {
    const d = deps({ ajustes: async () => null, banda: async () => ({ nombre_banda: "X", email: "" }) });
    expect((await avisarPublicacionesFallidas("band-1", [post], d)).enviado).toBe(false);
    expect(d.enviar).not.toHaveBeenCalled();
  });

  it("si el envío falla lo dice y no lanza", async () => {
    const d = deps({ enviar: vi.fn(async () => ({ success: false, error: "Resend caído" })) });
    expect(await avisarPublicacionesFallidas("band-1", [post], d)).toEqual({ enviado: false, motivo: "error_envio" });
  });

  it("si una dependencia revienta (Supabase caído) no lanza", async () => {
    const d = deps({ banda: async () => { throw new Error("Supabase caído"); } });
    await expect(avisarPublicacionesFallidas("band-1", [post], d)).resolves.toEqual({ enviado: false, motivo: "error" });
  });

  it("usa 'tu banda' si no se conoce el nombre", async () => {
    const d = deps({ banda: async () => ({ email: "login@banda.es" }) });
    await avisarPublicacionesFallidas("band-1", [post], d);
    expect(d.enviar.mock.calls[0][0].subject).toBe("Un Reel de tu banda no se ha publicado");
  });
});
