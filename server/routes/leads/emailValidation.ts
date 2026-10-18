// Validación de emails de leads (`/validate-emails`).

import express from "express";
import { requireAuth, loadState } from "../../state.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import { isValidEmailSyntax, isValidEmailCached } from "../../utils/emailValidator.js";
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';
import { responderError } from '../../utils/errorHttp.js';

const router = express.Router();

/**
 * Valida emails en bulk para todos los leads de una banda
 * Devuelve mapa: { leadId: isValid }
 */
router.get("/validate-emails", requireAuth, async (req, res) => {
  try {
    const state = await loadState();
    const bandId = getTargetBandId(req);
    const leads = state.leads?.filter((l) => l.band_id === bandId) || [];

    const validities: Record<string, boolean> = {};

    // Validar en paralelo pero con límite para no saturar DNS
    const emailsToValidate = leads
      .filter((l) => l.email || l.email_contacto)
      .slice(0, 100); // Máx 100 para no saturar

    await Promise.all(
      emailsToValidate.map(async (lead) => {
        const email = lead.email || lead.email_contacto;
        if (!isValidEmailSyntax(email)) {
          validities[lead.id] = false;
          return;
        }
        validities[lead.id] = await isValidEmailCached(email);
      })
    );

    // Leads sin email = inválido
    for (const lead of leads) {
      if (!lead.email && !lead.email_contacto) {
        validities[lead.id] = false;
      }
    }

    res.json({ success: true, validities });
  } catch (errorCapturado) {
    const error = comoErrorCapturado(errorCapturado);
    console.error("Error in GET /api/leads/validate-emails:", error);
    responderError(res, error, "Error validating emails");
  }
});

export default router;
