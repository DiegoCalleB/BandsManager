import { BookingCampaign, Lead } from '../types';

// Único criterio de "esta sala encaja en la campaña", compartido por GlobalCampaignBar (el
// contador "Salas (N)" de la barra superior) y BookingCRM (el listado real que se ve al pulsar
// ese botón). Antes cada uno tenía su propia copia de esta lógica y no coincidían: la barra
// aplicaba un margen de tolerancia del ±30% sobre el aforo (para "adelantar" cuántas salas más o
// menos encajan), mientras que el listado de Booking Salas filtraba por el rango exacto. El
// resultado era que el contador prometía más salas de las que luego aparecían filtradas: no era
// que el filtro fallara a veces, es que nunca fue el mismo filtro.
export function leadMatchesCampaignCity(lead: Lead, campaign: BookingCampaign): boolean {
  const targetCities = ((campaign.targetCities || (campaign as any).target_cities || []) as string[])
    .map(c => c.toLowerCase().trim())
    .filter(Boolean);
  const targetRegions = (((campaign as any).targetRegions || (campaign as any).target_regions || []) as string[])
    .map(r => r.toLowerCase().trim())
    .filter(Boolean);

  if (targetCities.length === 0 && targetRegions.length === 0) return true;

  const leadCity = (lead.ciudad || '').toLowerCase().trim();
  const leadRegion = (lead.region || '').toLowerCase().trim();

  return targetCities.some(c =>
    leadCity.includes(c) || leadRegion.includes(c) || (c.includes('madrid') && (leadCity.includes('madrid') || leadRegion.includes('madrid')))
  ) || targetRegions.some(r => leadCity.includes(r) || leadRegion.includes(r));
}

export function leadMatchesCampaignCapacity(lead: Lead, campaign: BookingCampaign): boolean {
  const cap = Number(lead.aforo) || 0;
  const minCap = Number(campaign.minCapacity || (campaign as any).min_capacity || 0);
  const maxCap = Number(campaign.maxCapacity || (campaign as any).max_capacity || Infinity);

  // Una sala sin aforo registrado no se descarta: no hay dato con el que contradecir la campaña.
  if (cap === 0) return true;
  return cap >= minCap && cap <= maxCap;
}

export function leadMatchesCampaign(lead: Lead, campaign: BookingCampaign): boolean {
  const isMedio = !!lead.tipo && (String(lead.tipo).includes('medio') || String(lead.tipo).includes('prensa') || String(lead.tipo).includes('radio'));
  if (isMedio) return false;
  return leadMatchesCampaignCity(lead, campaign) && leadMatchesCampaignCapacity(lead, campaign);
}
