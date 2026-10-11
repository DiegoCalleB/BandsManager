/**
 * Editar una cuenta (la propia o, si eres líder, la de un miembro) y dar de baja a un miembro.
 */
import express from 'express';
import { hashPassword } from '../../auth.js';
import { loadState, saveState, requireAuth, requireLeader } from '../../state.js';
import { dbUpsertUser, dbDeleteUser, dbDeleteUserFromBand, dbUpsertRegisteredBand, normalizePlan } from '../../db.js';
import { puedeEscribirEnBanda } from '../../utils/bandAccess.js';
import { compartenBanda, puedeRestablecerContrasenaDe } from './permisosCuenta.js';
import { buildAvailableBandsForUser } from './bandasDisponibles.js';

const router = express.Router();

// Update user (Leader or self)
router.put('/users/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const loggedUser = (req as any).user;
  if (loggedUser.role !== 'leader' && loggedUser.id !== id) {
    return res.status(403).json({
      error: 'Acceso denegado. Solo puedes modificar tu propia cuenta.',
    });
  }
  const {
    name,
    role,
    instrument,
    avatarColor,
    newPassword,
    googleOAuth,
    plan,
  } = req.body;

  const state = loadState();
  const userIndex = state.users.findIndex((u: any) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const user = state.users[userIndex];

  // El id se busca sobre state.users, que es la lista de toda la plataforma, y el permiso de
  // arriba se conforma con ser 'leader' —que en esta app lo es casi todo el mundo en su propia
  // banda—. Es decir: con el id de alguien de otra banda se le cambiaba el nombre, el rol y,
  // más abajo, la contraseña. Editar a otro exige compartir banda con él.
  if (loggedUser.id !== id && !compartenBanda(state, user, req)) {
    return res
      .status(403)
      .json({ error: 'Acceso denegado. Ese usuario no pertenece a tu banda.' });
  }

  // Un admin de la plataforma no se edita desde una banda.
  if (loggedUser.id !== id && user.role === 'admin') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }

  // Fijar la contraseña de otra persona solo se permite sobre cuentas que son SOLO de esta banda
  // (ver puedeRestablecerContrasenaDe). Se comprueba antes de aplicar ningún cambio.
  if (newPassword && newPassword.trim().length > 0 && loggedUser.id !== id && !puedeRestablecerContrasenaDe(state, user, req)) {
    return res.status(403).json({
      error: 'No puedes cambiar la contraseña de una cuenta que pertenece a otras bandas.',
    });
  }

  if (name) user.name = name.trim();
  if (googleOAuth !== undefined) user.googleOAuth = googleOAuth;

  if (plan !== undefined) {
    const targetBandId = req.body.band_id || user.band_id;
    const loggedUserEmail = (
      loggedUser.email ||
      loggedUser.username ||
      ''
    ).toLowerCase();
    const cleanTargetCheck = targetBandId
      ? targetBandId.replace(/^(band|reg)-/, '')
      : '';

    // Antes esto era `role === 'leader' || role === 'admin'`, y como en esta app todos los
    // usuarios reales son 'leader', anulaba las dos comprobaciones correctas de más abajo:
    // cualquiera podía cambiar el plan de suscripción de cualquier banda. El único escape
    // global legítimo es el admin de la plataforma.
    const isPlatformAdmin = loggedUser.role === 'admin';
    const isBandLeaderInUserBands = (state.userBands || []).some(
      (ub: any) =>
        (ub.user_id === loggedUser.id ||
          (loggedUserEmail && ub.email?.toLowerCase() === loggedUserEmail)) &&
        ub.band_id &&
        ub.band_id.replace(/^(band|reg)-/, '') === cleanTargetCheck &&
        (ub.role === 'leader' || ub.role === 'admin')
    );
    const isBandOwner = (state.registeredBands || []).some(
      (b: any) =>
        (b.user_id === loggedUser.id ||
          (loggedUserEmail && b.email?.toLowerCase() === loggedUserEmail)) &&
        ((b.band_id &&
          b.band_id.replace(/^(band|reg)-/, '') === cleanTargetCheck) ||
          (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetCheck))
    );

    // El plan de pago solo cambia por el flujo de Stripe (webhook / confirm-success). Que el
    // líder pudiera escribir `plan` aquí le daba un plan de pago sin pagar.
    void isBandLeaderInUserBands;
    void isBandOwner;
    if (!isPlatformAdmin) {
      return res.status(403).json({
        error: 'El plan de suscripción solo se cambia desde la facturación.',
      });
    }

    if (targetBandId) {
      const cleanTarget = targetBandId.replace(/^(band|reg)-/, '');
      const cleanCheck = cleanTarget.toLowerCase().trim();
      if (!state.registeredBands) state.registeredBands = [];
      let regBand = state.registeredBands.find((b: any) => {
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
          b.band_id === targetBandId ||
          b.id === targetBandId ||
          bBid === cleanCheck ||
          bId === cleanCheck ||
          (cleanCheck.length > 1 && bName === cleanCheck)
        );
      });
      const normPlan = normalizePlan(plan);
      if (!regBand) {
        regBand = {
          id: `reg-${cleanTarget}`,
          band_id: targetBandId,
          nombre_banda:
            user.band_id === targetBandId
              ? user.bandName || 'Banda'
              : cleanTarget,
          email: user.email || '',
          plan: normPlan,
          user_id: user.id,
          fecha_registro: new Date().toISOString(),
        };
        state.registeredBands.push(regBand);
      } else {
        regBand.plan = normPlan;
      }
      try {
        await dbUpsertRegisteredBand(regBand);
      } catch (err) { console.warn("[Usuarios] No se pudo guardar la banda registrada en Supabase:", err); }
    }

    const cleanUserBand = user.band_id
      ? user.band_id.replace(/^(band|reg)-/, '')
      : '';
    const cleanTarget = targetBandId
      ? targetBandId.replace(/^(band|reg)-/, '')
      : '';
    if (!targetBandId || cleanUserBand === cleanTarget) {
      user.plan = normalizePlan(plan);
    }
  }

  // Security guard: Only leaders can change the role property.
  if (role !== undefined) {
    if (loggedUser.role === 'leader') {
      // loggedUser ya viene validado por requireAuth más arriba en este mismo handler: band_id
      // nunca falta aquí, así que no hace falta (ni conviene) un valor por defecto.
      const targetBandId = loggedUser.band_id;
      if (!state.userBands) state.userBands = [];
      const userBand = state.userBands.find(
        (ub: any) => ub.user_id === id && ub.band_id === targetBandId
      );
      if (userBand) {
        userBand.role = role === 'leader' ? 'leader' : 'member';
      }
      user.role = role === 'leader' ? 'leader' : 'member';
    } else {
      console.warn(
        `[Security Guard] Non-leader user ${loggedUser.username} (${loggedUser.id}) attempted to set role to '${role}' on user ${id}. Field ignored.`
      );
    }
  }

  if (instrument !== undefined) user.instrument = instrument.trim();
  if (avatarColor) user.avatarColor = avatarColor;
  if (req.body.main_band_id !== undefined) {
    // Antes se aceptaba cualquier main_band_id del body sin comprobar que quien hace la
    // petición perteneciera a esa banda: bastaba editar el propio perfil para auto-asignarse
    // como leader de una banda ajena con solo conocer su id.
    if (
      req.body.main_band_id &&
      !puedeEscribirEnBanda(req, req.body.main_band_id)
    ) {
      return res.status(403).json({ error: 'No perteneces a esa banda.' });
    }
    user.main_band_id = req.body.main_band_id;
    if (req.body.main_band_id) user.band_id = req.body.main_band_id;
  }

  if (newPassword && newPassword.trim().length > 0) {
    const { hash, salt } = hashPassword(newPassword.trim());
    user.passwordHash = hash;
    user.salt = salt;
  }

  saveState(state);

  try {
    await dbUpsertUser(user);
  } catch (err) {
    console.warn(
      'Notice: User updated locally, Supabase update skipped or pending:',
      err
    );
  }

  const { passwordHash, salt, ...safeUser } = user;
  res.json(safeUser);
});

// Delete user (Leader operation)
router.delete('/users/:id', requireAuth, requireLeader, async (req, res) => {
  const { id } = req.params;
  const targetBandId = (req as any).user?.band_id;
  if (!targetBandId) {
    return res
      .status(401)
      .json({ error: 'Acceso no autorizado. Inicie sesión para continuar.' });
  }
  const state = loadState();
  const cleanTarget = targetBandId.replace(/^(band|reg)-/, '');

  if (!state.userBands) state.userBands = [];

  const targetUserObj = state.users?.find((u: any) => u.id === id);
  const targetEmail = (targetUserObj?.email || '').toLowerCase();

  const userBandRelation = state.userBands.find(
    (ub: any) =>
      ub.user_id === id &&
      ub.band_id?.replace(/^(band|reg)-/, '') === cleanTarget
  );

  if (
    !userBandRelation &&
    (!targetUserObj ||
      targetUserObj.band_id?.replace(/^(band|reg)-/, '') !== cleanTarget)
  ) {
    return res
      .status(404)
      .json({ error: 'Usuario no encontrado en esta banda' });
  }

  if (userBandRelation?.role === 'leader') {
    const leaderCount = state.userBands.filter(
      (ub: any) =>
        ub.band_id?.replace(/^(band|reg)-/, '') === cleanTarget &&
        ub.role === 'leader'
    ).length;
    if (leaderCount <= 1) {
      return res
        .status(400)
        .json({ error: 'No se puede eliminar al único líder de la banda' });
    }
  }

  // Remove relationship from userBands
  state.userBands = state.userBands.filter(
    (ub: any) =>
      !(
        ub.user_id === id &&
        ub.band_id?.replace(/^(band|reg)-/, '') === cleanTarget
      )
  );

  // Clear from registeredBands
  if (state.registeredBands && Array.isArray(state.registeredBands)) {
    state.registeredBands.forEach((rb: any) => {
      const rbClean = rb.band_id
        ? rb.band_id.replace(/^(band|reg)-/, '')
        : rb.id
          ? rb.id.replace(/^(band|reg)-/, '')
          : '';
      if (rbClean === cleanTarget) {
        if (rb.user_id === id) rb.user_id = null;
        if (targetEmail && rb.email?.toLowerCase() === targetEmail)
          rb.email = '';
      }
    });
  }

  // Check if user is in any other band
  const otherBandsExist = state.userBands.some((ub: any) => ub.user_id === id);
  if (!otherBandsExist) {
    state.users = state.users.filter((u: any) => u.id !== id);
  } else if (targetUserObj) {
    const activeClean = targetUserObj.band_id
      ? targetUserObj.band_id.replace(/^(band|reg)-/, '')
      : '';
    const mainClean = targetUserObj.main_band_id
      ? targetUserObj.main_band_id.replace(/^(band|reg)-/, '')
      : '';
    const remainingBands = await buildAvailableBandsForUser(
      state,
      targetUserObj
    );

    if (Array.isArray(targetUserObj.band_order)) {
      targetUserObj.band_order = targetUserObj.band_order.filter(
        (bId: string) => bId.replace(/^(band|reg)-/, '') !== cleanTarget
      );
    }

    if (mainClean === cleanTarget) {
      targetUserObj.main_band_id =
        remainingBands.length > 0 ? remainingBands[0].band_id : undefined;
    }

    if (activeClean === cleanTarget) {
      if (remainingBands.length > 0) {
        targetUserObj.band_id =
          targetUserObj.main_band_id || remainingBands[0].band_id;
        const chosen =
          remainingBands.find(
            (b: any) => b.band_id === targetUserObj.band_id
          ) || remainingBands[0];
        targetUserObj.bandName = chosen.bandName || chosen.nombre_banda;
      } else {
        targetUserObj.band_id = undefined;
        targetUserObj.bandName = undefined;
      }
    }
    try {
      await dbUpsertUser(targetUserObj);
    } catch (err) {
      console.warn('Notice syncing user active band after removal:', err);
    }
  }

  saveState(state);

  try {
    await dbDeleteUserFromBand(id, targetBandId);
    if (!otherBandsExist) {
      await dbDeleteUser(id);
    }
  } catch (err) {
    console.warn(
      'Notice: User deleted locally, Supabase update skipped or pending:',
      err
    );
  }

  res.json({ success: true, id });
});

export default router;
