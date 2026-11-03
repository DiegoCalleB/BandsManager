/**
 * Escritura de una canción SIN ventana en la que no exista.
 *
 * Antes: `delete` + `insert`. Si el insert fallaba (un error de la base, una columna que no existe, la red) la
 * canción ya estaba borrada y se perdía; y dos guardados a la vez se pisaban con un error de clave duplicada
 * (visto en producción, 1-nov). Además cada guardado de formulario borraba de paso todo lo que el payload no
 * lleva: energía medida, `energia_manual`, marcas de «detectado automáticamente», la fecha de alta…
 *
 * Ahora: un `UPDATE` (una sola sentencia atómica), acotado a las variantes de band_id de la banda: nunca toca
 * la canción de otra. Solo si no existe se hace `INSERT`; si otra petición la creó justo antes (23505), se
 * actualiza esa fila. Nunca se borra. Posible desde que `fn_capture_row_history` devuelve NEW en los UPDATE
 * (migración 20261005181506): antes un UPDATE se cancelaba en silencio y de ahí venía el delete + insert.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

type Fila = Record<string, unknown>;
interface ResultadoEscritura {
  data: Fila | null;
  error: { code?: string; message: string } | null;
}

/** Columnas de migraciones recientes: si la base aún no las tiene se guarda sin ellas en vez de fallar. */
export const COLUMNAS_OPCIONALES = [
  "notas_miembros", "notas_por_miembro", "notas_repertorio",
  "energia_variacion", "energia_variacion_calculada_en",
  "bpm_detectado_en", "tonalidad_detectada_en",
];

/** Formas en que pudo guardarse un band_id (con o sin band-/reg-): las mismas que admite dbGetSongs. */
export function variantesDeBanda(...ids: Array<string | undefined>): string[] {
  const todas = ids.filter((i): i is string => !!i?.trim()).flatMap((raw) => {
    const limpio = raw.trim();
    const sinPrefijo = limpio.replace(/^(band|reg)-/, "");
    return [limpio, sinPrefijo, `band-${sinPrefijo}`, `reg-${sinPrefijo}`];
  });
  return Array.from(new Set(todas));
}

async function escribir(sb: SupabaseClient, payload: Fila, bandas: string[]): Promise<ResultadoEscritura> {
  // La fecha de alta no se toca al actualizar.
  const { created_at: _alta, ...paraActualizar } = payload;
  const actualizar = (): Promise<ResultadoEscritura> =>
    Promise.resolve(sb.from("songs").update(paraActualizar).eq("id", payload.id as string).in("band_id", bandas).select().maybeSingle());

  const primero = await actualizar();
  if (primero.error || primero.data) return primero;

  const alta = await sb.from("songs").insert(payload).select().single();
  if (alta.error?.code === "23505") {
    // Otra petición la creó justo antes: se actualiza esa fila en vez de pelear por la clave.
    const otra = await actualizar();
    if (otra.data) return otra;
  }
  return alta;
}

/** Guarda la canción; devuelve la fila guardada o lanza con el motivo. Sin las columnas opcionales si la base no las tiene. */
export async function guardarCancion(sb: SupabaseClient, payload: Fila, bandas: string[]): Promise<Fila> {
  let r = await escribir(sb, payload, bandas);
  const mensaje = r.error?.message.toLowerCase() ?? "";
  if (r.error && COLUMNAS_OPCIONALES.some((c) => mensaje.includes(c))) {
    const reducido = { ...payload };
    for (const c of COLUMNAS_OPCIONALES) delete reducido[c];
    r = await escribir(sb, reducido, bandas);
  }
  if (r.error) throw new Error(`Supabase Error (upsert song): ${r.error.message}`);
  return r.data ?? payload;
}
