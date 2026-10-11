/**
 * Acceso con Google: el token se verifica criptográficamente contra el Client ID (AGENTS.md §1).
 */
import express from 'express';
import crypto from 'crypto';
import { ACTIVE_SESSIONS } from '../../auth.js';
import { loadState, saveState } from '../../state.js';
import { dbGetUsers, dbUpsertUser, dbUpsertUserBand, dbUpsertRegisteredBand, normalizePlan } from '../../db.js';
import { loginRateLimiter } from '../../middleware/rateLimiter.js';
import { verificarAccessTokenDeGoogle } from '../../utils/googleVerify.js';
import { generateUniqueSlugId } from '../../utils/slug.js';
import { cleanBandId, buildAvailableBandsForUser } from './bandasDisponibles.js';

const router = express.Router();

// Google Social OAuth Login / Registration
router.post('/auth/google', loginRateLimiter, async (req, res) => {
  const {
    email,
    name,
    uid: uidDelCliente,
    accessToken,
    bandName: inputBandName,
    leaderName,
  } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email de Google es requerido' });
  }

  // SEGURIDAD: el email y el uid del cuerpo no valen nada por sí solos (cualquiera puede escribir
  // el email de otra cuenta). Solo se acepta lo que Google confirma sobre el access token.
  let uid: string;
  let cleanEmail: string;
  try {
    const identidad = await verificarAccessTokenDeGoogle(accessToken, {
      emailDeclarado: email,
      subDeclarado: uidDelCliente,
    });
    uid = identidad.sub;
    cleanEmail = identidad.email;
  } catch (e: any) {
    console.warn('[auth/google] Verificación rechazada:', e?.message || e);
    return res.status(401).json({ error: 'No se pudo verificar tu cuenta de Google. Inténtalo de nuevo.' });
  }

  const state = loadState();

  // Sync users from Supabase
  try {
    const dbUsers = await dbGetUsers();
    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((su: any) => {
        const idx = state.users.findIndex(
          (u: any) =>
            u.id === su.id ||
            (u.email && u.email.toLowerCase() === su.email?.toLowerCase())
        );
        if (idx !== -1) {
          state.users[idx] = { ...state.users[idx], ...su };
        } else {
          state.users.push(su);
        }
      });
      saveState(state);
    }
  } catch {
    // Continue with state
  }

  // Find existing user by email or google uid
  let user = state.users.find(
    (u: any) =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.secondary_email && u.secondary_email.toLowerCase() === cleanEmail) ||
      (u.username && u.username.toLowerCase() === cleanEmail) ||
      (uid && u.googleUid === uid)
  );

  const customBandName =
    inputBandName?.trim() || (leaderName ? `Banda de ${leaderName}` : null);

  if (user) {
    // Update existing user with googleUid / authProvider if not set
    user.googleUid = uid || user.googleUid;
    user.authProvider = 'google';
    if (name && (!user.name || user.name === user.username)) {
      user.name = name;
    }

    // If a new band name was explicitly requested during registration with existing email
    if (customBandName) {
      const existingIds = new Set<string>();
      (state.users || []).forEach((u: any) => {
        if (u.id) existingIds.add(u.id);
        if (u.band_id) existingIds.add(u.band_id);
      });
      (state.registeredBands || []).forEach((b: any) => {
        if (b.id) existingIds.add(b.id);
        if (b.band_id) existingIds.add(b.band_id);
      });

      const bandId = generateUniqueSlugId('band', customBandName, existingIds);

      const regBand = {
        id: `reg-${bandId.replace('band-', '')}`,
        band_id: bandId,
        nombre_banda: customBandName,
        contacto_nombre: user.name || leaderName || cleanEmail.split('@')[0],
        email: cleanEmail,
        plan: 'promo',
        fecha_registro: new Date().toISOString(),
        estado_cuenta: 'activo',
        notas: 'Registrado con Google OAuth (Nueva Banda)',
      };
      if (!state.registeredBands) state.registeredBands = [];
      state.registeredBands.push(regBand);

      user.bandName = customBandName;
      user.band_id = bandId;
      user.role = 'leader';

      if (!state.userBands) state.userBands = [];
      const newUB = {
        id: `ub-${user.id}-${bandId}`,
        user_id: user.id,
        band_id: bandId,
        role: 'leader',
      };
      state.userBands.push(newUB);

      try {
        await dbUpsertUserBand(newUB);
        await dbUpsertRegisteredBand(regBand);
        await dbUpsertUser(user);
      } catch (e) {
        console.warn('Notice: Supabase sync warning:', e);
      }
    } else {
      // Regular Google Login: default to main or favorite band. Antes, sin ninguna banda propia
      // todavía, se caía en una banda por defecto en silencio.
      const preferredBandId =
        user.main_band_id ||
        (Array.isArray(user.band_order) && user.band_order.length > 0
          ? user.band_order[0]
          : null) ||
        user.band_id;

      const normalizedBandId = preferredBandId
        ? preferredBandId.startsWith('band-') ||
          preferredBandId.startsWith('reg-')
          ? preferredBandId
          : `band-${preferredBandId}`
        : undefined;
      user.band_id = normalizedBandId;
      if (!user.main_band_id) {
        user.main_band_id = normalizedBandId;
      }

      const cleanPref = normalizedBandId
        ? cleanBandId(normalizedBandId)
        : undefined;
      const bandInfo = !cleanPref
        ? undefined
        : (state.registeredBands || []).find(
            (b: any) =>
              b.band_id === user.band_id ||
              b.id === user.band_id ||
              cleanBandId(b.band_id) === cleanPref ||
              cleanBandId(b.id) === cleanPref
          ) ||
          (state.bands || []).find(
            (b: any) =>
              b.band_id === user.band_id ||
              b.id === user.band_id ||
              cleanBandId(b.band_id) === cleanPref ||
              cleanBandId(b.id) === cleanPref
          );

      if (bandInfo) {
        user.bandName =
          bandInfo.nombre_banda ||
          bandInfo.bandName ||
          bandInfo.name ||
          user.bandName;
        if (bandInfo.plan) {
          user.plan = normalizePlan(bandInfo.plan);
        }
      }
    }
  } else {
    // Auto-register new user authenticated with Google OAuth
    const newUserId = uid || `user-google-${Date.now()}`;
    const cleanName =
      leaderName || name || cleanEmail.split('@')[0] || 'Miembro Banda';
    const finalBandName = customBandName || `Banda de ${cleanName}`;

    // Gather existing IDs across state to prevent collisions
    const existingIds = new Set<string>();
    (state.users || []).forEach((u: any) => {
      if (u.id) existingIds.add(u.id);
      if (u.band_id) existingIds.add(u.band_id);
    });
    (state.registeredBands || []).forEach((b: any) => {
      if (b.id) existingIds.add(b.id);
      if (b.band_id) existingIds.add(b.band_id);
    });

    const bandId = generateUniqueSlugId('band', finalBandName, existingIds);
    existingIds.add(bandId);

    // Register new band
    const regBand = {
      id: `reg-${bandId.replace('band-', '')}`,
      band_id: bandId,
      nombre_banda: finalBandName,
      contacto_nombre: cleanName,
      email: cleanEmail,
      plan: 'promo',
      fecha_registro: new Date().toISOString(),
      estado_cuenta: 'activo',
      notas: 'Registrado con Google OAuth',
    };
    if (!state.registeredBands) state.registeredBands = [];
    state.registeredBands.push(regBand);

    user = {
      id: newUserId,
      username: cleanEmail,
      email: cleanEmail,
      name: cleanName,
      bandName: finalBandName,
      band_id: bandId,
      main_band_id: bandId,
      band_order: [cleanBandId(bandId)],
      role: 'leader',
      plan: 'promo',
      createdAt: new Date().toISOString(),
      googleUid: uid,
      authProvider: 'google',
    };

    if (!state.users) state.users = [];
    state.users.push(user);

    // Sync user-band relationship
    if (!state.userBands) state.userBands = [];
    const newUB = {
      id: `ub-${user.id}-${bandId}`,
      user_id: user.id,
      band_id: bandId,
      role: 'leader',
    };
    state.userBands.push(newUB);

    try {
      await dbUpsertUserBand(newUB);
      await dbUpsertRegisteredBand(regBand);
      await dbUpsertUser(user);
    } catch (err) {
      console.warn('Could not sync new Google user and band to Supabase:', err);
    }
  }

  if (accessToken) {
    user.googleAccessToken = accessToken;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionObj = {
    userId: user.id,
    googleAccessToken: accessToken,
    createdAt: Date.now(),
  };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  const availableBands = await buildAvailableBandsForUser(state, user);
  const { passwordHash: _, salt: __, ...safeUser } = user;

  res.cookie('bandmanager_token', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  res.json({ token, user: safeUser, availableBands });
});

export default router;
