/**
 * weatherService.ts
 * Servicio meteorológico para conciertos y ensayos en directo.
 * Utiliza la API pública de Open-Meteo (Open Source, sin API Key, gratuita y precisa).
 */

export interface WeatherAlert {
 id:' rain' |' storm' |' cold' |' wind';
 severity:' warning' |' danger';
 title: string;
 badge: string; // e.g. "🌧️ Lluvia 75%", "❄️ Frío Extremo 2°C", "💨 Viento 54 km/h", "⚡ Tormenta"
 shortAdvice: string;
 fullAdvice: string[];
 icon:' rain' |' lightning' |' snow' |' wind' |' thermometer';
}

export interface EventWeatherData {
 status:' loading' |' success' |' future' |' past' |' error';
 temperature?: number;
 apparentTemperature?: number;
 rainProbability?: number;
 rainVolumeMm?: number;
 windSpeed?: number;
 windGusts?: number;
 weatherCode?: number;
 conditionText?: string;
 iconType?:' sun' |' cloud-sun' |' cloud' |' rain' |' lightning' |' snow' |' fog';
 alerts: WeatherAlert[];
 isOutdoorAlert?: boolean;
 outdoorAlertMessage?: string;
 cityName?: string;
 forecastDate?: string;
 forecastHour?: string;
 error?: string;
}

interface GeocodingResult {
 latitude: number;
 longitude: number;
 name: string;
 country?: string;
 admin1?: string;
}

// Caché en memoria durante la sesión (2 horas de TTL)
const weatherCache = new Map<string, { timestamp: number; data: EventWeatherData }>();
const geocodeCache = new Map<string, { timestamp: number; result: GeocodingResult | null }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Traduce el código meteorológico WMO de Open-Meteo a texto e icono
 */
function interpretWeatherCode(code: number): {
 conditionText: string;
 iconType: EventWeatherData['iconType'];
} {
 switch (code) {
 case 0:
 return { conditionText:' Cielo despejado', iconType:' sun' };
 case 1:
 return { conditionText:' Mayormente despejado', iconType:' cloud-sun' };
 case 2:
 return { conditionText:' Intervalos nubosos', iconType:' cloud-sun' };
 case 3:
 return { conditionText:' Nublado', iconType:' cloud' };
 case 45:
 case 48:
 return { conditionText:' Niebla / Neblina', iconType:' fog' };
 case 51:
 case 53:
 case 55:
 return { conditionText:' Llovizna fina', iconType:' rain' };
 case 61:
 return { conditionText:' Lluvia débil', iconType:' rain' };
 case 63:
 return { conditionText:' Lluvia moderada', iconType:' rain' };
 case 65:
 return { conditionText:' Lluvia fuerte', iconType:' rain' };
 case 71:
 case 73:
 case 75:
 return { conditionText:' Nieve', iconType:' snow' };
 case 80:
 case 81:
 case 82:
 return { conditionText:' Chubascos', iconType:' rain' };
 case 95:
 return { conditionText:' Tormenta eléctrica', iconType:' lightning' };
 case 96:
 case 99:
 return { conditionText:' Tormenta con granizo', iconType:' lightning' };
 default:
 return { conditionText:' Tiempo variable', iconType:' cloud-sun' };
 }
}

/**
 * Geocodifica el nombre de una ciudad a coordenadas (latitud/longitud) usando Open-Meteo
 */
async function geocodeCity(cityQuery: string): Promise<GeocodingResult | null> {
 const cleanCity = cityQuery.trim().toLowerCase();
 if (!cleanCity) return null;

 const cached = geocodeCache.get(cleanCity);
 if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS * 12) {
 return cached.result;
 }

 try {
 const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=es&format=json`;
 const res = await fetch(url);
 if (!res.ok) return null;
 const json = await res.json();
 if (!json.results || json.results.length === 0) {
 geocodeCache.set(cleanCity, { timestamp: Date.now(), result: null });
 return null;
 }

 const first = json.results[0];
 const result: GeocodingResult = {
 latitude: first.latitude,
 longitude: first.longitude,
 name: first.name,
 country: first.country,
 admin1: first.admin1
 };
 geocodeCache.set(cleanCity, { timestamp: Date.now(), result });
 return result;
 } catch (err) {
 console.warn('[Weather] Geocoding error for:', cityQuery, err);
 return null;
 }
}

export interface DetectAlertsParams {
 weatherCode: number;
 temperature: number;
 apparentTemperature?: number;
 rainProbability?: number;
 rainVolumeMm?: number;
 windSpeed?: number;
 windGusts?: number;
}

export function detectWeatherAlerts(params: DetectAlertsParams): WeatherAlert[] {
 const alerts: WeatherAlert[] = [];
 const wCode = params.weatherCode;
 const temp = params.temperature;
 const apparentTemp = params.apparentTemperature ?? temp;
 const rainProb = params.rainProbability ?? 0;
 const rainMm = params.rainVolumeMm ?? 0;
 const windSpeed = params.windSpeed ?? 0;
 const windGusts = params.windGusts ?? windSpeed;

 // 1. Alerta de Lluvia / Tormenta
 const isThunderstorm = [95, 96, 99].includes(wCode);
 const isRainy = rainProb >= 40 || rainMm >= 0.5 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(wCode);

 if (isThunderstorm) {
 alerts.push({
 id:' storm',
 severity:' danger',
 title:' Alerta de Tormenta Eléctrica',
 badge:' ⚡ Tormenta Eléctrica',
 shortAdvice:' Riesgo eléctrico en escenario. Verificar diferenciales y tomas de tierra antes del show.',
 fullAdvice: [
' Comprobar toma de tierra con el técnico de sonido de la sala antes de encender amplificadores a válvulas.',
' En escenario al aire libre, suspender pruebas de sonido si hay aparato eléctrico cercano sin carpa homologada.',
' Disponer de fundas de plástico y lonas impermeables preparadas junto a pedaleras y mesa FOH.'
 ],
 icon:' lightning'
 });
 } else if (isRainy) {
 const isHeavy = rainProb >= 70 || rainMm >= 3 || [65, 82].includes(wCode);
 alerts.push({
 id:' rain',
 severity: isHeavy ?' danger' :' warning',
 title: isHeavy ? `Alerta de Lluvia Intensa (${rainProb}%)` : `Aviso de Lluvia Prevista (${rainProb}%)`,
 badge: `🌧️ Lluvia ${rainProb}%`,
 shortAdvice: isHeavy 
 ? `Lluvia intensa (${rainProb}%${rainMm > 0 ? ` · ~${rainMm} mm` :' '}). Proteger amplificadores, pedaleras y baterías en exterior.`
 : `Probabilidad de lluvia del ${rainProb}%${rainMm > 0 ? ` (~${rainMm} mm)` :' '}. Proteger amplificadores, pedaleras y baterías en exterior.`,
 fullAdvice: [
' Exteriores: Exigir a la organización carpa estanca sobre la tarima y sobre la zona de control de sonido.',
' Coordinar con la banda lonas impermeables de despliegue rápido para cubrir el backline en caso de chubasco repentino.',
' Cuidado con la humedad en parches de percusión y componentes electrónicos de teclados y sintetizadores.'
 ],
 icon:' rain'
 });
 }

 // 2. Alerta de Frío Extremo
 if (temp <= 8 || apparentTemp <= 6) {
 const isExtremeCold = temp <= 3 || apparentTemp <= 1;
 alerts.push({
 id:' cold',
 severity: isExtremeCold ?' danger' :' warning',
 title: isExtremeCold 
 ? `Alerta por Frío Extremo (${temp}°C · Sensación ${apparentTemp}°C)` 
 : `Aviso por Bajas Temperaturas (${temp}°C)`,
 badge: isExtremeCold ? `❄️ Frío Extremo ${temp}°C` : `❄️ Frío ${temp}°C`,
 shortAdvice: isExtremeCold
 ?' Frío extremo: desajuste rápido en afinación de guitarras/bajos, pérdida de tacto en dedos y fatiga vocal.'
 :' Temperatura fresca: mantener instrumentos atemperados y calentar voz con antelación.',
 fullAdvice: [
' Instrumentos: Los mástiles de madera sufren contracción rápida. Aclimatar dentro de sus fundas en la sala 45 minutos antes de desenfundar.',
' Cuerdas: Las cuerdas frías se vuelven rígidas y desafinan con brusquedad bajo los focos calientes del escenario.',
' Cantantes: El aire frío deshidrata e inflama cuerdas vocales. Tomar infusiones tibias y calentar voz 30 minutos antes del bolo.',
' Escenario: Solicitar cañones de calor o estufas en tarima y camerinos para no perder movilidad en las manos.'
 ],
 icon:' snow'
 });
 }

 // 3. Alerta de Viento Extremo
 if (windGusts >= 40 || windSpeed >= 30) {
 const isExtremeWind = windGusts >= 55 || windSpeed >= 40;
 alerts.push({
 id:' wind',
 severity: isExtremeWind ?' danger' :' warning',
 title: isExtremeWind 
 ? `Alerta por Viento Extremo (Rachas ${windGusts} km/h)` 
 : `Aviso por Viento Fuerte (Rachas ${windGusts} km/h)`,
 badge: `💨 Viento ${windGusts} km/h`,
 shortAdvice: isExtremeWind
 ? `Viento extremo con rachas de ${windGusts} km/h. Peligro de' efecto vela' en telones y desestabilización de trusses.`
 : `Rachas de viento de ${windGusts} km/h. Peligro de' efecto vela' en telones y desestabilización de trusses.`,
 fullAdvice: [
' Seguridad estructural: Normativa técnica de escenario obliga a retirar o perforar telones traseros (backdrops) opacos con vientos fuertes, bajar tiros y vigilar torres de PA.',
' Asegurar y lastrar con sacos de arena o pesas los pies de micro, torres de focos y monitores de cuña en el borde de tarima.',
' Sonido: El viento desvía los agudos del equipo de sonido exterior (PA); avisar al técnico para compensar ecualización.'
 ],
 icon:' wind'
 });
 }

 return alerts;
}

/**
 * Obtiene la previsión meteorológica para la fecha y hora de un evento en una ciudad dada.
 */
export async function fetchEventWeather(params: {
 city: string;
 dateStr: string; // YYYY-MM-DD
 timeStr?: string; // HH:mm o formato libre (ej. "21:00", "21:30")
}): Promise<EventWeatherData> {
 const { city, dateStr, timeStr } = params;

 if (!city || !city.trim()) {
 return {
 status:' error',
 alerts: [],
 error:' No se ha indicado ciudad para la previsión meteorológica'
 };
 }

 // Parsear fecha
 const targetDate = new Date(`${dateStr}T12:00:00`);
 if (isNaN(targetDate.getTime())) {
 return {
 status:' error',
 alerts: [],
 error:' Fecha del evento no válida'
 };
 }

 const now = new Date();
 const diffTime = targetDate.getTime() - now.getTime();
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

 // Si el evento ocurrió hace más de 1 día:
 if (diffDays < -1) {
 return {
 status:' past',
 alerts: [],
 cityName: city,
 conditionText:' Concierto ya celebrado'
 };
 }

 // Si el evento es en más de 15 días: Open-Meteo cubre hasta 16 días
 if (diffDays > 15) {
 return {
 status:' future',
 alerts: [],
 cityName: city,
 forecastDate: dateStr,
 conditionText: `Previsión meteorológica disponible a partir del ${new Date(targetDate.getTime() - 14 * 86400000).toLocaleDateString('es-ES', { day:' numeric', month:' short' })} (14 días antes del evento)`
 };
 }

 // Extraer hora objetivo (por defecto 21:00h si no se especifica o no es válida)
 let targetHour = 21;
 if (timeStr) {
 const match = timeStr.match(/(\d{1,2})[:.](\d{2})?/);
 if (match) {
 const parsedHour = parseInt(match[1], 10);
 if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour <= 23) {
 targetHour = parsedHour;
 }
 }
 }

 const hourFormatted = `${String(targetHour).padStart(2,' 0')}:00`;
 const cacheKey = `${city.trim().toLowerCase()}_${dateStr}_${hourFormatted}`;

 const cached = weatherCache.get(cacheKey);
 if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
 return cached.data;
 }

 // 1. Geocodificar ciudad
 const geo = await geocodeCity(city);
 if (!geo) {
 const fallback: EventWeatherData = {
 status:' error',
 alerts: [],
 cityName: city,
 error: `No se pudo localizar geográficamente "${city}"`
 };
 return fallback;
 }

 // 2. Consultar previsión horaria a Open-Meteo
 try {
 const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,windspeed_10m,windgusts_10m&timezone=auto&forecast_days=16`;
 const res = await fetch(weatherUrl);
 if (!res.ok) {
 throw new Error(`Open-Meteo HTTP ${res.status}`);
 }

 const json = await res.json();
 const hourly = json.hourly;
 if (!hourly || !hourly.time || hourly.time.length === 0) {
 throw new Error('Formato de respuesta horaria inválido');
 }

 // Buscar el índice exacto para "YYYY-MM-DDTHH:00"
 const targetIsoPrefix = `${dateStr}T${hourFormatted}`;
 let matchIdx = hourly.time.findIndex((t: string) => t.startsWith(targetIsoPrefix));

 // Si no coincide exactamente, buscar la más cercana de ese día
 if (matchIdx === -1) {
 matchIdx = hourly.time.findIndex((t: string) => t.startsWith(`${dateStr}T`));
 }

 if (matchIdx === -1) {
 // Fuera de rango
 const data: EventWeatherData = {
 status:' future',
 alerts: [],
 cityName: geo.name,
 forecastDate: dateStr,
 conditionText:' Previsión aún no disponible para esta fecha'
 };
 weatherCache.set(cacheKey, { timestamp: Date.now(), data });
 return data;
 }

 const temp = Math.round(hourly.temperature_2m[matchIdx] ?? 20);
 const apparentTemp = Math.round(hourly.apparent_temperature?.[matchIdx] ?? temp);
 const rainProb = Math.round(hourly.precipitation_probability?.[matchIdx] ?? 0);
 const rainMm = Math.round((hourly.precipitation?.[matchIdx] ?? 0) * 10) / 10;
 const wCode = hourly.weathercode?.[matchIdx] ?? 0;
 const windSpeed = Math.round(hourly.windspeed_10m?.[matchIdx] ?? 0);
 const windGusts = Math.round(hourly.windgusts_10m?.[matchIdx] ?? windSpeed);

 const { conditionText, iconType } = interpretWeatherCode(wCode);

 const alerts = detectWeatherAlerts({
 weatherCode: wCode,
 temperature: temp,
 apparentTemperature: apparentTemp,
 rainProbability: rainProb,
 rainVolumeMm: rainMm,
 windSpeed,
 windGusts
 });

 const isOutdoorAlert = alerts.length > 0;
 const outdoorAlertMessage = alerts.map(a => a.shortAdvice).join(' |' );

 const resultData: EventWeatherData = {
 status:' success',
 temperature: temp,
 apparentTemperature: apparentTemp,
 rainProbability: rainProb,
 rainVolumeMm: rainMm,
 windSpeed,
 windGusts,
 weatherCode: wCode,
 conditionText,
 iconType,
 alerts,
 isOutdoorAlert,
 outdoorAlertMessage,
 cityName: geo.name,
 forecastDate: dateStr,
 forecastHour: hourFormatted
 };

 weatherCache.set(cacheKey, { timestamp: Date.now(), data: resultData });
 return resultData;
 } catch (err: any) {
 console.warn('[Weather] Error fetching forecast:', err);
 return {
 status:' error',
 alerts: [],
 cityName: geo.name,
 error:' No se pudo conectar con el servicio meteorológico'
 };
 }
}

/**
 * Consulta la caché en memoria para devolver alertas existentes de una ciudad y fecha
 */
export function getCachedEventWeatherAlerts(city: string, dateStr: string): WeatherAlert[] {
 if (!city || !dateStr) return [];
 const cleanCity = city.trim().toLowerCase();
 for (const [key, item] of weatherCache.entries()) {
 if (key.startsWith(`${cleanCity}_${dateStr}`)) {
 if (item.data.alerts && item.data.alerts.length > 0) {
 return item.data.alerts;
 }
 }
 }
 return [];
}
