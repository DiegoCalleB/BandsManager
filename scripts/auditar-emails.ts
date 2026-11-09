/**
 * Auditoría de los emails de los festivales (y, si se pide, de todas las salas y del catálogo): cada email se busca ESCRITO
 * en una página de la propia sala (su web, contacto, aviso legal) y se comprueba que su dominio recibe correo. Un email
 * que nadie ha escrito en esas páginas es una suposición, y aquí no vale.
 *
 *   npm run auditar:emails                       # solo informa (dry-run): festivales de todas las bandas
 *   npm run auditar:emails -- --band=<band_id>   # limita a una banda
 *   npm run auditar:emails -- --tipo=todos       # todas las salas, no solo festivales
 *   npm run auditar:emails -- --catalogo         # audita también catalogo_salas (solo informa: nunca lo vacía)
 *   npm run auditar:emails -- --apply            # vacía los emails de IA o buscador que no se pueden comprobar
 *                                                # y marca como «de la web» los que sí
 *   npm run auditar:emails -- --apply --tambien-sin-origen   # vacía también los que no dicen de dónde salieron
 *
 * Qué hace con cada email (ver `planificarEmail`): verificado, vaciar o revisar. Nunca vacía lo que viene de la web, de
 * Google Maps, del catálogo o de una persona, salvo con --tambien-sin-origen para los de origen desconocido.
 * Antes de escribir guarda lo que va a cambiar en `auditoria-emails-respaldo-<fecha>.json`. Deja un informe CSV
 * `auditoria-emails-<fecha>.csv` con cada email, su resultado y la página donde se encontró.
 * Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY y salida a internet (lee las webs de las salas).
 */
import fs from "node:fs";
import { getSupabase } from "../server/db/core.js";
import { verificarEmailEnSuWeb } from "../server/services/emailsSinEvidencia.js";
import { planificarEmail, type PlanDeEmail } from "../server/utils/planAuditoriaEmails.js";
import { procedenciaValida, type MapaProcedencia } from "../server/utils/procedenciaDatos.js";

const args = process.argv.slice(2);
const aplicar = args.includes("--apply");
const conCatalogo = args.includes("--catalogo");
const todosLosTipos = args.includes("--tipo=todos");
const tambienSinOrigen = args.includes("--tambien-sin-origen");
const soloBanda = args.find((a) => a.startsWith("--band="))?.slice("--band=".length);
const CAMPOS = ["email_contacto", "email_secundario"] as const;
const PAUSA_MS = 300;
const sello = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");

interface FilaLead {
  id: string;
  band_id: string;
  nombre_sala: string;
  tipo: string | null;
  website: string | null;
  email_contacto: string | null;
  email_secundario: string | null;
  datos_fuentes: unknown;
  notas: string | null;
}

interface LineaInforme {
  tabla: string;
  band_id: string;
  id: string;
  nombre: string;
  tipo: string;
  website: string;
  campo: string;
  email: string;
  procedencia: string;
  resultado: string;
  motivo: string;
  evidencia: string;
}

const informe: LineaInforme[] = [];
const respaldo: Array<Record<string, unknown>> = [];
const cuentas = { verificado: 0, vaciar: 0, revisar: 0 };
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));
const csv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

async function leerPaginado<T>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await consulta(desde, desde + 999);
    if (error) throw new Error(error.message);
    filas.push(...(data || []));
    if (!data || data.length < 1000) return filas;
  }
}

async function auditarLeads() {
  const sb = getSupabase();
  const leads = await leerPaginado<FilaLead>((d, h) => {
    let q = sb.from("leads").select("id, band_id, nombre_sala, tipo, website, email_contacto, email_secundario, datos_fuentes, notas");
    if (!todosLosTipos) q = q.or("tipo.eq.festival,nombre_sala.ilike.%festival%");
    if (soloBanda) q = q.eq("band_id", soloBanda);
    return q.range(d, h);
  });
  console.log(`${aplicar ? "APLICANDO" : "DRY-RUN"}: ${leads.length} leads${todosLosTipos ? "" : " de festivales"}${soloBanda ? ` (banda ${soloBanda})` : ""}`);

  for (const lead of leads) {
    const procedencia: MapaProcedencia = procedenciaValida(lead.datos_fuentes);
    const nuevos: Partial<Record<(typeof CAMPOS)[number], string>> = {};
    let cambioProcedencia = false;
    let vaciados = 0;

    for (const campo of CAMPOS) {
      const valor = (lead[campo] || "").trim();
      if (!valor) continue;
      const fuente = procedencia[campo]?.fuente;
      const conservados: string[] = [];
      for (const email of valor.split(/[,;]/).map((e) => e.trim()).filter(Boolean)) {
        const resultado = await verificarEmailEnSuWeb(email, lead.website || undefined);
        const plan: PlanDeEmail = planificarEmail({ fuente, resultado, tambienSinOrigen });
        cuentas[plan.accion]++;
        informe.push({ tabla: "leads", band_id: lead.band_id, id: lead.id, nombre: lead.nombre_sala, tipo: lead.tipo || "", website: lead.website || "", campo, email, procedencia: fuente || "(sin origen)", resultado: plan.accion, motivo: "motivo" in plan ? plan.motivo : "", evidencia: "evidencia" in plan ? plan.evidencia : "" });
        if (plan.accion !== "vaciar") conservados.push(email);
        else vaciados++;
        await pausa(PAUSA_MS);
        if (plan.accion === "verificado" && (fuente === "ia" || fuente === "buscador")) {
          procedencia[campo] = { fuente: "web", confianza: "alta", en: new Date().toISOString() };
          cambioProcedencia = true;
        }
      }
      if (conservados.join(", ") !== valor) {
        nuevos[campo] = conservados.join(", ");
        if (conservados.length === 0) {
          delete procedencia[campo];
          cambioProcedencia = true;
        }
      }
    }

    if (aplicar && (Object.keys(nuevos).length > 0 || cambioProcedencia)) {
      respaldo.push({ tabla: "leads", id: lead.id, band_id: lead.band_id, antes: { email_contacto: lead.email_contacto, email_secundario: lead.email_secundario, datos_fuentes: lead.datos_fuentes, notas: lead.notas } });
      const cambios: Record<string, unknown> = { ...nuevos, datos_fuentes: procedencia };
      if (vaciados > 0) {
        const nota = `[${new Date().toISOString().slice(0, 10)}] Email sugerido por una IA o un buscador descartado en la auditoría: no se pudo comprobar en su web. Añádelo a mano si lo conoces.`;
        cambios.notas = lead.notas ? `${nota}\n${lead.notas}` : nota;
      }
      const { error } = await sb.from("leads").update(cambios).eq("id", lead.id).eq("band_id", lead.band_id);
      if (error) console.warn(`  ✘ No se pudo actualizar ${lead.id}: ${error.message}`);
    }
  }
}

async function auditarCatalogo() {
  const sb = getSupabase();
  const filas = await leerPaginado<{ id: string; nombre: string; tipo: string | null; website: string | null; email_contacto: string | null }>((d, h) => {
    let q = sb.from("catalogo_salas").select("id, nombre, tipo, website, email_contacto").not("email_contacto", "is", null).neq("email_contacto", "");
    if (!todosLosTipos) q = q.eq("tipo", "festival");
    return q.range(d, h);
  });
  console.log(`Catálogo: ${filas.length} filas con email (solo informa: el catálogo no se vacía desde aquí)`);
  for (const f of filas) {
    const email = (f.email_contacto || "").trim();
    const resultado = await verificarEmailEnSuWeb(email, f.website || undefined);
    // El catálogo son datos estructurados (OSM, Wikidata, la Generalitat): se revisan, nunca se vacían.
    const plan = planificarEmail({ fuente: "catalogo", resultado });
    cuentas[plan.accion]++;
    informe.push({ tabla: "catalogo_salas", band_id: "", id: f.id, nombre: f.nombre, tipo: f.tipo || "", website: f.website || "", campo: "email_contacto", email, procedencia: "catalogo", resultado: plan.accion, motivo: "motivo" in plan ? plan.motivo : "", evidencia: "evidencia" in plan ? plan.evidencia : "" });
    await pausa(PAUSA_MS);
  }
}

async function main() {
  await auditarLeads();
  if (conCatalogo) await auditarCatalogo();

  const rutaInforme = `auditoria-emails-${sello}.csv`;
  const cabecera = ["tabla", "band_id", "id", "nombre", "tipo", "website", "campo", "email", "procedencia", "resultado", "motivo", "evidencia"] as const;
  fs.writeFileSync(rutaInforme, [cabecera.join(";"), ...informe.map((l) => cabecera.map((c) => csv(l[c])).join(";"))].join("\n"), "utf8");
  if (aplicar && respaldo.length > 0) {
    const rutaRespaldo = `auditoria-emails-respaldo-${sello}.json`;
    fs.writeFileSync(rutaRespaldo, JSON.stringify(respaldo, null, 2), "utf8");
    console.log(`Copia de lo que había antes: ${rutaRespaldo}`);
  }
  console.log(`\nVerificados: ${cuentas.verificado} · A vaciar: ${cuentas.vaciar} · A revisar a mano: ${cuentas.revisar}`);
  console.log(`Informe: ${rutaInforme}${aplicar ? "" : "\n(dry-run: no se ha cambiado nada; añade --apply para vaciar los emails sin comprobar)"}`);
}

main().catch((err) => {
  console.error("Auditoría de emails fallida:", err instanceof Error ? err.message : err);
  process.exit(1);
});
