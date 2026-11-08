/**
 * Lee la web oficial de cada ayuntamiento y apunta el buzón de festejos/cultura/juventud/general que está ESCRITO en ella
 * (aviso legal, contacto, inicio…). Regla de evidencia: solo del dominio del ayuntamiento y con la página donde se leyó
 * (`server/utils/emailsDeAyuntamiento.ts`). Solo lectura: escribe un JSONL.
 *
 *   npx tsx scripts/descubrir-emails-ayuntamientos.ts --lista=municipios.txt [--salida=r.jsonl] [--paralelo=40]
 *   lista: id|Nombre|https://web-del-ayuntamiento/|Provincia   (la web sale de Wikidata, propiedad P856)
 * Si la salida ya existe, retoma por donde se quedó.
 */
import { execFile } from "node:child_process";
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { emailsEnTexto, paginasDondeBuscar } from "../server/utils/emailConEvidencia.js";
import { elegirEmailDeAyuntamiento, rolDeEmailMunicipal, type EmailEncontrado } from "../server/utils/emailsDeAyuntamiento.js";

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const LISTA = arg("lista");
const SALIDA = arg("salida") || "ayuntamientos.jsonl";
const PARALELO = Number(arg("paralelo")) || 40;
if (!LISTA) {
  console.error("Falta --lista=<fichero>");
  process.exit(1);
}

// Se analizan como mucho 400 KB por página: un HTML gigante bloquearía el único hilo en el análisis de emails.
const MAX_HTML = 400_000;
const leer = (u: string) =>
  new Promise<string>((ok) =>
    execFile("curl", ["-sS", "-L", "-m", "9", "-A", "Mozilla/5.0 (compatible; BandManagerBot; +https://bandmanager.io)", "--max-filesize", "1500000", u], { encoding: "utf8", maxBuffer: 4e6 }, (e, out) => ok(e ? "" : out.slice(0, MAX_HTML))),
  );

const hechos = new Set<string>();
if (existsSync(SALIDA)) for (const l of readFileSync(SALIDA, "utf8").split("\n")) if (l) hechos.add((JSON.parse(l) as { id: string }).id);
const lineas = readFileSync(LISTA, "utf8").trim().split("\n").filter((l) => l && !hechos.has(l.split("|")[0]));
let i = 0;
await Promise.all(
  Array.from({ length: PARALELO }, async () => {
    while (i < lineas.length) {
      const [id, nombre, web, prov] = lineas[i++].split("|");
      const candidatos: EmailEncontrado[] = [];
      let paginas = 0;
      for (const pagina of [...paginasDondeBuscar(web), new URL("/cultura", web).href, new URL("/festejos", web).href]) {
        const html = await leer(pagina);
        // Si ni la primera página responde, el sitio está caído o bloquea: no se gastan 6 esperas más.
        if (!html && paginas === 0) break;
        if (!html) continue;
        paginas++;
        for (const email of emailsEnTexto(html)) candidatos.push({ email, pagina });
        const hallado = elegirEmailDeAyuntamiento(candidatos, web);
        if (hallado?.rol === "festejos") break;
      }
      const elegido = elegirEmailDeAyuntamiento(candidatos, web);
      appendFileSync(
        SALIDA,
        JSON.stringify({ id, nombre, web, prov, paginas, email: elegido?.email ?? "", rol: elegido?.rol ?? "", evidencia: elegido?.evidencia ?? "", todos: [...new Set(candidatos.map((c) => `${c.email}[${rolDeEmailMunicipal(c.email)}]`))] }) + "\n",
      );
    }
  }),
);
console.log("FIN");
