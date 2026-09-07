import { getSupabase } from "../db/core.js";

const INSTAGRAM_GRAPH_API = "https://graph.instagram.com/v18.0";

interface TokenExchangeResponse {
  access_token: string;
  user_id: string;
  instagram_business_account_id?: string;
}

/**
 * Exchange Instagram authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<TokenExchangeResponse | null> {
  try {
    const response = await fetch(`${INSTAGRAM_GRAPH_API}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code
      }).toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Instagram OAuth] Token exchange failed (${response.status}):`,
        errorText
      );
      return null;
    }

    const data: any = await response.json();

    if (!data.access_token) {
      console.error("[Instagram OAuth] No access token in response:", data);
      return null;
    }

    return {
      access_token: data.access_token,
      user_id: data.user_id,
      instagram_business_account_id: data.instagram_business_account_id
    };
  } catch (err: any) {
    console.error("[Instagram OAuth] Error exchanging code:", err);
    return null;
  }
}

/**
 * Get Instagram Business Account ID using access token
 * (sometimes the exchange response doesn't include it)
 */
export async function getInstagramBusinessAccountId(
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_API}/me?fields=id,username&access_token=${accessToken}`
    );

    if (!response.ok) {
      console.warn("[Instagram OAuth] Failed to fetch account ID");
      return null;
    }

    const data: any = await response.json();
    return data.id || null;
  } catch (err) {
    console.warn("[Instagram OAuth] Error fetching account ID:", err);
    return null;
  }
}

/**
 * Get Instagram username using access token
 */
export async function getInstagramUsername(
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_API}/me?fields=username&access_token=${accessToken}`
    );

    if (!response.ok) {
      console.warn("[Instagram OAuth] Failed to fetch username");
      return null;
    }

    const data: any = await response.json();
    return data.username || null;
  } catch (err) {
    console.warn("[Instagram OAuth] Error fetching username:", err);
    return null;
  }
}

/**
 * Save Instagram connection to Supabase
 */
export async function saveInstagramConnection(
  bandId: string,
  instagramBusinessAccountId: string,
  instagramUsername: string,
  accessToken: string
): Promise<boolean> {
  try {
    const sb = getSupabase();

    const { error } = await sb.from("band_instagram_accounts").upsert(
      {
        id: `ig-account-${bandId}`,
        band_id: bandId,
        instagram_business_account_id: instagramBusinessAccountId,
        instagram_username: instagramUsername,
        access_token: accessToken,
        is_active: true,
        token_refreshed_at: new Date().toISOString()
      },
      { onConflict: "band_id" }
    );

    if (error) {
      console.error("[Instagram OAuth] Error saving connection:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Instagram OAuth] Error in saveInstagramConnection:", err);
    return false;
  }
}

/**
 * Generate Instagram OAuth authorization URL
 */
export function generateAuthorizationUrl(
  appId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "instagram_business_basic,instagram_content_publish,instagram_insights",
    response_type: "code",
    state
  });

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}
