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
import { chromium, type Page } from "playwright";
import { emailsEnTexto } from "../server/utils/emailConEvidencia.js";
import { elegirEmailDeContacto, type EmailEncontrado } from "../server/utils/emailsDeContacto.js";

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const LISTA = arg("lista");
const SALIDA = arg("salida") || "enriquecimiento-festivales.jsonl";
const PARALELO = Number(arg("paralelo")) || 4;
if (!LISTA) {
  console.error("Falta --lista=<fichero>");
  process.exit(1);
}

const PAGINAS = /contact|contacto|kontakt|aviso|legal|privacidad|prensa|press|about|quienes|nosotros|artist|banda|band|booking|programa|convocatoria|bases|participa|info/i;
const CONVOCATORIA = /convocatoria|\bbases\b|\bparticipa\b|\bapply\b|submit|call-?for|inscripci|presenta tu|env[ií]a tu/i;
const INSTAGRAM_MAL = /^(p|reel|reels|explore|stories|tv|accounts|about|share|sharer|developer|legal)$/i;
const mismoSitio = (a: string, b: string) => {
  try {
    return new URL(a).hostname.replace(/^www\./, "") === new URL(b).hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
};

interface Hallazgo {
  email: string; rol: string; evidencia: string; instagram: string; telefono: string; ciudad: string;
  direccion: string; inicio: string; fin: string; formulario: string; convocatoria: string; paginas: number;
  /** La ciudad candidata de la lista aparece escrita en alguna página de la web (si no, no se debe guardar). */
  ciudadEnWeb: boolean;
}

/** Eventos/organizaciones JSON-LD de la página (ciudad, dirección y fechas de la edición). */
function leerJsonLd(bloques: string[]): { ciudad: string; direccion: string; inicio: string; fin: string } {
  const r = { ciudad: "", direccion: "", inicio: "", fin: "" };
  const visitar = (n: unknown): void => {
    if (Array.isArray(n)) return n.forEach(visitar);
    if (!n || typeof n !== "object") return;
    const o = n as Record<string, unknown>;
    const tipo = String(o["@type"] ?? "");
    if (/event|festival/i.test(tipo)) {
      if (!r.inicio && typeof o.startDate === "string") r.inicio = o.startDate.slice(0, 10);
      if (!r.fin && typeof o.endDate === "string") r.fin = o.endDate.slice(0, 10);
    }
    const dir = (o.address ?? (o.location as Record<string, unknown> | undefined)?.address) as Record<string, unknown> | string | undefined;
    if (dir && typeof dir === "object") {
      if (!r.ciudad && typeof dir.addressLocality === "string") r.ciudad = dir.addressLocality;
      if (!r.direccion && typeof dir.streetAddress === "string") r.direccion = dir.streetAddress;
    }
    Object.values(o).forEach(visitar);
  };
  for (const b of bloques) {
    try {
      visitar(JSON.parse(b));
    } catch {
      /* JSON-LD mal formado: se ignora, la web no lo garantiza */
    }
  }
  return r;
}

async function abrir(page: Page, url: string): Promise<boolean> {
  try {
    await page.goto(url, { timeout: Number(process.env.GOTO_MS) || 20000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    return true;
  } catch {
    return false;
  }
}

const plano = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

/** Un Instagram solo vale si se parece al festival: el más enlazado puede ser el de una banda del cartel. */
function pareceDelFestival(handle: string, nombre: string, web: string): boolean {
  const h = plano(handle);
  const marca = plano(new URL(web).hostname.replace(/^www\./, "").split(".")[0]);
  const fichas = nombre.split(/[^\p{L}\p{N}]+/u).map(plano).filter((t) => t.length >= 4 && !["festival", "music", "fest"].includes(t));
  return (marca.length >= 4 && (h.includes(marca) || marca.includes(h))) || fichas.some((t) => h.includes(t));
}

async function enriquecer(page: Page, web: string, nombre: string, ciudadCandidata = ""): Promise<Hallazgo> {
  const h: Hallazgo = { email: "", rol: "", evidencia: "", instagram: "", telefono: "", ciudad: "", direccion: "", inicio: "", fin: "", formulario: "", convocatoria: "", paginas: 0, ciudadEnWeb: false };
  if (!(await abrir(page, web))) return h;
  const inicio = page.url();
  const cola = new Set<string>([inicio]);
  const vistas = new Set<string>();
  const candidatos: EmailEncontrado[] = [];
  const instagram = new Map<string, number>();

  while (cola.size && vistas.size < 7) {
    const url = [...cola][0];
    cola.delete(url);
    if (vistas.has(url)) continue;
    vistas.add(url);
    if (url !== page.url() && !(await abrir(page, url))) continue;
    h.paginas++;
    const datos = await page.evaluate(() => ({
      html: document.documentElement.outerHTML.slice(0, 1_500_000),
      texto: document.body?.innerText?.slice(0, 200_000) ?? "",
      enlaces: [...document.querySelectorAll("a[href]")].map((a) => ({ href: (a as HTMLAnchorElement).href, texto: (a.textContent || "").trim().slice(0, 80) })),
      jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent || ""),
      formulario: !!document.querySelector("form textarea"),
    }));
    if (ciudadCandidata && plano(datos.texto).includes(plano(ciudadCandidata))) h.ciudadEnWeb = true;
    // El texto visible cubre emails escritos con JavaScript; el HTML, mailto, entidades y cfemail.
    for (const e of new Set([...emailsEnTexto(datos.html), ...emailsEnTexto(datos.texto)])) candidatos.push({ email: e, pagina: url });
    for (const { href, texto } of datos.enlaces) {
      const t = href.match(/^tel:(.+)$/i);
      if (t && !h.telefono) h.telefono = decodeURIComponent(t[1]).replace(/\s+/g, " ").trim();
      const ig = href.match(/^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)\/?(?:\?.*)?$/i);
      if (ig && !INSTAGRAM_MAL.test(ig[1])) instagram.set(ig[1].toLowerCase(), (instagram.get(ig[1].toLowerCase()) ?? 0) + 1);
      if (/^https?:/i.test(href) && mismoSitio(href, inicio)) {
        if (!h.convocatoria && CONVOCATORIA.test(`${href} ${texto}`) && !/\.(jpg|png|pdf)$/i.test(href)) h.convocatoria = href;
        if (PAGINAS.test(`${new URL(href).pathname} ${texto}`) && !vistas.has(href.split("#")[0]) && cola.size < 6) cola.add(href.split("#")[0]);
      }
    }
    if (datos.formulario && !h.formulario && /contact|contacto|kontakt|booking|artist/i.test(url)) h.formulario = url;
    const ld = leerJsonLd(datos.jsonld);
    h.ciudad ||= ld.ciudad; h.direccion ||= ld.direccion; h.inicio ||= ld.inicio; h.fin ||= ld.fin;
    if (elegirEmailDeContacto(candidatos, inicio)?.rol === "booking") break;
  }
  const elegido = elegirEmailDeContacto(candidatos, inicio);
  if (elegido) { h.email = elegido.email; h.rol = elegido.rol; h.evidencia = elegido.evidencia; }
  h.instagram = [...instagram.entries()].sort((a, b) => b[1] - a[1]).map(([u]) => u).find((u) => pareceDelFestival(u, nombre, web)) ?? "";
  return h;
}

const lineas = readFileSync(LISTA, "utf8").trim().split("\n").filter(Boolean);
const ejecutable = process.env.PW_CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const navegador = await chromium.launch(ejecutable ? { executablePath: ejecutable } : {});
let i = 0;
await Promise.all(
  Array.from({ length: PARALELO }, async () => {
    const ctx = await navegador.newContext({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36", locale: "es-ES" });
    const page = await ctx.newPage();
    while (i < lineas.length) {
      const [id, nombre, web, ciudad] = lineas[i++].split("|");
      let hallazgo: Partial<Hallazgo> = {};
      try {
        hallazgo = await enriquecer(page, web, nombre, ciudad);
      } catch (err) {
        console.warn(`[enriquecer] ${nombre}:`, err instanceof Error ? err.message : err);
      }
      appendFileSync(SALIDA, JSON.stringify({ id, nombre, web, ...hallazgo }) + "\n");
    }
    await ctx.close();
  }),
);
await navegador.close();
console.log("FIN");
