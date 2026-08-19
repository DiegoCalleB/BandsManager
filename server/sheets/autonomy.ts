import { ensureSheetTabExists, getSheetsClient, getSpreadsheetId, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

export function autonomyConfigToRow(bandId: string, autonomy: any): any[] {
  return [
    bandId || "band-bakandeya",
    autonomy.dispatchLevel || "draft_only",
    autonomy.negotiationDepth || "filter_conditions",
    autonomy.minCacheThreshold ?? 300,
    autonomy.maxCacheThreshold ?? 800,
    autonomy.autoDeclineUnderMinCache ? "true" : "false",
    autonomy.notifyOnEveryProposal !== false ? "true" : "false",
    autonomy.requireHumanForFinalSignOff !== false ? "true" : "false",
    new Date().toISOString()
  ];
}

export function rowToAutonomyConfig(r: any[]): { bandId: string; autonomy: any } {
  return {
    bandId: r[0] || "band-bakandeya",
    autonomy: {
      dispatchLevel: r[1] || "draft_only",
      negotiationDepth: r[2] || "filter_conditions",
      minCacheThreshold: r[3] ? parseInt(r[3], 10) : 300,
      maxCacheThreshold: r[4] ? parseInt(r[4], 10) : 800,
      autoDeclineUnderMinCache: String(r[5]).toLowerCase() === "true",
      notifyOnEveryProposal: String(r[6]).toLowerCase() !== "false",
      requireHumanForFinalSignOff: String(r[7]).toLowerCase() !== "false"
    }
  };
}

export async function ensureAutonomiaSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  const s = sheets || getSheetsClient();
  const id = spreadsheetId || getSpreadsheetId();
  if (!s || !id) return false;

  if (verifiedHeadersSet.has("config_autonomia")) return true;

  try {
    await ensureSheetTabExists(s, id, "config_autonomia");

    const response = await getValuesCached(s, {
      spreadsheetId: id,
      range: "config_autonomia!A1:I1",
    });

    const rows = response?.data?.values;
    if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0) {
      const headers = [
        "band_id", "modo_envio", "profundidad_negociacion", "cache_minimo", "cache_objetivo", "auto_rechazar_bajo_minimo", "notificar_propuestas", "requiere_firma_humana", "fecha_actualizacion"
      ];
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "config_autonomia!A1:I1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("config_autonomia");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureAutonomiaSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("config_autonomia");
      return true;
    } else {
      console.warn("Notice ensuring config_autonomia sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchAutonomyConfigsFromSheet(fallbackMap: Record<string, any> = {}): Promise<Record<string, any>> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallbackMap;

  try {
    await ensureAutonomiaSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "config_autonomia!A2:I",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallbackMap && Object.keys(fallbackMap).length > 0) {
        const rowsToWrite = Object.entries(fallbackMap).map(([bId, config]) => autonomyConfigToRow(bId, config));
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "config_autonomia!A:I",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: rowsToWrite },
        }));
        invalidateValuesCache("config_autonomia");
      }
      return fallbackMap;
    }

    const result: Record<string, any> = { ...fallbackMap };
    for (const r of rows) {
      if (r && r[0]) {
        const parsed = rowToAutonomyConfig(r);
        const existing = result[parsed.bandId] || {};
        const merged: Record<string, any> = { ...existing };
        for (const [k, v] of Object.entries(parsed.autonomy)) {
          if (v !== undefined && v !== null && v !== "") {
            merged[k] = v;
          }
        }
        result[parsed.bandId] = merged;
      }
    }
    return result;
  } catch (err: any) {
    console.warn("Notice reading config_autonomia from sheet:", err?.message || err);
    return fallbackMap;
  }
}

export async function updateAutonomyInSheet(bandId: string, autonomyConfig: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureAutonomiaSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "config_autonomia!A2:I",
    });
    const rows = response.data.values || [];
    const targetId = bandId || "band-bakandeya";
    const rowIndex = rows.findIndex((row: any) => row[0] === targetId);

    if (rowIndex !== -1) {
      const range = `config_autonomia!A${rowIndex + 2}:I${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [autonomyConfigToRow(targetId, autonomyConfig)] },
      });
      invalidateValuesCache("config_autonomia");
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "config_autonomia!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [autonomyConfigToRow(targetId, autonomyConfig)] },
      });
      invalidateValuesCache("config_autonomia");
    }
  } catch (error) {
    console.error("Error updating config_autonomia in sheet:", error);
  }
}
