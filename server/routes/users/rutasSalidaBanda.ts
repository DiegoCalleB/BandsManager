/**
 * Salir de una banda (o borrarla si eras su único miembro) y subida del logo desde el perfil.
 */
import express from 'express';
import { getSafeUsers } from '../../auth.js';
import { loadState, saveState, requireAuth } from '../../state.js';
import { dbUpsertUser, dbDeleteUserFromBand, dbDeleteRegisteredBand } from '../../db.js';
import '../../utils/bandAccess.js';
import { buildAvailableBandsForUser } from './bandasDisponibles.js';

const router = express.Router();

router.delete(
  ['/leave-band/:bandId', '/users/leave-band/:bandId'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const rawBandId = req.params.bandId;

      if (!user_id || !rawBandId) {
        return res
          .status(400)
          .json({ error: 'ID de usuario o banda faltante' });
      }

      const state = loadState();
      const cleanTarget = rawBandId.replace(/^(band|reg)-/, '');
      const user = state.users?.find((u: any) => u.id === user_id);
      const userEmail = (
        user?.email ||
        req.user?.email ||
        ''
      ).toLowerCase();

      // 1. Remove relationship from state.userBands
      if (state.userBands && Array.isArray(state.userBands)) {
        state.userBands = state.userBands.filter((ub: any) => {
          const ubClean = ub.band_id
            ? ub.band_id.replace(/^(band|reg)-/, '')
            : '';
          const isUserMatch =
            ub.user_id === user_id ||
            (userEmail &&
              state.users?.some(
                (u: any) =>
                  u.id === ub.user_id &&
                  (u.email?.toLowerCase() === userEmail ||
                    u.username?.toLowerCase() === userEmail)
              ));
          return !(isUserMatch && ubClean === cleanTarget);
        });
      }

      // 2. Remove / unlink on state.registeredBands if matching
      if (state.registeredBands && Array.isArray(state.registeredBands)) {
        state.registeredBands = state.registeredBands.filter((rb: any) => {
          const rbClean = rb.band_id
            ? rb.band_id.replace(/^(band|reg)-/, '')
            : rb.id
              ? rb.id.replace(/^(band|reg)-/, '')
              : '';
          if (rbClean === cleanTarget) {
            if (
              rb.user_id === user_id ||
              (userEmail && rb.email?.toLowerCase() === userEmail)
            ) {
              // Delete registered band completely if owned by this user
              return false;
            }
            if (rb.user_id === user_id) rb.user_id = null;
            if (userEmail && rb.email?.toLowerCase() === userEmail)
              rb.email = '';
          }
          return true;
        });
      }

      // 3. Clear from any other accounts of the same user with that band_id
      if (state.users && Array.isArray(state.users)) {
        // for...of (no .forEach) porque el cuerpo necesita await buildAvailableBandsForUser: un
        // callback de .forEach no se puede esperar, así que el resto de la ruta seguiría antes de
        // que la promesa resolviera.
        for (const u of state.users) {
          const matchesUser =
            u.id === user_id ||
            (userEmail &&
              (u.email?.toLowerCase() === userEmail ||
                u.username?.toLowerCase() === userEmail));
          if (matchesUser) {
            const uBandClean = u.band_id
              ? u.band_id.replace(/^(band|reg)-/, '')
              : '';
            const uMainClean = u.main_band_id
              ? u.main_band_id.replace(/^(band|reg)-/, '')
              : '';
            if (Array.isArray(u.band_order)) {
              u.band_order = u.band_order.filter(
                (id: string) =>
                  typeof id === 'string' &&
                  id.replace(/^(band|reg)-/, '') !== cleanTarget
              );
            }
            if (uBandClean === cleanTarget || uMainClean === cleanTarget) {
              const remBands = (
                await buildAvailableBandsForUser(state, u)
              ).filter(
                (b: any) =>
                  b &&
                  b.band_id &&
                  typeof b.band_id === 'string' &&
                  b.band_id.replace(/^(band|reg)-/, '') !== cleanTarget
              );
              if (uMainClean === cleanTarget) {
                u.main_band_id =
                  remBands.length > 0 ? remBands[0].band_id : undefined;
              }
              if (uBandClean === cleanTarget) {
                if (remBands.length > 0) {
                  u.band_id = u.main_band_id || remBands[0].band_id;
                  const chosen =
                    remBands.find((b: any) => b.band_id === u.band_id) ||
                    remBands[0];
                  u.bandName = chosen.bandName || chosen.nombre_banda;
                } else {
                  // Antes, un usuario que se quedaba sin bandas se reasignaba en silencio a la
                  // banda insignia. Sin bandas, se queda sin band_id: la app debe pedirle crear o
                  // unirse a una, no meterlo en la banda del fundador.
                  u.band_id = undefined;
                  u.bandName = undefined;
                }
              }
            }
          }
        }
      }

      // 4. Update current user instance
      if (user) {
        const activeClean = user.band_id
          ? user.band_id.replace(/^(band|reg)-/, '')
          : '';
        const mainClean = user.main_band_id
          ? user.main_band_id.replace(/^(band|reg)-/, '')
          : '';
        const remainingBands = (
          await buildAvailableBandsForUser(state, user)
        ).filter(
          (b: any) =>
            b &&
            b.band_id &&
            typeof b.band_id === 'string' &&
            b.band_id.replace(/^(band|reg)-/, '') !== cleanTarget
        );

        if (Array.isArray(user.band_order)) {
          user.band_order = user.band_order.filter(
            (id: string) =>
              typeof id === 'string' &&
              id.replace(/^(band|reg)-/, '') !== cleanTarget
          );
        }

        if (mainClean === cleanTarget) {
          user.main_band_id =
            remainingBands.length > 0 ? remainingBands[0].band_id : undefined;
        }

        if (activeClean === cleanTarget) {
          if (remainingBands.length > 0) {
            user.band_id = user.main_band_id || remainingBands[0].band_id;
            const chosenBand =
              remainingBands.find((b: any) => b.band_id === user.band_id) ||
              remainingBands[0];
            user.bandName = chosenBand.bandName || chosenBand.nombre_banda;
          } else {
            user.band_id = undefined;
            user.bandName = undefined;
          }
        }

        try {
          await dbUpsertUser(user);
        } catch (err) {
          console.warn(
            'Notice updating user active band in Supabase after leaving:',
            err
          );
        }
      }

      saveState(state);

      // 5. Delete from Supabase user_bands & registered_bands
      try {
        await dbDeleteUserFromBand(user_id, rawBandId);
        await dbDeleteRegisteredBand(rawBandId);
      } catch (sbErr) {
        console.warn('Notice deleting from Supabase:', sbErr);
      }

      const updatedUser = user
        ? state.users?.find((u: any) => u.id === user_id) || user
        : null;
      const updatedAvailableBands = updatedUser
        ? await buildAvailableBandsForUser(state, updatedUser)
        : [];

      res.json({
        success: true,
        message: 'Has abandonado la banda correctamente',
        user: updatedUser ? getSafeUsers([updatedUser])[0] : null,
        availableBands: updatedAvailableBands,
      });
    } catch (error) {
      console.error('Error al abandonar banda:', error);
      res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
  }
);

export default router;
