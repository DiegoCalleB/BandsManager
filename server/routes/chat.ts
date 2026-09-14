import express from "express";
import { KNOWN_LOCATIONS, CANONICAL_LOCATION_MAP, getRegionForCity } from "../../src/constants/regions.js";
import { Lead, Rehearsal, Concert } from "../../src/types.js";
import { loadState, getUserFromRequestLocal, getEpkConfigForBand, getAutonomyConfigForBand, requireAuth, BAKANDEYA_BAND_ID } from "../state.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";
import { getGlobalPitchFeedbackSummary, formatGlobalPitchFeedbackForPrompt } from "./leads.js";
import { dbGetRegisteredBandById, dbGetEpkConfig, dbGetActiveCampaign, dbGetSongs, dbGetSetlists } from "../db.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { loadBandProfile, buildBandContextBlock, displayBandName, baseHashtags, emptyBandProfile } from "../utils/bandProfile.js";
import { computeMusicalDna } from "../utils/musicalDna.js";
import { sanearIdeasMelodicas } from "../utils/melodicIdeaValidator.js";
import { iaRateLimiter } from "../middleware/rateLimiter.js";
import { chatFunctionDeclarations, convertFunctionCallsToProposedActions } from "../services/chatTools.js";

const router = express.Router();

// requireAuth: el chatbot responde con los leads, los ensayos, los conciertos y el EPK de la
// banda. Sin sesión, `userReq` salía null y todo eso se contestaba sobre la banda por defecto a
// quien preguntara.
router.post("/chat", requireAuth, async (req, res) => {
  const { message, chatHistory, agentsEnabled: agentsEnabledBody, autonomyConfig } = req.body;
  const agentsEnabled = agentsEnabledBody !== false;
  const userReq = getUserFromRequestLocal(req);
  // requireAuth ya garantiza que hay banda activa (getUserFromRequest devuelve null si no la
  // hay), pero esta ruta vuelve a resolver el usuario por su cuenta con getUserFromRequestLocal:
  // se repite la comprobación aquí para no depender en silencio de esa garantía y caer en la
  // banda de Bakandeya (BAKANDEYA_BAND_ID) más abajo si algún día dejara de cumplirse.
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
  // Only trigger if agents are enabled AND user explicitly requests to execute/launch an agent AND NOT asking questions or hypothetical queries
  const isQuestionOrHypothetical = /(\?|¿|y si|qué pasa|que pasa|cómo|como funciona|explica|explicame|qué hace|que hace|podrías explicar|dudas)/i.test(lower);
  const isNegativeAgentIntent = /(no quiero|no ejecutes|sin agentes|no lances|sin lanzar|sin disparar|no dispares|no usar|sin usar agentes|no hace falta agente)/i.test(lower);

  const isExplicitAgentTrigger = agentsEnabled && !isNegativeAgentIntent && !isQuestionOrHypothetical && (
    (lower.includes("ejecuta") || lower.includes("ejecutar") || lower.includes("lanza") || lower.includes("lanzar") || lower.includes("corre") || lower.includes("correr") || lower.includes("dispara") || lower.includes("disparar") || lower.includes("inicia") || lower.includes("iniciar") || lower.includes("arranca") || lower.includes("arrancar")) &&
    (lower.includes("agente") || lower.includes("scout") || lower.includes("redactor") || lower.includes("enviador") || lower.includes("lector") || lower.includes("descubridor"))
  );

  const isAgentQuery = agentsEnabled && !isNegativeAgentIntent && !isQuestionOrHypothetical && (isExplicitAgentTrigger || (lower.startsWith("agente ") && (lower.includes("scout") || lower.includes("redactor") || lower.includes("enviador") || lower.includes("lector") || lower.includes("descubridor"))));

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

    const triggerParams: Record<string, any> = {};

    if (agentName === "Scout Descubridor" || agentName === "Scout") {
      let detectedRegion = "";
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
        detectedRegion = canonical;
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
        triggerParams.region = "Huelva";
        triggerParams.ciudad = "Huelva";
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
      const proposedActions: any[] = [];
      
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
        const matchBandLocal = (item: any) => {
          if (!item) return false;
          const bid = item.band_id || item.bandId;
          if (bid) return bid === userBandId;
          return userBandId === BAKANDEYA_BAND_ID || userBandId === 'reg-bakandeya';
        };
        const count = state.leads.filter(matchBandLocal).filter((l: Lead) => (l.genero || "").toLowerCase().includes("reggae") || (l.genero || "").toLowerCase().includes("ska")).length;
        reply += `Tienes actualmente **${count} salas** especializadas en Ska/Reggae en la base de datos (por ejemplo, *Kafe Antzokia* en Bilbao, *Sala El Tren* en Granada y *Viña Rock*).`;
      } else {
        const userBandId = userReq.band_id;
        const matchBandLocal = (item: any) => {
          if (!item) return false;
          const bid = item.band_id || item.bandId;
          if (bid) return bid === userBandId;
          return userBandId === BAKANDEYA_BAND_ID || userBandId === 'reg-bakandeya';
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
    const matchBand = (item: any) => {
      if (!item) return false;
      const bid = item.band_id || item.bandId;
      if (bid) return bid === userBandId;
      return userBandId === BAKANDEYA_BAND_ID || userBandId === 'reg-bakandeya';
    };

    // El repertorio (songs/setlists) vive solo en Supabase — POST /repertorio no pasa por
    // loadState() (ver comentario en repertorio.ts) — así que a diferencia de leads/conciertos,
    // state.songs/state.setlists son datos de semilla desactualizados, nunca lo que la banda
    // guarda de verdad. Se leen aquí en vivo para que el chatbot vea el repertorio real.
    const [songsFromDb, setlistsFromDb] = await Promise.all([
      dbGetSongs(userBandId).catch(() => []),
      dbGetSetlists(userBandId).catch(() => [])
    ]);

    const stateSummary: any = {
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
      bands: (state.bands || []).filter(matchBand).map((b: any) => ({
        id: b.id,
        nombre_banda: b.nombre_banda,
        estilo_musical: b.estilo_musical,
        localizacion: b.localizacion,
        icono: b.icono,
        imagen_url: b.imagen_url
      })),
      tours: (state.tours || []).filter(matchBand).map((t: any) => ({
        id: t.id,
        nombre: t.nombre,
        vehiculo: t.vehiculo,
        estado: t.estado,
        fechaInicio: t.fechaInicio,
        fechaFin: t.fechaFin,
        presupuestoLogistica: t.presupuestoLogistica,
        stops: t.stops
      })),
      songs: songsFromDb.map((s: any) => ({ id: s.id, titulo: s.titulo, estado: s.estado, duracion: s.duracion, bpm: s.bpm, tonalidad: s.tonalidad, genero: s.genero })),
      setlists: setlistsFromDb.map((st: any) => ({ id: st.id, titulo: st.nombre, fecha: st.fecha_ultima_edicion, duracionTotal: st.duracion_total_estimada_minutos })),
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
      recentMessages: (state.messages || []).filter(matchBand).slice(-5)
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
    const ownBandGenre = (state.registeredBands || []).find((b: any) => b.id === userBandId)?.estilo_musical || "";
    const bandMembersForDna = (state.users || []).filter(matchBand).map((u: any) => ({ name: u.name || u.username || "", instrument: u.instrument || "" }));
    stateSummary.musicalDna = computeMusicalDna(songsFromDb, ownBandGenre, bandMembersForDna);

    if (isLeader) {
      stateSummary.payments = (state.payments || []).filter(matchBand);
    }

    const targetBandName = userReq?.bandName || epkConfigData?.nombre_banda || 'tu banda';
    const cleanBandId = bandIdForEpk.replace(/^(band|reg)-/, '');
    const isBakandeyaBand = cleanBandId === 'bakandeya' || targetBandName.toLowerCase().includes('bakandeya');

    const globalPitchFeedbackText = formatGlobalPitchFeedbackForPrompt(state.leads.filter(matchBand));

    const specificDossierBlock = isBakandeyaBand ? `
DOSSIER COMPLETO E INFORMACIÓN INTERNA DE LA BANDA BAKANDEYA:
1. ESTILO Y PROPUESTA MUSICAL:
- Estilo: Electrónica-fusión / Electrobasureo (percusión reciclada). Mezcla electrónica analógica, reggae, balkan, klezmer, jazz, música oriental, clásico, DnB, techno.
- Contacto oficial: Bakandeya@gmail.com | Tel: +34 652938521 | Instagram: @Bakandeya

2. MIEMBROS DE LA BANDA:
- Jon Quel: Voz, guitarra, beatbox, percusión. Ex-JarelBabel, acróbata, profesor de rap en centros penitenciarios, percusionista en la compañía Toompak.
- José Filgueira: Percusión. Músico y actor, ex-Swingdigentes (25 países), Cirque du Soleil, actualmente en STOMP.
- Elyar Pashang: Multi-percusionista turco-iraní (handpan, nagara, darbuka, daf) formado en Tabriz (Irán), especialista en folclor azerbaiyano y oriental.
- Raúl Pérez: Violinista mexicano, arreglista e intérprete, ex-Teatro de la Memoria, historiador, novelista ("La taberna de las ánimas").

3. DEPARTAMENTOS INTERNOS DE GESTIÓN BAKANDEYA:
- Community Manager (Redes), Distribuidora de Mailing, Promoción de Medios, Distribuidora Social, Biblioteca de Salas/Festivales y Análisis de Resultados.
` : `
INFORMACIÓN DE LA BANDA ${targetBandName.toUpperCase()}:
- Nombre de la banda: ${targetBandName}
- Biografía/Estilo: ${epkConfigData?.biografia || 'Sin biografía especificada aún'}
- Contacto de Booking: ${epkConfigData?.contactoBooking?.email || userReq?.email || 'Sin email definido'} | Teléfono: ${epkConfigData?.contactoBooking?.telefono || 'Sin teléfono definido'}
- Redes sociales y enlaces: ${JSON.stringify(epkConfigData?.enlacesRedes || {})}
`;

    const autonomy = autonomyConfig || getAutonomyConfigForBand(state, bandIdForEpk);

    const autonomyPromptBlock = `
CONFIGURACIÓN VIGENTE DE AUTONOMÍA Y NEGOCIACIÓN DEL MÁNAGER Y AGENTES AI:
- Modo de Envío (Dispatch Level): ${autonomy.dispatchLevel === 'draft_only' ? 'SÓLO BORRADORES (Cualquier propuesta o correo redactado se guarda como borrador en "pendiente_aprobacion" o borrador de Gmail para revisión humana obligatoria)' : autonomy.dispatchLevel === 'scheduled_window' ? 'VENTANA PROGRAMADA (Margen de 3h para revisión antes de salir)' : 'ENVÍO AUTÓNOMO DE PRIMER CONTACTO (El pitch inicial se aprueba si cumple criterios; negociaciones requieren validación)'}
- Profundidad de Negociación: ${autonomy.negotiationDepth === 'outreach_only' ? 'SÓLO CONTACTO INICIAL / EPK (No negociar cachés ni condiciones en esta fase)' : autonomy.negotiationDepth === 'filter_conditions' ? 'FILTRADO DE CONDICIONES Y CACHÉ (Aceptar/proponer negociaciones solo si el caché está entre ' + (autonomy.minCacheThreshold || 300) + '€ y ' + (autonomy.maxCacheThreshold || 800) + '€)' : 'NEGOCIACIÓN AVANZADA Y RE-OFERTAS (Proponer contraofertas dentro del rango de ' + (autonomy.minCacheThreshold || 300) + '€ y ' + (autonomy.maxCacheThreshold || 800) + '€)'}
- Caché Mínimo Aceptable: ${autonomy.minCacheThreshold || 300} €
- Caché Objetivo / Máximo: ${autonomy.maxCacheThreshold || 800} €
- Auto-rechazar ofertas por debajo de ${autonomy.minCacheThreshold || 300} €: ${autonomy.autoDeclineUnderMinCache ? 'SÍ (Rechazar cortesmente)' : 'NO (Avisar al mánager sin rechazar)'}
- FIRMA Y CIERRE FINAL HUMANO: SIEMPRE OBLIGATORIO (No se cierra ningún trato ni se firma contrato sin aprobación directa del usuario).

🚨 REGLA CRÍTICA DE SEGURIDAD ABSOLUTA (MODO SÓLO BORRADORES):
${autonomy.dispatchLevel === 'draft_only' ? `El nivel de autonomía actual es SÓLO BORRADORES ('draft_only'). Si el usuario pide enviar un correo directo individual, usa 'propose_draft_email' para generar y guardar borradores en Gmail o Supabase. Si el usuario pide ejecutar el AGENTE ENVIADOR, propón 'propose_agent_trigger' con 'agentName': 'Enviador' para despachar las salas aprobadas mediante el agente de Supabase.` : `Puedes proponer 'propose_draft_email', 'propose_send_email' o 'propose_agent_trigger' con la validación explícita del usuario.`}

REGLA DE AUTONOMÍA: Cuando el usuario te pregunte sobre negociaciones, ofertas de salas, o te pida generar/enviar correos, DEBES TENER EN CUENTA ESTOS LÍMITES Y MENCIONARLOS SI CORRESPONDE.
`;

    const systemPrompt = `Eres el "Manager Virtual de ${targetBandName}", un asistente de Inteligencia Artificial para la banda de música "${targetBandName}".
Tu labor es ayudar a los miembros de la banda a organizarse, consultar sus datos de la base de datos Supabase (salas de conciertos, medios y contactos), ver el calendario de ensayos, conciertos y resolver dudas en lenguaje natural.

DOSSIER OFICIAL & KIT DE PRENSA ALMACENADO (stateSummary.epkConfig):
- Logo oficial: ${epkConfigData?.logoUrl || '/logo_bakandeya_bueno_sin_fondo.png'}
- Dossier PDF/Documento: ${epkConfigData?.dossierPdfUrl ? `${epkConfigData.dossierPdfName || 'Dossier PDF'} (${epkConfigData.dossierPdfUrl})` : (epkConfigData?.dossierDocumentUrl ? `${epkConfigData.dossierDocumentName || 'Documento'} (${epkConfigData.dossierDocumentUrl})` : 'No subido aún')}
- Biografía oficial: ${epkConfigData?.biografia || 'Sin biografía'}
- Información adicional/Texto extra de dossier: ${epkConfigData?.dossierTextoExtra || 'Sin notas adicionales'}
- Rider técnico: ${epkConfigData?.riderTecnico || 'Sin rider'} ${epkConfigData?.riderPdfUrl ? `[PDF Rider: ${epkConfigData.riderPdfName || 'Rider.pdf'} (${epkConfigData.riderPdfUrl})]` : ''}
- Contacto booking: ${JSON.stringify(epkConfigData?.contactoBooking || {})}
- Redes sociales: ${JSON.stringify(epkConfigData?.enlacesRedes || {})}

${specificDossierBlock}

MEMORIA GLOBAL DE APRENDIZAJES Y ESTILO EN OTROS PITCHES (ENTRENAMIENTO PREVIO DEL MÁNAGER):
${globalPitchFeedbackText}

REGLA DE APRENDIZAJE CONTINUO: Cada vez que redactes o propongas un borrador de correo o pitch para cualquier sala, medio de comunicación, festival o banda ('propose_draft_email', 'propose_send_email'), DEBES aplicar activamente las preferencias, indicaciones y estilo aprendidos del mánager en el historial global anterior.

${autonomyPromptBlock}

${!isLeader ? `RESTRICCIÓN CRÍTICA DE FINANZAS:
El usuario actual NO es un administrador de la banda (rol: miembro). Tiene ESTRICTAMENTE PROHIBIDO ver, consultar o solicitar información sobre finanzas, contabilidad, pagos, gastos, ingresos, balances, caja o cachés de conciertos. Si el usuario realiza cualquier pregunta sobre dinero, finanzas o partidas contables, DEBES RESPONDER ÚNICA Y EXCLUSIVAMENTE CON ESTE TEXTO EXACTO: "🔒 *El apartado y los datos de finanzas están restringidos únicamente a los administradores/líderes de la banda.*" SIN APORTAR NINGÚN DATO FINANCIERO.
` : ''}
Estilo de comunicación:
- Habla en español de España.
- Usa un tono amigable, cercano, entusiasta y muy profesional del mundo de la música y backstage (un colega con criterio, nada de corporativo aburrido).
- Sé directo y conciso. Evita parrafadas innecesarias.

Aquí tienes el estado actual de los datos reales de la banda recopilados en tiempo real desde Supabase:
${JSON.stringify(stateSummary, null, 2)}

Tu respuesta debe estar estructurada de tal manera que puedas proponer acciones si el usuario lo solicita o si detectas una acción lógica (como aprobar un correo de contacto de una sala, agendar ensayo, cambiar la clasificación de interés o ejecutar un agente de Supabase).
Debes devolver la respuesta en formato JSON strictly para que la app pueda renderizar el texto en Markdown y ofrecer botones interactivos.

El JSON de respuesta debe tener la siguiente forma exacta:
{
  "text": "Tu respuesta redactada en Markdown con formato elegante, negritas, listas si es necesario, etc.",
  "proposedActions": [
    {
      "type": "propose_lead_approval",
      "leadId": "id-de-la-sala",
      "leadName": "Nombre de la Sala",
      "description": "Breve texto explicativo de la acción, Ej: Aprobar correo de presentación para Sala Apolo."
    }
  ]
}

Puedes proponer acciones como:
1. 'propose_lead_approval' para salas en 'pendiente_aprobacion' (con 'leadId' y 'leadName').
2. 'propose_status_change' con 'leadId', 'leadName' y 'newStatus' (por ejemplo 'interesado', 'negociando', 'no_interesado') para cambiar la clasificación de interés de una sala.
3. 'propose_concert' para agendar/añadir un concierto o bolo en la agenda de la banda y Supabase (incluye 'description', opcional 'leadId', y un objeto 'concert' con { fecha: 'YYYY-MM-DD', ciudad: '...', sala: '...', cache: 0, aforo_total: 200, contrato_firmado: true, estado_pago: 'pendiente', notas: '...', tipo: 'sala' }).
4. 'propose_rehearsal' para proponer/agendar un ensayo (incluye 'description' y un objeto 'rehearsal' con { fecha: 'YYYY-MM-DD', hora: '19:00', lugar: '...', asistentes: ['Banda'], notas: '...', estado: 'programado' }).
5. 'propose_band' para añadir o actualizar una banda en el CRM (incluye 'description' y un objeto 'band' con { id: 'opcional-id-existente', nombre_banda: '...', estilo_musical: '...', localizacion: '...', estado_relacion: 'nuevo', contacto_nombre: '', email: '', telefono: '', instagram: '', notas_colaboracion: '' }). Si la banda ya existe, se actualizarán sus datos sin crear duplicados.
6. 'propose_tour' para planificar o guardar una gira en el gestor de giras y Supabase (incluye 'description' y un objeto 'tour' con { id: 'tour-...', nombre: 'Gira ...', vehiculo: 'Furgoneta 9 Plazas', estado: 'planificacion', fechaInicio: 'YYYY-MM-DD', fechaFin: 'YYYY-MM-DD', presupuestoLogistica: 500, stops: [] }).
7. 'propose_update_logo' para buscar, asignar o actualizar el logo de una sala, medio, festival o banda. Incluye 'targetType' ('lead' o 'band'), 'leadId' o 'bandId', 'targetName', 'imagen_url', 'icono' y 'description'.
8. 'propose_add_lead' para proponer guardar y añadir un NUEVO lead, sala, medio de comunicación, festival, ayuntamiento, agencia o productora a Supabase. Incluye 'description', 'leadName' y 'lead' con { nombre_sala: '...', ciudad: '...', region: '...', aforo: 300, genero: '...', tipo: 'sala'|'festival'|'ayuntamiento'|'discoteca'|'medio'|'grupo'|'agencia'|'manager'|'productora'|'sello', email_contacto: '...', telefono: '...', website: '...', instagram: '...', festival_start_date: 'YYYY-MM-DD (ej: 2026-10-04 si es festival)', festival_end_date: 'YYYY-MM-DD (ej: 2026-10-05)', fuente: 'Chatbot', estado: 'nuevo'|'pendiente_aprobacion', notas: '...' }. REGLA DE FECHAS DE FESTIVAL: Si el usuario menciona fechas para un festival o evento (ej. "4 y 5 de Octubre"), calcula el año actual o próximo y extrae 'festival_start_date' y 'festival_end_date' obligatoriamente en formato ISO 'YYYY-MM-DD' (ej. '2026-10-04' y '2026-10-05'). REGLA ESTRICTA DE CLASIFICACIÓN DE TIPO: Si el nombre del recinto incluye "Sala", "Teatro", "Club", "Estudio", "Live" o es un local de conciertos (ej. "Sala ReviLive", "ReviRock Studios Live"), clasifícalo SIEMPRE como 'sala'. Reserva 'productora' para productoras de eventos, 'agencia' para agencias de booking, 'grupo' para bandas aliadas, y 'medio' ÚNICAMENTE para prensa, radio, televisión o podcasts. EXPLICACIÓN TRANSPARENTE AL USUARIO: No afirmes en el texto del mensaje "ya se ha guardado/insertado" sino "He preparado la propuesta para añadir X a Supabase. Confirma la acción con el botón de abajo para guardarlo en la base de datos."
9. 'propose_update_lead' para modificar campos de un lead/sala/medio existente. Incluye 'description', 'leadId', 'leadName' y 'updatedFields' (un objeto con los campos a modificar, ej: { estado: 'interesado', notas: '...', email_contacto: '...' }).
10. 'propose_draft_email' para crear y guardar un borrador de correo electrónico/pitch para una sala o medio. Incluye 'description', 'leadId', 'leadName', 'subject', 'body' y 'attachDossier' (boolean, por defecto true).
11. 'propose_send_email' para enviar o registrar el envío oficial de un correo a un lead, actualizar la fecha de envío e incluir la firma personalizada con redes sociales y dossier. Incluye 'description', 'leadId', 'leadName', 'subject', 'body', 'senderName', 'attachDossier' (true), 'incluirFirmaRedes' (true).
12. 'propose_agent_trigger' con 'agentName' (debe ser obligatoriamente 'Enviador', 'Scout', 'Redactor' o 'Lector') y un objeto 'params' opcional. REGLA ESTRICTA DE PRIORIDAD: Si el usuario te indica el NOMBRE ESPECÍFICO de una sala, festival o medio que quiere añadir (ej: "añade revilive revirock", "agrega la sala Sol"), DEBES PROPONER SIEMPRE 'propose_add_lead' (punto 8) con ese nombre exacto para guardarla en Supabase. ÚNICAMENTE propón 'propose_agent_trigger' cuando el usuario te ordene EXPLÍCITAMENTE ejecutar, lanzar o correr uno de los agentes para un rastreo amplio regional (ej: 'ejecuta el enviador', 'lanza el agente scout en Sevilla'). SI EL USUARIO ESTÁ HACIENDO UNA PREGUNTA INFORMATIVA, HIPOTÉTICA O DE DUDA (ej: '¿qué pasa si me escribe una sala que no tengo?', '¿cómo funciona el lector?', '¿qué hace el scout?'), RESPONDE ÚNICAMENTE CON LA EXPLICACIÓN EN TEXTO Y DEJA 'proposedActions' COMO UNA LISTA VACÍA []. NUNCA propongas disparar un agente ante una simple consulta o pregunta.
13. 'propose_accompaniment' cuando el usuario pida una base rítmica, un acompañamiento, una pista de batería y bajo, o algo para ensayar o tocar encima (ej: 'hazme una base para ensayar', 'ponme un ritmo de batería', 'genérame un acompañamiento para el estribillo'). Esto NO envía ni guarda nada: solo sintetiza el audio en el propio navegador del usuario mediante Web Audio para que lo escuche al instante. Incluye 'description' y un objeto 'accompaniment' con { bpm: number, keyName: 'Do'|'Re'|'Mi'|'Fa'|'Sol'|'La'|'Si' (puede llevar 'm' al final si es tonalidad menor), drumPattern: 'rock'|'pop'|'funk'|'reggae'|'ska'|'cumbia'|'punk', includeDrums: boolean, includeBass: boolean, durationSecs: number (entre 10 y 120), songId: 'opcional, el id EXACTO de stateSummary.songs si el usuario se refiere a una canción concreta del repertorio', songTitle: 'opcional, el título de esa misma canción (para mostrarlo, y como respaldo si no encuentras el id)' }. REGLA DE ADN MUSICAL: usa SIEMPRE por defecto 'stateSummary.musicalDna' (bpmSuggested, tonalidadSuggested, drumPatternSuggested) — son el tempo, la tonalidad y el estilo de batería reales de esta banda, calculados a partir de su propio repertorio y género — salvo que el usuario pida explícitamente en su mensaje otro tempo, tonalidad o estilo distinto, en cuyo caso prioriza lo que pida el usuario. Si 'musicalDna.instrumentos' incluye instrumentos que no son batería/bajo/voz (viento, teclado, violín...), menciónalo en el 'description' (ej: "va con batería y bajo de referencia; luego le añades encima el violín/saxo en directo").
14. 'propose_melodic_idea' — el "genio de la lámpara" instrumental: cuando el usuario pida una IDEA MELÓDICA o un patrón concreto para un instrumento que NO es batería/bajo (ej: 'dame una idea de violín para el estribillo', 'qué podría tocar la guitarra en el puente de Tal Canción', 'hazme un patrón de handpan para toda la canción', 'ideas de percusión para el solo'). A diferencia de 'propose_accompaniment' (patrón rítmico fijo), aquí DEBES COMPONER TÚ MISMO una secuencia real de notas — no un patrón genérico — pensada específicamente para esa canción/sección y coherente con 'stateSummary.musicalDna' y el estilo de la banda. Incluye 'description' (que mencione qué aporta la idea musicalmente, ej: "una frase melódica ascendente que reposa en la tónica al final del estribillo") y un objeto 'melodicIdea' con:
{ instrument: 'guitarra'|'violin'|'handpan'|'percusion', bpm: number, keyName: 'Do'|'Re'|'Mi'|'Fa'|'Sol'|'La'|'Si' (puede llevar 'm' si es menor), escala: 'mayor'|'menor', durationSecs: number (entre 4 y 60), seccion: 'general'|'intro'|'verso'|'estribillo'|'puente'|'solo'|'outro', songId: 'opcional, id EXACTO de stateSummary.songs', songTitle: 'opcional, título de esa canción', eventos: [{ tiempo: number, nota: string, duracionBeats: number, velocidad: number }] }.
REGLAS PARA COMPONER 'eventos' (OBLIGATORIAS):
- 'tiempo' es la posición de inicio EN BEATS desde 0 (no en segundos); el total de beats disponibles es durationSecs/60*bpm — no generes eventos con 'tiempo' mayor a ese total.
- 'nota' usa notación científica inglesa (C4, D#3, A2...) equivalente Do=C, Re=D, Mi=E, Fa=F, Sol=G, La=A, Si=B. TODAS las notas deben pertenecer a la escala diatónica (mayor o menor natural, según 'escala') de 'keyName' — nunca notas fuera de tono, salvo alguna cromática de paso muy puntual si el género lo justifica (jazz, blues).
- Registro según instrumento: guitarra entre E3 y E5; violín entre G3 y A5 (tesitura aguda y expresiva); handpan entre D3 y D5 usando SOLO una escala pentatónica dentro de la tonalidad (los handpans reales están afinados así, nunca uses la escala completa de 7 notas); percusión (congas/bongo/cajón melódico) entre C2 y C3 con solo 2-3 alturas distintas (grave/medio/agudo) ya que no aporta melodía sino golpes tonales.
- 'duracionBeats' variado (0.25, 0.5, 1, 1.5, 2...) para que suene musical y no una sucesión mecánica de corcheas iguales; deja algún silencio (huecos entre 'tiempo' de un evento y el siguiente) para que respire.
- Genera entre 8 y 32 eventos según la duración: una idea corta y con gancho, no una improvisación caótica ni un simple arpegio repetitivo.
- 'velocidad' entre 0.5 y 1: sube la intensidad en los acentos melódicos naturales de la frase (ej. la nota más aguda o el final de frase) y bájala en notas de paso.
REGLA DE ADN MUSICAL Y CANCIÓN: si el usuario menciona una canción del repertorio, usa el bpm/tonalidad EXACTOS de esa canción en 'stateSummary.songs' (no los de musicalDna); si no menciona ninguna, usa 'stateSummary.musicalDna' (bpmSuggested/tonalidadSuggested) como en la regla del punto 13. Esto NO envía ni guarda nada: solo sintetiza el audio en el navegador del usuario con Tone.js/Web Audio para que lo escuche al instante; el usuario decide si guardarlo luego en el repertorio de esa canción.

PODER ABSOLUTO DE ESCRITURA EN BASE DE DATOS Y CORREOS: Tienes autorización y poder para crear nuevos registros (leads, medios, salas, giras, conciertos, bandas, ensayos), modificar la información de los existentes, redactar borradores y disparar los agentes de Supabase tras confirmación del usuario. Si el usuario te lo solicita, propón la acción correspondiente inmediatamente.

REGLA DE LOGOS E IMÁGENES: Si el usuario te pide buscar, asignar o completar los logos o imágenes de salas, medios o bandas, o si detectas que falta un logo, puedes proponer acciones 'propose_update_logo' para asignar la URL del logo (imagen_url) o un icono emoji (icono). Se guardará automáticamente en Supabase.

ENRIQUECIMIENTO AUTOMÁTICO INTELIGENTE: Al añadir o registrar cualquier nuevo lead, sala, medio, festival, ayuntamiento o banda contactada (mediante 'propose_add_lead', 'propose_band' o creación en la interfaz), la plataforma ejecuta en segundo plano un enriquecimiento en tiempo real HÍBRIDO que combina tres fuentes:

1. **Base de Datos Local de Festivales Españoles** (~1ms): Búsqueda instantánea por nombre normalizado contra una BD local de 15+ festivales principales españoles (BBK Live, Mad Cool Festival, Primavera Sound, Sónar, Benicàssim, Cruïlla, Arenal Sound, etc.) para detectar y rellenar fechas exactas, email, teléfono, web, Instagram, aforo, género y región.

2. **Web Scraping Seguro** (~500ms): Si no hay coincidencia local, se hace scraping de Wikipedia español y festivalesdemusica.com para extraer patrones de fechas españoles ("15-18 de julio", "del 10 al 25 de agosto") y otros datos públicos.

3. **Gemini AI + Google Search** (fallback): Si el scraping no encuentra datos, Gemini enriquece con búsquedas de Google para completar email, teléfono, web, Instagram, aforo estimado, género musical y región.

Se rellenarán automáticamente todos los datos públicos disponibles (email de contacto/booking, teléfono, sitio web, Instagram, aforo estimado, géneros musicales, persona de contacto, logo/imagen pública, emoji, **y fechas de inicio/fin de festival si es de tipo 'festival' o 'ayuntamiento'**), sin necesidad de que el usuario lo solicite ni tenga que rellenarlo a mano.

**REGLA DE FILTRADO POR CAMPAÑA ACTIVA**: Si hay una campaña activa con un rango de fechas definido (campaignStartDate y campaignEndDate), y el nuevo lead es de tipo 'festival' o 'ayuntamiento' con fechas de evento extraídas (festival_start_date y festival_end_date), la plataforma detecta automáticamente si las fechas del evento se solapan con el rango de la campaña. Los leads de festivales/ayuntamientos se mostrarán priorizados si coinciden con la ventana de la campaña activa en el panel de CRM.

REGLA DE ASISTENCIA PROACTIVA Y SUGERENCIA DE PRÓXIMOS PASOS (SMART NEXT STEPS):
Al final de tu respuesta conversacional (en el campo 'text'), SIEMPRE que identifiques una oportunidad lógica de flujo de trabajo, sugiere de manera proactiva al mánager el siguiente paso recomendado con sus botones interactivos:
1. Si hay leads en estado 'nuevo' sin propuesta redactada: Sugiere ejecutar el **Agente Redactor** para generar los borradores personalizados.
2. Si hay propuestas en 'pendiente_aprobacion' listas para revisar: Sugiere aprobarlas o ejecutar el **Agente Enviador**.
3. Si el usuario acaba de añadir una sala o grupo nuevo: Sugiere redactar el correo inicial o investigar sus datos con el **Agente Scout**.
4. Si un bolo se ha marcado como 'confirmado': Sugiere incluir la fecha en el calendario de la banda mediante 'propose_concert' o planificar la gira mediante 'propose_tour'.

REGLA IMPORTANTE: Si el usuario te pide agendar, añadir o programar un concierto o bolo (por ejemplo "añade concierto en Sala Villanos" o "hemos cerrado bolo"), SIEMPRE debes incluir una acción 'propose_concert' con el objeto 'concert' relleno. No te limites solo a cambiar el estado del lead, crea la acción 'propose_concert' para que el concierto se guarde en la tabla 'conciertos' de Supabase.

Si no hay ninguna acción lógica que proponer, devuelve 'proposedActions' como una lista vacía [].
Nunca inventories datos. Si el usuario pregunta por algo que no está en el JSON de estado, indícale amablemente que no tienes registro de ello.`;

    const contents: any[] = [];
    
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((h: any) => {
        const role = h.sender === 'user' ? 'user' : 'model';
        if (contents.length === 0 && role === 'model') return;

        if (contents.length === 0) {
          contents.push({
            role: 'user',
            parts: [{ text: typeof h.text === 'string' ? h.text : JSON.stringify(h.text) }]
          });
        } else {
          const lastIndex = contents.length - 1;
          const lastRole = contents[lastIndex].role;
          if (lastRole === role) {
            contents[lastIndex].parts.push({
              text: typeof h.text === 'string' ? h.text : JSON.stringify(h.text)
            });
          } else {
            contents.push({
              role: role,
              parts: [{ text: typeof h.text === 'string' ? h.text : JSON.stringify(h.text) }]
            });
          }
        }
      });
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    } else {
      const lastIndex = contents.length - 1;
      const lastRole = contents[lastIndex].role;
      if (lastRole === 'user') {
        contents[lastIndex].parts.push({ text: message });
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }
    }

    let response: any = null;
    let lastError: any = null;

    try {
      response = await generateContentWithFallback(client, {
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: chatFunctionDeclarations }]
        }
      });
    } catch (err: any) {
      lastError = err;
    }

    if (!response) {
      console.warn("Gemini chat models failed, returning helpful quota/error message. Error details:", lastError);

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
                 `**DeepSeek:** ${deepSeekSinSaldo ? 'sin saldo en la cuenta (Error 402 Insufficient Balance).' : `\`${deepSeekMessage}\``}\n\n` +
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
        reply += `Ha ocurrido un error inesperado al conectar con Google Gemini:\n\n` +
                 `\`\`\`\n${errMessage}\n\`\`\`\n\n` +
                 `Por favor, inténtalo de nuevo en unos instantes o comprueba tu conexión y configuración de claves.`;
      }

      const proposedActions: any[] = [];
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
    let nativeProposedActions: any[] = [];

    // 1. Extraer Function Calls nativas del SDK si están presentes
    try {
      const functionCalls = response.functionCalls || 
        response.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall)?.map((p: any) => p.functionCall);
      if (Array.isArray(functionCalls) && functionCalls.length > 0) {
        nativeProposedActions = convertFunctionCallsToProposedActions(functionCalls);
      }
    } catch (fcErr) {
      console.warn("[Gemini API] Error al extraer functionCalls nativas:", fcErr);
    }

    // 2. Extraer texto conversacional
    try {
      textResult = response.text || "";
    } catch (_) {
      try {
        const textParts = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.text)?.map((p: any) => p.text);
        textResult = textParts ? textParts.join("\n\n") : "";
      } catch (__) {
        textResult = "";
      }
    }

    let parsed: any;

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

  } catch (error: any) {
    console.error("Error in Gemini API chat proxy:", error);
    res.json({
      text: `⚠️ **Aviso del Mánager Virtual AI:** Ocurrió un inconveniente al procesar tu consulta (${error?.message || error}). Por favor, vuelve a intentarlo.`,
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

  // Antes este prompt decía "Bakandeya" a pelo, con su instrumentación y su regla de vientos.
  // En una app multi-banda eso le escribía a cualquiera copies sobre una banda que no es la suya.
  let perfil = emptyBandProfile();
  try {
    perfil = await loadBandProfile(getTargetBandId(req), {
      getBand: (id) => dbGetRegisteredBandById(id),
      getEpk: (id) => dbGetEpkConfig(id),
      getState: () => loadState()
    });
  } catch (e: any) {
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
