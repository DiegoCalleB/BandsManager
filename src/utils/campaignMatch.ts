import { BookingCampaign, Lead } from '../types';

const MONTH_NAMES_ES: Record<string, number> = {
 enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
 julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
 ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
 jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11
};

export function parseFlexibleDate(dateStr: string | null | undefined): Date | null {
 if (!dateStr || typeof dateStr !== "string") return null;
 const trimmed = dateStr.trim().toLowerCase();
 if (!trimmed) return null;

 // 1. Formato ISO YYYY-MM-DD
 if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
 const d = new Date(trimmed);
 if (!isNaN(d.getTime())) return d;
 }

 // 2. Formato DD/MM/YYYY o DD-MM-YYYY
 const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
 if (ddmmyyyy) {
 const day = parseInt(ddmmyyyy[1], 10);
 const month = parseInt(ddmmyyyy[2], 10) - 1;
 const year = parseInt(ddmmyyyy[3], 10);
 const d = new Date(year, month, day);
 if (!isNaN(d.getTime())) return d;
 }

 // 3. Formato DD/MM o DD-MM (asume año actual o próximo)
 const ddm = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
 if (ddm) {
 const day = parseInt(ddm[1], 10);
 const month = parseInt(ddm[2], 10) - 1;
 const currentYear = new Date().getFullYear();
 const d = new Date(currentYear, month, day);
 if (!isNaN(d.getTime())) return d;
 }

 // 4. Texto en español con meses: "5 y 6 de junio", "5 de junio de 2026", "primera quincena de diciembre"
 for (const [monthName, monthIndex] of Object.entries(MONTH_NAMES_ES)) {
 if (trimmed.includes(monthName)) {
 const yearMatch = trimmed.match(/\b(20\d{2})\b/);
 const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

 const dayMatches = [...trimmed.matchAll(/\b(\d{1,2})\b/g)];
 let day = dayMatches.length > 0 ? parseInt(dayMatches[0][1], 10) : 1;

 const d = new Date(year, monthIndex, day);
 if (!isNaN(d.getTime())) return d;
 }
 }

 const fallback = new Date(trimmed);
 return isNaN(fallback.getTime()) ? null : fallback;
}

// Único criterio de "esta sala encaja en la campaña", compartido por GlobalCampaignBar (el
// contador "Salas (N)" de la barra superior) y BookingCRM (el listado real que se ve al pulsar
// ese botón). Antes cada uno tenía su propia copia de esta lógica y no coincidían: la barra
// aplicaba un margen de tolerancia del ±30% sobre el aforo (para "adelantar" cuántas salas más o
// menos encajan), mientras que el listado de Booking Salas filtraba por el rango exacto. El
// resultado era que el contador prometía más salas de las que luego aparecían filtradas: no era
// que el filtro fallara a veces, es que nunca fue el mismo filtro.
export function leadMatchesCampaignCity(lead: Lead, campaign: BookingCampaign): boolean {
 const targetCities = ((campaign.targetCities || (campaign as any).target_cities || []) as string[])
 .map(c => c.toLowerCase().trim())
 .filter(Boolean);
 const targetRegions = (((campaign as any).targetRegions || (campaign as any).target_regions || []) as string[])
 .map(r => r.toLowerCase().trim())
 .filter(Boolean);

 if (targetCities.length === 0 && targetRegions.length === 0) return true;

 const leadCity = (lead.ciudad || '').toLowerCase().trim();
 const leadRegion = (lead.region || '').toLowerCase().trim();

 return targetCities.some(c =>
 leadCity.includes(c) || leadRegion.includes(c) || (c.includes('madrid') && (leadCity.includes('madrid') || leadRegion.includes('madrid')))
 ) || targetRegions.some(r => leadCity.includes(r) || leadRegion.includes(r));
}

export function leadMatchesCampaignCapacity(lead: Lead, campaign: BookingCampaign): boolean {
 const cap = Number(lead.aforo) || 0;
 const minCap = Number(campaign.minCapacity || (campaign as any).min_capacity || 0);
 const maxCap = Number(campaign.maxCapacity || (campaign as any).max_capacity || Infinity);

 // Una sala sin aforo registrado no se descarta: no hay dato con el que contradecir la campaña.
 if (cap === 0) return true;
 return cap >= minCap && cap <= maxCap;
}

export function leadMatchesCampaignDates(lead: Lead, campaign: BookingCampaign): boolean {
 const startDateStr = (lead as any).festival_start_date || (lead as any).festivalStartDate;
 const endDateStr = (lead as any).festival_end_date || (lead as any).festivalEndDate || startDateStr;

 if (!startDateStr) return true; // Si no hay fecha de evento asignada, no se descarta

 const eventStart = parseFlexibleDate(startDateStr);
 const eventEnd = parseFlexibleDate(endDateStr);

 if (!eventStart || !eventEnd) return true;

 let campStartStr = campaign.campaignStartDate || (campaign as any).campaign_start_date;
 let campEndStr = campaign.campaignEndDate || (campaign as any).campaign_end_date;

 const targetDates = (campaign.targetDates || (campaign as any).target_dates) as string[];
 if ((!campStartStr || !campEndStr) && Array.isArray(targetDates) && targetDates.length > 0) {
 const sorted = [...targetDates].sort();
 if (!campStartStr) campStartStr = sorted[0];
 if (!campEndStr) campEndStr = sorted[sorted.length - 1];
 }

 if ((!campStartStr || !campEndStr) && (campaign.targetDatesText || (campaign as any).target_dates_text)) {
 const text = campaign.targetDatesText || (campaign as any).target_dates_text;
 const parsedTextDate = parseFlexibleDate(text);
 if (parsedTextDate) {
 const iso = parsedTextDate.toISOString().substring(0, 10);
 if (!campStartStr) campStartStr = iso;
 if (!campEndStr) campEndStr = iso;
 }
 }

 if (!campStartStr || !campEndStr) return true;

 const campStart = parseFlexibleDate(campStartStr);
 const campEnd = parseFlexibleDate(campEndStr);

 if (!campStart || !campEnd) return true;

 // Comprobar si el evento del festival se solapa con el rango de fechas de la campaña activa
 return !(eventEnd.getTime() < campStart.getTime() || campEnd.getTime() < eventStart.getTime());
}

export function leadMatchesCampaign(lead: Lead, campaign: BookingCampaign): boolean {
 const isMedio = !!lead.tipo && (String(lead.tipo).includes('medio') || String(lead.tipo).includes('prensa') || String(lead.tipo).includes('radio'));
 if (isMedio) return false;
 return leadMatchesCampaignCity(lead, campaign) && leadMatchesCampaignCapacity(lead, campaign) && leadMatchesCampaignDates(lead, campaign);
}

