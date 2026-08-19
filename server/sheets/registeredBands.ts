import { ensureSheetTabExists, getSheetsClient, getSpreadsheetId, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

// ==================== REGISTRO DE NUEVAS BANDAS ====================

export function registeredBandToRow(b: any): any[] {
  return [
    b.id || "",
    b.fecha_registro || b.createdAt || new Date().toISOString(),
    b.nombre_banda || b.bandName || "",
    b.email || "",
    b.plan || "emergente",
    b.contacto_nombre || b.contactName || b.name || "",
    b.estilo_musical || b.style || "",
    b.localizacion || b.city || "España",
    b.telefono || "",
    b.instagram || "",
    b.spotify_youtube || "",
    b.aforo_promedio || 0,
    b.estado_cuenta || "activo",
    b.notas || "",
    b.band_id || b.bandId || b.id || "band-1",
    b.user_id || b.userId || b.owner_user_id || ""
  ];
}

export function rowToRegisteredBand(r: any[]): any {
  return {
    id: String(r[0] || ""),
    fecha_registro: String(r[1] || ""),
    nombre_banda: String(r[2] || ""),
    email: String(r[3] || ""),
    plan: String(r[4] || "emergente"),
    contacto_nombre: String(r[5] || ""),
    estilo_musical: String(r[6] || ""),
    localizacion: String(r[7] || ""),
    telefono: String(r[8] || ""),
    instagram: String(r[9] || ""),
    spotify_youtube: String(r[10] || ""),
    aforo_promedio: Number(r[11]) || 0,
    estado_cuenta: String(r[12] || "activo"),
    notas: String(r[13] || ""),
    band_id: String(r[14] || r[0] || "band-1"),
    user_id: String(r[15] || "")
  };
}

export async function ensureRegistroBandasSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("registro_bandas")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "registro_bandas");
    
    const headers = [
      "id", "fecha_registro", "nombre_banda", "email", "plan",
      "contacto_nombre", "estilo_musical", "localizacion", "telefono",
      "instagram", "spotify_youtube", "aforo_promedio", "estado_cuenta", "notas", "band_id", "user_id"
    ];
    
    const res = await getValuesCached(s, { spreadsheetId: id, range: "registro_bandas!A1:P1" });
    if (!res?.data?.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "registro_bandas!A1:P1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("registro_bandas");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureRegistroBandasSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("registro_bandas");
      return true;
    } else {
      console.warn("Notice ensuring registro_bandas sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchRegisteredBandsFromSheet(fallback: any[] = []): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureRegistroBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "registro_bandas!A2:P",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "registro_bandas!A:P",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: fallback.map(b => registeredBandToRow(b)) },
        }));
        invalidateValuesCache("registro_bandas");
      }
      return fallback;
    }
    return rows.map(rowToRegisteredBand).filter((b: any) => b.id);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading registered bands from sheet:", err?.message || err);
    }
    return fallback;
  }
}

export async function appendRegisteredBandToSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureRegistroBandasSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "registro_bandas!A:P",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [registeredBandToRow(band)] },
    });
    invalidateValuesCache("registro_bandas");
  } catch (error) {
    console.error("Error appending registered band to sheet:", error);
  }
}

export async function updateRegisteredBandInSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureRegistroBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "registro_bandas!A2:P",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === band.id || row[1] === band.band_id);

    if (rowIndex !== -1) {
      const range = `registro_bandas!A${rowIndex + 2}:P${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [registeredBandToRow(band)] },
      });
      invalidateValuesCache("registro_bandas");
    } else {
      await appendRegisteredBandToSheet(band);
    }
  } catch (error) {
    console.error("Error updating registered band in sheet:", error);
  }
}
