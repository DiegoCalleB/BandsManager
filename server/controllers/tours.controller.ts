import { Request, Response } from "express";
import { loadState, saveState } from "../state.js";
import { Tour } from "../../src/types.js";
import { dbGetTours, dbUpsertTour, dbDeleteTour } from "../db.js";

export const toursController = {
  async getTours(req: Request, res: Response) {
    // Las 4 rutas de este controller están detrás de requireAuth, así que band_id nunca debería
    // faltar; si falta es un bug de sesión, no un caso a tolerar cayendo en band-bakandeya.
    const userBandId = (req as any).user?.band_id;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    try {
      const tours = await dbGetTours(userBandId);

      const state = loadState();
      state.tours = tours as any;
      saveState(state);

      res.json({ tours });
    } catch (error: any) {
      const state = loadState();
      res.json({ tours: (state.tours || []).filter((t: any) => t.band_id === userBandId || t.bandId === userBandId) });
    }
  },

  async createTour(req: Request, res: Response) {
    const userBandId = (req as any).user?.band_id;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    try {
      const newTour: Tour = req.body;
      if (!(newTour as any).band_id) {
        (newTour as any).band_id = userBandId;
      }
      const saved = await dbUpsertTour(newTour, userBandId);

      const state = loadState();
      state.tours = state.tours || [];
      state.tours.push(saved as any);
      saveState(state);

      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al crear la gira" });
    }
  },

  async updateTour(req: Request, res: Response) {
    const userBandId = (req as any).user?.band_id;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    try {
      const { id } = req.params;
      const updatedTour: Tour = { ...req.body, id };
      const saved = await dbUpsertTour(updatedTour, userBandId);

      const state = loadState();
      state.tours = state.tours || [];
      state.tours = state.tours.map((t: Tour) => t.id === id ? (saved as any) : t);
      saveState(state);

      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al actualizar la gira" });
    }
  },

  async deleteTour(req: Request, res: Response) {
    const userBandId = (req as any).user?.band_id;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    try {
      const { id } = req.params;
      await dbDeleteTour(id, userBandId);

      const state = loadState();
      state.tours = state.tours || [];
      state.tours = state.tours.filter((t: Tour) => t.id !== id);
      saveState(state);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al eliminar la gira" });
    }
  }
};
