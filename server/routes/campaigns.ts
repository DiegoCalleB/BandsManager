import express from "express";
import { requireAuth } from "../state.js";
import { 
  dbGetCampaigns, 
  dbUpsertCampaign, 
  dbDeleteCampaign, 
  dbSetActiveCampaign 
} from "../db.js";

const router = express.Router();

// GET /api/campaigns
router.get("/campaigns", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id;
    const campaigns = await dbGetCampaigns(userBandId);
    res.json({ success: true, campaigns });
  } catch (error: any) {
    console.error("Error in GET /api/campaigns:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al obtener campañas" });
  }
});

// POST /api/campaigns
router.post("/campaigns", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id;
    const campaignData = req.body;
    if (!campaignData || !campaignData.name) {
      return res.status(400).json({ success: false, error: "Nombre de campaña requerido" });
    }

    const savedCampaign = await dbUpsertCampaign(campaignData, userBandId);
    
    // If set to active, update others
    if (campaignData.isActive) {
      await dbSetActiveCampaign(savedCampaign.id, userBandId);
    }

    res.json({ success: true, campaign: savedCampaign });
  } catch (error: any) {
    console.error("Error in POST /api/campaigns:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al guardar campaña" });
  }
});

// PUT /api/campaigns/:id
router.put("/campaigns/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id;
    const { id } = req.params;
    const campaignData = { ...req.body, id };

    const savedCampaign = await dbUpsertCampaign(campaignData, userBandId);
    if (campaignData.isActive) {
      await dbSetActiveCampaign(id, userBandId);
    }

    res.json({ success: true, campaign: savedCampaign });
  } catch (error: any) {
    console.error(`Error in PUT /api/campaigns/${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error?.message || "Error al actualizar campaña" });
  }
});

// DELETE /api/campaigns/:id
router.delete("/campaigns/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id;
    const { id } = req.params;
    await dbDeleteCampaign(id, userBandId);
    res.json({ success: true, message: "Campaña eliminada correctamente" });
  } catch (error: any) {
    console.error(`Error in DELETE /api/campaigns/${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error?.message || "Error al eliminar campaña" });
  }
});

// POST /api/campaigns/active
router.post("/campaigns/active", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id;
    const { id } = req.body;
    await dbSetActiveCampaign(id || null, userBandId);
    const campaigns = await dbGetCampaigns(userBandId);
    const active = campaigns.find(c => c.id === id) || null;
    res.json({ success: true, activeCampaign: active, campaigns });
  } catch (error: any) {
    console.error("Error in POST /api/campaigns/active:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al activar campaña" });
  }
});

export default router;
