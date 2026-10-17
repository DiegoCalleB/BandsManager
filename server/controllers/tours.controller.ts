import { Request, Response } from "express";
import { bandaDe } from '../utils/bandAccess.js';
import { loadState, saveState } from "../state.js";
import { Tour } from "../../src/types.js";
import { dbGetTours, dbUpsertTour, dbDeleteTour } from "../db.js";
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';
import { responderError } from '../utils/errorHttp.js';
import { fusionarColeccionDeBanda, quitarDeBanda, reemplazarDeBanda } from '../utils/estadoPorBanda.js';

export const toursController = {
  async getTours(req: Request, res: Response) {
    // Las 4 rutas de este controller están detrás de requireAuth, así que band_id nunca debería
    // faltar; si falta es un bug de sesión, no un caso a tolerar cayendo en una banda por defecto.
    const userBandId = req.user?.band_id;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    try {
      const tours = await dbGetTours(userBandId);

      const state = loadState();
      state.tours = fusionarColeccionDeBanda(state.tours, userBandId, tours);
      saveState(state);

      res.json({ tours });
    } catch {
      const state = loadState();
      res.json({ tours: (state.tours || []).filter((t) => bandaDe(t) === userBandId) });
    }
  },

  async createTour(req: Request, res: Response) {
    const userBandId = req.user?.band_id;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    try {
      const newTour: Tour = req.body;
      if (!newTour.band_id) {
        newTour.band_id = userBandId;
      }
      const saved = await dbUpsertTour(newTour, userBandId);

      const state = loadState();
      state.tours = reemplazarDeBanda(state.tours, userBandId, saved.id, saved);
      saveState(state);

      res.json(saved);
    } catch (errorCapturado) {
      const error = comoErrorCapturado(errorCapturado);
      responderError(res, error, "Error al crear la gira");
    }
  },

  async updateTour(req: Request, res: Response) {
    const userBandId = req.user?.band_id;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    try {
      const { id } = req.params;
      const updatedTour: Tour = { ...req.body, id };
      const saved = await dbUpsertTour(updatedTour, userBandId);

      const state = loadState();
      state.tours = reemplazarDeBanda(state.tours, userBandId, id, saved);
      saveState(state);

      res.json(saved);
    } catch (errorCapturado) {
      const error = comoErrorCapturado(errorCapturado);
      responderError(res, error, "Error al actualizar la gira");
    }
  },

  async deleteTour(req: Request, res: Response) {
    const userBandId = req.user?.band_id;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    try {
      const { id } = req.params;
      await dbDeleteTour(id, userBandId);

      const state = loadState();
      state.tours = quitarDeBanda(state.tours, userBandId, id);
      saveState(state);

      res.json({ success: true });
    } catch (errorCapturado) {
      const error = comoErrorCapturado(errorCapturado);
      responderError(res, error, "Error al eliminar la gira");
    }
  }
};
