/**
 * Prepara los emails de una campaña de festivales: rellena la plantilla de la campaña con los datos reales de cada
 * festival (nombre, ciudad, estilos, fecha de su edición, idioma) y lo guarda como pitch del lead. Solo escribe el
 * texto: no cambia el estado ni manda nada, todo envío sigue pasando por la aprobación de una persona.
 * - Solo festivales de la campaña con estado «nuevo»: lo que ya está en curso no se toca.
 * - Un texto anterior se respeta; uno que salió de esta plantilla (empieza por «Asunto:») se actualiza. Con `sobrescribir`
 *   (una persona lo ha pedido a propósito) también se sustituyen los textos anteriores de los leads nuevos.
 */
import type { BookingCampaign, Lead } from '../../src/types.js';
import { leadMatchesCampaign } from '../../src/utils/campaignMatch.js';
import { normalizeType } from '../../src/utils/bookingUtils.js';
import { redactarPitchFestival } from '../../src/utils/plantillaFestival.js';

export interface PlanDePitches {
  escribir: Array<{ id: string; pitch: string }>;
  /** Leads de la campaña que ya están en curso (aprobados, con borrador, etc.): no se tocan. */
  enCurso: number;
  /** Leads con un texto anterior que no sale de la plantilla: no se pisan salvo que se pida `sobrescribir`. */
  conPitchPropio: number;
  /** Cuántos de los que se escriben sustituyen un texto anterior (solo con `sobrescribir`). */
  reemplazados: number;
}

export function planDePitches(leads: Lead[], campana: BookingCampaign, { banda, estiloBanda, ahora = new Date(), sobrescribir = false }: { banda: string; estiloBanda?: string; ahora?: Date; sobrescribir?: boolean }): PlanDePitches {
  const plan: PlanDePitches = { escribir: [], enCurso: 0, conPitchPropio: 0, reemplazados: 0 };
  if (campana.alcance !== 'festivales') return plan;
  const plantillas = { es: campana.customPitchTemplates?.festivales_email_es, en: campana.customPitchTemplates?.festivales_email_en };
  for (const lead of leads) {
    if (normalizeType(lead.tipo) !== 'festival' || lead.estado === 'no_interesado' || !leadMatchesCampaign(lead, campana)) continue;
    if (lead.estado !== 'nuevo') {
      plan.enCurso++;
      continue;
    }
    const actual = (lead.pitch_generado ?? '').trim();
    if (actual && !/^asunto\s*:/i.test(actual)) {
      if (!sobrescribir) {
        plan.conPitchPropio++;
        continue;
      }
      plan.reemplazados++;
    }
    plan.escribir.push({ id: lead.id, pitch: redactarPitchFestival(lead, { banda, estiloBanda, ahora, plantillas }) });
  }
  return plan;
}

export interface ResultadoPreparar {
  preparados: number;
  enCurso: number;
  conPitchPropio: number;
  reemplazados: number;
}

/** Aplica la plantilla de la campaña a los festivales de la banda y guarda los textos. `bandId` lo resuelve la ruta de la sesión. */
export async function prepararEmailsDeCampana(bandId: string, campaignId: string, { sobrescribir = false }: { sobrescribir?: boolean } = {}): Promise<ResultadoPreparar | null> {
  const { getSupabase, dbGetCampaigns, dbGetLeads } = await import('../db.js');
  const campana = (await dbGetCampaigns(bandId)).find((c: { id: string }) => c.id === campaignId);
  if (!campana) return null;
  const sb = getSupabase();
  const { data: banda } = await sb.from('registered_bands').select('nombre_banda').eq('band_id', bandId).maybeSingle();
  const { dbGetEpkConfig } = await import('../db/epk.js');
  const epk = await dbGetEpkConfig(bandId).catch(() => null);
  const plan = planDePitches((await dbGetLeads(bandId)) as unknown as Lead[], campana as unknown as BookingCampaign, { banda: banda?.nombre_banda || 'Tu banda', estiloBanda: String(epk?.genero ?? '').trim() || undefined, sobrescribir });

  let preparados = 0;
  for (let i = 0; i < plan.escribir.length; i += 25) {
    const lote = plan.escribir.slice(i, i + 25);
    const resultados = await Promise.all(
      lote.map(({ id, pitch }) => sb.from('leads').update({ pitch_generado: pitch }).eq('id', id).eq('band_id', bandId).eq('estado', 'nuevo')),
    );
    preparados += resultados.filter((r) => !r.error).length;
  }
  return { preparados, enCurso: plan.enCurso, conPitchPropio: plan.conPitchPropio, reemplazados: plan.reemplazados };
}
