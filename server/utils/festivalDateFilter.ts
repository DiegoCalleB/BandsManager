export function datesOverlap(
  startDate1: string | null | undefined,
  endDate1: string | null | undefined,
  startDate2: string | null | undefined,
  endDate2: string | null | undefined
): boolean {
  if (!startDate1 || !endDate1 || !startDate2 || !endDate2) return true;

  const s1 = new Date(startDate1).getTime();
  const e1 = new Date(endDate1).getTime();
  const s2 = new Date(startDate2).getTime();
  const e2 = new Date(endDate2).getTime();

  if (isNaN(s1) || isNaN(e1) || isNaN(s2) || isNaN(e2)) return true;

  return !(e1 < s2 || e2 < s1);
}

export function filterLeadsByActiveCampaign(
  leads: any[],
  activeCampaign: any | null
): any[] {
  if (!activeCampaign || !activeCampaign.campaignStartDate || !activeCampaign.campaignEndDate) {
    return leads;
  }

  return leads.filter((lead) => {
    if (lead.festival_start_date && lead.festival_end_date) {
      return datesOverlap(
        lead.festival_start_date,
        lead.festival_end_date,
        activeCampaign.campaignStartDate,
        activeCampaign.campaignEndDate
      );
    }
    return true;
  });
}

export function formatFestivalDateRange(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return "";

  try {
    const s = new Date(startDate);
    const e = new Date(endDate);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";

    const sMonth = String(s.getMonth() + 1).padStart(2, "0");
    const sDay = String(s.getDate()).padStart(2, "0");
    const eMonth = String(e.getMonth() + 1).padStart(2, "0");
    const eDay = String(e.getDate()).padStart(2, "0");

    if (sMonth === eMonth) {
      return `${sDay}/${sMonth} - ${eDay}/${eMonth}`;
    }
    return `${sDay}/${sMonth} - ${eDay}/${eMonth}`;
  } catch {
    return "";
  }
}
