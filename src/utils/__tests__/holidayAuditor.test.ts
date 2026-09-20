import { describe, it, expect } from 'vitest';
import { auditDateAndCity } from '../holidayAuditor';

describe('holidayAuditor', () => {
 it('detects national fixed holidays (e.g. Año Nuevo, Reyes, Fiesta Nacional)', () => {
 const resultNewYear = auditDateAndCity('2026-01-01', 'Madrid');
 expect(resultNewYear.isHoliday).toBe(true);
 expect(resultNewYear.riskLevel).toBe('high_risk');
 expect(resultNewYear.holidayName?.toLowerCase().includes('año nuevo')).toBe(true);

 const resultNat = auditDateAndCity('2026-10-12', 'Sevilla');
 expect(resultNat.isHoliday).toBe(true);
 expect(resultNat.holidayName?.toLowerCase().includes('nacional')).toBe(true);
 });

 it('detects local community and city festivals (e.g. San Isidro in Madrid, San Fermín in Pamplona, Fallas in Valencia)', () => {
 // San Isidro en Madrid (15 de mayo)
 const sanIsidro = auditDateAndCity('2026-05-15', 'Madrid');
 expect(sanIsidro.isHoliday).toBe(true);
 expect(sanIsidro.holidayName?.toLowerCase().includes('san isidro')).toBe(true);

 // San Fermín en Pamplona (7 de julio)
 const sanFermin = auditDateAndCity('2026-07-07', 'Pamplona');
 expect(sanFermin.isHoliday).toBe(true);
 expect(sanFermin.holidayName?.toLowerCase().includes('san fermín') || sanFermin.holidayName?.toLowerCase().includes('san fermin')).toBe(true);

 // Fallas en Valencia (19 de marzo)
 const fallas = auditDateAndCity('2026-03-19', 'Valencia');
 expect(fallas.isHoliday).toBe(true);
 expect(fallas.holidayName?.toLowerCase().includes('fallas') || fallas.holidayName?.toLowerCase().includes('san josé')).toBe(true);
 });

 it('detects holiday eves as high-potential opportunities for live shows', () => {
 // Nochevieja / Víspera de Año Nuevo (31 de diciembre)
 const eveNewYear = auditDateAndCity('2026-12-31', 'Bilbao');
 expect(eveNewYear.isEveOfHoliday).toBe(true);
 expect(eveNewYear.riskLevel).toBe('opportunity');
 });

 it('returns no alerts for a regular Wednesday with no holidays', () => {
 // 2026-02-11 (Miércoles ordinario)
 const ordinaryDay = auditDateAndCity('2026-02-11', 'Zaragoza');
 expect(ordinaryDay.isHoliday).toBe(false);
 expect(ordinaryDay.riskLevel).toBe('safe');
 });
});
