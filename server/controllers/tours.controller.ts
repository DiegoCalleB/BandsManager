import { Request, Response } from "express";
import { loadState, saveState } from "../state.js";
import { Tour } from "../../src/types.js";
import { dbGetTours, dbUpsertTour, dbDeleteTour } from "../db.js";

export const toursController = {
  async getTours(req: Request, res: Response) {
    try {
      const userBandId = (req as any).user?.band_id || 'band-bakandeya';
      const tours = await dbGetTours(userBandId);

      const state = loadState();
      state.tours = tours as any;
      saveState(state);

      res.json({ tours });
    } catch (error: any) {
      const state = loadState();
      res.json({ tours: state.tours || [] });
    }
  },

  async createTour(req: Request, res: Response) {
    try {
      const newTour: Tour = req.body;
      const userBandId = (req as any).user?.band_id || 'band-bakandeya';
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
    try {
      const { id } = req.params;
      const userBandId = (req as any).user?.band_id || 'band-bakandeya';
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
    try {
      const { id } = req.params;
      const userBandId = (req as any).user?.band_id || 'band-bakandeya';
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
