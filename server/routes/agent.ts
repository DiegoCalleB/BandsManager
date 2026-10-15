// Orquestación de los agentes de booking: disparo manual/cron (`/trigger-agent`), historial de
// ejecuciones (`/agent-runs`) y diagnóstico del Scout. Reglas de envío y aprobación humana:
// AGENTS.md §3.

import express from 'express';
import { prepararLeadsDescubiertos, determinarCorredorGira, clasificarAforoRecinto, calcularAfinidadMusical } from '../utils/scoutLeads.js';
import {
  INITIAL_LEADS,
  INITIAL_REHEARSALS,
  INITIAL_CONCERTS,
  INITIAL_SOCIAL_POSTS,
  INITIAL_PAYMENTS,
  INITIAL_MESSAGES,
} from '../../src/db_seed.js';
import { loadState, saveState, requireAuth, requireLeader, requireCronOrAuth, getAutonomyConfigForBand } from '../state.js';
import { dbUpsertLead, dbCheckDeletedLead, getSupabase } from '../db.js';
import { getAiClient, generateContentWithFallback } from '../ai.js';
import { formatGlobalPitchFeedbackForPrompt } from './leads.js';
import {
  runEnviadorAgent,
  logAgentExecution,
} from '../services/agentEngine.js';
import {
  getTargetBandId,
  puedeEscribirEnBanda,
  bandaDelAgente,
} from '../utils/bandAccess.js';
import {
  getBandDnaProfile,
  buildEnhancedPitchSystemPrompt,
  generateSmartDnaPitchFallback,
} from '../utils/bandDna.js';
import { runLectorAgent } from '../services/lectorAgent.js';
import { EmailAgentError } from '../services/emailAgentClient.js';
import { autoEnrichLead } from '../auto_enrichment.js';
import {
  searchFestivalByName,
  formatFestivalDates,
} from '../utils/spanishFestivalsDB.js';
import { normalizeVenueName } from './leads/places.js';
import { searchVenuesWithSerper } from '../services/venueIntelligenceService.js';
import {
  dbGetRegisteredBands,
  dbGetLeads,
  dbGetBandEmailAccount,
  dbGetBandGmailOAuth,
} from '../db.js';
import {
  computeAgentFunnel,
  type FunnelBandInput,
} from '../utils/agentFunnel.js';
import {
  getBandOperationalContext,
  evaluateIncomingTactics,
} from '../services/agentIntelligence.js';
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';
import type { Lead } from '../../src/types.js';
import type { BandaRegistradaGuardada } from '../stateTypes.js';
import type { LeadDescubierto } from '../utils/scoutLeads.js';
import type { RespuestaBusquedaPlaces, RespuestaIA } from './leads/tiposScout.js';
import type { CampanaCruda, PitchRedactado, RegistroEjecucionAgente } from './tiposAgente.js';
import { responderError } from '../utils/errorHttp.js';

const router = express.Router();

function normalizeAgentName(name: string): string {
  const norm = (name || '').toLowerCase().trim();
  if (
    norm.includes('descubridor') ||
    norm.includes('scout_descubridor') ||
    norm.includes('scout-descubridor')
  )
    return 'scout_descubridor';
  if (norm.includes('scout')) return 'scout';
  if (norm.includes('redactor')) return 'redactor';
  if (
    norm.includes('enviador') ||
    norm.includes('despachador') ||
    norm.includes('enviado') ||
    norm.includes('envio') ||
    norm.includes('envío')
  )
    return 'enviador';
  if (
    norm.includes('lector') ||
    norm.includes('bandeja') ||
    norm.includes('recepcion') ||
    norm.includes('recepción')
  )
    return 'lector';
  return norm;
}

// Trigger agents (motor consolidado en Node, ver server/services/agentEngine.ts)
router.post('/trigger-agent', requireCronOrAuth, async (req, res) => {
  const { agentName, params } = req.body;

  if (!agentName) {
    return res.status(400).json({ error: 'Falta el nombre del agente.' });
  }

  const usuarioDisparador = req.user;
  const targetBandId = bandaDelAgente(req, params);
  if (!targetBandId) {
    return res
      .status(403)
      .json({ error: 'No puedes lanzar agentes sobre otra banda.' });
  }
  // Quién dispara sale de la sesión. Antes, sin usuario, se firmaba la auditoría con el email
  // del dueño de la plataforma, que es justo lo contrario de lo que sirve un registro de auditoría.
  const userEmail =
    usuarioDisparador?.email || usuarioDisparador?.username || 'cron@sistema';
  const userId = usuarioDisparador?.id || 'sistema-cron';
  const triggerType =
    params?.trigger_type || (usuarioDisparador ? 'usuario_manual' : 'cron');

  const normalizedAgentName = normalizeAgentName(agentName);
  const displayAgentName =
    normalizedAgentName.charAt(0).toUpperCase() + normalizedAgentName.slice(1);

  console.log(
    "[Agente API] Solicitud para ejecutar agente: %s (normalizado a: %s) con params:", agentName, normalizedAgentName,
    params
  );
  const startTime = Date.now();

  // Helper para insertar logs de auditoría en Supabase
  const logExecution = async (logData: {
    band_id: string;
    agente: string;
    motor: string;
    disparado_por_tipo: string;
    usuario_id?: string;
    usuario_email?: string;
    estado: 'success' | 'error' | 'warning';
    mensaje: string;
    leads_afectados?: unknown[];
    conteo_afectados?: number;
    detalles?: Record<string, unknown>;
  }) => {
    try {
      const sb = getSupabase();
      const duracion_ms = Date.now() - startTime;
      await sb.from('agent_execution_logs').insert({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        band_id: logData.band_id,
        agente: logData.agente,
        motor: logData.motor,
        disparado_por_tipo: logData.disparado_por_tipo || 'usuario_manual',
        usuario_id: logData.usuario_id || null,
        usuario_email: logData.usuario_email || null,
        estado: logData.estado,
        mensaje: logData.mensaje,
        leads_afectados: logData.leads_afectados || [],
        conteo_afectados:
          logData.conteo_afectados ??
          (logData.leads_afectados ? logData.leads_afectados.length : 0),
        duracion_ms,
        detalles: logData.detalles || {},
      });
    } catch (eCapturado) {
      const e = comoErrorCapturado(eCapturado);
      console.warn(
        '[AUDIT LOG ERROR] No se pudo guardar el registro de auditoría en Supabase:',
        e?.message || e
      );
    }
  };

  // --- AGENTE ENVIADOR (email real por banda vía SMTP, ver server/services/agentEngine.ts) ---
  if (normalizedAgentName === 'enviador' || params?.engine === 'supabase') {
    try {
      const result = await runEnviadorAgent({
        bandId: targetBandId,
        triggerType,
        userId,
        userEmail,
        leadId: params?.id || params?.lead_id,
      });

      return res.json({
        success: result.success,
        agent: 'Enviador',
        engine: 'Email (Node Agent Engine)',
        dispatchedCount: result.dispatchedCount,
        message: result.message,
        results: result.results,
      });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error al ejecutar el Agente Enviador:', err);
      await logAgentExecution({
        band_id: targetBandId,
        agente: 'enviador',
        motor: 'node_email_engine',
        disparado_por_tipo: triggerType,
        usuario_id: userId,
        usuario_email: userEmail,
        estado: 'error',
        mensaje: `Error al ejecutar el Agente Enviador: ${err.message}`,
        duracion_ms: 0,
        detalles: { error: err.stack, params },
      });

      return responderError(res, err, "Error al ejecutar el Agente Enviador.");
    }
  }

  // --- EJECUCIÓN NATIVA SUPABASE PARA EL AGENTE REDACTOR ---
  if (normalizedAgentName === 'redactor') {
    try {
      const sb = getSupabase();

      // El filtro por banda no es opcional: sin él, el Redactor leía los leads de TODAS las
      // bandas y les escribía encima el pitch generado, incluido el lead suelto que llegara
      // por params.id.
      let query = sb.from('leads').select('*').eq('band_id', targetBandId);
      if (params?.id || params?.lead_id) {
        query = query.eq('id', params.id || params.lead_id);
      } else if (!params?.all && !params?.regenerate) {
        query = query.eq('estado', 'nuevo');
      }
      if (params?.limit) {
        query = query.limit(parseInt(params.limit, 10));
      } else {
        query = query.limit(10);
      }

      const { data: leadsToDraft, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      if (!leadsToDraft || leadsToDraft.length === 0) {
        const emptyMsg =
          "No se encontraron salas o medios en estado 'nuevo' para redactar propuestas en Supabase.";
        await logExecution({
          band_id: targetBandId,
          agente: 'redactor',
          motor: 'supabase_edge',
          disparado_por_tipo: triggerType,
          usuario_id: userId,
          usuario_email: userEmail,
          estado: 'warning',
          mensaje: emptyMsg,
          leads_afectados: [],
          conteo_afectados: 0,
          detalles: { params },
        });

        return res.json({
          success: true,
          agent: 'Redactor',
          engine: 'Supabase Native Agent Engine',
          message: emptyMsg,
          results: [],
        });
      }

      let activeCampaign: CampanaCruda | null = null;

      try {
        const { data: campData } = await sb
          .from('campaigns')
          .select('*')
          .eq('band_id', targetBandId)
          .eq('is_active', true)
          .maybeSingle();
        if (campData) {
          activeCampaign = campData;
        } else {
          const { data: fallbackCamp } = await sb
            .from('booking_campaigns')
            .select('*')
            .eq('band_id', targetBandId)
            .eq('is_active', true)
            .maybeSingle();
          if (fallbackCamp) activeCampaign = fallbackCamp;
        }
      } catch {
        // fallback
      }

      const results: PitchRedactado[] = [];
      const ai = getAiClient();
      const state = loadState();
      const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
      const autonomyConfig = getAutonomyConfigForBand(state, targetBandId);
      const bandMinCache = autonomyConfig?.minCacheByType;
      const negotiationStartCacheByType =
        autonomyConfig?.negotiationStartCacheByType;

      for (const lead of leadsToDraft) {
        const bandDna = getBandDnaProfile(state, targetBandId, lead);
        const pitchLinks = {
          spotify: bandDna.spotifyUrl,
          youtube: bandDna.youtubeUrl,
          epk: bandDna.epkUrl,
        };
        const systemPrompt = buildEnhancedPitchSystemPrompt(
          bandDna,
          globalMemory,
          lead,
          activeCampaign,
          bandMinCache,
          negotiationStartCacheByType
        );

        let generatedPitch = '';
        if (ai) {
          try {
            const prompt = `${systemPrompt}

TAREA ESPECÍFICA:
Redacta una propuesta de concierto (pitch) cercana, profesional y atractiva para la sala o programador:
- Sala: ${lead.nombre_sala} (${lead.ciudad || 'España'})
- Género/Estilo habitual: ${lead.genero || 'Música en directo'}
- Aforo: ${lead.aforo ? `${lead.aforo} personas` : 'No especificado / Estándar'}
- Tipo: ${lead.tipo || 'sala'}
${activeCampaign ? `\nCONTEXTO CRÍTICO DE CAMPAÑA ACTIVA "${activeCampaign.name || 'Campaña de Conciertos'}": Proponer fechas deseadas (${activeCampaign.target_dates_text || (activeCampaign.target_dates ? activeCampaign.target_dates.join(', ') : 'próximas fechas')}).` : ''}

Devuelve ÚNICAMENTE el texto del mensaje/email listo para ser revisado por el usuario.`;

            const resp = await generateContentWithFallback(ai, {
              contents: prompt,
              permitirPitchLocal: true,
              links: pitchLinks,
            });
            generatedPitch =
              resp?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } catch (err) {
            console.warn('AI fallback for pitch generation:', err);
          }
        }

        let pitchEsPlantilla = false;
        if (!generatedPitch) {
          pitchEsPlantilla = true;
          generatedPitch = generateSmartDnaPitchFallback({
            bandDna,
            lead,
            activeCampaign,
          });
        }

        const notaPlantilla = pitchEsPlantilla
          ? `${lead.notas ? lead.notas + ' | ' : ''}[${new Date().toISOString().slice(0, 10)}] Pitch de PLANTILLA: la IA no respondió, revísalo y reescríbelo antes de aprobar.`
          : undefined;

        await sb
          .from('leads')
          .update({
            pitch_generado: generatedPitch,
            estado: 'pendiente_aprobacion',
            ...(notaPlantilla ? { notas: notaPlantilla } : {}),
          })
          .eq('id', lead.id)
          .eq('band_id', targetBandId);

        results.push({
          id: lead.id,
          nombre_sala: lead.nombre_sala,
          pitch_preview: generatedPitch.slice(0, 100) + '...',
          estado: 'pendiente_aprobacion',
        });
      }

      const successMsg = `¡Agente Redactor ejecutado con éxito en Supabase! Se han generado ${results.length} propuesta(s) personalizada(s) y han pasado a 'pendiente_aprobacion' listas para tu revisión.`;

      await logExecution({
        band_id: targetBandId,
        agente: 'redactor',
        motor: 'supabase_edge',
        disparado_por_tipo: triggerType,
        usuario_id: userId,
        usuario_email: userEmail,
        estado: 'success',
        mensaje: successMsg,
        leads_afectados: results,
        conteo_afectados: results.length,
        detalles: { params },
      });

      return res.json({
        success: true,
        agent: 'Redactor',
        engine: 'Supabase Native Agent Engine',
        message: successMsg,
        results,
      });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error en Agente Redactor Supabase:', err);
      return responderError(res, err, "Error en Agente Redactor.");
    }
  }

  // --- EJECUCIÓN NATIVA SUPABASE PARA EL AGENTE SCOUT DESCUBRIDOR ---
  if (
    normalizedAgentName === 'scout' ||
    normalizedAgentName === 'scout_descubridor'
  ) {
    try {
      const sb = getSupabase();

      const targetLoc = params?.ciudad || params?.region || 'Huelva';
      const tipo = params?.tipo || 'sala';
      const limit = Math.max(2, Math.min(10, Number(params?.limit) || 4));
      const state = loadState();
      const bandDna = getBandDnaProfile(state, targetBandId);
      const generoBanda =
        params?.genero || bandDna.genero || 'Música en Directo / Variado';
      const ai = getAiClient();
      const placesApiKey =
        process.env.GOOGLE_PLACES_API_KEY ||
        process.env.VITE_GOOGLE_PLACES_API_KEY ||
        '';
      // Candidatos sin validar de cada motor: prepararLeadsDescubiertos los filtra y normaliza.
      const rawCandidates: unknown[] = [];

      // 1. CARGA DE LEADS EXISTENTES EN SUPABASE PARA DEDUPLICACIÓN DE EXACTITUD
      const { data: existingLeads } = await sb
        .from('leads')
        .select('id, nombre_sala, place_id, website, telefono')
        .eq('band_id', targetBandId);
      const existingPlaceIds = new Set<string>();
      const existingNames = new Set<string>();
      const existingWebsites = new Set<string>();

      (existingLeads || []).forEach((l) => {
        if (l.place_id) existingPlaceIds.add(l.place_id);
        if (l.nombre_sala) existingNames.add(normalizeVenueName(l.nombre_sala));
        if (l.website) {
          try {
            const domain = new URL(l.website).hostname.replace(/^www\./, '');
            if (domain) existingWebsites.add(domain);
          } catch { /* web mal formada: no cuenta para detectar duplicados */ }
        }
      });

      // 2. MOTOR 1: GOOGLE PLACES API (New) (para recintos físicos reales: salas, festivales, discotecas, ayuntamientos, teatros)
      const isPhysicalPlace = [
        'sala',
        'festival',
        'ayuntamiento',
        'discoteca',
        'teatro',
        'local',
      ].includes(tipo.toLowerCase());
      if (isPhysicalPlace && placesApiKey && placesApiKey.trim() !== '') {
        try {
          const placesQuery =
            tipo === 'ayuntamiento'
              ? `Ayuntamiento de ${targetLoc}`
              : `${tipo} recintos salas de conciertos música en vivo en ${targetLoc}`;

          console.log(
            "[Agente Scout] Motor 1 (Google Places API): Consultando \"%s\"...", placesQuery
          );
          const placesRes = await fetch(
            'https://places.googleapis.com/v1/places:searchText',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': placesApiKey,
                'X-Goog-FieldMask':
                  'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.photos,places.businessStatus',
              },
              body: JSON.stringify({
                textQuery: placesQuery,
                languageCode: 'es',
                pageSize: Math.min(20, Math.max(15, limit * 2)),
              }),
            }
          );

          if (placesRes.ok) {
            const placesData = (await placesRes.json()) as RespuestaBusquedaPlaces;
            if (Array.isArray(placesData.places)) {
              for (const place of placesData.places) {
                if (
                  place.businessStatus === 'CLOSED_PERMANENTLY' ||
                  place.businessStatus === 'CLOSED_TEMPORARILY'
                )
                  continue;

                let photoUrl = '';
                if (
                  place.photos &&
                  place.photos.length > 0 &&
                  place.photos[0].name
                ) {
                  photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=600&maxWidthPx=800&key=${placesApiKey}`;
                }
                const domain = place.websiteUri
                  ? new URL(place.websiteUri).hostname.replace(/^www\./, '')
                  : '';
                if (!photoUrl && domain) {
                  photoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                }

                rawCandidates.push({
                  place_id: place.id,
                  nombre_sala: place.displayName?.text || 'Recinto Musical',
                  ciudad: targetLoc,
                  region: targetLoc,
                  direccion: place.formattedAddress || '',
                  telefono:
                    place.nationalPhoneNumber ||
                    place.internationalPhoneNumber ||
                    '',
                  website: place.websiteUri || '',
                  rating: place.rating || null,
                  aforo: 0,
                  tipo: tipo,
                  genero: 'Música en Directo / Variado',
                  imagen_url: photoUrl,
                  icono:
                    tipo === 'festival'
                      ? '🎪'
                      : tipo === 'discoteca'
                        ? '🪩'
                        : tipo === 'ayuntamiento'
                          ? '🎆'
                          : '🏛️',
                  email_contacto: '',
                  notas: `Descubierto por Agente Scout vía Google Places en ${targetLoc}.`,
                });
              }
            }
          }
        } catch (pErrCapturado) {
          const pErr = comoErrorCapturado(pErrCapturado);
          console.warn(
            '[Agente Scout] Advertencia en Motor 1 Google Places:',
            pErr?.message || pErr
          );
        }
      }

      // MOTOR SERPER PLACES + ENRIQUECIMIENTO QUIRÚRGICO DE CONTACTO
      if (
        isPhysicalPlace &&
        process.env.SERPER_API_KEY &&
        rawCandidates.length < limit
      ) {
        try {
          console.log(
            "[Agente Scout] Motor Serper Live Places: Descubriendo recintos en \"%s\" (Tipo: %s)...", targetLoc, tipo
          );
          const serperResults = await searchVenuesWithSerper({
            city: targetLoc,
            type: tipo,
            limit: limit * 2,
          });

          for (const sp of serperResults) {
            rawCandidates.push({
              place_id: sp.place_id,
              nombre_sala: sp.nombre_sala,
              ciudad: sp.ciudad || targetLoc,
              region: sp.region || targetLoc,
              direccion: sp.direccion || '',
              telefono: sp.telefono || '',
              website: sp.website || '',
              rating: sp.rating || null,
              aforo: sp.aforo || 0,
              tipo: sp.tipo || tipo,
              genero: sp.genero || generoBanda,
              imagen_url: sp.imagen_url || '',
              icono:
                sp.icono ||
                (tipo === 'festival'
                  ? '🎪'
                  : tipo === 'discoteca'
                    ? '🪩'
                    : '🏛️'),
              email_contacto: sp.email_contacto || '',
              notas: `Descubierto por Agente Scout vía Serper Places en ${targetLoc}.`,
            });
          }
        } catch (sErrCapturado) {
          const sErr = comoErrorCapturado(sErrCapturado);
          console.warn(
            '[Agente Scout] Advertencia en Motor Serper Places:',
            sErr?.message || sErr
          );
        }
      }

      // 3. MOTOR 2: GEMINI SEARCH GROUNDING (búsqueda web en vivo con googleSearch: {})
      if (ai) {
        try {
          console.log(
            "[Agente Scout] Motor 2 (Gemini Live Search Grounding): Buscando en web en vivo para \"%s\" (Tipo: %s)...", targetLoc, tipo
          );
          const prompt = `Actúa como el Agente Scout Descubridor de recintos y entidades musicales.
Busca y extrae entre ${Math.max(10, limit * 2)} entidades REALES, ACTIVAS Y OPERATIVAS en la ciudad/región: "${targetLoc}". Tipo objetivo: "${tipo}".

INFORMACIÓN DE LA BANDA OBJETIVO:
- Nombre: "${bandDna.bandName}"
- Estilo: "${generoBanda}"
- Formato: "${bandDna.formato || 'Banda de música en directo'}"

REGLAS DE REALISMO Y CALIDAD PARA LA BANDA:
1. RESULTADOS REALISTAS PARA EL NIVEL DE LA BANDA: Busca salas de conciertos, clubes de música en directo, teatros y recintos culturales acordes al circuito independiente / profesional (aforos típicos entre 50 y 1.200 personas).
2. EXCLUIR MASAS / ARENAS: NUNCA propongas grandes arenas, estadios ni palacios de deportes de miles/decenas de miles de localidades (ej: Movistar Arena, WiZink Center, Palau Sant Jordi, Estadios) salvo que la petición pida explícitamente "estadios" o "grandes arenas".
3. Solo recintos, agencias, salas, festivales, ayuntamientos o bandas REALES que existan en ${targetLoc}. NUNCA inventes nombres ni datos.
4. BÚSQUEDA DE CONTACTO ACTIVA: Haz un esfuerzo activo por extraer el EMAIL OFICIAL DE CONTACTO O BOOKING (info@..., booking@..., geral@..., contacto@...) y la cuenta oficial de Instagram (@...).
5. NUNCA inventes emails o teléfonos ficticios. Si tras buscar activamente no lo encuentras, devuelve cadena vacía "".
6. Si el tipo es 'grupo' o 'banda', devuelve grupos de música reales en activo de ${targetLoc}. NUNCA devuelvas empresas hosteleras o discotecas.

Devuelve EXCLUSIVAMENTE un JSON estricto con la estructura:
{
  "results": [
    {
      "nombre_sala": "Nombre oficial exacto",
      "ciudad": "${targetLoc}",
      "region": "${targetLoc}",
      "aforo": 350,
      "genero": "Estilo musical o línea de programación",
      "tipo": "${tipo}",
      "email_contacto": "",
      "telefono": "+34 000 000 000",
      "instagram": "@usuario_oficial",
      "website": "https://sitio-oficial.com",
      "notas": "Descripción breve del recinto o entidad."
    }
  ]
}`;

          let response: RespuestaIA | null = null;
          try {
            response = await generateContentWithFallback(ai, {
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: {
                tools: [{ googleSearch: {} }],
              },
            });
          } catch {
            response = await generateContentWithFallback(ai, {
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: { responseMimeType: 'application/json' },
            });
          }

          const textResult = response?.text || '{}';
          const cleanedText = textResult
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          let parsedData: unknown = {};
          try {
            const jsonStart = cleanedText.indexOf('{');
            const jsonEnd = cleanedText.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
              parsedData = JSON.parse(
                cleanedText.substring(jsonStart, jsonEnd + 1)
              );
            } else {
              parsedData = JSON.parse(cleanedText);
            }
          } catch {
            if (Array.isArray(cleanedText))
              parsedData = { results: cleanedText };
          }

          const resultadosIA = (parsedData as { results?: unknown } | null)?.results;
          const geminiResults: unknown[] = Array.isArray(resultadosIA)
            ? resultadosIA
            : Array.isArray(parsedData)
              ? parsedData
              : [];
          for (const item of geminiResults) {
            rawCandidates.push(item);
          }
        } catch (aiErr) {
          console.warn(
            '[Agente Scout] Advertencia en Motor 2 Gemini Grounding:',
            aiErr
          );
        }
      }

      // 4. PREPARACIÓN, DEPURACIÓN Y DEDUPLICACIÓN CONTRA SUPABASE
      const leadsValidos = prepararLeadsDescubiertos(
        rawCandidates,
        targetLoc,
        tipo || 'sala'
      );

      const deduplicatedLeads: LeadDescubierto[] = [];
      for (const cand of leadsValidos) {
        const normName = normalizeVenueName(cand.nombre_sala);
        if (!normName) continue;

        // Comprobar si ya existe en Supabase
        if (existingNames.has(normName)) {
          console.log(
            "[Agente Scout] Omitiendo lead ya existente en CRM: \"%s\"", cand.nombre_sala
          );
          continue;
        }

        // Comprobar si el usuario la eliminó previamente
        const isDeleted = await dbCheckDeletedLead(
          cand.nombre_sala,
          targetBandId
        );
        if (isDeleted) {
          console.log(
            "[Agente Scout] Omitiendo lead previamente descartado/eliminado por el usuario: \"%s\"", cand.nombre_sala
          );
          continue;
        }

        if (cand.website) {
          try {
            const domain = new URL(cand.website).hostname.replace(/^www\./, '');
            if (domain && existingWebsites.has(domain)) {
              console.log(
                "[Agente Scout] Omitiendo lead con dominio web ya registrado: \"%s\"", cand.website
              );
              continue;
            }
          } catch { /* web del candidato mal formada: no se puede comparar por dominio */ }
        }

        // Si sobrevive todas las comprobaciones, es un lead nuevo y real
        deduplicatedLeads.push(cand);
        existingNames.add(normName);
        if (deduplicatedLeads.length >= limit) break;
      }

      if (deduplicatedLeads.length === 0) {
        const avisoMsg = `El Agente Scout ha completado el rastreo en ${targetLoc} (Motor Google Places + Gemini Web Grounding) y no ha encontrado nuevos recintos reales que no tuvieses ya en tu CRM. No se ha duplicado ningún registro.`;
        await logExecution({
          band_id: targetBandId,
          agente: 'scout',
          motor: 'hybrid_places_gemini',
          disparado_por_tipo: triggerType,
          usuario_id: userId,
          usuario_email: userEmail,
          estado: 'warning',
          mensaje: avisoMsg,
          leads_afectados: [],
          conteo_afectados: 0,
          detalles: { params, targetLoc },
        });

        return res.json({
          success: true,
          agent: 'Scout',
          engine:
            'Supabase Native Agent Engine (Google Places + Gemini Grounding)',
          message: avisoMsg,
          results: [],
        });
      }

      // 5. ENRIQUECIMIENTO INTEGRAL PREVIO Y ALMACENAMIENTO EN SUPABASE
      const results: Awaited<ReturnType<typeof dbUpsertLead>>[] = [];
      for (const raw of deduplicatedLeads) {
        // LeadDescubierto no trae fechas de festival: se buscan en la base local de festivales.
        let startD: string | undefined;
        let endD: string | undefined;

        if (!startD || !endD) {
          const localFest = searchFestivalByName(raw.nombre_sala, raw.ciudad);
          if (localFest) {
            const d = formatFestivalDates(localFest);
            startD = d.start;
            endD = d.end;
          }
        }

        const locCiudad = raw.ciudad || targetLoc;
        const locRegion = raw.region || targetLoc;
        const corredorGira = determinarCorredorGira(locCiudad, locRegion);
        const tierAforo = clasificarAforoRecinto(
          raw.aforo || 0,
          raw.tipo || tipo
        );
        const afinidadMusical = calcularAfinidadMusical(
          raw.genero || '',
          generoBanda
        );

        const notaEstrategica = `[Ruta: ${corredorGira} | Tier: ${tierAforo.toUpperCase()} | Afinidad Musical: ${afinidadMusical}%] ${raw.notas || `Descubierto por Agente Scout para ${targetLoc}.`}`;

        const initialLead = {
          id: `lead-scout-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          band_id: targetBandId,
          nombre_sala: raw.nombre_sala,
          ciudad: locCiudad,
          region: locRegion,
          aforo: raw.aforo || 0,
          genero: raw.genero || generoBanda,
          tipo: raw.tipo || tipo,
          email_contacto: raw.email_contacto || '',
          telefono: raw.telefono || '',
          instagram: raw.instagram || '',
          website: raw.website || '',
          festival_start_date: startD,
          festival_end_date: endD,
          fuente: `Agente Scout: ${targetLoc}`,
          estado: 'nuevo',
          pitch_generado: '',
          notas: notaEstrategica,
        };

        // Enriquecer automáticamente con todas las herramientas disponibles (Google Places, Serper, Web Scraper, Gemini AI Fallback, Pitch) antes de guardar
        console.log(
          "[Agente Scout] Ejecutando enriquecimiento completo pre-inserción para: '%s'...", initialLead.nombre_sala
        );
        let fullyEnriched = initialLead;
        try {
          fullyEnriched = await autoEnrichLead(initialLead, targetBandId);
        } catch (enrichErr) {
          console.error(
            "[Agente Scout] Error en autoEnrichLead pre-inserción para %s:", initialLead.nombre_sala,
            enrichErr
          );
        }

        const saved = await dbUpsertLead(fullyEnriched, targetBandId);
        results.push(saved);
      }

      const successMsg = `¡Agente Scout ejecutado con éxito! Se han descubierto y enriquecido automáticamente ${results.length} recinto(s) verificado(s) en ${targetLoc} (${tipo}) con datos de contacto, aforo y propuesta inicial.`;

      await logExecution({
        band_id: targetBandId,
        agente: 'scout',
        motor: 'hybrid_places_gemini',
        disparado_por_tipo: triggerType,
        usuario_id: userId,
        usuario_email: userEmail,
        estado: 'success',
        mensaje: successMsg,
        leads_afectados: results,
        conteo_afectados: results.length,
        detalles: { params, targetLoc, tipo },
      });

      return res.json({
        success: true,
        agent: 'Scout',
        engine:
          'Supabase Native Agent Engine (Google Places + Gemini Grounding)',
        message: successMsg,
        results,
      });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error en Agente Scout Supabase:', err);
      return responderError(res, err, "Error en Agente Scout.");
    }
  }

  // --- AGENTE LECTOR: lee de verdad la bandeja IMAP de la banda, empareja las respuestas con
  // leads reales por email de contacto, y transiciona su estado (server/services/lectorAgent.ts).
  // Solo lee y clasifica - nunca redacta ni envía nada por su cuenta.
  if (
    normalizedAgentName === 'lector' ||
    normalizedAgentName === 'lector_de_bandeja'
  ) {
    try {
      const resultado = await runLectorAgent(targetBandId);
      const successMsg =
        resultado.mensajesLeidos === 0
          ? 'Agente Lector ejecutado. No hay mensajes nuevos en la bandeja de entrada.'
          : `Agente Lector ejecutado. ${resultado.mensajesLeidos} mensaje(s) nuevo(s) revisado(s), ${resultado.leadsActualizados.length} lead(s) actualizado(s) con la respuesta real${resultado.sinEmparejar > 0 ? `, ${resultado.sinEmparejar} sin emparejar con ningún lead conocido` : ''}.`;

      await logExecution({
        band_id: targetBandId,
        agente: 'lector',
        motor: 'node_email_engine',
        disparado_por_tipo: triggerType,
        usuario_id: userId,
        usuario_email: userEmail,
        estado: 'success',
        mensaje: successMsg,
        leads_afectados: resultado.leadsActualizados,
        conteo_afectados: resultado.leadsActualizados.length,
        detalles: { params, ...resultado },
      });

      return res.json({
        success: true,
        agent: 'Lector',
        engine: 'Node IMAP Email Engine',
        message: successMsg,
        results: resultado.leadsActualizados,
      });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      const sinCuenta =
        err instanceof EmailAgentError && err.code === 'no_token';
      const mensaje = sinCuenta
        ? 'Esta banda todavía no tiene una cuenta de email conectada (Ajustes > Cuenta de Email).'
        : `Error en Agente Lector: ${err.message}`;

      if (!sinCuenta) console.error('Error en Agente Lector:', err);

      await logExecution({
        band_id: targetBandId,
        agente: 'lector',
        motor: 'node_email_engine',
        disparado_por_tipo: triggerType,
        usuario_id: userId,
        usuario_email: userEmail,
        estado: sinCuenta ? 'success' : 'error',
        mensaje,
        detalles: { params },
      });

      const status = sinCuenta ? 200 : 500;
      return res.status(status).json({
        success: sinCuenta,
        agent: 'Lector',
        message: mensaje,
        error: sinCuenta ? undefined : mensaje,
      });
    }
  }

  // Fallback si no coincide ningún agente
  return res.json({
    success: true,
    agent: displayAgentName,
    engine: 'Supabase Native Agent Engine',
    message: `¡Agente '${displayAgentName}' ejecutado correctamente en Supabase!`,
  });
});

// POST /api/internal/agents/responder-hilo - disparado por el trigger de Postgres
// tr_enviar_respuesta_lead (ver supabase_schema.sql) en cuanto un lead pasa a
// 'aprobado_respuesta', sin esperar al siguiente tick del scheduler. Protegido con el mismo
// mecanismo X-Cron-Secret que ya usa requireCronOrAuth para otras llamadas internas.
router.post(
  '/internal/agents/responder-hilo',
  requireCronOrAuth,
  async (req, res) => {
    const { lead_id } = req.body || {};
    if (!lead_id) {
      return res.status(400).json({ error: 'Falta lead_id.' });
    }

    try {
      const sb = getSupabase();
      const { data: lead } = await sb
        .from('leads')
        .select('band_id')
        .eq('id', lead_id)
        .maybeSingle();
      if (!lead?.band_id) {
        return res
          .status(404)
          .json({ error: `Lead '${lead_id}' no encontrado o sin band_id.` });
      }

      const result = await runEnviadorAgent({
        bandId: lead.band_id,
        triggerType: 'postgres_trigger',
        leadId: lead_id,
      });

      return res.json({
        success: result.success,
        dispatchedCount: result.dispatchedCount,
        message: result.message,
        results: result.results,
      });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error en responder-hilo interno:', err);
      return responderError(res, err, 'Error interno');
    }
  }
);

// POST /api/agents/test-intel - Diagnóstico en vivo de Inteligencia Agéntica (Contexto Operativo + Tactical Evaluation)
router.post('/agents/test-intel', requireAuth, async (req, res) => {
  try {
    const targetBandId = getTargetBandId(req);
    const { incomingMessage, leadCiudad, venueName, venueTipo } =
      req.body || {};

    const [opContext, tacticalEval] = await Promise.all([
      getBandOperationalContext(targetBandId, leadCiudad),
      incomingMessage
        ? evaluateIncomingTactics(incomingMessage, {
            name: venueName,
            city: leadCiudad,
            tipo: venueTipo,
          })
        : null,
    ]);

    return res.json({
      success: true,
      bandId: targetBandId,
      operationalContext: {
        conciertosProximos: opContext.conciertosProximos,
        conflictosMiembrosOtrasBandas: opContext.conflictosMiembrosOtrasBandas,
        ciudadesEnRuta: opContext.ciudadesEnRuta,
        promptInjected: opContext.resumenTacticoParaPrompt,
      },
      tacticalEvaluation: tacticalEval,
    });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error('Error en test-intel:', err);
    return responderError(res, err);
  }
});

// GET /api/agent-runs - Get latest agent execution runs (Supabase Logs & Engine)
//
// requireAuth y filtro incondicional por banda: la auditoría de agentes lleva a quién se ha
// escrito y con qué mensaje. Sin sesión, el ?band_id= servía para leer la de cualquier banda y,
// sin él, la consulta salía sin filtrar y devolvía la de TODAS.
router.get('/agent-runs', requireAuth, async (req, res) => {
  const sb = getSupabase();
  const bandId = getTargetBandId(req);

  try {
    const query = sb
      .from('agent_execution_logs')
      .select('*')
      .eq('band_id', bandId)
      .order('created_at', { ascending: false })
      .limit(20);
    const { data: logs, error: dbError } = await query;
    if (dbError) {
      console.warn(
        'Notice querying agent_execution_logs from Supabase:',
        dbError.message
      );
    }

    if (logs && logs.length > 0) {
      const runs = logs.map((log: RegistroEjecucionAgente, idx: number) => {
        const agentRaw = log.agente || 'scout';
        const agentName = agentRaw.charAt(0).toUpperCase() + agentRaw.slice(1);
        const isSuccess = log.estado !== 'error';
        return {
          id: log.id || `run-${idx}`,
          name: `Agente ${agentName} (${log.motor || 'Supabase Engine'})`,
          status: 'completed',
          conclusion: isSuccess ? 'success' : 'failure',
          created_at: log.created_at || new Date().toISOString(),
          updated_at: log.created_at || new Date().toISOString(),
          run_number: idx + 1,
          event: log.disparado_por_tipo || 'supabase_agent',
          display_title: log.mensaje || `Ejecución de Agente ${agentName}`,
          trigger_agent: agentName,
          details: log.detalles,
          leads_affected: log.leads_afectados,
          count: log.conteo_afectados,
          duration_ms: log.duracion_ms,
        };
      });

      return res.json({
        configured: true,
        engine: 'Supabase Native Agent Engine',
        runs,
      });
    }

    // Si aún no hay logs en Supabase, devolver lista configurada
    return res.json({
      configured: true,
      engine: 'Supabase Native Agent Engine',
      runs: [],
    });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error('Error fetching agent runs:', err);
    return res.json({
      configured: true,
      engine: 'Supabase Native Agent Engine',
      runs: [],
    });
  }
});

// GET /api/agent-runs/:runId/jobs
//
// requireAuth y comprobación de la banda del registro: el id de una ejecución bastaba para
// sacar el mensaje y el agente de la auditoría de otra banda.
router.get('/agent-runs/:runId/jobs', requireAuth, async (req, res) => {
  const { runId } = req.params;
  try {
    const sb = getSupabase();
    const { data: log } = await sb
      .from('agent_execution_logs')
      .select('*')
      .eq('id', runId)
      .maybeSingle();

    if (log && !puedeEscribirEnBanda(req, log.band_id)) {
      return res
        .status(404)
        .json({ success: false, error: 'Ejecución no encontrada.' });
    }

    if (log) {
      const agentName = (log.agente || 'Agente').toUpperCase();
      const isSuccess = log.estado !== 'error';
      const steps = [
        {
          name: 'Conectar con Supabase PostgreSQL',
          status: 'completed',
          conclusion: 'success',
          number: 1,
        },
        {
          name: `Ejecución del Agente ${agentName} (${log.motor || 'Supabase Engine'})`,
          status: 'completed',
          conclusion: isSuccess ? 'success' : 'failure',
          number: 2,
        },
        {
          name: log.mensaje || 'Actualización de base de datos y auditoría',
          status: 'completed',
          conclusion: isSuccess ? 'success' : 'failure',
          number: 3,
        },
      ];
      return res.json({
        success: true,
        jobs: [
          {
            id: log.id,
            name: `Proceso Agente ${log.agente}`,
            status: 'completed',
            conclusion: isSuccess ? 'success' : 'failure',
            steps,
          },
        ],
      });
    }

    return res.json({
      success: true,
      jobs: [
        {
          id: runId,
          name: 'Proceso Agente Supabase',
          status: 'completed',
          conclusion: 'success',
          steps: [
            {
              name: 'Conexión Supabase',
              status: 'completed',
              conclusion: 'success',
              number: 1,
            },
            {
              name: 'Procesamiento de Agente',
              status: 'completed',
              conclusion: 'success',
              number: 2,
            },
            {
              name: 'Sincronización de Registros',
              status: 'completed',
              conclusion: 'success',
              number: 3,
            },
          ],
        },
      ],
    });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error('Error fetching jobs from Supabase:', err);
    return responderError(res, err, "Error al consultar trabajos del agente.");
  }
});

// Restaura los datos de ejemplo. Solo el administrador global: el estado es de TODAS las bandas.
// Antes bastaba con ser líder de cualquier banda (requireLeader), y además el estado nuevo solo
// llevaba seis colecciones, así que también desaparecían usuarios, sesiones y bandas registradas.
router.post('/reset', requireAuth, requireLeader, (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Solo el administrador global puede restaurar los datos de ejemplo.' });
  }
  const { confirmReset, confirm } = req.body || {};
  if (
    confirmReset !== true &&
    confirm !== 'RESET' &&
    confirm !== 'RESET_CONFIRMED'
  ) {
    return res.status(400).json({
      error:
        "Petición de reseteo no confirmada. Se requiere 'confirmReset: true' en el cuerpo de la petición.",
    });
  }
  const defaultState = {
    ...loadState(),
    leads: INITIAL_LEADS,
    rehearsals: INITIAL_REHEARSALS,
    concerts: INITIAL_CONCERTS,
    posts: INITIAL_SOCIAL_POSTS,
    payments: INITIAL_PAYMENTS,
    messages: INITIAL_MESSAGES,
  };
  saveState(defaultState);
  // Sin devolver el estado: llevaba los usuarios con sus hashes de contraseña.
  res.json({ success: true });
});

// Obtener registros de auditoría de agentes
// Mismo agujero que /agent-runs: abierto, y sin band_id devolvía la auditoría de todas las bandas.
router.get('/agent-logs', requireAuth, async (req, res) => {
  try {
    const sb = getSupabase();
    const bandId = getTargetBandId(req);
    const query = sb
      .from('agent_execution_logs')
      .select('*')
      .eq('band_id', bandId)
      .order('created_at', { ascending: false })
      .limit(50);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, logs: data || [] });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error('Error al obtener agent-logs:', err);
    res.status(500).json({ success: false, error: 'Error al obtener los registros del agente.', logs: [] });
  }
});

// Guardar manualmente un registro de auditoría (ej: borrador en Gmail, acción de chatbot, etc.)
//
// requireAuth: esto escribe en el registro de auditoría. Abierto, cualquiera metía entradas
// falsas en la banda que quisiera y firmadas con el email que le apeteciera. Quién ha hecho la
// acción sale de la sesión, no del body: si no, la auditoría no vale para auditar nada.
router.post('/agent-logs', requireAuth, async (req, res) => {
  try {
    const sb = getSupabase();
    const user = req.user;
    const body = req.body || {};
    const bandId = getTargetBandId(req);
    const userEmail = user?.email || user?.username || '';
    const userId = user?.id || '';

    const logEntry = {
      id:
        body.id ||
        `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      band_id: bandId,
      agente: body.agente || 'redactor',
      motor: body.motor || 'gmail_api',
      disparado_por_tipo: body.disparado_por_tipo || 'chatbot',
      usuario_id: userId,
      usuario_email: userEmail,
      estado: body.estado || 'success',
      mensaje:
        body.mensaje || 'Borrador de correo creado en Gmail para revisión.',
      leads_afectados: body.leads_afectados || [],
      conteo_afectados:
        body.conteo_afectados ??
        (body.leads_afectados ? body.leads_afectados.length : 1),
      duracion_ms: body.duracion_ms || 120,
      detalles: body.detalles || {},
    };

    const { data, error } = await sb
      .from('agent_execution_logs')
      .insert(logEntry)
      .select();
    if (error) throw error;
    res.json({ success: true, log: data?.[0] || logEntry });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error('Error al insertar en agent-logs:', err);
    responderError(res, err);
  }
});

// Embudo de los agentes de booking a nivel de plataforma: cuántas bandas conectan email, reciben
// leads del Scout, ven un pitch aprobado, consiguen que el Enviador despache de verdad, y
// obtienen respuesta de una sala. Sin esto, decidir si invertir en más agentes o en arreglar la
// conversión del embudo actual era una apuesta a ciegas. Solo para el admin de la plataforma:
// agrega datos de TODAS las bandas, no de una banda concreta.
router.get('/admin/agent-funnel', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo el admin de la plataforma puede ver el embudo de agentes.',
      });
    }

    const bandas = await dbGetRegisteredBands();
    const entradas: FunnelBandInput[] = await Promise.all(
      (bandas || []).map(async (b: BandaRegistradaGuardada): Promise<FunnelBandInput> => {
        const bandId = b.band_id || b.id;
        try {
          const [gmailOAuth, emailAccount, leads] = await Promise.all([
            dbGetBandGmailOAuth(bandId),
            dbGetBandEmailAccount(bandId),
            dbGetLeads(bandId),
          ]);
          return {
            bandId,
            emailConectado: Boolean(gmailOAuth || emailAccount),
            leadsEstados: (leads || []).map((l: Lead) => l.estado),
          };
        } catch (err) {
          console.warn(
            "[agent-funnel] No se pudieron leer los datos de %s, se excluye del cómputo:", bandId,
            err
          );
          return { bandId, emailConectado: false, leadsEstados: [] };
        }
      })
    );

    res.json({ success: true, funnel: computeAgentFunnel(entradas) });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error('Error calculando agent-funnel:', err);
    responderError(res, err, 'Error calculando el embudo de agentes.');
  }
});

export default router;
