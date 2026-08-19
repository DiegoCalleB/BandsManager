import { Lead, EmailMessage } from "../../src/types.js";
import { buildHeaderMap, ensureHeadersInSheet, ensureSheetTabExists, getColumnLetter, getSheetId, getSheetsClient, getSpreadsheetId, getValuesCached, invalidateValuesCache, retrySheetsWrite, verifiedHeadersSet } from "./core.js";

export const DEFAULT_LEADS_HEADERS = [
  "id", "nombre_sala", "ciudad", "region", "aforo", "genero", "email_contacto", "fuente", "estado", "pitch_generado", "fecha_envio", "fecha_ultima_respuesta", "notas",
  "direccion", "tipo", "telefono", "website", "instagram", "contacto_nombre", "contexto_extra", "hilo_emails", "icono", "imagen_url", "band_id",
  "es_favorito", "es_verificado", "fiabilidad_score"
];

function normalizeLeadStatus(status: any): any {
  if (!status) return 'nuevo';
  const s = String(status).trim().toLowerCase();
  if (s === 'sin_contacto') return 'nuevo';
  if (s === 'esperando') return 'esperando_respuesta';
  if (s === 'pendiente') return 'pendiente_aprobacion';
  if (s === 'enviado') return 'esperando_respuesta';
  if (s === 'por_contactar') return 'nuevo';
  if (s === 'por_aprobar') return 'pendiente_aprobacion';
  
  const valid = [
    'esperando_respuesta', 'pendiente_aprobacion', 'nuevo',
    'aprobado', 'interesado', 'negociando', 'no_interesado', 'rechazado'
  ];
  return valid.includes(s) ? s : 'nuevo';
}

function normalizeLeadType(type: any): string {
  if (!type) return 'sala';
  const s = String(type).trim().toLowerCase();
  if (s.includes('festi')) return 'festival';
  if (s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc')) return 'medio';
  return 'sala';
}

export function isSpanishPostalCode(val: any): boolean {
  if (!val) return false;
  const s = String(val).trim().replace(/\D/g, '');
  if (s.length !== 5) return false;
  const num = parseInt(s, 10);
  return num >= 1000 && num <= 52999;
}

export function rowToLeadDynamic(row: any[], headerMap: Record<string, number>): Lead {
  if (!Array.isArray(row) || row.length === 0) {
    return {
      id: `lead_${Math.random().toString(36).substring(2, 9)}`,
      nombre_sala: '',
      ciudad: '',
      region: '',
      aforo: 0,
      genero: '',
      tipo: 'sala',
      email_contacto: '',
      telefono: '',
      website: '',
      instagram: '',
      fuente: '',
      estado: 'nuevo',
      pitch_generado: '',
      notas: '',
      hilo_emails: []
    };
  }

  const getValByHeader = (...colNames: string[]) => {
    for (const name of colNames) {
      const idx = headerMap[name.toLowerCase()];
      if (idx !== undefined && idx < row.length && row[idx] !== undefined && row[idx] !== null && row[idx] !== "") {
        return row[idx];
      }
    }
    return undefined;
  };

  const strAt = (i: number) => String(row[i] ?? "").trim();
  const validStatuses = ['nuevo', 'pendiente_aprobacion', 'esperando_respuesta', 'aprobado', 'interesado', 'no_interesado', 'negociando', 'sin_contacto', 'rechazado', 'contactado', 'por_aprobar', 'por_contactar'];
  const isEmailStr = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && !s.startsWith('http') && !/\.(jpg|jpeg|png|webp)$/i.test(s);
  const isStatusStr = (s: string) => validStatuses.includes(s.toLowerCase());
  const isPhoneStr = (s: string) => /^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/.test(s) && !s.includes('@') && !s.startsWith('http') && s.replace(/\D/g, '').length >= 7;
  const isWebUrl = (s: string) => (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('www.') || /\.(com|es|org|cat|net)\b/i.test(s)) && !s.includes('@') && !/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(s);
  const isImgUrl = (s: string) => (s.startsWith('http') || s.startsWith('/uploads/')) && (/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(s) || s.includes('/storage/') || s.includes('/uploads/'));
  const isIgHandle = (s: string) => s.startsWith('@') || s.includes('instagram.com/');

  // Detect layout of the row
  const col6IsEmail = isEmailStr(strAt(6));
  const col8IsEmail = isEmailStr(strAt(8));
  const col8IsStatus = isStatusStr(strAt(8));
  const col14IsStatus = isStatusStr(strAt(14));

  let layoutType: 'OLD_24' | 'NEW_13' | 'HEADER_MAP' = 'NEW_13';

  if (col8IsEmail || col14IsStatus || (!col6IsEmail && col8IsEmail)) {
    layoutType = 'OLD_24';
  } else if (col6IsEmail || col8IsStatus) {
    layoutType = 'NEW_13';
  } else if (headerMap && Object.keys(headerMap).length > 0) {
    const mappedEmailIdx = headerMap['email_contacto'] ?? headerMap['email'] ?? headerMap['correo'];
    if (mappedEmailIdx !== undefined && mappedEmailIdx < row.length && isEmailStr(strAt(mappedEmailIdx))) {
      layoutType = 'HEADER_MAP';
    }
  }

  let idVal: string;
  let nombreSalaVal: string;
  let ciudadVal: string;
  let regionVal: string;
  let direccionVal: string | undefined;
  let rawAforo: any;
  let generoVal: string;
  let tipoVal: string;
  let emailVal: string;
  let telVal: string;
  let webVal: string;
  let instaVal: string;
  let contactoNombreVal: string | undefined;
  let fuenteVal: string;
  let estadoVal: any;
  let pitchVal: string;
  let fechaEnvioVal: string | undefined;
  let fechaUltimaRespVal: string | undefined;
  let contextoExtraVal: string | undefined;
  let notasVal: string;
  let hiloRaw: any;
  let iconoVal: string | undefined;
  let imagenUrlVal: string | undefined;
  let bandIdVal: string | undefined;
  let esFavoritoVal = false;
  let esVerificadoVal = false;
  let fiabilidadVal: number | undefined = undefined;

  if (layoutType === 'OLD_24') {
    idVal = strAt(0);
    nombreSalaVal = strAt(1);
    ciudadVal = strAt(2);
    regionVal = strAt(3);
    direccionVal = strAt(4) || undefined;
    rawAforo = row[5];
    generoVal = strAt(6);
    tipoVal = normalizeLeadType(row[7]);
    emailVal = strAt(8);
    telVal = strAt(9);
    webVal = strAt(10);
    instaVal = strAt(11);
    contactoNombreVal = strAt(12) || undefined;
    fuenteVal = strAt(13);
    estadoVal = normalizeLeadStatus(row[14]);
    pitchVal = strAt(15);
    fechaEnvioVal = strAt(16) || undefined;
    fechaUltimaRespVal = strAt(17) || undefined;
    contextoExtraVal = strAt(18) || undefined;
    notasVal = strAt(19);
    hiloRaw = row[20];
    iconoVal = strAt(21) || undefined;
    imagenUrlVal = strAt(22) || undefined;
    bandIdVal = strAt(23) || undefined;
  } else if (layoutType === 'NEW_13') {
    idVal = strAt(0);
    nombreSalaVal = strAt(1);
    ciudadVal = strAt(2);
    regionVal = strAt(3);
    rawAforo = row[4];
    generoVal = strAt(5);
    emailVal = strAt(6);
    fuenteVal = strAt(7);
    estadoVal = normalizeLeadStatus(row[8]);
    pitchVal = strAt(9);
    fechaEnvioVal = strAt(10) || undefined;
    fechaUltimaRespVal = strAt(11) || undefined;
    notasVal = strAt(12);
    direccionVal = strAt(13) || undefined;
    tipoVal = normalizeLeadType(row[14]);
    telVal = strAt(15);
    webVal = strAt(16);
    instaVal = strAt(17);
    contactoNombreVal = strAt(18) || undefined;
    contextoExtraVal = strAt(19) || undefined;
    hiloRaw = row[20];
    iconoVal = strAt(21) || undefined;
    imagenUrlVal = strAt(22) || undefined;
    bandIdVal = strAt(23) || undefined;
  } else {
    idVal = strAt(0) || String(getValByHeader("id") || "");
    nombreSalaVal = String(getValByHeader("nombre_sala", "nombre_medio", "medio", "nombre", "espacio", "sala", "medio_comunicacion") || "").trim();
    ciudadVal = String(getValByHeader("ciudad") || "").trim();
    regionVal = String(getValByHeader("region", "comunidad", "provincia") || "").trim();
    direccionVal = getValByHeader("direccion", "dir", "direccion_sala", "domicilio", "ubicacion") ? String(getValByHeader("direccion", "dir", "direccion_sala", "domicilio", "ubicacion")).trim() : undefined;
    rawAforo = getValByHeader("aforo", "capacidad");
    generoVal = String(getValByHeader("genero", "estilo") || "").trim();
    tipoVal = normalizeLeadType(getValByHeader("tipo", "tipo_medio", "categoria"));
    emailVal = String(getValByHeader("email_contacto", "email", "correo", "mail", "contacto_email") || "").trim();
    telVal = String(getValByHeader("telefono", "tel", "celular", "movil", "móvil", "telefono_contacto") || "").trim();
    webVal = String(getValByHeader("website", "web", "url", "sitio_web", "link") || "").trim();
    instaVal = String(getValByHeader("instagram", "insta", "ig") || "").trim();
    contactoNombreVal = getValByHeader("contacto_nombre", "contacto", "persona_contacto", "persona") ? String(getValByHeader("contacto_nombre", "contacto", "persona_contacto", "persona")).trim() : undefined;
    fuenteVal = String(getValByHeader("fuente", "origen", "canal") || "").trim();
    estadoVal = normalizeLeadStatus(getValByHeader("estado", "status"));
    pitchVal = String(getValByHeader("pitch_generado", "pitch") || "").trim();
    fechaEnvioVal = getValByHeader("fecha_envio") ? String(getValByHeader("fecha_envio")).trim() : undefined;
    fechaUltimaRespVal = getValByHeader("fecha_ultima_respuesta") ? String(getValByHeader("fecha_ultima_respuesta")).trim() : undefined;
    contextoExtraVal = getValByHeader("contexto_extra") ? String(getValByHeader("contexto_extra")).trim() : undefined;
    notasVal = String(getValByHeader("notas", "observaciones", "comentarios") || "").trim();
    hiloRaw = getValByHeader("hilo_emails");
    iconoVal = getValByHeader("icono", "logo", "icon", "emoji") ? String(getValByHeader("icono", "logo", "icon", "emoji")).trim() : undefined;
    imagenUrlVal = getValByHeader("imagen_url", "imagen", "photo_url", "foto", "avatar") ? String(getValByHeader("imagen_url", "imagen", "photo_url", "foto", "avatar")).trim() : undefined;
    bandIdVal = getValByHeader("band_id", "bandid") ? String(getValByHeader("band_id", "bandid")).trim() : undefined;
    esFavoritoVal = String(getValByHeader("es_favorito", "favorito", "fav") || "").toLowerCase() === 'true';
    esVerificadoVal = String(getValByHeader("es_verificado", "verificado") || "").toLowerCase() === 'true';
    fiabilidadVal = getValByHeader("fiabilidad_score", "fiabilidad") ? parseFloat(String(getValByHeader("fiabilidad_score", "fiabilidad"))) : undefined;
  }

  // Collect all non-empty cell strings for content sanitation
  const allCells = row.map(c => String(c ?? "").trim()).filter(Boolean);

  // SANITATION PASS:

  // 1. AFORO / CAPACITY & POSTAL CODE DEDUCTION
  let aforoVal = 0;
  let cpFoundInAforo: string | undefined = undefined;

  if (rawAforo !== undefined && rawAforo !== null && rawAforo !== "") {
    const rawAforoStr = String(rawAforo).trim();
    if (isSpanishPostalCode(rawAforoStr)) {
      cpFoundInAforo = rawAforoStr.replace(/\D/g, '');
      aforoVal = 0;
    } else {
      const numOnly = rawAforoStr.replace(/\D/g, '');
      if (numOnly) {
        const parsedNum = parseInt(numOnly, 10);
        if (isSpanishPostalCode(parsedNum)) {
          cpFoundInAforo = String(parsedNum).padStart(5, '0');
          aforoVal = 0;
        } else if (parsedNum >= 10 && parsedNum <= 20000) {
          aforoVal = parsedNum;
        }
      }
    }
  }

  // If postal code was found in rawAforo, preserve it in direccionVal
  if (cpFoundInAforo) {
    let currentDir = direccionVal || '';
    if (!currentDir.includes(cpFoundInAforo)) {
      direccionVal = currentDir ? `${currentDir}, CP ${cpFoundInAforo}` : `CP ${cpFoundInAforo}`;
    }
  }

  // If aforoVal is 0, search all cells for a real capacity value (explicit pax or valid non-postal number)
  if (aforoVal === 0) {
    for (const cell of allCells) {
      if (!cell || isEmailStr(cell) || isPhoneStr(cell) || isWebUrl(cell) || isImgUrl(cell) || isStatusStr(cell) || cell.startsWith('lead-') || cell.startsWith('scout-')) continue;

      const paxMatch = cell.match(/\b(\d{2,5})\s*(pax|personas|aforo|capacidad)?\b/i);
      if (paxMatch) {
        const parsed = parseInt(paxMatch[1], 10);
        if (!isSpanishPostalCode(parsed) && parsed >= 10 && parsed <= 20000) {
          aforoVal = parsed;
          break;
        }
      }
    }
  }

  // 2. EMAIL SANITATION
  if (!isEmailStr(emailVal)) {
    const foundEmail = allCells.find(c => isEmailStr(c));
    if (foundEmail) emailVal = foundEmail;
    else emailVal = '';
  }

  // 3. STATUS SANITATION
  if (!isStatusStr(estadoVal)) {
    const foundStatus = allCells.find(c => isStatusStr(c));
    if (foundStatus) {
      estadoVal = normalizeLeadStatus(foundStatus);
    } else {
      estadoVal = 'nuevo';
    }
  }

  // 4. PHONE SANITATION
  if (!isPhoneStr(telVal)) {
    const foundPhone = allCells.find(c => isPhoneStr(c) && c !== emailVal);
    if (foundPhone) telVal = foundPhone;
    else if (telVal === emailVal || isEmailStr(telVal) || isStatusStr(telVal)) telVal = '';
  }

  // 5. WEBSITE SANITATION
  if (!isWebUrl(webVal)) {
    const foundWeb = allCells.find(c => isWebUrl(c) && !isImgUrl(c));
    if (foundWeb) webVal = foundWeb;
    else if (webVal === emailVal || isEmailStr(webVal) || isStatusStr(webVal)) webVal = '';
  }

  // 6. INSTAGRAM SANITATION
  if (!isIgHandle(instaVal)) {
    const foundIg = allCells.find(c => isIgHandle(c));
    if (foundIg) instaVal = foundIg;
    else if (instaVal === emailVal || isEmailStr(instaVal) || isStatusStr(instaVal)) instaVal = '';
  }

  // 7. IMAGE URL SANITATION
  if (!imagenUrlVal || !isImgUrl(imagenUrlVal)) {
    const foundImg = allCells.find(c => isImgUrl(c));
    if (foundImg) imagenUrlVal = foundImg;
    else imagenUrlVal = undefined;
  }

  // 8. CITY & REGION SANITATION
  if (!ciudadVal || isEmailStr(ciudadVal) || isWebUrl(ciudadVal) || isImgUrl(ciudadVal) || isStatusStr(ciudadVal) || isPhoneStr(ciudadVal) || isSpanishPostalCode(ciudadVal)) {
    const foundLoc = allCells.find(c => c && c.length >= 3 && c.length <= 35 && !isEmailStr(c) && !isWebUrl(c) && !isImgUrl(c) && !isStatusStr(c) && !isPhoneStr(c) && !isSpanishPostalCode(c) && !c.startsWith('lead-') && !c.startsWith('scout-') && !/^\d+$/.test(c));
    if (foundLoc) ciudadVal = foundLoc;
    else ciudadVal = '';
  }

  // 9. NAME (nombre_sala) SANITATION
  if (!nombreSalaVal || isEmailStr(nombreSalaVal) || isWebUrl(nombreSalaVal) || isImgUrl(nombreSalaVal) || isStatusStr(nombreSalaVal) || isPhoneStr(nombreSalaVal) || isSpanishPostalCode(nombreSalaVal) || /^\d+$/.test(nombreSalaVal)) {
    const foundName = allCells.find(c => c && c.length >= 3 && c.length <= 80 && !isEmailStr(c) && !isWebUrl(c) && !isImgUrl(c) && !isStatusStr(c) && !isPhoneStr(c) && !isSpanishPostalCode(c) && !c.startsWith('lead-') && !c.startsWith('scout-') && !/^\d+$/.test(c) && c !== ciudadVal);
    if (foundName) nombreSalaVal = foundName;
    else if (!nombreSalaVal) nombreSalaVal = 'Espacio Sin Nombre';
  }

  // 10. TYPE SANITATION
  if (!tipoVal || !['sala', 'medio', 'festival', 'discoteca'].includes(tipoVal)) {
    const lowerName = (nombreSalaVal + " " + (generoVal || "")).toLowerCase();
    if (lowerName.includes('radio') || lowerName.includes('prensa') || lowerName.includes('revista') || lowerName.includes('blog') || lowerName.includes('magazine') || lowerName.includes('fanzine') || lowerName.includes('medio') || lowerName.includes('podcast') || lowerName.includes('tv')) {
      tipoVal = 'medio';
    } else if (lowerName.includes('festival') || lowerName.includes('fest')) {
      tipoVal = 'festival';
    } else if (lowerName.includes('discoteca') || lowerName.includes('club')) {
      tipoVal = 'discoteca';
    } else {
      tipoVal = 'sala';
    }
  }

  // 11. ID SANITATION
  if (!idVal || isEmailStr(idVal) || isStatusStr(idVal) || isPhoneStr(idVal) || isSpanishPostalCode(idVal)) {
    const foundId = allCells.find(c => c.startsWith('lead-') || c.startsWith('scout-') || c.startsWith('med-'));
    if (foundId) idVal = foundId;
    else idVal = `lead_${Math.random().toString(36).substring(2, 9)}`;
  }

  let hiloEmails: EmailMessage[] = [];
  if (hiloRaw && typeof hiloRaw === 'string' && !hiloRaw.startsWith("=")) {
    try {
      hiloEmails = JSON.parse(hiloRaw);
    } catch (e) {
      hiloEmails = [];
    }
  }

  return {
    id: idVal,
    nombre_sala: nombreSalaVal,
    ciudad: ciudadVal,
    region: regionVal,
    direccion: direccionVal,
    aforo: aforoVal,
    genero: generoVal,
    tipo: tipoVal,
    email_contacto: emailVal,
    telefono: telVal,
    website: webVal,
    instagram: instaVal,
    contacto_nombre: contactoNombreVal,
    fuente: fuenteVal || 'manual',
    estado: estadoVal,
    pitch_generado: pitchVal,
    fecha_envio: fechaEnvioVal,
    fecha_ultima_respuesta: fechaUltimaRespVal,
    contexto_extra: contextoExtraVal,
    notas: notasVal,
    hilo_emails: hiloEmails,
    icono: iconoVal,
    imagen_url: imagenUrlVal,
    band_id: bandIdVal,
    es_favorito: esFavoritoVal,
    es_verificado: esVerificadoVal,
    fiabilidad_score: fiabilidadVal
  };
}

export function leadToRowDynamic(
  lead: Lead,
  headers: string[],
  hilosSheetId: number | null = null,
  existingRow?: any[]
): any[] {
  const targetHeaders = (headers && headers.length >= 13) ? headers : DEFAULT_LEADS_HEADERS;
  const rowLength = Math.max(targetHeaders.length, existingRow ? existingRow.length : 0);
  const row: any[] = new Array(rowLength).fill("");

  // Only copy extra custom columns from existingRow beyond targetHeaders length
  if (existingRow && Array.isArray(existingRow) && existingRow.length > targetHeaders.length) {
    for (let i = targetHeaders.length; i < existingRow.length; i++) {
      row[i] = existingRow[i] || "";
    }
  }

  let hiloVal: string;
  if (hilosSheetId !== null) {
    hiloVal = `=IFERROR(HYPERLINK("#gid=${hilosSheetId}&range=A" & MATCH("${lead.id}", hilos_emails!B:B, 0), "Ver Hilo (${lead.hilo_emails?.length || 0} mensajes)"), "Ver Hilo (0 mensajes)")`;
  } else {
    hiloVal = lead.hilo_emails ? JSON.stringify(lead.hilo_emails) : "[]";
  }

  targetHeaders.forEach((h, idx) => {
    if (!h) return;
    const key = String(h).trim().toLowerCase();
    switch (key) {
      case "id":
        row[idx] = lead.id || "";
        break;
      case "nombre_sala":
      case "nombre_medio":
      case "medio":
      case "nombre":
      case "espacio":
      case "sala":
      case "medio_comunicacion":
        row[idx] = lead.nombre_sala || "";
        break;
      case "ciudad":
        row[idx] = lead.ciudad || "";
        break;
      case "region":
      case "comunidad":
      case "provincia":
        row[idx] = lead.region || "";
        break;
      case "direccion":
      case "dir":
      case "direccion_sala":
      case "domicilio":
      case "ubicacion":
        row[idx] = lead.direccion || "";
        break;
      case "aforo":
      case "capacidad":
        row[idx] = lead.aforo || 0;
        break;
      case "genero":
      case "estilo":
        row[idx] = lead.genero || "";
        break;
      case "tipo":
      case "tipo_medio":
      case "categoria":
        row[idx] = lead.tipo || "";
        break;
      case "email_contacto":
      case "email":
      case "correo":
      case "mail":
      case "contacto_email":
        row[idx] = lead.email_contacto || "";
        break;
      case "telefono":
      case "tel":
      case "celular":
      case "movil":
      case "móvil":
      case "telefono_contacto":
        row[idx] = lead.telefono || "";
        break;
      case "website":
      case "web":
      case "url":
      case "sitio_web":
      case "link":
        row[idx] = lead.website || "";
        break;
      case "instagram":
      case "insta":
      case "ig":
        row[idx] = lead.instagram || "";
        break;
      case "contacto_nombre":
      case "contacto":
      case "persona_contacto":
      case "persona":
        row[idx] = lead.contacto_nombre || "";
        break;
      case "fuente":
      case "origen":
      case "canal":
        row[idx] = lead.fuente || "";
        break;
      case "estado":
      case "status":
        row[idx] = normalizeLeadStatus(lead.estado);
        break;
      case "pitch_generado":
      case "pitch":
        row[idx] = lead.pitch_generado || "";
        break;
      case "fecha_envio":
        row[idx] = lead.fecha_envio || "";
        break;
      case "fecha_ultima_respuesta":
        row[idx] = lead.fecha_ultima_respuesta || "";
        break;
      case "contexto_extra":
        row[idx] = lead.contexto_extra || "";
        break;
      case "notas":
      case "observaciones":
      case "comentarios":
        row[idx] = lead.notas || "";
        break;
      case "hilo_emails":
        row[idx] = hiloVal;
        break;
      case "icono":
      case "logo":
      case "icon":
      case "emoji":
        row[idx] = lead.icono || "";
        break;
      case "imagen_url":
      case "imagen":
      case "photo_url":
      case "foto":
      case "avatar":
        row[idx] = lead.imagen_url || "";
        break;
      case "band_id":
      case "bandid":
        row[idx] = lead.band_id || (lead as any).bandId || "";
        break;
      case "es_favorito":
      case "favorito":
      case "fav":
        row[idx] = lead.es_favorito ? "true" : "false";
        break;
      case "es_verificado":
      case "verificado":
        row[idx] = lead.es_verificado ? "true" : "false";
        break;
      case "fiabilidad_score":
      case "fiabilidad":
        row[idx] = lead.fiabilidad_score !== undefined ? lead.fiabilidad_score : "";
        break;
      default:
        break;
    }
  });

  return row;
}

export function messageToRow(leadId: string, nombreSala: string, msg: any): any[] {
  return [
    msg.id || `em-${Date.now()}`,
    leadId || "",
    nombreSala || "",
    msg.fecha || "",
    msg.remitente || "sala",
    msg.remitente_nombre || "",
    msg.asunto || "",
    msg.mensaje || "",
    msg.band_id || msg.bandId || "",
  ];
}

export function rowToMessage(row: any[]): { leadId: string; msg: any } {
  return {
    leadId: String(row[1] || ""),
    msg: {
      id: String(row[0] || ""),
      fecha: String(row[3] || ""),
      remitente: (row[4] === 'banda' ? 'banda' : 'sala') as 'banda' | 'sala',
      remitente_nombre: String(row[5] || ""),
      asunto: String(row[6] || ""),
      mensaje: String(row[7] || ""),
    }
  };
}

/**
 * Verifies if the 'Medios' tab exists in the Google Sheet.
 * If it does not exist, creates it with the required header columns:
 * ID, Nombre, Tipo, Estado, Contacto, Notas.
 */
export async function ensureMediosSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("Medios")) return true;
  const tabName = "Medios";
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) {
      console.log("[ensureMediosSheet] Google Sheets credentials or Spreadsheet ID not configured.");
      return false;
    }

    await ensureSheetTabExists(s, id, tabName);

    try {
      const response = await getValuesCached(s, {
        spreadsheetId: id,
        range: `${tabName}!A1:F1`,
      });

      const values = response.data?.values;
      if (!values || values.length === 0 || !values[0] || values[0].length === 0) {
        console.log(`Writing required headers to "${tabName}" tab...`);
        const headers = ["ID", "Nombre", "Tipo", "Estado", "Contacto", "Notas"];
        await s.spreadsheets.values.update({
          spreadsheetId: id,
          range: `${tabName}!A1:F1`,
          valueInputOption: "RAW",
          requestBody: { values: [headers] },
        });
        console.log(`[ensureMediosSheet] Tab "${tabName}" initialized with headers: ${headers.join(", ")}`);
      }
    } catch (headerErr: any) {
      const isQuota = headerErr?.status === 429 || headerErr?.code === 429 || String(headerErr?.message || "").toLowerCase().includes("quota");
      if (isQuota) {
        console.warn(`[ensureMediosSheet] Quota limit hit for Google Sheets checking "${tabName}".`);
      } else {
        console.warn(`[ensureMediosSheet] Could not verify/write headers for "${tabName}":`, headerErr.message || headerErr);
      }
    }

    verifiedHeadersSet.add("Medios");
    return true;
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.code === 429 || String(error?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn(`[ensureMediosSheet] Quota limit hit for Google Sheets ensuring "${tabName}".`);
      verifiedHeadersSet.add("Medios");
      return true;
    }
    console.warn(`[ensureMediosSheet] Notice ensuring "${tabName}" sheet:`, error.message || error);
    return false;
  }
}

export async function fetchLeadsFromSheet(localLeads: Lead[]): Promise<Lead[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    console.log("Google Sheets credentials not set. Operating in local sandbox mode.");
    return localLeads;
  }

  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "leads");
    await ensureSheetTabExists(sheets, spreadsheetId, "hilos_emails");
    await ensureMediosSheet(sheets, spreadsheetId);

    // Fetch leads tab
    let leadsFromSheet: Lead[] = [];
    try {
      const response = await getValuesCached(sheets, {
        spreadsheetId,
        range: "leads!A1:ZZ",
      });
      const rows = response.data?.values;
      if (rows && rows.length > 0) {
        const headers = rows[0] || [];
        const headerMap = buildHeaderMap(headers);
        const dataRows = rows.slice(1);
        leadsFromSheet = dataRows.map(row => rowToLeadDynamic(row, headerMap));
      }
    } catch (e: any) {
      if (e?.status !== 429 && e?.code !== 429 && !String(e?.message || "").toLowerCase().includes("quota")) {
        console.error("Error reading leads tab:", e?.message || e);
      }
    }

    // Fetch Medios tab (if present)
    let mediosFromSheet: Lead[] = [];
    try {
      let responseMedios: any = null;
      try {
        responseMedios = await getValuesCached(sheets, {
          spreadsheetId,
          range: "Medios!A1:ZZ",
        });
      } catch (_) {
        responseMedios = await getValuesCached(sheets, {
          spreadsheetId,
          range: "medios!A1:ZZ",
        });
      }
      if (responseMedios?.data?.values && responseMedios.data.values.length > 1) {
        const rows = responseMedios.data.values;
        const headers = rows[0];
        const headerMap = buildHeaderMap(headers);
        const dataRows = rows.slice(1);
        mediosFromSheet = dataRows.map(row => {
          const l = rowToLeadDynamic(row, headerMap);
          if (!l.tipo || l.tipo === 'sala') l.tipo = 'medio';
          return l;
        });
      }
    } catch (e: any) {
      // Medios tab might not exist or be empty
    }

    const rawLeads = [...leadsFromSheet, ...mediosFromSheet];

    if (rawLeads.length === 0) {
      console.log("Sheet is empty. Bootstrapping with dynamic headers and default leads...");
      await bootstrapSheet(sheets, spreadsheetId, localLeads);
      await bootstrapHilosEmailsSheet(sheets, spreadsheetId, localLeads);
      return localLeads;
    }

    // Deduplicate leads by ID to prevent React duplicate key warnings
    const seenLeadIds = new Set<string>();
    const allSheetLeads: Lead[] = [];
    for (const l of rawLeads) {
      let leadId = (l.id || '').trim();
      if (!leadId) {
        leadId = `lead_${Math.random().toString(36).substring(2, 9)}`;
        l.id = leadId;
      }
      if (!seenLeadIds.has(leadId)) {
        seenLeadIds.add(leadId);
        allSheetLeads.push(l);
      } else {
        let counter = 2;
        let altId = `${leadId}_${counter}`;
        while (seenLeadIds.has(altId)) {
          counter++;
          altId = `${leadId}_${counter}`;
        }
        l.id = altId;
        seenLeadIds.add(altId);
        allSheetLeads.push(l);
      }
    }

    // Fetch and index hilos_emails
    let messagesByLeadId: { [leadId: string]: EmailMessage[] } = {};
    try {
      const hilosResponse = await getValuesCached(sheets, {
        spreadsheetId,
        range: "hilos_emails!A1:H",
      });
      const hilosRows = hilosResponse.data?.values || [];
      if (hilosRows.length <= 1) {
        await bootstrapHilosEmailsSheet(sheets, spreadsheetId, localLeads);
        for (const lead of localLeads) {
          if (lead.hilo_emails && lead.hilo_emails.length > 0) {
            messagesByLeadId[lead.id] = lead.hilo_emails;
          }
        }
      } else {
        const hilosData = hilosRows.slice(1);
        for (const row of hilosData) {
          const parsed = rowToMessage(row);
          if (parsed.leadId) {
            if (!messagesByLeadId[parsed.leadId]) {
              messagesByLeadId[parsed.leadId] = [];
            }
            messagesByLeadId[parsed.leadId].push(parsed.msg);
          }
        }
      }
    } catch (e: any) {
      console.error("Error reading hilos_emails tab:", e.message || e);
    }

    for (const lead of allSheetLeads) {
      if (messagesByLeadId[lead.id] && messagesByLeadId[lead.id].length > 0) {
        lead.hilo_emails = messagesByLeadId[lead.id].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      } else {
        const localLead = localLeads.find(l => l.id === lead.id);
        if (localLead && localLead.hilo_emails && localLead.hilo_emails.length > 0) {
          lead.hilo_emails = localLead.hilo_emails;
          await syncLeadMessagesInSheet(sheets, spreadsheetId, lead);
        } else {
          lead.hilo_emails = [];
        }
      }
    }
    return allSheetLeads;
  } catch (error: any) {
    console.error("Error fetching leads from Google Sheet, falling back to local:", error.message || error);
    return localLeads;
  }
}

export async function bootstrapSheet(sheets: any, spreadsheetId: string, leads: Lead[]) {
  try {
    const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");
    const headers = DEFAULT_LEADS_HEADERS;
    const values = [headers, ...leads.map(lead => leadToRowDynamic(lead, headers, hilosSheetId))];
    await retrySheetsWrite(() => sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "leads!A1",
      valueInputOption: "RAW",
      requestBody: { values },
    }));
    console.log("Successfully bootstrapped Google Sheet with headers and seed data.");
  } catch (error) {
    console.error("Error bootstrapping Google Sheet:", error);
  }
}

export async function bootstrapHilosEmailsSheet(sheets: any, spreadsheetId: string, leads: Lead[]) {
  try {
    const headers = ["id", "lead_id", "nombre_sala", "fecha", "remitente", "remitente_nombre", "asunto", "mensaje", "band_id"];
    const rows: any[] = [];
    for (const lead of leads) {
      if (lead.hilo_emails && lead.hilo_emails.length > 0) {
        for (const msg of lead.hilo_emails) {
          rows.push(messageToRow(lead.id, lead.nombre_sala, msg));
        }
      }
    }
    const values = [headers, ...rows];
    await retrySheetsWrite(() => sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "hilos_emails!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    }));
    console.log("Successfully bootstrapped Google Sheet hilos_emails tab.");
  } catch (error) {
    console.error("Error bootstrapping hilos_emails sheet tab:", error);
  }
}

// Surgical append-only sync for lead messages in hilos_emails tab (never clears full range)
export async function syncLeadMessagesInSheet(sheets: any, spreadsheetId: string, lead: Lead) {
  if (!lead.hilo_emails || lead.hilo_emails.length === 0) return;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "hilos_emails!A:I",
    }, 5000);
    const rows = response.data?.values || [];

    if (rows.length === 0) {
      const headers = ["id", "lead_id", "nombre_sala", "fecha", "remitente", "remitente_nombre", "asunto", "mensaje", "band_id"];
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "hilos_emails!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }

    const existingMsgIds = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        existingMsgIds.add(String(rows[i][0]));
      }
    }

    const newMessagesToAppend = lead.hilo_emails.filter(msg => !existingMsgIds.has(String(msg.id)));

    if (newMessagesToAppend.length > 0) {
      const newRows = newMessagesToAppend.map(msg => messageToRow(lead.id, lead.nombre_sala, msg));
      await retrySheetsWrite(() => sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "hilos_emails!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: newRows }
      }));
      console.log(`[hilos_emails] Surgical append: added ${newRows.length} new messages for lead ${lead.id}`);
    } else {
      console.log(`[hilos_emails] No new messages needed for lead ${lead.id}`);
    }
  } catch (error: any) {
    if (error?.status === 429 || error?.code === 429 || String(error?.message || "").includes("Quota exceeded")) {
      console.warn(`Notice appending messages for Lead ${lead.id} in Google Sheet: Quota exceeded (will retry on next sync).`);
    } else {
      console.error(`Error appending messages for Lead ${lead.id} in Google Sheet:`, error);
    }
  }
}

export async function verifyLeadStatusAndWrite(
  id: string, 
  expectedStatus: string | undefined, 
  updatedFields: Partial<Lead>,
  loadState: () => any,
  saveState: (state: any) => void
): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  const state = loadState();
  const idx = state.leads.findIndex((l: Lead) => l.id === id);
  if (idx === -1) {
    return { success: false, error: "Lead no encontrado localmente." };
  }
  
  const currentLead = state.leads[idx];
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  
  if (sheets && spreadsheetId) {
    try {
      const tabsToCheck = currentLead.tipo === 'medio' ? ["Medios", "medios", "leads"] : ["leads", "Medios", "medios"];
      for (const tabName of tabsToCheck) {
        try {
          const response = await getValuesCached(sheets, {
            spreadsheetId,
            range: `${tabName}!A:ZZ`,
          }, 5000);
          const rows = response.data?.values;
          if (rows && rows.length > 0) {
            const headers = rows[0];
            const headerMap = buildHeaderMap(headers);
            const idColIdx = headerMap["id"];
            const estadoColIdx = headerMap["estado"];

            if (idColIdx !== undefined) {
              const rowIndex = rows.findIndex((row: any[], index: number) => index > 0 && String(row[idColIdx] || "") === id);
              if (rowIndex !== -1) {
                const sheetEstado = estadoColIdx !== undefined && estadoColIdx < rows[rowIndex].length ? rows[rowIndex][estadoColIdx] : "nuevo";
                
                if (expectedStatus && normalizeLeadStatus(sheetEstado) !== normalizeLeadStatus(expectedStatus)) {
                  console.warn(`Race condition avoided: Lead ${id} is in state '${sheetEstado}', but expected '${expectedStatus}'`);
                  
                  state.leads[idx] = rowToLeadDynamic(rows[rowIndex], headerMap);
                  saveState(state);
                  
                  return { 
                    success: false, 
                    error: `El estado en Google Sheets (${tabName}) ha cambiado a '${sheetEstado}' en paralelo por otro usuario o cron job. Se han sincronizado los datos locales. Por favor, recarga.`,
                    lead: state.leads[idx]
                  };
                }
                break;
              }
            }
          }
        } catch (_) {
          // Tab might not exist, proceed to next
        }
      }
    } catch (error) {
      console.error("Error verifying lead status in Google Sheet, continuing with local persistence:", error);
    }
  }
  
  state.leads[idx] = { ...currentLead, ...updatedFields };
  saveState(state);
  
  if (sheets && spreadsheetId) {
    await updateLeadInSheet(state.leads[idx]);
  }
  
  return { success: true, lead: state.leads[idx] };
}

export async function realignLeadsSheetHeadersAndData(
  sheetsClient?: any,
  targetSpreadsheetId?: string,
  existingParsedLeads?: Lead[]
): Promise<{ success: boolean; count: number; message: string }> {
  const sheets = sheetsClient || getSheetsClient();
  const spreadsheetId = targetSpreadsheetId || process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    return { success: false, count: 0, message: "Las credenciales de Google Sheets no están configuradas." };
  }

  try {
    const tabName = "leads";
    await ensureSheetTabExists(sheets, spreadsheetId, tabName);

    let parsedLeads: Lead[] = existingParsedLeads || [];
    if (!existingParsedLeads || existingParsedLeads.length === 0) {
      const response = await getValuesCached(sheets, {
        spreadsheetId,
        range: `${tabName}!A1:ZZ`,
      }, 100);

      const rows = response.data?.values || [];
      if (rows.length > 1) {
        const currentHeaders = rows[0] || [];
        const headerMap = buildHeaderMap(currentHeaders);
        const dataRows = rows.slice(1);
        parsedLeads = dataRows.map(r => rowToLeadDynamic(r, headerMap));
      }
    }

    const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");

    const newFormattedRows = [
      DEFAULT_LEADS_HEADERS,
      ...parsedLeads.map(lead => leadToRowDynamic(lead, DEFAULT_LEADS_HEADERS, hilosSheetId))
    ];

    const endColLetter = getColumnLetter(DEFAULT_LEADS_HEADERS.length - 1);

    // Clear existing range first to remove phantom/out-of-bounds leftover columns
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${tabName}!A1:ZZ${Math.max(parsedLeads.length + 20, 200)}`
      });
    } catch (_) {}

    await retrySheetsWrite(() => sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1:${endColLetter}${newFormattedRows.length}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: newFormattedRows }
    }));

    invalidateValuesCache(tabName);
    console.log(`[Google Sheets] Successfully realigned ${parsedLeads.length} leads and headers in '${tabName}'.`);
    return {
      success: true,
      count: parsedLeads.length,
      message: `¡Cabeceras y ${parsedLeads.length} salas/medios alineados correctamente en la pestaña 'leads' de Google Sheets!`
    };
  } catch (err: any) {
    console.error("Error realigning leads sheet headers:", err);
    return { success: false, count: 0, message: err?.message || String(err) };
  }
}

export async function updateLeadInSheet(lead: Lead) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    const tabsToCheck = lead.tipo === 'medio' ? ["Medios", "medios", "leads"] : ["leads", "Medios", "medios"];
    let updated = false;

    for (const tabName of tabsToCheck) {
      try {
        const headers = await ensureHeadersInSheet(sheets, spreadsheetId, tabName, DEFAULT_LEADS_HEADERS);
        const response = await getValuesCached(sheets, {
          spreadsheetId,
          range: `${tabName}!A1:ZZ`,
        }, 5000);
        const rows = response.data?.values;
        if (!rows || rows.length === 0) continue;

        const headerMap = buildHeaderMap(headers);
        const idColIdx = headerMap["id"];

        if (idColIdx === undefined) continue;

        let rowIndex = -1;
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][idColIdx] || "") === lead.id) {
            rowIndex = i;
            break;
          }
        }

        if (rowIndex !== -1) {
          const sheetRowNumber = rowIndex + 1;
          const existingRow = rows[rowIndex];
          const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");
          const updatedRow = leadToRowDynamic(lead, headers, hilosSheetId, existingRow);

          const endColLetter = getColumnLetter(updatedRow.length - 1);
          await retrySheetsWrite(() => sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${tabName}!A${sheetRowNumber}:${endColLetter}${sheetRowNumber}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [updatedRow]
            }
          }));
          console.log(`Successfully updated Lead ${lead.id} in sheet tab ${tabName} row ${sheetRowNumber}`);

          invalidateValuesCache(tabName);
          await syncLeadMessagesInSheet(sheets, spreadsheetId, lead);
          updated = true;
          break;
        }
      } catch (_) {
        // Tab might not exist yet
      }
    }

    if (!updated) {
      await appendLeadToSheet(lead);
    }
  } catch (error) {
    console.error(`Error updating Lead ${lead.id} in Google Sheet:`, error);
  }
}

export async function appendLeadToSheet(lead: Lead) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    const targetTab = lead.tipo === 'medio' ? "Medios" : "leads";
    await ensureSheetTabExists(sheets, spreadsheetId, targetTab);

    const headers = await ensureHeadersInSheet(sheets, spreadsheetId, targetTab, DEFAULT_LEADS_HEADERS);

    const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");
    const newRow = leadToRowDynamic(lead, headers, hilosSheetId);

    await retrySheetsWrite(() => sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${targetTab}!A:A`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow]
      }
    }));
    console.log(`Successfully appended Lead ${lead.id} to Google Sheet tab ${targetTab}`);
    invalidateValuesCache(targetTab);
    await syncLeadMessagesInSheet(sheets, spreadsheetId, lead);
  } catch (error) {
    console.error(`Error appending Lead ${lead.id} to Google Sheet:`, error);
  }
}
