import { Request, Response } from "express";
import { bandaDe, mismaBanda } from '../utils/bandAccess.js';
import { loadState } from "../state.js";
import { dbGetTours, dbUpsertTour, dbDeleteTour, esSupabaseNoConfigurado } from "../db.js";
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';
import { responderError } from '../utils/errorHttp.js';

// Las giras viven solo en Supabase: ninguna operación lee ni escribe `state.tours` (datos de todas
// las bandas). La única lectura del estado es la semilla del arranque local sin Supabase.
const SIN_SESION = { error: "Acceso no autorizado. Inicie sesión para continuar." };

export const toursController = {
  async getTours(req: Request, res: Response) {
    // Las 4 rutas de este controller están detrás de requireAuth, así que band_id nunca debería
    // faltar; si falta es un bug de sesión, no un caso a tolerar cayendo en una banda por defecto.
    const userBandId = req.user?.band_id;
    if (!userBandId) return res.status(401).json(SIN_SESION);
    try {
      res.json({ tours: await dbGetTours(userBandId) });
    } catch (errorCapturado) {
      // Con Supabase configurado, devolver la semilla en memoria escondería la caída con datos falsos.
      if (!esSupabaseNoConfigurado(errorCapturado)) {
        return responderError(res, comoErrorCapturado(errorCapturado), "Error al cargar las giras");
      }
      res.json({ tours: (loadState().tours || []).filter((t) => mismaBanda(bandaDe(t), userBandId)) });
    }
  },

  async createTour(req: Request, res: Response) {
    const userBandId = req.user?.band_id;
    if (!userBandId) return res.status(401).json(SIN_SESION);
    try {
      res.json(await dbUpsertTour(req.body, userBandId));
    } catch (errorCapturado) {
      responderError(res, comoErrorCapturado(errorCapturado), "Error al crear la gira");
    }
  },

  async updateTour(req: Request, res: Response) {
    const userBandId = req.user?.band_id;
    if (!userBandId) return res.status(401).json(SIN_SESION);
    try {
      res.json(await dbUpsertTour({ ...req.body, id: req.params.id }, userBandId));
    } catch (errorCapturado) {
      responderError(res, comoErrorCapturado(errorCapturado), "Error al actualizar la gira");
    }
  },

  async deleteTour(req: Request, res: Response) {
    const userBandId = req.user?.band_id;
    if (!userBandId) return res.status(401).json(SIN_SESION);
    try {
      await dbDeleteTour(req.params.id, userBandId);
      res.json({ success: true });
    } catch (errorCapturado) {
      responderError(res, comoErrorCapturado(errorCapturado), "Error al eliminar la gira");
    }
  }
};
