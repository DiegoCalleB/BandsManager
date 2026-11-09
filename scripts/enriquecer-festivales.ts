/**
 * Enriquece festivales leyendo SOLO su web oficial con un navegador real (renderiza JavaScript). Nada se infiere ni se
 * pide a una IA: cada dato sale escrito en una página del propio festival y se guarda con la página donde se leyó.
 *
 *   npx tsx scripts/enriquecer-festivales.ts --lista=festivales.txt [--salida=resultado.jsonl] [--paralelo=4]
 *   lista: id|Nombre|https://web-oficial/[|Ciudad candidata: se confirma si aparece escrita en la web]
 *
 * Qué recoge (todo opcional): email de booking/contacto del dominio del festival (regla de evidencia de
 * `server/utils/emailsDeContacto.ts`), Instagram enlazado desde su web, teléfono (`tel:`), ciudad/dirección y fechas
 * de la edición (JSON-LD `Event`), formulario de contacto y página de convocatoria para bandas.
 * Solo lectura: escribe un JSONL; la carga en base de datos es un paso aparte y revisable.
 * `GOTO_MS`: tiempo máximo por página (por defecto 20000). Navegador: `PW_CHROMIUM` (por defecto `/opt/pw-browsers/chromium` si existe).
 */
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { chromium } from "playwright";
import { leerWebDeFestival, type Hallazgo } from "./lib/lectorWebFestival.js";

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const LISTA = arg("lista");
const SALIDA = arg("salida") || "enriquecimiento-festivales.jsonl";
const PARALELO = Number(arg("paralelo")) || 4;
if (!LISTA) {
  console.error("Falta --lista=<fichero>");
  process.exit(1);
}

const lineas = readFileSync(LISTA, "utf8").trim().split("\n").filter(Boolean);
const ejecutable = process.env.PW_CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const navegador = await chromium.launch(ejecutable ? { executablePath: ejecutable } : {});
let i = 0;
await Promise.all(
  Array.from({ length: PARALELO }, async () => {
    while (i < lineas.length) {
      const [id, nombre, web, ciudad] = lineas[i++].split("|");
      let hallazgo: Partial<Hallazgo> = {};
      // Un contexto nuevo por festival: si el proxy rechaza un host, la página queda inservible y contaminaría a los siguientes.
      const ctx = await navegador.newContext({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36", locale: "es-ES" });
      try {
        hallazgo = await leerWebDeFestival(await ctx.newPage(), web, nombre, ciudad);
      } catch (err) {
        console.warn(`[enriquecer] ${nombre}:`, err instanceof Error ? err.message : err);
      } finally {
        await ctx.close();
      }
      appendFileSync(SALIDA, JSON.stringify({ id, nombre, web, ...hallazgo }) + "\n");
    }
  }),
);
await navegador.close();
console.log("FIN");
