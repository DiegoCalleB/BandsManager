import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export async function dbGetSocialPosts(bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data, error } = await sb
    .from("social_posts")
    .select("*")
    .eq("band_id", cleanId)
    .order("fecha", { ascending: false });

  if (error) throw new Error(`Supabase Error (social_posts): ${error.message}`);
  return (data || []).filter(p => cleanBandId(p.band_id) === cleanId);
}

export async function dbUpsertSocialPost(post: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza (lo resuelve la ruta desde la sesión); el
  // objeto de entrada puede traer su propio 'band_id' sin validar desde el cuerpo de la
  // petición y no debe primar (ver el mismo fallo corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // Ver nota equivalente en dbUpsertFan/dbUpsertConcert: un id que no pertenece a la banda del
  // usuario no se reutiliza nunca.
  let finalPostId = post.id;
  if (finalPostId) {
    const { data: existing } = await sb.from("social_posts").select("id, band_id").eq("id", finalPostId).maybeSingle();
    if (existing && existing.band_id !== targetBandId) {
      finalPostId = `post-${Date.now()}`;
    }
  }

  const payload: any = {
    id: finalPostId || `post-${Date.now()}`,
    band_id: targetBandId,
    fecha: post.fecha || new Date().toISOString().split("T")[0],
    plataforma: post.plataforma || "Instagram",
    contenido: post.contenido || "",
    estado: post.estado || "borrador",
    responsable: post.responsable || ""
  };

  if (post.hora_programada !== undefined) payload.hora_programada = post.hora_programada;
  if (post.video_url !== undefined) payload.video_url = post.video_url;
  if (post.thumbnail_url !== undefined) payload.thumbnail_url = post.thumbnail_url;
  if (post.media_type !== undefined) payload.media_type = post.media_type;
  if (post.auto_publish !== undefined) payload.auto_publish = Boolean(post.auto_publish);
  if (post.published_id !== undefined) payload.published_id = post.published_id;
  if (post.published_at !== undefined) payload.published_at = post.published_at;
  if (post.publish_error !== undefined) payload.publish_error = post.publish_error;
  if (post.account_handle !== undefined) payload.account_handle = post.account_handle;
  if (post.hashtags !== undefined) payload.hashtags = post.hashtags;
  if (post.metrics !== undefined) payload.metrics = post.metrics;

  const { data, error } = await sb.from("social_posts").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert social_posts): ${error.message}`);
  return data;
}

export async function dbDeleteSocialPost(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("social_posts").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete social_posts): ${error.message}`);
  return true;
}

// --- BAND SOCIAL ACCOUNTS (OAuth / Conexión de redes oficiales) ---
export async function dbGetBandSocialAccounts(bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  try {
    const { data, error } = await sb
      .from("band_social_accounts")
      .select("*")
      .eq("band_id", cleanId)
      .order("connected_at", { ascending: false });

    if (error) {
      console.warn(`[Social DB] band_social_accounts table check: ${error.message}`);
      return [];
    }
    return (data || []).filter((a: any) => cleanBandId(a.band_id) === cleanId);
  } catch (err: any) {
    console.warn(`[Social DB] Error getting social accounts: ${err.message}`);
    return [];
  }
}

export async function dbUpsertBandSocialAccount(account: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: account.id || `soc-acc-${targetBandId}-${account.plataforma?.toLowerCase()}-${Date.now()}`,
    band_id: targetBandId,
    plataforma: account.plataforma || "Instagram",
    handle: account.handle || "",
    account_name: account.account_name || account.handle || "",
    avatar_url: account.avatar_url || "",
    status: account.status || "conectado",
    auto_publish_enabled: account.auto_publish_enabled !== false,
    connected_at: account.connected_at || new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
    followers_count: Number(account.followers_count || 0),
    total_views: Number(account.total_views || 0),
    account_id: account.account_id || `acc-${Date.now()}`
  };

  try {
    const { data, error } = await sb.from("band_social_accounts").upsert(payload).select().single();
    if (error) {
      console.warn(`[Social DB] Warning upserting to band_social_accounts: ${error.message}`);
      return payload;
    }
    return data;
  } catch (err: any) {
    console.warn(`[Social DB] Fallback returning payload for band_social_accounts: ${err.message}`);
    return payload;
  }
}

export async function dbDeleteBandSocialAccount(id: string, bandId: string) {
  const sb = getSupabase();
  try {
    const { error } = await sb.from("band_social_accounts").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
    if (error) console.warn(`[Social DB] Delete band_social_accounts warning: ${error.message}`);
    return true;
  } catch {
    return true;
  }
}

// --- PAYMENTS ---
export async function dbGetSocialMetrics(bandId: string) {
  const sb = getSupabase();
  const target = cleanBandId(bandId);
  const alternate = target.startsWith('band-') ? target.replace(/^band-/, '') : `band-${target}`;
  const bandIds = Array.from(new Set([target, alternate, target.toLowerCase(), alternate.toLowerCase()]));

  const { data, error } = await sb
    .from("social_metrics")
    .select("*")
    .in("band_id", bandIds)
    .order("fecha", { ascending: false });

  if (error) throw new Error(`Supabase Error (social_metrics): ${error.message}`);
  const validBandIds = new Set(bandIds.map(id => cleanBandId(id)));
  return (data || []).filter((m: any) => validBandIds.has(cleanBandId(m.band_id))).map((m: any) => {
    const ig = Number(m.instagram ?? m.instagram_followers ?? 0);
    const tk = Number(m.tiktok ?? m.tiktok_followers ?? 0);
    const yt = Number(m.youtube ?? m.youtube_subscribers ?? 0);
    const sp = Number(m.spotify ?? m.spotify_monthly_listeners ?? 0);
    return {
      ...m,
      instagram: ig,
      tiktok: tk,
      youtube: yt,
      spotify: sp,
      spotify_monthly_listeners: Number(m.spotify_monthly_listeners || sp),
      spotify_followers: Number(m.spotify_followers || 0),
      spotify_popularity: Number(m.spotify_popularity || 0),
      youtube_subscribers: Number(m.youtube_subscribers || yt),
      youtube_total_views: Number(m.youtube_total_views || 0),
      youtube_video_count: Number(m.youtube_video_count || 0),
      instagram_followers: Number(m.instagram_followers || ig),
      instagram_following: Number(m.instagram_following || 0),
      instagram_posts_count: Number(m.instagram_posts_count || 0),
      instagram_engagement_rate: Number(m.instagram_engagement_rate || 0),
      tiktok_followers: Number(m.tiktok_followers || tk),
      tiktok_total_likes: Number(m.tiktok_total_likes || 0),
      tiktok_video_count: Number(m.tiktok_video_count || 0)
    };
  });
}

export async function dbUpsertSocialMetric(metric: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza (lo resuelve la ruta desde la sesión); el
  // objeto de entrada puede traer su propio 'band_id' sin validar desde el cuerpo de la
  // petición y no debe primar (ver el mismo fallo corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // Ver nota equivalente en dbUpsertFan/dbUpsertConcert: un id que no pertenece a la banda del
  // usuario no se reutiliza nunca.
  let finalMetricId = metric.id;
  if (finalMetricId) {
    const { data: existing } = await sb.from("social_metrics").select("id, band_id").eq("id", finalMetricId).maybeSingle();
    if (existing && existing.band_id !== targetBandId) {
      finalMetricId = `met-${Date.now()}`;
    }
  }

  const payload = {
    id: finalMetricId || `met-${Date.now()}`,
    band_id: targetBandId,
    fecha: metric.fecha || new Date().toISOString().split("T")[0],
    instagram: Number(metric.instagram ?? metric.instagram_followers ?? 0),
    tiktok: Number(metric.tiktok ?? metric.tiktok_followers ?? 0),
    youtube: Number(metric.youtube ?? metric.youtube_subscribers ?? 0),
    spotify: Number(metric.spotify ?? metric.spotify_monthly_listeners ?? 0),
    
    // Métricas avanzadas
    spotify_monthly_listeners: Number(metric.spotify_monthly_listeners ?? metric.spotify ?? 0),
    spotify_followers: Number(metric.spotify_followers ?? 0),
    spotify_popularity: Number(metric.spotify_popularity ?? 0),
    
    youtube_subscribers: Number(metric.youtube_subscribers ?? metric.youtube ?? 0),
    youtube_total_views: Number(metric.youtube_total_views ?? 0),
    youtube_video_count: Number(metric.youtube_video_count ?? 0),
    
    instagram_followers: Number(metric.instagram_followers ?? metric.instagram ?? 0),
    instagram_following: Number(metric.instagram_following ?? 0),
    instagram_posts_count: Number(metric.instagram_posts_count ?? 0),
    instagram_engagement_rate: Number(metric.instagram_engagement_rate ?? 0),
    
    tiktok_followers: Number(metric.tiktok_followers ?? metric.tiktok ?? 0),
    tiktok_total_likes: Number(metric.tiktok_total_likes ?? 0),
    tiktok_video_count: Number(metric.tiktok_video_count ?? 0),
    
    notas: metric.notas || "",
    updated_at: new Date().toISOString()
  };

  const { data, error } = await sb.from("social_metrics").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert social_metrics): ${error.message}`);
  return data;
}

export async function dbDeleteSocialMetric(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("social_metrics").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete social_metrics): ${error.message}`);
  return true;
}

// --- SOCIAL CONTENT ITEMS (Videos, Reels, Tracks) ---
export async function dbGetSocialContentItems(bandId: string, platform?: string) {
  const sb = getSupabase();
  let query = sb.from("social_content_items").select("*").eq("band_id", cleanBandId(bandId));
  if (platform) {
    query = query.eq("platform", platform);
  }
  const { data, error } = await query.order("views", { ascending: false });
  if (error) {
    console.warn(`Supabase warning (social_content_items): ${error.message}`);
    return [];
  }
  return data || [];
}

export async function dbUpsertSocialContentItem(item: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza (lo resuelve la ruta desde la sesión); el
  // objeto de entrada puede traer su propio 'band_id' sin validar desde el cuerpo de la
  // petición y no debe primar (ver el mismo fallo corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);

  // Ver nota equivalente en dbUpsertFan/dbUpsertConcert: un id explícito que no pertenece a la
  // banda del usuario no se reutiliza nunca.
  let finalContentId = item.id;
  if (finalContentId) {
    const { data: existing } = await sb.from("social_content_items").select("id, band_id").eq("id", finalContentId).maybeSingle();
    if (existing && existing.band_id !== targetBandId) {
      finalContentId = null;
    }
  }

  const payload = {
    id: finalContentId || `content-${targetBandId}-${item.platform}-${item.external_id || Date.now()}`,
    band_id: targetBandId,
    platform: item.platform || "youtube",
    external_id: String(item.external_id || item.externalId || ""),
    title: item.title || "Sin título",
    url: item.url || "",
    thumbnail_url: item.thumbnail_url || item.thumbnailUrl || "",
    published_at: item.published_at || item.publishedAt || null,
    views: Number(item.views || 0),
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    shares: Number(item.shares || 0),
    last_scraped_at: new Date().toISOString()
  };

  const { data, error } = await sb.from("social_content_items").upsert(payload).select().single();
  if (error) {
    console.warn(`Supabase warning (upsert social_content_items): ${error.message}`);
    return payload;
  }
  return data;
}

export async function dbUpdateBandRadarStatus(bandId: string, lastScrapedAt: string, radarEnabled?: boolean) {
  const sb = getSupabase();
  const updateData: any = { last_social_radar_at: lastScrapedAt };
  if (typeof radarEnabled === "boolean") {
    updateData.radar_enabled = radarEnabled;
  }
  const { error } = await sb.from("registered_bands").update(updateData).eq("band_id", cleanBandId(bandId));
  if (error) {
    console.warn(`Supabase warning (update band radar status): ${error.message}`);
  }
}

// --- TOURS ---
