import express from "express";
import { SocialPost } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { dbGetSocialPosts, dbUpsertSocialPost, dbDeleteSocialPost } from "../db.js";

const router = express.Router();

// GET social posts
router.get("/posts", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  try {
    const posts = await dbGetSocialPosts(userBandId);
    res.json(posts);
  } catch (err) {
    const state = loadState();
    res.json(state.posts || []);
  }
});

// Update social post
router.put("/posts/:id", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const { id } = req.params;
  const updated: Partial<SocialPost> = req.body;
  const merged = { ...updated, id };

  let saved: any;
  try {
    saved = await dbUpsertSocialPost(merged, userBandId);

    const state = loadState();
    const idx = state.posts.findIndex((p: SocialPost) => p.id === id);
    if (idx !== -1) {
      state.posts[idx] = saved as any;
    } else {
      state.posts.push(saved as any);
    }
    saveState(state);
  } catch (err: any) {
    console.error("Error updating social post:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }

  let webhookTriggered = false;
  let webhookError = null;
  if (updated.estado === "publicado" && process.env.PUBLISH_WEBHOOK_URL) {
    try {
      console.log(`[Publishing Webhook] Triggering webhook for post ${id}...`);
      const resp = await fetch(process.env.PUBLISH_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "post_published",
          post: saved,
          timestamp: new Date().toISOString()
        })
      });
      if (resp.ok) {
        webhookTriggered = true;
      } else {
        webhookError = `HTTP ${resp.status}: ${await resp.text()}`;
      }
    } catch (err: any) {
      console.error("Error triggering publish webhook on update:", err);
      webhookError = err.message || String(err);
    }
  }

  res.json({ success: true, post: saved, webhookTriggered, webhookError });
});

// Create social post
router.post("/posts", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const newPost: SocialPost = req.body;
  try {
    const saved = await dbUpsertSocialPost(newPost, userBandId);

    const state = loadState();
    state.posts.push(saved as any);
    saveState(state);

    res.json({ success: true, post: saved });
  } catch (err: any) {
    console.error("Error creating social post:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Delete social post
router.delete("/posts/:id", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  const { id } = req.params;
  try {
    await dbDeleteSocialPost(id, userBandId);

    const state = loadState();
    state.posts = state.posts.filter((p: SocialPost) => p.id !== id);
    saveState(state);

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting social post:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Sync all social posts with Supabase
router.post("/posts/sync", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  try {
    const posts = await dbGetSocialPosts(userBandId);
    const state = loadState();
    state.posts = posts as any;
    saveState(state);
    
    res.json({
      success: true,
      message: `¡Se han sincronizado correctamente ${posts.length} publicaciones de redes sociales con Supabase!`,
      posts
    });
  } catch (error: any) {
    console.error("Error in /api/posts/sync:", error);
    res.status(500).json({
      success: false,
      error: `Error al sincronizar con Supabase: ${error.message || error}`
    });
  }
});

// Trigger direct external publishing webhook (Make.com, Zapier, Ayrshare, or Python agent)
router.post("/posts/trigger-webhook", requireAuth, async (req, res) => {
  const { post, webhookUrl } = req.body;
  const targetWebhook = webhookUrl || process.env.PUBLISH_WEBHOOK_URL;

  if (!targetWebhook) {
    return res.status(400).json({
      success: false,
      error: "No se ha configurado ninguna URL de Webhook (PUBLISH_WEBHOOK_URL). Puedes configurar Make.com, Zapier o un servicio de autopublicación."
    });
  }

  try {
    const response = await fetch(targetWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "post_scheduled",
        post,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      return res.json({
        success: true,
        message: "Webhook de publicación disparado con éxito."
      });
    } else {
      const text = await response.text();
      return res.status(400).json({
        success: false,
        error: `El webhook respondió con error ${response.status}: ${text}`
      });
    }
  } catch (err: any) {
    console.error("Error triggering publish webhook:", err);
    return res.status(500).json({
      success: false,
      error: `Error al conectar con el webhook de publicación: ${err.message || err}`
    });
  }
});

export default router;
