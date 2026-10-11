/**
 * Logo de banda y creación de una banda nueva desde una cuenta existente.
 */
import express from 'express';
import { loadState, saveState, requireAuth } from '../../state.js';
import { dbUpsertUser, dbUpsertUserBand, dbUpsertRegisteredBand, dbUpsertEpkConfig, invalidateBandStateCache } from '../../db.js';
import { getTargetBandId, puedeEscribirEnBanda, bandaSolicitada } from '../../utils/bandAccess.js';
import { generateUniqueSlugId } from '../../utils/slug.js';
import { cleanBandId, buildAvailableBandsForUser } from './bandasDisponibles.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

const router = express.Router();

// Upload / Update Band Logo
router.post(
  ['/upload-logo', '/users/upload-logo', '/bands/upload-logo', '/bands/logo'],
  requireAuth,
  async (req, res) => {
    try {
      const { logoUrl } = req.body;
      // La banda salía del body o de la cabecera sin mirarla, así que se le cambiaba el logo del
      // EPK a la banda que se quisiera.
      const solicitada = bandaSolicitada(req);
      if (solicitada && !puedeEscribirEnBanda(req, solicitada)) {
        return res
          .status(403)
          .json({ error: 'No tienes acceso a esta banda.' });
      }
      const targetBandId = getTargetBandId(req);

      if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) {
        return res.status(400).json({ error: 'logoUrl es requerido' });
      }

      const cleanTarget = targetBandId.replace(/^(band|reg)-/, '');
      const state = loadState();

      // 1. Update in Supabase
      await dbUpsertEpkConfig(targetBandId, { logoUrl: logoUrl.trim() });

      // 2. Update local state registeredBands
      if (!state.registeredBands) state.registeredBands = [];
      state.registeredBands.forEach((b) => {
        const bClean = (b.band_id || b.id || '').replace(/^(band|reg)-/, '');
        if (
          bClean === cleanTarget ||
          b.band_id === targetBandId ||
          b.id === targetBandId
        ) {
          b.logo_url = logoUrl.trim();
          b.imagen_url = logoUrl.trim();
        }
      });

      // 3. Update epkConfigsByBand in local state
      if (!state.epkConfigsByBand) state.epkConfigsByBand = {};
      const possibleKeys = [
        targetBandId,
        cleanTarget,
        `band-${cleanTarget}`,
        `reg-${cleanTarget}`,
      ];
      possibleKeys.forEach((k) => {
        if (state.epkConfigsByBand[k]) {
          state.epkConfigsByBand[k].logoUrl = logoUrl.trim();
        } else {
          state.epkConfigsByBand[k] = { logoUrl: logoUrl.trim() };
        }
      });

      if (
        req.user?.band_id &&
        cleanBandId(req.user.band_id) === cleanTarget
      ) {
        if (!state.epkConfig) state.epkConfig = {};
        state.epkConfig.logoUrl = logoUrl.trim();
      }

      saveState(state);
      invalidateBandStateCache(targetBandId);
      invalidateBandStateCache(cleanTarget);
      invalidateBandStateCache(`band-${cleanTarget}`);

      res.json({
        success: true,
        bandId: targetBandId,
        logoUrl: logoUrl.trim(),
      });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error updating band logo:', err);
      res.status(500).json({
        error: err.message || 'Error al actualizar el logotipo de la banda',
      });
    }
  }
);

// Create/Add a new band for current logged in user
router.post(
  ['/create-band', '/users/create-band'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const {
        bandName,
        estilo_musical,
        localizacion,
        leaderName,
        contacto_nombre
      } = req.body;

      if (!bandName || !bandName.trim()) {
        return res
          .status(400)
          .json({ error: 'El nombre del proyecto o banda es obligatorio' });
      }

      const state = loadState();
      const user = state.users?.find((u) => u.id === user_id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const rawBandName = bandName.trim();
      const cleanEmail = (user.email || user.username || '').toLowerCase();
      const selectedPlan = 'promo'; // Toda nueva banda se crea exclusivamente en plan promo
      const leaderDisplayName = (
        leaderName ||
        contacto_nombre ||
        user.name ||
        user.username ||
        rawBandName
      ).trim();

      const existingIds = new Set<string>();
      (state.users || []).forEach((u) => {
        if (u.id) existingIds.add(u.id);
        if (u.band_id) existingIds.add(u.band_id);
      });
      (state.registeredBands || []).forEach((b) => {
        if (b.id) existingIds.add(b.id);
        if (b.band_id) existingIds.add(b.band_id);
      });

      const bandId = generateUniqueSlugId('band', rawBandName, existingIds);
      existingIds.add(bandId);

      const regId = generateUniqueSlugId('reg', rawBandName, existingIds);
      existingIds.add(regId);

      const newRegisteredBandRecord = {
        id: regId,
        band_id: bandId,
        user_id: user.id,
        fecha_registro: new Date().toISOString(),
        nombre_banda: rawBandName,
        email: cleanEmail,
        plan: selectedPlan,
        contacto_nombre: leaderDisplayName,
        estilo_musical: estilo_musical?.trim() || 'Por definir',
        localizacion: localizacion?.trim() || 'España',
        telefono: '',
        instagram: '',
        spotify_youtube: '',
        aforo_promedio: 0,
        estado_cuenta: 'activo',
        notas: `Creada desde BandSwitcherModal por ${user.name || user.username}`,
      };

      if (!state.registeredBands) state.registeredBands = [];
      state.registeredBands.push(newRegisteredBandRecord);

      if (!state.userBands) state.userBands = [];
      const newUB = {
        id: `ub-${user.id}-${bandId}`,
        user_id: user.id,
        band_id: bandId,
        role: 'leader',
        createdAt: new Date().toISOString(),
      };
      state.userBands.push(newUB);

      // Switch active band to the new band
      user.band_id = bandId;
      user.bandName = rawBandName;
      user.plan = selectedPlan;
      if (!user.main_band_id) {
        user.main_band_id = bandId;
      }
      if (Array.isArray(user.band_order)) {
        user.band_order = [
          bandId,
          ...user.band_order.filter(
            (id: string) =>
              id !== bandId &&
              id.replace(/^(band|reg)-/, '') !== cleanBandId(bandId)
          ),
        ];
      } else {
        user.band_order = [bandId];
      }

      // Sync to all user records with matching email
      if (state.users) {
        state.users.forEach((u) => {
          if (
            u.id === user.id ||
            (cleanEmail &&
              (u.email?.toLowerCase() === cleanEmail ||
                u.username?.toLowerCase() === cleanEmail))
          ) {
            u.band_id = bandId;
            u.bandName = rawBandName;
            u.plan = selectedPlan;
            if (!u.main_band_id) u.main_band_id = bandId;
            if (Array.isArray(u.band_order)) {
              u.band_order = [
                bandId,
                ...u.band_order.filter(
                  (id: string) =>
                    id !== bandId &&
                    id.replace(/^(band|reg)-/, '') !== cleanBandId(bandId)
                ),
              ];
            }
          }
        });
      }

      // Inicializar configuración EPK limpia y aislada para la nueva banda
      if (!state.epkConfigsByBand) {
        state.epkConfigsByBand = {};
      }
      const cleanBandIdStr = cleanBandId(bandId);
      const freshEpkConfig = {
        biografia: '',
        logoUrl: '',
        bandPhotos: [],
        miembros: [
          {
            id: 'leader',
            nombre: leaderDisplayName,
            rol: user.instrument || 'Voz / Guitarra',
            email: cleanEmail,
            instagram: '',
            isLeader: true,
          },
        ],
        riderTecnico: '',
        enlacesRedes: {
          spotify: '',
          youtube: '',
          instagram: '',
          tiktok: '',
          website: '',
        },
        contactoBooking: {
          nombre: leaderDisplayName,
          email: cleanEmail,
          telefono: '',
        },
        temasDestacadosIds: [],
        incentivoFans: {
          mensajeAgradecimiento: `¡Muchas gracias por unirte a la comunidad de ${rawBandName}!`,
          enlaceDescarga: '',
          codigoDescuento: '',
        },
      };
      state.epkConfigsByBand[bandId] = freshEpkConfig;
      state.epkConfigsByBand[cleanBandIdStr] = freshEpkConfig;
      state.epkConfigsByBand[`band-${cleanBandIdStr}`] = freshEpkConfig;
      state.epkConfigsByBand[`reg-${cleanBandIdStr}`] = freshEpkConfig;

      saveState(state);

      try {
        await dbUpsertRegisteredBand(newRegisteredBandRecord);
        await dbUpsertUser(user);
        await dbUpsertUserBand(newUB);
      } catch (err) {
        console.warn('Notice: Band saved locally, Supabase sync pending:', err);
      }

      const availableBands = await buildAvailableBandsForUser(state, user);
      const { passwordHash, salt, ...safeUser } = user;

      res.status(201).json({
        success: true,
        message: `¡Proyecto "${rawBandName}" creado con éxito!`,
        band_id: bandId,
        bandName: rawBandName,
        user: safeUser,
        availableBands,
      });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error creating new band:', err);
      res
        .status(500)
        .json({ error: err.message || 'Error al crear el nuevo proyecto' });
    }
  }
);

export default router;
