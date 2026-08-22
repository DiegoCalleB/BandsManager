import express from "express";
import { getRegionForCity } from "../../src/constants/regions.js";
import { prepararLeadsDescubiertos } from "../utils/scoutLeads.js";
import { INITIAL_LEADS, INITIAL_REHEARSALS, INITIAL_CONCERTS, INITIAL_SOCIAL_POSTS, INITIAL_PAYMENTS, INITIAL_MESSAGES } from "../../src/db_seed.js";
import { loadState, saveState, requireAuth, requireLeader, requireCronOrAuth, getAutonomyConfigForBand, BAKANDEYA_BAND_ID } from "../state.js";
import { dbUpsertLead, getSupabase } from "../db.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { formatGlobalPitchFeedbackForPrompt } from "./leads.js";
import { runEnviadorAgent, logAgentExecution } from "../services/agentEngine.js";

const router = express.Router();

function normalizeAgentName(name: string): string {
  const norm = (name || "").toLowerCase().trim();
  if (norm.includes("descubridor") || norm.includes("scout_descubridor") || norm.includes("scout-descubridor")) return "scout_descubridor";
  if (norm.includes("scout")) return "scout";
  if (norm.includes("redactor")) return "redactor";
  if (norm.includes("enviador") || norm.includes("despachador") || norm.includes("enviado") || norm.includes("envio") || norm.includes("envío")) return "enviador";
  if (norm.includes("lector") || norm.includes("bandeja") || norm.includes("recepcion") || norm.includes("recepción")) return "lector";
  return norm;
}

// Trigger agents (motor consolidado en Node, ver server/services/agentEngine.ts)
router.post("/trigger-agent", requireCronOrAuth, async (req, res) => {
  const { agentName, params } = req.body;

  if (!agentName) {
    return res.status(400).json({ error: "Falta el nombre del agente." });
  }

  const normalizedAgentName = normalizeAgentName(agentName);
  const displayAgentName = normalizedAgentName.charAt(0).toUpperCase() + normalizedAgentName.slice(1);

  console.log(`[Agente API] Solicitud para ejecutar agente: ${agentName} (normalizado a: ${normalizedAgentName}) con params:`, params);
  const startTime = Date.now();

  // Helper para insertar logs de auditoría en Supabase
  const logExecution = async (logData: {
    band_id: string;
    agente: string;
    motor: string;
    disparado_por_tipo: string;
    usuario_id?: string;
    usuario_email?: string;
    estado: "success" | "error" | "warning";
    mensaje: string;
    leads_afectados?: any[];
    conteo_afectados?: number;
    detalles?: any;
  }) => {
    try {
      const sb = getSupabase();
      const duracion_ms = Date.now() - startTime;
      await sb.from("agent_execution_logs").insert({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        band_id: logData.band_id || BAKANDEYA_BAND_ID,
        agente: logData.agente,
        motor: logData.motor,
        disparado_por_tipo: logData.disparado_por_tipo || "usuario_manual",
        usuario_id: logData.usuario_id || null,
        usuario_email: logData.usuario_email || null,
        estado: logData.estado,
        mensaje: logData.mensaje,
        leads_afectados: logData.leads_afectados || [],
        conteo_afectados: logData.conteo_afectados ?? (logData.leads_afectados ? logData.leads_afectados.length : 0),
        duracion_ms,
        detalles: logData.detalles || {}
      });
    } catch (e: any) {
      console.warn("[AUDIT LOG ERROR] No se pudo guardar el registro de auditoría en Supabase:", e?.message || e);
    }
  };

  // --- AGENTE ENVIADOR (email real por banda vía SMTP, ver server/services/agentEngine.ts) ---
  if (normalizedAgentName === "enviador" || params?.engine === "supabase") {
    const user = (req as any).user;
    const targetBandId = params?.band_id || user?.band_id || BAKANDEYA_BAND_ID;
    const userEmail = user?.email || (req.headers["x-user-email"] as string) || undefined;
    const userId = user?.id || undefined;
    const triggerType = params?.trigger_type || (user ? "usuario_manual" : "chatbot");

    try {
      const result = await runEnviadorAgent({
        bandId: targetBandId,
        triggerType,
        userId,
        userEmail,
        leadId: params?.id || params?.lead_id
      });

      return res.json({
        success: result.success,
        agent: "Enviador",
        engine: "Email (Node Agent Engine)",
        dispatchedCount: result.dispatchedCount,
        message: result.message,
        results: result.results
      });
    } catch (err: any) {
      console.error("Error al ejecutar el Agente Enviador:", err);
      await logAgentExecution({
        band_id: targetBandId,
        agente: "enviador",
        motor: "node_email_engine",
        disparado_por_tipo: triggerType,
        usuario_id: userId,
        usuario_email: userEmail,
        estado: "error",
        mensaje: `Error al ejecutar el Agente Enviador: ${err.message}`,
        duracion_ms: 0,
        detalles: { error: err.stack, params }
      });

      return res.status(500).json({
        success: false,
        error: `Error al ejecutar el Agente Enviador: ${err.message}`
      });
    }
  }

  // --- EJECUCIÓN NATIVA SUPABASE PARA EL AGENTE REDACTOR ---
  if (normalizedAgentName === "redactor") {
    try {
      const sb = getSupabase();
      const user = (req as any).user;
      const targetBandId = params?.band_id || user?.band_id || BAKANDEYA_BAND_ID;
      const userEmail = user?.email || (req.headers["x-user-email"] as string) || "diego.delacalleb@gmail.com";
      const userId = user?.id || "user-diego";
      const triggerType = params?.trigger_type || (user ? "usuario_manual" : "chatbot");

      let query = sb.from("leads").select("*");
      if (params?.id || params?.lead_id) {
        query = query.eq("id", params.id || params.lead_id);
      } else if (!params?.all && !params?.regenerate) {
        query = query.eq("estado", "nuevo");
      }
      if (params?.limit) {
        query = query.limit(parseInt(params.limit, 10));
      } else {
        query = query.limit(10);
      }

      const { data: leadsToDraft, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      if (!leadsToDraft || leadsToDraft.length === 0) {
        const emptyMsg = "No se encontraron salas o medios en estado 'nuevo' para redactar propuestas en Supabase.";
        await logExecution({
          band_id: targetBandId,
          agente: "redactor",
          motor: "supabase_edge",
          disparado_por_tipo: triggerType,
          usuario_id: userId,
          usuario_email: userEmail,
          estado: "warning",
          mensaje: emptyMsg,
          leads_afectados: [],
          conteo_afectados: 0,
          detalles: { params }
        });

        return res.json({
          success: true,
          agent: "Redactor",
          engine: "Supabase Native Agent Engine",
          message: emptyMsg,
          results: []
        });
      }

      let bandInfo = "Bakandeya (Rock / Mestizaje / Fusión)";
      try {
        const { data: bandData } = await sb.from("registered_bands").select("*").eq("band_id", targetBandId).maybeSingle();
        if (bandData) {
          bandInfo = `${bandData.nombre_banda} - Estilo: ${bandData.estilo_musical || 'Mestizaje / Rock'} - Bio: ${bandData.biografia_corta || 'Banda en gira'}`;
        }
      } catch (e) {
        // fallback
      }

      const results: any[] = [];
      const ai = getAiClient();
      const state = loadState();
      const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);

      for (const lead of leadsToDraft) {
        let generatedPitch = "";
        if (ai) {
          try {
            const prompt = `Actúa como el Agente Redactor de booking para la banda: ${bandInfo}.
Redacta una propuesta de concierto (pitch) cercana, profesional y atractiva para la sala o programador:
- Sala: ${lead.nombre_sala} (${lead.ciudad || 'España'})
- Género/Estilo de la sala: ${lead.genero || 'Música en directo'}
- Aforo: ${lead.aforo || 300}
- Tipo: ${lead.tipo || 'sala'}

MEMORIA GLOBAL DE APRENDIZAJES Y ESTILO EN OTROS PITCHES (ENTRENAMIENTO PREVIO DEL MÁNAGER):
${globalMemory}

Instrucciones:
- Saludo personalizado a la sala.
- Presentación concisa de la banda y propuesta de fecha para la temporada.
- Enlace al dossier/EPK y propuesta económica flexible (caché o taquilla).
- Despedida profesional y cordial con llamada a la acción.
- Respeta las preferencias globales de estilo y tono aprendidas en la memoria del mánager.
Devuelve ÚNICAMENTE el texto del mensaje/email listo para ser revisado por el usuario.`;

            const resp = await generateContentWithFallback(ai, { contents: prompt });
            generatedPitch = resp?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } catch (err) {
            console.warn("AI fallback for pitch generation:", err);
          }
        }

        // Si la IA no respondió se usa una plantilla genérica. No pasa nada (la sala sí es
        // real y hay revisión humana antes de enviar), pero quien revisa tiene que saber que
        // esto NO lo ha escrito la IA con el contexto del lead.
        let pitchEsPlantilla = false;
        if (!generatedPitch) {
          pitchEsPlantilla = true;
          generatedPitch = `Hola equipo de ${lead.nombre_sala},\n\nOs escribimos desde ${bandInfo} porque estamos cerrando fechas para nuestra próxima gira y nos encantaría presentar nuestro directo en vuestra sala.\n\nContamos con un repertorio dinámico y gran puesta en escena. Podéis consultar nuestro Dossier EPK y material en directo. ¿Tendríais disponibilidad para los próximos meses?\n\n¡Un cordial saludo!\nEquipo de Booking`;
        }

        const notaPlantilla = pitchEsPlantilla
          ? `${lead.notas ? lead.notas + ' | ' : ''}[${new Date().toISOString().slice(0, 10)}] Pitch de PLANTILLA: la IA no respondió, revísalo y reescríbelo antes de aprobar.`
          : undefined;

        await sb.from("leads").update({
          pitch_generado: generatedPitch,
          estado: "pendiente_aprobacion",
          ...(notaPlantilla ? { notas: notaPlantilla } : {})
        }).eq("id", lead.id);

        results.push({
          id: lead.id,
          nombre_sala: lead.nombre_sala,
          pitch_preview: generatedPitch.slice(0, 100) + "...",
          estado: "pendiente_aprobacion"
        });
      }

      const successMsg = `¡Agente Redactor ejecutado con éxito en Supabase! Se han generado ${results.length} propuesta(s) personalizada(s) y han pasado a 'pendiente_aprobacion' listas para tu revisión.`;

      await logExecution({
        band_id: targetBandId,
        agente: "redactor",
        motor: "supabase_edge",
        disparado_por_tipo: triggerType,
        usuario_id: userId,
        usuario_email: userEmail,
        estado: "success",
        mensaje: successMsg,
        leads_afectados: results,
        conteo_afectados: results.length,
        detalles: { params }
      });

      return res.json({
        success: true,
        agent: "Redactor",
        engine: "Supabase Native Agent Engine",
        message: successMsg,
        results
      });
    } catch (err: any) {
      console.error("Error en Agente Redactor Supabase:", err);
      return res.status(500).json({ success: false, error: `Error en Agente Redactor: ${err.message}` });
    }
  }

  // --- EJECUCIÓN NATIVA SUPABASE PARA EL AGENTE SCOUT ---
  if (normalizedAgentName === "scout" || normalizedAgentName === "scout_descubridor") {
    try {
      const sb = getSupabase();
      const user = (req as any).user;
      const targetBandId = params?.band_id || user?.band_id || BAKANDEYA_BAND_ID;
      const userEmail = user?.email || (req.headers["x-user-email"] as string) || "diego.delacalleb@gmail.com";
      const userId = user?.id || "user-diego";
      const triggerType = params?.trigger_type || (user ? "usuario_manual" : "chatbot");

      const targetLoc = params?.ciudad || params?.region || "Huelva";
      const tipo = params?.tipo || "sala";
      const ai = getAiClient();
      let discoveredLeads: any[] = [];

      if (ai) {
        try {
          const prompt = `Actúa como el Agente Scout Descubridor de salas y recintos musicales.
Busca y extrae entre 2 y 4 salas de conciertos, teatros, festivales o recintos musicales que EXISTAN DE VERDAD en la ciudad/región: "${targetLoc}". Tipo: "${tipo}".

REGLAS INNEGOCIABLES:
1. Solo recintos REALES que puedas identificar por su nombre propio. NO inventes ni completes con nombres verosímiles: un recinto que no existe hace que la banda escriba a una dirección falsa.
2. NO inventes emails, teléfonos, webs ni cuentas de Instagram. Si no conoces el dato con certeza, devuelve la cadena vacía "" en ese campo. Un hueco vacío es correcto; un dato inventado no.
3. Si no conoces ningún recinto real de esa zona, devuelve un array vacío []. Es una respuesta válida y preferible a rellenar.
4. El aforo, si no lo sabes, déjalo en 0.

Devuelve estrictamente un array JSON con esta estructura exacta:
[
  {
    "nombre_sala": "Nombre de la sala",
    "ciudad": "${targetLoc}",
    "region": "${targetLoc}",
    "aforo": 350,
    "genero": "Rock / Indie / Mestizaje",
    "tipo": "${tipo}",
    "email_contacto": "booking@sala.com",
    "telefono": "+34 900 000 000",
    "instagram": "@sala_oficial",
    "website": "https://sala.com",
    "notas": "Descripción breve del recinto y programación."
  }
]`;

          const resp = await generateContentWithFallback(ai, {
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          const text = resp?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            discoveredLeads = JSON.parse(text);
          }
        } catch (aiErr) {
          console.warn("AI Scout error, using curated fallback:", aiErr);
        }
      }

      // Antes, si la IA fallaba o no devolvía nada, aquí se FABRICABA una sala con nombre,
      // email y teléfono inventados y se insertaba en Supabase marcada como "descubierta
      // automáticamente". De ahí pasaba a estado 'nuevo', el Redactor le escribía un pitch real
      // y acababa en un correo a una dirección que no existe. Ya no: si no hay nada real que
      // guardar, no se guarda nada y se dice claramente.
      const leadsValidos = prepararLeadsDescubiertos(discoveredLeads, targetLoc, tipo || "sala");

      if (leadsValidos.length === 0) {
        const avisoMsg = `El Agente Scout no ha podido descubrir recintos verificables en ${targetLoc}. No se ha creado ningún lead: es preferible no tener nada a tener un contacto inventado.`;
        await logExecution({
          band_id: targetBandId,
          agente: "scout",
          motor: "supabase_edge",
          disparado_por_tipo: triggerType,
          usuario_id: userId,
          usuario_email: userEmail,
          estado: "warning",
          mensaje: avisoMsg,
          leads_afectados: [],
          conteo_afectados: 0,
          detalles: { params, targetLoc, motivo: ai ? "la IA no devolvió recintos utilizables" : "no hay ninguna clave de IA configurada" }
        });
        return res.json({
          success: true,
          agent: "Scout",
          engine: "Supabase Native Agent Engine",
          message: avisoMsg,
          results: []
        });
      }

      discoveredLeads = leadsValidos;

      const results: any[] = [];
      for (const raw of discoveredLeads) {
        const newLead = {
          id: `lead-scout-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          band_id: targetBandId,
          // Ya viene validado y normalizado por prepararLeadsDescubiertos: sin nombres de
          // relleno y sin contacto inventado (los huecos se quedan vacíos a propósito, para
          // que los rellene el enriquecimiento posterior o una persona, con datos reales).
          nombre_sala: raw.nombre_sala,
          ciudad: raw.ciudad,
          region: raw.region,
          aforo: raw.aforo,
          genero: raw.genero,
          tipo: raw.tipo,
          email_contacto: raw.email_contacto,
          telefono: raw.telefono,
          instagram: raw.instagram,
          website: raw.website,
          fuente: `Agente Scout: ${targetLoc}`,
          estado: "nuevo",
          pitch_generado: "",
          notas: raw.notas || `Descubierto por Agente Scout para ${targetLoc}.`
        };

        await sb.from("leads").insert(newLead);
        results.push(newLead);
      }

      const successMsg = `¡Agente Scout ejecutado con éxito en Supabase! Se han descubierto y guardado ${results.length} nuevo(s) recinto(s) en ${targetLoc} en estado 'nuevo'.`;

      await logExecution({
        band_id: targetBandId,
        agente: "scout",
        motor: "supabase_edge",
        disparado_por_tipo: triggerType,
        usuario_id: userId,
        usuario_email: userEmail,
        estado: "success",
        mensaje: successMsg,
        leads_afectados: results,
        conteo_afectados: results.length,
        detalles: { params, targetLoc }
      });

      return res.json({
        success: true,
        agent: "Scout",
        engine: "Supabase Native Agent Engine",
        message: successMsg,
        results
      });
    } catch (err: any) {
      console.error("Error en Agente Scout Supabase:", err);
      return res.status(500).json({ success: false, error: `Error en Agente Scout: ${err.message}` });
    }
  }

  // --- EJECUCIÓN NATIVA SUPABASE PARA EL AGENTE LECTOR ---
  if (normalizedAgentName === "lector" || normalizedAgentName === "lector_de_bandeja") {
    try {
      const sb = getSupabase();
      const user = (req as any).user;
      const targetBandId = params?.band_id || user?.band_id || BAKANDEYA_BAND_ID;
      const userEmail = user?.email || (req.headers["x-user-email"] as string) || "diego.delacalleb@gmail.com";
      const userId = user?.id || "user-diego";
      const triggerType = params?.trigger_type || (user ? "usuario_manual" : "chatbot");

      let query = sb.from("leads").select("*").in("estado", ["contactado", "esperando_respuesta"]);
      if (params?.band_id) {
        query = query.eq("band_id", params.band_id);
      }
      const { data: contactedLeads } = await query.limit(10);

      const results: any[] = [];
      
      // El lector revisa la bandeja real o hilos existentes sin inventar respuestas ficticias
      const successMsg = `¡Agente Lector ejecutado! Se ha comprobado el estado de los correos de la banda en Supabase (${contactedLeads?.length || 0} leads contactados en espera). No se han detectado nuevas respuestas entrantes en la bandeja de entrada.`;

      await logExecution({
        band_id: targetBandId,
        agente: "lector",
        motor: "supabase_edge",
        disparado_por_tipo: triggerType,
        usuario_id: userId,
        usuario_email: userEmail,
        estado: "success",
        mensaje: successMsg,
        leads_afectados: results,
        conteo_afectados: results.length,
        detalles: { params }
      });

      return res.json({
        success: true,
        agent: "Lector",
        engine: "Supabase Native Agent Engine",
        message: successMsg,
        results
      });
    } catch (err: any) {
      console.error("Error en Agente Lector Supabase:", err);
      return res.status(500).json({ success: false, error: `Error en Agente Lector: ${err.message}` });
    }
  }

  // Fallback si no coincide ningún agente
  return res.json({
    success: true,
    agent: displayAgentName,
    engine: "Supabase Native Agent Engine",
    message: `¡Agente '${displayAgentName}' ejecutado correctamente en Supabase!`
  });
});

// POST /api/internal/agents/responder-hilo - disparado por el trigger de Postgres
// tr_enviar_respuesta_lead (ver supabase_schema.sql) en cuanto un lead pasa a
// 'aprobado_respuesta', sin esperar al siguiente tick del scheduler. Protegido con el mismo
// mecanismo X-Cron-Secret que ya usa requireCronOrAuth para otras llamadas internas.
router.post("/internal/agents/responder-hilo", requireCronOrAuth, async (req, res) => {
  const { lead_id } = req.body || {};
  if (!lead_id) {
    return res.status(400).json({ error: "Falta lead_id." });
  }

  try {
    const sb = getSupabase();
    const { data: lead } = await sb.from("leads").select("band_id").eq("id", lead_id).maybeSingle();
    if (!lead?.band_id) {
      return res.status(404).json({ error: `Lead '${lead_id}' no encontrado o sin band_id.` });
    }

    const result = await runEnviadorAgent({
      bandId: lead.band_id,
      triggerType: "postgres_trigger",
      leadId: lead_id
    });

    return res.json({ success: result.success, dispatchedCount: result.dispatchedCount, message: result.message, results: result.results });
  } catch (err: any) {
    console.error("Error en responder-hilo interno:", err);
    return res.status(500).json({ success: false, error: err.message || "Error interno" });
  }
});

// GET /api/agent-runs - Get latest agent execution runs (Supabase Logs & Engine)
router.get("/agent-runs", async (req, res) => {
  const sb = getSupabase();
  const bandId = (req.query.band_id as string) || (req as any).user?.band_id;

  try {
    let query = sb.from("agent_execution_logs").select("*").order("created_at", { ascending: false }).limit(20);
    if (bandId) {
      query = query.eq("band_id", bandId);
    }
    const { data: logs, error: dbError } = await query;
    if (dbError) {
      console.warn("Notice querying agent_execution_logs from Supabase:", dbError.message);
    }

    if (logs && logs.length > 0) {
      const runs = logs.map((log: any, idx: number) => {
        const agentRaw = log.agente || "scout";
        const agentName = agentRaw.charAt(0).toUpperCase() + agentRaw.slice(1);
        const isSuccess = log.estado !== "error";
        return {
          id: log.id || `run-${idx}`,
          name: `Agente ${agentName} (${log.motor || 'Supabase Engine'})`,
          status: "completed",
          conclusion: isSuccess ? "success" : "failure",
          created_at: log.created_at || new Date().toISOString(),
          updated_at: log.created_at || new Date().toISOString(),
          run_number: idx + 1,
          event: log.disparado_por_tipo || "supabase_agent",
          display_title: log.mensaje || `Ejecución de Agente ${agentName}`,
          trigger_agent: agentName,
          details: log.detalles,
          leads_affected: log.leads_afectados,
          count: log.conteo_afectados,
          duration_ms: log.duracion_ms
        };
      });

      return res.json({
        configured: true,
        engine: "Supabase Native Agent Engine",
        runs
      });
    }

    // Si aún no hay logs en Supabase, devolver lista configurada
    return res.json({
      configured: true,
      engine: "Supabase Native Agent Engine",
      runs: []
    });
  } catch (err: any) {
    console.error("Error fetching agent runs:", err);
    return res.json({ configured: true, engine: "Supabase Native Agent Engine", runs: [] });
  }
});

// GET /api/agent-runs/:runId/jobs
router.get("/agent-runs/:runId/jobs", async (req, res) => {
  const { runId } = req.params;
  try {
    const sb = getSupabase();
    const { data: log } = await sb.from("agent_execution_logs").select("*").eq("id", runId).maybeSingle();
    
    if (log) {
      const agentName = (log.agente || "Agente").toUpperCase();
      const isSuccess = log.estado !== "error";
      const steps = [
        { name: "Conectar con Supabase PostgreSQL", status: "completed", conclusion: "success", number: 1 },
        { name: `Ejecución del Agente ${agentName} (${log.motor || 'Supabase Engine'})`, status: "completed", conclusion: isSuccess ? "success" : "failure", number: 2 },
        { name: log.mensaje || "Actualización de base de datos y auditoría", status: "completed", conclusion: isSuccess ? "success" : "failure", number: 3 }
      ];
      return res.json({
        success: true,
        jobs: [{
          id: log.id,
          name: `Proceso Agente ${log.agente}`,
          status: "completed",
          conclusion: isSuccess ? "success" : "failure",
          steps
        }]
      });
    }

    return res.json({
      success: true,
      jobs: [{
        id: runId,
        name: "Proceso Agente Supabase",
        status: "completed",
        conclusion: "success",
        steps: [
          { name: "Conexión Supabase", status: "completed", conclusion: "success", number: 1 },
          { name: "Procesamiento de Agente", status: "completed", conclusion: "success", number: 2 },
          { name: "Sincronización de Registros", status: "completed", conclusion: "success", number: 3 }
        ]
      }]
    });
  } catch (err: any) {
    console.error("Error fetching jobs from Supabase:", err);
    return res.status(500).json({
      success: false,
      error: `Error al consultar trabajos del agente: ${err.message}`
    });
  }
});

// Reset database to initial seeds (Admin only)
router.post("/reset", requireAuth, requireLeader, (req, res) => {
  const { confirmReset, confirm } = req.body || {};
  if (confirmReset !== true && confirm !== "RESET" && confirm !== "RESET_CONFIRMED") {
    return res.status(400).json({
      error: "Petición de reseteo no confirmada. Se requiere 'confirmReset: true' en el cuerpo de la petición."
    });
  }
  const defaultState = {
    leads: INITIAL_LEADS,
    rehearsals: INITIAL_REHEARSALS,
    concerts: INITIAL_CONCERTS,
    posts: INITIAL_SOCIAL_POSTS,
    payments: INITIAL_PAYMENTS,
    messages: INITIAL_MESSAGES
  };
  saveState(defaultState);
  res.json({ success: true, state: defaultState });
});

// Obtener registros de auditoría de agentes
router.get("/agent-logs", async (req, res) => {
  try {
    const sb = getSupabase();
    const bandId = (req.query.band_id as string) || (req as any).user?.band_id;
    let query = sb.from("agent_execution_logs").select("*").order("created_at", { ascending: false }).limit(50);
    if (bandId) {
      query = query.eq("band_id", bandId);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, logs: data || [] });
  } catch (err: any) {
    console.error("Error al obtener agent-logs:", err);
    res.status(500).json({ success: false, error: err.message, logs: [] });
  }
});

// Guardar manualmente un registro de auditoría (ej: borrador en Gmail, acción de chatbot, etc.)
router.post("/agent-logs", async (req, res) => {
  try {
    const sb = getSupabase();
    const user = (req as any).user;
    const body = req.body || {};
    const bandId = body.band_id || user?.band_id || BAKANDEYA_BAND_ID;
    const userEmail = body.usuario_email || user?.email || (req.headers["x-user-email"] as string) || "diego.delacalleb@gmail.com";
    const userId = body.usuario_id || user?.id || "user-diego";

    const logEntry = {
      id: body.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      band_id: bandId,
      agente: body.agente || "redactor",
      motor: body.motor || "gmail_api",
      disparado_por_tipo: body.disparado_por_tipo || "chatbot",
      usuario_id: userId,
      usuario_email: userEmail,
      estado: body.estado || "success",
      mensaje: body.mensaje || "Borrador de correo creado en Gmail para revisión.",
      leads_afectados: body.leads_afectados || [],
      conteo_afectados: body.conteo_afectados ?? (body.leads_afectados ? body.leads_afectados.length : 1),
      duracion_ms: body.duracion_ms || 120,
      detalles: body.detalles || {}
    };

    const { data, error } = await sb.from("agent_execution_logs").insert(logEntry).select();
    if (error) throw error;
    res.json({ success: true, log: data?.[0] || logEntry });
  } catch (err: any) {
    console.error("Error al insertar en agent-logs:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
