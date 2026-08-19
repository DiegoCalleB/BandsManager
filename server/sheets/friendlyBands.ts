import { ensureSheetTabExists, getSheetsClient, getSpreadsheetId, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

export function bandToRow(b: any): any[] {
  return [
    b.id || "",
    b.nombre_banda || "",
    b.estilo_musical || "",
    b.localizacion || "",
    b.estado_relacion || "",
    b.ultimo_contacto || "",
    b.contacto_nombre || "",
    b.email || "",
    b.telefono || "",
    b.instagram || "",
    b.spotify_youtube || "",
    b.aforo_promedio || 0,
    b.notas_colaboracion || "",
    b.ciudad_origen_swap || "",
    b.icono || "",
    b.imagen_url || "",
    b.band_id || b.bandId || ""
  ];
}

export function rowToBand(r: any[]): any {
  return {
    id: String(r[0] || ""),
    nombre_banda: String(r[1] || ""),
    estilo_musical: String(r[2] || ""),
    localizacion: String(r[3] || ""),
    estado_relacion: String(r[4] || "sin_contactar"),
    ultimo_contacto: String(r[5] || ""),
    contacto_nombre: String(r[6] || ""),
    email: String(r[7] || ""),
    telefono: String(r[8] || ""),
    instagram: String(r[9] || ""),
    spotify_youtube: String(r[10] || ""),
    aforo_promedio: Number(r[11]) || 0,
    notas_colaboracion: String(r[12] || ""),
    ciudad_origen_swap: String(r[13] || ""),
    icono: String(r[14] || ""),
    imagen_url: String(r[15] || ""),
    band_id: String(r[16] || "")
  };
}

export async function ensureBandasSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("bandas")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "bandas");
    
    const headers = [
      "id", "nombre_banda", "estilo_musical", "localizacion", "estado_relacion", "ultimo_contacto", 
      "contacto_nombre", "email", "telefono", "instagram", "spotify_youtube", "aforo_promedio", 
      "notas_colaboracion", "ciudad_origen_swap", "icono", "imagen_url", "band_id"
    ];
    
    const res = await getValuesCached(s, { spreadsheetId: id, range: "bandas!A1:Q1" });
    if (!res?.data?.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "bandas!A1:Q1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("bandas");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureBandasSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("bandas");
      return true;
    } else {
      console.warn("Notice ensuring bandas sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchBandsFromSheet(fallback: any[]): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "bandas!A2:Q",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "bandas!A:Q",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: fallback.map(b => bandToRow(b)) },
        }));
        invalidateValuesCache("bandas");
      }
      return fallback;
    }
    return rows.map(rowToBand).filter((b: any) => b.id);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading bands from sheet:", err?.message || err);
    }
    return fallback;
  }
}

export async function updateBandInSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "bandas!A2:Q",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === band.id);

    if (rowIndex !== -1) {
      const range = `bandas!A${rowIndex + 2}:Q${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [bandToRow(band)] },
      });
      invalidateValuesCache("bandas");
    } else {
      await appendBandToSheet(band);
    }
  } catch (error) {
    console.error("Error updating band in sheet:", error);
  }
}

export async function appendBandToSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureBandasSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "bandas!A:Q",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [bandToRow(band)] },
    });
    invalidateValuesCache("bandas");
  } catch (error) {
    console.error("Error appending band to sheet:", error);
  }
}

export async function deleteBandInSheet(bandId: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "bandas!A2:Q",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === bandId);

    if (rowIndex !== -1) {
      const range = `bandas!A${rowIndex + 2}:Q${rowIndex + 2}`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
      invalidateValuesCache("bandas");
    }
  } catch (error) {
    console.error("Error deleting band in sheet:", error);
  }
}
