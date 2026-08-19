import { ensureSheetTabExists, getSheetsClient, getSpreadsheetId, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

export function userToRow(u: any): any[] {
  return [
    u.id || "",
    u.username || u.email || "",
    u.name || u.bandName || "",
    u.email || u.username || "",
    u.role || "member",
    u.plan || "emergente",
    u.instrument || "Músico",
    u.avatarColor || "#3b82f6",
    u.createdAt || new Date().toISOString(),
    u.band_id || u.bandId || u.id || "band-1",
    u.passwordHash || "",
    u.salt || ""
  ];
}

export function rowToUser(r: any[]): any {
  return {
    id: String(r[0] || ""),
    username: String(r[1] || ""),
    name: String(r[2] || ""),
    email: String(r[3] || ""),
    role: String(r[4] || "member"),
    plan: String(r[5] || "emergente"),
    instrument: String(r[6] || "Músico"),
    avatarColor: String(r[7] || "#3b82f6"),
    createdAt: String(r[8] || ""),
    band_id: String(r[9] || r[0] || "band-1"),
    passwordHash: String(r[10] || ""),
    salt: String(r[11] || "")
  };
}

export function userBandToRow(ub: any): any[] {
  return [
    ub.id || "",
    ub.user_id || "",
    ub.band_id || "",
    ub.role || "member",
    ub.createdAt || new Date().toISOString()
  ];
}

export function rowToUserBand(r: any[]): any {
  return {
    id: String(r[0] || ""),
    user_id: String(r[1] || ""),
    band_id: String(r[2] || ""),
    role: String(r[3] || "member"),
    createdAt: String(r[4] || "")
  };
}

export async function ensureUsuariosBandasSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("usuarios_bandas")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "usuarios_bandas");
    
    const headers = ["id", "user_id", "band_id", "role", "createdAt"];
    
    const res = await getValuesCached(s, { spreadsheetId: id, range: "usuarios_bandas!A1:E1" });
    if (!res?.data?.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "usuarios_bandas!A1:E1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("usuarios_bandas");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureUsuariosBandasSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("usuarios_bandas");
      return true;
    } else {
      console.warn("Notice ensuring usuarios_bandas sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchUserBandsFromSheet(fallback: any[] = []): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios_bandas!A2:E",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "usuarios_bandas!A:E",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: fallback.map(userBandToRow) },
        }));
      }
      return fallback;
    }
    return rows.map(rowToUserBand).filter(ub => ub.id && ub.user_id && ub.band_id);
  } catch (error) {
    console.error("Error fetching user bands from sheet:", error);
    return fallback;
  }
}

export async function appendUserBandToSheet(userBand: any): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "usuarios_bandas!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [userBandToRow(userBand)] },
    });
    invalidateValuesCache("usuarios_bandas");
  } catch (error) {
    console.error("Error appending user band to sheet:", error);
  }
}

export async function updateUserBandInSheet(userBand: any): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios_bandas!A2:E",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === userBand.id);
    if (rowIndex !== -1) {
      const range = `usuarios_bandas!A${rowIndex + 2}:E${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [userBandToRow(userBand)] },
      });
      invalidateValuesCache("usuarios_bandas");
    } else {
      await appendUserBandToSheet(userBand);
    }
  } catch (error) {
    console.error("Error updating user band in sheet:", error);
  }
}

export async function deleteUserBandInSheet(userBandId: string): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios_bandas!A2:E",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === userBandId);
    if (rowIndex !== -1) {
      const range = `usuarios_bandas!A${rowIndex + 2}:E${rowIndex + 2}`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
      invalidateValuesCache("usuarios_bandas");
    }
  } catch (error) {
    console.error("Error deleting user band in sheet:", error);
  }
}

export async function ensureUsuariosSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("usuarios")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "usuarios");
    
    const headers = [
      "id", "username", "name", "email", "role", "plan",
      "instrument", "avatarColor", "createdAt", "band_id", "password_hash", "salt"
    ];
    
    const res = await getValuesCached(s, { spreadsheetId: id, range: "usuarios!A1:L1" });
    if (!res?.data?.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "usuarios!A1:L1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("usuarios");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureUsuariosSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("usuarios");
      return true;
    } else {
      console.warn("Notice ensuring usuarios sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchUsersFromSheet(fallback: any[] = []): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureUsuariosSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios!A2:L",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "usuarios!A:L",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: fallback.map(u => userToRow(u)) },
        }));
        invalidateValuesCache("usuarios");
      }
      return fallback;
    }
    return rows.map(rowToUser).filter((u: any) => u.id);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading users from sheet:", err?.message || err);
    }
    return fallback;
  }
}

export async function appendUserToSheet(user: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "usuarios!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [userToRow(user)] },
    });
    invalidateValuesCache("usuarios");
  } catch (error) {
    console.error("Error appending user to sheet:", error);
  }
}

export async function updateUserInSheet(user: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios!A2:L",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === user.id || row[1] === user.username);

    if (rowIndex !== -1) {
      const range = `usuarios!A${rowIndex + 2}:L${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [userToRow(user)] },
      });
      invalidateValuesCache("usuarios");
    } else {
      await appendUserToSheet(user);
    }
  } catch (error) {
    console.error("Error updating user in sheet:", error);
  }
}

export async function deleteUserInSheet(userId: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios!A2:J",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === userId);

    if (rowIndex !== -1) {
      const range = `usuarios!A${rowIndex + 2}:J${rowIndex + 2}`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
      invalidateValuesCache("usuarios");
    }
  } catch (error) {
    console.error("Error deleting user from sheet:", error);
  }
}
