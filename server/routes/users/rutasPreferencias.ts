/**
 * Preferencias de la cuenta: banda principal, orden de bandas y preferencias de interfaz.
 */
import { validarPreferenciasUi } from '../../utils/validarPanel.js';
import express from 'express';
import { loadState, saveState, requireAuth } from '../../state.js';
import { dbUpsertUser, normalizePlan } from '../../db.js';
import { puedeEscribirEnBanda } from '../../utils/bandAccess.js';
import { cleanBandId, buildAvailableBandsForUser } from './bandasDisponibles.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

const router = express.Router();

// Set main / primary band
router.post(
  ['/set-main-band', '/users/set-main-band'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const { band_id } = req.body;
      if (!band_id) {
        return res.status(400).json({ error: 'band_id es requerido' });
      }
      // Antes se aceptaba cualquier band_id del body sin comprobar que el usuario perteneciera a
      // ella: cualquier cuenta autenticada podía convertirse en leader de una banda ajena con solo
      // conocer su id. set-main-band solo puede fijar como principal una banda a la que ya perteneces.
      if (!puedeEscribirEnBanda(req, band_id)) {
        return res.status(403).json({ error: 'No perteneces a esa banda.' });
      }

      const state = loadState();
      const cleanTarget = band_id.replace(/^(band|reg)-/, '');
      const reqEmail = (
        req.user?.email ||
        req.user?.username ||
        ''
      ).toLowerCase();
      const user = state.users?.find(
        (u) =>
          u.id === user_id ||
          (reqEmail &&
            (u.email?.toLowerCase() === reqEmail ||
              u.username?.toLowerCase() === reqEmail))
      );
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const bandInfo =
        (state.registeredBands || []).find(
          (b) =>
            b.band_id === band_id ||
            b.id === band_id ||
            (b.band_id &&
              b.band_id.replace(/^(band|reg)-/, '') === cleanTarget) ||
            (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTarget)
        );

      const resolvedName = bandInfo
        ? bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name
        : user.bandName || 'Banda';
      const resolvedPlan = normalizePlan(
        bandInfo?.plan || user.plan || 'ensayo'
      );

      user.band_id = band_id;
      user.main_band_id = band_id;
      user.bandName = resolvedName;
      user.plan = resolvedPlan;

      const cleanBId = cleanBandId(band_id);
      if (Array.isArray(user.band_order)) {
        user.band_order = [
          cleanBId,
          ...user.band_order.filter((b: string) => cleanBandId(b) !== cleanBId),
        ];
      } else {
        user.band_order = [cleanBId];
      }

      // Update on all user records sharing this email/username
      const userEmail = (user.email || user.username || reqEmail).toLowerCase();
      if (state.users) {
        state.users.forEach((u) => {
          if (
            u.id === user.id ||
            (userEmail &&
              (u.email?.toLowerCase() === userEmail ||
                u.username?.toLowerCase() === userEmail))
          ) {
            u.band_id = band_id;
            u.main_band_id = band_id;
            u.bandName = resolvedName;
            u.plan = resolvedPlan;
            u.band_order = user.band_order;
          }
        });
      }

      saveState(state);
      try {
        await dbUpsertUser(user);
      } catch (err) {
        console.warn('Could not sync main band to Supabase:', err);
      }

      const availableBands = await buildAvailableBandsForUser(state, user);
      const { passwordHash, salt, ...safeUser } = user;
      res.json({ success: true, user: safeUser, availableBands });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      res.status(500).json({
        error: err.message || 'Error al establecer la banda principal',
      });
    }
  }
);

// Set custom band order for user
router.post(
  ['/set-band-order', '/users/set-band-order'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const { band_order } = req.body;
      if (!Array.isArray(band_order)) {
        return res
          .status(400)
          .json({ error: 'band_order debe ser un array de IDs de banda' });
      }

      const state = loadState();
      const user = state.users?.find((u) => u.id === user_id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      user.band_order = band_order;

      const userEmail = (user.email || user.username || '').toLowerCase();
      if (state.users) {
        state.users.forEach((u) => {
          if (
            u.id === user.id ||
            (userEmail &&
              (u.email?.toLowerCase() === userEmail ||
                u.username?.toLowerCase() === userEmail))
          ) {
            u.band_order = band_order;
          }
        });
      }

      saveState(state);
      try {
        await dbUpsertUser(user);
      } catch (err) {
        console.warn('Could not sync band order to Supabase:', err);
      }

      const availableBands = await buildAvailableBandsForUser(state, user);
      const { passwordHash, salt, ...safeUser } = user;
      res.json({ success: true, user: safeUser, availableBands });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error setting band order:', err);
      res
        .status(500)
        .json({ error: err.message || 'Error al guardar el orden de bandas' });
    }
  }
);

// Guardar preferencias de interfaz de usuario (ej. vista de meses del calendario por tipo de dispositivo)
router.post(
  ['/ui-preferences', '/users/ui-preferences'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const { calendar_default_months, ...otherPrefs } = req.body || {};
      const motivo = validarPreferenciasUi(req.body || {});
      if (motivo) return res.status(400).json({ success: false, error: motivo });

      const state = loadState();
      const reqEmail = (
        req.user?.email ||
        req.user?.username ||
        ''
      ).toLowerCase();
      const user = state.users?.find(
        (u) =>
          u.id === user_id ||
          (reqEmail &&
            (u.email?.toLowerCase() === reqEmail ||
              u.username?.toLowerCase() === reqEmail))
      );
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const currentPrefs = user.ui_preferences || {};
      const updatedCalendarMonths = {
        ...(currentPrefs.calendar_default_months || {}),
        ...(calendar_default_months || {}),
      };

      const updatedPrefs = {
        ...currentPrefs,
        ...otherPrefs,
        calendar_default_months: updatedCalendarMonths,
      };

      user.ui_preferences = updatedPrefs;

      const userEmail = (user.email || user.username || reqEmail).toLowerCase();
      if (state.users) {
        state.users.forEach((u) => {
          if (
            u.id === user.id ||
            (userEmail &&
              (u.email?.toLowerCase() === userEmail ||
                u.username?.toLowerCase() === userEmail))
          ) {
            u.ui_preferences = updatedPrefs;
          }
        });
      }

      saveState(state);
      // `persistido: false` = quedó solo en el estado local del servidor (que se pierde al
      // reiniciar). Sin Supabase configurado (desarrollo, e2e) no hay a dónde persistir y no es un fallo.
      let persistido = true;
      try {
        await dbUpsertUser(user);
      } catch (err) {
        console.warn('Could not sync ui_preferences to Supabase:', err);
        persistido = !(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
      }

      const { passwordHash, salt, ...safeUser } = user;
      res.json({ success: true, persistido, ui_preferences: updatedPrefs, user: safeUser });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error saving ui-preferences:', err);
      res.status(500).json({
        error: err.message || 'Error al guardar preferencias de usuario',
      });
    }
  }
);

// Obtener preferencias de interfaz de usuario
router.get(
  ['/ui-preferences', '/users/ui-preferences'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const state = loadState();
      const reqEmail = (
        req.user?.email ||
        req.user?.username ||
        ''
      ).toLowerCase();
      const user = state.users?.find(
        (u) =>
          u.id === user_id ||
          (reqEmail &&
            (u.email?.toLowerCase() === reqEmail ||
              u.username?.toLowerCase() === reqEmail))
      );
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ success: true, ui_preferences: user.ui_preferences || {} });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      res
        .status(500)
        .json({ error: err.message || 'Error al obtener preferencias' });
    }
  }
);

export default router;
