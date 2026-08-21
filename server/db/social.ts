import { getSupabase, cleanBandId } from "./core.js";

export async function dbGetSocialPosts(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("social_posts")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: false });

  if (error) throw new Error(`Supabase Error (social_posts): ${error.message}`);
  return data || [];
}

export async function dbUpsertSocialPost(post: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(post.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: post.id || `post-${Date.now()}`,
    band_id: targetBandId,
    fecha: post.fecha || new Date().toISOString().split("T")[0],
    plataforma: post.plataforma || "instagram",
    contenido: post.contenido || "",
    estado: post.estado || "borrador",
    responsable: post.responsable || ""
  };

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
  return (data || []).map((m: any) => {
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
  const targetBandId = cleanBandId(metric.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: metric.id || `met-${Date.now()}`,
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
  const targetBandId = cleanBandId(item.band_id || bandId);
  const payload = {
    id: item.id || `content-${targetBandId}-${item.platform}-${item.external_id || Date.now()}`,
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
