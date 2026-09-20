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

export function toIsoDateString(val?: string | null): string {
 if (!val || typeof val !==' string') return' ';
 const trimmed = val.trim();
 if (!trimmed) return' ';
 
 // If already YYYY-MM-DD
 if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
 return trimmed.substring(0, 10);
 }
 
 // If DD/MM/YYYY or DD-MM-YYYY
 const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
 if (ddmmyyyy) {
 const day = ddmmyyyy[1].padStart(2,' 0');
 const month = ddmmyyyy[2].padStart(2,' 0');
 const year = ddmmyyyy[3];
 return `${year}-${month}-${day}`;
 }

 // Fallback: try parsing with Date
 const d = new Date(trimmed);
 if (!isNaN(d.getTime())) {
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2,' 0');
 const day = String(d.getDate()).padStart(2,' 0');
 return `${year}-${month}-${day}`;
 }

 return' ';
}

