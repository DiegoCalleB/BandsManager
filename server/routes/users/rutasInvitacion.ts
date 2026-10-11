/**
 * Invitaciones de miembros: comprobar un enlace de invitación y activar la cuenta invitada.
 */
import express from 'express';
import { invitacionPendiente, limpiarInvitacion, tokenInvitacionValido } from '../../utils/invitacion.js';
import crypto from 'crypto';
import { ACTIVE_SESSIONS, hashPassword } from '../../auth.js';
import { loadState, saveState } from '../../state.js';
import { dbUpsertUser } from '../../db.js';
import { loginRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Check invitation for activating added members
// loginRateLimiter: es una ruta abierta que responde por email, o sea un comprobador de si un
// correo está registrado. Con el límite, al menos no se puede repasar una lista entera.
router.post('/auth/check-invitation', loginRateLimiter, async (req, res) => {
  const { email, token } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ error: 'El correo electrónico es requerido.' });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();

  const user = state.users.find(
    (u) =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      u.username.toLowerCase() === cleanEmail
  );

  // Solo se contesta por invitaciones sin estrenar. Antes contestaba por cualquier usuario
  // registrado y devolvía su nombre, su usuario y las bandas a las que pertenece, que es más de
  // lo que hace falta para activar una cuenta y bastante de lo que hace falta para suplantarla.
  // Además del correo hace falta el token que solo viaja en el enlace de la invitación: saber el
  // correo de alguien ya no basta para activar (ni para ver) su cuenta.
  if (!user || !invitacionPendiente(user) || !tokenInvitacionValido(user, token)) {
    return res.status(404).json({
      error:
        'No se ha encontrado ninguna invitación válida para este correo. Usa el enlace de tu correo de invitación, o pide al director de tu banda que te la reenvíe desde el apartado de Miembros.',
    });
  }

  // Find all bands this user belongs to
  if (!state.userBands) state.userBands = [];
  const userBandsList = state.userBands.filter(
    (ub) => ub.user_id === user.id
  );

  const bands = userBandsList.map((ub) => {
    const bandInfo = (state.registeredBands || []).find(
      (b) => b.band_id === ub.band_id
    );
    return {
      band_id: ub.band_id,
      bandName: bandInfo?.nombre_banda || user.bandName || 'Tu banda',
      role: ub.role || 'member',
    };
  });

  res.json({
    success: true,
    name: user.name,
    username: user.username,
    email: user.email || cleanEmail,
    bands,
  });
});

// Activate added member (set password & username)
router.post('/auth/activate-member', loginRateLimiter, async (req, res) => {
  const { email, username, name, password, token: tokenInvitacion } = req.body;

  if (!email || !username || !name || !password) {
    return res.status(400).json({
      error: 'Todos los campos son requeridos para activar tu cuenta.',
    });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  const user = state.users.find(
    (u) =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      u.username.toLowerCase() === cleanEmail
  );

  if (!user) {
    return res
      .status(404)
      .json({ error: 'Usuario no encontrado para activación.' });
  }

  // Solo se activa lo que está sin activar. Esta ruta sobrescribe la contraseña de la cuenta y
  // devuelve una sesión abierta, y no comprobaba nada más que el email: bastaba con saber el de
  // cualquiera (el del director de la banda, por ejemplo) para quedarse con su cuenta.
  if (!invitacionPendiente(user)) {
    return res.status(409).json({
      error:
        'Esta cuenta ya está activada. Si has olvidado tu contraseña, usa la opción de recuperarla en la pantalla de acceso.',
    });
  }
  // El token del enlace de invitación es lo que prueba que quien activa es la persona invitada.
  if (!tokenInvitacionValido(user, tokenInvitacion)) {
    return res.status(403).json({
      error:
        'El enlace de invitación no es válido o ha caducado. Pide al director de tu banda que te la reenvíe.',
    });
  }

  // Check if chosen username is already taken by a different user
  const usernameTaken = state.users.some(
    (u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername
  );

  if (usernameTaken) {
    return res.status(400).json({
      error: 'El nombre de usuario ya está registrado por otra persona.',
    });
  }

  // Hash new password
  const { hash, salt } = hashPassword(password);

  user.name = name.trim();
  user.username = cleanUsername;
  user.email = cleanEmail;
  user.passwordHash = hash;
  user.salt = salt;
  limpiarInvitacion(user);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessionObj = { userId: user.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  // Sync to Supabase asynchronously
  try {
    await dbUpsertUser(user);
  } catch (err) {
    console.warn(
      'Notice: Activated user updated locally, Supabase sync pending:',
      err
    );
  }

  // Compute available bands
  if (!state.userBands) state.userBands = [];
  const userBandsList = state.userBands.filter(
    (ub) => ub.user_id === user.id
  );
  const availableBands = userBandsList.map((ub) => {
    const bandInfo = (state.registeredBands || []).find(
      (b) => b.band_id === ub.band_id
    );
    return {
      band_id: ub.band_id,
      bandName: bandInfo?.nombre_banda || 'Banda',
      role: ub.role || 'member',
      userId: user.id,
    };
  });

  res.cookie('bandmanager_token', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  const { passwordHash: _, salt: __, ...safeUser } = user;
  res.json({ token, user: safeUser, availableBands });
});

export default router;
