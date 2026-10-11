/**
 * Sesión activa: quién soy, cambio de banda (solo a bandas de las que eres miembro) y cierre de sesión.
 */
import express from 'express';
import { ACTIVE_SESSIONS } from '../../auth.js';
import { loadState, saveState } from '../../state.js';
import { dbGetUsers, dbUpsertUser, dbGetRegisteredBands, normalizePlan } from '../../db.js';
import { buildAvailableBandsForUser } from './bandasDisponibles.js';

const router = express.Router();

// Verify current session
router.get('/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-auth-token'] as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bandmanager_token=([^;]+)/);
    if (match) token = match[1];
  }

  const state = loadState();

  // Refresh registered bands and users from Supabase if possible so plans are real-time
  try {
    const [freshRegBands, freshUsers] = await Promise.all([
      dbGetRegisteredBands(),
      dbGetUsers(),
    ]);
    if (Array.isArray(freshRegBands) && freshRegBands.length > 0) {
      state.registeredBands = freshRegBands;
    }
    if (Array.isArray(freshUsers) && freshUsers.length > 0) {
      freshUsers.forEach((su: any) => {
        const idx = state.users.findIndex(
          (u: any) =>
            u.id === su.id ||
            (u.username &&
              u.username.toLowerCase() === su.username?.toLowerCase())
        );
        if (idx !== -1) {
          if (su.plan) state.users[idx].plan = normalizePlan(su.plan);
          if (su.role) state.users[idx].role = su.role;
          if (su.band_id) state.users[idx].band_id = su.band_id;
          if (su.bandName) state.users[idx].bandName = su.bandName;
          if (su.main_band_id) state.users[idx].main_band_id = su.main_band_id;
        } else {
          state.users.push(su);
        }
      });
    }
  } catch (e) {
    // Non-blocking fallback to state.registeredBands
  }

  const session =
    (token && ACTIVE_SESSIONS[token]) ||
    (token && state.sessions && state.sessions[token]);
  const user = session
    ? state.users.find((u: any) => u.id === session.userId)
    : null;

  if (!user) {
    return res.status(401).json({ error: 'Sesión no iniciada o expirada' });
  }

  if (token && session) {
    session.createdAt = Date.now();
    ACTIVE_SESSIONS[token] = session;
    if (state.sessions && state.sessions[token]) {
      state.sessions[token].createdAt = Date.now();
      saveState(state);
    }
  }

  // Set/Refresh 30-day session cookie
  if (token) {
    res.cookie('bandmanager_token', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
      // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  // Sync active band plan
  if (user.band_id && state.registeredBands) {
    const cleanCurrent = user.band_id
      .replace(/^(band|reg)-/, '')
      .toLowerCase()
      .trim();
    const regBand = state.registeredBands.find((b: any) => {
      const bBid = (b.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bId = (b.id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bName = (b.nombre_banda || b.bandName || b.name || '')
        .toLowerCase()
        .trim();
      return (
        b.band_id === user.band_id ||
        b.id === user.band_id ||
        bBid === cleanCurrent ||
        bId === cleanCurrent ||
        (cleanCurrent.length > 1 && bName === cleanCurrent)
      );
    });
    if (regBand) {
      user.plan = normalizePlan(regBand.plan || 'promo');
    }
  }

  // Recalculate availableBands
  const availableBands = await buildAvailableBandsForUser(state, user);

  const { passwordHash, salt, ...safeUser } = user;
  res.json({
    token,
    user: safeUser,
    availableBands,
    multipleBands: availableBands.length > 1,
  });
});

// Switch Active Band
router.post('/auth/switch-band', async (req, res) => {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-auth-token'] as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bandmanager_token=([^;]+)/);
    if (match) token = match[1];
  }

  const state = loadState();

  // Refresh registered bands from Supabase if possible
  try {
    const freshRegBands = await dbGetRegisteredBands();
    if (Array.isArray(freshRegBands) && freshRegBands.length > 0) {
      state.registeredBands = freshRegBands;
    }
  } catch (e) {
    // Non-blocking
  }

  let session =
    (token && ACTIVE_SESSIONS[token]) ||
    (token && state.sessions && state.sessions[token]);
  const currentUser = session
    ? state.users.find((u: any) => u.id === session.userId)
    : null;

  if (!currentUser) {
    return res.status(401).json({ error: 'Sesión no válida o expirada' });
  }

  const { band_id } = req.body;
  if (!band_id) {
    return res.status(400).json({ error: 'band_id es requerido' });
  }

  const userEmail =
    currentUser.email?.toLowerCase() || currentUser.username.toLowerCase();
  const cleanTargetBand = band_id.replace(/^(band|reg)-/, '');

  // Check if they have access to this band (either via userBands, registeredBands or legacy duplicates)
  if (!state.userBands) state.userBands = [];
  const hasAccessInUserBands = state.userBands.some(
    (ub: any) =>
      (ub.user_id === currentUser!.id ||
        (userEmail && ub.email?.toLowerCase() === userEmail)) &&
      ub.band_id &&
      ub.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand
  );

  const hasAccessInRegisteredBands = (state.registeredBands || []).some(
    (b: any) =>
      (b.user_id === currentUser!.id || b.email?.toLowerCase() === userEmail) &&
      ((b.band_id &&
        b.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand) ||
        (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetBand))
  );

  const legacyTargetUser = state.users.find(
    (u: any) =>
      u.band_id &&
      u.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand &&
      ((u.email && u.email.toLowerCase() === userEmail) ||
        u.username.toLowerCase() === userEmail)
  );

  const isGlobalAdmin = currentUser.role === 'admin';

  // Ninguna banda es una excepción legítima aquí: cualquier cuenta autenticada podía
  // cambiarse a una banda sin tener vínculo real vía userBands,
  // registeredBands ni legacyTargetUser, con acceso de lectura/escritura completo a partir de
  // ahí — y el band_id que quedaba asignado era el crudo del body, sin normalizar al prefijo
  // canónico (ver bandInfo más abajo). Solo el admin global salta el chequeo de pertenencia,
  // igual que con cualquier otra banda.
  if (
    !hasAccessInUserBands &&
    !hasAccessInRegisteredBands &&
    !legacyTargetUser &&
    !isGlobalAdmin
  ) {
    return res.status(404).json({ error: 'No tienes acceso a esta banda' });
  }

  let targetUser = currentUser;
  if (legacyTargetUser && !isGlobalAdmin) {
    targetUser = legacyTargetUser;
  }

  const cleanCheck = cleanTargetBand.toLowerCase().trim();
  const bandInfo =
    (state.registeredBands || []).find((b: any) => {
      const bBid = (b.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bId = (b.id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bName = (b.nombre_banda || b.bandName || b.name || '')
        .toLowerCase()
        .trim();
      return (
        b.band_id === band_id ||
        b.id === band_id ||
        bBid === cleanCheck ||
        bId === cleanCheck ||
        (cleanCheck.length > 1 && bName === cleanCheck)
      );
    }) ||
    (state.bands || []).find((b: any) => {
      const bBid = (b.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bId = (b.id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bName = (b.nombre_banda || b.bandName || b.name || '')
        .toLowerCase()
        .trim();
      return (
        b.band_id === band_id ||
        b.id === band_id ||
        bBid === cleanCheck ||
        bId === cleanCheck ||
        (cleanCheck.length > 1 && bName === cleanCheck)
      );
    });

  const resolvedName = bandInfo
    ? bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name
    : targetUser.bandName || 'Banda';
  const resolvedPlan = normalizePlan(
    bandInfo?.plan || targetUser.plan || 'ensayo'
  );
  // El id CANÓNICO del registro encontrado (bandInfo.band_id), no el crudo del body: si alguien
  // manda "mi-banda" sin prefijo pero el registro real es "band-mi-banda", guardar el crudo
  // creaba un band_id gemelo sin datos la próxima vez que algo hiciera ensureRegisteredBandExists
  // con ese id suelto. Solo cae al crudo si no hay bandInfo (caso legacy sin registro).
  const canonicalBandId = bandInfo?.band_id || band_id;

  targetUser.band_id = canonicalBandId;
  targetUser.bandName = resolvedName;
  targetUser.plan = isGlobalAdmin ? 'cabeza_de_cartel' : resolvedPlan;
  if (isGlobalAdmin) {
    targetUser.role = 'admin';
  }

  // Sync band_id and plan on all user records matching email
  if (state.users) {
    state.users.forEach((u: any) => {
      if (
        u.id === targetUser.id ||
        (userEmail &&
          (u.email?.toLowerCase() === userEmail ||
            u.username?.toLowerCase() === userEmail))
      ) {
        u.band_id = canonicalBandId;
        u.bandName = resolvedName;
        u.plan = isGlobalAdmin ? 'cabeza_de_cartel' : resolvedPlan;
        if (isGlobalAdmin) u.role = 'admin';
      }
    });
  }

  // Update session
  const effectiveToken = token || `session-${Date.now()}`;
  session = { userId: targetUser.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[effectiveToken] = session;
  if (!state.sessions) state.sessions = {};
  state.sessions[effectiveToken] = session;
  saveState(state);
  // Sin esto, el cambio de banda solo vivía en el data.json local (efímero, no compartido entre
  // instancias/redeploys de Railway): cualquier ruta que releyera al usuario desde Supabase después
  // (login, /auth/me sirviendo desde otra instancia, etc.) devolvía band_id sin actualizar, y la
  // app "volvía sola" a la banda anterior aunque el switch hubiera funcionado un momento antes.
  try {
    await dbUpsertUser(targetUser);
  } catch (err) {
    console.warn('Could not sync switched band to Supabase:', err);
  }

  res.cookie('bandmanager_token', effectiveToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Recalculate availableBands dynamically using userBands
  const availableBands = await buildAvailableBandsForUser(state, targetUser);

  const { passwordHash, salt, ...safeUser } = targetUser;
  res.json({ token: effectiveToken, user: safeUser, availableBands });
});

// Logout
router.post('/auth/logout', (req, res) => {
  const { token } = req.body;
  if (token) {
    delete ACTIVE_SESSIONS[token];
    const state = loadState();
    if (state.sessions && state.sessions[token]) {
      delete state.sessions[token];
      saveState(state);
    }
  }
  res.clearCookie('bandmanager_token', { path: '/' });
  res.json({ success: true });
});

export default router;
