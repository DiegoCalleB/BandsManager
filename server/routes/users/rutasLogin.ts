/**
 * Inicio de sesión con usuario o email y contraseña.
 */
import express from 'express';
import crypto from 'crypto';
import { ACTIVE_SESSIONS, verifyPassword } from '../../auth.js';
import { loadState, saveState } from '../../state.js';
import { dbGetUsers, normalizePlan } from '../../db.js';
import { loginRateLimiter } from '../../middleware/rateLimiter.js';
import { cleanBandId, buildAvailableBandsForUser } from './bandasDisponibles.js';

const router = express.Router();

// Login
router.post('/auth/login', loginRateLimiter, async (req, res) => {
  const { username, password, band_id } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'Usuario y contraseña son requeridos' });
  }

  const state = loadState();
  const cleanInput = username.trim().toLowerCase();

  // Sync users from Supabase to support persistent logins across serverless restarts
  try {
    const dbUsers = await dbGetUsers();
    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((su: any) => {
        const idx = state.users.findIndex(
          (u) =>
            u.id === su.id ||
            (u.username &&
              u.username.toLowerCase() === su.username?.toLowerCase())
        );
        if (idx !== -1) {
          if (su.passwordHash) state.users[idx].passwordHash = su.passwordHash;
          if (su.salt) state.users[idx].salt = su.salt;
          if (su.plan) state.users[idx].plan = normalizePlan(su.plan);
          if (su.role) state.users[idx].role = su.role;
          if (su.band_id) state.users[idx].band_id = su.band_id;
          if (su.bandName) state.users[idx].bandName = su.bandName;
          if (su.main_band_id) state.users[idx].main_band_id = su.main_band_id;
          // Las preferencias de interfaz (disposición del dashboard...) viven también en Supabase:
          // tras un redeploy el estado local arranca vacío y, sin esto, /auth/me devolvía el
          // usuario sin ellas y el panel volvía al de por defecto. Lo local manda por clave.
          if (su.ui_preferences && Object.keys(su.ui_preferences).length > 0) {
            state.users[idx].ui_preferences = {
              ...su.ui_preferences,
              ...(state.users[idx].ui_preferences || {}),
            };
          }
        } else {
          state.users.push(su);
        }
      });
      saveState(state);
    }
  } catch {
    // Continue with memory state if database call fails
  }

  // Find all user records matching this username or email
  const matchingUsers = state.users.filter(
    (u) =>
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (u.email && u.email.toLowerCase() === cleanInput) ||
      (u.secondary_email && u.secondary_email.toLowerCase() === cleanInput)
  );

  if (matchingUsers.length === 0) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // Filter those that pass password check
  const validUsers = matchingUsers.filter((u) => {
    return verifyPassword(password, u.passwordHash, u.salt);
  });

  if (validUsers.length === 0) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // Choose target user profile & default to main or favorite band.
  const userMainBand =
    validUsers.find((u) => u.main_band_id)?.main_band_id ||
    validUsers[0]?.main_band_id ||
    (Array.isArray(validUsers[0]?.band_order) &&
    validUsers[0].band_order.length > 0
      ? validUsers[0].band_order[0]
      : null) ||
    validUsers[0]?.band_id;

  // SEGURIDAD: `band_id` viene del cuerpo. Solo se respeta si es una banda DE ESE USUARIO; antes
  // cualquiera con una cuenta propia podía iniciar sesión «dentro» de la banda de otro (y como su
  // líder) mandando su band_id en el login.
  const bandasDelUsuario = new Set<string>();
  const anotarBanda = (id?: string) => {
    if (id) bandasDelUsuario.add(cleanBandId(id));
  };
  validUsers.forEach((u) => {
    anotarBanda(u.band_id);
    anotarBanda(u.main_band_id);
    (Array.isArray(u.band_order) ? u.band_order : []).forEach(anotarBanda);
  });
  (state.userBands || []).forEach((ub) => {
    if (validUsers.some((u) => u.id === ub.user_id)) anotarBanda(ub.band_id);
  });
  const esAdminGlobal = validUsers.some((u) => u.role === 'admin');
  const puedeElegirBanda = (id?: string) =>
    !!id && (esAdminGlobal || bandasDelUsuario.has(cleanBandId(id)));
  if (band_id && !puedeElegirBanda(band_id)) {
    console.warn('[auth/login] band_id ajeno ignorado en el login.');
  }

  const preferredBandId = band_id && puedeElegirBanda(band_id) ? band_id : userMainBand;
  const preferredClean = preferredBandId
    ? cleanBandId(preferredBandId)
    : undefined;

  const foundMatching = validUsers.find(
    (u) =>
      u.band_id === preferredBandId ||
      (preferredClean && cleanBandId(u.band_id) === preferredClean)
  );
  const selectedUser = foundMatching || validUsers[0];

  // Ensure active band on login is the preferred / favorite band
  if (preferredBandId) {
    selectedUser.band_id =
      preferredBandId.startsWith('band-') || preferredBandId.startsWith('reg-')
        ? preferredBandId
        : `band-${preferredBandId}`;
    if (!selectedUser.main_band_id) {
      selectedUser.main_band_id = selectedUser.band_id;
    }
  }

  // Look up band info for name and plan
  const cleanPref = cleanBandId(selectedUser.band_id);
  const bandInfo =
    (state.registeredBands || []).find(
      (b) =>
        b.band_id === selectedUser.band_id ||
        b.id === selectedUser.band_id ||
        cleanBandId(b.band_id) === cleanPref ||
        cleanBandId(b.id) === cleanPref
    );

  if (bandInfo) {
    selectedUser.bandName =
      bandInfo.nombre_banda ||
      bandInfo.bandName ||
      bandInfo.name ||
      selectedUser.bandName;
    selectedUser.plan = normalizePlan(bandInfo.plan || 'promo');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionObj = { userId: selectedUser.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;
  saveState(state);

  // Recalculate availableBands
  const availableBands = await buildAvailableBandsForUser(state, selectedUser);

  res.cookie('bandmanager_token', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  const { passwordHash, salt, ...safeUser } = selectedUser;
  res.json({
    token,
    user: safeUser,
    availableBands,
    multipleBands: availableBands.length > 1,
  });
});

export default router;
