import { ensureSheetTabExists, getSheetsClient, getSpreadsheetId, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

export function epkConfigToRow(bandId: string, epk: any): any[] {
  return [
    bandId || "band-bakandeya",
    epk.biografia || "",
    epk.logoUrl || "",
    epk.dossierPdfUrl || "",
    epk.dossierPdfName || "",
    epk.dossierTextoExtra || "",
    epk.riderTecnico || "",
    epk.riderPdfUrl || "",
    epk.riderPdfName || "",
    epk.contactoBooking?.nombre || "",
    epk.contactoBooking?.email || "",
    epk.contactoBooking?.telefono || "",
    epk.enlacesRedes?.spotify || "",
    epk.enlacesRedes?.youtube || "",
    epk.enlacesRedes?.instagram || "",
    epk.enlacesRedes?.tiktok || "",
    JSON.stringify(epk.temasDestacadosIds || []),
    new Date().toISOString()
  ];
}

export function rowToEpkConfig(r: any[]): { bandId: string; epk: any } {
  let temas: string[] = [];
  try {
    if (r[16]) temas = JSON.parse(r[16]);
  } catch (e) {
    if (typeof r[16] === 'string') temas = r[16].split(',').map((s: string) => s.trim());
  }
  return {
    bandId: r[0] || "band-bakandeya",
    epk: {
      biografia: r[1] || "",
      logoUrl: r[2] || "",
      dossierPdfUrl: r[3] || "",
      dossierPdfName: r[4] || "",
      dossierTextoExtra: r[5] || "",
      riderTecnico: r[6] || "",
      riderPdfUrl: r[7] || "",
      riderPdfName: r[8] || "",
      contactoBooking: {
        nombre: r[9] || "",
        email: r[10] || "",
        telefono: r[11] || "",
      },
      enlacesRedes: {
        spotify: r[12] || "",
        youtube: r[13] || "",
        instagram: r[14] || "",
        tiktok: r[15] || "",
      },
      temasDestacadosIds: temas
    }
  };
}

export async function ensureEpkSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  const s = sheets || getSheetsClient();
  const id = spreadsheetId || getSpreadsheetId();
  if (!s || !id) return false;

  if (verifiedHeadersSet.has("dossier_epk")) return true;

  try {
    await ensureSheetTabExists(s, id, "dossier_epk");

    const response = await getValuesCached(s, {
      spreadsheetId: id,
      range: "dossier_epk!A1:R1",
    });

    const rows = response?.data?.values;
    if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0) {
      const headers = [
        "band_id", "biografia", "logo_url", "dossier_pdf_url", "dossier_pdf_name", "dossier_texto_extra", "rider_tecnico", "rider_pdf_url", "rider_pdf_name", "contacto_nombre", "contacto_email", "contacto_telefono", "spotify_url", "youtube_url", "instagram_url", "tiktok_url", "temas_destacados", "fecha_actualizacion"
      ];
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "dossier_epk!A1:R1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("dossier_epk");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureEpkSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("dossier_epk");
      return true;
    } else {
      console.warn("Notice ensuring dossier_epk sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchEpkConfigsFromSheet(fallbackMap: Record<string, any> = {}): Promise<Record<string, any>> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallbackMap;

  try {
    await ensureEpkSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "dossier_epk!A2:R",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallbackMap && Object.keys(fallbackMap).length > 0) {
        const rowsToWrite = Object.entries(fallbackMap).map(([bId, config]) => epkConfigToRow(bId, config));
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "dossier_epk!A:R",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: rowsToWrite },
        }));
        invalidateValuesCache("dossier_epk");
      }
      return fallbackMap;
    }

    const result: Record<string, any> = { ...fallbackMap };
    for (const r of rows) {
      if (r && r[0]) {
        const parsed = rowToEpkConfig(r);
        const existingEpk = result[parsed.bandId] || {};
        const mergedEpk: Record<string, any> = { ...existingEpk };
        for (const [k, v] of Object.entries(parsed.epk)) {
          if (v !== undefined && v !== null && v !== "") {
            mergedEpk[k] = v;
          } else if (mergedEpk[k] === undefined || mergedEpk[k] === null || mergedEpk[k] === "") {
            mergedEpk[k] = v;
          }
        }
        result[parsed.bandId] = mergedEpk;
      }
    }
    return result;
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading dossier_epk from sheet:", err?.message || err);
    }
    return fallbackMap;
  }
}

export async function updateEpkInSheet(bandId: string, epkConfig: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureEpkSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "dossier_epk!A2:R",
    });
    const rows = response.data.values || [];
    const targetId = bandId || "band-bakandeya";
    const rowIndex = rows.findIndex((row: any) => row[0] === targetId);

    if (rowIndex !== -1) {
      const range = `dossier_epk!A${rowIndex + 2}:R${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [epkConfigToRow(targetId, epkConfig)] },
      });
      invalidateValuesCache("dossier_epk");
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "dossier_epk!A:R",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [epkConfigToRow(targetId, epkConfig)] },
      });
      invalidateValuesCache("dossier_epk");
    }
  } catch (error) {
    console.error("Error updating dossier_epk in sheet:", error);
  }
}
