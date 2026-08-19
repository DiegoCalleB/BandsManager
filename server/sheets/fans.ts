import { Fan } from "../../src/types.js";
import { ensureSheetTabExists, getServiceAccountEmail, getSheetId, getSheetsClient, getSpreadsheetId, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

// --- FANS (SEGUIDORES / TRIBU) ---

export async function ensureFansSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("fans")) return true;
  const s = sheets || getSheetsClient();
  const id = spreadsheetId || getSpreadsheetId();
  if (!s || !id) return false;

  try {
    await ensureSheetTabExists(s, id, "fans");
    const check = await getValuesCached(s, {
      spreadsheetId: id,
      range: "fans!A1:J1",
    });

    const headers = ["id", "nombre", "email", "ciudad", "como_conocio", "concierto_origen_id", "concierto_origen_nombre", "fecha_captura", "consentimiento_rgpd", "band_id"];
    const firstRow = check.data?.values?.[0];

    if (!firstRow || firstRow.length === 0 || !firstRow[0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "fans!A1:J1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [headers]
        }
      }));
      invalidateValuesCache("fans");
    } else if (String(firstRow[0]).trim().toLowerCase() !== "id") {
      const fansSheetId = await getSheetId(s, id, "fans");
      if (fansSheetId !== null) {
        await retrySheetsWrite(() => s.spreadsheets.batchUpdate({
          spreadsheetId: id,
          requestBody: {
            requests: [
              {
                insertDimension: {
                  range: {
                    sheetId: fansSheetId,
                    dimension: "ROWS",
                    startIndex: 0,
                    endIndex: 1
                  },
                  inheritFromBefore: false
                }
              }
            ]
          }
        }));
      }
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "fans!A1:J1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [headers]
        }
      }));
      invalidateValuesCache("fans");
    }
    verifiedHeadersSet.add("fans");
    return true;
  } catch (error: any) {
    const errMsg = String(error?.message || error);
    const isQuota = error?.status === 429 || error?.code === 429 || errMsg.toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureFansSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("fans");
      return true;
    }
    if (errMsg.includes("403") || errMsg.toLowerCase().includes("permission") || errMsg.toLowerCase().includes("caller does not have")) {
      console.error("❌ [Google Sheets PERMISSION ERROR in ensureFansSheet] La cuenta de servicio no tiene permisos de EDITOR en el spreadsheet. Asegúrate de compartir tu Google Sheet con el email de tu cuenta de servicio.");
    } else {
      console.warn("Notice ensuring fans sheet:", errMsg);
    }
    return false;
  }
}

export function fanToRow(fan: Fan): any[] {
  return [
    fan.id || "",
    fan.nombre || "",
    fan.email || "",
    fan.ciudad || "",
    fan.comoConocio || "",
    fan.conciertoOrigenId || "",
    fan.conciertoOrigenNombre || "",
    fan.fechaCaptura || "",
    fan.consentimientoRGPD ? "SÍ" : "NO",
    fan.band_id || (fan as any).bandId || ""
  ];
}

export function rowToFan(r: any[]): Fan {
  return {
    id: String(r[0] || "").trim(),
    nombre: String(r[1] || "").trim(),
    email: String(r[2] || "").trim(),
    ciudad: String(r[3] || "").trim(),
    comoConocio: String(r[4] || "").trim(),
    conciertoOrigenId: String(r[5] || "").trim(),
    conciertoOrigenNombre: String(r[6] || "").trim(),
    fechaCaptura: String(r[7] || "").trim(),
    consentimientoRGPD: String(r[8]).toUpperCase() === "SÍ" || String(r[8]).toUpperCase() === "SI" || r[8] === true,
    band_id: String(r[9] || "").trim()
  };
}

export async function fetchFansFromSheet(fallback: Fan[]): Promise<Fan[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureFansSheet(sheets, spreadsheetId);

    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "fans!A2:J",
    });

    const rows = response.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "fans!A:J",
          valueInputOption: "RAW",
          requestBody: { values: fallback.map(f => fanToRow(f)) }
        }));
        invalidateValuesCache("fans");
      }
      return fallback;
    }

    return rows.filter((r: any[]) => r[0] && String(r[0]).trim() !== "").map(rowToFan);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading fans from sheet:", err.message);
    }
    return fallback;
  }
}

export async function appendFanToSheet(fan: Fan) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) {
    const errReason = "Google Sheets client or SPREADSHEET_ID is not configured.";
    console.warn("⚠️ [appendFanToSheet]", errReason);
    throw new Error(errReason);
  }

  try {
    await ensureFansSheet(sheets, spreadsheetId);
    await retrySheetsWrite(() => sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "fans!A:J",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [fanToRow(fan)] }
    }));
    console.log(`Successfully appended Fan ${fan.email} to Google Sheet tab 'fans'`);
    invalidateValuesCache("fans");
  } catch (error: any) {
    const msg = error?.message || String(error);
    const saEmail = getServiceAccountEmail();
    if (msg.includes("403") || msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("caller does not have")) {
      const permErr = `❌ [Google Sheets PERMISSION ERROR] La cuenta de servicio (${saEmail}) no tiene permisos de EDITOR en el spreadsheet (ID: ${spreadsheetId}). Por favor, comparte tu Google Sheet con este correo otorgándole permisos de Editor.`;
      console.error(permErr);
      throw new Error(permErr);
    } else {
      console.error("Error appending fan to Google Sheet:", msg);
      throw new Error(`Error al guardar en Google Sheet: ${msg}`);
    }
  }
}

export async function deleteFanInSheet(id: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "fans!A2:A",
    });

    const rows = response.data?.values || [];
    const rowIndex = rows.findIndex((r: any[]) => r[0] === id);

    if (rowIndex >= 0) {
      const rowNumber = rowIndex + 2;
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `fans!A${rowNumber}:J${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [Array(10).fill("")] }
      }));
      invalidateValuesCache("fans");
    }
  } catch (error: any) {
    console.error("Error deleting fan in sheet:", error.message || error);
  }
}
