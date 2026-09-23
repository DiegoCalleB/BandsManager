/**
 * CAMPAIGN RADAR SCHEDULER
 * 
 * Mantiene la disponibilidad de fechas y carteleras de recintos constantemente
 * actualizada en segundo plano para todos los leads de cualquier campaña activa.
 * 
 * Permite que el Agente Redactor (PitchEngine) disponga siempre de fines de semana
 * libres actualizados al redactar o regenerar propuestas.
 */

import { dbGetRegisteredBands, dbGetCampaigns, dbGetLeads, dbUpsertLead } from "../db.js";
import { detectVenueEventsAndFreeDates } from "./venueEventsRadarService.js";
import { captureError } from "../utils/errorTracking.js";

// Mapa en memoria para evitar re-esccanear el mismo lead en ciclos muy seguidos
const lastScanTimestampByLead: Record<string, number> = {};
const SCAN_INTERVAL_MS = 12 * 60 * 60 * 1000; // Recarga de radar cada 12h por lead

/**
 * Escanea y actualiza la disponibilidad de fechas para todos los leads de las campañas activas.
 */
export async function syncActiveCampaignsRadar(targetBandId?: string): Promise<{
  scannedBands: number;
  scannedLeads: number;
  updatedDatesCount: number;
}> {
  let scannedBands = 0;
  let scannedLeads = 0;
  let updatedDatesCount = 0;

  try {
    const bands = targetBandId 
      ? [{ band_id: targetBandId }] 
      : await dbGetRegisteredBands();

    for (const band of bands) {
      const bandId = band.band_id;
      if (!bandId) continue;

      scannedBands++;

      // 1. Obtener campañas activas
      const campaigns = await dbGetCampaigns(bandId);
      const activeCampaign = campaigns.find(c => c.isActive || (c as any).is_active);

      // Si no hay campaña activa explícita, se toma el listado general de leads
      const allLeads = await dbGetLeads(bandId);
      if (!allLeads || allLeads.length === 0) continue;

      // Filtrar leads válidos con nombre de sala
      const targetLeads = allLeads.filter(l => l.nombre_sala && l.nombre_sala.trim().length > 0);

      // Priorizar leads que aún no tengan fechas_libres_detectadas o que no se hayan escaneado en >12h
      const now = Date.now();
      const pendingLeads = targetLeads.filter(l => {
        const lastScan = lastScanTimestampByLead[l.id] || 0;
        const missingDates = !l.fechas_libres_detectadas || l.fechas_libres_detectadas.length === 0;
        return missingDates || (now - lastScan > SCAN_INTERVAL_MS);
      });

      // Procesar un lote prudente por ciclo (hasta 5 leads por banda por tick para optimizar recursos)
      const batchToProcess = pendingLeads.slice(0, 5);

      for (const lead of batchToProcess) {
        try {
          lastScanTimestampByLead[lead.id] = now;
          const targetDates = activeCampaign?.targetDates || activeCampaign?.targetDatesText;
          const radar = await detectVenueEventsAndFreeDates(lead.nombre_sala, lead.ciudad || "", targetDates, lead.website);
          
          if (radar.success && Array.isArray(radar.fechas_libres_detectadas)) {
            const hasChanges = 
              JSON.stringify(lead.fechas_libres_detectadas || []) !== JSON.stringify(radar.fechas_libres_detectadas || []);

            if (hasChanges) {
              const updatedLead = {
                ...lead,
                fechas_ocupadas: radar.fechas_ocupadas || [],
                fechas_libres_detectadas: radar.fechas_libres_detectadas || []
              };
              await dbUpsertLead(updatedLead, bandId);
              updatedDatesCount += (radar.fechas_libres_detectadas.length || 0);
            }
          }
          scannedLeads++;
        } catch (err) {
          console.warn(`[CampaignRadarScheduler] Error en radar para ${lead.nombre_sala}:`, err);
        }
      }
    }
  } catch (error) {
    console.error("[CampaignRadarScheduler] Error ejecutando syncActiveCampaignsRadar:", error);
    captureError(error, { fase: "syncActiveCampaignsRadar" });
  }

  return { scannedBands, scannedLeads, updatedDatesCount };
}
