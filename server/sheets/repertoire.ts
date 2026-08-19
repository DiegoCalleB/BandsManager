import { Song, Setlist } from "../../src/types.js";
import { ensureSheetTabExists, getSheetsClient, getSpreadsheetId, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

export function songToRow(song: Song): any[] {
  return [
    song.id || "",
    song.titulo || "",
    song.duracion || "",
    song.duracionSegundos || 0,
    song.tonalidad || "",
    song.bpm || 120,
    song.afinacion || "",
    song.albumDisco || "",
    song.estadoTema || "listo",
    song.esVersionCovers ? "SÍ" : "NO",
    song.enlaceAcordes || "",
    song.notasInternas || "",
    song.audioPrincipalUrl || "",
    song.portadaUrl || "",
    JSON.stringify(song.audioIdeas || []),
    song.band_id || (song as any).bandId || ""
  ];
}

export function rowToSong(r: any[]): Song {
  let audioIdeas = [];
  if (r[14]) {
    try {
      audioIdeas = typeof r[14] === "string" ? JSON.parse(r[14]) : r[14];
    } catch {
      audioIdeas = [];
    }
  }
  return {
    id: String(r[0] || "").trim(),
    titulo: String(r[1] || "").trim(),
    duracion: String(r[2] || "03:30"),
    duracionSegundos: Number(r[3]) || 210,
    tonalidad: String(r[4] || "Am"),
    bpm: Number(r[5]) || 120,
    afinacion: String(r[6] || ""),
    albumDisco: String(r[7] || ""),
    estadoTema: (r[8] as any) || "listo",
    esVersionCovers: String(r[9]).toUpperCase() === "SÍ" || String(r[9]).toUpperCase() === "SI" || r[9] === true,
    enlaceAcordes: String(r[10] || ""),
    notasInternas: String(r[11] || ""),
    audioPrincipalUrl: String(r[12] || ""),
    portadaUrl: String(r[13] || ""),
    audioIdeas: Array.isArray(audioIdeas) ? audioIdeas : [],
    band_id: String(r[15] || "").trim()
  };
}

export function setlistToRow(st: Setlist): any[] {
  return [
    st.id || "",
    st.nombre || "",
    st.descripcion || "",
    st.tipoFormato || "",
    st.duracionTotalEstimadaMinutos || 0,
    st.fechaCreacion || "",
    st.fechaUltimaEdicion || "",
    JSON.stringify(st.items || []),
    st.band_id || (st as any).bandId || ""
  ];
}

export function rowToSetlist(r: any[]): Setlist {
  let items = [];
  if (r[7]) {
    try {
      items = typeof r[7] === "string" ? JSON.parse(r[7]) : r[7];
    } catch {
      items = [];
    }
  }
  return {
    id: String(r[0] || "").trim(),
    nombre: String(r[1] || "").trim(),
    descripcion: String(r[2] || ""),
    tipoFormato: (r[3] as any) || "sala_larga",
    duracionTotalEstimadaMinutos: Number(r[4]) || 0,
    fechaCreacion: String(r[5] || ""),
    fechaUltimaEdicion: String(r[6] || ""),
    items: Array.isArray(items) ? items : [],
    band_id: String(r[8] || "").trim()
  };
}

export async function ensureTemasYSetlistsSheets(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("canciones_y_repertorios")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;

    await ensureSheetTabExists(s, id, "canciones");
    try {
      const resC = await getValuesCached(s, { spreadsheetId: id, range: "canciones!A1:P1" });
      if (!resC?.data?.values || resC.data.values.length === 0) {
        const headers = ["id", "titulo", "duracion", "duracion_segundos", "tonalidad", "bpm", "afinacion", "album_disco", "estado_tema", "es_cover", "enlace_acordes", "notas_internas", "audio_principal_url", "portada_url", "audio_ideas_json", "band_id"];
        await s.spreadsheets.values.update({
          spreadsheetId: id,
          range: "canciones!A1:P1",
          valueInputOption: "RAW",
          requestBody: { values: [headers] }
        });
      }
    } catch (_) {}

    await ensureSheetTabExists(s, id, "repertorios");
    try {
      const resR = await getValuesCached(s, { spreadsheetId: id, range: "repertorios!A1:I1" });
      if (!resR?.data?.values || resR.data.values.length === 0) {
        const headers = ["id", "nombre", "descripcion", "tipo_formato", "duracion_estimada_min", "fecha_creacion", "fecha_ultima_edicion", "items_json", "band_id"];
        await s.spreadsheets.values.update({
          spreadsheetId: id,
          range: "repertorios!A1:I1",
          valueInputOption: "RAW",
          requestBody: { values: [headers] }
        });
      }
    } catch (_) {}

    verifiedHeadersSet.add("canciones_y_repertorios");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureTemasYSetlistsSheets] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("canciones_y_repertorios");
      return true;
    }
    console.warn("Notice ensuring canciones & repertorios sheets:", err?.message || err);
    return false;
  }
}

export async function fetchSongsFromSheet(fallback: Song[]): Promise<Song[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    await ensureTemasYSetlistsSheets(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "canciones!A2:P",
    });
    const rows = response.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        console.log("Populating initial canciones to Google Sheet in batch...");
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "canciones!A:P",
          valueInputOption: "RAW",
          requestBody: { values: fallback.map(s => songToRow(s)) }
        }));
        invalidateValuesCache("canciones");
      }
      return fallback;
    }
    const seen = new Set<string>();
    return rows.filter((r: any[]) => r[0] && String(r[0]).trim() !== "").map((r: any[], idx: number) => {
      let id = String(r[0]).trim();
      if (seen.has(id)) id = `${id}-${idx}`;
      seen.add(id);
      return rowToSong(r);
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.warn("Notice reading songs from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchSetlistsFromSheet(fallback: Setlist[]): Promise<Setlist[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    await ensureTemasYSetlistsSheets(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "repertorios!A2:I",
    });
    const rows = response.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        console.log("Populating initial repertorios to Google Sheet in batch...");
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "repertorios!A:I",
          valueInputOption: "RAW",
          requestBody: { values: fallback.map(st => setlistToRow(st)) }
        }));
        invalidateValuesCache("repertorios");
      }
      return fallback;
    }
    const seen = new Set<string>();
    return rows.filter((r: any[]) => r[0] && String(r[0]).trim() !== "").map((r: any[], idx: number) => {
      let id = String(r[0]).trim();
      if (seen.has(id)) id = `${id}-${idx}`;
      seen.add(id);
      return rowToSetlist(r);
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.warn("Notice reading setlists from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function updateSongInSheet(song: Song) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "canciones");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "canciones!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === song.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `canciones!A${sheetRowNumber}:P${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [songToRow(song)] }
        });
        invalidateValuesCache("canciones");
        return;
      }
    }
    await appendSongToSheet(song);
  } catch (error) {
    console.error(`Error updating Song ${song.id} in Google Sheet:`, error);
  }
}

export async function appendSongToSheet(song: Song) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "canciones");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "canciones!A:P",
      valueInputOption: "RAW",
      requestBody: { values: [songToRow(song)] }
    });
    invalidateValuesCache("canciones");
  } catch (error) {
    console.error(`Error appending Song ${song.id} to Google Sheet:`, error);
  }
}

export async function deleteSongInSheet(songId: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "canciones");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "canciones!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === songId);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: `canciones!A${sheetRowNumber}:P${sheetRowNumber}`
        });
        invalidateValuesCache("canciones");
      }
    }
  } catch (error) {
    console.error(`Error deleting Song ${songId} in Google Sheet:`, error);
  }
}

export async function updateSetlistInSheet(st: Setlist) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "repertorios");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "repertorios!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === st.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `repertorios!A${sheetRowNumber}:I${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [setlistToRow(st)] }
        });
        invalidateValuesCache("repertorios");
        return;
      }
    }
    await appendSetlistToSheet(st);
  } catch (error) {
    console.error(`Error updating Setlist ${st.id} in Google Sheet:`, error);
  }
}

export async function appendSetlistToSheet(st: Setlist) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "repertorios");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "repertorios!A:I",
      valueInputOption: "RAW",
      requestBody: { values: [setlistToRow(st)] }
    });
    invalidateValuesCache("repertorios");
  } catch (error) {
    console.error(`Error appending Setlist ${st.id} to Google Sheet:`, error);
  }
}

export async function deleteSetlistInSheet(stId: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "repertorios");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "repertorios!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === stId);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: `repertorios!A${sheetRowNumber}:I${sheetRowNumber}`
        });
        invalidateValuesCache("repertorios");
      }
    }
  } catch (error) {
    console.error(`Error deleting Setlist ${stId} in Google Sheet:`, error);
  }
}
