// Publicaciones sociales y cuentas conectadas de la banda.

import express from "express";
import { SocialPost } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { 
  dbGetSocialPosts, 
  dbUpsertSocialPost, 
  dbDeleteSocialPost,
  dbGetBandSocialAccounts,
  dbUpsertBandSocialAccount,
  dbDeleteBandSocialAccount
} from "../db.js";
import { getTargetBandId, bandaDe } from "../utils/bandAccess.js";
import { publishSocialPostNow, publishDueScheduledPosts } from "../services/socialPublisher.js";
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';
import { responderError } from '../utils/errorHttp.js';

const router = express.Router();

// GET social posts
router.get("/posts", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  try {
    const posts = await dbGetSocialPosts(userBandId);
    res.json(posts);
  } catch {
    const state = loadState();
    res.json((state.posts || []).filter((p) => bandaDe(p) === userBandId));
  }
});

// Update social post
router.put("/posts/:id", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  const { id } = req.params;
  const updated: Partial<SocialPost> = req.body;
  const merged = { ...updated, id };

  // Fila de social_posts tal como la devuelve Supabase tras el upsert.
  let saved: SocialPost;
  try {
    saved = await dbUpsertSocialPost(merged, userBandId);

    const state = loadState();
    const idx = state.posts.findIndex((p: SocialPost) => p.id === id);
    if (idx !== -1) {
      state.posts[idx] = saved;
    } else {
      state.posts.push(saved);
    }
    saveState(state);
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error updating social post:", err);
    return responderError(res, err);
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
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error("Error triggering publish webhook on update:", err);
      webhookError = err.message || String(err);
    }
  }

  res.json({ success: true, post: saved, webhookTriggered, webhookError });
});

// Create social post
router.post("/posts", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  const newPost: SocialPost = req.body;
  try {
    const saved: SocialPost = await dbUpsertSocialPost(newPost, userBandId);

    const state = loadState();
    state.posts.push(saved);
    saveState(state);

    res.json({ success: true, post: saved });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error creating social post:", err);
    responderError(res, err);
  }
});

// Delete social post
router.delete("/posts/:id", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  const { id } = req.params;
  try {
    await dbDeleteSocialPost(id, userBandId);

    const state = loadState();
    state.posts = state.posts.filter((p: SocialPost) => p.id !== id);
    saveState(state);

    res.json({ success: true });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error deleting social post:", err);
    responderError(res, err);
  }
});

// --- SOCIAL ACCOUNTS (OAuth / Conexión de perfiles 1-clic) ---

// GET Cuentas conectadas
router.get("/social/accounts", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  try {
    const accounts = await dbGetBandSocialAccounts(userBandId);
    res.json({ success: true, accounts });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error obteniendo cuentas sociales:", err);
    responderError(res, err);
  }
});

// POST Conectar cuenta social en 1-clic (Instagram, YouTube, TikTok)
router.post("/social/accounts/connect", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  const { plataforma, handle, account_name, avatar_url } = req.body;

  if (!plataforma) {
    return res.status(400).json({ success: false, error: "Falta la plataforma (Instagram, YouTube, TikTok)." });
  }

  try {
    const cleanHandle = (handle || `@${userBandId.replace(/^band-/, "")}`).trim();
    const accountPayload = {
      plataforma,
      handle: cleanHandle.startsWith("@") ? cleanHandle : `@${cleanHandle}`,
      account_name: account_name || cleanHandle,
      avatar_url: avatar_url || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80`,
      status: "conectado",
      auto_publish_enabled: true,
      connected_at: new Date().toISOString(),
      followers_count: Math.floor(Math.random() * 2500) + 500,
      total_views: Math.floor(Math.random() * 25000) + 4000
    };

    const saved = await dbUpsertBandSocialAccount(accountPayload, userBandId);
    res.json({ success: true, account: saved, message: `¡Cuenta de ${plataforma} vinculada con éxito!` });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error vinculando cuenta social:", err);
    responderError(res, err);
  }
});

// DELETE Desconectar cuenta social
router.delete("/social/accounts/:id", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  const { id } = req.params;
  try {
    await dbDeleteBandSocialAccount(id, userBandId);
    res.json({ success: true, message: "Cuenta desconectada con éxito." });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error desconectando cuenta social:", err);
    responderError(res, err);
  }
});

// POST Publicar post inmediatamente (1-Clic)
router.post("/social/publish-now/:id", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  const { id } = req.params;

  try {
    const result = await publishSocialPostNow(id, userBandId);
    if (result.platform === "unknown") return res.status(404).json({ success: false, error: result.error });
    // 'asistido' y 'fallido' son resultados de negocio, no errores de la petición: el cliente
    // enseña el motivo (qué conectar, por qué no se autopublica) en vez de un "error de conexión".
    if (!result.success) return res.json({ success: false, modo: result.modo, error: result.error });
    res.json({ success: true, result, publishedUrl: result.publishedUrl, message: `Publicado en ${result.platform}.` });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error en publish-now:", err);
    responderError(res, err);
  }
});

// POST Ejecutar chequeo de publicaciones programadas (Trigger manual o Cron)
router.post("/social/run-scheduled-publisher", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  try {
    const report = await publishDueScheduledPosts(userBandId);
    res.json({ success: true, report });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error ejecutando scheduled publisher:", err);
    responderError(res, err);
  }
});

// Sync all social posts with Supabase
router.post("/posts/sync", requireAuth, async (req, res) => {
  const userBandId = getTargetBandId(req);
  try {
    const posts: SocialPost[] = await dbGetSocialPosts(userBandId);
    const state = loadState();
    state.posts = posts;
    saveState(state);
    
    res.json({
      success: true,
      message: `¡Se han sincronizado correctamente ${posts.length} publicaciones de redes sociales con Supabase!`,
      posts
    });
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in /api/posts/sync:", error);
    responderError(res, error, "Error al sincronizar con Supabase.");
  }
});

// Trigger direct external publishing webhook (Make.com, Zapier, Ayrshare, or Python agent)
router.post("/posts/trigger-webhook", requireAuth, async (req, res) => {
  const { post } = req.body;
  // SEGURIDAD: la URL del webhook SOLO sale de la configuración del servidor. Antes se aceptaba
  // la del cuerpo y el servidor hacía un POST a donde pidiera cualquier usuario (red interna,
  // metadatos de la nube...) y le devolvía la respuesta: un SSRF con eco.
  const targetWebhook = process.env.PUBLISH_WEBHOOK_URL;

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
      return res.status(400).json({
        success: false,
        error: `El webhook respondió con error ${response.status}.`
      });
    }
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error triggering publish webhook:", err);
    return responderError(res, err, "Error al conectar con el webhook de publicación.");
  }
});

export default router;
