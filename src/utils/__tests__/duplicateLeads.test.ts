import { describe, it, expect } from' vitest';
import {
 normalizeText,
 normalizeVenueName,
 normalizeEmail,
 normalizeWebOrHandle,
 stringSimilarity,
 findDuplicateLeads,
 mergeTwoLeads,
 checkSingleLeadDuplicate
} from' ../duplicateLeads';
import { Lead } from' ../../types';

describe('duplicateLeads utility', () => {
 it('normalizes venue names by stripping common prefixes and diacritics', () => {
 expect(normalizeVenueName('Sala El Sol')).toBe('el sol');
 expect(normalizeVenueName('Teatro Barceló')).toBe('barcelo');
 expect(normalizeVenueName('Club Independance')).toBe('independance');
 expect(normalizeVenueName('Café Berlín')).toBe('berlin');
 expect(normalizeVenueName('El Sol')).toBe('el sol');
 });

 it('calculates string similarity accurately', () => {
 expect(stringSimilarity('Sala Siroco',' Sala Siroco')).toBe(1);
 expect(stringSimilarity('Siroco Madrid',' Siroco')).toBeGreaterThan(0.4);
 expect(stringSimilarity('La Riviera',' Wizink Center')).toBeLessThan(0.3);
 });

 it('detects duplicate leads by exact email', () => {
 const leads: Lead[] = [
 {
 id:' 1',
 nombre_sala:' Siroco',
 ciudad:' Madrid',
 email_contacto:' booking@siroco.es',
 estado:' nuevo'
 },
 {
 id:' 2',
 nombre_sala:' Sala Siroco Club',
 ciudad:' Madrid',
 email_contacto:' booking@siroco.es',
 estado:' contactado'
 }
 ];

 const groups = findDuplicateLeads(leads);
 expect(groups.length).toBe(1);
 expect(groups[0].matchReason).toBe('same_email');
 expect(groups[0].confidence).toBe(100);
 // Should suggest lead 2 because it has a more advanced CRM state ('contactado' >' nuevo')
 expect(groups[0].suggestedKeepId).toBe('2');
 });

 it('detects duplicate leads by normalized name and city', () => {
 const leads: Lead[] = [
 {
 id:' 1',
 nombre_sala:' Sala Caracol',
 ciudad:' Madrid',
 estado:' nuevo'
 },
 {
 id:' 2',
 nombre_sala:' Caracol',
 ciudad:' Madrid',
 estado:' nuevo'
 }
 ];

 const groups = findDuplicateLeads(leads);
 expect(groups.length).toBe(1);
 expect(groups[0].matchReason).toBe('same_name_and_city');
 });

 it('merges two leads cleanly without losing data', () => {
 const primary: Lead = {
 id:' 1',
 nombre_sala:' Sala Siroco',
 ciudad:' Madrid',
 email_contacto:' contacto@siroco.es',
 telefono:' ',
 estado:' nuevo',
 notas:' Notas primarias'
 };

 const secondary: Lead = {
 id:' 2',
 nombre_sala:' Siroco',
 ciudad:' Madrid',
 email_contacto:' booking@siroco.es',
 telefono:' 600112233',
 aforo: 300,
 estado:' respondido',
 notas:' Notas secundarias'
 };

 const merged = mergeTwoLeads(primary, secondary);
 expect(merged.telefono).toBe('600112233');
 expect(merged.aforo).toBe(300);
 expect(merged.email_secundario).toBe('booking@siroco.es');
 expect(merged.estado).toBe('respondido'); // elevated from secondary
 expect(merged.notas).toContain('Notas primarias');
 expect(merged.notas).toContain('Notas secundarias');
 });

 it('checks single candidate duplicate correctly', () => {
 const existing: Lead[] = [
 {
 id:' 1',
 nombre_sala:' Sala Apolo',
 ciudad:' Barcelona',
 email_contacto:' info@sala-apolo.com',
 estado:' nuevo'
 }
 ];

 const check1 = checkSingleLeadDuplicate(
 { nombre_sala:' Apolo', ciudad:' Barcelona' },
 existing
 );
 expect(check1.isDuplicate).toBe(true);

 const check2 = checkSingleLeadDuplicate(
 { nombre_sala:' Razzmatazz', ciudad:' Barcelona', email_contacto:' info@sala-apolo.com' },
 existing
 );
 expect(check2.isDuplicate).toBe(true);

 const check3 = checkSingleLeadDuplicate(
 { nombre_sala:' Razzmatazz', ciudad:' Barcelona', email_contacto:' info@salarazzmatazz.com' },
 existing
 );
 expect(check3.isDuplicate).toBe(false);
 });
});
