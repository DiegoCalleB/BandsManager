import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export interface DbAlertSettingsConfig {
  band_id: string;
  email_notifications_enabled: boolean;
  in_app_notifications_enabled: boolean;
  digest_frequency: string;
  recipient_email?: string;
  recipient_role?: string;
  rules: any[];
  updated_at?: string;
}

export async function dbGetAlertSettings(bandId: string): Promise<DbAlertSettingsConfig | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const targetBand = cleanBandId(bandId);
  const { data, error } = await sb
    .from('band_alert_settings')
    .select('*')
    .eq('band_id', targetBand)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error(`[AlertSettings DB] Error consultando alertas para ${targetBand}:`, error);
    return null;
  }

  return data as DbAlertSettingsConfig | null;
}

export async function dbUpsertAlertSettings(bandId: string, config: Partial<DbAlertSettingsConfig>): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const targetBand = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBand);

  const payload = {
    band_id: targetBand,
    email_notifications_enabled: config.email_notifications_enabled ?? true,
    in_app_notifications_enabled: config.in_app_notifications_enabled ?? true,
    digest_frequency: config.digest_frequency || 'weekly_digest',
    recipient_email: config.recipient_email || '',
    recipient_role: config.recipient_role || 'leader_only',
    rules: config.rules || [],
    updated_at: new Date().toISOString()
  };

  const { error } = await sb
    .from('band_alert_settings')
    .upsert(payload, { onConflict: 'band_id' });

  if (error) {
    console.error(`[AlertSettings DB] Error guardando alertas para ${targetBand}:`, error);
    return false;
  }

  return true;
}
