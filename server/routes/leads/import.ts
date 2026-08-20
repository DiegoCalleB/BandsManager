import express, { Request, Response } from "express";
import { Lead } from "../../../src/types.js";
import { loadState, saveState } from "../../state.js";
import { dbUpsertLead, dbCheckDeletedLead } from "../../db.js";

const router = express.Router();

router.post("/import-excel", async (req: Request, res: Response) => {
  try {
    const { leads, updateDuplicates = true, sourceName = "Importación Excel / CSV" } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: "No se han proporcionado contactos para importar." });
    }

    const userBandId = (req as any).user?.band_id;
    const state = loadState();
    let importedCount = 0;
    let updatedCount = 0;
    const newlyAddedLeads: Lead[] = [];
    const nowStr = new Date().toISOString().split('T')[0];

    for (const rawLead of leads) {
      const nombreSala = (rawLead.nombre_sala || rawLead.nombre || "").trim();
      if (!nombreSala) continue;

      // Check if lead was previously deleted / blacklisted
      const isDeleted = await dbCheckDeletedLead(nombreSala, userBandId);
      if (isDeleted) {
        console.log(`[Import Excel] Omitiendo ${nombreSala} por lista negra.`);
        continue;
      }

      // Check existing lead
      const existing = state.leads.find((l: any) => 
        l.nombre_sala.toLowerCase().trim() === nombreSala.toLowerCase().trim() &&
        (!l.ciudad || !rawLead.ciudad || l.ciudad.toLowerCase().trim() === (rawLead.ciudad || "").toLowerCase().trim())
      );

      if (existing) {
        if (updateDuplicates) {
          let updated = false;
          if (!existing.email_contacto && rawLead.email_contacto) {
            existing.email_contacto = rawLead.email_contacto.trim();
            updated = true;
          }
          if (!existing.telefono && rawLead.telefono) {
            existing.telefono = String(rawLead.telefono).trim();
            updated = true;
          }
          if (!existing.website && rawLead.website) {
            existing.website = rawLead.website.trim();
            updated = true;
          }
          if (!existing.instagram && rawLead.instagram) {
            existing.instagram = rawLead.instagram.trim();
            updated = true;
          }
          if (!existing.direccion && rawLead.direccion) {
            existing.direccion = rawLead.direccion.trim();
            updated = true;
          }
          if ((!existing.aforo || existing.aforo === 0) && rawLead.aforo) {
            existing.aforo = Number(rawLead.aforo) || existing.aforo;
            updated = true;
          }
          if (!existing.contacto_nombre && rawLead.contacto_nombre) {
            existing.contacto_nombre = rawLead.contacto_nombre.trim();
            updated = true;
          }
          if (rawLead.notas && !existing.notas?.includes(rawLead.notas)) {
            existing.notas = `${existing.notas || ''}\n[Nota Excel]: ${rawLead.notas}`.trim();
            updated = true;
          }

          if (updated) {
            await dbUpsertLead(existing, userBandId);
            updatedCount++;
          }
        }
      } else {
        // Normalizar categoría
        let resolvedType: string = (rawLead.tipo || "sala").toLowerCase().trim();
        if (resolvedType.includes('ayuntamiento') || resolvedType.includes('institucion') || resolvedType.includes('ayto') || resolvedType.includes('festejo') || resolvedType.includes('cultura')) resolvedType = 'ayuntamiento';
        else if (resolvedType.includes('discoteca') || resolvedType.includes('club')) resolvedType = 'discoteca';
        else if (resolvedType.includes('teatro')) resolvedType = 'teatro';
        else if (resolvedType.includes('festival') || resolvedType.includes('feria') || resolvedType.includes('ciclo')) resolvedType = 'festival';
        else if (resolvedType.includes('grupo') || resolvedType.includes('banda') || resolvedType.includes('artista')) resolvedType = 'grupo';
        else if (resolvedType.includes('agencia') || resolvedType.includes('management') || resolvedType.includes('manager') || resolvedType.includes('promotor')) resolvedType = 'agencia';
        else if (resolvedType.includes('sello') || resolvedType.includes('discografica') || resolvedType.includes('editorial')) resolvedType = 'sello';
        else if (resolvedType.includes('medio') || resolvedType.includes('prensa') || resolvedType.includes('radio') || resolvedType.includes('podcast')) resolvedType = 'medio';
        else resolvedType = 'sala';

        const defaultIcon = resolvedType === 'festival' ? '🎪' :
                            resolvedType === 'discoteca' ? '🪩' :
                            resolvedType === 'teatro' ? '🎭' :
                            resolvedType === 'grupo' ? '🎸' :
                            resolvedType === 'agencia' ? '💼' :
                            resolvedType === 'sello' ? '💿' :
                            resolvedType === 'medio' ? '📻' :
                            resolvedType === 'ayuntamiento' ? '🏛️' : '🏛️';

        const parsedAforo = Number(rawLead.aforo);

        const newLead: Lead = {
          id: `excel-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          band_id: userBandId,
          nombre_sala: nombreSala,
          ciudad: (rawLead.ciudad || "España").trim(),
          region: (rawLead.region || "España").trim(),
          direccion: (rawLead.direccion || "").trim(),
          aforo: !isNaN(parsedAforo) && parsedAforo > 0 ? parsedAforo : (resolvedType === 'sala' ? 250 : 0),
          genero: (rawLead.genero || (resolvedType === 'ayuntamiento' ? 'Fiestas Patronales / Cultura' : 'Música en Directo / Variado')).trim(),
          tipo: resolvedType as any,
          email_contacto: (rawLead.email_contacto || rawLead.email || "").trim(),
          telefono: String(rawLead.telefono || "").trim(),
          instagram: (rawLead.instagram || "").trim(),
          website: (rawLead.website || "").trim(),
          contacto_nombre: (rawLead.contacto_nombre || rawLead.contacto || "").trim(),
          fuente: sourceName,
          estado: (rawLead.estado || "nuevo").toLowerCase().trim() as any,
          pitch_generado: (rawLead.pitch_generado || "").trim(),
          notas: (rawLead.notas || `Importado desde archivo Excel / CSV el ${nowStr}.`).trim(),
          icono: rawLead.icono || defaultIcon,
          imagen_url: rawLead.imagen_url || ""
        };

        state.leads.push(newLead);
        await dbUpsertLead(newLead, userBandId);
        newlyAddedLeads.push(newLead);
        importedCount++;
      }
    }

    saveState(state);

    return res.json({
      success: true,
      importedCount,
      updatedCount,
      totalLeads: state.leads.length,
      leads: newlyAddedLeads
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/import-excel:", error);
    res.status(500).json({ error: error?.message || "Error al procesar el archivo Excel / CSV." });
  }
});

export default router;
