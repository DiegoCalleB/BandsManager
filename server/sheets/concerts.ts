import { Concert, Rehearsal } from "../../src/types.js";
import { ensureSheetTabExists, getSheetsClient, getValuesCached, invalidateValuesCache } from "./core.js";

export function concertToRow(c: Concert): any[] {
  return [
    c.id || "",
    c.fecha || "",
    c.ciudad || "",
    c.sala || "",
    c.direccion || "",
    c.cache || "",
    c.aforo_vendido || 0,
    c.aforo_total || 0,
    c.contrato_firmado ? "SÍ" : "NO",
    c.estado_pago || "pendiente",
    c.notas || "",
    c.tipo || "sala",
    c.band_id || (c as any).bandId || ""
  ];
}

export function rehearsalToRow(r: Rehearsal): any[] {
  return [
    r.id || "",
    r.fecha || "",
    r.hora || "",
    r.lugar || "",
    Array.isArray(r.asistentes) ? r.asistentes.join(", ") : (r.asistentes || ""),
    r.estado || "programado",
    r.notas || "",
    r.band_id || (r as any).bandId || ""
  ];
}

export async function fetchRehearsalsFromSheet(fallback: Rehearsal[]): Promise<Rehearsal[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "ensayos!A2:H",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `reh-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `reh-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);
      return {
        id,
        fecha: r[1] || "",
        hora: r[2] || "",
        lugar: r[3] || "",
        asistentes: r[4] ? r[4].split(",").map((s: string) => s.trim()) : [],
        estado: r[5] || "programado",
        notas: r[6] || "",
        band_id: r[7] || ""
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching rehearsals from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchConcertsFromSheet(fallback: Concert[]): Promise<Concert[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "conciertos!A2:M",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `cnc-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `cnc-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);

      let direccion = "";
      let cache = "";
      let aforo_vendido = 0;
      let aforo_total = 0;
      let contrato_firmado = false;
      let estado_pago: 'pendiente' | 'pagado' | 'anticipo' = 'pendiente';
      let notas = "";
      let tipo: 'sala' | 'festival' | 'ayuntamiento' = "sala";
      let band_id = "";

      if (r.length >= 13) {
        direccion = r[4] || "";
        cache = r[5] || "";
        aforo_vendido = Number(r[6]) || 0;
        aforo_total = Number(r[7]) || 0;
        contrato_firmado = String(r[8]).toUpperCase() === "SÍ" || String(r[8]).toUpperCase() === "SI" || r[8] === true;
        estado_pago = (r[9] as any) || "pendiente";
        notas = r[10] || "";
        tipo = (r[11] as any) || "sala";
        band_id = r[12] || "";
      } else if (r.length >= 12) {
        direccion = r[4] || "";
        cache = r[5] || "";
        aforo_vendido = Number(r[6]) || 0;
        aforo_total = Number(r[7]) || 0;
        contrato_firmado = String(r[8]).toUpperCase() === "SÍ" || String(r[8]).toUpperCase() === "SI" || r[8] === true;
        estado_pago = (r[9] as any) || "pendiente";
        notas = r[10] || "";
        tipo = (r[11] as any) || "sala";
      } else {
        cache = r[4] || "";
        aforo_vendido = Number(r[5]) || 0;
        aforo_total = Number(r[6]) || 0;
        contrato_firmado = String(r[7]).toUpperCase() === "SÍ" || String(r[7]).toUpperCase() === "SI" || r[7] === true;
        estado_pago = (r[8] as any) || "pendiente";
        notas = r[9] || "";
        tipo = (r[10] as any) || "sala";
      }

      return {
        id,
        fecha: r[1] || "",
        ciudad: r[2] || "",
        sala: r[3] || "",
        direccion,
        cache: Number(cache) || 0,
        aforo_vendido,
        aforo_total,
        contrato_firmado,
        estado_pago,
        notas,
        tipo,
        band_id
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching concerts from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchLogisticsFromSheet(fallbackRos: Record<string, any[]>, fallbackGear: Record<string, any[]>): Promise<{ runOfShow: Record<string, any[]>; gearChecklists: Record<string, any[]> }> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return { runOfShow: fallbackRos, gearChecklists: fallbackGear };
  try {
    const runOfShow: Record<string, any[]> = { ...fallbackRos };
    const gearChecklists: Record<string, any[]> = { ...fallbackGear };

    const rosRes = await getValuesCached(sheets, {
      spreadsheetId,
      range: "logistica_horarios!A2:E",
    });
    if (rosRes.data?.values) {
      rosRes.data.values.forEach((r: any[]) => {
        const dateKey = r[0];
        if (dateKey) {
          if (!runOfShow[dateKey]) runOfShow[dateKey] = [];
          const existingIdx = runOfShow[dateKey].findIndex((i: any) => i.id === r[1]);
          const item = {
            id: r[1] || `ros-${Date.now()}`,
            time: r[2] || "",
            activity: r[3] || "",
            done: String(r[4]).toUpperCase() === "SÍ" || String(r[4]).toUpperCase() === "SI" || r[4] === true
          };
          if (existingIdx !== -1) {
            runOfShow[dateKey][existingIdx] = item;
          } else {
            runOfShow[dateKey].push(item);
          }
        }
      });
    }

    const gearRes = await getValuesCached(sheets, {
      spreadsheetId,
      range: "logistica_equipo!A2:D",
    });
    if (gearRes.data?.values) {
      gearRes.data.values.forEach((r: any[]) => {
        const dateKey = r[0];
        if (dateKey) {
          if (!gearChecklists[dateKey]) gearChecklists[dateKey] = [];
          const existingIdx = gearChecklists[dateKey].findIndex((i: any) => i.id === r[1]);
          const item = {
            id: r[1] || `gear-${Date.now()}`,
            label: r[2] || "",
            checked: String(r[3]).toUpperCase() === "SÍ" || String(r[3]).toUpperCase() === "SI" || r[3] === true
          };
          if (existingIdx !== -1) {
            gearChecklists[dateKey][existingIdx] = item;
          } else {
            gearChecklists[dateKey].push(item);
          }
        }
      });
    }

    return { runOfShow, gearChecklists };
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching logistics from sheet:", e?.message || e);
    }
    return { runOfShow: fallbackRos, gearChecklists: fallbackGear };
  }
}

export async function updateRehearsalInSheet(rehearsal: Rehearsal) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "ensayos");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "ensayos!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === rehearsal.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `ensayos!A${sheetRowNumber}:H${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [rehearsalToRow(rehearsal)] }
        });
        invalidateValuesCache("ensayos");
        return;
      }
    }
    await appendRehearsalToSheet(rehearsal);
  } catch (error) {
    console.error(`Error updating Rehearsal ${rehearsal.id} in Google Sheet:`, error);
  }
}

export async function appendRehearsalToSheet(rehearsal: Rehearsal) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "ensayos");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "ensayos!A:H",
      valueInputOption: "RAW",
      requestBody: { values: [rehearsalToRow(rehearsal)] }
    });
    invalidateValuesCache("ensayos");
  } catch (error) {
    console.error(`Error appending Rehearsal ${rehearsal.id} to Google Sheet:`, error);
  }
}

export async function updateConcertInSheet(concert: Concert) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "conciertos");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "conciertos!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === concert.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `conciertos!A${sheetRowNumber}:M${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [concertToRow(concert)] }
        });
        invalidateValuesCache("conciertos");
        return;
      }
    }
    await appendConcertToSheet(concert);
  } catch (error) {
    console.error(`Error updating Concert ${concert.id} in Google Sheet:`, error);
  }
}

export async function appendConcertToSheet(concert: Concert) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "conciertos");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "conciertos!A:M",
      valueInputOption: "RAW",
      requestBody: { values: [concertToRow(concert)] }
    });
    invalidateValuesCache("conciertos");
  } catch (error) {
    console.error(`Error appending Concert ${concert.id} to Google Sheet:`, error);
  }
}

export async function syncLogisticsToSheet(runOfShow: Record<string, any[]>, gearChecklists: Record<string, any[]>) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "logistica_horarios");
    await ensureSheetTabExists(sheets, spreadsheetId, "logistica_equipo");

    const rosHeaders = ["Fecha", "ID", "Hora", "Actividad", "Completado", "band_id"];
    const rosRows: any[] = [rosHeaders];
    if (runOfShow) {
      Object.entries(runOfShow).forEach(([dateKey, items]) => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            rosRows.push([dateKey, item.id || "", item.time || "", item.activity || "", item.done ? "SÍ" : "NO", item.band_id || item.bandId || ""]);
          });
        }
      });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "logistica_horarios!A1",
      valueInputOption: "RAW",
      requestBody: { values: rosRows }
    });

    const gearHeaders = ["Fecha", "ID", "Material", "Cargado", "band_id"];
    const gearRows: any[] = [gearHeaders];
    if (gearChecklists) {
      Object.entries(gearChecklists).forEach(([dateKey, items]) => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            gearRows.push([dateKey, item.id || "", item.label || "", item.checked ? "SÍ" : "NO", item.band_id || item.bandId || ""]);
          });
        }
      });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "logistica_equipo!A1",
      valueInputOption: "RAW",
      requestBody: { values: gearRows }
    });
    invalidateValuesCache("logistica");
  } catch (error) {
    console.error("Error syncing logistics to Google Sheet:", error);
  }
}
