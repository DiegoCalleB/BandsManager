import { getSupabase, cleanBandId } from "./core.js";

export interface BandGmailToken {
  band_id: string;
  refresh_token: string;
  email_conectado: string | null;
  updated_at?: string;
}

// Sin respaldo en memoria a propósito: un refresh_token es una credencial real, y si
// Supabase no responde, es preferible que el Enviador falle explícito (ver
// gmailAgentClient.ts) a que se quede colgado de una copia en memoria potencialmente
// obsoleta de una credencial sensible.
export async function dbGetBandGmailToken(bandId: string): Promise<BandGmailToken | null> {
  const cleanId = cleanBandId(bandId);
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("band_gmail_tokens")
      .select("*")
      .eq("band_id", cleanId)
      .maybeSingle();

    if (error) {
      console.warn(`Notice leyendo token de Gmail para '${cleanId}':`, error.message || error);
      return null;
    }

    return data || null;
  } catch (e) {
    console.warn(`Fallo leyendo token de Gmail para '${cleanId}':`, e);
    return null;
  }
}

export async function dbUpsertBandGmailToken(token: {
  band_id: string;
  refresh_token: string;
  email_conectado?: string;
}): Promise<BandGmailToken> {
  const cleanId = cleanBandId(token.band_id);
  const payload = {
    band_id: cleanId,
    refresh_token: token.refresh_token,
    email_conectado: token.email_conectado || null,
    updated_at: new Date().toISOString()
  };

  const sb = getSupabase();
  const { data, error } = await sb
    .from("band_gmail_tokens")
    .upsert(payload, { onConflict: "band_id" })
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || payload;
}
