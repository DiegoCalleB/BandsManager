import express from "express";
import crypto from "crypto";
import { requireAuth } from "../../state.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import {
  generateAuthorizationUrl,
  exchangeCodeForToken,
  getInstagramBusinessAccountId,
  getInstagramUsername,
  saveInstagramConnection
} from "../../services/instagramOAuthClient.js";

const router = express.Router();

/**
 * GET /api/social/instagram-oauth/authorize
 * Initiate Instagram OAuth flow for a band
 */
router.get("/instagram-oauth/authorize", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);

    const appId = process.env.INSTAGRAM_APP_ID;
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/social/instagram-oauth/callback`;

    if (!appId) {
      return res.status(400).json({
        success: false,
        error:
          "Instagram App ID not configured. Set INSTAGRAM_APP_ID env var."
      });
    }

    // Generate state token to prevent CSRF and track which band is authorizing
    const state = crypto
      .randomBytes(32)
      .toString("hex");

    // Store state temporarily in memory (in production, use Redis or Supabase)
    // For now, encode band_id in state for verification on callback
    const stateWithBand = `${state}:${bandId}`;

    const authUrl = generateAuthorizationUrl(appId, redirectUri, stateWithBand);

    res.json({
      success: true,
      authUrl,
      message: "Redirect to this URL to authorize Instagram"
    });
  } catch (error: any) {
    console.error("Error in GET /instagram-oauth/authorize:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate authorization URL"
    });
  }
});

/**
 * GET /api/social/instagram-oauth/callback
 * Instagram OAuth callback handler
 */
router.get("/instagram-oauth/callback", async (req, res) => {
  try {
    const { code, state, error, error_reason, error_description } = req.query;

    if (error) {
      console.error(
        `[Instagram OAuth] Authorization denied: ${error_reason} - ${error_description}`
      );
      return res.redirect(
        `/dashboard?instagram_error=${encodeURIComponent(
          String(error_description || error)
        )}`
      );
    }

    if (!code || !state) {
      console.error("[Instagram OAuth] Missing code or state");
      return res.redirect("/dashboard?instagram_error=Missing+code+or+state");
    }

    // Verify state and extract band_id
    const [, bandId] = String(state).split(":");

    if (!bandId) {
      console.error("[Instagram OAuth] Invalid state format");
      return res.redirect("/dashboard?instagram_error=Invalid+state");
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/social/instagram-oauth/callback`;

    if (!appId || !appSecret) {
      console.error("[Instagram OAuth] Missing app credentials");
      return res.redirect(
        "/dashboard?instagram_error=Server+misconfigured"
      );
    }

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(
      String(code),
      appId,
      appSecret,
      redirectUri
    );

    if (!tokenData || !tokenData.access_token) {
      console.error("[Instagram OAuth] Failed to exchange code for token");
      return res.redirect(
        "/dashboard?instagram_error=Failed+to+exchange+token"
      );
    }

    // Get business account ID
    let businessAccountId = tokenData.instagram_business_account_id;
    if (!businessAccountId) {
      businessAccountId = await getInstagramBusinessAccountId(
        tokenData.access_token
      );
    }

    if (!businessAccountId) {
      console.error("[Instagram OAuth] Failed to get business account ID");
      return res.redirect(
        "/dashboard?instagram_error=Failed+to+get+account+info"
      );
    }

    // Get username
    const username = await getInstagramUsername(tokenData.access_token);

    if (!username) {
      console.error("[Instagram OAuth] Failed to get username");
      return res.redirect(
        "/dashboard?instagram_error=Failed+to+get+username"
      );
    }

    // Save to Supabase
    const saved = await saveInstagramConnection(
      bandId,
      businessAccountId,
      username,
      tokenData.access_token
    );

    if (!saved) {
      console.error("[Instagram OAuth] Failed to save connection");
      return res.redirect(
        "/dashboard?instagram_error=Failed+to+save+connection"
      );
    }

    // Success: redirect with success message
    res.redirect(
      `/dashboard?instagram_success=true&username=${encodeURIComponent(
        username
      )}`
    );
  } catch (error: any) {
    console.error("Error in GET /instagram-oauth/callback:", error);
    res.redirect(
      `/dashboard?instagram_error=${encodeURIComponent(
        error.message || "Unknown error"
      )}`
    );
  }
});

export default router;
