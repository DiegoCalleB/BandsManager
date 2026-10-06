// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

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
      if (trimmed.includes("primera quincena") || trimmed.includes("1a quincena") || trimmed.includes("1ª quincena")) {
        day = 1;
      } else if (trimmed.includes("segunda quincena") || trimmed.includes("2a quincena") || trimmed.includes("2ª quincena")) {
        day = 15;
      }

      const d = new Date(year, monthIndex, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function datesOverlap(
  startDate1: string | null | undefined,
  endDate1: string | null | undefined,
  startDate2: string | null | undefined,
  endDate2: string | null | undefined
): boolean {
  if (!startDate1 || !startDate2) return true;

  const s1 = parseFlexibleDate(startDate1);
  const e1 = parseFlexibleDate(endDate1 || startDate1);
  const s2 = parseFlexibleDate(startDate2);
  const e2 = parseFlexibleDate(endDate2 || startDate2);

  if (!s1 || !e1 || !s2 || !e2) return true;

  return !(e1.getTime() < s2.getTime() || e2.getTime() < s1.getTime());
}

export function filterLeadsByActiveCampaign(
  leads: any[],
  activeCampaign: any | null
): any[] {
  if (!activeCampaign) {
    return leads;
  }

  let campaignStart = activeCampaign.campaignStartDate;
  let campaignEnd = activeCampaign.campaignEndDate;

  // Fallback 1: Si no tiene campaignStartDate/EndDate explícitos, usar targetDates (ordenado)
  if ((!campaignStart || !campaignEnd) && Array.isArray(activeCampaign.targetDates) && activeCampaign.targetDates.length > 0) {
    const sorted = [...activeCampaign.targetDates].sort();
    if (!campaignStart) campaignStart = sorted[0];
    if (!campaignEnd) campaignEnd = sorted[sorted.length - 1];
  }

  // Fallback 2: Si aún no tiene rango pero sí targetDatesText (ej. "primera quincena de diciembre")
  if ((!campaignStart || !campaignEnd) && activeCampaign.targetDatesText) {
    const parsedTextDate = parseFlexibleDate(activeCampaign.targetDatesText);
    if (parsedTextDate) {
      const iso = parsedTextDate.toISOString().substring(0, 10);
      if (!campaignStart) campaignStart = iso;
      if (!campaignEnd) campaignEnd = iso;
    }
  }

  if (!campaignStart || !campaignEnd) {
    return leads;
  }

  return leads.filter((lead) => {
    if (lead.festival_start_date) {
      return datesOverlap(
        lead.festival_start_date,
        lead.festival_end_date || lead.festival_start_date,
        campaignStart,
        campaignEnd
      );
    }
    return true;
  });
}

export function formatFestivalDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return "";

  try {
    const s = parseFlexibleDate(startDate);
    const e = endDate ? parseFlexibleDate(endDate) : s;

    if (!s || !e) return "";

    const sMonth = String(s.getMonth() + 1).padStart(2, "0");
    const sDay = String(s.getDate()).padStart(2, "0");
    const eMonth = String(e.getMonth() + 1).padStart(2, "0");
    const eDay = String(e.getDate()).padStart(2, "0");

    if (sMonth === eMonth && sDay === eDay) {
      return `${sDay}/${sMonth}`;
    }
    return `${sDay}/${sMonth} - ${eDay}/${eMonth}`;
  } catch {
    return "";
  }
}

