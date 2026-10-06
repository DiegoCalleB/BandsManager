// Campañas de booking masivas: CRUD, campaña activa y registro de entrenamiento de tono. Scoping por
// `band_id` de sesión.

import express from "express";
import { requireAuth } from "../state.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import {
  dbGetCampaigns,
  dbUpsertCampaign,
  dbDeleteCampaign,
  dbSetActiveCampaign,
  dbRecordCampaignPitchTraining,
  trainCampaignToneDnaManually
} from "../db.js";
import { syncActiveCampaignsRadar } from "../services/campaignRadarScheduler.js";

const router = express.Router();

// GET /api/campaigns
router.get("/campaigns", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
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
    const userBandId = getTargetBandId(req);
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
    const userBandId = getTargetBandId(req);
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
    const userBandId = getTargetBandId(req);
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
    const userBandId = getTargetBandId(req);
    const { id } = req.body;
    await dbSetActiveCampaign(id || null, userBandId);
    const campaigns = await dbGetCampaigns(userBandId);
    const active = campaigns.find(c => c.id === id) || null;

    // Disparar sincronización inmediata de radar de carteleras en segundo plano para la campaña activa
    if (active) {
      syncActiveCampaignsRadar(userBandId).catch(err => {
        console.warn("[CampaignsRoute] Error en escaneo en segundo plano al activar campaña:", err);
      });
    }

    res.json({ success: true, activeCampaign: active, campaigns });
  } catch (error: any) {
    console.error("Error in POST /api/campaigns/active:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al activar campaña" });
  }
});

// POST /api/campaigns/:id/record-training
// Records campaign-specific pitch training (for tone/content refinement)
router.post("/campaigns/:id/record-training", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const { id } = req.params;
    const { borrador_ia, texto_aprobado } = req.body;

    if (!borrador_ia || !texto_aprobado) {
      return res.status(400).json({ success: false, error: "Se requieren borrador_ia y texto_aprobado" });
    }

    const success = await dbRecordCampaignPitchTraining({
      band_id: userBandId,
      campaign_id: id,
      borrador_ia,
      texto_aprobado
    });

    res.json({
      success,
      message: success
        ? "Entrenamiento de campaña registrado correctamente. Se analizarán los patrones automáticamente."
        : "No se pudo registrar el entrenamiento, pero la campaña continúa funcionando."
    });
  } catch (error: any) {
    console.error(`Error in POST /api/campaigns/${req.params.id}/record-training:`, error);
    res.status(500).json({ success: false, error: error?.message || "Error al registrar entrenamiento de campaña" });
  }
});

// POST /api/campaigns/:id/train-tone-dna
// Forces immediate campaign tone DNA training if enough examples exist
router.post("/campaigns/:id/train-tone-dna", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const { id } = req.params;

    const result = await trainCampaignToneDnaManually(userBandId, id);

    if (result.success) {
      const campaigns = await dbGetCampaigns(userBandId);
      const updated = campaigns.find(c => c.id === id) || null;
      return res.json({ success: true, message: result.message, campaign: updated });
    } else {
      return res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    console.error(`Error in POST /api/campaigns/${req.params.id}/train-tone-dna:`, error);
    res.status(500).json({ success: false, error: error?.message || "Error al entrenar ADN de tono de campaña" });
  }
});

export default router;
