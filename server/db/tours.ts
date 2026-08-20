import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export async function dbGetTours(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("tours")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha_inicio", { ascending: true });

  if (error) throw new Error(`Supabase Error (tours): ${error.message}`);
  return (data || []).map(t => {
    let vehiculos: any[] = [];
    if (Array.isArray(t.vehiculos) && t.vehiculos.length > 0) {
      vehiculos = t.vehiculos;
    } else if (t.vehiculo) {
      try {
        if (typeof t.vehiculo === "string" && (t.vehiculo.startsWith("[") || t.vehiculo.startsWith("{"))) {
          const parsed = JSON.parse(t.vehiculo);
          if (Array.isArray(parsed)) vehiculos = parsed;
        }
      } catch (_) {}

      if (vehiculos.length === 0) {
        vehiculos = [{
          id: 'veh-1',
          nombre: t.vehiculo,
          consumoL100km: Number(t.consumo_l100km || 9.5),
          precioCarburanteEUR: Number(t.precio_carburante_eur || 1.55),
          tipoCombustible: t.tipo_combustible || 'diesel'
        }];
      }
    }

    return {
      ...t,
      fechaInicio: t.fecha_inicio || t.fechaInicio || "",
      fechaFin: t.fecha_fin || t.fechaFin || "",
      consumoL100km: t.consumo_l100km ?? t.consumoL100km,
      precioCarburanteEUR: t.precio_carburante_eur ?? t.precioCarburanteEUR,
      tipoCombustible: t.tipo_combustible || t.tipoCombustible || "diesel",
      presupuestoLogistica: t.presupuesto_logistica ?? t.presupuestoLogistica ?? 0,
      convocatoria_tipo: t.convocatoria_tipo || t.convocatoriaTipo || "completa",
      convocados_ids: t.convocados_ids || t.convocadosIds || [],
      convocados_nombres: t.convocados_nombres || t.convocadosNombres || [],
      sincronizarCalendario: t.sincronizar_calendario ?? t.sincronizarCalendario ?? true,
      sincronizarFinanzas: t.sincronizar_finanzas ?? t.sincronizarFinanzas ?? false,
      vehiculos,
      stops: t.stops || []
    };
  });
}

export async function dbUpsertTour(tour: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(tour.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const vehiculos = Array.isArray(tour.vehiculos) && tour.vehiculos.length > 0
    ? tour.vehiculos
    : tour.vehiculo
      ? [{
          id: 'veh-1',
          nombre: tour.vehiculo,
          consumoL100km: Number(tour.consumoL100km || tour.consumo_l100km || 9.5),
          precioCarburanteEUR: Number(tour.precioCarburanteEUR || tour.precio_carburante_eur || 1.55),
          tipoCombustible: tour.tipoCombustible || tour.tipo_combustible || "diesel"
        }]
      : [];

  const mainVehiculo = vehiculos.length > 0
    ? vehiculos.map((v: any) => v.nombre).filter(Boolean).join(", ")
    : (tour.vehiculo || "");

  const payload: any = {
    id: tour.id || `tour-${Date.now()}`,
    band_id: targetBandId,
    nombre: tour.nombre || "Gira",
    fecha_inicio: tour.fecha_inicio || tour.fechaInicio || "",
    fecha_fin: tour.fecha_fin || tour.fechaFin || "",
    vehiculo: mainVehiculo,
    consumo_l100km: Number(tour.consumo_l100km || tour.consumoL100km || (vehiculos[0]?.consumoL100km ?? 0)),
    precio_carburante_eur: Number(tour.precio_carburante_eur || tour.precioCarburanteEUR || (vehiculos[0]?.precioCarburanteEUR ?? 0)),
    tipo_combustible: tour.tipo_combustible || tour.tipoCombustible || (vehiculos[0]?.tipoCombustible ?? "diesel"),
    presupuesto_logistica: Number(tour.presupuesto_logistica || tour.presupuestoLogistica || 0),
    convocatoria_tipo: tour.convocatoria_tipo || tour.convocatoriaTipo || "completa",
    convocados_ids: tour.convocados_ids || tour.convocadosIds || [],
    convocados_nombres: tour.convocados_nombres || tour.convocadosNombres || [],
    sincronizar_calendario: tour.sincronizarCalendario ?? tour.sincronizar_calendario ?? true,
    sincronizar_finanzas: tour.sincronizarFinanzas ?? tour.sincronizar_finanzas ?? false,
    vehiculos: vehiculos,
    stops: tour.stops || [],
    estado: tour.estado || "planificacion"
  };

  let { data, error } = await sb.from("tours").upsert(payload).select().single();

  // Retry gracefully if any newly introduced optional columns are not yet in remote Supabase schema cache
  if (error && error.message) {
    const fallbackPayload = { ...payload };
    let shouldRetry = false;
    if (error.message.toLowerCase().includes("vehiculos")) {
      delete fallbackPayload.vehiculos;
      shouldRetry = true;
    }
    if (error.message.toLowerCase().includes("convocatoria_tipo") || error.message.toLowerCase().includes("convocados_") || error.message.toLowerCase().includes("sincronizar_")) {
      delete fallbackPayload.convocatoria_tipo;
      delete fallbackPayload.convocados_ids;
      delete fallbackPayload.convocados_nombres;
      delete fallbackPayload.sincronizar_calendario;
      delete fallbackPayload.sincronizar_finanzas;
      shouldRetry = true;
    }
    if (shouldRetry) {
      console.warn("Reintentando upsert de tour sin campos no presentes en el esquema remoto...");
      const retry = await sb.from("tours").upsert(fallbackPayload).select().single();
      if (retry.error) throw new Error(`Supabase Error (upsert tour fallback): ${retry.error.message}`);
      data = retry.data;
      error = null;
    } else {
      throw new Error(`Supabase Error (upsert tour): ${error.message}`);
    }
  }

  return {
    ...data,
    convocatoria_tipo: payload.convocatoria_tipo,
    convocados_ids: payload.convocados_ids,
    convocados_nombres: payload.convocados_nombres,
    sincronizarCalendario: payload.sincronizar_calendario,
    sincronizarFinanzas: payload.sincronizar_finanzas,
    vehiculos: (data && data.vehiculos) || vehiculos
  };
}

export async function dbDeleteTour(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("tours").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete tour): ${error.message}`);
  return true;
}

// --- RUN OF SHOW ---
