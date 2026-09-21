/**
 * Endpoint público de baja de emails comerciales (LSSICE art. 21, España).
 *
 * Uso: GET /api/leads/unsubscribe?token=<unsubscribe_token>
 *
 * Respuesta esperada:
 * - 200: Baja procesada correctamente
 * - 400: Token inválido o lead ya marcado como no_interesado
 * - 404: Token no encontrado
 */

import { Router, Request, Response } from "express";
import { getSupabase } from "../../db/core.js";

const router = Router();

router.get("/unsubscribe", async (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) {
    return res.status(400).json({
      error: "Token inválido",
      message: "Se requiere parámetro 'token' en la URL"
    });
  }

  try {
    const sb = getSupabase();

    // 1. Buscar el mensaje por token
    const { data: messageData, error: msgError } = await sb
      .from("lead_messages")
      .select("id, lead_id, band_id")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (msgError) {
      console.error("Error buscando lead_message por token:", msgError);
      return res.status(500).json({ error: "Error interno" });
    }

    if (!messageData) {
      return res.status(404).json({
        error: "Token no encontrado",
        message: "El enlace de baja ya no es válido o ha sido utilizado"
      });
    }

    const { lead_id, band_id } = messageData;

    // 2. Verificar estado del lead antes de cambiar
    const { data: leadData, error: leadError } = await sb
      .from("leads")
      .select("id, estado")
      .eq("id", lead_id)
      .eq("band_id", band_id)
      .maybeSingle();

    if (leadError || !leadData) {
      console.error("Error leyendo lead:", leadError);
      return res.status(500).json({ error: "Error interno" });
    }

    if (leadData.estado === "no_interesado") {
      return res.status(400).json({
        error: "Ya dado de baja",
        message: "Este lead ya fue marcado como no interesado"
      });
    }

    // 3. Marcar lead como no_interesado y el mensaje como bajado
    const { error: updateError } = await sb
      .from("leads")
      .update({ estado: "no_interesado" })
      .eq("id", lead_id)
      .eq("band_id", band_id);

    if (updateError) {
      console.error("Error actualizando lead:", updateError);
      return res.status(500).json({ error: "Error al procesar baja" });
    }

    // 4. Registrar timestamp de baja en el mensaje
    const { error: msgUpdateError } = await sb
      .from("lead_messages")
      .update({ unsubscribe_timestamp: new Date().toISOString() })
      .eq("id", messageData.id);

    if (msgUpdateError) {
      console.warn("Advertencia: no se pudo registrar timestamp de baja:", msgUpdateError);
      // No es bloqueante, el lead ya se marcó como no_interesado
    }

    // 5. Respuesta amigable (HTML simple)
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Baja procesada</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 2rem; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #333; }
          p { color: #666; line-height: 1.6; }
          .success { color: #27ae60; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Baja procesada</h1>
          <p>Hemos registrado tu solicitud de baja en nuestra base de datos. No recibirás más propuestas de esta sala en el futuro.</p>
          <p>Si tienes dudas, contacta con el soporte de BandManager.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error en endpoint unsubscribe:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
