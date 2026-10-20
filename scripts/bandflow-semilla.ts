/**
 * Convierte lo extraído de Bandflow (scripts/bandflow-extraer.mjs) en la semilla del catálogo: server/data/bandflowSalas.ts.
 *   npx tsx scripts/bandflow-semilla.ts fichas.jsonl
 * Aplica aquí las reglas de privacidad (email solo de rol, teléfono solo fijo, Instagram solo si se parece a la sala), de
 * modo que la semilla que se guarda en el repositorio nunca lleva datos de personas.
 */
import fs from "node:fs";
import { salasDeBandflow, type FichaBandflow } from "../server/utils/bandflowSalas.ts";

const entrada = process.argv[2];
if (!entrada) throw new Error("Uso: npx tsx scripts/bandflow-semilla.ts fichas.jsonl");

const fichas = fs.readFileSync(entrada, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as FichaBandflow);
const salas = salasDeBandflow(fichas).sort((a, b) => a.clave.localeCompare(b.clave));

const cuerpo = salas.map((s) => `  ${JSON.stringify(s)},`).join("\n");
fs.writeFileSync(
  "server/data/bandflowSalas.ts",
  `import type { CamposPublicosSala } from '../utils/salaCatalogo.js';

/**
 * Salas de Bandflow (bandflow.es) ya filtradas: sin datos de personas, sin reseñas, sin descripciones y sin fotos. Generado con
 * scripts/bandflow-semilla.ts; no se edita a mano. Procedencia: bandflow (no se publica en el directorio público).
 */
export const SALAS_BANDFLOW: readonly CamposPublicosSala[] = [
${cuerpo}
];
`,
);

const con = (campo: keyof (typeof salas)[number]) => salas.filter((s) => s[campo] !== null && s[campo] !== "").length;
console.log(`${fichas.length} fichas → ${salas.length} salas`);
for (const c of ["region", "direccion", "aforo", "website", "instagram", "email_contacto", "telefono"] as const) console.log(`  con ${c}: ${con(c)}`);
