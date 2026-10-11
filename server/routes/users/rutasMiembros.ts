import type { UsuarioGuardado } from '../../stateTypes.js';
/**
 * Miembros de la banda: asociar una cuenta existente, listar y dar de alta (solo líder).
 */
import express from 'express';
import { asignarInvitacion, invitacionPendiente } from '../../utils/invitacion.js';
import { hashPassword, getSafeUsers } from '../../auth.js';
import { loadState, saveState, requireAuth, requireLeader } from '../../state.js';
import { dbGetUsers, dbUpsertUser, dbUpsertUserBand } from '../../db.js';
import { sendMemberInvitationEmail } from '../../services/transactionalEmail.js';
import { getTargetBandId, puedeEscribirEnBanda, bandaSolicitada } from '../../utils/bandAccess.js';
import { generateUniqueSlugId } from '../../utils/slug.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

const router = express.Router();

// Associate an existing user to the leader's band using exact email match
router.post(
  '/users/associate',
  requireAuth,
  requireLeader,
  async (req, res) => {
    try {
      const { email, role, instrument } = req.body;

      if (!email) {
        return res
          .status(400)
          .json({ error: 'El email del músico es requerido' });
      }

      const targetBandId = req.user?.band_id;
      if (!targetBandId) {
        return res.status(401).json({
          error: 'Acceso no autorizado. Inicie sesión para continuar.',
        });
      }
      const state = loadState();
      const cleanSearch = email.trim().toLowerCase();

      const targetUser = state.users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanSearch) ||
          (u.username && u.username.toLowerCase() === cleanSearch)
      );

      if (!targetUser) {
        return res.status(404).json({
          error: 'No existe ningún usuario registrado con este email.',
        });
      }

      if (!state.userBands) state.userBands = [];
      const relationExists = state.userBands.some(
        (ub) => ub.user_id === targetUser.id && ub.band_id === targetBandId
      );

      if (relationExists) {
        return res
          .status(400)
          .json({ error: 'Este músico ya es miembro de tu banda.' });
      }

      // Add the relationship
      const newUB = {
        id: `ub-${targetUser.id}-${targetBandId}`,
        user_id: targetUser.id,
        band_id: targetBandId,
        role: role === 'leader' ? 'leader' : 'member',
        createdAt: new Date().toISOString(),
      };
      state.userBands.push(newUB);
      try {
        await dbUpsertUserBand(newUB);
      } catch (e) {
        console.warn('Failed to append userBand to Supabase', e);
      }

      if (instrument) {
        targetUser.instrument = instrument.trim();
      }

      saveState(state);

      try {
        await dbUpsertUser(targetUser);
      } catch (err) {
        console.warn('Notice: Sync pending:', err);
      }

      const { passwordHash, salt, ...safeUser } = targetUser;
      res.status(201).json(safeUser);
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error in /users/associate:', err);
      res.status(500).json({
        error: err?.message || 'Error al asociar el músico a la banda',
      });
    }
  }
);

// Get all band users (without password hashes)
router.get('/users', requireAuth, async (req, res) => {
  const bandId = req.user?.band_id;
  if (!bandId) {
    return res
      .status(401)
      .json({ error: 'Acceso no autorizado. Inicie sesión para continuar.' });
  }
  const state = loadState();

  if (!state.userBands) state.userBands = [];
  const bandUserIds = new Set(
    state.userBands
      .filter((ub) => ub.band_id === bandId)
      .map((ub) => ub.user_id)
  );

  const bandUsers = state.users
    .filter((u) => bandUserIds.has(u.id))
    .map((u) => {
      const ub = state.userBands.find(
        (ub) => ub.user_id === u.id && ub.band_id === bandId
      );
      return { ...u, role: ub?.role || 'member' };
    });

  try {
    const dbUsers = await dbGetUsers(bandId);
    if (dbUsers && dbUsers.length > 0) {
      const mergedUsers = dbUsers.map((u: any) => {
        const ub = state.userBands.find(
          (ub) => ub.user_id === u.id && ub.band_id === bandId
        );
        return { ...u, role: ub?.role || 'member' };
      });
      return res.json(getSafeUsers(mergedUsers));
    }
    res.json(getSafeUsers(bandUsers));
  } catch {
    res.json(getSafeUsers(bandUsers));
  }
});

// Create new user (Leader operation)
router.post('/users', requireAuth, requireLeader, async (req, res) => {
  const { username, name, password, role, instrument, avatarColor, email } =
    req.body;

  if (!username || !name || !password) {
    return res.status(400).json({
      error: 'Nombre de usuario, nombre real y contraseña son requeridos',
    });
  }

  const state = loadState();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email ? email.trim().toLowerCase() : cleanUsername;
  // Dar de alta a alguien en la banda de otro no es un despiste que se pueda arreglar por
  // dentro: el band_id venía del body sin validar.
  const solicitada = bandaSolicitada(req);
  if (solicitada && !puedeEscribirEnBanda(req, solicitada)) {
    return res.status(403).json({ error: 'No tienes acceso a esta banda.' });
  }
  const targetBandId = getTargetBandId(req);

  // Check if a user with this email or username already exists
  const existingUser = state.users.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername ||
      (u.email && u.email.toLowerCase() === cleanEmail)
  );

  if (existingUser) {
    if (!state.userBands) state.userBands = [];
    const relationExists = state.userBands.some(
      (ub) => ub.user_id === existingUser.id && ub.band_id === targetBandId
    );

    if (relationExists) {
      // Invitación aún sin estrenar (o perdida): se genera un token nuevo y se reenvía el correo,
      // que invalida el anterior.
      if (invitacionPendiente(existingUser) && existingUser.email?.includes('@')) {
        const tokenNuevo = asignarInvitacion(existingUser);
        saveState(state);
        try {
          await dbUpsertUser(existingUser);
        } catch (e) {
          console.warn('No se pudo persistir la invitación reenviada:', e);
        }
        const bandInfo = (state.registeredBands || []).find(
          (b) => b.band_id === targetBandId || b.id === targetBandId
        );
        sendMemberInvitationEmail({
          toEmail: existingUser.email,
          memberName: existingUser.name,
          bandName: bandInfo?.nombre_banda || 'tu banda',
          instrument: existingUser.instrument,
          username: existingUser.username,
          activationToken: tokenNuevo,
        }).catch((err) =>
          console.error('[Miembros] Error reenviando invitación:', err?.message || err)
        );
        return res.status(200).json({
          id: existingUser.id,
          username: existingUser.username,
          name: existingUser.name,
          role: 'member',
          instrument: existingUser.instrument,
          reinvitado: true,
        });
      }
      return res
        .status(400)
        .json({ error: 'Este usuario ya está registrado en esta banda.' });
    }

    // Un admin de la plataforma no se añade a bandas desde fuera.
    if (existingUser.role === 'admin') {
      return res.status(403).json({ error: 'No se puede añadir esa cuenta.' });
    }

    // Se vincula SIEMPRE como miembro: el rol de líder no se concede a una cuenta ajena.
    const newUB = {
      id: `ub-${existingUser.id}-${targetBandId}`,
      user_id: existingUser.id,
      band_id: targetBandId,
      role: 'member',
      createdAt: new Date().toISOString(),
    };
    state.userBands.push(newUB);
    try {
      await dbUpsertUserBand(newUB);
    } catch (e) {
      console.warn('Failed to append userBand to Supabase', e);
    }

    saveState(state);

    // No se devuelve la ficha de una cuenta ajena (email, banda...): solo lo mínimo para la lista.
    return res.status(201).json({
      id: existingUser.id,
      username: existingUser.username,
      name: existingUser.name,
      role: 'member',
      instrument: existingUser.instrument,
    });
  }

  // Create new user record
  const { hash, salt } = hashPassword(password);
  const existingIds = new Set<string>(
    (state.users || []).map((u) => u.id)
  );
  const newUserId = generateUniqueSlugId('user', cleanUsername, existingIds);

  const newUser: UsuarioGuardado = {
    id: newUserId,
    username: cleanUsername,
    name: name.trim(),
    email: cleanEmail,
    role: role === 'leader' ? 'leader' : 'member',
    instrument: instrument ? instrument.trim() : 'Músico',
    avatarColor: avatarColor || '#3b82f6',
    passwordHash: hash,
    salt: salt,
    band_id: targetBandId,
    // La cuenta la crea el director con una contraseña provisional y el miembro la termina de
    // activar poniendo la suya en /auth/activate-member. Esta marca es lo que distingue "cuenta
    // recién invitada" de "cuenta ya en uso": sin ella, esa ruta valía para cambiarle la
    // contraseña a cualquiera con solo saber su email.
    createdAt: new Date().toISOString(),
  };
  // La invitación pendiente (con su token de un solo uso) se guarda en ui_preferences para que
  // sobreviva a un reinicio del servidor; el token en claro solo viaja en el correo.
  const tokenInvitacion = asignarInvitacion(newUser);

  state.users.push(newUser);

  const newUB = {
    id: `ub-${newUserId}-${targetBandId}`,
    user_id: newUserId,
    band_id: targetBandId,
    role: role === 'leader' ? 'leader' : 'member',
    createdAt: new Date().toISOString(),
  };
  if (!state.userBands) state.userBands = [];
  state.userBands.push(newUB);

  saveState(state);

  try {
    await dbUpsertUser(newUser);
    await dbUpsertUserBand(newUB);
  } catch (err) {
    console.warn(
      'Notice: User saved locally, Supabase update skipped or pending:',
      err
    );
  }

  // Enviar email de invitación al nuevo miembro si tiene email válido
  if (cleanEmail && cleanEmail.includes('@')) {
    const bandInfo = (state.registeredBands || []).find(
      (b) => b.band_id === targetBandId || b.id === targetBandId
    );
    const bName = bandInfo?.nombre_banda || 'tu banda';
    sendMemberInvitationEmail({
      toEmail: cleanEmail,
      memberName: name.trim(),
      bandName: bName,
      instrument: instrument ? instrument.trim() : undefined,
      username: cleanUsername,
      activationToken: tokenInvitacion,
    }).catch((err) => {
      console.error(
        `[Miembros] Error enviando email de invitación a ${cleanEmail}:`,
        err?.message || err
      );
    });
  }

  res.status(201).json(getSafeUsers([newUser])[0]);
});

export default router;
