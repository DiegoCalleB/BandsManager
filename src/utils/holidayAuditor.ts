/**
 * holidayAuditor.ts
 * 
 * Motor de inteligencia de festivos, puentes, fiestas patronales y éxodos vacacionales.
 * Permite advertir a las bandas cuando van a agendar, negociar o planificar una fecha/gira
 * en un lugar donde hay riesgo de baja afluencia por festivo/puente, o por el contrario,
 * una oportunidad de oro (víspera de festivo).
 */

export interface HolidayAuditResult {
 date: string;
 city?: string;
 isHoliday: boolean;
 isLongWeekend: boolean; // Puente o fin de semana largo
 isEveOfHoliday: boolean; // Víspera de festivo (oportunidad)
 riskLevel:' safe' |' opportunity' |' warning' |' high_risk';
 holidayName?: string;
 scope?:' nacional' |' autonomico' |' local' |' vacacional';
 regionOrCity?: string;
 title: string;
 description: string;
 advice: string;
}

// Mapa de ciudades a Comunidades Autónomas / Provincias
export const CITY_REGION_MAP: Record<string, string> = {
' madrid':' madrid',
' alcala de henares':' madrid',
' alcorcon':' madrid',
' mostoles':' madrid',
' getafe':' madrid',
' barcelona':' cataluna',
' hospitalet':' cataluna',
' badalona':' cataluna',
' terrassa':' cataluna',
' sabadell':' cataluna',
' girona':' cataluna',
' gerona':' cataluna',
' tarragona':' cataluna',
' lleida':' cataluna',
' lerida':' cataluna',
' valencia':' comunidad_valenciana',
' alicante':' comunidad_valenciana',
' alacant':' comunidad_valenciana',
' castellon':' comunidad_valenciana',
' castello':' comunidad_valenciana',
' elche':' comunidad_valenciana',
' sevilla':' andalucia',
' malaga':' andalucia',
' granada':' andalucia',
' cordoba':' andalucia',
' cadiz':' andalucia',
' jerez':' andalucia',
' almeria':' andalucia',
' huelva':' andalucia',
' jaen':' andalucia',
' zaragoza':' aragon',
' huesca':' aragon',
' teruel':' aragon',
' bilbao':' pais_vasco',
' bilbo':' pais_vasco',
' san sebastian':' pais_vasco',
' donostia':' pais_vasco',
' vitoria':' pais_vasco',
' gasteiz':' pais_vasco',
' santiago de compostela':' galicia',
' a coruna':' galicia',
' la coruna':' galicia',
' vigo':' galicia',
' ourense':' galicia',
' lugo':' galicia',
' pontevedra':' galicia',
' oviedo':' asturias',
' gijon':' asturias',
' aviles':' asturias',
' santander':' cantabria',
' torrelavega':' cantabria',
' valladolid':' castilla_y_leon',
' salamanca':' castilla_y_leon',
' burgos':' castilla_y_leon',
' leon':' castilla_y_leon',
' palencia':' castilla_y_leon',
' segovia':' castilla_y_leon',
' zamora':' castilla_y_leon',
' avila':' castilla_y_leon',
' soria':' castilla_y_leon',
' toledo':' castilla_la_mancha',
' albacete':' castilla_la_mancha',
' ciudad real':' castilla_la_mancha',
' cuenca':' castilla_la_mancha',
' guadalajara':' castilla_la_mancha',
' murcia':' murcia',
' cartagena':' murcia',
' palma':' baleares',
' mallorca':' baleares',
' ibiza':' baleares',
' menorca':' baleares',
' las palmas':' canarias',
' tenerife':' canarias',
' santa cruz de tenerife':' canarias',
' pamplona':' navarra',
' iruña':' navarra',
' logrono':' la_rioja',
' badajoz':' extremadura',
' merida':' extremadura',
' caceres':' extremadura'
};

interface HolidayDefinition {
 month: number; // 1-12
 day: number; // 1-31
 name: string;
 scope:' nacional' |' autonomico' |' local' |' vacacional';
 region?: string; // id comunidad autonoma
 city?: string; // id ciudad específica
 description?: string;
}

// Festivos fijos recurrentes (todos los años)
export const FIXED_HOLIDAYS: HolidayDefinition[] = [
 // Nacionales
 { month: 1, day: 1, name:' Año Nuevo', scope:' nacional', description:' Festivo nacional de Año Nuevo.' },
 { month: 1, day: 6, name:' Día de Reyes (Epifanía)', scope:' nacional', description:' Día de Reyes y fin de fiestas navideñas.' },
 { month: 5, day: 1, name:' Día del Trabajador', scope:' nacional', description:' Festivo nacional del Trabajo.' },
 { month: 8, day: 15, name:' Asunción de la Virgen', scope:' nacional', description:' Festivo nacional en pleno verano. Gran éxodo a playas.' },
 { month: 10, day: 12, name:' Fiesta Nacional de España (Día del Pilar)', scope:' nacional', description:' Festivo nacional (Fiesta Nacional de España).' },
 { month: 11, day: 1, name:' Todos los Santos', scope:' nacional', description:' Festivo nacional de Todos los Santos.' },
 { month: 12, day: 6, name:' Día de la Constitución', scope:' nacional', description:' Puente de Diciembre (Constitución).' },
 { month: 12, day: 8, name:' La Inmaculada Concepción', scope:' nacional', description:' Puente de Diciembre (Inmaculada).' },
 { month: 12, day: 25, name:' Navidad', scope:' nacional', description:' Festividad de Navidad.' },

 // Fiestas Autonómicas y Locales Clave
 // Madrid
 { month: 5, day: 2, name:' Día de la Comunidad de Madrid', scope:' autonomico', region:' madrid', description:' Puente de Mayo en Madrid.' },
 { month: 5, day: 15, name:' San Isidro (Patrón de Madrid)', scope:' local', city:' madrid', description:' Fiesta mayor patronal en Madrid capital. Fiestas en la pradera y éxodo.' },
 { month: 11, day: 9, name:' La Almudena', scope:' local', city:' madrid', description:' Patrona de Madrid capital.' },

 // Cataluña
 { month: 4, day: 23, name:' Sant Jordi (Día del Libro y la Rosa)', scope:' autonomico', region:' cataluna', description:' Gran día cultural en toda Cataluña (alta actividad en calles).' },
 { month: 6, day: 24, name:' Sant Joan', scope:' autonomico', region:' cataluna', description:' Verbena y festivo de San Juan en Cataluña y C. Valenciana.' },
 { month: 9, day: 11, name:' Diada de Catalunya', scope:' autonomico', region:' cataluna', description:' Día Nacional de Cataluña.' },
 { month: 9, day: 24, name:' La Mercè', scope:' local', city:' barcelona', description:' Fiesta mayor de Barcelona (conciertos gratuitos multitudinarios).' },
 { month: 12, day: 26, name:' Sant Esteve', scope:' autonomico', region:' cataluna', description:' Segundo día de Navidad en Cataluña.' },

 // C. Valenciana
 { month: 3, day: 19, name:' San José / Fallas', scope:' autonomico', region:' comunidad_valenciana', description:' Cremà de Fallas y festivo en Valencia.' },
 { month: 10, day: 9, name:' Día de la Comunitat Valenciana', scope:' autonomico', region:' comunidad_valenciana', description:' Día autonómico valenciano.' },

 // Andalucía
 { month: 2, day: 28, name:' Día de Andalucía', scope:' autonomico', region:' andalucia', description:' Día oficial de Andalucía.' },

 // País Vasco
 { month: 7, day: 25, name:' Santiago Apóstol', scope:' autonomico', region:' pais_vasco', description:' Día de Santiago.' },
 { month: 7, day: 25, name:' Día de Galicia', scope:' autonomico', region:' galicia', description:' Día Nacional de Galicia (Santiago de Compostela).' },

 // Aragón
 { month: 4, day: 23, name:' San Jorge / Día de Aragón', scope:' autonomico', region:' aragon', description:' Patrón y día autonómico de Aragón.' },
 { month: 10, day: 12, name:' Fiestas del Pilar', scope:' local', city:' zaragoza', description:' Semana de fiestas mayores en Zaragoza (calle abarrotada, salas compiten con pregón).' },

 // Navarra
 { month: 7, day: 7, name:' San Fermín', scope:' local', city:' pamplona', description:' Semana de San Fermín en Pamplona.' },

 // Canarias
 { month: 5, day: 30, name:' Día de Canarias', scope:' autonomico', region:' canarias', description:' Día autonómico de Canarias.' },

 // Asturias
 { month: 9, day: 8, name:' Día de Asturias (Virgen de Covadonga)', scope:' autonomico', region:' asturias', description:' Día de Asturias.' },

 // Cantabria
 { month: 7, day: 28, name:' Día de las Instituciones', scope:' autonomico', region:' cantabria', description:' Día de Cantabria.' },

 // Baleares
 { month: 3, day: 1, name:' Dia de les Illes Balears', scope:' autonomico', region:' baleares', description:' Día de las Islas Baleares.' },

 // Castilla y León
 { month: 4, day: 23, name:' Día de Castilla y León (Villalar)', scope:' autonomico', region:' castilla_y_leon', description:' Día autonómico de Castilla y León.' },

 // Castilla-La Mancha
 { month: 5, day: 31, name:' Día de Castilla-La Mancha', scope:' autonomico', region:' castilla_la_mancha', description:' Día de Castilla-La Mancha.' },

 // Extremadura
 { month: 9, day: 8, name:' Día de Extremadura', scope:' autonomico', region:' extremadura', description:' Día de Extremadura.' },

 // Murcia
 { month: 6, day: 9, name:' Día de la Región de Murcia', scope:' autonomico', region:' murcia', description:' Día de la Región de Murcia.' },

 // La Rioja
 { month: 6, day: 9, name:' Día de La Rioja', scope:' autonomico', region:' la_rioja', description:' Día de La Rioja.' }
];

// Cálculo de Semana Santa (Jueves y Viernes Santo móviles) por año
export function getEasterDates(year: number): { thursday: { month: number; day: number }; friday: { month: number; day: number }; monday?: { month: number; day: number } } {
 // Algoritmo de Butcher / Meeus para Domingo de Pascua
 const a = year % 19;
 const b = Math.floor(year / 100);
 const c = year % 100;
 const d = Math.floor(b / 4);
 const e = b % 4;
 const f = Math.floor((b + 8) / 25);
 const g = Math.floor((b - f + 1) / 3);
 const h = (19 * a + b - d - g + 15) % 30;
 const i = Math.floor(c / 4);
 const k = c % 4;
 const l = (32 + 2 * e + 2 * i - h - k) % 7;
 const m = Math.floor((a + 11 * h + 22 * l) / 451);
 const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = abril
 const day = ((h + l - 7 * m + 114) % 31) + 1; // Día de Domingo de Resurrección

 const sundayDate = new Date(year, month - 1, day);
 
 // Jueves Santo (-3 días)
 const thu = new Date(sundayDate);
 thu.setDate(thu.getDate() - 3);

 // Viernes Santo (-2 días)
 const fri = new Date(sundayDate);
 fri.setDate(fri.getDate() - 2);

 // Lunes de Pascua (+1 día, festivo en Cataluña, C. Valenciana, Euskadi, Navarra, Baleares)
 const mon = new Date(sundayDate);
 mon.setDate(mon.getDate() + 1);

 return {
 thursday: { month: thu.getMonth() + 1, day: thu.getDate() },
 friday: { month: fri.getMonth() + 1, day: fri.getDate() },
 monday: { month: mon.getMonth() + 1, day: mon.getDate() }
 };
}

function normalizeStr(str: string): string {
 return (str ||' ')
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g,' ')
 .trim();
}

/**
 * Función principal para auditar una fecha en una ciudad o a nivel global.
 */
export function auditDateAndCity(dateStr: string | Date | undefined | null, rawCity?: string): HolidayAuditResult | null {
 if (!dateStr) return null;

 let dateObj: Date;
 if (typeof dateStr ===' string') {
 // Manejar formato YYYY-MM-DD
 const parts = dateStr.split('T')[0].split('-');
 if (parts.length < 3) return null;
 const year = parseInt(parts[0], 10);
 const month = parseInt(parts[1], 10) - 1;
 const day = parseInt(parts[2], 10);
 dateObj = new Date(year, month, day);
 } else {
 dateObj = new Date(dateStr);
 }

 if (isNaN(dateObj.getTime())) return null;

 const year = dateObj.getFullYear();
 const month = dateObj.getMonth() + 1; // 1-12
 const day = dateObj.getDate();
 const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Lunes, ..., 5 = Viernes, 6 = Sábado
 const isoFormatted = `${year}-${String(month).padStart(2,' 0')}-${String(day).padStart(2,' 0')}`;

 const cleanCity = normalizeStr(rawCity ||' ');
 const userRegion = CITY_REGION_MAP[cleanCity] ||' ';

 // 1. Obtener Semana Santa del año en curso
 const easter = getEasterDates(year);

 // Comprobar festivos en la fecha seleccionada
 let matchedHoliday: HolidayDefinition | null = null;

 // Comprobar Semana Santa
 if (easter.friday.month === month && easter.friday.day === day) {
 matchedHoliday = {
 month, day,
 name:' Viernes Santo (Semana Santa)',
 scope:' nacional',
 description:' Festivo nacional de Viernes Santo. Éxodo vacacional masivo.'
 };
 } else if (easter.thursday.month === month && easter.thursday.day === day) {
 matchedHoliday = {
 month, day,
 name:' Jueves Santo',
 scope:' nacional',
 description:' Festivo en la mayoría de CC.AA. e inicio de las vacaciones de Semana Santa.'
 };
 } else if (easter.monday && easter.monday.month === month && easter.monday.day === day) {
 matchedHoliday = {
 month, day,
 name:' Lunes de Pascua',
 scope:' autonomico',
 description:' Festivo en Cataluña, C. Valenciana, País Vasco, Navarra, La Rioja y Baleares.'
 };
 }

 // Comprobar festivos fijos
 if (!matchedHoliday) {
 for (const h of FIXED_HOLIDAYS) {
 if (h.month === month && h.day === day) {
 if (h.scope ===' nacional') {
 matchedHoliday = h;
 break;
 } else if (h.scope ===' autonomico' && h.region && (h.region === userRegion || !userRegion)) {
 matchedHoliday = h;
 break;
 } else if (h.scope ===' local' && h.city && (cleanCity.includes(h.city) || h.city.includes(cleanCity))) {
 matchedHoliday = h;
 break;
 }
 }
 }
 }

 // 2. Comprobar si es VÍSPERA de un festivo (día anterior a un festivo importante)
 const tomorrow = new Date(dateObj);
 tomorrow.setDate(tomorrow.getDate() + 1);
 const tomYear = tomorrow.getFullYear();
 const tomMonth = tomorrow.getMonth() + 1;
 const tomDay = tomorrow.getDate();
 const tomEaster = getEasterDates(tomYear);

 let tomorrowHoliday: HolidayDefinition | null = null;

 if (tomEaster.friday.month === tomMonth && tomEaster.friday.day === tomDay) {
 tomorrowHoliday = { month: tomMonth, day: tomDay, name:' Viernes Santo', scope:' nacional' };
 } else if (tomEaster.thursday.month === tomMonth && tomEaster.thursday.day === tomDay) {
 tomorrowHoliday = { month: tomMonth, day: tomDay, name:' Jueves Santo', scope:' nacional' };
 } else {
 for (const h of FIXED_HOLIDAYS) {
 if (h.month === tomMonth && h.day === tomDay) {
 if (h.scope ===' nacional' || (h.scope ===' autonomico' && h.region === userRegion) || (h.scope ===' local' && h.city && cleanCity.includes(h.city))) {
 tomorrowHoliday = h;
 break;
 }
 }
 }
 }

 // 3. Evaluar Puente / Éxodo Vacacional / Oportunidad
 const isEve = !!tomorrowHoliday && dayOfWeek !== 6; // Víspera de festivo (excepto si el festivo cae en domingo)
 const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

 // Detección de macropuente de diciembre (Constitución 6 dic e Inmaculada 8 dic)
 const isPuenteDiciembre = month === 12 && day >= 4 && day <= 9;
 // Detección de primera quincena de agosto (éxodo veraniego absoluto en ciudades grandes)
 const isAgostoExodo = month === 8 && day >= 1 && day <= 20 && (cleanCity.includes('madrid') || cleanCity.includes('zaragoza') || cleanCity.includes('valladolid') || cleanCity.includes('sevilla') || cleanCity.includes('cordoba'));

 if (matchedHoliday) {
 // Si la fecha cae directamente en un festivo
 const isMajorExodus = matchedHoliday.name.includes('Semana Santa') || matchedHoliday.name.includes('Constitución') || matchedHoliday.name.includes('Inmaculada') || matchedHoliday.name.includes('Asunción') || matchedHoliday.name.includes('Año Nuevo') || matchedHoliday.name.includes('Navidad');

 const isHighRisk = isMajorExodus || (dayOfWeek === 1 || dayOfWeek === 5); // Festivo en lunes o viernes = fin de semana largo de 3 días

 return {
 date: isoFormatted,
 city: rawCity,
 isHoliday: true,
 isLongWeekend: dayOfWeek === 1 || dayOfWeek === 5 || dayOfWeek === 4 || dayOfWeek === 2,
 isEveOfHoliday: false,
 riskLevel: isHighRisk ?' high_risk' :' warning',
 holidayName: matchedHoliday.name,
 scope: matchedHoliday.scope,
 regionOrCity: matchedHoliday.city || matchedHoliday.region,
 title: `⚠️ ${matchedHoliday.name} (${matchedHoliday.scope ===' local' ?' Fiesta Local' : matchedHoliday.scope ===' autonomico' ?' Festivo Autonómico' :' Festivo Nacional'})`,
 description: matchedHoliday.description || `La fecha coincide con ${matchedHoliday.name}.`,
 advice: (dayOfWeek === 1 || dayOfWeek === 5 || isMajorExodus)
 ? `🚨 ¡Cuidado! Es fin de semana largo/puente en ${rawCity ||' la zona'}. Mucha gente viaja y las ciudades de interior suelen vaciarse. Conviene verificar que la sala no cierre y considerar si el público objetivo estará en la ciudad.`
 : `⚠️ Es festivo. Asegúrate de negociar con la sala los horarios de apertura y evaluar la afluencia prevista.`
 };
 }

 // Caso: Macro-puente de Diciembre (días intermedios entre 5 y 9 dic)
 if (isPuenteDiciembre) {
 return {
 date: isoFormatted,
 city: rawCity,
 isHoliday: false,
 isLongWeekend: true,
 isEveOfHoliday: isEve,
 riskLevel:' high_risk',
 holidayName:' Puente de la Constitución / Inmaculada',
 scope:' nacional',
 title: `🚨 Semana del Puente de Diciembre (Constitución / Inmaculada)`,
 description: `Periodo de macropuente tradicional en toda España (del 5 al 9 de Diciembre).`,
 advice: `Riesgo muy alto de éxodo en grandes capitales (Madrid, Barcelona, etc.). Si tocas en una ciudad de turismo rural o costa puede haber público, pero en salas urbanas la taquilla suele resentirse.`
 };
 }

 // Caso: Éxodo de Agosto en ciudades de interior
 if (isAgostoExodo) {
 return {
 date: isoFormatted,
 city: rawCity,
 isHoliday: false,
 isLongWeekend: false,
 isEveOfHoliday: false,
 riskLevel:' warning',
 holidayName:' Vacaciones de Agosto',
 scope:' vacacional',
 title: `☀️ Éxodo Vacacional de Agosto en ${rawCity}`,
 description: `Mes de vacaciones estivales masivas.`,
 advice: `En ciudades de interior durante agosto, gran parte del público está en zonas de costa. Ideal si es festival al aire libre o fiestas, pero arriesgado para salas de pago.`
 };
 }

 // Caso: VÍSPERA DE FESTIVO (Oportunidad de oro)
 if (isEve && tomorrowHoliday) {
 return {
 date: isoFormatted,
 city: rawCity,
 isHoliday: false,
 isLongWeekend: true,
 isEveOfHoliday: true,
 riskLevel:' opportunity',
 holidayName: `Víspera de ${tomorrowHoliday.name}`,
 scope: tomorrowHoliday.scope,
 title: `🎉 ¡Víspera de Festivo! (${tomorrowHoliday.name})`,
 description: `El día siguiente es no laborable (${tomorrowHoliday.name}).`,
 advice: `🔥 ¡Gran oportunidad! La gente sale de noche como si fuera viernes o sábado sin madrugar al día siguiente. Muy buena fecha para negociar cachés o taquilla.`
 };
 }

 return {
 date: isoFormatted,
 city: rawCity,
 isHoliday: false,
 isLongWeekend: false,
 isEveOfHoliday: false,
 riskLevel:' safe',
 title:' Fecha Normal de Gira',
 description:' No se detectan festivos ni puentes concurrentes en esta ubicación.',
 advice:' Calendario despejado. Fecha óptima para programación habitual.'
 };
}
