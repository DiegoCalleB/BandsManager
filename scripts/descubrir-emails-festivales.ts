/**
 * Descubre los emails REALES de contacto de festivales, salas y demás leads (y del catálogo): lee las páginas de su propia web (inicio, contacto, aviso legal,
 * prensa), recoge todo email escrito ahí y elige el de booking o, si no, el general, siempre del dominio del festival.
 * Prensa, entradas, RRHH, legal, personas y dominios ajenos se listan en el informe pero nunca se eligen.
 *
 *   npm run descubrir:emails                      # solo informa: leads (de todo tipo) con web y sin email, de todas las bandas
 *   npm run descubrir:emails -- --band=<band_id>
 *   npm run descubrir:emails -- --tipo=festival   # solo festivales
 *   npm run descubrir:emails -- --catalogo        # también catalogo_salas con web y sin email
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
const soloFestivales = args.includes("--tipo=festival");
const conCatalogo = args.includes("--catalogo");
const soloBanda = args.find((a) => a.startsWith("--band="))?.slice(7);
const sello = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const csv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));
const filas: string[][] = [];
interface FilaLead { id: string; band_id: string; nombre_sala: string; website: string; email_contacto: string | null; datos_fuentes: unknown }
interface FilaCatalogo { id: string; nombre: string; website: string }

async function descubrir(website: string) {
  const candidatos: EmailEncontrado[] = [];
  for (const pagina of paginasDondeBuscar(website)) {
    try {
      const texto = await leerPaginaSegura(pagina);
      for (const email of texto ? emailsEnTexto(texto) : []) candidatos.push({ email, pagina });
    } catch { /* página caída: se sigue con la siguiente */ }
    await pausa(200);
  }
  const elegido = elegirEmailDeContacto(candidatos, website);
  return { candidatos, elegido: elegido && (await isValidEmailCached(elegido.email)) ? elegido : null };
}

async function leerTodo<T>(consulta: (d: number, h: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let d = 0; ; d += 1000) {
    const { data, error } = await consulta(d, d + 999);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

async function main() {
  const sb = getSupabase();
  const todos = await leerTodo<FilaLead>((d, h) => {
    let q = sb.from("leads").select("id, band_id, nombre_sala, website, email_contacto, datos_fuentes").not("website", "is", null).neq("website", "");
    if (soloFestivales) q = q.or("tipo.eq.festival,nombre_sala.ilike.%festival%");
    if (soloBanda) q = q.eq("band_id", soloBanda);
    return q.range(d, h);
  });
  const leads = todos.filter((l) => !(l.email_contacto || "").trim());
  console.log(`${aplicar ? "APLICANDO" : "DRY-RUN"}: ${leads.length} leads con web y sin email`);

  let elegidos = 0;
  for (const lead of leads) {
    const { candidatos, elegido: correo } = await descubrir(lead.website);
    for (const c of candidatos) filas.push(["leads", lead.band_id, lead.id, lead.nombre_sala, lead.website, c.email, rolDelEmail(c.email), c.pagina, correo?.email === c.email.toLowerCase() ? "ELEGIDO" : ""]);
    if (!correo) continue;
    elegidos++;
    if (!aplicar) continue;
    const procedencia = procedenciaValida(lead.datos_fuentes);
    procedencia.email_contacto = { fuente: "web", confianza: "alta", en: new Date().toISOString() };
    const { error: err } = await sb.from("leads").update({ email_contacto: correo.email, datos_fuentes: procedencia }).eq("id", lead.id).eq("band_id", lead.band_id);
    if (err) console.warn(`  ✘ ${lead.nombre_sala}: ${err.message}`);
  }

  if (conCatalogo) {
    const cat = await leerTodo<FilaCatalogo>((d, h) => sb.from("catalogo_salas").select("id, nombre, website, email_contacto").not("website", "is", null).neq("website", "").or("email_contacto.is.null,email_contacto.eq.").range(d, h));
    console.log(`Catálogo: ${cat.length} filas con web y sin email`);
    for (const f of cat) {
      const { candidatos, elegido: correo } = await descubrir(f.website);
      for (const c of candidatos) filas.push(["catalogo_salas", "", f.id, f.nombre, f.website, c.email, rolDelEmail(c.email), c.pagina, correo?.email === c.email.toLowerCase() ? "ELEGIDO" : ""]);
      if (!correo) continue;
      elegidos++;
      if (aplicar) {
        const { error: err } = await sb.from("catalogo_salas").update({ email_contacto: correo.email }).eq("id", f.id);
        if (err) console.warn(`  ✘ ${f.nombre}: ${err.message}`);
      }
    }
  }

  const ruta = `descubrimiento-emails-${sello}.csv`;
  const cab = ["tabla", "band_id", "lead_id", "nombre", "website", "email", "rol", "pagina", "resultado"];
  fs.writeFileSync(ruta, [cab.join(";"), ...filas.map((f) => f.map(csv).join(";"))].join("\n"), "utf8");
  console.log(`Con email real elegido: ${elegidos} · Informe: ${ruta}${aplicar ? "" : "\n(dry-run: añade --apply para rellenarlos)"}`);
}

main().catch((e) => { console.error("Descubrimiento fallido:", e instanceof Error ? e.message : e); process.exit(1); });
