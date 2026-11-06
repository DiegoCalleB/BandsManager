/**
 * Descubre los emails REALES de contacto de los festivales: lee las páginas de su propia web (inicio, contacto, aviso legal,
 * prensa), recoge todo email escrito ahí y elige el de booking o, si no, el general, siempre del dominio del festival.
 * Prensa, entradas, RRHH, legal, personas y dominios ajenos se listan en el informe pero nunca se eligen.
 *
 *   npm run descubrir:emails                      # solo informa: festivales sin email de todas las bandas
 *   npm run descubrir:emails -- --band=<band_id>
 *   npm run descubrir:emails -- --apply           # rellena email_contacto vacío con el elegido (procedencia: web)
 *
 * Deja `descubrimiento-emails-<fecha>.csv` con todo lo encontrado, su rol y la página. Necesita SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY y salida a internet.
 */
import fs from "node:fs";
import { getSupabase } from "../server/db/core.js";
import { leerPaginaSegura } from "../server/services/emailsSinEvidencia.js";
import { emailsEnTexto, paginasDondeBuscar } from "../server/utils/emailConEvidencia.js";
import { elegirEmailDeContacto, rolDelEmail, type EmailEncontrado } from "../server/utils/emailsDeContacto.js";
import { isValidEmailCached } from "../server/utils/emailValidator.js";
import { procedenciaValida } from "../server/utils/procedenciaDatos.js";

const args = process.argv.slice(2);
const aplicar = args.includes("--apply");
const soloBanda = args.find((a) => a.startsWith("--band="))?.slice(7);
const sello = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const csv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));
const filas: string[][] = [];

async function main() {
  const sb = getSupabase();
  let q = sb.from("leads").select("id, band_id, nombre_sala, website, email_contacto, datos_fuentes").or("tipo.eq.festival,nombre_sala.ilike.%festival%").not("website", "is", null).neq("website", "");
  if (soloBanda) q = q.eq("band_id", soloBanda);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const leads = (data || []).filter((l) => !(l.email_contacto || "").trim());
  console.log(`${aplicar ? "APLICANDO" : "DRY-RUN"}: ${leads.length} festivales con web y sin email`);

  let elegidos = 0;
  for (const lead of leads) {
    const candidatos: EmailEncontrado[] = [];
    for (const pagina of paginasDondeBuscar(lead.website)) {
      try {
        const texto = await leerPaginaSegura(pagina);
        for (const email of texto ? emailsEnTexto(texto) : []) candidatos.push({ email, pagina });
      } catch { /* página caída: se sigue con la siguiente */ }
      await pausa(200);
    }
    const elegido = elegirEmailDeContacto(candidatos, lead.website);
    const correo = elegido && (await isValidEmailCached(elegido.email)) ? elegido : null;
    for (const c of candidatos) filas.push([lead.band_id, lead.id, lead.nombre_sala, lead.website, c.email, rolDelEmail(c.email), c.pagina, correo?.email === c.email.toLowerCase() ? "ELEGIDO" : ""]);
    if (!correo) continue;
    elegidos++;
    if (!aplicar) continue;
    const procedencia = procedenciaValida(lead.datos_fuentes);
    procedencia.email_contacto = { fuente: "web", confianza: "alta", en: new Date().toISOString() };
    const { error: err } = await sb.from("leads").update({ email_contacto: correo.email, datos_fuentes: procedencia }).eq("id", lead.id).eq("band_id", lead.band_id);
    if (err) console.warn(`  ✘ ${lead.nombre_sala}: ${err.message}`);
  }

  const ruta = `descubrimiento-emails-${sello}.csv`;
  const cab = ["band_id", "lead_id", "nombre", "website", "email", "rol", "pagina", "resultado"];
  fs.writeFileSync(ruta, [cab.join(";"), ...filas.map((f) => f.map(csv).join(";"))].join("\n"), "utf8");
  console.log(`Con email real elegido: ${elegidos}/${leads.length} · Informe: ${ruta}${aplicar ? "" : "\n(dry-run: añade --apply para rellenarlos)"}`);
}

main().catch((e) => { console.error("Descubrimiento fallido:", e instanceof Error ? e.message : e); process.exit(1); });
