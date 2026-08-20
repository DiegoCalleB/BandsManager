import { getSupabase, cleanBandId } from "./core.js";

function getMemoryFallbackSchedule(cleanId: string) {
  if (inMemorySchedules[cleanId]) {
    return inMemorySchedules[cleanId];
  }
  return {
    band_id: cleanId,
    timezone: 'Europe/Madrid',
    horas_lector: [8, 12, 16, 20],
    horas_enviador: [9, 10, 11, 12, 13],
    dias_enviador: [2, 3, 4], // Martes, Miércoles, Jueves (Recomendado Booking)
    dias_lector: [1, 2, 3, 4, 5, 6, 7]
  };
}

export async function dbGetBandSchedule(bandId: string) {
  const cleanId = bandId ? bandId.trim() : 'bakandeya';
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('band_schedules')
      .select('*')
      .eq('band_id', cleanId)
      .maybeSingle();

    if (error) {
      console.warn('Notice fetching band schedule from Supabase:', error.message || error);
      return getMemoryFallbackSchedule(cleanId);
    }

    if (!data) {
      return getMemoryFallbackSchedule(cleanId);
    }

    const schedule = {
      band_id: data.band_id,
      timezone: data.timezone || 'Europe/Madrid',
      horas_lector: Array.isArray(data.horas_lector) ? data.horas_lector.map((n: any) => Number(n)) : [8, 12, 16, 20],
      horas_enviador: Array.isArray(data.horas_enviador) ? data.horas_enviador.map((n: any) => Number(n)) : [9, 10, 11, 12, 13],
      dias_enviador: Array.isArray(data.dias_enviador) ? data.dias_enviador.map((n: any) => Number(n)) : [2, 3, 4],
      dias_lector: Array.isArray(data.dias_lector) ? data.dias_lector.map((n: any) => Number(n)) : [1, 2, 3, 4, 5, 6, 7]
    };
    inMemorySchedules[cleanId] = schedule;
    return schedule;
  } catch (err) {
    console.warn('Fallback reading band schedule:', err);
    return getMemoryFallbackSchedule(cleanId);
  }
}

export async function dbUpsertBandSchedule(schedule: {
  band_id: string;
  timezone: string;
  horas_lector: number[];
  horas_enviador: number[];
  dias_enviador?: number[];
  dias_lector?: number[];
}) {
  const cleanId = schedule.band_id ? schedule.band_id.trim() : 'bakandeya';
  
  // Ensure integer arrays
  const horasLectorClean = (schedule.horas_lector || []).map((h) => Math.floor(Number(h))).filter((h) => !isNaN(h) && h >= 0 && h <= 23);
  const horasEnviadorClean = (schedule.horas_enviador || []).map((h) => Math.floor(Number(h))).filter((h) => !isNaN(h) && h >= 0 && h <= 23);
  const diasEnviadorClean = (schedule.dias_enviador || [2, 3, 4]).map((d) => Math.floor(Number(d))).filter((d) => !isNaN(d) && d >= 1 && d <= 7);
  const diasLectorClean = (schedule.dias_lector || [1, 2, 3, 4, 5, 6, 7]).map((d) => Math.floor(Number(d))).filter((d) => !isNaN(d) && d >= 1 && d <= 7);

  const payload = {
    band_id: cleanId,
    timezone: schedule.timezone || 'Europe/Madrid',
    horas_lector: horasLectorClean,
    horas_enviador: horasEnviadorClean,
    dias_enviador: diasEnviadorClean,
    dias_lector: diasLectorClean
  };

  inMemorySchedules[cleanId] = payload;

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('band_schedules')
      .upsert(payload, { onConflict: 'band_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Warning upserting band schedule to Supabase (saved in memory fallback):', error.message || error);
      return payload;
    }

    return data || payload;
  } catch (err) {
    console.warn('Fallback upserting band schedule:', err);
    return payload;
  }
}
