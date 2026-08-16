import { dbGetRegisteredBands, dbGetEpkConfig, dbUpsertSocialMetric, dbGetSocialMetrics, dbUpsertSocialContentItem, dbUpdateBandRadarStatus } from "../db.js";
import { SocialMetric } from "../../src/types.js";

// Helper to extract YouTube channel ID or handle
function parseYouTubeUrl(url: string): { type: "handle" | "id" | "forUsername"; value: string } | null {
  if (!url) return null;
  const clean = url.trim();
  
  if (clean.includes("/@") || clean.startsWith("@")) {
    const handlePart = clean.includes("/@") ? clean.split("/@")[1] : clean.substring(1);
    const handle = handlePart.split("/")[0].split("?")[0].trim();
    if (handle) return { type: "handle", value: handle };
  }
  
  const channelMatch = clean.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i);
  if (channelMatch && channelMatch[1]) {
    return { type: "id", value: channelMatch[1] };
  }
  
  const customMatch = clean.match(/youtube\.com\/(?:c|user)\/([a-zA-Z0-9_-]+)/i);
  if (customMatch && customMatch[1]) {
    return { type: "forUsername", value: customMatch[1] };
  }

  if (!clean.includes("/") && clean.length > 0) {
    return { type: "handle", value: clean.replace(/^@/, "") };
  }

  return null;
}

// Scrape channel metrics and recent videos across platforms (0 AI tokens)
export async function scrapeChannelMetrics(band: {
  band_id: string;
  nombre_banda: string;
  spotify_youtube?: string;
  instagram?: string;
  tiktok?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
}) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
  };

  const result = {
    // YouTube
    youtubeSubscribers: 0,
    youtubeTotalViews: 0,
    youtubeVideoCount: 0,
    videos: [] as Array<{ id: string; title: string; views: number; date: string; link: string; thumb?: string }>,

    // Instagram
    instagramFollowers: 0,
    instagramFollowing: 0,
    instagramPostsCount: 0,
    instagramEngagementRate: 0,

    // TikTok
    tiktokFollowers: 0,
    tiktokTotalLikes: 0,
    tiktokVideoCount: 0,

    // Spotify
    spotifyMonthlyListeners: 0,
    spotifyFollowers: 0,
    spotifyPopularity: 0,
    spotifyTracks: [] as Array<{ id: string; title: string; views: number; link: string }>,

    notes: ""
  };

  const ytUrl = band.youtubeUrl || (band.spotify_youtube?.includes("youtube.com") || band.spotify_youtube?.includes("youtu.be") ? band.spotify_youtube : "");

  // 1. YouTube Extraction
  if (ytUrl) {
    try {
      const parsedYt = parseYouTubeUrl(ytUrl);
      const scrapeUrl = parsedYt?.type === "handle" 
        ? `https://www.youtube.com/@${parsedYt.value}/videos`
        : (ytUrl.includes("http") ? (ytUrl.endsWith("/videos") ? ytUrl : `${ytUrl.replace(/\/$/, '')}/videos`) : `https://www.youtube.com/${ytUrl}`);

      const res = await fetch(scrapeUrl, { headers, signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const html = await res.text();
        const initialMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
        if (initialMatch && initialMatch[1]) {
          try {
            const data = JSON.parse(initialMatch[1]);
            const header = data.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;
            const metadataRows = header?.metadata?.contentMetadataViewModel?.metadataRows;
            
            if (Array.isArray(metadataRows)) {
              for (const row of metadataRows) {
                if (Array.isArray(row.metadataParts)) {
                  for (const part of row.metadataParts) {
                    const text = part.text?.content || part.accessibilityLabel || "";
                    if (/suscriptor|subscriber/i.test(text)) {
                      let num = 0;
                      if (/k/i.test(text)) {
                        num = Math.round(parseFloat(text.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
                      } else if (/m/i.test(text)) {
                        num = Math.round(parseFloat(text.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
                      } else {
                        num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                      }
                      if (!isNaN(num) && num > 0) {
                        result.youtubeSubscribers = num;
                      }
                    } else if (/vídeo|video/i.test(text)) {
                      const count = parseInt(text.replace(/[^0-9]/g, ""), 10);
                      if (!isNaN(count)) result.youtubeVideoCount = count;
                    }
                  }
                }
              }
            }

            // Extract videos
            const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
            const videosTab = tabs?.find((t: any) => t.tabRenderer?.title === "Vídeos" || t.tabRenderer?.title === "Videos");
            const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents;
            if (Array.isArray(contents)) {
              let totalViewsSum = 0;
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
                  
                  let viewsNum = 0;
                  if (/k/i.test(viewsStr)) {
                    viewsNum = Math.round(parseFloat(viewsStr.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
                  } else if (/m/i.test(viewsStr)) {
                    viewsNum = Math.round(parseFloat(viewsStr.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
                  } else {
                    viewsNum = parseInt(viewsStr.replace(/[^0-9]/g, ""), 10) || 0;
                  }

                  totalViewsSum += viewsNum;

                  const thumb = lockup.image?.sources?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

                  if (title && videoId) {
                    result.videos.push({
                      id: videoId,
                      title,
                      views: viewsNum,
                      date: dateStr,
                      link: `https://www.youtube.com/watch?v=${videoId}`,
                      thumb
                    });
                  }
                }
              }
              if (result.youtubeTotalViews === 0 && totalViewsSum > 0) {
                result.youtubeTotalViews = totalViewsSum;
              }
            }
          } catch (e) {
            console.warn(`[SocialRadar] JSON parsing warning for ${band.nombre_banda}:`, e);
          }
        }
      }
    } catch (ytErr: any) {
      console.warn(`[SocialRadar] YouTube scrape failed for ${band.nombre_banda}:`, ytErr?.message);
    }
  }

  // 2. Spotify Public Artist Page Extraction (OG Meta Tag via Bot Headers)
  const spUrl = band.spotifyUrl || (band.spotify_youtube?.includes("spotify.com") ? band.spotify_youtube : "");
  if (spUrl && spUrl.includes("artist")) {
    try {
      const cleanSpUrl = spUrl.split("?")[0];
      const botHeaders = {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      };

      const res = await fetch(cleanSpUrl, { headers: botHeaders, signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const spHtml = await res.text();
        const metaDesc = spHtml.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i) ||
                         spHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
                         spHtml.match(/<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"/i);
        
        if (metaDesc && metaDesc[1]) {
          const desc = metaDesc[1];
          const listenersMatch = desc.match(/([0-9.,]+[kKmM]?)\s*(?:monthly listeners|oyentes mensuales)/i);
          if (listenersMatch) {
            const raw = listenersMatch[1];
            let num = 0;
            if (/m/i.test(raw)) num = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
            else if (/k/i.test(raw)) num = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
            else num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(num) && num > 0) result.spotifyMonthlyListeners = num;
          }

          const followersMatch = desc.match(/([0-9.,]+[kKmM]?)\s*(?:followers|seguidores)/i);
          if (followersMatch) {
            const raw = followersMatch[1];
            let num = 0;
            if (/m/i.test(raw)) num = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
            else if (/k/i.test(raw)) num = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
            else num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(num) && num > 0) result.spotifyFollowers = num;
          }
        }

        // Direct HTML body regex fallback
        if (result.spotifyMonthlyListeners === 0) {
          const rawMatch = spHtml.match(/([0-9.,]+)\s*(?:monthly listeners|oyentes mensuales)/i);
          if (rawMatch) {
            const num = parseInt(rawMatch[1].replace(/[^0-9]/g, ""), 10);
            if (!isNaN(num)) result.spotifyMonthlyListeners = num;
          }
        }
      }
    } catch (spErr: any) {
      console.warn(`[SocialRadar] Spotify scrape failed for ${band.nombre_banda}:`, spErr?.message);
    }
  }

  // 3. Instagram Public Handle Extraction (Meta Graph API / OAuth Access Token OR Advanced Multi-Bot / Index Search Fallback)
  const igUrl = band.instagram;
  if (igUrl && igUrl.includes("instagram.com")) {
    try {
      const handle = igUrl.split("instagram.com/")[1]?.split("/")[0]?.split("?")[0]?.replace(/[^a-zA-Z0-9._]/g, "");
      
      // Step A: Check for Meta Graph API / Instagram Graph Access Token (Official Pro Integration)
      const metaToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_GRAPH_TOKEN || (band as any).instagram_access_token;
      if (metaToken && handle) {
        try {
          const igApiRes = await fetch(
            `https://graph.instagram.com/v19.0/me?fields=id,username,followers_count,media_count&access_token=${metaToken}`,
            { signal: AbortSignal.timeout(5000) }
          ).catch(() => null);

          if (igApiRes && igApiRes.ok) {
            const igData = await igApiRes.json();
            if (igData.followers_count !== undefined) {
              result.instagramFollowers = Number(igData.followers_count);
            }
            if (igData.media_count !== undefined) {
              result.instagramPostsCount = Number(igData.media_count);
            }
          }
        } catch (tokenErr) {
          console.warn("[SocialRadar] Meta Graph API token fetch note:", tokenErr);
        }
      }

      if (handle && result.instagramFollowers === 0) {
        // Step B: Try direct OpenGraph fetch with specialized Bot User-Agents (Facebot / WhatsApp / Twitterbot)
        const botUAs = [
          "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)",
          "Twitterbot/1.0"
        ];

        for (const ua of botUAs) {
          if (result.instagramFollowers > 0) break;
          const botHeaders = {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
          };
          const igRes = await fetch(`https://www.instagram.com/${handle}/`, { headers: botHeaders, signal: AbortSignal.timeout(4000) }).catch(() => null);
          if (igRes && igRes.ok) {
            const igHtml = await igRes.text();
            const igMeta = igHtml.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i) ||
                           igHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
            if (igMeta && igMeta[1] && (igMeta[1].includes("Followers") || igMeta[1].includes("seguidores") || igMeta[1].includes("Follower"))) {
              const desc = igMeta[1];
              const followersMatch = desc.match(/([0-9.,]+[kKmM]?)\s+(?:Followers|seguidores|Follower)/i);
              if (followersMatch) {
                const raw = followersMatch[1];
                let count = 0;
                if (/m/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
                else if (/k/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
                else count = parseInt(raw.replace(/[^0-9]/g, ""), 10);
                if (!isNaN(count)) result.instagramFollowers = count;
              }

              const followingMatch = desc.match(/([0-9.,]+[kKmM]?)\s+(?:Following|seguidos)/i);
              if (followingMatch) {
                const raw = followingMatch[1];
                let count = 0;
                if (/m/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
                else if (/k/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
                else count = parseInt(raw.replace(/[^0-9]/g, ""), 10);
                if (!isNaN(count)) result.instagramFollowing = count;
              }

              const postsMatch = desc.match(/([0-9.,]+[kKmM]?)\s+(?:Posts|publicaciones)/i);
              if (postsMatch) {
                const raw = postsMatch[1];
                let count = parseInt(raw.replace(/[^0-9]/g, ""), 10);
                if (!isNaN(count)) result.instagramPostsCount = count;
              }
            }
          }
        }

        // Step C: Search Index snippet fallback if Instagram blocked or hid the meta tag
        if (result.instagramFollowers === 0) {
          const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=instagram.com/${handle}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            signal: AbortSignal.timeout(5000)
          }).catch(() => null);

          if (ddgRes && ddgRes.ok) {
            const text = await ddgRes.text();
            const followersMatch = text.match(/([0-9.,]+[kKmM]?)\s*(?:followers|Followers|seguidores)/i);
            if (followersMatch) {
              const raw = followersMatch[1];
              let count = 0;
              if (/m/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
              else if (/k/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
              else count = parseInt(raw.replace(/[^0-9]/g, ""), 10);
              if (!isNaN(count)) result.instagramFollowers = count;
            }

            const followingMatch = text.match(/([0-9.,]+[kKmM]?)\s*(?:following|Following|seguidos)/i);
            if (followingMatch) {
              const raw = followingMatch[1];
              let count = 0;
              if (/m/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
              else if (/k/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
              else count = parseInt(raw.replace(/[^0-9]/g, ""), 10);
              if (!isNaN(count)) result.instagramFollowing = count;
            }

            const postsMatch = text.match(/([0-9.,]+[kKmM]?)\s*(?:posts|Posts|publicaciones)/i);
            if (postsMatch) {
              const raw = postsMatch[1];
              let count = parseInt(raw.replace(/[^0-9]/g, ""), 10);
              if (!isNaN(count)) result.instagramPostsCount = count;
            }
          }
        }
      }
    } catch (igErr) {
      // Graceful ignore
    }
  }

  // 4. TikTok Public Handle Extraction
  const tkUrl = band.tiktok;
  if (tkUrl && tkUrl.includes("tiktok.com")) {
    try {
      const handle = tkUrl.split("tiktok.com/@")[1]?.split("/")[0]?.split("?")[0]?.trim();
      if (handle) {
        const tkRes = await fetch(`https://www.tiktok.com/@${handle}`, { headers, signal: AbortSignal.timeout(5000) });
        if (tkRes.ok) {
          const tkHtml = await tkRes.text();
          const followersMatch = tkHtml.match(/"followerCount":\s*([0-9]+)/i) || tkHtml.match(/([0-9.,]+[kKmM]?)\s*(?:Followers|Seguidores)/i);
          if (followersMatch) {
            const raw = followersMatch[1];
            let count = 0;
            if (/k/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
            else if (/m/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
            else count = parseInt(raw.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(count)) result.tiktokFollowers = count;
          }

          const likesMatch = tkHtml.match(/"heartCount":\s*([0-9]+)/i) || tkHtml.match(/([0-9.,]+[kKmM]?)\s*(?:Likes|Me gusta)/i);
          if (likesMatch) {
            const raw = likesMatch[1];
            let count = 0;
            if (/k/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000);
            else if (/m/i.test(raw)) count = Math.round(parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) * 1000000);
            else count = parseInt(raw.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(count)) result.tiktokTotalLikes = count;
          }

          const videoCountMatch = tkHtml.match(/"videoCount":\s*([0-9]+)/i);
          if (videoCountMatch) {
            const count = parseInt(videoCountMatch[1], 10);
            if (!isNaN(count)) result.tiktokVideoCount = count;
          }
        }
      }
    } catch (tkErr) {
      // Graceful ignore
    }
  }

  return result;
}

// Executes the Social Radar Agent across all active registered bands
export async function executeSocialRadar(triggerSource: "cron" | "manual" = "cron") {
  const timestamp = new Date().toISOString();
  const today = timestamp.split("T")[0];
  console.log(`📡 [SocialRadar Agent] Iniciando rastreo (${triggerSource.toUpperCase()}) a las ${timestamp}...`);

  const bands = await dbGetRegisteredBands();
  if (!bands || bands.length === 0) {
    console.log(`[SocialRadar Agent] No hay bandas registradas para rastrear.`);
    return { success: true, count: 0, results: [] };
  }

  const results = [];

  for (const band of bands) {
    const bandId = band.band_id || band.id;
    try {
      const epk = await dbGetEpkConfig(bandId).catch(() => null);
      
      const ytUrl = band.spotify_youtube?.includes("youtube.com") || band.spotify_youtube?.includes("youtu.be")
        ? band.spotify_youtube
        : (epk?.enlacesRedes?.youtube || epk?.firmaEmail?.redesSociales?.youtube || "");
      
      const igUrl = band.instagram || epk?.enlacesRedes?.instagram || epk?.firmaEmail?.redesSociales?.instagram || "";
      const tiktokUrl = epk?.enlacesRedes?.tiktok || epk?.firmaEmail?.redesSociales?.tiktok || "";
      const spotifyUrl = band.spotify_youtube?.includes("spotify.com") 
        ? band.spotify_youtube 
        : (epk?.enlacesRedes?.spotify || epk?.firmaEmail?.redesSociales?.spotify || "");

      const metricsScraped = await scrapeChannelMetrics({
        band_id: bandId,
        nombre_banda: band.nombre_banda,
        spotify_youtube: band.spotify_youtube,
        instagram: igUrl,
        tiktok: tiktokUrl,
        spotifyUrl,
        youtubeUrl: ytUrl
      });

      // Get existing metrics to preserve values that might not be in the current scrape
      const existing = await dbGetSocialMetrics(bandId).catch(() => []);
      const latestExisting = existing.length > 0 ? existing[existing.length - 1] : null;

      const instagram = metricsScraped.instagramFollowers || latestExisting?.instagram_followers || latestExisting?.instagram || 0;
      const tiktok = metricsScraped.tiktokFollowers || latestExisting?.tiktok_followers || latestExisting?.tiktok || 0;
      const youtube = metricsScraped.youtubeSubscribers || latestExisting?.youtube_subscribers || latestExisting?.youtube || 0;
      const spotify = metricsScraped.spotifyMonthlyListeners || latestExisting?.spotify_monthly_listeners || latestExisting?.spotify || 0;

      const newEntry: SocialMetric = {
        id: `radar-${bandId}-${today}`,
        band_id: bandId,
        fecha: today,
        instagram,
        tiktok,
        youtube,
        spotify,
        
        // Granular platform metrics
        spotify_monthly_listeners: metricsScraped.spotifyMonthlyListeners || latestExisting?.spotify_monthly_listeners || spotify,
        spotify_followers: metricsScraped.spotifyFollowers || latestExisting?.spotify_followers || 0,
        spotify_popularity: metricsScraped.spotifyPopularity || latestExisting?.spotify_popularity || 0,

        youtube_subscribers: metricsScraped.youtubeSubscribers || latestExisting?.youtube_subscribers || youtube,
        youtube_total_views: metricsScraped.youtubeTotalViews || latestExisting?.youtube_total_views || 0,
        youtube_video_count: metricsScraped.youtubeVideoCount || latestExisting?.youtube_video_count || metricsScraped.videos.length,

        instagram_followers: metricsScraped.instagramFollowers || latestExisting?.instagram_followers || instagram,
        instagram_following: metricsScraped.instagramFollowing || latestExisting?.instagram_following || 0,
        instagram_posts_count: metricsScraped.instagramPostsCount || latestExisting?.instagram_posts_count || 0,
        instagram_engagement_rate: metricsScraped.instagramEngagementRate || latestExisting?.instagram_engagement_rate || 0,

        tiktok_followers: metricsScraped.tiktokFollowers || latestExisting?.tiktok_followers || tiktok,
        tiktok_total_likes: metricsScraped.tiktokTotalLikes || latestExisting?.tiktok_total_likes || 0,
        tiktok_video_count: metricsScraped.tiktokVideoCount || latestExisting?.tiktok_video_count || 0,

        notas: `Radar Auto-Snapshot (${new Date().toLocaleTimeString('es-ES')})`
      };

      await dbUpsertSocialMetric(newEntry, bandId);

      // Save individual video items to social_content_items
      for (const video of metricsScraped.videos) {
        await dbUpsertSocialContentItem({
          band_id: bandId,
          platform: "youtube",
          external_id: video.id,
          title: video.title,
          url: video.link,
          thumbnail_url: video.thumb,
          views: video.views
        }, bandId);
      }

      // Update band radar status
      await dbUpdateBandRadarStatus(bandId, timestamp, true);
      
      results.push({
        bandId,
        bandName: band.nombre_banda,
        success: true,
        metrics: {
          youtube: newEntry.youtube,
          instagram: newEntry.instagram,
          tiktok: newEntry.tiktok,
          spotify: newEntry.spotify,
          youtubeViews: newEntry.youtube_total_views,
          youtubeVideos: newEntry.youtube_video_count
        },
        videosStored: metricsScraped.videos.length
      });

      console.log(`✅ [SocialRadar] Banda "${band.nombre_banda}" (${bandId}) actualizada: YT=${youtube}, IG=${instagram}, TK=${tiktok}, SP=${spotify}, Videos=${metricsScraped.videos.length}`);
    } catch (err: any) {
      console.error(`❌ [SocialRadar] Error rastreando banda ${band.nombre_banda} (${bandId}):`, err?.message);
      results.push({
        bandId,
        bandName: band.nombre_banda,
        success: false,
        error: err?.message
      });
    }
  }

  console.log(`🏁 [SocialRadar Agent] Rastreo completado para ${results.length} bandas.`);
  return {
    success: true,
    executionTime: timestamp,
    totalBands: results.length,
    results
  };
}

let radarInterval: NodeJS.Timeout | null = null;
let lastRunDate: string | null = null;

// Starts the periodic background runner (checks every hour, executes daily)
export function startSocialRadarScheduler() {
  if (radarInterval) {
    clearInterval(radarInterval);
  }

  console.log("🕒 [SocialRadar Agent] Planificador en segundo plano inicializado (Ejecución periódica diaria).");

  // Check immediately upon server startup
  const today = new Date().toISOString().split("T")[0];
  if (lastRunDate !== today) {
    executeSocialRadar("cron").then(() => {
      lastRunDate = today;
    }).catch(err => {
      console.error("[SocialRadar Agent] Error en ejecución inicial:", err);
    });
  }

  // Interval check every 60 minutes
  radarInterval = setInterval(async () => {
    const currentDate = new Date().toISOString().split("T")[0];
    if (lastRunDate !== currentDate) {
      try {
        await executeSocialRadar("cron");
        lastRunDate = currentDate;
      } catch (err) {
        console.error("[SocialRadar Agent] Error en cron periódico:", err);
      }
    }
  }, 60 * 60 * 1000);
}
