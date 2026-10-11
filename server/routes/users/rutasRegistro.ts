/**
 * Alta de cuenta y banda nueva, y listado de bandas registradas.
 */
import express from 'express';
import crypto from 'crypto';
import { ACTIVE_SESSIONS, verifyPassword, hashPassword } from '../../auth.js';
import { loadState, saveState, requireAuth, ensureValidUserEmails } from '../../state.js';
import { dbGetUsers, dbUpsertUser, dbUpsertUserBand, dbGetRegisteredBands, dbUpsertRegisteredBand } from '../../db.js';
import { sendWelcomeEmail } from '../../services/transactionalEmail.js';
import { registroRateLimiter } from '../../middleware/rateLimiter.js';
import { generateUniqueSlugId, slugify } from '../../utils/slug.js';
import { cleanBandId, buildAvailableBandsForUser } from './bandasDisponibles.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

const router = express.Router();

// Register new band & user
router.post('/auth/register', registroRateLimiter, async (req, res) => {
  const { bandName, email, password, leaderName } = req.body;

  if (!bandName || !email || !password) {
    return res
      .status(400)
      .json({ error: 'Nombre de banda, email y contraseña son requeridos' });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();
  const rawBandName = bandName.trim();

  // Sync users from Supabase to ensure fresh state across restarts
  try {
    const dbUsers = await dbGetUsers();
    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((su: any) => {
        const idx = state.users.findIndex(
          (u) =>
            u.id === su.id ||
            (u.username &&
              u.username.toLowerCase().trim() ===
                su.username?.toLowerCase().trim()) ||
            (u.email &&
              u.email.toLowerCase().trim() === su.email?.toLowerCase().trim())
        );
        if (idx !== -1) {
          state.users[idx] = { ...state.users[idx], ...su };
        } else {
          state.users.push(su);
        }
      });
      ensureValidUserEmails(state);
    }
  } catch {
    // Non-blocking
  }
  ensureValidUserEmails(state);

  // Check if existing users exist for this email
  const existingUsersWithEmail = state.users.filter(
    (u) =>
      u.username.toLowerCase() === cleanEmail ||
      u.email?.toLowerCase() === cleanEmail
  );

  if (existingUsersWithEmail.length > 0) {
    // If user exists, check if password matches existing account
    const matchesAnyPassword = existingUsersWithEmail.some((u) =>
      verifyPassword(password, u.passwordHash, u.salt)
    );

    if (!matchesAnyPassword) {
      return res.status(400).json({
        error:
          'Este correo electrónico ya está registrado. Introduce la contraseña correcta de tu cuenta para añadir una nueva banda.',
      });
    }

    // Check if this exact band name is already registered for this user
    const alreadyRegisteredSameBand = existingUsersWithEmail.some(
      (u) =>
        (u.bandName || u.name || '').toLowerCase() === rawBandName.toLowerCase()
    );

    if (alreadyRegisteredSameBand) {
      return res.status(400).json({
        error: `Ya tienes una banda registrada con el nombre "${rawBandName}".`,
      });
    }
  }

  const isExistingUser = existingUsersWithEmail.length > 0;
  const selectedPlan = 'promo'; // Toda nueva banda se registra exclusivamente en plan promo

  // Gather existing IDs across state to prevent duplicate collisions
  const existingIds = new Set<string>();
  (state.users || []).forEach((u) => {
    if (u.id) existingIds.add(u.id);
    if (u.band_id) existingIds.add(u.band_id);
  });
  (state.registeredBands || []).forEach((b) => {
    if (b.id) existingIds.add(b.id);
    if (b.band_id) existingIds.add(b.band_id);
  });

  // Generate clean, personalized IDs
  const bandId = generateUniqueSlugId('band', rawBandName, existingIds);
  existingIds.add(bandId);

  const regId = generateUniqueSlugId('reg', rawBandName, existingIds);
  existingIds.add(regId);

  let userToUse: any;

  if (isExistingUser) {
    userToUse = existingUsersWithEmail[0];
    // Update active band to the newly created one
    userToUse.band_id = bandId;
    userToUse.bandName = rawBandName;
    if (!userToUse.main_band_id) {
      userToUse.main_band_id = bandId;
    }
    if (Array.isArray(userToUse.band_order)) {
      const cleanBId = cleanBandId(bandId);
      userToUse.band_order = [
        cleanBId,
        ...userToUse.band_order.filter(
          (b: string) => cleanBandId(b) !== cleanBId
        ),
      ];
    } else {
      userToUse.band_order = [cleanBandId(bandId)];
    }
  } else {
    const { hash, salt } = hashPassword(password);
    const emailUserPart = cleanEmail.split('@')[0] || rawBandName;
    const defaultName =
      emailUserPart.charAt(0).toUpperCase() + emailUserPart.slice(1);
    const userId = generateUniqueSlugId(
      'user',
      `${emailUserPart}-${slugify(rawBandName)}`,
      existingIds
    );
    existingIds.add(userId);

    userToUse = {
      id: userId,
      username: cleanEmail,
      name: leaderName ? leaderName.trim() : defaultName,
      bandName: rawBandName,
      email: cleanEmail,
      role: 'leader',
      plan: selectedPlan,
      instrument: `Líder de ${rawBandName}`,
      avatarColor: '#f2ca50',
      passwordHash: hash,
      salt: salt,
      band_id: bandId,
      main_band_id: bandId,
      band_order: [cleanBandId(bandId)],
      createdAt: new Date().toISOString(),
    };

    state.users.push(userToUse);
  }

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessionObj = { userId: userToUse.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  // Save band register data to Supabase in correct foreign key order
  try {
    const newRegisteredBandRecord = {
      id: regId,
      band_id: bandId,
      user_id: userToUse.id,
      fecha_registro: new Date().toISOString(),
      nombre_banda: rawBandName,
      email: cleanEmail,
      plan: selectedPlan,
      contacto_nombre: rawBandName,
      estilo_musical: 'Por definir',
      localizacion: 'España',
      telefono: '',
      instagram: '',
      spotify_youtube: '',
      aforo_promedio: 0,
      estado_cuenta: 'activo',
      notas: `Plan seleccionado: ${selectedPlan}. Registrado desde BANDMANAGER.io web app.`,
    };
    if (!state.registeredBands) state.registeredBands = [];
    state.registeredBands.push(newRegisteredBandRecord);

    if (!state.userBands) state.userBands = [];
    const hasUB = state.userBands.some(
      (ub) => ub.user_id === userToUse.id && ub.band_id === bandId
    );
    const newUB = hasUB
      ? state.userBands.find(
          (ub) => ub.user_id === userToUse.id && ub.band_id === bandId
        )
      : {
          id: `ub-${userToUse.id}-${bandId}`,
          user_id: userToUse.id,
          band_id: bandId,
          role: 'leader',
          createdAt: new Date().toISOString(),
        };
    if (!hasUB) {
      state.userBands.push(newUB);
    }

    saveState(state);

    // 1. Upsert registered band
    await dbUpsertRegisteredBand(newRegisteredBandRecord);
    // 2. Upsert user (ensures user exists in users table)
    await dbUpsertUser(userToUse);
    // 3. Upsert userBand relationship
    await dbUpsertUserBand(newUB);
  } catch (sheetErr) {
    console.warn(
      'Notice: Band registration saved locally, Supabase update skipped or pending:',
      sheetErr
    );
  }

  // Calculate availableBands dynamically
  const availableBands = await buildAvailableBandsForUser(state, userToUse);

  res.cookie('bandmanager_token', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Enviar email de bienvenida y confirmación de registro
  if (cleanEmail && cleanEmail.includes('@')) {
    try {
      console.log(
        `[Registro] Despachando email de bienvenida a ${cleanEmail} para la banda "${rawBandName}"...`
      );
      const emailResult = await sendWelcomeEmail(
        cleanEmail,
        userToUse.name,
        rawBandName
      );
      if (emailResult.success) {
        console.log(
          `[Registro] Email de bienvenida entregado con éxito a ${cleanEmail} (ID: ${emailResult.id})`
        );
      } else {
        console.warn(
          `[Registro] Aviso: No se pudo entregar el email de bienvenida a ${cleanEmail}: ${emailResult.error}`
        );
      }
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error(
        `[Registro] Error al enviar email de bienvenida a ${cleanEmail}:`,
        err?.message || err
      );
    }
  }

  const { passwordHash, salt: _, ...safeUser } = userToUse;
  res.status(201).json({
    token,
    user: safeUser,
    availableBands,
    multipleBands: availableBands.length > 1,
  });
});

// Endpoint to fetch all registered bands from Supabase
const handleGetRegisteredBands = async (req: any, res: any) => {
  try {
    const userBandId = req.user?.band_id;
    // Antes, cualquier miembro (no solo admins) de la banda insignia veía la lista completa de
    // TODAS las bandas registradas en la plataforma -de cualquier cliente-, no solo la suya.
    const isAdmin = req.user?.role === 'admin';

    const bands = await dbGetRegisteredBands();

    const filteredBands = isAdmin
      ? bands
      : bands.filter(
          (b: any) =>
            b.band_id === userBandId ||
            b.id === userBandId ||
            b.id === `reg-${userBandId.replace('band-', '')}` ||
            (req.user?.email &&
              b.email?.toLowerCase() === req.user.email.toLowerCase())
        );

    res.json({ registeredBands: filteredBands });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error('Error fetching registered bands:', err);
    res
      .status(500)
      .json({ error: 'No se pudieron obtener las bandas registradas.' });
  }
};

router.get('/registered-bands', requireAuth, handleGetRegisteredBands);
router.get('/users/registered-bands', requireAuth, handleGetRegisteredBands);

export default router;
