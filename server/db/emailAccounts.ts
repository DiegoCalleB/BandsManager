import { getSupabase, cleanBandId } from "./core.js";

export type EmailProvider = "gmail" | "outlook" | "other";

export interface BandEmailAccount {
  band_id: string;
  provider: EmailProvider;
  email: string;
  app_password: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  imap_host: string;
  imap_port: number;
  updated_at?: string;
}

// Sin respaldo en memoria a propósito: una contraseña de aplicación es una credencial real, y
// si Supabase no responde es preferible que el Enviador falle explícito (ver
// emailAgentClient.ts) a que se quede colgado de una copia en memoria potencialmente obsoleta
// de una credencial sensible.
export async function dbGetBandEmailAccount(bandId: string): Promise<BandEmailAccount | null> {
  const cleanId = cleanBandId(bandId);
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("band_email_accounts")
      .select("*")
      .eq("band_id", cleanId)
      .maybeSingle();

    if (error) {
      console.warn(`Notice leyendo cuenta de email para '${cleanId}':`, error.message || error);
      return null;
    }

    return data || null;
  } catch (e) {
    console.warn(`Fallo leyendo cuenta de email para '${cleanId}':`, e);
    return null;
  }
}

export async function dbUpsertBandEmailAccount(account: {
  band_id: string;
  provider: EmailProvider;
  email: string;
  app_password: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure?: boolean;
  imap_host: string;
  imap_port?: number;
}): Promise<BandEmailAccount> {
  const cleanId = cleanBandId(account.band_id);
  const payload = {
    band_id: cleanId,
    provider: account.provider,
    email: account.email,
    app_password: account.app_password,
    smtp_host: account.smtp_host,
    smtp_port: account.smtp_port,
    smtp_secure: account.smtp_secure ?? true,
    imap_host: account.imap_host,
    imap_port: account.imap_port ?? 993,
    updated_at: new Date().toISOString()
  };

  const sb = getSupabase();
  const { data, error } = await sb
    .from("band_email_accounts")
    .upsert(payload, { onConflict: "band_id" })
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || payload;
}

// app_password es una credencial de escritura, no de lectura: ninguna ruta HTTP debe
// devolverla nunca, ni en el GET ni haciendo eco del POST. Función pura y exportada aparte
// (en vez de repetir el destructuring en cada ruta) para poder verificarlo con un test
// unitario sin necesidad de montar Express.
export function toSafeEmailAccountResponse(account: BandEmailAccount | null): { connected: boolean; [key: string]: any } {
  if (!account) {
    return { connected: false };
  }
  const { app_password, ...safe } = account;
  return { connected: true, ...safe };
}
