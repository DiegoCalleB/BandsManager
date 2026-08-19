import { Payment } from "../../src/types.js";
import { ensureSheetTabExists, getSheetsClient, getValuesCached, invalidateValuesCache } from "./core.js";

export function paymentToRow(p: Payment): any[] {
  return [
    p.id || "",
    p.tipo || "gasto",
    p.categoria || "",
    p.concepto || "",
    p.importe || 0,
    p.fecha || "",
    p.estado || "pendiente",
    p.band_id || (p as any).bandId || ""
  ];
}

export async function fetchPaymentsFromSheet(fallback: Payment[]): Promise<Payment[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "finanzas!A2:H",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `pay-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `pay-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);
      return {
        id,
        tipo: r[1] || "gasto",
        categoria: r[2] || "",
        concepto: r[3] || "",
        importe: Number(r[4]) || 0,
        fecha: r[5] || "",
        estado: r[6] || "pendiente",
        band_id: r[7] || ""
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching payments from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function appendPaymentToSheet(payment: Payment) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "finanzas");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "finanzas!A:H",
      valueInputOption: "RAW",
      requestBody: { values: [paymentToRow(payment)] }
    });
    invalidateValuesCache("finanzas");
  } catch (error) {
    console.error(`Error appending Payment ${payment.id} to Google Sheet:`, error);
  }
}

export async function updatePaymentInSheet(payment: Payment) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "finanzas");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "finanzas!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === payment.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `finanzas!A${sheetRowNumber}:H${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [paymentToRow(payment)] }
        });
        invalidateValuesCache("finanzas");
        return;
      }
    }
    await appendPaymentToSheet(payment);
  } catch (error) {
    console.error(`Error updating Payment ${payment.id} in Google Sheet:`, error);
  }
}
