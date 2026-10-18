import { describe, it, expect } from "vitest";
import { evaluarPreparacion, formatearPreparacion, type EstadoPreparacion } from "../preparacionPublicacion";

const TODO_BIEN: EstadoPreparacion = {
  resendKey: true,
  appUrl: "https://bandmanager.io",
  supabaseOk: true,
  tablas: { reel_clips: true, reel_metricas: true, band_alert_settings: true },
  columnasPostsFaltan: [],
  banda: { existe: true, avisosActivados: true, destinatario: "diego@ejemplo.com", instagramConectado: true, pendientesDeSalir: 2 }
};
const con = (p: Partial<EstadoPreparacion>): EstadoPreparacion => ({ ...TODO_BIEN, ...p });
const de = (e: EstadoPreparacion, nombre: RegExp) => evaluarPreparacion(e).find((c) => nombre.test(c.nombre))!;

describe("evaluarPreparacion", () => {
  it("con todo en orden no hay nada que arreglar", () => {
    const r = evaluarPreparacion(TODO_BIEN);
    expect(r.every((c) => c.estado === "ok")).toBe(true);
  });

  it("sin clave de Resend lo dice: el aviso por email no saldrá", () => {
    const c = de(con({ resendKey: false }), /resend/i);
    expect(c.estado).toBe("falta");
    expect(c.arreglo).toMatch(/RESEND_API_KEY/);
  });

  it("una APP_URL de desarrollo avisa: los enlaces del correo apuntarían a un sitio que no existe", () => {
    expect(de(con({ appUrl: "http://localhost:3000" }), /app_url/i).estado).toBe("aviso");
    expect(de(con({ appUrl: undefined }), /app_url/i).estado).toBe("aviso");
  });

  it("si falta una tabla o columna, apunta a aplicar migraciones", () => {
    const t = de(con({ tablas: { ...TODO_BIEN.tablas, reel_metricas: false } }), /tablas/i);
    expect(t.estado).toBe("falta");
    expect(t.detalle).toMatch(/reel_metricas/);
    const c = de(con({ columnasPostsFaltan: ["publish_started_at"] }), /columnas/i);
    expect(c.estado).toBe("falta");
    expect(c.detalle).toMatch(/publish_started_at/);
  });

  it("sin conexión a Supabase no se evalúa lo demás como correcto", () => {
    const r = evaluarPreparacion(con({ supabaseOk: false, tablas: {}, banda: undefined }));
    expect(r.find((c) => /supabase/i.test(c.nombre))!.estado).toBe("falta");
  });

  it("avisos desactivados o sin destinatario: el correo no llegaría", () => {
    expect(de(con({ banda: { ...TODO_BIEN.banda!, avisosActivados: false } }), /avisos/i).estado).toBe("falta");
    expect(de(con({ banda: { ...TODO_BIEN.banda!, destinatario: null } }), /destinatario/i).estado).toBe("falta");
  });

  it("sin Instagram conectado es un aviso, no un error: el Reel se queda para subir a mano", () => {
    const c = de(con({ banda: { ...TODO_BIEN.banda!, instagramConectado: false } }), /instagram/i);
    expect(c.estado).toBe("aviso");
    expect(c.detalle).toMatch(/a mano|asistido/i);
  });

  it("sin banda indicada solo evalúa el entorno", () => {
    const r = evaluarPreparacion(con({ banda: undefined }));
    expect(r.some((c) => /destinatario/i.test(c.nombre))).toBe(false);
  });
});

describe("formatearPreparacion", () => {
  it("resume cuántas cosas faltan y pone el arreglo bajo cada una", () => {
    const texto = formatearPreparacion(evaluarPreparacion(con({ resendKey: false })));
    expect(texto).toMatch(/1 cosa/);
    expect(texto).toMatch(/RESEND_API_KEY/);
  });

  it("todo bien: lo dice sin ruido", () => {
    expect(formatearPreparacion(evaluarPreparacion(TODO_BIEN))).toMatch(/Todo listo/);
  });
});
