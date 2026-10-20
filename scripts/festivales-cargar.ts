/**
 * Carga el directorio de festivales en Supabase (ADR 0045). Solo inserta: una fila que ya existe no se toca nunca.
 *   npm run festivales:cargar              # simulación: cuenta lo que haría y NO escribe nada
 *   npm run festivales:cargar -- --aplicar # escribe en Supabase
 * Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Requiere la migración 20261111_festivales.sql ya aplicada.
 */
import fs from "node:fs";
import { insertarSinPisar } from "../server/db/festivales.ts";
import { FESTIVALES } from "../server/utils/seo/festivales/datos.ts";
import { filasCandidatas, parsearLista } from "../server/utils/seo/festivales/importar.ts";
import { filasDeFichaFija } from "../server/utils/seo/festivales/semilla.ts";

const aplicar = process.argv.includes("--aplicar");
const md = fs.readFileSync("docs/master/marketing/FESTIVALES_PENDIENTES.md", "utf8");

const fijas = FESTIVALES.map(filasDeFichaFija);
const candidatas = filasCandidatas(parsearLista(md), FESTIVALES.map((f) => f.slug));

const resumen = { festivales: fijas.length + candidatas.length, ediciones: fijas.filter((f) => f.edicion).length, convocatorias: fijas.filter((f) => f.convocatoria).length };
console.log(`\nDirectorio de festivales (${aplicar ? "APLICADO" : "SIMULACIÓN, no se ha escrito nada"})`);
console.log(`  Fichas fijas (datos.ts):  ${fijas.length} (${resumen.ediciones} ediciones, ${resumen.convocatorias} convocatorias)`);
console.log(`  Candidatas de la lista:   ${candidatas.length}`);

if (aplicar) {
  const f = await insertarSinPisar("catalogo_festivales", [...fijas.map((x) => x.festival), ...candidatas]);
  const e = await insertarSinPisar("catalogo_festival_ediciones", fijas.flatMap((x) => (x.edicion ? [x.edicion] : [])));
  const c = await insertarSinPisar("catalogo_festival_convocatorias", fijas.flatMap((x) => (x.convocatoria ? [x.convocatoria] : [])));
  console.log(`  Filas nuevas:             ${f} festivales, ${e} ediciones, ${c} convocatorias (las que ya existían no se tocan)`);
} else {
  console.log("\nPara escribir de verdad: npm run festivales:cargar -- --aplicar");
}
