/**
 * Sincroniza el catálogo compartido de salas con los leads de todas las bandas.
 *   npm run catalogo:salas              # simulación: informa de lo que haría y NO escribe nada
 *   npm run catalogo:salas -- --aplicar # escribe en Supabase
 * Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.
 */
import { sincronizarCatalogo } from "../server/services/catalogoSalas.ts";
import { puertoCatalogoSupabase } from "../server/db/salasCatalogo.ts";

const aplicar = process.argv.includes("--aplicar");
const r = await sincronizarCatalogo(puertoCatalogoSupabase, { simulacion: !aplicar });

console.log(`\nCatálogo de salas (${r.simulacion ? "SIMULACIÓN, no se ha escrito nada" : "APLICADO"})`);
console.log(`  Leads leídos:            ${r.leadsLeidos}`);
console.log(`  Sin nombre o ciudad:     ${r.leadsSinClave} (no entran)`);
console.log(`  Salas resultantes:       ${r.salasResultantes}`);
console.log(`  Duplicados fusionados:   ${r.duplicadosFusionados}`);
console.log(`  Salas nuevas:            ${r.salasNuevas}`);
console.log(`  Salas actualizadas:      ${r.salasActualizadas}`);
console.log(`  Salas sin cambios:       ${r.salasSinCambios}`);
console.log(`  Leads por enlazar:       ${r.leadsEnlazados}`);
console.log(`  Por nivel:               verificada ${r.porNivel.verificada} · probable ${r.porNivel.probable} · sin verificar ${r.porNivel.sin_verificar}`);
if (r.simulacion) console.log("\nPara escribir de verdad: npm run catalogo:salas -- --aplicar");
