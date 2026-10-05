/**
 * JINA READER SERVICE (r.jina.ai)
 *
 * Transforma sitios web de salas, festivales y linktree en Markdown limpio
 * optimizado para agentes de booking sin consumir tokens pesados de Gemini.
 * Extrae:
 * - Teléfono Móvil (WhatsApp ready) vs Teléfono Fijo
 * - Emails de programación/booking
 * - Aforo y especificaciones técnicas (rider/PA)
 * - Nombres de responsables de programación
 */

import { esUrlExternaSegura } from "../utils/ssrfGuard.js";

export interface JinaExtractedVenueData {
  url: string;
  success: boolean;
  title?: string;
  telefono_movil?: string;
  telefono_fijo?: string;
  email_contacto?: string;
  email_secundario?: string;
  instagram?: string;
  aforo?: number;
  contacto_nombre?: string;
  rider_specs?: string;
  resumen_markdown?: string;
  error?: string;
}

/**
 * Normaliza y clasifica teléfonos en móviles (WhatsApp) o fijos (sala/oficina)
 */
export function classifySpanishPhones(text: string): { movil?: string; fijo?: string } {
  if (!text) return {};

  const cleanText = text.replace(/[\n\r\t]/g, " ");

  // Móviles España: 6XX o 7XX (con o sin +34 / 0034)
  const mobileRegex = /(?:(?:\+|00)34[\s.-]*)?([67]\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/g;
  // Fijos España: 8XX o 9XX (con o sin +34 / 0034)
  const landlineRegex = /(?:(?:\+|00)34[\s.-]*)?([89]\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/g;

  let movil: string | undefined;
  let fijo: string | undefined;

  const mobMatches = Array.from(cleanText.matchAll(mobileRegex));
  for (const match of mobMatches) {
    const raw = match[0].replace(/[^\d+]/g, "").trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 9 || (digits.length === 11 && digits.startsWith("34"))) {
      const cleanNum = digits.length === 9 ? `+34 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
      movil = cleanNum;
      break;
    }
  }

  const landMatches = Array.from(cleanText.matchAll(landlineRegex));
  for (const match of landMatches) {
    const raw = match[0].replace(/[^\d+]/g, "").trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 9 || (digits.length === 11 && digits.startsWith("34"))) {
      const cleanNum = digits.length === 9 ? `+34 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
      fijo = cleanNum;
      break;
    }
  }

  return { movil, fijo };
}

/**
 * Extrae emails ordenándolos por relevancia para contratación
 */
export function extractRelevantEmails(text: string): { principal?: string; secundario?: string } {
  if (!text) return {};
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];

  const invalidEndings = [".png", ".jpg", ".webp", ".svg", ".js", ".css", ".gif"];
  const invalidDomains = ["example.com", "domain.com", "schema.org", "sentry.io", "w3.org", "wordpress", "gravatar"];

  const valid = matches
    .map(e => e.trim().toLowerCase())
    .filter(e => 
      !invalidEndings.some(ext => e.endsWith(ext)) &&
      !invalidDomains.some(dom => e.includes(dom)) &&
      e.length >= 6
    );

  const unique = Array.from(new Set(valid));
  if (unique.length === 0) return {};

  // Priorizar emails de booking / programación
  const priorityPatterns = [/booking/i, /programacion/i, /conciertos/i, /produccion/i, /info@/i, /contacto/i, /sala/i];
  
  unique.sort((a, b) => {
    const aScore = priorityPatterns.findIndex(p => p.test(a));
    const bScore = priorityPatterns.findIndex(p => p.test(b));
    const aVal = aScore === -1 ? 99 : aScore;
    const bVal = bScore === -1 ? 99 : bScore;
    return aVal - bVal;
  });

  return {
    principal: unique[0],
    secundario: unique.length > 1 ? unique[1] : undefined
  };
}

/**
 * Escanea un sitio web mediante Jina Reader API (r.jina.ai)
 */
export async function scrapeVenueWithJina(targetUrl: string): Promise<JinaExtractedVenueData> {
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return { url: targetUrl, success: false, error: "URL inválida o no proporcionada" };
  }

  try {
    // 1. Blindaje SSRF obligatorio
    const isSafe = await esUrlExternaSegura(targetUrl);
    if (!isSafe) {
      return { url: targetUrl, success: false, error: "URL bloqueada por política de seguridad SSRF" };
    }

    const jinaEndpoint = `https://r.jina.ai/${targetUrl}`;
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "X-No-Cache": "true",
      "X-Timeout": "8"
    };

    if (process.env.JINA_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9s timeout

    const res = await fetch(jinaEndpoint, {
      method: "GET",
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { 
        url: targetUrl, 
        success: false, 
        error: `Jina Reader devolvió HTTP ${res.status}: ${res.statusText}` 
      };
    }

    let markdown = "";
    let pageTitle = "";

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json: any = await res.json();
      markdown = json.data?.content || json.data?.text || json.content || "";
      pageTitle = json.data?.title || json.title || "";
    } else {
      markdown = await res.text();
    }

    if (!markdown || markdown.trim().length < 20) {
      return { url: targetUrl, success: false, error: "El sitio no devolvió contenido legible" };
    }

    // 2. Extracción quirúrgica de datos
    const { movil, fijo } = classifySpanishPhones(markdown);
    const { principal, secundario } = extractRelevantEmails(markdown);

    // Instagram
    let instagramHandle: string | undefined;
    const igMatch = markdown.match(/https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)\/?/i);
    if (igMatch && !igMatch[1].includes("p/") && !igMatch[1].includes("reel/")) {
      instagramHandle = `https://www.instagram.com/${igMatch[1]}/`;
    }

    // Aforo
    let aforo: number | undefined;
    const capMatch = markdown.match(/(?:aforo|capacidad)(?:\s+de|\s+aproximad[ao]\s+de|\s+m[aá]ximo\s+de)?\s*[:]?\s*([0-9]{2,5})\s*(?:personas|espectadores|plazas|asistentes)?/i);
    if (capMatch && capMatch[1]) {
      const val = parseInt(capMatch[1], 10);
      if (val >= 25 && val <= 80000) aforo = val;
    }

    // Responsable de contacto
    let contactoNombre: string | undefined;
    const contactMatch = markdown.match(/(?:programaci[oó]n|booking|direcci[oó]n\s+art[ií]stica|contacto)[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,2})/);
    if (contactMatch && contactMatch[1] && contactMatch[1].length < 35) {
      contactoNombre = contactMatch[1].trim();
    }

    // Especificaciones técnicas / Rider
    let riderSpecs: string | undefined;
    const riderKeywords = ["rider", "p.a.", "equipo de sonido", "microfonía", "mesa de sonido", "in-ear", "monitores"];
    const lines = markdown.split("\n");
    const techLines = lines.filter(l => riderKeywords.some(kw => l.toLowerCase().includes(kw))).slice(0, 4);
    if (techLines.length > 0) {
      riderSpecs = techLines.join(". ").replace(/[*#]/g, "").trim().slice(0, 200);
    }

    return {
      url: targetUrl,
      success: true,
      title: pageTitle,
      telefono_movil: movil,
      telefono_fijo: fijo,
      email_contacto: principal,
      email_secundario: secundario,
      instagram: instagramHandle,
      aforo,
      contacto_nombre: contactoNombre,
      rider_specs: riderSpecs,
      resumen_markdown: markdown.slice(0, 600)
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.log(`[JinaReader] Timeout (9s) consultando ${targetUrl}`);
    } else {
      console.warn(`[JinaReader] Error leyendo ${targetUrl}:`, err?.message || err);
    }
    return {
      url: targetUrl,
      success: false,
      error: err?.name === "AbortError" ? "Tiempo de espera agotado al consultar la web" : (err?.message || "Error al conectar con Jina Reader")
    };
  }
}
