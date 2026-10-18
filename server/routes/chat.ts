// Chatbot de la app (`/chat`) y generación de copys para Reels (`/write-reels-copy`, con
// `iaRateLimiter`).

import express from "express";
import { KNOWN_LOCATIONS, CANONICAL_LOCATION_MAP, getRegionForCity } from "../../src/constants/regions.js";
import { Lead, Rehearsal, Concert, Message } from "../../src/types.js";
import { loadState, getUserFromRequestLocal, getEpkConfigForBand, getAutonomyConfigForBand, requireAuth } from "../state.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";
import { getGlobalPitchFeedbackSummary } from "./leads.js";
import { dbGetRegisteredBandById, dbGetEpkConfig, dbGetActiveCampaign, dbGetSongs, dbGetSetlists } from "../db.js";
import { getTargetBandId, bandaDe } from "../utils/bandAccess.js";
import { loadBandProfile, buildBandContextBlock, displayBandName, baseHashtags, emptyBandProfile } from "../utils/bandProfile.js";
import { computeMusicalDna } from "../utils/musicalDna.js";
import { sanearIdeasMelodicas } from "../utils/melodicIdeaValidator.js";
import { iaRateLimiter, chatRateLimiter } from "../middleware/rateLimiter.js";
import { acotarHistorial, agregarTurno, mensajeAceptable } from "../utils/conversacionChat.js";
import { convertFunctionCallsToProposedActions } from "../services/chatTools.js";
import { consultarConLecturas } from "../services/chatLecturas.js";
import { instruccionesChat, contextoDeDatosChat, mensajeConDatos } from "../services/chatPrompt.js";
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';
import { registrarErrorInesperado } from '../utils/errorHttp.js';
import type { AccionPropuesta, CancionParaChat, ParametrosAgenteChat, SetlistParaChat, TurnoChat, VistaRespuestaIA, ErrorDeFailover } from './tiposChat.js';


const router = express.Router();

// requireAuth: el chatbot responde con los leads, los ensayos, los conciertos y el EPK de la
// banda. Sin sesión, `userReq` salía null y todo eso se contestaba sobre la banda por defecto a
// quien preguntara.
router.post("/chat", requireAuth, chatRateLimiter, async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!mensajeAceptable(message)) return res.status(400).json({ error: "El mensaje no es válido o es demasiado largo." });
  const userReq = getUserFromRequestLocal(req);
  // requireAuth ya garantiza que hay banda activa (getUserFromRequest devuelve null si no la
  // hay), pero esta ruta vuelve a resolver el usuario por su cuenta con getUserFromRequestLocal:
  // se repite la comprobación aquí para no depender en silencio de esa garantía y caer en una
  // banda por defecto más abajo si algún día dejara de cumplirse.
  if (!userReq?.band_id) {
    return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
  }
  // El rol sale solo de la sesión. Con el `req.body.userRole` que había de repuesto bastaba
  // mandar userRole:'leader' para saltarse el bloqueo de finanzas y que el bot soltara los cachés.
  const userRole = userReq?.role || "member";
  const isLeader = userRole === "leader";

  const state = loadState();
  const lower = (message || "").toLowerCase().trim();

  // Intercept finance questions for non-leaders immediately
  const isFinanceQuery = /(finanza|dinero|pago|gasto|ingreso|contabilid|cuanto|cuánto|caché|cache|presupuest|balance|caja)/i.test(lower);
  if (!isLeader && isFinanceQuery) {
    return res.json({
      text: "🔒 **Acceso Restringido:** El apartado y los datos de finanzas están restringidos únicamente a los administradores/líderes de la banda.",
      proposedActions: []
    });
  }
  
  // Intercept agent trigger intents to bypass Gemini API completely
  // Only trigger if the user explicitly requests to execute/launch an agent AND NOT asking questions or hypothetical queries
  const isQuestionOrHypothetical = /(\?|¿|y si|qué pasa|que pasa|cómo|como funciona|explica|explicame|qué hace|que hace|podrías explicar|dudas)/i.test(lower);
  const isNegativeAgentIntent = /(no quiero|no ejecutes|sin agentes|no lances|sin lanzar|sin disparar|no dispares|no usar|sin usar agentes|no hace falta agente)/i.test(lower);

  const isExplicitAgentTrigger = !isNegativeAgentIntent && !isQuestionOrHypothetical && (
    (lower.includes("ejecuta") || lower.includes("ejecutar") || lower.includes("lanza") || lower.includes("lanzar") || lower.includes("corre") || lower.includes("correr") || lower.includes("dispara") || lower.includes("disparar") || lower.includes("inicia") || lower.includes("iniciar") || lower.includes("arranca") || lower.includes("arrancar")) &&
    (lower.includes("agente") || lower.includes("scout") || lower.includes("redactor") || lower.includes("enviador") || lower.includes("lector") || lower.includes("descubridor"))
  );

  const isAgentQuery = !isNegativeAgentIntent && !isQuestionOrHypothetical && (isExplicitAgentTrigger || (lower.startsWith("agente ") && (lower.includes("scout") || lower.includes("redactor") || lower.includes("enviador") || lower.includes("lector") || lower.includes("descubridor"))));

  if (isAgentQuery) {
    let agentName = "Enviador";
    let desc = "Disparar el agente de Python Enviador para procesar y enviar los correos de presentación aprobados.";
    
    if (lower.includes("descubridor") || lower.includes("scout_descubridor") || lower.includes("scout-descubridor")) {
      agentName = "Scout Descubridor";
      desc = "Disparar el agente de Python Scout Descubridor para encontrar nuevas salas y festivales.";
    } else if (lower.includes("scout")) {
      agentName = "Scout";
      desc = "Disparar el agente de Python Scout para enriquecer la información de las salas de conciertos.";
    } else if (lower.includes("redactor")) {
      agentName = "Redactor";
      desc = "Disparar el agente de Python Redactor para generar de manera automatizada los borradores de pitch.";
    } else if (lower.includes("lector") || lower.includes("bandeja")) {
      agentName = "Lector";
      desc = "Disparar el agente de Python Lector para revisar tu bandeja de correo en busca de respuestas de salas.";
    }

    const triggerParams: ParametrosAgenteChat = {};

    if (agentName === "Scout Descubridor" || agentName === "Scout") {
      let detectedRegion: string;
      const knownLocations = KNOWN_LOCATIONS;
      const canonicalMapping = CANONICAL_LOCATION_MAP;

      let matchedLocation = "";
      for (const loc of knownLocations) {
        const regex = new RegExp(`\\b${loc}\\b`, 'i');
        if (regex.test(lower)) {
          matchedLocation = loc;
          break;
        }
      }

      if (matchedLocation) {
        const canonical = canonicalMapping[matchedLocation.toLowerCase()] || matchedLocation;
        const regionForCity = getRegionForCity(matchedLocation);
        triggerParams.ciudad = canonical;
        triggerParams.region = regionForCity || canonical;
      } else {
        const regionMatch = req.body.message?.match(/(?:en|para|región|region|provincia|de)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?)/i);
        if (regionMatch && regionMatch[1]) {
          const candidate = regionMatch[1].trim();
          const lowerCand = candidate.toLowerCase();
          if (!["buscar", "hacer", "ejecutar", "salas", "un", "una", "el", "la", "los", "las", "mi", "mis", "este", "esta", "ese", "esa", "agente", "scout", "descubridor", "tipo", "festival", "ayuntamiento", "concierto", "conciertos"].includes(lowerCand)) {
            detectedRegion = candidate.split(/\s+/).map(word => {
              if (["de", "la", "y", "o"].includes(word.toLowerCase())) return word.toLowerCase();
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(" ");
            triggerParams.region = detectedRegion;
            triggerParams.ciudad = detectedRegion;
          }
        }
      }

      if (!triggerParams.region) {
        return res.json({ text: `¿En qué ciudad o región quieres que busque el agente ${agentName}? Por ejemplo: "lanza el scout en Sevilla".` });
      }

      if (agentName === "Scout Descubridor") {
        let detectedTipo = "sala";
        if (lower.includes("festival") || lower.includes("festivales") || lower.includes("festis")) {
          detectedTipo = "festival";
        } else if (lower.includes("ayuntamiento") || lower.includes("ayuntamientos") || lower.includes("pueblo") || lower.includes("municipio") || lower.includes("ayto")) {
          detectedTipo = "ayuntamiento";
        } else if (lower.includes("sala") || lower.includes("salas")) {
          detectedTipo = "sala";
        }
        triggerParams.tipo = detectedTipo;
      }
    }

    let paramText = "";
    const activeBandName = userReq?.bandName || 'tu banda';

    if (agentName === "Scout Descubridor") {
      paramText = `\n\n**Parámetros detectados:**\n- Región: \`${triggerParams.region}\`\n- Tipo de espacio: \`${triggerParams.tipo}\` *(obligatorio, extraído de tu mensaje)*`;
    } else if (agentName === "Scout") {
      paramText = `\n\n**Parámetros detectados:**\n- Región: \`${triggerParams.region}\` *(extraído de tu mensaje)*`;
    }

    return res.json({
      text: `🤖 **Disparador del Agente '${agentName}' Preparado**\n\nHe detectado que quieres ejecutar el agente **${agentName}** para gestionar tus tareas de booking de ${activeBandName}.${paramText}\n\n*Nota: El agente opera de forma nativa e integrada directamente sobre tu base de datos de Supabase.*`,
      proposedActions: [{
        type: "propose_agent_trigger",
        agentName: agentName,
        description: desc,
        params: triggerParams
      }]
    });
  }

  // Allow all general chat messages, email drafting, searches, and questions to go directly to Gemini AI.
  // Gemini receives the full stateSummary in system prompt and can process any request intelligently.

  const client = getAiClient();
  
  if (!client) {
    setTimeout(() => {
      const lowerMsg = message.toLowerCase();
      let reply = "¡Hola! Estoy funcionando en modo simulación (sin clave GEMINI_API_KEY). Puedo responderte de manera estática.\n\n";
      const proposedActions: AccionPropuesta[] = [];
      
      if (lowerMsg.includes("madrid") || lowerMsg.includes("pendiente")) {
        const pendingMadrid = state.leads.filter((l: Lead) => l.ciudad.toLowerCase().includes("madrid") || l.estado === "pendiente_aprobacion");
        reply += `He analizado la base de datos y tienes **${pendingMadrid.length} salas** que coinciden. Por ejemplo, **Sala Apolo** en Barcelona (pendiente de aprobación) y **Sala El Tren** en Granada (pendiente de aprobación). En Madrid tienes a **Ochoymedio Club** como "nuevo".`;
        if (state.leads.some((l: Lead) => l.id === "lead-1" && l.estado === "pendiente_aprobacion")) {
          proposedActions.push({
            type: "propose_lead_approval",
            leadId: "lead-1",
            leadName: "Sala Apolo",
            description: "Aprobar el correo de presentación generado para la mítica Sala Apolo de Barcelona."
          });
        }
      } else if (lowerMsg.includes("resumen") || lowerMsg.includes("estado") || lowerMsg.includes("hoy") || lowerMsg.includes("tareas")) {
        const pendingApp = state.leads.filter((l: Lead) => l.estado === "pendiente_aprobacion").length;
        const newLeads = state.leads.filter((l: Lead) => l.estado === "nuevo").length;
        const interesting = state.leads.filter((l: Lead) => l.estado === "interesado").length;
        reply += `Aquí tienes el resumen de tu bandeja para hoy:\n- Tienes **${pendingApp} correos de presentación pendientes** de revisión en el panel de aprobación.\n- Hay **${newLeads} salas nuevas** recién descubiertas por el agente Scout.\n- Tienes **${interesting} respuestas con interés** pendientes de clasificar o responder.\n\nTe sugiero revisar el correo de **Sala Apolo** o **Sala El Tren** para que el agente Enviador lo mande esta tarde.`;
        if (state.leads.some((l: Lead) => l.id === "lead-3" && l.estado === "pendiente_aprobacion")) {
          proposedActions.push({
            type: "propose_lead_approval",
            leadId: "lead-3",
            leadName: "Sala El Tren",
            description: "Aprobar el correo preparado para Sala El Tren en Granada."
          });
        }
      } else if (lowerMsg.includes("reggae") || lowerMsg.includes("ska")) {
        const userBandId = userReq.band_id;
        const matchBandLocal = (item: Parameters<typeof bandaDe>[0]) => {
          if (!item) return false;
          const bid = bandaDe(item);
          return bid === userBandId;
        };
        const count = state.leads.filter(matchBandLocal).filter((l: Lead) => (l.genero || "").toLowerCase().includes("reggae") || (l.genero || "").toLowerCase().includes("ska")).length;
        reply += `Tienes actualmente **${count} salas** especializadas en Ska/Reggae en la base de datos (por ejemplo, *Kafe Antzokia* en Bilbao, *Sala El Tren* en Granada y *Viña Rock*).`;
      } else {
        const userBandId = userReq.band_id;
        const matchBandLocal = (item: Parameters<typeof bandaDe>[0]) => {
          if (!item) return false;
          const bid = bandaDe(item);
          return bid === userBandId;
        };
        const totalLeads = state.leads.filter(matchBandLocal).length;
        const rehearsalsCount = (state.rehearsals || []).filter(matchBandLocal).filter((r: Rehearsal) => r.estado === 'programado').length;
        const concertsCount = (state.concerts || []).filter(matchBandLocal).filter((c: Concert) => c.fecha >= '2026-07-09').length;
        reply += `Entendido. Como tu Manager Virtual de ${userReq?.bandName || 'tu banda'}, monitorizo la base de datos y puedo disparar tus agentes. Tienes:\n- **${totalLeads} salas** en total\n- **${rehearsalsCount} ensayos programados**\n- **${concertsCount} próximos conciertos**\n\n¿Quieres que revisemos los correos de presentación, agendemos un ensayo o lancemos un agente como el **Scout**?`;
      }
      
      res.json({ text: reply, proposedActions });
    }, 1000);
    return;
  }

  try {
    const userBandId = userReq.band_id;
    const matchBand = (item: Parameters<typeof bandaDe>[0]) => {
      if (!item) return false;
      const bid = bandaDe(item);
      return bid === userBandId;
    };

    // El repertorio (songs/setlists) vive solo en Supabase — POST /repertorio no pasa por
    // loadState() (ver comentario en repertorio.ts) — así que a diferencia de leads/conciertos,
    // state.songs/state.setlists son datos de semilla desactualizados, nunca lo que la banda
    // guarda de verdad. Se leen aquí en vivo para que el chatbot vea el repertorio real.
    const [songsFromDb, setlistsFromDb] = await Promise.all([
      dbGetSongs(userBandId).catch(() => []),
      dbGetSetlists(userBandId).catch(() => [])
    ]);

    const stateSummary: Record<string, unknown> = {
      leads: state.leads.filter(matchBand).map((l: Lead) => ({
        id: l.id,
        nombre_sala: l.nombre_sala,
        ciudad: l.ciudad,
        region: l.region,
        aforo: l.aforo,
        genero: l.genero,
        tipo: l.tipo,
        email_contacto: l.email_contacto,
        telefono: l.telefono,
        instagram: l.instagram,
        fuente: l.fuente,
        estado: l.estado,
        icono: l.icono,
        imagen_url: l.imagen_url,
        notas: l.notas,
        fecha_envio: l.fecha_envio,
        fecha_ultima_respuesta: l.fecha_ultima_respuesta,
        hasPitch: !!l.pitch_generado,
        festival_start_date: l.festival_start_date,
        festival_end_date: l.festival_end_date
      })),
      bands: (state.bands || []).filter(matchBand).map((b) => ({
        id: b.id,
        nombre_banda: b.nombre_banda,
        estilo_musical: b.estilo_musical,
        localizacion: b.localizacion,
        icono: b.icono,
        imagen_url: b.imagen_url
      })),
      tours: (state.tours || []).filter(matchBand).map((t) => ({
        id: t.id,
        nombre: t.nombre,
        vehiculo: t.vehiculo,
        estado: t.estado,
        fechaInicio: t.fechaInicio,
        fechaFin: t.fechaFin,
        presupuestoLogistica: t.presupuestoLogistica,
        stops: t.stops
      })),
      songs: (songsFromDb as CancionParaChat[]).map((s) => ({ id: s.id, titulo: s.titulo, estado: s.estado, duracion: s.duracion, bpm: s.bpm, tonalidad: s.tonalidad, genero: s.genero })),
      setlists: (setlistsFromDb as SetlistParaChat[]).map((st) => ({ id: st.id, titulo: st.nombre, fecha: st.fecha_ultima_edicion, duracionTotal: st.duracion_total_estimada_minutos })),
      fansCount: (state.fans || []).filter(matchBand).length,
      rehearsals: (state.rehearsals || []).filter(matchBand),
      concerts: (state.concerts || []).filter(matchBand).map((c: Concert) => ({
        id: c.id,
        fecha: c.fecha,
        ciudad: c.ciudad,
        sala: c.sala,
        cache: isLeader ? c.cache : "Restringido",
        contrato_firmado: c.contrato_firmado,
        estado_pago: c.estado_pago
      })),
      recentMessages: (state.messages || []).filter((m) => matchBand(m as Message & { band_id?: string })).slice(-5)
    };

    const bandIdForEpk = userReq.band_id;
    const epkConfigData = getEpkConfigForBand(state, bandIdForEpk, userReq?.bandName || 'tu banda', userReq?.email);
    stateSummary.epkConfig = epkConfigData;
    stateSummary.globalPitchFeedback = getGlobalPitchFeedbackSummary(state.leads.filter(matchBand));

    // Add active campaign info with date range filtering
    const activeCampaign = await dbGetActiveCampaign(bandIdForEpk);
    if (activeCampaign) {
      stateSummary.activeCampaign = {
        id: activeCampaign.id,
        name: activeCampaign.name,
        targetCities: activeCampaign.targetCities,
        minCapacity: activeCampaign.minCapacity,
        maxCapacity: activeCampaign.maxCapacity,
        targetDates: activeCampaign.targetDates,
        campaignStartDate: activeCampaign.campaignStartDate,
        campaignEndDate: activeCampaign.campaignEndDate
      };
    }

    // ADN musical: tempo/tonalidad/género dominantes del repertorio real + instrumentación real
    // de los miembros, para que 'propose_accompaniment' proponga bases rítmicas coherentes con
    // la banda en vez de un rock genérico a 120 BPM por defecto.
    const ownBandGenre = (state.registeredBands || []).find((b) => b.id === userBandId)?.estilo_musical || "";
    const bandMembersForDna = (state.users || []).filter(matchBand).map((u) => ({ name: u.name || u.username || "", instrument: u.instrument || "" }));
    stateSummary.musicalDna = computeMusicalDna(songsFromDb, ownBandGenre, bandMembersForDna);

    if (isLeader) {
      stateSummary.payments = (state.payments || []).filter(matchBand);
    }

    // Instrucciones fijas en el prompt de sistema; los datos de usuario y terceros, en el turno del usuario (OWASP LLM01).
    const systemPrompt = instruccionesChat(isLeader);
    const contextoDatos = contextoDeDatosChat({ epk: epkConfigData, nombreSesion: userReq?.bandName, emailSesion: userReq?.email, leadsBanda: state.leads.filter(matchBand), autonomia: getAutonomyConfigForBand(state, bandIdForEpk), estado: stateSummary });

    const contents: TurnoChat[] = [];
    for (const h of acotarHistorial(chatHistory)) {
      if (contents.length === 0 && h.role === 'model') continue;
      agregarTurno(contents, h.role, h.text);
    }
    agregarTurno(contents, 'user', mensajeConDatos(contextoDatos, message));

    let response: VistaRespuestaIA | null = null;
    let accionesDeRondasPrevias: VistaRespuestaIA["functionCalls"] = [];
    let lastError: ErrorDeFailover | null = null;

    try {
      const resultado = await consultarConLecturas(client, { contents, systemPrompt, bandId: userReq.band_id, leads: state.leads.filter(matchBand) });
      response = resultado.response;
      accionesDeRondasPrevias = resultado.accionesPrevias;
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      lastError = err;
    }

    if (!response) {
      // El detalle queda en el log y en Sentry con este código; al usuario no se le enseña el mensaje interno.
      const idError = registrarErrorInesperado(req, lastError);

      // generateContentWithFallback ya intentó automáticamente el failover a DeepSeek antes de
      // llegar aquí (ver server/ai.ts): si también falló, cuelga su error por separado en
      // '.deepSeekError' en vez de tragárselo, para poder decir la causa real de CADA proveedor
      // en vez de repetir solo el error de Gemini como si DeepSeek ni se hubiera intentado.
      const geminiErrObj = lastError?.geminiError ?? lastError;
      const deepSeekErrObj = lastError?.deepSeekError;
      const errMessage = String(geminiErrObj?.message || geminiErrObj || "");
      const deepSeekMessage = String(deepSeekErrObj?.message || deepSeekErrObj || "");

      let reply = "⚠️ **Servicio de Inteligencia Artificial No Disponible Temporalmente**\n\n";

      const geminiQuota = /quota|exhausted|429|limit/i.test(errMessage);
      const deepSeekSinSaldo = /insufficient balance|402/i.test(deepSeekMessage);

      if (geminiQuota && deepSeekErrObj) {
        reply += `Se ha agotado la cuota de Google Gemini **y** el intento automático de failover a DeepSeek también ha fallado, así que ahora mismo no hay ningún proveedor de IA disponible.\n\n` +
                 `**Gemini:** límite de peticiones alcanzado (Quota Exceeded / Rate Limit).\n` +
                 `**DeepSeek:** ${deepSeekSinSaldo ? 'sin saldo en la cuenta (Error 402 Insufficient Balance).' : 'tampoco ha podido atender la petición.'}\n\n` +
                 `**Cómo solucionarlo:**\n` +
                 `1. **Recarga saldo en DeepSeek** (recomendado, muy barato ~0,14 € / 1000 peticiones): [platform.deepseek.com](https://platform.deepseek.com/).\n` +
                 `2. **O usa tu propia clave de Google AI Studio**: créala en [aistudio.google.com](https://aistudio.google.com/) y ponla como \`GEMINI_API_KEY\` en las variables de entorno (1.500 peticiones/día gratis).\n\n` +
                 `*Nota: Todas las demás funciones del panel (Supabase, gestión de salas, agenda de ensayos y gestión de propuestas) siguen funcionando con normalidad.*`;
      } else if (geminiQuota) {
        reply += `El límite de peticiones de Google Gemini para la clave actual se ha alcanzado (Error: Quota Exceeded / Rate Limit).\n\n` +
                 `**Explicación y Solución:**\n` +
                 `1. **Clave compartida por defecto**: El entorno de vista previa utiliza una clave gratuita con un límite estricto de **20 peticiones al día por proyecto** (\`GenerateRequestsPerDay-FreeTier\`).\n` +
                 `2. **Usa tu clave personal de Google AI Studio**: Ve a [aistudio.google.com](https://aistudio.google.com/), crea una API Key (empieza por \`AIzaSy...\`) e introdúcela en la sección de **Settings / Variables de entorno** como \`GEMINI_API_KEY\`. Tu clave personal tiene una cuota diaria mucho más amplia (1,500 solicitudes/día gratis).\n` +
                 `3. **Reinicio de cuota**: Si estás usando la clave por defecto, la cuota se restablecerá automáticamente.\n\n` +
                 `*Nota: Todas las demás funciones del panel (Supabase, gestión de salas, agenda de ensayos y gestión de propuestas) siguen funcionando con normalidad.*`;
      } else {
        reply += `Ha ocurrido un error inesperado al conectar con el servicio de IA. Por favor, inténtalo de nuevo en unos instantes.`;
      }
      reply += `\n\n_Código de error: ${idError}_`;

      const proposedActions: AccionPropuesta[] = [];
      const lowerMsg = (message || "").toLowerCase();

      const pendingLeads = state.leads.filter((l: Lead) => l.estado === "pendiente_aprobacion");
      let matchedLead = null;
      for (const lead of pendingLeads) {
        if (lowerMsg.includes(lead.nombre_sala.toLowerCase())) {
          matchedLead = lead;
          break;
        }
      }

      if (matchedLead) {
        reply += `\n\n💡 **Acción recomendada detectada:** He detectado que te refieres a **${matchedLead.nombre_sala}**. Puedes aprobar su correo de presentación directamente con el botón de abajo:`;
        proposedActions.push({
          type: "propose_lead_approval",
          leadId: matchedLead.id,
          leadName: matchedLead.nombre_sala,
          description: `Aprobar el correo de presentación preparado para ${matchedLead.nombre_sala}.`
        });
      } else if (pendingLeads.length > 0 && (lowerMsg.includes("aprobar") || lowerMsg.includes("pendiente") || lowerMsg.includes("correo"))) {
        if (lowerMsg.includes("todo") || lowerMsg.includes("todas") || lowerMsg.includes("todos") || lowerMsg.includes("varios") || lowerMsg.includes("3")) {
          reply += `\n\n💡 **Acciones recomendadas detectadas:** Tienes **${pendingLeads.length}** salas pendientes de aprobación. Te propongo la aprobación de todas ellas:`;
          pendingLeads.forEach(pLead => {
            proposedActions.push({
              type: "propose_lead_approval",
              leadId: pLead.id,
              leadName: pLead.nombre_sala,
              description: `Aprobar el correo de presentación preparado para ${pLead.nombre_sala}.`
            });
          });
        } else {
          const firstPending = pendingLeads[0];
          reply += `\n\n💡 **Acción recomendada detectada:** Tienes **${pendingLeads.length}** salas pendientes de aprobación. Te propongo aprobar la primera (**${firstPending.nombre_sala}**):`;
          proposedActions.push({
            type: "propose_lead_approval",
            leadId: firstPending.id,
            leadName: firstPending.nombre_sala,
            description: `Aprobar el correo de presentación preparado para ${firstPending.nombre_sala}.`
          });
        }
      }

      return res.json({
        text: reply,
        proposedActions
      });
    }

    let textResult = "";
    let nativeProposedActions: AccionPropuesta[] = [];

    // 1. Extraer Function Calls nativas del SDK si están presentes
    try {
      const functionCalls = response.functionCalls || 
        response.candidates?.[0]?.content?.parts?.filter((p) => p.functionCall)?.map((p) => p.functionCall);
      const todasLasLlamadas = [...(accionesDeRondasPrevias ?? []), ...(Array.isArray(functionCalls) ? functionCalls : [])];
      if (todasLasLlamadas.length > 0) {
        nativeProposedActions = convertFunctionCallsToProposedActions(todasLasLlamadas).map((accion) => ({ ...accion }));
      }
    } catch (fcErr) {
      console.warn("[Gemini API] Error al extraer functionCalls nativas:", fcErr);
    }

    // 2. Extraer texto conversacional
    try {
      textResult = response.text || "";
    } catch {
      try {
        const textParts = response.candidates?.[0]?.content?.parts?.filter((p) => p.text)?.map((p) => p.text);
        textResult = textParts ? textParts.join("\n\n") : "";
      } catch {
        textResult = "";
      }
    }

    let parsed: { text: string; proposedActions: AccionPropuesta[] };

    if (nativeProposedActions.length > 0) {
      // Si el modelo invocó herramientas nativas, usamos su texto o un mensaje de cortesía si solo emitió tool calls
      parsed = {
        text: textResult.trim() ? textResult : "He preparado las siguientes acciones para tu revisión y confirmación:",
        proposedActions: nativeProposedActions
      };
    } else {
      // Fallback para modelos en texto/JSON (ej. DeepSeek o respuestas JSON)
      if (!textResult) {
        textResult = "No se pudo obtener un texto claro del modelo en este momento.";
      }

      try {
        parsed = safeParseJson(textResult);
        if (!parsed || typeof parsed !== "object" || typeof parsed.text !== "string") {
          parsed = {
            text: typeof parsed?.text === "string" ? parsed.text : textResult,
            proposedActions: Array.isArray(parsed?.proposedActions) ? parsed.proposedActions : []
          };
        }
      } catch (parseErr) {
        console.warn("[Gemini API] No se pudo parsear el JSON de respuesta. Usando texto plano en su lugar:", parseErr);
        parsed = { text: textResult, proposedActions: [] };
      }
    }

    // Las notas que compone la IA se validan y reparan antes de salir hacia el navegador
    parsed = sanearIdeasMelodicas(parsed);
    res.json(parsed);

  } catch (errorCapturado) {
    const idError = registrarErrorInesperado(req, errorCapturado);
    res.json({
      text: `⚠️ **Aviso del Mánager Virtual AI:** Ocurrió un inconveniente al procesar tu consulta. Por favor, vuelve a intentarlo. _Código de error: ${idError}_`,
      proposedActions: []
    });
  }
});

// AI Reels Copy Writer Endpoint
// requireAuth: llama al modelo de IA, y abierta era una pasarela gratis a la cuenta de la
// plataforma para cualquiera que diera con la URL.
router.post("/write-reels-copy", requireAuth, iaRateLimiter, async (req, res) => {
  const { idea, style } = req.body;
  const client = getAiClient();

  // Antes este prompt nombraba a una banda concreta a pelo, con su instrumentación y su regla de vientos.
  // En una app multi-banda eso le escribía a cualquiera copies sobre una banda que no es la suya.
  let perfil = emptyBandProfile();
  try {
    perfil = await loadBandProfile(getTargetBandId(req), {
      getBand: (id) => dbGetRegisteredBandById(id),
      getEpk: (id) => dbGetEpkConfig(id),
      getState: () => loadState()
    });
  } catch (eCapturado) {
    const e = comoErrorCapturado(eCapturado);
    console.warn("[write-reels-copy] Sin perfil de banda:", e?.message || e);
  }

  const nombreBanda = displayBandName(perfil);
  const hashtags = baseHashtags(perfil);
  const baseIdea = idea || "un ensayo de la banda";

  const estilo = style === "hype"
    ? 'Estilo "HYPE": enérgico, callejero, de fiesta y directo sudoroso. Frases cortas, mayúsculas puntuales y emojis de fuego y de subidón.'
    : 'Estilo "CHILL": relajado, de buen rollo y buenas vibras. Ritmo pausado, imágenes de sol y calma, sin gritar.';

  const prompt = `Eres quien lleva las redes de la banda. Escribe UNA publicación para Instagram Reels o TikTok.

${buildBandContextBlock(perfil)}

${estilo}

IDEA A CONTAR: "${baseIdea}"

FORMATO: 2-4 líneas de texto, después una línea con 4-6 hashtags. Sin comillas alrededor, sin títulos, sin explicar lo que has hecho. Devuelve solo el texto de la publicación.`;

  if (!client) {
    const copy = style === "hype"
      ? `🔥 Se nos ha ido de las manos en el local: ${baseIdea}. Sube el volumen y dinos si lo llevamos al próximo bolo. 🚀\n\n${hashtags.join(" ")}`
      : `✨ Buenas vibras y tiempo para respirar: ${baseIdea}. Dale al play y cuéntanos cómo te deja. 🌿\n\n${hashtags.join(" ")}`;
    return res.json({ success: true, text: copy, copy, generatedByAI: false, band: nombreBanda });
  }

  try {
    const response = await generateContentWithFallback(client, { contents: prompt, bandId: getTargetBandId(req) });
    const copy = (response.text || "").trim();
    if (!copy) throw new Error("La IA devolvió una respuesta vacía.");
    // El frontend (ReelsCenter) espera { success, text }: devolver solo { copy } hacía que el
    // copy generado nunca se pintara y saltara siempre el aviso de "hubo un problema".
    res.json({ success: true, text: copy, copy, generatedByAI: true, band: nombreBanda });
  } catch (err) {
    console.error("Error generating reels copy with Gemini:", err);
    res.status(500).json({ success: false, error: "Fallo al generar copy con IA" });
  }
});

export default router;
