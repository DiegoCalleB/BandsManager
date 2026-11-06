/**
 * Descubre la web oficial y el email de booking/contacto de una lista de festivales, SIN buscador (Bing y compañía
 * sirven resultados señuelo a los bots). Prueba dominios derivados del nombre (y los que se den en --extra) y solo acepta
 * una web si, al abrirla, nombra el festival; el email sigue la regla de evidencia (escrito en la propia web, de su dominio,
 * rol booking o general). Es de solo lectura: escribe un JSONL con el resultado y no toca la base de datos.
 *
 *   npx tsx scripts/descubrir-webs-festivales.ts --lista=festivales.txt [--extra=dominios.txt] [--salida=resultado.jsonl]
 *   lista:  id|Nombre|Ciudad|generos      extra:  id|dominio1,dominio2
 */
import { execFile } from "node:child_process";
import { readFileSync, appendFileSync } from "node:fs";
import { emailsEnTexto, paginasDondeBuscar } from "../server/utils/emailConEvidencia.js";
import { elegirEmailDeContacto, rolDelEmail, type EmailElegido, type EmailEncontrado } from "../server/utils/emailsDeContacto.js";
const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const LISTA = arg("lista"); const EXTRA_F = arg("extra"); const OUT = arg("salida") || "descubrimiento-festivales.jsonl";
if (!LISTA) { console.error("Falta --lista=<fichero>"); process.exit(1); }
const curl = (u: string, ua = "Mozilla/5.0") => new Promise<string>((ok) => execFile("curl", ["-sS", "-L", "-m", "7", "-A", ua, "--max-filesize", "1500000", u], { encoding: "utf8", maxBuffer: 4e6 }, (e, out) => ok(e ? "" : out)));
const plano = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const STOP = new Set(["festival","fest","de","del","la","el","los","las","y","the","en","music"]);
const TLD = ["com","es","org","net","eus","cat","gal","fest","rocks"];
const candidatos = (nombre: string) => {
  const t = plano(nombre).split(/[^a-z0-9]+/).filter(Boolean);
  const sin = t.filter((x) => !STOP.has(x));
  const bases = new Set<string>([sin.join(""), sin.join("") + "festival", sin.join("") + "fest", t.join(""), "festival" + sin.join("")]);
  if (sin.length > 1 && sin[0].length >= 6) bases.add(sin[0]);
  const out: string[] = [];
  for (const b of bases) if (b.length >= 4) for (const e of TLD) out.push(`https://www.${b}.${e}/`, `https://${b}.${e}/`);
  return out;
};
const EXTRA: Record<string, string[]> = EXTRA_F
  ? Object.fromEntries(readFileSync(EXTRA_F, "utf8").trim().split("\n").map((l) => [l.split("|")[0], l.split("|")[1].split(",")]))
  : {};
const lines = readFileSync(LISTA, "utf8").trim().split("\n");
const pool = async (items: string[], n: number, f: (s: string) => Promise<void>) => { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await f(items[i++]); })); };
await pool(lines, 24, async (ln) => {
  const [id, nombre] = ln.split("|");
  const toks = plano(nombre).split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t));
  const ex = (EXTRA[id] || []).flatMap((d) => [`https://www.${d}/`, `https://${d}/`]);
  const cand = ex.length ? ex : candidatos(nombre);
  let web = "";
  for (const u of cand) {
    const raiz = u;
    const crudo = await curl(raiz, "Mozilla/5.0");
    if (crudo.length < 500) continue;
    const html = plano(crudo);
    const host = plano(new URL(raiz).hostname);
    const head = html.slice(0, 20000);
    if (toks.length && toks.every((t) => host.includes(t) || head.includes(t)) && /festival|concierto|musica|music|cartel|line.?up|entradas|tickets/.test(head)) { web = raiz; break; }
  }
  let elegido: EmailElegido | null = null; let todos: string[] = [];
  if (web) {
    const c: EmailEncontrado[] = [];
    for (const p of paginasDondeBuscar(web)) for (const e of emailsEnTexto(await curl(p))) c.push({ email: e, pagina: p });
    todos = [...new Set(c.map((x) => `${x.email}[${rolDelEmail(x.email)}]`))];
    elegido = elegirEmailDeContacto(c, web);
  }
  appendFileSync(OUT, JSON.stringify({ id, nombre, web, cand: cand.slice(0, 3), email: elegido?.email || "", rol: elegido?.rol || "", evidencia: elegido?.evidencia || "", todos }) + "\n");
});
console.log("FIN");
