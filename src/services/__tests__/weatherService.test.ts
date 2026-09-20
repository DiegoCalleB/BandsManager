import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
 fetchEventWeather, 
 detectWeatherAlerts, 
 getCachedEventWeatherAlerts,
 WeatherAlert 
} from '../weatherService';

describe('weatherService', () => {
 beforeEach(() => {
 vi.restoreAllMocks();
 });

 describe('detectWeatherAlerts', () => {
 it('detecta alerta de tormenta eléctrica si el código meteorológico indica tormenta', () => {
 const alerts = detectWeatherAlerts({
 weatherCode: 95,
 temperature: 20,
 rainProbability: 80,
 rainVolumeMm: 12,
 windGusts: 45
 });

 const stormAlert = alerts.find(a => a.id === 'storm');
 expect(stormAlert).toBeDefined();
 expect(stormAlert?.severity).toBe('danger');
 expect(stormAlert?.icon).toBe('lightning');
 expect(stormAlert?.shortAdvice).toContain('Riesgo eléctrico en escenario');
 });

 it('detecta alerta de lluvia moderada o intensa con recomendaciones para escenario', () => {
 const alerts = detectWeatherAlerts({
 weatherCode: 63,
 temperature: 18,
 rainProbability: 85,
 rainVolumeMm: 8.5,
 windGusts: 25
 });

 const rainAlert = alerts.find(a => a.id === 'rain');
 expect(rainAlert).toBeDefined();
 expect(rainAlert?.severity).toBe('danger');
 expect(rainAlert?.icon).toBe('rain');
 expect(rainAlert?.shortAdvice).toContain('Lluvia intensa');
 expect(rainAlert?.fullAdvice.some(tip => tip.includes('lonas impermeables'))).toBe(true);
 });

 it('detecta alerta de frío extremo para temperaturas bajas y sensación térmica', () => {
 const alerts = detectWeatherAlerts({
 weatherCode: 71,
 temperature: 1,
 apparentTemperature: -2,
 rainProbability: 20,
 rainVolumeMm: 0,
 windGusts: 15
 });

 const coldAlert = alerts.find(a => a.id === 'cold');
 expect(coldAlert).toBeDefined();
 expect(coldAlert?.severity).toBe('danger');
 expect(coldAlert?.icon).toBe('snow');
 expect(coldAlert?.shortAdvice).toContain('Frío extremo');
 expect(coldAlert?.fullAdvice.some(tip => tip.includes('cañones de calor') || tip.includes('desafinan'))).toBe(true);
 });

 it('detecta alerta de viento extremo con riesgo para torres de luces y PA volada', () => {
 const alerts = detectWeatherAlerts({
 weatherCode: 3,
 temperature: 22,
 rainProbability: 10,
 rainVolumeMm: 0,
 windGusts: 65
 });

 const windAlert = alerts.find(a => a.id === 'wind');
 expect(windAlert).toBeDefined();
 expect(windAlert?.severity).toBe('danger');
 expect(windAlert?.icon).toBe('wind');
 expect(windAlert?.shortAdvice).toContain('Viento extremo');
 expect(windAlert?.fullAdvice.some(tip => tip.includes('bajar tiros') || tip.includes('torres de PA'))).toBe(true);
 });

 it('no genera alertas si las condiciones son estables y agradables', () => {
 const alerts = detectWeatherAlerts({
 weatherCode: 0,
 temperature: 21,
 apparentTemperature: 21,
 rainProbability: 5,
 rainVolumeMm: 0,
 windGusts: 12
 });

 expect(alerts).toHaveLength(0);
 });
 });

 describe('fetchEventWeather & getCachedEventWeatherAlerts', () => {
 it('devuelve estructura consistente si la fecha es inválida o vacía', async () => {
 const result = await fetchEventWeather({ city: '', dateStr: '' });
 expect(result.status).toBe('error');
 expect(result.alerts).toEqual([]);
 });

 it('permite consultar alertas sincronizadas en caché de forma síncrona', () => {
 const cached = getCachedEventWeatherAlerts('Madrid', '2026-06-15');
 expect(Array.isArray(cached)).toBe(true);
 });
 });
});
