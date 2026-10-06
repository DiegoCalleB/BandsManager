// Acuerdos de concierto (`concert_deals`): CRUD autenticado y vista pública por token
// (`/public/deals/:token`, firma y reenvío de email con limitador).

import { reenvioEmailRateLimiter } from '../middleware/rateLimiter.js';
import { Router, Request, Response } from 'express';
import { requireAuth, loadState, saveState } from '../state.js';
import { getTargetBandId } from '../utils/bandAccess.js';
import {
  dbGetDeals,
  dbGetDealByToken,
  dbGetDealByLeadId,
  dbUpsertDeal,
  dbSignDeal,
  DealData,
  DealError
} from '../db/deals.js';
import { sanitizeExternalText } from '../utils/promptSafety.js';
import {
  sendDealSignedToVenueEmail,
  sendDealSignedToBandEmail
} from '../services/transactionalEmail.js';
import { dbGetLeadById } from '../db/leads.js';
import { dbGetRegisteredBandById } from '../db/bands.js';
import { dbGetUsers } from '../db/users.js';
import { invalidateBandStateCache } from '../db/sync.js';

export const dealsRouter = Router();

/** Código HTTP de un error de acuerdos: los DealError llevan el suyo (404/409/410/503...). */
function estadoHttp(error: any, porDefecto: number): number {
  return error instanceof DealError ? error.status : porDefecto;
}

/**
 * IP del firmante para la traza de auditoría. La cabecera X-Forwarded-For la puede escribir el
 * propio cliente (su valor va a la IZQUIERDA); el proxy de Railway añade la IP real con la que
 * conectó a la DERECHA. Antes se cogía la primera entrada, o sea, la falsificable: cualquiera
 * podía firmar "desde" otra IP. Se usa la última entrada, que añade la infraestructura.
 */
export function ipFirmante(req: Request): string {
  const cadena = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const ip = cadena.length > 0 ? cadena[cadena.length - 1] : req.socket?.remoteAddress || req.ip || '127.0.0.1';
  return ip.slice(0, 45);
}

// ============================================================================
// 1. RUTAS PRIVADAS (Panel de la Banda con Auth y Multi-tenant Scoping)
// ============================================================================

/**
 * GET /api/deals
 * Obtiene todos los acuerdos de bolo de la banda autenticada.
 */
dealsRouter.get('/deals', requireAuth, async (req: Request, res: Response) => {
  try {
    const bandId = getTargetBandId(req);
    if (!bandId) {
      return res.status(403).json({ error: 'No se pudo resolver el ID de la banda' });
    }

    const deals = await dbGetDeals(bandId);

    // Auto-sanación: Garantizar que todos los acuerdos confirmados estén presentes en state.concerts
    try {
      const state = loadState();
      if (state && Array.isArray(state.concerts)) {
        let changed = false;
        deals.forEach((d) => {
          if (d.estado === 'confirmado') {
            const exists = state.concerts.some((c: any) =>
              (d.concert_id && c.id === d.concert_id) ||
              (c.fecha === d.fecha_evento && c.sala === d.lugar_sala)
            );
            if (!exists) {
              state.concerts.push({
                id: d.concert_id || `cnc_deal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                band_id: d.band_id,
                band_name: d.nombre_evento.replace(/^Concierto de /, '').replace(/^Concierto en /, '') || 'Banda',
                fecha: d.fecha_evento,
                ciudad: d.ciudad || '',
                sala: d.lugar_sala,
                cache: Number(d.total_acordado ?? d.cache_base ?? 0),
                contrato_firmado: true,
                estado_pago: d.forma_pago === 'efectivo' ? 'pendiente' : 'pendiente',
                notas: `Acuerdo 1-Click firmado por ${d.nombre_firmante || 'la sala'}.`,
                tipo: 'sala'
              } as any);
              changed = true;
            }
          }
        });
        if (changed) {
          saveState(state);
          invalidateBandStateCache(bandId);
        }
      }
    } catch (_) {}

    return res.status(200).json({ success: true, deals });
  } catch (error: any) {
    console.error('[dealsRouter] Error al obtener acuerdos:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener acuerdos' });
  }
});

/**
 * GET /api/deals/lead/:leadId
 * Obtiene el acuerdo activo asociado a un lead de booking.
 */
dealsRouter.get('/deals/lead/:leadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const bandId = getTargetBandId(req);
    if (!bandId) {
      return res.status(403).json({ error: 'No se pudo resolver el ID de la banda' });
    }

    const { leadId } = req.params;
    const deal = await dbGetDealByLeadId(leadId, bandId);

    return res.status(200).json({ success: true, deal });
  } catch (error: any) {
    console.error('[dealsRouter] Error al obtener acuerdo por lead:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener acuerdo' });
  }
});

/**
 * POST /api/deals
 * Crea o actualiza una Hoja de Acuerdo de Bolo 1-Click para una sala.
 */
dealsRouter.post('/deals', requireAuth, async (req: Request, res: Response) => {
  try {
    const bandId = getTargetBandId(req);
    if (!bandId) {
      return res.status(403).json({ error: 'No se pudo resolver el ID de la banda' });
    }

    const {
      id,
      lead_id,
      nombre_evento,
      lugar_sala,
      ciudad,
      fecha_evento,
      hora_llegada,
      hora_concierto,
      tipo_remuneracion,
      cache_base,
      total_acordado,
      forma_pago,
      rider_incluido,
      rider_texto,
      hospitalidad_notas,
      apoyo_porcentaje
    } = req.body;

    if (!lugar_sala || !fecha_evento) {
      return res.status(400).json({ error: 'La sala y la fecha del concierto son obligatorias' });
    }

    const dealPayload: Partial<DealData> & { band_id: string; lugar_sala: string; fecha_evento: string } = {
      id: id || undefined,
      band_id: bandId,
      lead_id: lead_id || null,
      nombre_evento: nombre_evento ? sanitizeExternalText(nombre_evento) : `Concierto en ${lugar_sala}`,
      lugar_sala: sanitizeExternalText(lugar_sala),
      ciudad: ciudad ? sanitizeExternalText(ciudad) : '',
      fecha_evento: String(fecha_evento).slice(0, 10),
      hora_llegada: hora_llegada || '18:30',
      hora_concierto: hora_concierto || '21:30',
      tipo_remuneracion: tipo_remuneracion || 'cache_fijo',
      cache_base: Number(cache_base ?? 0),
      total_acordado: Number(total_acordado ?? cache_base ?? 0),
      forma_pago: forma_pago || 'efectivo',
      // Se normaliza en dbUpsertDeal (0-20 %, pasos de 0,5; lo no numérico = no eligió).
      ...(apoyo_porcentaje !== undefined ? { apoyo_porcentaje } : {}),
      rider_incluido: rider_incluido ?? true,
      rider_texto: rider_texto ? sanitizeExternalText(rider_texto) : '',
      hospitalidad_notas: hospitalidad_notas ? sanitizeExternalText(hospitalidad_notas) : ''
    };

    const savedDeal = await dbUpsertDeal(dealPayload, bandId);

    const publicUrl = `https://bandmanager.io/deal/${savedDeal.token}`;

    return res.status(200).json({
      success: true,
      deal: savedDeal,
      publicUrl
    });
  } catch (error: any) {
    console.error('[dealsRouter] Error al crear/actualizar acuerdo:', error);
    return res.status(estadoHttp(error, 500)).json({ error: error.message || 'Error al persistir acuerdo' });
  }
});

// ============================================================================
// 2. RUTAS PÚBLICAS (Para la Sala / Promotor - Sin Registro, Fricción Cero)
// ============================================================================

/**
 * GET /api/public/deals/:token
 * Devuelve la vista pública minimizada del acuerdo (principio de minimización RGPD).
 * No expone datos personales de los músicos ni información sensible.
 */
dealsRouter.get('/public/deals/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: 'Token de acuerdo no proporcionado' });
    }

    const deal = await dbGetDealByToken(token);
    if (!deal) {
      return res.status(404).json({ error: 'Acuerdo no encontrado o enlace caducado' });
    }

    // Proyección pública minimizada
    const publicDeal = {
      token: deal.token,
      nombre_evento: deal.nombre_evento,
      lugar_sala: deal.lugar_sala,
      ciudad: deal.ciudad || '',
      fecha_evento: deal.fecha_evento,
      hora_llegada: deal.hora_llegada || '18:30',
      hora_concierto: deal.hora_concierto || '21:30',
      tipo_remuneracion: deal.tipo_remuneracion || 'cache_fijo',
      cache_base: Number(deal.cache_base ?? 0),
      total_acordado: Number(deal.total_acordado ?? deal.cache_base ?? 0),
      forma_pago: deal.forma_pago || 'efectivo',
      rider_incluido: Boolean(deal.rider_incluido),
      rider_texto: deal.rider_texto || '',
      rider_validado_por_sala: Boolean(deal.rider_validado_por_sala),
      hospitalidad_notas: deal.hospitalidad_notas || '',
      estado: deal.estado || 'pendiente',
      nombre_firmante: deal.nombre_firmante || null,
      cargo_firmante: deal.cargo_firmante || null,
      firma_timestamp: deal.firma_timestamp || null,
      contrato_sha256: deal.contrato_sha256 || null
    };

    // Auto-sanación: Si el acuerdo ya está firmado, asegurar que existe en el calendario y state.concerts
    if (deal.estado === 'confirmado') {
      try {
        const state = loadState();
        if (state && Array.isArray(state.concerts)) {
          const match = state.concerts.find((c: any) =>
            (deal.concert_id && c.id === deal.concert_id) ||
            (c.fecha === deal.fecha_evento && c.sala === deal.lugar_sala)
          );
          if (!match) {
            const concertItem = {
              id: deal.concert_id || `cnc_deal_${Date.now()}`,
              band_id: deal.band_id,
              band_name: deal.nombre_evento.replace(/^Concierto de /, '').replace(/^Concierto en /, '') || 'Banda',
              fecha: deal.fecha_evento,
              ciudad: deal.ciudad || '',
              sala: deal.lugar_sala,
              cache: Number(deal.total_acordado ?? deal.cache_base ?? 0),
              contrato_firmado: true,
              estado_pago: deal.forma_pago === 'efectivo' ? 'pendiente' : 'pendiente',
              notas: `Acuerdo 1-Click firmado por ${deal.nombre_firmante || 'la sala'}.`,
              tipo: 'sala'
            };
            state.concerts.push(concertItem as any);
            saveState(state);
            invalidateBandStateCache(deal.band_id);
          }
        }
      } catch (_) {}
    }

    return res.status(200).json({ success: true, deal: publicDeal });
  } catch (error: any) {
    console.error('[dealsRouter] Error al obtener vista pública de acuerdo:', error);
    return res.status(estadoHttp(error, 500)).json({ error: 'Error al consultar el acuerdo' });
  }
});

/**
 * POST /api/public/deals/:token/sign
 * Valida y registra la firma digital del programador de la sala (eIDAS Simple Signature).
 * Genera el hash criptográfico SHA-256 e inicia el efecto dominó en el CRM y la Gira.
 */
dealsRouter.post('/public/deals/:token/sign', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const {
      nombre_firmante,
      cargo_firmante,
      email_firmante,
      firma_imagen,
      rider_validado_por_sala
    } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de acuerdo no proporcionado' });
    }

    if (!nombre_firmante || typeof nombre_firmante !== 'string' || !nombre_firmante.trim()) {
      return res.status(400).json({ error: 'Por favor, introduce tu nombre o el de la sala' });
    }

    if (!firma_imagen || typeof firma_imagen !== 'string') {
      return res.status(400).json({ error: 'Por favor, realiza la firma en el recuadro táctil' });
    }

    // La firma es una imagen PNG/JPEG en base64 de un recuadro táctil: se acepta solo eso y con
    // tope de tamaño (antes cualquier texto de hasta 50 MB acababa en la base de datos).
    if (firma_imagen.length > 400_000 || !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(firma_imagen)) {
      return res.status(400).json({ error: 'La firma no es válida. Vuelve a firmar en el recuadro.' });
    }

    if (!rider_validado_por_sala) {
      return res.status(400).json({ error: 'Debes confirmar la revisión de las condiciones técnicas' });
    }

    // Trazabilidad de Auditoría (Audit Trail)
    const ip = ipFirmante(req);

    const userAgent = (req.headers['user-agent'] || 'Desconocido').slice(0, 255);

    const { deal, concertId } = await dbSignDeal(token, {
      nombre_firmante: sanitizeExternalText(nombre_firmante),
      cargo_firmante: cargo_firmante ? sanitizeExternalText(cargo_firmante) : 'Programador / Representante Sala',
      firma_imagen,
      firma_ip: ip,
      firma_user_agent: userAgent,
      rider_validado_por_sala: true
    });

    // Envío Asíncrono de Notificaciones por Email (Sala y Banda)
    (async () => {
      try {
        let venueEmail = email_firmante ? sanitizeExternalText(email_firmante).trim().toLowerCase() : '';

        if (deal.lead_id) {
          try {
            const leadData = await dbGetLeadById(deal.lead_id, deal.band_id);
            if (!venueEmail && leadData?.email) {
              venueEmail = String(leadData.email).trim().toLowerCase();
            }
          } catch (_) {}
        }

        // Obtener datos y email de la banda
        let bandEmail = '';
        let bandDisplayName = deal.nombre_evento.replace(/^Concierto de /, '').replace(/^Concierto en /, '') || 'Banda';
        try {
          const regBand = await dbGetRegisteredBandById(deal.band_id);
          if (regBand) {
            bandEmail = regBand.email || '';
            if (regBand.nombre_banda) bandDisplayName = regBand.nombre_banda;
          }
          if (!bandEmail) {
            const users = await dbGetUsers(deal.band_id);
            const leader = users.find((u: any) => u.role === 'leader' || u.rol === 'leader') || users[0];
            if (leader?.email) bandEmail = leader.email;
          }
        } catch (_) {}

        const feeImporte = deal.comision_importe ?? 0;
        const netoBanda = deal.neto_banda ?? Math.max(0, (deal.total_acordado || deal.cache_base || 0) - feeImporte);

        // 1. Notificación a la Sala con copia oficial del contrato
        if (venueEmail && venueEmail.includes('@')) {
          await sendDealSignedToVenueEmail({
            toEmail: venueEmail,
            signerName: deal.nombre_firmante || 'Responsable de Programación',
            signerRole: deal.cargo_firmante || 'Programador de Sala',
            venueName: deal.lugar_sala,
            bandName: bandDisplayName,
            eventDate: deal.fecha_evento,
            arrivalTime: deal.hora_llegada,
            showTime: deal.hora_concierto,
            totalAgreed: deal.total_acordado || deal.cache_base || 0,
            paymentMethod: deal.forma_pago || 'efectivo',
            token: deal.token || token,
            sha256: deal.contrato_sha256
          });
        }

        // 2. Alerta a la Banda con la confirmación del bolo cerrado
        if (bandEmail && bandEmail.includes('@')) {
          await sendDealSignedToBandEmail({
            toEmail: bandEmail,
            bandName: bandDisplayName,
            venueName: deal.lugar_sala,
            city: deal.ciudad,
            eventDate: deal.fecha_evento,
            signerName: deal.nombre_firmante || 'Programador de Sala',
            signerRole: deal.cargo_firmante,
            totalAgreed: deal.total_acordado || deal.cache_base || 0,
            feeAmount: feeImporte,
            netAmount: netoBanda,
            token: deal.token || token,
            sha256: deal.contrato_sha256
          });
        }
      } catch (emailErr) {
        console.warn('[dealsRouter] Aviso al enviar emails de acuerdo firmado:', emailErr);
      }
    })();

    return res.status(200).json({
      success: true,
      mensaje: '¡Concierto y acuerdo confirmados con éxito!',
      deal: {
        token: deal.token,
        estado: deal.estado,
        nombre_firmante: deal.nombre_firmante,
        cargo_firmante: deal.cargo_firmante,
        firma_timestamp: deal.firma_timestamp,
        contrato_sha256: deal.contrato_sha256
      },
      concertId
    });
  } catch (error: any) {
    console.error('[dealsRouter] Error al firmar acuerdo:', error);
    // Los DealError llevan mensajes pensados para el usuario; cualquier otro error (BD, red) no
    // se muestra tal cual a un visitante anónimo.
    const mensaje = error instanceof DealError && error.status < 500 ? error.message : 'No se pudo procesar la firma del acuerdo. Inténtalo de nuevo.';
    return res.status(estadoHttp(error, 400)).json({ error: mensaje });
  }
});

/**
 * POST /api/public/deals/:token/resend-email
 * Reenvía la copia oficial del acuerdo firmado a la dirección solicitada.
 */
dealsRouter.post('/public/deals/:token/resend-email', reenvioEmailRateLimiter, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { email } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de acuerdo no proporcionado' });
    }
    const cleanEmail = sanitizeExternalText(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Por favor, introduce un correo electrónico válido' });
    }

    const deal = await dbGetDealByToken(token);
    if (!deal) {
      return res.status(404).json({ error: 'Acuerdo no encontrado' });
    }

    let bandDisplayName = deal.nombre_evento.replace(/^Concierto de /, '').replace(/^Concierto en /, '') || 'Banda';
    try {
      const regBand = await dbGetRegisteredBandById(deal.band_id);
      if (regBand?.nombre_banda) bandDisplayName = regBand.nombre_banda;
    } catch (_) {}

    const result = await sendDealSignedToVenueEmail({
      toEmail: cleanEmail,
      signerName: deal.nombre_firmante || 'Responsable',
      signerRole: deal.cargo_firmante || 'Programador de Sala',
      venueName: deal.lugar_sala,
      bandName: bandDisplayName,
      eventDate: deal.fecha_evento,
      arrivalTime: deal.hora_llegada,
      showTime: deal.hora_concierto,
      totalAgreed: deal.total_acordado || deal.cache_base || 0,
      paymentMethod: deal.forma_pago || 'efectivo',
      token: deal.token || token,
      sha256: deal.contrato_sha256
    });

    if (!result.success && result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      mensaje: `Copia del acuerdo enviada con éxito a ${cleanEmail}`
    });
  } catch (error: any) {
    console.error('[dealsRouter] Error al reenviar email de acuerdo:', error);
    return res.status(500).json({ error: error.message || 'Error al enviar el correo' });
  }
});
