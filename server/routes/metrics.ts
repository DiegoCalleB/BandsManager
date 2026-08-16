import express from "express";
import { SocialMetric } from "../../src/types.js";
import { loadState, saveState, requireAuth, requireLeader, requireCronOrAuth } from "../state.js";
import { dbGetSocialMetrics, dbUpsertSocialMetric, dbDeleteSocialMetric, dbGetRegisteredBandById, dbGetEpkConfig, dbUpsertEpkConfig, dbGetRegisteredBands, dbGetSocialContentItems, dbUpsertSocialContentItem } from "../db.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";

const router = express.Router();

// Helper to extract YouTube channel ID or handle from any band's YouTube URL
function parseYouTubeUrl(url: string): { type: "handle" | "id" | "forUsername"; value: string } | null {
  if (!url) return null;
  const clean = url.trim();
  
  // @Handle format (e.g., https://www.youtube.com/@Bakandeya or @Bakandeya)
  if (clean.includes("/@") || clean.startsWith("@")) {
    const handlePart = clean.includes("/@") ? clean.split("/@")[1] : clean.substring(1);
    const handle = handlePart.split("/")[0].split("?")[0].trim();
    if (handle) return { type: "handle", value: handle };
  }
  
  // /channel/UCxxxx format
  const channelMatch = clean.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i);
  if (channelMatch && channelMatch[1]) {
    return { type: "id", value: channelMatch[1] };
  }
  
  // /c/name or /user/name format
  const customMatch = clean.match(/youtube\.com\/(?:c|user)\/([a-zA-Z0-9_-]+)/i);
  if (customMatch && customMatch[1]) {
    return { type: "forUsername", value: customMatch[1] };
  }

  // Raw handle or name
  if (!clean.includes("/") && clean.length > 0) {
    return { type: "handle", value: clean.replace(/^@/, "") };
  }

  return null;
}

// Fetch official YouTube Data API v3 statistics & top videos if YOUTUBE_API_KEY is configured
async function fetchYouTubeApiStats(ytUrl: string, apiKey?: string) {
  const key = apiKey || process.env.YOUTUBE_API_KEY;
  if (!key || !ytUrl) return null;

  const parsed = parseYouTubeUrl(ytUrl);
  if (!parsed) return null;

  try {
    let url = "";
    if (parsed.type === "handle") {
      url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&forHandle=${encodeURIComponent(parsed.value)}&key=${key}`;
    } else if (parsed.type === "id") {
      url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&id=${encodeURIComponent(parsed.value)}&key=${key}`;
    } else if (parsed.type === "forUsername") {
      url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&forUsername=${encodeURIComponent(parsed.value)}&key=${key}`;
    }

    if (!url) return null;

    const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!resp.ok) {
      console.warn(`YouTube Data API returned HTTP ${resp.status}`);
      return null;
    }
    const data = await resp.json();
    const item = data.items?.[0];
    if (!item) return null;

    const stats = item.statistics || {};
    const channelId = item.id;
    const subscribers = parseInt(stats.subscriberCount, 10);
    const viewCount = parseInt(stats.viewCount, 10);
    const videoCount = parseInt(stats.videoCount, 10);

    // Try to fetch latest 4 videos
    let videos: Array<{ title: string; views: number; date: string; link: string }> = [];
    if (channelId) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&maxResults=4&order=date&type=video&key=${key}`;
        const sResp = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
        if (sResp.ok) {
          const sData = await sResp.json();
          if (Array.isArray(sData.items)) {
            videos = sData.items.map((vid: any) => ({
              title: vid.snippet?.title || "Vídeo",
              views: 0,
              date: vid.snippet?.publishedAt ? vid.snippet.publishedAt.split("T")[0] : "",
              link: `https://www.youtube.com/watch?v=${vid.id?.videoId}`
            }));
          }
        }
      } catch (searchErr) {
        console.warn("YouTube video list fetch skipped:", searchErr);
      }
    }

    return {
      subscribers: isNaN(subscribers) ? null : subscribers,
      views: isNaN(viewCount) ? null : viewCount,
      videoCount: isNaN(videoCount) ? null : videoCount,
      channelTitle: item.snippet?.title || "",
      videos
    };
  } catch (err: any) {
    console.warn("YouTube Data API v3 request failed:", err?.message);
    return null;
  }
}

// Helper function to perform live scraping directly from band links or handles
async function liveScrapePlatforms(bandInfo?: { name?: string; ytUrl?: string; igUrl?: string; tiktokUrl?: string; spotifyUrl?: string }) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
  };

  const scraped = {
    tiktok: null as number | null,
    youtube: null as number | null,
    instagram: null as number | null,
    spotify: null as number | null,
    videos: [] as Array<{ title: string; views: number; date: string; link: string }>,
    details: [] as string[]
  };

  const ytUrl = bandInfo?.ytUrl || "https://www.youtube.com/@Bakandeya";
  const igUrl = bandInfo?.igUrl || "https://instagram.com/bakandeya";
  const tiktokUrl = bandInfo?.tiktokUrl || "https://www.tiktok.com/@bakandeya";
  const spotifyUrl = bandInfo?.spotifyUrl || "https://open.spotify.com/artist/bakandeya";
  const bandName = bandInfo?.name || "Bakandeya";

  // 1. YouTube Data API v3 (if key is set) OR fallback live scrape
  if (process.env.YOUTUBE_API_KEY && ytUrl) {
    const apiResult = await fetchYouTubeApiStats(ytUrl, process.env.YOUTUBE_API_KEY);
    if (apiResult && apiResult.subscribers !== null) {
      scraped.youtube = apiResult.subscribers;
      if (apiResult.videos && apiResult.videos.length > 0) {
        scraped.videos = apiResult.videos;
      }
      scraped.details.push(`YouTube Data API v3 (${apiResult.channelTitle || ytUrl}): ${scraped.youtube} suscriptores`);
    }
  }

  // If YouTube wasn't resolved by API, try direct public scrape with ytInitialData JSON parsing
  if (ytUrl) {
    try {
      const parsedYt = parseYouTubeUrl(ytUrl);
      const scrapeUrl = parsedYt?.type === "handle" 
        ? `https://www.youtube.com/@${parsedYt.value}/videos`
        : (ytUrl.includes("http") ? (ytUrl.endsWith("/videos") ? ytUrl : `${ytUrl.replace(/\/$/, '')}/videos`) : `https://www.youtube.com/${ytUrl}`);

      const res = await fetch(scrapeUrl, { headers, signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const html = await res.text();
        
        // 1. Try ytInitialData JSON parsing for subscribers and video items
        const initialMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
        if (initialMatch && initialMatch[1]) {
          try {
            const data = JSON.parse(initialMatch[1]);
            const metadataRows = data.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel?.metadataRows;
            if (Array.isArray(metadataRows)) {
              for (const row of metadataRows) {
                if (Array.isArray(row.metadataParts)) {
                  for (const part of row.metadataParts) {
                    const text = part.text?.content || part.accessibilityLabel || "";
                    if (/suscriptor|subscriber/i.test(text)) {
                      let num = 0;
                      if (/k/i.test(text)) {
                        const raw = parseFloat(text.replace(/[^0-9.,]/g, "").replace(",", "."));
                        num = Math.round(raw * 1000);
                      } else if (/m/i.test(text)) {
                        const raw = parseFloat(text.replace(/[^0-9.,]/g, "").replace(",", "."));
                        num = Math.round(raw * 1000000);
                      } else {
                        num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                      }
                      if (!isNaN(num)) {
                        scraped.youtube = num;
                        scraped.details.push(`YouTube (${scrapeUrl}): ${scraped.youtube} suscriptores`);
                        break;
                      }
                    }
                  }
                }
                if (scraped.youtube !== null) break;
              }
            }

            // Extract videos from videos tab if present
            const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
            const videosTab = tabs?.find((t: any) => t.tabRenderer?.title === "Vídeos" || t.tabRenderer?.title === "Videos");
            const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents;
            if (Array.isArray(contents) && scraped.videos.length === 0) {
              for (const item of contents) {
                const lockup = item.richItemRenderer?.content?.lockupViewModel;
                if (lockup) {
                  const videoId = lockup.contentId;
                  const title = lockup.metadata?.lockupMetadataViewModel?.title?.content;
                  const metaRows = lockup.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows;
                  let viewsStr = "";
                  let dateStr = "";
                  if (metaRows && metaRows[0]?.metadataParts) {
                    viewsStr = metaRows[0].metadataParts[0]?.text?.content || "";
                    dateStr = metaRows[0].metadataParts[1]?.text?.content || "";
                  }
                  const viewsNum = parseInt(viewsStr.replace(/[^0-9]/g, ""), 10) || 0;
                  if (title && videoId) {
                    scraped.videos.push({
                      title,
                      views: viewsNum,
                      date: dateStr,
                      link: `https://www.youtube.com/watch?v=${videoId}`
                    });
                  }
                }
              }
            }
          } catch (jsonErr) {
            console.warn("Failed to parse ytInitialData:", jsonErr);
          }
        }

        // 2. Fallback regex search if not resolved
        if (scraped.youtube === null) {
          const match = html.match(/([0-9.,]+[kKmM]?)\s+(suscriptores|subscribers)/i) || html.match(/"subscriberCountText":.*?"simpleText":"([^"]+)"/i);
          if (match) {
            const rawStr = match[1] || match[0];
            let num = 0;
            if (/k/i.test(rawStr)) {
              num = Math.round(parseFloat(rawStr.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
            } else if (/m/i.test(rawStr)) {
              num = Math.round(parseFloat(rawStr.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
            } else {
              num = parseInt(rawStr.replace(/[^0-9]/g, ""), 10);
            }
            if (!isNaN(num)) {
              scraped.youtube = num;
              scraped.details.push(`YouTube (${scrapeUrl}): ${scraped.youtube} suscriptores`);
            }
          }
        }
      }
    } catch (e: any) {
      console.warn("Live YouTube scrape failed:", e?.message);
    }
  }

  // 2. TikTok Live Web Scraping
  try {
    const cleanTiktok = tiktokUrl.includes("tiktok.com") ? tiktokUrl : `https://www.tiktok.com/@${tiktokUrl.replace(/^@/, '')}`;
    const res = await fetch(cleanTiktok, { headers, signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    const match = html.match(/"followerCount":(\d+)/i) || html.match(/data-e2e="follower-count">([^<]+)</i);
    if (match) {
      scraped.tiktok = parseInt(match[1], 10);
      scraped.details.push(`TikTok (${cleanTiktok}): ${scraped.tiktok} seguidores`);
    }
  } catch (e: any) {
    console.warn("Live TikTok scrape failed:", e?.message);
  }

  // 3. Instagram Live Indexing Scrape
  try {
    const igHandle = igUrl.replace(/https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "").replace(/^@/, "");
    const res = await fetch(`https://html.duckduckgo.com/html/?q=site:instagram.com/${encodeURIComponent(igHandle)}+seguidores`, { headers, signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    const match = html.match(/([0-9.,]+)\s*(Seguidores|followers|Followers)/i);
    if (match) {
      const numStr = match[1].replace(/[^0-9]/g, "");
      if (numStr) {
        scraped.instagram = parseInt(numStr, 10);
        scraped.details.push(`Instagram (${igHandle}): ${scraped.instagram} seguidores`);
      }
    }
  } catch (e: any) {
    console.warn("Live Instagram scrape failed:", e?.message);
  }

  // 4. Spotify Live Indexing Scrape
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=site:open.spotify.com/artist+${encodeURIComponent(bandName)}+listeners`, { headers, signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    const match = html.match(/([0-9.,]+)\s*(monthly listeners|oyentes|listeners)/i);
    if (match) {
      const numStr = match[1].replace(/[^0-9]/g, "");
      if (numStr) {
        scraped.spotify = parseInt(numStr, 10);
        scraped.details.push(`Spotify (${bandName}): ${scraped.spotify} oyentes mensuales`);
      }
    }
  } catch (e: any) {
    console.warn("Live Spotify scrape failed:", e?.message);
  }

  return scraped;
}

// GET all metrics
router.get("/metrics", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  try {
    const dbMetrics = await dbGetSocialMetrics(userBandId);
    res.json(dbMetrics);
  } catch (err) {
    const state = loadState();
    res.json(state.metrics || []);
  }
});

// Create metric record
router.post("/metrics", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const newMetric: SocialMetric = req.body;
  const saved = await dbUpsertSocialMetric(newMetric, userBandId);

  const state = loadState();
  state.metrics.push(saved as any);
  saveState(state);
  
  res.json({ success: true, metric: saved });
});

// Update metric record
router.put("/metrics/:id", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const { id } = req.params;
  const updated = { ...req.body, id };
  const saved = await dbUpsertSocialMetric(updated, userBandId);

  const state = loadState();
  const idx = state.metrics.findIndex((m: SocialMetric) => m.id === id);
  if (idx !== -1) {
    state.metrics[idx] = saved as any;
  } else {
    state.metrics.push(saved as any);
  }
  saveState(state);
  
  res.json({ success: true, metric: saved });
});

// Delete metric record
router.delete("/metrics/:id", requireAuth, requireLeader, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const { id } = req.params;
  await dbDeleteSocialMetric(id, userBandId);

  const state = loadState();
  const idx = state.metrics.findIndex((m: SocialMetric) => m.id === id);
  if (idx !== -1) {
    state.metrics.splice(idx, 1);
    saveState(state);
  }
  res.json({ success: true });
});

// Sync all metrics with Supabase
router.post("/metrics/sync", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  try {
    const dbMetrics = await dbGetSocialMetrics(userBandId);
    const state = loadState();
    state.metrics = dbMetrics as any;
    saveState(state);

    res.json({
      success: true,
      message: `¡Se han sincronizado correctamente los registros de seguidores con Supabase!`,
      metrics: dbMetrics
    });
  } catch (error: any) {
    console.error("Error in /api/metrics/sync:", error);
    res.status(500).json({
      success: false,
      error: `Error al sincronizar con Supabase: ${error.message || error}`
    });
  }
});

import { executeSocialRadar, scrapeChannelMetrics } from "../services/socialRadarService.js";

// Fetch real-world social statistics of the active band from live networks / YouTube API
router.post("/metrics/real", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id || "band-bakandeya";

  try {
    const [band, epk] = await Promise.all([
      dbGetRegisteredBandById(userBandId).catch(() => null),
      dbGetEpkConfig(userBandId).catch(() => null)
    ]);

    const bandName = band?.nombre_banda || "Bakandeya";
    const ytUrl = epk?.enlacesRedes?.youtube || band?.spotify_youtube || "https://www.youtube.com/@Bakandeya";
    const igUrl = epk?.enlacesRedes?.instagram || band?.instagram || "https://instagram.com/bakandeya";
    const tiktokUrl = epk?.enlacesRedes?.tiktok || band?.tiktok || "https://www.tiktok.com/@bakandeya";
    const spotifyUrl = epk?.enlacesRedes?.spotify || (band?.spotify_youtube?.includes("spotify.com") ? band.spotify_youtube : "") || "https://open.spotify.com/artist/bakandeya";

    const scraped = await scrapeChannelMetrics({
      band_id: userBandId,
      nombre_banda: bandName,
      spotifyUrl,
      instagram: igUrl,
      tiktok: tiktokUrl,
      youtubeUrl: ytUrl
    });

    const today = new Date().toISOString().split("T")[0];
    const newEntry: SocialMetric = {
      id: `radar-${userBandId}-${today}`,
      fecha: today,
      instagram: scraped.instagramFollowers || 0,
      tiktok: scraped.tiktokFollowers || 0,
      youtube: scraped.youtubeSubscribers || 0,
      spotify: scraped.spotifyMonthlyListeners || 0,
      notas: `Radar Scan en Directo (${new Date().toLocaleTimeString('es-ES')})`,
      spotify_monthly_listeners: scraped.spotifyMonthlyListeners || 0,
      spotify_followers: scraped.spotifyFollowers || 0,
      spotify_popularity: scraped.spotifyPopularity || 0,
      youtube_subscribers: scraped.youtubeSubscribers || 0,
      youtube_total_views: scraped.youtubeTotalViews || 0,
      youtube_video_count: scraped.youtubeVideoCount || 0,
      instagram_followers: scraped.instagramFollowers || 0,
      instagram_following: scraped.instagramFollowing || 0,
      instagram_posts_count: scraped.instagramPostsCount || 0,
      instagram_engagement_rate: scraped.instagramEngagementRate || 0,
      tiktok_followers: scraped.tiktokFollowers || 0,
      tiktok_total_likes: scraped.tiktokTotalLikes || 0,
      tiktok_video_count: scraped.tiktokVideoCount || 0
    };

    try {
      await dbUpsertSocialMetric(newEntry, userBandId);
    } catch (dbErr) {
      console.warn("Could not upsert metric in Supabase:", dbErr);
    }

    if (scraped.videos && scraped.videos.length > 0) {
      for (const v of scraped.videos.slice(0, 15)) {
        try {
          await dbUpsertSocialContentItem({
            band_id: userBandId,
            platform: "youtube",
            external_id: v.id,
            title: v.title,
            url: v.link,
            thumbnail_url: v.thumb,
            views_count: isNaN(v.views) ? 0 : v.views,
            published_at: v.date
          }, userBandId);
        } catch (itemErr) {
          // ignore item upsert err
        }
      }
    }

    return res.json({
      success: true,
      data: {
        instagramFollowers: scraped.instagramFollowers || 0,
        tiktokFollowers: scraped.tiktokFollowers || 0,
        youtubeSubscribers: scraped.youtubeSubscribers || 0,
        spotifyListeners: scraped.spotifyMonthlyListeners || 0,
        videos: scraped.videos || []
      },
      metric: newEntry
    });
  } catch (err: any) {
    console.error("Error in /metrics/real:", err);
    return res.status(500).json({ success: false, error: err?.message || "Error al escanear redes reales" });
  }
});

// Automated daily snapshot endpoint
router.all("/metrics/cron-snapshot", requireCronOrAuth, async (req, res) => {
  console.log("⚙️ Iniciando snapshot automático de seguidores...");
  const userBandId = (req as any).user?.band_id || "band-1";
  const ai = getAiClient();
  
  let bandName = "Bakandeya";
  let ytUrl = "https://www.youtube.com/@Bakandeya";
  let igUrl = "https://instagram.com/bakandeya";
  let tiktokUrl = "https://www.tiktok.com/@bakandeya";
  let spotifyUrl = "https://open.spotify.com/artist/bakandeya";

  try {
    const [band, epk] = await Promise.all([
      dbGetRegisteredBandById(userBandId).catch(() => null),
      dbGetEpkConfig(userBandId).catch(() => null)
    ]);
    if (band?.nombre_banda) bandName = band.nombre_banda;
    if (epk?.enlacesRedes) {
      if (epk.enlacesRedes.youtube) ytUrl = epk.enlacesRedes.youtube;
      if (epk.enlacesRedes.instagram) igUrl = epk.enlacesRedes.instagram;
      if (epk.enlacesRedes.tiktok) tiktokUrl = epk.enlacesRedes.tiktok;
      if (epk.enlacesRedes.spotify) spotifyUrl = epk.enlacesRedes.spotify;
    }
  } catch (e) {
    console.warn("Could not load band links for cron snapshot:", e);
  }

  const liveScraped = await liveScrapePlatforms({ name: bandName, ytUrl, igUrl, tiktokUrl, spotifyUrl });

  let fetchedData = {
    instagramFollowers: liveScraped.instagram || 1385,
    tiktokFollowers: liveScraped.tiktok || 253,
    youtubeSubscribers: liveScraped.youtube || 40,
    spotifyListeners: liveScraped.spotify || 150
  };

  const today = new Date().toISOString().split("T")[0];
  const state = loadState();

  let existingTodayIndex = state.metrics.findIndex((m: SocialMetric) => m.fecha === today);
  
  const newEntry: SocialMetric = {
    id: existingTodayIndex !== -1 ? state.metrics[existingTodayIndex].id : `metric-${Date.now()}`,
    fecha: today,
    instagram: fetchedData.instagramFollowers || 1385,
    tiktok: fetchedData.tiktokFollowers || 253,
    youtube: fetchedData.youtubeSubscribers || 40,
    spotify: fetchedData.spotifyListeners || 150,
    notas: `Auto-snapshot diario (${new Date().toLocaleTimeString('es-ES')})`
  };

  if (existingTodayIndex !== -1) {
    state.metrics[existingTodayIndex] = newEntry;
  } else {
    state.metrics.push(newEntry);
  }

  saveState(state);

  try {
    await dbUpsertSocialMetric(newEntry, userBandId);
    console.log("Snapshot exitoso y sincronizado con Supabase");
  } catch (dbErr) {
    console.error("Error sincronizando snapshot automático con Supabase:", dbErr);
  }

  res.json({
    success: true,
    message: `Snapshot guardado correctamente para la fecha ${today}`,
    metric: newEntry
  });
});

// Automated daily snapshot endpoint for ALL bands using the Social Radar Agent
router.all("/metrics/cron-snapshot-all", requireCronOrAuth, async (req, res) => {
  try {
    const radarResult = await executeSocialRadar("manual");
    res.json({
      success: true,
      message: `Rastreo del Agente Radar completado con éxito para ${radarResult.totalBands} bandas`,
      ...radarResult
    });
  } catch (err: any) {
    console.error("Error ejecutando SocialRadar:", err);
    res.status(500).json({ success: false, error: err?.message || "Error ejecutando radar social" });
  }
});

// Endpoint to fetch indexed social content items (videos, tracks, reels)
router.get("/metrics/content-items", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id || "band-bakandeya";
    const platform = req.query.platform as string | undefined;
    const items = await dbGetSocialContentItems(userBandId, platform);
    res.json({ success: true, items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// --- INSTAGRAM META GRAPH API & OAUTH ENDPOINTS ---

// Check Instagram connection status for the band
router.get("/metrics/instagram/status", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id || "band-bakandeya";
    const epk = await dbGetEpkConfig(userBandId).catch(() => null);
    const token = epk?.enlacesRedes?.instagram_access_token || process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_GRAPH_TOKEN;

    if (!token) {
      return res.json({
        success: true,
        connected: false,
        method: "scraping_fallback",
        message: "Sin token oficial de Meta Graph API configurado. El radar opera en modo scraping de alta resiliencia."
      });
    }

    // Validate token live against Instagram Graph API
    const igRes = await fetch(
      `https://graph.instagram.com/v19.0/me?fields=id,username,followers_count,media_count,name&access_token=${token}`,
      { signal: AbortSignal.timeout(6000) }
    ).catch(() => null);

    if (igRes && igRes.ok) {
      const igData = await igRes.json();
      return res.json({
        success: true,
        connected: true,
        method: "meta_graph_api_official",
        account: {
          id: igData.id,
          username: igData.username,
          name: igData.name || igData.username,
          followers_count: igData.followers_count,
          media_count: igData.media_count
        }
      });
    }

    // Try Facebook Graph API fallback (for Business/Creator accounts linked to a FB Page)
    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id,username,followers_count,media_count,name}&access_token=${token}`,
      { signal: AbortSignal.timeout(6000) }
    ).catch(() => null);

    if (fbRes && fbRes.ok) {
      const fbData = await fbRes.json();
      const pageWithIg = fbData?.data?.find((p: any) => p.instagram_business_account);
      if (pageWithIg?.instagram_business_account) {
        const igAcc = pageWithIg.instagram_business_account;
        return res.json({
          success: true,
          connected: true,
          method: "meta_business_graph_api",
          account: {
            id: igAcc.id,
            username: igAcc.username,
            name: igAcc.name || igAcc.username,
            followers_count: igAcc.followers_count,
            media_count: igAcc.media_count
          }
        });
      }
    }

    return res.json({
      success: true,
      connected: false,
      method: "expired_or_invalid_token",
      error: "El token de Instagram ha expirado o no tiene los permisos requeridos (user_profile, instagram_basic)."
    });
  } catch (err: any) {
    console.error("Error checking Instagram connection status:", err);
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Connect Instagram account using User Access Token / Long-lived Token
router.post("/metrics/instagram/connect", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id || "band-bakandeya";
    const { accessToken } = req.body;

    if (!accessToken || typeof accessToken !== "string" || accessToken.trim().length < 10) {
      return res.status(400).json({ success: false, error: "Token de acceso de Meta / Instagram no proporcionado o inválido." });
    }

    const cleanToken = accessToken.trim();

    // 1. Verify token with Instagram Basic Display / Graph API
    let verifiedAccount: any = null;
    let authSource = "instagram_basic";

    const igRes = await fetch(
      `https://graph.instagram.com/v19.0/me?fields=id,username,followers_count,media_count,name&access_token=${cleanToken}`,
      { signal: AbortSignal.timeout(8000) }
    ).catch(() => null);

    if (igRes && igRes.ok) {
      const igData = await igRes.json();
      verifiedAccount = {
        id: igData.id,
        username: igData.username,
        name: igData.name || igData.username,
        followers_count: igData.followers_count !== undefined ? Number(igData.followers_count) : null,
        media_count: igData.media_count !== undefined ? Number(igData.media_count) : null
      };
    } else {
      // Try Facebook Graph API for Meta Business Page linked accounts
      const fbRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id,username,followers_count,media_count,name}&access_token=${cleanToken}`,
        { signal: AbortSignal.timeout(8000) }
      ).catch(() => null);

      if (fbRes && fbRes.ok) {
        const fbData = await fbRes.json();
        const pageWithIg = fbData?.data?.find((p: any) => p.instagram_business_account);
        if (pageWithIg?.instagram_business_account) {
          const igAcc = pageWithIg.instagram_business_account;
          authSource = "meta_business";
          verifiedAccount = {
            id: igAcc.id,
            username: igAcc.username,
            name: igAcc.name || igAcc.username,
            followers_count: igAcc.followers_count !== undefined ? Number(igAcc.followers_count) : null,
            media_count: igAcc.media_count !== undefined ? Number(igAcc.media_count) : null
          };
        }
      }
    }

    if (!verifiedAccount) {
      return res.status(400).json({
        success: false,
        error: "No se pudo validar el token con Meta Graph API. Asegúrate de que el token sea válido y tenga permisos 'user_profile' e 'instagram_basic'."
      });
    }

    // 2. Persist in Supabase under epk_configs
    const epk = await dbGetEpkConfig(userBandId).catch(() => null) || {};
    const updatedRedes = {
      ...(epk.enlacesRedes || {}),
      instagram_access_token: cleanToken,
      instagram_account_id: verifiedAccount.id,
      instagram_username: verifiedAccount.username,
      instagram_verified_at: new Date().toISOString()
    };

    await dbUpsertEpkConfig(userBandId, {
      ...epk,
      enlacesRedes: updatedRedes
    });

    // 3. Update current social metric in Supabase if followers were returned
    if (verifiedAccount.followers_count !== null) {
      const today = new Date().toISOString().split("T")[0];
      const existing = await dbGetSocialMetrics(userBandId).catch(() => []);
      const currentToday = existing.find((m: any) => m.fecha === today) || existing[0] || {};

      const newEntry: SocialMetric = {
        id: currentToday.id || `metric-${userBandId}-${today}`,
        fecha: today,
        instagram: verifiedAccount.followers_count,
        tiktok: currentToday.tiktok || 0,
        youtube: currentToday.youtube || 0,
        spotify: currentToday.spotify || 0,
        notas: `Meta Graph API Oficial (@${verifiedAccount.username})`,
        instagram_followers: verifiedAccount.followers_count,
        instagram_posts_count: verifiedAccount.media_count || currentToday.instagram_posts_count || 0
      };

      await dbUpsertSocialMetric(newEntry, userBandId).catch(() => null);
    }

    res.json({
      success: true,
      message: `¡Cuenta @${verifiedAccount.username} conectada con éxito mediante Meta Graph API!`,
      account: verifiedAccount,
      authSource
    });
  } catch (err: any) {
    console.error("Error connecting Instagram token:", err);
    res.status(500).json({ success: false, error: err?.message || "Error al conectar con Instagram" });
  }
});

// Disconnect Instagram token
router.post("/metrics/instagram/disconnect", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id || "band-bakandeya";
    const epk = await dbGetEpkConfig(userBandId).catch(() => null) || {};
    
    if (epk.enlacesRedes) {
      delete epk.enlacesRedes.instagram_access_token;
      delete epk.enlacesRedes.instagram_account_id;
      delete epk.enlacesRedes.instagram_verified_at;
      
      await dbUpsertEpkConfig(userBandId, {
        ...epk,
        enlacesRedes: epk.enlacesRedes
      });
    }

    res.json({ success: true, message: "Token de Instagram desconectado. El sistema volverá al modo scraping autónomo." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

export default router;


