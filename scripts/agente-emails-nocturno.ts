/**
 * Agente nocturno de emails de festivales. Cada noche lee la web oficial de los festivales menos recientes y:
 *  - re-verifica el email guardado si sigue escrito en su web (renueva `verificado_en`: fiabilidad 90),
 *  - añade el email de booking/contacto si el festival no tenía y su web lo publica,
 *  - marca como confirmado (100) el buzón desde el que el festival ya respondió (lead_messages),
 *  - avisa si el dominio del email no recibe correo (MX),
 *  - nunca borra ni inventa: lo que desaparece caduca solo (`src/utils/fiabilidadEmail.ts`).
 * Las decisiones son de `server/utils/reverificarEmail.ts` (función pura con tests); aquí solo hay E/S.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/agente-emails-nocturno.ts [--limite=120] [--dias=7] [--apply]
 *
 * Sin `--apply` es un ensayo: lee y cuenta, pero no escribe nada. Lo lanza `.github/workflows/agente-emails.yml`.
 */
import { appendFileSync, existsSync } from "node:fs";
import { resolveMx } from "node:dns/promises";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { leerWebDeFestival } from "./lib/lectorWebFestival.js";
import { decidirReverificacion, type LeadAReverificar, type ResultadoReverificacion } from "../server/utils/reverificarEmail.js";
import { leerTodas } from "../server/db/leerTodas.js";

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const APLICAR = process.argv.includes("--apply");
const LIMITE = Number(arg("limite")) || 120;
const DIAS = Number(arg("dias")) || 7;
const PARALELO = Number(arg("paralelo")) || 3;

const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const sb = createClient(url, clave, { auth: { persistSession: false } });

interface FilaFestival extends LeadAReverificar {
  id: string;
  band_id: string;
  nombre_sala: string;
  website: string;
}

const verificadoEn = (f: FilaFestival) => {
  const p = (f.datos_fuentes as Record<string, { verificado_en?: string }> | null)?.email_contacto;
  return p?.verificado_en ? Date.parse(p.verificado_en) : 0;
};

/** true/false si el DNS responde; undefined si no se pudo saber (no se marca nada por un fallo de red). */
async function tieneMx(email: string): Promise<boolean | undefined> {
  const dominio = email.split("@")[1];
  if (!dominio) return undefined;
  try {
    return (await resolveMx(dominio)).length > 0;
  } catch (err) {
    const codigo = (err as { code?: string }).code;
    return codigo === "ENOTFOUND" || codigo === "ENODATA" ? false : undefined;
  }
}

async function respondioDesde(leadId: string, email: string): Promise<boolean> {
  if (!email) return false;
  const { data, error } = await sb.from("lead_messages").select("id").eq("lead_id", leadId).ilike("remitente", `%${email}%`).limit(1);
  if (error) {
    console.warn(`[agente-emails] No se pudo leer lead_messages de ${leadId}:`, error.message);
    return false;
  }
  return (data ?? []).length > 0;
}

const todas = await leerTodas<FilaFestival>((desde, hasta) =>
  sb
    .from("leads")
    .select("id, band_id, nombre_sala, website, email_contacto, email_secundario, instagram, telefono, festival_start_date, festival_end_date, datos_fuentes")
    .ilike("tipo", "festival")
    .neq("website", "")
    .order("id")
    .range(desde, hasta),
);
const corte = Date.now() - DIAS * 86_400_000;
const cola = todas.filter((f) => f.website && verificadoEn(f) < corte).sort((a, b) => verificadoEn(a) - verificadoEn(b)).slice(0, LIMITE);
console.log(`[agente-emails] ${todas.length} festivales con web; esta noche: ${cola.length} (${APLICAR ? "aplicando" : "ensayo"}).`);

const ejecutable = process.env.PW_CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const navegador = await chromium.launch(ejecutable ? { executablePath: ejecutable } : {});
const inicio = Date.now();
const porBanda = new Map<string, Record<ResultadoReverificacion | "escritos" | "errores", number>>();
const sumar = (banda: string, clave: ResultadoReverificacion | "escritos" | "errores") => {
  const c = porBanda.get(banda) ?? ({} as Record<ResultadoReverificacion | "escritos" | "errores", number>);
  c[clave] = (c[clave] ?? 0) + 1;
  porBanda.set(banda, c);
};

let i = 0;
await Promise.all(
  Array.from({ length: PARALELO }, async () => {
    while (i < cola.length) {
      const f = cola[i++];
      // Contexto nuevo por festival: un host rechazado por el proxy deja la página inservible para los siguientes.
      const ctx = await navegador.newContext({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36", locale: "es-ES" });
      try {
        const leido = await leerWebDeFestival(await ctx.newPage(), f.website, f.nombre_sala);
        const email = (f.email_contacto || leido.email || "").trim().toLowerCase();
        const [mx, respondio] = await Promise.all([email ? tieneMx(email) : Promise.resolve(undefined), respondioDesde(f.id, email)]);
        const { resultado, cambios } = decidirReverificacion(f, leido, { mx, respondio });
        sumar(f.band_id, resultado);
        if (APLICAR && Object.keys(cambios).length) {
          const { error } = await sb.from("leads").update(cambios).eq("id", f.id).eq("band_id", f.band_id);
          if (error) throw new Error(error.message);
          sumar(f.band_id, "escritos");
        }
      } catch (err) {
        sumar(f.band_id, "errores");
        console.warn(`[agente-emails] ${f.nombre_sala}:`, err instanceof Error ? err.message : err);
      } finally {
        await ctx.close();
      }
    }
  }),
);
await navegador.close();

const duracion = Date.now() - inicio;
const lineas = [`## Agente de emails (${APLICAR ? "aplicado" : "ensayo"})`, "", "| Banda | Re-verificados | Nuevos | Cambio detectado | Desaparecidos | Web caída | Escritos | Errores |", "|---|---|---|---|---|---|---|---|"];
for (const [banda, c] of porBanda) {
  lineas.push(`| ${banda} | ${c.reverificado ?? 0} | ${c.nuevo ?? 0} | ${c.cambio_detectado ?? 0} | ${c.desaparecido ?? 0} | ${c.web_caida ?? 0} | ${c.escritos ?? 0} | ${c.errores ?? 0} |`);
  if (APLICAR) {
    const { error } = await sb.from("agent_execution_logs").insert({
      id: `ael-emails-${Date.now()}-${banda}`.slice(0, 120),
      band_id: banda,
      agente: "verificador_emails",
      motor: "playwright",
      disparado_por_tipo: "cron",
      estado: c.errores ? "parcial" : "ok",
      mensaje: `Re-verificados ${c.reverificado ?? 0}, nuevos ${c.nuevo ?? 0}, cambios ${c.cambio_detectado ?? 0}, desaparecidos ${c.desaparecido ?? 0}.`,
      conteo_afectados: c.escritos ?? 0,
      duracion_ms: duracion,
      detalles: c,
    });
    if (error) console.warn(`[agente-emails] No se pudo registrar el resumen de ${banda}:`, error.message);
  }
}
const resumen = lineas.join("\n");
console.log(resumen);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumen + "\n");
