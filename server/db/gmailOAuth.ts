// Cuentas Gmail OAuth2 por banda (`band_gmail_oauth_accounts`). `toSafeGmailOAuthResponse` oculta
// los tokens a la respuesta HTTP.

import { getSupabase, cleanBandId } from "./core.js";
import { encryptSecret, decryptSecret } from "../utils/secretCrypto.js";

export interface BandGmailOAuthAccount {
  band_id: string;
  gmail_email: string;
  refresh_token: string;
  scope: string;
  connected_at?: string;
  updated_at?: string;
}

// Sin respaldo en memoria a propósito, igual que dbGetBandEmailAccount: un refresh token es
// una credencial real, y si Supabase no responde es preferible que el llamante caiga al
// camino IMAP (ver agentEngine.ts) a que se quede colgado de una copia en memoria
// potencialmente obsoleta de una credencial sensible.
export async function dbGetBandGmailOAuth(bandId: string): Promise<BandGmailOAuthAccount | null> {
  const cleanId = cleanBandId(bandId);
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("band_gmail_oauth_accounts")
      .select("*")
      .eq("band_id", cleanId)
      .maybeSingle();

    if (error) {
      console.warn(`Notice leyendo OAuth de Gmail para '${cleanId}':`, error.message || error);
      return null;
    }

    return data ? { ...data, refresh_token: decryptSecret(data.refresh_token) } : null;
  } catch (e) {
    console.warn(`Fallo leyendo OAuth de Gmail para '${cleanId}':`, e);
    return null;
  }
}

export async function dbUpsertBandGmailOAuth(account: {
  band_id: string;
  gmail_email: string;
  refresh_token: string;
  scope: string;
}): Promise<BandGmailOAuthAccount> {
  const cleanId = cleanBandId(account.band_id);
  const payload = {
    band_id: cleanId,
    gmail_email: account.gmail_email,
    refresh_token: encryptSecret(account.refresh_token),
    scope: account.scope,
    updated_at: new Date().toISOString()
  };

  const sb = getSupabase();
  const { data, error } = await sb
    .from("band_gmail_oauth_accounts")
    .upsert(payload, { onConflict: "band_id" })
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return { ...(data || payload), refresh_token: account.refresh_token };
}

export async function dbDeleteBandGmailOAuth(bandId: string): Promise<void> {
  const cleanId = cleanBandId(bandId);
  const sb = getSupabase();
  const { error } = await sb.from("band_gmail_oauth_accounts").delete().eq("band_id", cleanId);
  if (error) {
    throw error;
  }
}

// refresh_token es una credencial de escritura, no de lectura: ninguna ruta HTTP debe
// devolverlo nunca. Misma razón y mismo patrón que toSafeEmailAccountResponse en
// emailAccounts.ts - función pura y exportada aparte para poder verificarlo con un test
// unitario sin montar Express.
export function toSafeGmailOAuthResponse(account: BandGmailOAuthAccount | null): { connected: boolean; [key: string]: any } {
  if (!account) {
    return { connected: false };
  }
  const { refresh_token, ...safe } = account;
  return { connected: true, ...safe };
}
