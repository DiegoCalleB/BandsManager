/**
 * Barrido de `band_contacts.spotify_youtube`: sustituye los enlaces de Spotify inventados por el
 * artista verificado en la búsqueda real y completa los vacíos.
 *
 *   npm run spotify:bandas                  # solo informa (dry-run), no escribe nada
 *   npm run spotify:bandas -- --apply       # escribe los cambios
 *   npm run spotify:bandas -- --band=<id>   # limita el barrido a una banda
 *
 * Reglas (ver `planificarSpotifyBanda`): solo toca campos vacíos o enlaces de Spotify rotos;
 * nunca YouTube, webs ni enlaces válidos; y nunca borra: un enlace roto sin sustituto verificado
 * se deja como está y aparece en el informe. Cada UPDATE va acotado por `id` y `band_id`.
 * Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (y, mejor, SPOTIFY_CLIENT_ID/SECRET).
 */
import { getSupabase } from "../server/db/core.js";
import { resolverUrlSpotifyDeBanda } from "../server/services/spotifyService.js";
import { planificarSpotifyBanda } from "../server/utils/spotifyMatch.js";

const aplicar = process.argv.includes("--apply");
const soloBanda = process.argv.find((a) => a.startsWith("--band="))?.slice("--band=".length);
const PAUSA_MS = 250;

async function main() {
  const sb = getSupabase();
  let consulta = sb.from("band_contacts").select("id, band_id, nombre_banda, spotify_youtube");
  if (soloBanda) consulta = consulta.eq("band_id", soloBanda);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudo leer band_contacts: ${error.message}`);

  const filas = data || [];
  const cuentas = { completar: 0, reemplazar: 0, sin_sustituto: 0, mantener: 0, errores: 0 };
  console.log(`${aplicar ? "APLICANDO" : "DRY-RUN"}: ${filas.length} bandas${soloBanda ? ` (banda ${soloBanda})` : ""}`);

  for (const fila of filas) {
    const nombre = String(fila.nombre_banda || "").trim();
    if (!nombre) continue;

    // Solo se consulta Spotify si hay algo que arreglar: ahorra llamadas con las bandas ya bien.
    const previo = planificarSpotifyBanda(fila.spotify_youtube, "https://open.spotify.com/artist/x");
    if (previo.accion === "mantener") {
      cuentas.mantener++;
      continue;
    }

    const verificada = await resolverUrlSpotifyDeBanda(nombre);
    const plan = planificarSpotifyBanda(fila.spotify_youtube, verificada);
    cuentas[plan.accion]++;

    if (plan.accion === "sin_sustituto") {
      console.log(`  ? ${nombre}: enlace roto sin sustituto (${fila.spotify_youtube})`);
    } else if (plan.nuevo) {
      console.log(`  ${plan.accion === "completar" ? "+" : "~"} ${nombre}: ${fila.spotify_youtube || "(vacío)"} -> ${plan.nuevo}`);
      if (aplicar) {
        const { error: errUpd } = await sb
          .from("band_contacts")
          .update({ spotify_youtube: plan.nuevo })
          .eq("id", fila.id)
          .eq("band_id", fila.band_id);
        if (errUpd) {
          cuentas.errores++;
          console.warn(`    ! no se pudo guardar: ${errUpd.message}`);
        }
      }
    }
    await new Promise((r) => setTimeout(r, PAUSA_MS));
  }

  console.log(
    `Resumen: ${cuentas.completar} completadas, ${cuentas.reemplazar} reemplazadas, ` +
      `${cuentas.sin_sustituto} rotas sin sustituto, ${cuentas.mantener} sin tocar, ${cuentas.errores} errores.`,
  );
  if (!aplicar) console.log("Dry-run: no se ha escrito nada. Repite con --apply para guardar.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
