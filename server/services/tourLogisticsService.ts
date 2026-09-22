/**
 * TOUR LOGISTICS, ROUTE & FUEL CALCULATOR SERVICE
 *
 * Calcula distancia real por carretera, tiempo de conducción en furgoneta,
 * consumo y coste de combustible (diésel furgoneta 9L/100km), peajes y recomendaciones logísticas.
 */

import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";

export interface TourLogisticsResult {
  success: boolean;
  origen: string;
  destino: string;
  distancia_km: number;
  tiempo_conduccion: string;
  coste_gasolina_estimado: number;
  peajes_estimados: number;
  coste_total_viaje: number;
  recomendacion_logistica: string;
}

export async function calculateTourLogistics(
  originCity: string = "Madrid",
  destinationCity: string = "Madrid",
  venueAddress?: string
): Promise<TourLogisticsResult> {
  const cleanOrigin = originCity?.trim() || "Madrid";
  const cleanDest = destinationCity?.trim() || "Madrid";
  const isSameCity = cleanOrigin.toLowerCase() === cleanDest.toLowerCase();

  if (isSameCity) {
    return {
      success: true,
      origen: cleanOrigin,
      destino: cleanDest,
      distancia_km: 18,
      tiempo_conduccion: "25 - 35 min",
      coste_gasolina_estimado: 6,
      peajes_estimados: 0,
      coste_total_viaje: 6,
      recomendacion_logistica: "Bolo local en misma ciudad. Desplazamiento ágil en furgoneta/coches particulares sin necesidad de pernocta."
    };
  }

  try {
    const ai = getAiClient();
    const prompt = `Actúa como un gestor de logística y road manager para bandas en gira por España.
Calcula los datos de ruta por carretera para un desplazamiento en furgoneta de 9 plazas desde "${cleanOrigin}" hasta "${cleanDest}" ${venueAddress ? `(dirección: ${venueAddress})` : ""}, España.

Calcula:
1. Distancia real en kilómetros (ida).
2. Tiempo estimado de conducción respetando límites de furgoneta.
3. Coste estimado de combustible (gasóleo A a 1.45 €/L, consumo furgoneta 9 L / 100 km).
4. Peajes estimados de autopistas de peaje (AP) en la ruta habitual.
5. Recomendación práctica para la banda (si conviene pernoctar, turnos de conducción, hora de salida recomendada).

Devuelve ÚNICAMENTE un JSON con esta estructura exacta:
{
  "distancia_km": number, // ej: 350
  "tiempo_conduccion": "string (ej: '3h 30min')",
  "coste_gasolina_estimado": number, // ida
  "peajes_estimados": number, // ida
  "coste_total_viaje": number, // ida + vuelta (combustible + peajes)
  "recomendacion_logistica": "string con consejo de road manager"
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const parsed = safeParseJson(response.text || "{}");
    if (parsed && typeof parsed.distancia_km === "number") {
      const dist = Math.max(5, parsed.distancia_km);
      const fuelCostOneWay = Math.round(dist * 0.09 * 1.45);
      const tollsOneWay = parsed.peajes_estimados || 0;
      const totalRoundTrip = (fuelCostOneWay * 2) + (tollsOneWay * 2);

      return {
        success: true,
        origen: cleanOrigin,
        destino: cleanDest,
        distancia_km: dist,
        tiempo_conduccion: parsed.tiempo_conduccion || `${Math.round(dist / 90)}h ${Math.round((dist % 90) * 0.6)}min`,
        coste_gasolina_estimado: fuelCostOneWay,
        peajes_estimados: tollsOneWay,
        coste_total_viaje: parsed.coste_total_viaje || totalRoundTrip,
        recomendacion_logistica: parsed.recomendacion_logistica || `Salida recomendada con 2h de margen antes de la prueba de sonido.`
      };
    }
  } catch (err: any) {
    console.warn("Error calculating tour logistics via AI:", err?.message);
  }

  // Fallback heurístico de distancias principales desde Madrid
  const distancesFromMadrid: Record<string, number> = {
    barcelona: 620,
    valencia: 355,
    sevilla: 535,
    bilbao: 400,
    zaragoza: 320,
    malaga: 530,
    murcia: 400,
    valladolid: 215,
    toledo: 75,
    guadalajara: 60,
    segovia: 95
  };

  const matchedCity = Object.keys(distancesFromMadrid).find(c => cleanDest.toLowerCase().includes(c));
  const km = matchedCity ? distancesFromMadrid[matchedCity] : 300;
  const fuelOneWay = Math.round(km * 0.09 * 1.45);
  const totalTrip = fuelOneWay * 2;

  return {
    success: true,
    origen: cleanOrigin,
    destino: cleanDest,
    distancia_km: km,
    tiempo_conduccion: `${Math.floor(km / 90)}h ${Math.round((km % 90) * 0.6)}min`,
    coste_gasolina_estimado: fuelOneWay,
    peajes_estimados: 0,
    coste_total_viaje: totalTrip,
    recomendacion_logistica: `Ruta directa por autovía. Salir con suficiente margen para llegar al soundcheck sin prisas.`
  };
}
