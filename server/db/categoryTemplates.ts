import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";
import { DEFAULT_CATEGORY_TEMPLATES, type CategoryTemplateConfig } from "../promptsManager.js";

/**
 * Persistencia por banda de las plantillas de email + pautas de IA por categoría de lead
 * (server/routes/leads/templates.ts). Antes vivían en `state.categoryTemplates`, un único
 * objeto global sin `band_id` compartido por TODAS las bandas de la plataforma y respaldado
 * solo en data.json (que Railway borra en cada despliegue) — ni aislaban por banda ni
 * sobrevivían a un redeploy.
 */

function normalizeFromDb(row: any): CategoryTemplateConfig {
  const category = String(row.category || "salas");
  const fallback = DEFAULT_CATEGORY_TEMPLATES[category];
  return {
    category,
    title: row.title || fallback?.title || category,
    subject: row.subject || fallback?.subject || "",
    body: row.body || fallback?.body || "",
    guidelines: row.guidelines || fallback?.guidelines || "",
    toneRating: Number(row.tone_rating ?? row.toneRating ?? 5),
    contentRating: Number(row.content_rating ?? row.contentRating ?? 5),
    customInstruction: row.custom_instruction || row.customInstruction || "",
    feedbackLogs: Array.isArray(row.feedback_logs) ? row.feedback_logs : (Array.isArray(row.feedbackLogs) ? row.feedbackLogs : []),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
  };
}

/** Todas las categorías para una banda, partiendo de los valores por defecto y sobrescribiendo con lo guardado. */
export async function dbGetCategoryTemplates(bandId: string): Promise<Record<string, CategoryTemplateConfig>> {
  const result: Record<string, CategoryTemplateConfig> = JSON.parse(JSON.stringify(DEFAULT_CATEGORY_TEMPLATES));
  const cleanId = cleanBandId(bandId);
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("category_pitch_templates")
      .select("*")
      .eq("band_id", cleanId);

    if (error) {
      console.warn("Supabase category_pitch_templates query warning:", error.message);
      return result;
    }
    for (const row of data || []) {
      if (row.category) result[row.category] = normalizeFromDb(row);
    }
    return result;
  } catch (err: any) {
    console.warn("Could not query category templates from Supabase:", err?.message || err);
    return result;
  }
}

export async function dbUpsertCategoryTemplate(
  bandId: string,
  category: string,
  template: Partial<CategoryTemplateConfig>
): Promise<CategoryTemplateConfig> {
  const cleanId = cleanBandId(bandId);
  const fallback = DEFAULT_CATEGORY_TEMPLATES[category];

  const payload = {
    id: `${cleanId}__${category}`,
    band_id: cleanId,
    category,
    title: template.title ?? fallback?.title ?? category,
    subject: template.subject ?? "",
    body: template.body ?? "",
    guidelines: template.guidelines ?? "",
    custom_instruction: template.customInstruction ?? "",
    tone_rating: template.toneRating ?? 5,
    content_rating: template.contentRating ?? 5,
    feedback_logs: template.feedbackLogs ?? [],
    updated_at: new Date().toISOString()
  };

  try {
    const sb = getSupabase();
    await ensureRegisteredBandExists(cleanId);

    const { data, error } = await sb
      .from("category_pitch_templates")
      .upsert(payload, { onConflict: "band_id,category" })
      .select()
      .single();

    if (error) {
      console.warn("Supabase upsert category template warning:", error.message);
      return normalizeFromDb(payload);
    }
    return normalizeFromDb(data || payload);
  } catch (err: any) {
    console.warn("Failed to persist category template to Supabase:", err?.message || err);
    return normalizeFromDb(payload);
  }
}
