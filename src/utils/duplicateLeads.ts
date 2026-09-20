import { Lead } from' ../types';

/**
 * Normaliza un texto para comparaciones insensibles a mayúsculas, diacríticos y puntuación.
 */
export function normalizeText(str?: string | null): string {
 if (!str) return' ';
 return str
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g,' ') // Elimina tildes
 .replace(/[^a-z0-9\s]/g,' ' ) // Convierte puntuación a espacios
 .replace(/\s+/g,' ' )
 .trim();
}

/**
 * Prefijos comunes en salas, teatros y recintos que a menudo provocan falsos negativos
 * (ej: "Sala El Sol" vs "El Sol", "Teatro Eslava" vs "Eslava").
 */
const VENUE_PREFIXES = [
' sala',
' teatro',
' club',
' disco',
' discoteca',
' pub',
' cafe',
' bar',
' espacio cultural',
' espacio',
' centro cultural',
' asociacion cultural',
' asociacion',
' festival',
' auditorio',
' auditorio municipal'
];

/**
 * Normaliza el nombre de una sala/lead eliminando prefijos comunes genéricos.
 */
export function normalizeVenueName(name?: string | null): string {
 let normalized = normalizeText(name);
 if (!normalized) return' ';

 for (const prefix of VENUE_PREFIXES) {
 if (normalized.startsWith(prefix +' ' )) {
 normalized = normalized.slice(prefix.length).trim();
 break;
 }
 }
 return normalized;
}

/**
 * Normaliza un email para comparación exacta.
 */
export function normalizeEmail(email?: string | null): string {
 if (!email) return' ';
 return email.toLowerCase().trim();
}

/**
 * Normaliza una URL web o perfil de Instagram (elimina protocolo, subdominios comunes y slashes finales).
 */
export function normalizeWebOrHandle(val?: string | null): string {
 if (!val) return' ';
 return val
 .toLowerCase()
 .replace(/^https?:\/\//i,' ')
 .replace(/^www\./i,' ')
 .replace(/instagram\.com\//i,' ')
 .replace(/^@/,' ')
 .replace(/\/+$/,' ')
 .trim();
}

/**
 * Calcula la distancia de Levenshtein entre dos cadenas cortas.
 */
function levenshtein(a: string, b: string): number {
 if (a === b) return 0;
 if (!a.length) return b.length;
 if (!b.length) return a.length;

 const matrix: number[][] = [];
 for (let i = 0; i <= b.length; i++) matrix[i] = [i];
 for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

 for (let i = 1; i <= b.length; i++) {
 for (let j = 1; j <= a.length; j++) {
 if (b.charAt(i - 1) === a.charAt(j - 1)) {
 matrix[i][j] = matrix[i - 1][j - 1];
 } else {
 matrix[i][j] = Math.min(
 matrix[i - 1][j - 1] + 1, // sustitución
 matrix[i][j - 1] + 1, // inserción
 matrix[i - 1][j] + 1 // borrado
 );
 }
 }
 }
 return matrix[b.length][a.length];
}

/**
 * Calcula la similitud entre 0 y 1.
 */
export function stringSimilarity(a: string, b: string): number {
 const normA = normalizeText(a);
 const normB = normalizeText(b);
 if (!normA || !normB) return 0;
 if (normA === normB) return 1;

 const maxLen = Math.max(normA.length, normB.length);
 if (maxLen === 0) return 1;

 const dist = levenshtein(normA, normB);
 return 1 - dist / maxLen;
}

export type DuplicateMatchReason = 
 |' same_email'
 |' same_name_and_city'
 |' exact_name'
 |' similar_name_same_city'
 |' same_website'
 |' same_instagram';

export interface DuplicateGroup {
 id: string;
 matchReason: DuplicateMatchReason;
 matchReasonLabel: string;
 confidence: number; // 0 - 100
 leads: Lead[];
 suggestedKeepId: string;
}

/**
 * Ponderación de avance en el embudo CRM para determinar cuál registro conservar prioritariamente.
 */
const CRM_STATUS_WEIGHT: Record<string, number> = {
 confirmado: 100,
 negociando: 80,
 respondido: 60,
 esperando_respuesta: 40,
 contactado: 35,
 aprobado_propuesta: 30,
 aprobado_respuesta: 30,
 pendiente_aprobacion: 25,
 borrador_creado: 20,
 nuevo: 10,
 aplazado: 5,
 no_interesado: 1,
};

/**
 * Calcula una puntuación de integridad de datos de un lead (más campos rellenos y mayor estado CRM = mayor puntuación).
 */
export function calculateLeadCompletenessScore(lead: Lead): number {
 let score = 0;

 // Peso por estado CRM
 score += CRM_STATUS_WEIGHT[lead.estado ||' nuevo'] || 10;

 // Campos de contacto esenciales
 if (lead.email_contacto && lead.email_contacto.trim().length > 3) score += 20;
 if (lead.telefono && lead.telefono.trim().length > 3) score += 10;
 if (lead.instagram && lead.instagram.trim().length > 2) score += 8;
 if (lead.website && lead.website.trim().length > 4) score += 8;
 if (lead.contacto_nombre && lead.contacto_nombre.trim().length > 1) score += 8;
 if (lead.direccion && lead.direccion.trim().length > 3) score += 6;
 if (lead.aforo && lead.aforo > 0) score += 5;
 if (lead.notas && lead.notas.trim().length > 0) score += 5;
 if (lead.hilo_emails && lead.hilo_emails.length > 0) score += 15;
 if (lead.imagen_url && lead.imagen_url.trim().length > 5) score += 5;

 return score;
}

/**
 * Encuentra grupos de leads duplicados dentro de una lista de leads.
 */
export function findDuplicateLeads(leads: Lead[]): DuplicateGroup[] {
 if (!leads || leads.length < 2) return [];

 // Mapeos para agrupaciones rápidas
 const groups: DuplicateGroup[] = [];
 const visitedPairKeys = new Set<string>();
 const leadById = new Map<string, Lead>();
 leads.forEach(l => leadById.set(l.id, l));

 // 1. Por Email Exacto (si no está vacío)
 const emailMap = new Map<string, Lead[]>();
 for (const lead of leads) {
 const email = normalizeEmail(lead.email_contacto);
 if (email && email.includes('@') && !email.includes('example.com')) {
 if (!emailMap.has(email)) emailMap.set(email, []);
 emailMap.get(email)!.push(lead);
 }
 }

 emailMap.forEach((matchedLeads, email) => {
 if (matchedLeads.length > 1) {
 const sortedByScore = [...matchedLeads].sort(
 (a, b) => calculateLeadCompletenessScore(b) - calculateLeadCompletenessScore(a)
 );
 groups.push({
 id: `dup-email-${email}`,
 matchReason:' same_email',
 matchReasonLabel: `Mismo correo electrónico (${email})`,
 confidence: 100,
 leads: matchedLeads,
 suggestedKeepId: sortedByScore[0].id
 });

 for (let i = 0; i < matchedLeads.length; i++) {
 for (let j = i + 1; j < matchedLeads.length; j++) {
 const key = [matchedLeads[i].id, matchedLeads[j].id].sort().join(':');
 visitedPairKeys.add(key);
 }
 }
 }
 });

 // 2. Por Nombre Normalizado + Ciudad Exacta
 const nameCityMap = new Map<string, Lead[]>();
 for (const lead of leads) {
 const cleanName = normalizeVenueName(lead.nombre_sala);
 const cleanCity = normalizeText(lead.ciudad);
 if (cleanName.length >= 2) {
 const key = `${cleanName}|${cleanCity}`;
 if (!nameCityMap.has(key)) nameCityMap.set(key, []);
 nameCityMap.get(key)!.push(lead);
 }
 }

 nameCityMap.forEach((matchedLeads, key) => {
 if (matchedLeads.length > 1) {
 // Comprobar si ya están en un grupo
 const unvisited = matchedLeads.filter((l, idx) => {
 if (idx === 0) return true;
 const pairKey = [matchedLeads[0].id, l.id].sort().join(':');
 return !visitedPairKeys.has(pairKey);
 });

 if (unvisited.length > 1) {
 const [cleanName, cleanCity] = key.split('|');
 const sortedByScore = [...matchedLeads].sort(
 (a, b) => calculateLeadCompletenessScore(b) - calculateLeadCompletenessScore(a)
 );
 groups.push({
 id: `dup-namecity-${key}`,
 matchReason:' same_name_and_city',
 matchReasonLabel: `Mismo nombre y ciudad ("${cleanName}" en ${cleanCity ||' España'})`,
 confidence: 95,
 leads: matchedLeads,
 suggestedKeepId: sortedByScore[0].id
 });

 for (let i = 0; i < matchedLeads.length; i++) {
 for (let j = i + 1; j < matchedLeads.length; j++) {
 visitedPairKeys.add([matchedLeads[i].id, matchedLeads[j].id].sort().join(':'));
 }
 }
 }
 }
 });

 // 3. Similitud Alta en Nombre dentro de la misma Ciudad (Levenshtein >= 0.85)
 // Agrupar por ciudad para reducir N²
 const cityGroups = new Map<string, Lead[]>();
 for (const lead of leads) {
 const city = normalizeText(lead.ciudad);
 if (city) {
 if (!cityGroups.has(city)) cityGroups.set(city, []);
 cityGroups.get(city)!.push(lead);
 }
 }

 cityGroups.forEach((cityLeads, city) => {
 if (cityLeads.length < 2 || cityLeads.length > 300) return; // evitar coste excesivo si ciudad es genérica como' espana'
 for (let i = 0; i < cityLeads.length; i++) {
 const a = cityLeads[i];
 const normA = normalizeVenueName(a.nombre_sala);
 if (normA.length < 4) continue;

 for (let j = i + 1; j < cityLeads.length; j++) {
 const b = cityLeads[j];
 const pairKey = [a.id, b.id].sort().join(':');
 if (visitedPairKeys.has(pairKey)) continue;

 const normB = normalizeVenueName(b.nombre_sala);
 if (normB.length < 4) continue;

 // Comprobar similitud de texto
 const sim = stringSimilarity(normA, normB);
 if (sim >= 0.82) {
 visitedPairKeys.add(pairKey);
 const sorted = [a, b].sort((x, y) => calculateLeadCompletenessScore(y) - calculateLeadCompletenessScore(x));
 groups.push({
 id: `dup-sim-${a.id}-${b.id}`,
 matchReason:' similar_name_same_city',
 matchReasonLabel: `Nombres muy similares en ${city} (${Math.round(sim * 100)}% de coincidencia)`,
 confidence: Math.round(sim * 100),
 leads: [a, b],
 suggestedKeepId: sorted[0].id
 });
 }
 }
 }
 });

 // 4. Mismo Website o Instagram (si no es vacío ni dominio genérico)
 const webMap = new Map<string, Lead[]>();
 const IGNORED_DOMAINS = ['facebook.com',' instagram.com',' linktr.ee',' google.com',' youtube.com',' twitter.com',' x.com'];

 for (const lead of leads) {
 const normWeb = normalizeWebOrHandle(lead.website);
 if (normWeb && normWeb.length > 5 && !IGNORED_DOMAINS.some(d => normWeb === d || normWeb === d +' /')) {
 if (!webMap.has(normWeb)) webMap.set(normWeb, []);
 webMap.get(normWeb)!.push(lead);
 }
 }

 webMap.forEach((matchedLeads, normWeb) => {
 if (matchedLeads.length > 1) {
 const unvisited = matchedLeads.filter((l, idx) => {
 if (idx === 0) return true;
 return !visitedPairKeys.has([matchedLeads[0].id, l.id].sort().join(':'));
 });
 if (unvisited.length > 1) {
 const sorted = [...matchedLeads].sort((x, y) => calculateLeadCompletenessScore(y) - calculateLeadCompletenessScore(x));
 groups.push({
 id: `dup-web-${normWeb}`,
 matchReason:' same_website',
 matchReasonLabel: `Mismo sitio web (${normWeb})`,
 confidence: 90,
 leads: matchedLeads,
 suggestedKeepId: sorted[0].id
 });
 for (let i = 0; i < matchedLeads.length; i++) {
 for (let j = i + 1; j < matchedLeads.length; j++) {
 visitedPairKeys.add([matchedLeads[i].id, matchedLeads[j].id].sort().join(':'));
 }
 }
 }
 }
 });

 // Ordenar grupos por confianza y severidad
 return groups.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Fusión inteligente de dos leads:
 * Conserva el registro primario y rellena todos los campos vacíos con los datos del secundario.
 */
export function mergeTwoLeads(primary: Lead, secondary: Lead): Lead {
 const merged: Lead = { ...primary };

 // Rellenar campos de contacto si están vacíos en el primario
 if (!merged.email_contacto?.trim() && secondary.email_contacto?.trim()) {
 merged.email_contacto = secondary.email_contacto.trim();
 } else if (
 secondary.email_contacto?.trim() && 
 merged.email_contacto?.trim() &&
 normalizeEmail(secondary.email_contacto) !== normalizeEmail(merged.email_contacto) &&
 !merged.email_secundario
 ) {
 merged.email_secundario = secondary.email_contacto.trim();
 }

 if (!merged.telefono?.trim() && secondary.telefono?.trim()) {
 merged.telefono = secondary.telefono.trim();
 }

 if (!merged.instagram?.trim() && secondary.instagram?.trim()) {
 merged.instagram = secondary.instagram.trim();
 }

 if (!merged.website?.trim() && secondary.website?.trim()) {
 merged.website = secondary.website.trim();
 }

 if (!merged.contacto_nombre?.trim() && secondary.contacto_nombre?.trim()) {
 merged.contacto_nombre = secondary.contacto_nombre.trim();
 }

 if (!merged.direccion?.trim() && secondary.direccion?.trim()) {
 merged.direccion = secondary.direccion.trim();
 }

 if ((!merged.aforo || merged.aforo <= 0) && secondary.aforo && secondary.aforo > 0) {
 merged.aforo = secondary.aforo;
 }

 if (!merged.imagen_url?.trim() && secondary.imagen_url?.trim()) {
 merged.imagen_url = secondary.imagen_url.trim();
 }

 // Conservar estado CRM más avanzado si el secundario está más adelante
 const primaryScore = CRM_STATUS_WEIGHT[primary.estado ||' nuevo'] || 10;
 const secondaryScore = CRM_STATUS_WEIGHT[secondary.estado ||' nuevo'] || 10;
 if (secondaryScore > primaryScore) {
 merged.estado = secondary.estado;
 }

 // Combinar notas si ambas existen y difieren
 const primaryNotes = (primary.notas ||' ').trim();
 const secondaryNotes = (secondary.notas ||' ').trim();
 if (secondaryNotes && !primaryNotes.includes(secondaryNotes)) {
 merged.notas = primaryNotes ? `${primaryNotes}\n\n[Fusionado de ${secondary.nombre_sala}]: ${secondaryNotes}` : secondaryNotes;
 }

 // Combinar historial de mensajes/hilo si existen
 if (secondary.hilo_emails && secondary.hilo_emails.length > 0) {
 const existingMsgIds = new Set((merged.hilo_emails || []).map(m => m.id || `${m.fecha}-${m.asunto}`));
 const newEmails = secondary.hilo_emails.filter(m => !existingMsgIds.has(m.id || `${m.fecha}-${m.asunto}`));
 merged.hilo_emails = [...(merged.hilo_emails || []), ...newEmails];
 }

 return merged;
}

/**
 * Comprueba si un nuevo lead (ej: al crear o importar) colisiona con algún lead existente.
 */
export function checkSingleLeadDuplicate(
 candidate: { nombre_sala: string; ciudad?: string; email_contacto?: string },
 existingLeads: Lead[]
): { isDuplicate: boolean; matchedLead?: Lead; reason?: string } {
 const normName = normalizeVenueName(candidate.nombre_sala);
 const normCity = normalizeText(candidate.ciudad);
 const normEmail = normalizeEmail(candidate.email_contacto);

 for (const existing of existingLeads) {
 // 1. Mismo email
 if (normEmail && normEmail.includes('@') && normalizeEmail(existing.email_contacto) === normEmail) {
 return {
 isDuplicate: true,
 matchedLead: existing,
 reason: `Mismo correo electrónico (${candidate.email_contacto})`
 };
 }

 // 2. Mismo nombre + ciudad
 const exName = normalizeVenueName(existing.nombre_sala);
 const exCity = normalizeText(existing.ciudad);
 if (normName.length >= 3 && exName === normName) {
 if (!normCity || !exCity || normCity === exCity || normCity ===' espana' || exCity ===' espana') {
 return {
 isDuplicate: true,
 matchedLead: existing,
 reason: `Misma sala en ${existing.ciudad ||' España'}`
 };
 }
 }
 }

 return { isDuplicate: false };
}
