import express from "express";
import { requireAuth } from "../../state.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import {
  publishToInstagram,
  getInstagramAccountForBand,
  getInstagramFollowers,
  getInstagramInsights
} from "../../services/instagramPublisher.js";
import { getSupabase } from "../../db/core.js";

const router = express.Router();

/**
 * POST /api/social/instagram/publish
 * Publish a post to Instagram
 */
router.post("/instagram/publish", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { caption, image_url, video_url, media_type } = req.body;
    const user = (req as any).user;

    if (!media_type || !["IMAGE", "VIDEO", "CAROUSEL"].includes(media_type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid media_type. Must be IMAGE, VIDEO, or CAROUSEL"
      });
    }

    if (media_type === "IMAGE" && !image_url) {
      return res.status(400).json({
        success: false,
        error: "image_url is required for IMAGE media type"
      });
    }

    if (media_type === "VIDEO" && !video_url) {
      return res.status(400).json({
        success: false,
        error: "video_url is required for VIDEO media type"
      });
    }

    const result = await publishToInstagram(
      bandId,
      {
        caption: caption || "",
        image_url,
        video_url,
        media_type: media_type as "IMAGE" | "VIDEO" | "CAROUSEL"
      },
      user?.email || "unknown"
    );

    res.json(result);
  } catch (error: any) {
    console.error("Error in POST /api/social/instagram/publish:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to publish to Instagram"
    });
  }
});

/**
 * GET /api/social/instagram/account
 * Get connected Instagram account info for the band
 */
router.get("/instagram/account", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const account = await getInstagramAccountForBand(bandId);

    if (!account) {
      return res.json({
        connected: false,
        message: "No Instagram account connected for this band"
      });
    }

    res.json({
      connected: true,
      username: account.instagram_username,
      businessAccountId: account.instagram_business_account_id,
      isActive: account.is_active,
      connectedAt: account.created_at
    });
  } catch (error: any) {
    console.error("Error in GET /api/social/instagram/account:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/instagram/followers
 * Get Instagram followers count
 */
router.get("/instagram/followers", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const followers = await getInstagramFollowers(bandId);

    res.json({ followers });
  } catch (error: any) {
    console.error("Error in GET /api/social/instagram/followers:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/instagram/insights
 * Get Instagram insights (followers, impressions, reach)
 */
router.get("/instagram/insights", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const insights = await getInstagramInsights(bandId);

    res.json(insights || { followers: 0, impressions: 0, reach: 0 });
  } catch (error: any) {
    console.error("Error in GET /api/social/instagram/insights:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/social/instagram/connect
 * Connect an Instagram Business Account (admin-only, for testing)
 * In production, this would use OAuth flow
 */
router.post("/instagram/connect", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { instagram_business_account_id, instagram_username, access_token } =
      req.body;

    if (!instagram_business_account_id || !instagram_username || !access_token) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: instagram_business_account_id, instagram_username, access_token"
      });
    }

    const sb = getSupabase();
    const { error } = await sb.from("band_instagram_accounts").upsert(
      {
        id: `ig-account-${bandId}`,
        band_id: bandId,
        instagram_business_account_id,
        instagram_username,
        access_token,
        is_active: true,
        token_refreshed_at: new Date().toISOString()
      },
      { onConflict: "band_id" }
    );

    if (error) {
      console.error("Error connecting Instagram account:", error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: `Instagram account ${instagram_username} connected for band ${bandId}`
    });
  } catch (error: any) {
    console.error("Error in POST /api/social/instagram/connect:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to connect Instagram account"
    });
  }
});

/**
 * POST /api/social/instagram/disconnect
 * Disconnect Instagram Business Account for the band
 */
router.post("/instagram/disconnect", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const sb = getSupabase();

    const { error } = await sb
      .from("band_instagram_accounts")
      .update({ is_active: false })
      .eq("band_id", bandId);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: "Instagram account disconnected"
    });
  } catch (error: any) {
    console.error("Error in POST /api/social/instagram/disconnect:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
