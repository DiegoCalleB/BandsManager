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
