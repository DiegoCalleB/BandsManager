import { ensureSheetTabExists, getSheetsClient, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

// --- TOURS ---

export async function ensureToursSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("tours")) return true;
  const s = sheets || getSheetsClient();
  const id = spreadsheetId || process.env.SPREADSHEET_ID;
  if (!s || !id) return false;

  try {
    await ensureSheetTabExists(s, id, "tours");
    
    // Check headers
    const check = await getValuesCached(s, {
      spreadsheetId: id,
      range: "tours!A1:I1",
    });
    
    if (!check.data?.values || check.data.values.length === 0) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "tours!A1:I1",
        valueInputOption: "RAW",
        requestBody: {
          values: [["ID", "Nombre", "Vehículo", "Estado", "FechaInicio", "FechaFin", "Presupuesto", "Stops (JSON)", "band_id"]]
        }
      }));
      invalidateValuesCache("tours");
    }
    verifiedHeadersSet.add("tours");
    return true;
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.code === 429 || String(error?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureToursSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("tours");
      return true;
    }
    console.warn("Notice ensuring tours sheet:", error.message || error);
    return false;
  }
}

export function tourToRow(tour: any): any[] {
  return [
    tour.id || "",
    tour.nombre || "",
    tour.vehiculo || "",
    tour.estado || "",
    tour.fechaInicio || "",
    tour.fechaFin || "",
    tour.presupuestoLogistica || 0,
    JSON.stringify(tour.stops || []),
    tour.band_id || tour.bandId || ""
  ];
}

export function rowToTour(r: any[]): any {
  let stops = [];
  if (r[7]) {
    try {
      stops = typeof r[7] === "string" ? JSON.parse(r[7]) : r[7];
    } catch {
      stops = [];
    }
  }
  return {
    id: String(r[0] || "").trim(),
    nombre: String(r[1] || "").trim(),
    vehiculo: String(r[2] || "").trim(),
    estado: String(r[3] || "planificacion").trim(),
    fechaInicio: String(r[4] || "").trim(),
    fechaFin: String(r[5] || "").trim(),
    presupuestoLogistica: Number(r[6]) || 0,
    stops,
    band_id: String(r[8] || "").trim()
  };
}

export async function fetchToursFromSheet(fallback: any[]): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureToursSheet(sheets, spreadsheetId);
    
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "tours!A2:I",
    });
    
    const rows = response.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "tours!A:I",
          valueInputOption: "RAW",
          requestBody: { values: fallback.map(t => tourToRow(t)) }
        }));
        invalidateValuesCache("tours");
      }
      return fallback;
    }
    
    return rows.filter((r: any[]) => r[0] && String(r[0]).trim() !== "").map(rowToTour);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading tours from sheet:", err.message);
    }
    return fallback;
  }
}

export async function appendTourToSheet(tour: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureToursSheet(sheets, spreadsheetId);
    await retrySheetsWrite(() => sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "tours!A:I",
      valueInputOption: "RAW",
      requestBody: { values: [tourToRow(tour)] }
    }));
    invalidateValuesCache("tours");
  } catch (error: any) {
    console.error("Error appending tour:", error.message || error);
  }
}

export async function updateTourInSheet(tour: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "tours!A2:A",
    });
    
    const rows = response.data?.values || [];
    const rowIndex = rows.findIndex((r: any[]) => r[0] === tour.id);
    
    if (rowIndex >= 0) {
      const rowNumber = rowIndex + 2;
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `tours!A${rowNumber}:I${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [tourToRow(tour)] }
      }));
      invalidateValuesCache("tours");
    } else {
      await appendTourToSheet(tour);
    }
  } catch (error: any) {
    console.error("Error updating tour:", error.message || error);
  }
}

export async function deleteTourInSheet(id: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "tours!A2:A",
    });
    
    const rows = response.data?.values || [];
    const rowIndex = rows.findIndex((r: any[]) => r[0] === id);
    
    if (rowIndex >= 0) {
      const rowNumber = rowIndex + 2;
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `tours!A${rowNumber}:I${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [Array(9).fill("")] }
      }));
      invalidateValuesCache("tours");
    }
  } catch (error: any) {
    console.error("Error deleting tour:", error.message || error);
  }
}
