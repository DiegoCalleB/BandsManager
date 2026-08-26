import express from "express";
import { puedeEntrarEnColaDeEnvio } from "../../utils/email.js";
import { Lead } from "../../../src/types.js";
import { loadState, saveState, requireAuth } from "../../state.js";
import { dbGetLeads, dbGetLeadById, dbUpsertLead, dbDeleteLead, dbCheckDeletedLead } from "../../db.js";
import { getAvailableAIProviders } from "../../ai.js";
import { autoEnrichLead } from "../../auto_enrichment.js";
import { isBadDirectoryUrl, getDomainFromUrl } from "./helpers.js";
import { checkRecordLimit } from "../../utils/planLimits.js";
import { getBandDnaProfile, generateSmartDnaPitchFallback } from "../../utils/bandDna.js";

const router = express.Router();

router.get("/ai/providers", requireAuth, async (req, res) => {
  try {
    const providers = getAvailableAIProviders();
    res.json({ success: true, providers });
  } catch (err: any) {
    console.error("Error fetching AI providers:", err);
    res.status(500).json({ error: "Error al obtener proveedores de IA" });
  }
});

// Re-align headers (no-op compatibility)
router.post("/leads/realign-headers", requireAuth, async (req, res) => {
  res.json({ success: true, message: "Cabeceras sincronizadas en Supabase PostgreSQL." });
});

// GET all leads
router.get("/leads", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id ;
  try {
    const rawLeads = await dbGetLeads(userBandId);
    const leads = rawLeads.map((l: any) => {
      let img = l.imagen_url || '';
      let web = l.website || '';

      // Specific auto-repair for Sala Siroco domain & logo
      if (l.nombre_sala?.toLowerCase().includes('siroco') || web.includes('salasiroco.es') || web.includes('siroco.es')) {
        web = 'https://siroco.es/';
        img = 'https://siroco.es/wp-content/uploads/2019/03/logo_-blanco_250px.png';
      } else {
        if (img.includes('ui-avatars.com') || img.includes('clearbit.com')) {
          img = '';
          if (web && !isBadDirectoryUrl(web)) {
            const domain = getDomainFromUrl(web);
            if (domain) img = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
          }
        }
      }
      return { ...l, website: web, imagen_url: img };
    });
    res.json({ leads });
  } catch (err: any) {
    console.error("Error getting leads from Supabase:", err);
    res.status(500).json({ error: "Error al obtener salas desde Supabase" });
  }
});

// Update a single lead
router.put("/leads/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id ;
    const { id } = req.params;
    const updatedFields = req.body;
    
    const existing = await dbGetLeadById(id, userBandId);
    const merged = { ...(existing || {}), ...updatedFields, id };

    // Regla del proyecto que hasta ahora no estaba en el código: un lead no puede entrar en la
    // cola de envío sin un email de contacto válido. Antes esto no se notaba porque el Scout
    // inventaba los emails que no conocía; ahora los huecos son reales y visibles. Salta aquí,
    // al aprobar, y no en silencio dentro del Enviador media hora después.
    const guarda = puedeEntrarEnColaDeEnvio(existing, updatedFields);
    if (!guarda.ok) {
      return res.status(400).json({ error: guarda.motivo, codigo: "email_contacto_invalido" });
    }

    const saved = await dbUpsertLead(merged, userBandId);

    // Fire autoEnrichLead in background so request returns instantly
    autoEnrichLead(saved, userBandId).catch(err => console.error("Error autoEnrichLead background:", err));

    res.json({ success: true, lead: saved });
  } catch (error: any) {
    console.error("Error in PUT /api/leads/:id:", error);
    res.status(500).json({ error: error?.message || "Error al actualizar la sala." });
  }
});

// Create a lead
router.post("/leads", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id ;
    const state = loadState();
    const bandConfig = state.epkConfigsByBand?.[userBandId] || state.epkConfigsByBand?.[userBandId.replace(/^(band|reg)-/, '')] || state.epkConfig || {};
    const registeredBand = state.registeredBands?.find((b: any) => b.band_id === userBandId || b.band_id === userBandId.replace(/^(band|reg)-/, ''));
    const cleanId = userBandId.replace(/^(band|reg)-/, '');
    const isBakandeya = cleanId === 'bakandeya';
    const bandName = registeredBand?.nombre_banda || registeredBand?.bandName || bandConfig?.contactoBooking?.nombre || bandConfig?.nombre_banda || (isBakandeya ? 'Bakandeya' : cleanId.charAt(0).toUpperCase() + cleanId.slice(1));
    const bandBio = bandConfig?.biografia || registeredBand?.biografia || registeredBand?.dossier_texto_extra || '';

    const newLead: Lead = req.body;
    if (!(newLead as any).band_id) {
      (newLead as any).band_id = userBandId;
    }

    // Auto-correct lead type if a venue or festival name was wrongly classified as "medio"
    if (newLead.nombre_sala) {
      const lowerName = newLead.nombre_sala.toLowerCase();
      const isVenue = lowerName.includes('sala') || lowerName.includes('teatro') || lowerName.includes('discoteca') || lowerName.includes('club') || lowerName.includes('sótano') || lowerName.includes('sotano') || lowerName.includes('recinto');
      const isFestival = lowerName.includes('festiv') || lowerName.includes('fest');
      if (isVenue && String(newLead.tipo || '').toLowerCase().includes('medio')) {
        newLead.tipo = 'sala';
        newLead.icono = '🏛️';
      } else if (isFestival && String(newLead.tipo || '').toLowerCase().includes('medio')) {
        newLead.tipo = 'festival';
        newLead.icono = '🎪';
      }
    }

    // El límite de leads/medios por plan solo se comprobaba en el cliente (App.tsx,
    // handleAddLeadWithLimitCheck): quien llamase a esta ruta directamente con su token de sesión
    // podía crear leads sin límite sin importar el plan contratado por su banda.
    const userPlan = (req as any).user?.plan || 'ensayo';
    const isMedio = String(newLead.tipo || '').toLowerCase().includes('medio')
      || String(newLead.tipo || '').toLowerCase().includes('prensa')
      || String(newLead.tipo || '').toLowerCase().includes('radio');
    const existingLeads = await dbGetLeads(userBandId);
    const currentCount = isMedio
      ? existingLeads.filter((l: any) => String(l.tipo || '').toLowerCase().includes('medio') || String(l.tipo || '').toLowerCase().includes('radio') || String(l.tipo || '').toLowerCase().includes('prensa')).length
      : existingLeads.filter((l: any) => !String(l.tipo || '').toLowerCase().includes('medio') && !String(l.tipo || '').toLowerCase().includes('radio') && !String(l.tipo || '').toLowerCase().includes('prensa')).length;
    const limitCheck = checkRecordLimit(userPlan, isMedio ? 'medios' : 'leads', currentCount);
    if (!limitCheck.allowed) {
      return res.status(403).json({ error: limitCheck.message, codigo: "limite_plan_alcanzado" });
    }

    if (!newLead.pitch_generado || newLead.pitch_generado === "Sin pitch generado.") {
      const state = loadState();
      const bandDna = getBandDnaProfile(state, userBandId, newLead);
      newLead.pitch_generado = generateSmartDnaPitchFallback({
        bandDna,
        lead: newLead
      });
    }
    
    // Check if this venue was previously deleted
    const venueName = (newLead as any).nombre_sala || '';
    let warningMsg = null;
    if (venueName) {
      const deletedMatch = await dbCheckDeletedLead(venueName, userBandId);
      if (deletedMatch) {
        warningMsg = `⚠️ Advertencia: "${venueName}" ya había sido eliminada previamente del CRM. Se ha vuelto a añadir, pero constaba como descartada/ruido.`;
      }
    }

    const saved = await dbUpsertLead(newLead, userBandId);

    // Also update state immediately so UI state reflects new lead
    const freshState = loadState();
    freshState.leads = freshState.leads || [];
    const idx = freshState.leads.findIndex((l: any) => l.id === saved.id);
    if (idx !== -1) {
      freshState.leads[idx] = saved;
    } else {
      freshState.leads.push(saved);
    }
    saveState(freshState);

    // Fire autoEnrichLead in background so request returns instantly
    autoEnrichLead(saved, userBandId).catch(err => console.error("Error autoEnrichLead background:", err));

    res.json({ success: true, lead: saved, warning: warningMsg });
  } catch (error: any) {
    console.error("Error in POST /api/leads:", error);
    res.status(500).json({ error: error?.message || "Error al crear la sala." });
  }
});

// Delete a lead
router.delete("/leads/:id", requireAuth, async (req, res) => {
  try {
    const userBandId = (req as any).user?.band_id ;
    const { id } = req.params;
    await dbDeleteLead(id, userBandId);

    const state = loadState();
    if (state.leads) {
      state.leads = state.leads.filter((l: any) => l.id !== id);
      saveState(state);
    }

    res.json({ success: true, message: "Sala o medio eliminado correctamente y guardado en la lista negra de descartados." });
  } catch (error: any) {
    console.error("Error in DELETE /api/leads/:id:", error);
    res.status(500).json({ error: error?.message || "Error al eliminar la sala." });
  }
});

// Helper to check if URL is a generic directory or social profile instead of official venue site

export default router;
