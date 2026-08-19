import { ensureSheetTabExists, getSheetsClient, getSpreadsheetId, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

export function templateConfigToRow(bandId: string, category: string, template: any): any[] {
  return [
    bandId || "band-bakandeya",
    category || template.category,
    template.title || "",
    template.subject || "",
    template.body || "",
    template.guidelines || "",
    template.toneRating ?? 5,
    template.contentRating ?? 5,
    template.customInstruction || "",
    JSON.stringify(template.feedbackLogs || []),
    template.updatedAt || new Date().toISOString()
  ];
}

export async function ensurePlantillasPautasSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  const s = sheets || getSheetsClient();
  const id = spreadsheetId || getSpreadsheetId();
  if (!s || !id) return false;

  if (verifiedHeadersSet.has("plantillas_pautas_ia")) return true;

  try {
    await ensureSheetTabExists(s, id, "plantillas_pautas_ia");

    const response = await getValuesCached(s, {
      spreadsheetId: id,
      range: "plantillas_pautas_ia!A1:K1",
    });

    const rows = response?.data?.values;
    if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0) {
      const headers = [
        "band_id", "categoria", "titulo_categoria", "asunto", "cuerpo_plantilla", "pautas_ia", "estrellas_tono", "estrellas_contenido", "instruccion_reciente", "historial_feedback_json", "fecha_actualizacion"
      ];
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "plantillas_pautas_ia!A1:K1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("plantillas_pautas_ia");
    return true;
  } catch (err: any) {
    console.warn("Notice ensuring plantillas_pautas_ia sheet:", err?.message || err);
    verifiedHeadersSet.add("plantillas_pautas_ia");
    return false;
  }
}

export async function syncCategoryTemplatesToSheet(bandId: string, categoryTemplatesMap: Record<string, any>): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensurePlantillasPautasSheet(sheets, spreadsheetId);
    const rowsToWrite = Object.entries(categoryTemplatesMap).map(([cat, cfg]) => 
      templateConfigToRow(bandId, cat, cfg)
    );

    await retrySheetsWrite(() => sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "plantillas_pautas_ia!A2:K" + (rowsToWrite.length + 1),
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rowsToWrite }
    }));
    invalidateValuesCache("plantillas_pautas_ia");
  } catch (error) {
    console.error("Error syncing plantillas_pautas_ia to sheet:", error);
  }
}
