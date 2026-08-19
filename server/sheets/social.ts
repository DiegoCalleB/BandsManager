import { SocialPost, SocialMetric } from "../../src/types.js";
import { ensureSheetTabExists, getSheetsClient, getValuesCached, invalidateValuesCache } from "./core.js";

export function socialPostToRow(post: any): any[] {
  return [
    post.id || "",
    post.fecha || "",
    post.plataforma || "Instagram",
    post.contenido || "",
    post.estado || "borrador",
    post.responsable || "",
    post.band_id || post.bandId || ""
  ];
}

export async function updatePostInSheet(post: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "redes_sociales");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "redes_sociales!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === post.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `redes_sociales!A${sheetRowNumber}:G${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [socialPostToRow(post)] }
        });
        invalidateValuesCache("redes_sociales");
        return;
      }
    }
    await appendPostToSheet(post);
  } catch (error) {
    console.error(`Error updating SocialPost ${post.id} in Google Sheet:`, error);
  }
}

export async function appendPostToSheet(post: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "redes_sociales");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "redes_sociales!A:G",
      valueInputOption: "RAW",
      requestBody: { values: [socialPostToRow(post)] }
    });
    invalidateValuesCache("redes_sociales");
  } catch (error) {
    console.error(`Error appending SocialPost ${post.id} to Google Sheet:`, error);
  }
}

export function socialMetricToRow(metric: any): any[] {
  return [
    metric.id || "",
    metric.fecha || "",
    metric.instagram || 0,
    metric.tiktok || 0,
    metric.youtube || 0,
    metric.spotify || 0,
    metric.notas || "",
    metric.band_id || metric.bandId || ""
  ];
}

export async function updateMetricInSheet(metric: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "seguidores");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "seguidores!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === metric.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `seguidores!A${sheetRowNumber}:H${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [socialMetricToRow(metric)] }
        });
        invalidateValuesCache("seguidores");
        return;
      }
    }
    await appendMetricToSheet(metric);
  } catch (error) {
    console.error(`Error updating SocialMetric ${metric.id} in Google Sheet:`, error);
  }
}

export async function fetchPostsFromSheet(fallback: SocialPost[]): Promise<SocialPost[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "redes_sociales!A2:G",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `post-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `post-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);
      return {
        id,
        fecha: r[1] || "",
        plataforma: r[2] || "Instagram",
        contenido: r[3] || "",
        estado: r[4] || "borrador",
        responsable: r[5] || "",
        band_id: r[6] || ""
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching posts from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchMetricsFromSheet(fallback: SocialMetric[]): Promise<SocialMetric[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "seguidores!A2:H",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `met-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `met-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);
      
      // If 8 columns: id, fecha, instagram, tiktok, youtube, spotify, notas, band_id
      // If 7 columns: id, fecha, instagram, tiktok, youtube, notas, band_id
      const hasSpotifyCol = r.length >= 8 || (!isNaN(Number(r[5])) && r[5] !== "" && typeof r[5] !== "string" && !isNaN(parseFloat(r[5])));
      const spotifyVal = hasSpotifyCol ? Number(r[5]) || 0 : 0;
      const notasVal = hasSpotifyCol ? (r[6] || "") : (r[5] || "");
      const bandIdVal = hasSpotifyCol ? (r[7] || "") : (r[6] || "");

      return {
        id,
        fecha: r[1] || "",
        instagram: Number(r[2]) || 0,
        tiktok: Number(r[3]) || 0,
        youtube: Number(r[4]) || 0,
        spotify: spotifyVal,
        notas: notasVal,
        band_id: bandIdVal
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching metrics from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function appendMetricToSheet(metric: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "seguidores");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "seguidores!A:H",
      valueInputOption: "RAW",
      requestBody: { values: [socialMetricToRow(metric)] }
    });
  } catch (error) {
    console.error(`Error appending SocialMetric ${metric.id} to Google Sheet:`, error);
  }
}
