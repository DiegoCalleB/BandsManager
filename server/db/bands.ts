import { getSupabase, cleanBandId, normalizePlan } from "./core.js";

export async function dbMigrateAllPlansToNewTiers() {
  try {
    const sb = getSupabase();
    // 1. Migrate registered_bands
    const { data: bands } = await sb.from("registered_bands").select("id, band_id, plan");
    if (bands && bands.length > 0) {
      for (const b of bands) {
        const norm = normalizePlan(b.plan);
        if (b.plan !== norm) {
          await sb.from("registered_bands").update({ plan: norm }).eq("id", b.id);
        }
      }
    }
    // 2. Migrate users
    const { data: users } = await sb.from("users").select("id, plan");
    if (users && users.length > 0) {
      for (const u of users) {
        const norm = normalizePlan(u.plan);
        if (u.plan !== norm) {
          await sb.from("users").update({ plan: norm }).eq("id", u.id);
        }
      }
    }
  } catch (err) {
    console.warn("Notice during dbMigrateAllPlansToNewTiers:", err);
  }
}

// --- REGISTERED BANDS ---
export async function ensureRegisteredBandExists(bandId: string, nombreBanda?: string) {
  const cleanId = cleanBandId(bandId);
  const sb = getSupabase();
  try {
    const { data } = await sb.from("registered_bands").select("*").eq("band_id", cleanId).maybeSingle();
    const resolvedName = (nombreBanda && nombreBanda.trim() && nombreBanda.trim() !== "Banda") 
      ? nombreBanda.trim() 
      : (cleanId === "band-bakandeya" ? "Bakandeya" : (data?.nombre_banda && data.nombre_banda !== "Banda" ? data.nombre_banda : cleanId.replace(/^band-/, "").split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")));

    if (!data) {
      const payload = {
        id: `reg-${cleanId}`,
        band_id: cleanId,
        nombre_banda: resolvedName,
        email: "contacto@banda.com",
        plan: "ensayo",
        contacto_nombre: "Contacto",
        estado_cuenta: "activo"
      };
      await sb.from("registered_bands").upsert(payload);
    } else if (nombreBanda && nombreBanda.trim() && nombreBanda.trim() !== "Banda" && (data.nombre_banda === "Banda" || !data.nombre_banda)) {
      await sb.from("registered_bands").update({ nombre_banda: nombreBanda.trim() }).eq("band_id", cleanId);
    }
  } catch (err) {
    console.error("Error in ensureRegisteredBandExists:", err);
  }
}

export async function dbGetRegisteredBands() {
  const sb = getSupabase();
  const { data, error } = await sb.from("registered_bands").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Supabase Error (registered_bands): ${error.message}`);
  return (data || []).map((b: any) => ({ ...b, plan: normalizePlan(b.plan) }));
}

export async function dbGetRegisteredBandById(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb.from("registered_bands").select("*").eq("band_id", cleanBandId(bandId)).maybeSingle();
  if (error) throw new Error(`Supabase Error (registered_bands): ${error.message}`);
  if (!data) return null;
  return { ...data, plan: normalizePlan(data.plan) };
}

export async function dbUpsertRegisteredBand(band: any) {
  const sb = getSupabase();
  const payload = {
    id: band.id || `reg-${band.band_id || Date.now()}`,
    band_id: band.band_id || band.bandId,
    user_id: band.user_id || band.userId || null,
    nombre_banda: band.nombre_banda || band.nombreBanda || band.bandName || "Banda",
    email: band.email || "",
    plan: normalizePlan(band.plan),
    contacto_nombre: band.contacto_nombre || band.contactoNombre || "",
    estilo_musical: band.estilo_musical || band.estiloMusical || "",
    localizacion: band.localizacion || "",
    telefono: band.telefono || "",
    instagram: band.instagram || "",
    spotify_youtube: band.spotify_youtube || band.spotifyYoutube || "",
    aforo_promedio: Number(band.aforo_promedio || band.aforoPromedio || 0),
    estado_cuenta: band.estado_cuenta || "activo",
    notas: band.notas || ""
  };

  const { data, error } = await sb.from("registered_bands").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert registered_bands): ${error.message}`);
  return data;
}

export async function dbDeleteRegisteredBand(bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("registered_bands").delete().eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete registered_bands): ${error.message}`);
  return true;
}

/**
 * Guarda el ADN de expresión/tono (`/api/bands/analyze-tone`) de la banda EMISORA (la propia,
 * no un contacto de booking) en `registered_bands`, para que sobreviva a un redeploy y lo lea
 * `loadBandProfile` en cada generación de copy. Antes solo se escribía en `data.json`, un
 * fichero local que Railway borra en cada despliegue.
 *
 * Best-effort: si Supabase falla, el análisis que ya se le devolvió al usuario en esa misma
 * respuesta sigue siendo válido, solo que no se recordará la próxima vez.
 */
export async function dbUpdateBandToneDna(bandId: string, dna: any): Promise<boolean> {
  const targetBandId = cleanBandId(bandId);
  if (!targetBandId || !dna) return false;
  try {
    await ensureRegisteredBandExists(targetBandId);
    const sb = getSupabase();
    const { error } = await sb
      .from("registered_bands")
      .update({ dna_expresion: dna, updated_at: new Date().toISOString() })
      .eq("band_id", targetBandId);

    if (error) {
      console.warn(`Supabase warning (update dna_expresion en registered_bands): ${error.message}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[registered_bands] No se pudo guardar el ADN de tono:", err?.message || err);
    return false;
  }
}

/**
 * Acumula frases reales de directo (lo que la banda dice ENTRE canciones al público: saludos,
 * bromas, agradecimientos) extraídas por la IA de transcripciones de vídeos ya analizados en el
 * generador de Reels. Es la fuente de tono más auténtica que hay -ipsissima verba, sin filtro de
 * community manager- así que se guarda dentro del mismo `dna_expresion` para que `loadBandProfile`
 * y `/api/bands/analyze-tone` la usen igual que el resto del ADN.
 *
 * Se acumula (no se sobrescribe) porque cada vídeo nuevo analizado aporta más frases sueltas;
 * se corta a las últimas 25 para no dejar crecer el JSONB sin límite.
 */
export async function dbAppendBandSpeechPhrases(bandId: string, nuevasFrases: string[]): Promise<boolean> {
  const targetBandId = cleanBandId(bandId);
  const limpias = (nuevasFrases || []).map((f) => String(f || "").trim()).filter(Boolean);
  if (!targetBandId || !limpias.length) return true;

  try {
    const sb = getSupabase();
    const actual = await dbGetRegisteredBandById(targetBandId);
    const dnaActual = actual?.dna_expresion && typeof actual.dna_expresion === "object" ? actual.dna_expresion : {};
    const existentes: string[] = Array.isArray(dnaActual.frases_directo_extraidas) ? dnaActual.frases_directo_extraidas : [];

    const combinadas = [...existentes];
    for (const frase of limpias) {
      if (!combinadas.some((f) => f.toLowerCase() === frase.toLowerCase())) combinadas.push(frase);
    }
    const acotadas = combinadas.slice(-25);

    await ensureRegisteredBandExists(targetBandId);
    const { error } = await sb
      .from("registered_bands")
      .update({ dna_expresion: { ...dnaActual, frases_directo_extraidas: acotadas }, updated_at: new Date().toISOString() })
      .eq("band_id", targetBandId);

    if (error) {
      console.warn(`Supabase warning (append frases_directo_extraidas): ${error.message}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[registered_bands] No se pudieron guardar las frases de directo:", err?.message || err);
    return false;
  }
}

/**
 * Registra una entrada de feedback (valoración + comentario) sobre un título/descripción de
 * Reel regenerado, para que `formatGlobalReelFeedbackForPrompt` la use como memoria en próximas
 * generaciones. Mismo patrón que `historial_feedback_pitch` para los pitches de booking, pero
 * guardado dentro de `dna_expresion` (no hay una tabla de "reels" por banda como sí hay leads).
 *
 * Se acumula (últimas 30) porque cada corrección del usuario aporta una señal más de aprendizaje.
 */
export async function dbLogReelFeedback(bandId: string, entry: Record<string, any>): Promise<boolean> {
  const targetBandId = cleanBandId(bandId);
  if (!targetBandId || !entry) return false;

  try {
    const sb = getSupabase();
    const actual = await dbGetRegisteredBandById(targetBandId);
    const dnaActual = actual?.dna_expresion && typeof actual.dna_expresion === "object" ? actual.dna_expresion : {};
    const existentes: any[] = Array.isArray(dnaActual.historial_feedback_reels) ? dnaActual.historial_feedback_reels : [];

    const actualizados = [entry, ...existentes].slice(0, 30);

    await ensureRegisteredBandExists(targetBandId);
    const { error } = await sb
      .from("registered_bands")
      .update({ dna_expresion: { ...dnaActual, historial_feedback_reels: actualizados }, updated_at: new Date().toISOString() })
      .eq("band_id", targetBandId);

    if (error) {
      console.warn(`Supabase warning (log historial_feedback_reels): ${error.message}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[registered_bands] No se pudo guardar el feedback del Reel:", err?.message || err);
    return false;
  }
}

// --- USERS ---
