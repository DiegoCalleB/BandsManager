import crypto from "crypto";
import { google } from "googleapis";

export function getColumnLetter(colIndex: number): string {
  let temp: number;
  let letter = '';
  let col = colIndex + 1;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

export function buildHeaderMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  if (!Array.isArray(headers)) return map;
  headers.forEach((h, idx) => {
    if (h) {
      const normalized = String(h).trim().toLowerCase();
      map[normalized] = idx;
    }
  });
  return map;
}

export function getSpreadsheetId(): string | null {
  const raw = (
    process.env.SPREADSHEET_ID ||
    process.env.GOOGLE_SPREADSHEET_ID ||
    process.env.SPREADSHEET_URL ||
    ""
  ).trim();

  if (!raw) return null;
  let val = raw;

  // Strip wrapping quotes
  while (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }

  // Extract ID from full Google Sheet URL e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
  const urlMatch = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  return val || null;
}

export function parsePrivateKey(rawKey?: string): string | null {
  if (!rawKey) return null;
  let key = rawKey.trim();

  // If passed as a JSON object string or contains JSON
  if (key.includes("{") && key.includes("}")) {
    try {
      const startIdx = key.indexOf("{");
      const endIdx = key.lastIndexOf("}") + 1;
      const jsonCandidate = key.substring(startIdx, endIdx);
      const parsed = JSON.parse(jsonCandidate);
      if (parsed.private_key) {
        key = parsed.private_key;
      } else if (parsed.privateKey) {
        key = parsed.privateKey;
      }
    } catch {
      // Not JSON
    }
  }

  // Remove wrapping quotes repeatedly
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Remove literal escaped newlines (\n, \r, \\n, \\r) and actual newlines completely
  key = key
    .split("\\n").join("")
    .split("\\r").join("")
    .split("\n").join("")
    .split("\r").join("")
    .replace(/\\"/g, '"')
    .trim();

  // Check if key is a base64-encoded JSON or base64-encoded PEM string
  // (Base64 for '{"' is 'ey', base64 for '-----BEGIN' is 'LS0t')
  if (!key.includes("BEGIN") && (key.startsWith("ey") || key.startsWith("LS0t") || key.includes("LS0t"))) {
    try {
      const decodedStr = Buffer.from(key, "base64").toString("utf8");
      if (decodedStr.includes("BEGIN") || decodedStr.includes("PRIVATE KEY") || decodedStr.includes("{")) {
        key = decodedStr;
        console.log("[Sheets Auth Fix] Decoded base64 PEM/JSON key string.");
      }
    } catch {
      // ignore
    }
  }

  // Check again for JSON if base64 decoded
  if (key.includes("{") && key.includes("}")) {
    try {
      const startIdx = key.indexOf("{");
      const endIdx = key.lastIndexOf("}") + 1;
      const jsonCandidate = key.substring(startIdx, endIdx);
      const parsed = JSON.parse(jsonCandidate);
      if (parsed.private_key) {
        key = parsed.private_key;
      } else if (parsed.privateKey) {
        key = parsed.privateKey;
      }
    } catch {
      // ignore
    }
  }

  // Extract base64 body if PEM headers exist
  const pemMatch = key.match(/(-----BEGIN\s+[A-Z0-9\s_]+-----)([\s\S]+?)(-----END\s+[A-Z0-9\s_]+-----)/i);

  let rawBody = "";
  if (pemMatch) {
    rawBody = pemMatch[2];
  } else {
    rawBody = key;
  }

  let cleanBody = rawBody
    .split("\\n").join("")
    .split("\\r").join("")
    .split("\n").join("")
    .split("\r").join("")
    .replace(/\\"/g, '"')
    .trim();

  cleanBody = cleanBody.replace(/[^A-Za-z0-9+/=]/g, "");

  // Strip leading artifact characters (like 'n' or 'rn') before 'MII' (standard PKCS#8 DER base64 sequence header)
  const miiIdx = cleanBody.indexOf("MII");
  if (miiIdx > 0 && miiIdx < 10) {
    console.log(`[Sheets Auth Fix] Stripping ${miiIdx} artifact characters before 'MII' base64 header.`);
    cleanBody = cleanBody.substring(miiIdx);
  }

  // Ensure base64 padding is valid (length multiple of 4)
  while (cleanBody.length % 4 !== 0) {
    cleanBody += "=";
  }

  if (cleanBody.length > 30) {
    const lines = cleanBody.match(/.{1,64}/g) || [cleanBody];
    const formattedKey = `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;

    // Validate with crypto.createPrivateKey
    try {
      const pKey = crypto.createPrivateKey(formattedKey);
      console.log(`[Sheets Auth Fix] Private key validated successfully! (${pKey.type} - ${pKey.asymmetricKeyType})`);
      return formattedKey;
    } catch (err: any) {
      console.warn("[Sheets Auth Fix] Standard PKCS#8 format failed validation:", err.message || err);

      // Try RSA Private Key format
      try {
        const rsaKey = `-----BEGIN RSA PRIVATE KEY-----\n${lines.join("\n")}\n-----END RSA PRIVATE KEY-----\n`;
        const pKey2 = crypto.createPrivateKey(rsaKey);
        console.log(`[Sheets Auth Fix] RSA private key format validated successfully! (${pKey2.type})`);
        return rsaKey;
      } catch (err2: any) {
        console.warn("[Sheets Auth Fix] RSA key format failed validation:", err2.message || err2);
      }

      console.warn("[Sheets Auth Fix] Private key failed crypto validation. Please verify GOOGLE_PRIVATE_KEY environment variable format.");
      return null;
    }
  }

  console.warn("[Google Sheets Auth] GOOGLE_PRIVATE_KEY does not contain valid PEM key content.");
  return null;
}

export function getServiceAccountEmail(): string {
  let email = (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.SERVICE_ACCOUNT_EMAIL ||
    process.env.CLIENT_EMAIL ||
    ""
  ).trim();

  const possibleJsonCreds = [
    process.env.GCP_SA_KEY,
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_CREDENTIALS,
    process.env.GOOGLE_SHEETS_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    process.env.GMAIL_CREDENTIALS_JSON,
  ];

  for (const jsonCreds of possibleJsonCreds) {
    if (jsonCreds && jsonCreds.trim().length > 0) {
      try {
        let rawStr = jsonCreds.trim();
        if (!rawStr.startsWith("{") && rawStr.length > 100 && !rawStr.includes(" ")) {
          try {
            const decoded = Buffer.from(rawStr, "base64").toString("utf-8");
            if (decoded.includes("{") && decoded.includes("private_key")) {
              rawStr = decoded;
            }
          } catch (_) {}
        }
        const parsed = typeof rawStr === "string" ? JSON.parse(rawStr) : rawStr;
        if (parsed.client_email) email = parsed.client_email.trim();
        if (email) break;
      } catch {}
    }
  }
  return email || "No detectado en variables de entorno";
}

export function getSheetsClient() {
  let email = (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.SERVICE_ACCOUNT_EMAIL ||
    process.env.CLIENT_EMAIL ||
    ""
  ).trim();

  let rawPrivateKey = (
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    ""
  );

  const possibleJsonCreds = [
    process.env.GCP_SA_KEY,
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_CREDENTIALS,
    process.env.GOOGLE_SHEETS_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    process.env.GMAIL_CREDENTIALS_JSON,
  ];

  for (const jsonCreds of possibleJsonCreds) {
    if (jsonCreds && jsonCreds.trim().length > 0) {
      try {
        let rawStr = jsonCreds.trim();
        // If base64 encoded
        if (!rawStr.startsWith("{") && rawStr.length > 100 && !rawStr.includes(" ")) {
          try {
            const decoded = Buffer.from(rawStr, "base64").toString("utf-8");
            if (decoded.includes("{") && decoded.includes("private_key")) {
              rawStr = decoded;
            }
          } catch (_) {}
        }
        const parsed = typeof rawStr === "string" ? JSON.parse(rawStr) : rawStr;
        if (parsed.client_email) email = parsed.client_email.trim();
        if (parsed.private_key) rawPrivateKey = parsed.private_key;
        if (email && rawPrivateKey) break;
      } catch {
        // not valid json
      }
    }
  }

  if (email && email.includes("{") && email.includes("}")) {
    try {
      const startIdx = email.indexOf("{");
      const endIdx = email.lastIndexOf("}") + 1;
      const parsed = JSON.parse(email.substring(startIdx, endIdx));
      if (parsed.client_email) email = parsed.client_email.trim();
      if (parsed.private_key && !rawPrivateKey) rawPrivateKey = parsed.private_key;
    } catch {
      // ignore
    }
  }

  if (rawPrivateKey && rawPrivateKey.includes("{") && rawPrivateKey.includes("}")) {
    try {
      const startIdx = rawPrivateKey.indexOf("{");
      const endIdx = rawPrivateKey.lastIndexOf("}") + 1;
      const parsed = JSON.parse(rawPrivateKey.substring(startIdx, endIdx));
      if (parsed.client_email && !email) email = parsed.client_email.trim();
      if (parsed.private_key) rawPrivateKey = parsed.private_key;
    } catch {
      // ignore
    }
  }

  if (!email || !rawPrivateKey) {
    return null;
  }

  const privateKey = parsePrivateKey(rawPrivateKey);
  if (!privateKey) {
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  } catch (error: any) {
    console.error("Error creating Google Sheets auth client:", error.message || error);
    return null;
  }
}

export async function ensureSheetTabExists(sheets: any, spreadsheetId: string, tabName: string) {
  const normalized = tabName.toLowerCase();
  if (verifiedTabsSet.has(normalized)) {
    return;
  }
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    if (meta.data.sheets) {
      meta.data.sheets.forEach((s: any) => {
        const title = s.properties?.title;
        if (title) verifiedTabsSet.add(title.toLowerCase());
        if (s.properties?.sheetId !== undefined && title) {
          sheetIdsMap.set(title.toLowerCase(), s.properties.sheetId);
        }
      });
    }
    if (!verifiedTabsSet.has(normalized)) {
      console.log(`Creating tab "${tabName}" in Google Sheet...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: tabName }
              }
            }
          ]
        }
      });
      verifiedTabsSet.add(normalized);
    }
  } catch (error: any) {
    const errMsg = error.message || String(error);
    const isQuota = error?.status === 429 || error?.code === 429 || errMsg.toLowerCase().includes("quota");
    if (isQuota) {
      console.warn(`[Google Sheets Rate Limit] Quota exceeded checking tab "${tabName}". Assuming tab exists.`);
      verifiedTabsSet.add(normalized);
      return;
    }
    if (errMsg.includes("DECODER routines") || errMsg.includes("unsupported")) {
      console.warn(`[Google Sheets Auth Error] Formato de GOOGLE_PRIVATE_KEY no soportado por OpenSSL crypto: ${errMsg}`);
    } else {
      console.warn(`Notice checking/creating tab "${tabName}":`, errMsg);
    }
  }
}

export async function getSheetId(sheets: any, spreadsheetId: string, tabName: string): Promise<number | null> {
  const normalized = tabName.toLowerCase();
  if (sheetIdsMap.has(normalized)) {
    return sheetIdsMap.get(normalized)!;
  }
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    if (meta.data.sheets) {
      meta.data.sheets.forEach((s: any) => {
        const title = s.properties?.title;
        if (title) {
          verifiedTabsSet.add(title.toLowerCase());
          if (s.properties?.sheetId !== undefined) {
            sheetIdsMap.set(title.toLowerCase(), s.properties.sheetId);
          }
        }
      });
    }
    return sheetIdsMap.get(normalized) ?? null;
  } catch (error) {
    return null;
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

export const valuesCache = new Map<string, CacheEntry>();

export const verifiedTabsSet = new Set<string>();

export const verifiedHeadersSet = new Set<string>();

export const sheetIdsMap = new Map<string, number>();

export async function retrySheetsWrite<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1500): Promise<T | null> {
  let delay = initialDelay;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isQuota = err?.status === 429 || err?.code === 429 || (err?.message && String(err.message).includes("Quota exceeded"));
      if (isQuota && attempt < maxRetries - 1) {
        console.warn(`[Google Sheets Rate Limit 429] Retrying write in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      } else {
        if (isQuota) {
          console.warn(`[Google Sheets Rate Limit 429] Quota exceeded after ${maxRetries} attempts. Local state remains preserved.`);
          return null;
        }
        throw err;
      }
    }
  }
  return null;
}

/**
 * Perform a cached values.get request to Google Sheets API.
 * Default TTL is 300,000ms (5 minutes).
 * On rate limit (429 / Quota Exceeded), returns cached data if available or empty fallback.
 */
export async function getValuesCached(
  sheets: any,
  params: { spreadsheetId: string; range: string },
  ttlMs = 300000
): Promise<any> {
  const cacheKey = `${params.spreadsheetId}:${params.range}`;
  const now = Date.now();
  const cached = valuesCache.get(cacheKey);

  // Enforce minimum cache TTL of 60 seconds (60,000ms) to prevent hitting Google Sheets rate limits
  const effectiveTtl = Math.max(ttlMs, 60000);

  if (cached && (now - cached.timestamp < effectiveTtl)) {
    return cached.data;
  }

  try {
    const response = await sheets.spreadsheets.values.get(params);
    valuesCache.set(cacheKey, { data: response, timestamp: now });
    return response;
  } catch (err: any) {
    const isQuotaError = err?.status === 429 || 
      err?.code === 429 || 
      String(err?.message || "").toLowerCase().includes("quota") ||
      String(err?.errors?.[0]?.message || "").toLowerCase().includes("quota");

    if (cached) {
      if (isQuotaError) {
        console.warn(`[Google Sheets Cache] Límite de cuota alcanzado para '${params.range}'. Usando datos cacheados (${Math.round((now - cached.timestamp) / 1000)}s de antigüedad).`);
      } else {
        console.warn(`[Google Sheets Cache] Error consultando '${params.range}'. Usando datos cacheados:`, err?.message || err);
      }
      return cached.data;
    }

    if (isQuotaError) {
      console.warn(`[Google Sheets Rate Limit] Excedida cuota de lectura para '${params.range}'. Retornando lista vacía (fallback).`);
      return { data: { values: [] } };
    }
    throw err;
  }
}

export function invalidateValuesCache(rangePrefix?: string) {
  if (!rangePrefix) {
    valuesCache.clear();
    return;
  }
  for (const key of valuesCache.keys()) {
    if (key.includes(rangePrefix)) {
      valuesCache.delete(key);
    }
  }
}

export async function ensureHeadersInSheet(
  sheets: any,
  spreadsheetId: string,
  tabName: string,
  defaultHeaders: string[]
): Promise<string[]> {
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: `${tabName}!1:1`,
    }, 5000);
    const existingHeaders: string[] = response.data?.values?.[0] || [];
    if (existingHeaders.length === 0) return defaultHeaders;

    const existingNormalized = new Set(existingHeaders.map(h => String(h).trim().toLowerCase()));
    const missingHeaders = defaultHeaders.filter(dh => !existingNormalized.has(dh.toLowerCase()));

    if (missingHeaders.length > 0) {
      const fullHeaders = [...existingHeaders, ...missingHeaders];
      const endColLetter = getColumnLetter(fullHeaders.length - 1);
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A1:${endColLetter}1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [fullHeaders] }
      }));
      invalidateValuesCache(tabName);
      console.log(`[Google Sheets] Updated row 1 headers in "${tabName}" with missing columns:`, missingHeaders);
      return fullHeaders;
    }
    return existingHeaders;
  } catch (error) {
    console.error(`Error ensuring headers in tab "${tabName}":`, error);
    return defaultHeaders;
  }
}
