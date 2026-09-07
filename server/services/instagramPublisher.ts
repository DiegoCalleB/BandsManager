import { getSupabase } from "../db/core.js";

const INSTAGRAM_GRAPH_API = "https://graph.instagram.com/v18.0";

interface InstagramPublishPayload {
  caption?: string;
  image_url?: string;
  video_url?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL";
  carousel_items?: Array<{ image_url?: string; video_url?: string }>;
}

export async function getInstagramAccountForBand(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("band_instagram_accounts")
    .select("*")
    .eq("band_id", bandId)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error(`[Instagram] Error fetching account for band ${bandId}:`, error);
    return null;
  }

  return data;
}

export async function publishToInstagram(
  bandId: string,
  payload: InstagramPublishPayload,
  publishedBy: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const account = await getInstagramAccountForBand(bandId);

    if (!account) {
      return {
        success: false,
        error: "No Instagram account connected for this band"
      };
    }

    if (!account.access_token) {
      return {
        success: false,
        error: "Instagram access token is missing or expired"
      };
    }

    const businessAccountId = account.instagram_business_account_id;
    const accessToken = account.access_token;

    // Crear media container (primer paso)
    const containerResponse = await fetch(
      `${INSTAGRAM_GRAPH_API}/${businessAccountId}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          media_type: payload.media_type,
          caption: payload.caption || "",
          image_url: payload.image_url,
          video_url: payload.video_url,
          access_token: accessToken
        })
      }
    );

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text();
      console.error(
        `[Instagram] Container creation failed (${containerResponse.status}):`,
        errorText
      );
      return {
        success: false,
        error: `Instagram API error: ${containerResponse.status} - ${errorText}`
      };
    }

    const containerData: any = await containerResponse.json();

    if (!containerData.id) {
      return {
        success: false,
        error: "Failed to create Instagram media container"
      };
    }

    // Publicar el container (segundo paso)
    const publishResponse = await fetch(
      `${INSTAGRAM_GRAPH_API}/${businessAccountId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken
        })
      }
    );

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error(
        `[Instagram] Publish failed (${publishResponse.status}):`,
        errorText
      );
      return {
        success: false,
        error: `Failed to publish: ${errorText}`
      };
    }

    const publishData: any = await publishResponse.json();
    const instagramPostId = publishData.id;

    // Guardar en BD
    if (instagramPostId) {
      await saveInstagramPostToHistory(
        bandId,
        instagramPostId,
        payload,
        publishedBy
      );
    }

    return {
      success: true,
      postId: instagramPostId
    };
  } catch (err: any) {
    console.error(`[Instagram] Publish error:`, err);
    return {
      success: false,
      error: err.message || "Unknown error publishing to Instagram"
    };
  }
}

async function saveInstagramPostToHistory(
  bandId: string,
  instagramPostId: string,
  payload: InstagramPublishPayload,
  publishedBy: string
) {
  try {
    const sb = getSupabase();
    const { error } = await sb.from("instagram_posts_history").insert({
      id: `ig-post-${Date.now()}`,
      band_id: bandId,
      instagram_post_id: instagramPostId,
      caption: payload.caption || "",
      media_url: payload.image_url || payload.video_url || "",
      media_type: payload.media_type,
      published_at: new Date().toISOString(),
      published_by: publishedBy
    });

    if (error) {
      console.warn(`[Instagram] Failed to save post history:`, error);
    }
  } catch (err) {
    console.warn(`[Instagram] Error saving to history:`, err);
  }
}

export async function getInstagramFollowers(bandId: string): Promise<number> {
  try {
    const account = await getInstagramAccountForBand(bandId);

    if (!account) {
      return 0;
    }

    const response = await fetch(
      `${INSTAGRAM_GRAPH_API}/${account.instagram_business_account_id}?fields=followers_count&access_token=${account.access_token}`
    );

    if (!response.ok) {
      console.warn(`[Instagram] Failed to fetch followers count`);
      return 0;
    }

    const data: any = await response.json();
    return data.followers_count || 0;
  } catch (err) {
    console.warn(`[Instagram] Error fetching followers:`, err);
    return 0;
  }
}

export async function getInstagramInsights(
  bandId: string
): Promise<{ followers: number; impressions: number; reach: number } | null> {
  try {
    const account = await getInstagramAccountForBand(bandId);

    if (!account) {
      return null;
    }

    const response = await fetch(
      `${INSTAGRAM_GRAPH_API}/${account.instagram_business_account_id}/insights?metric=follower_count,impressions,reach&period=day&access_token=${account.access_token}`
    );

    if (!response.ok) {
      console.warn(`[Instagram] Failed to fetch insights`);
      return null;
    }

    const data: any = await response.json();
    const insights = {
      followers: 0,
      impressions: 0,
      reach: 0
    };

    data.data?.forEach((metric: any) => {
      if (metric.name === "follower_count") {
        insights.followers = metric.total_value?.total || 0;
      }
      if (metric.name === "impressions") {
        insights.impressions = metric.total_value?.total || 0;
      }
      if (metric.name === "reach") {
        insights.reach = metric.total_value?.total || 0;
      }
    });

    return insights;
  } catch (err) {
    console.warn(`[Instagram] Error fetching insights:`, err);
    return null;
  }
}
