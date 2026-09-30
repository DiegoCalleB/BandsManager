import { Lead, Concert, EPKConfig, Rehearsal } from '../types';
import { hasModuleAccess } from './planPermissions';
import { findTourRoutingOpportunities } from './tourRouting';

export interface AlertAction {
  label: string;
  actionType:
    | 'open_campaign'
    | 'view_leads_stale'
    | 'view_drafts'
    | 'view_concerts'
    | 'open_epk'
    | 'view_finanzas'
    | 'view_ensayos'
    | 'view_reels'
    | 'scout_festivals'
    | 'open_autonomy';
  targetStatusFilter?: string;
  variant?: 'primary' | 'secondary';
}

export interface ManagerAlert {
  id: string;
  type:
    | 'seasonal_festival'
    | 'seasonal_tour'
    | 'seasonal_towns'
    | 'crm_followup'
    | 'pending_approval'
    | 'upcoming_concert'
    | 'epk_incomplete'
    | 'unpaid_cache'
    | 'rehearsal_missing'
    | 'reels_inactivity'
    | 'tour_cluster'
    | 'cold_negotiation'
    | 'advance_pending';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'urgent';
  category:
    | 'Calendario Industria'
    | 'Seguimiento CRM'
    | 'Directo & Fans'
    | 'Prensa & EPK'
    | 'Finanzas & Cobros'
    | 'Ensayos & Shows'
    | 'Logística & Gira';
  actionLabel: string;
  actionType: AlertAction['actionType'];
  actions?: AlertAction[];
  requiredModule: string; // Permiso de módulo obligatorio (ej: 'booking', 'finanzas', 'ensayos', 'epk', 'reels')
  targetStatusFilter?: string;
  monthRange?: string;
}

/**
 * Motor de Inteligencia del Mánager: Evalúa la fecha actual del sistema, los permisos del usuario/plan
 * y el estado de la banda para generar alertas estratégicas estacionales y operativas.
 */
export function generateManagerAlerts(
  leads: Lead[] = [],
  concerts: Concert[] = [],
  rehearsals: Rehearsal[] = [],
  epkConfig?: Partial<EPKConfig>,
  userPlan?: string
): ManagerAlert[] {
  const alerts: ManagerAlert[] = [];
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 = Jan, 9 = Oct, 11 = Dec

  // Helper para validar permisos por módulo antes de registrar una alerta
  const canShow = (moduleName: string) => hasModuleAccess(userPlan, moduleName);

  // --- 1. ALERTAS ESTACIONALES DE LA INDUSTRIA (Módulo: 'booking') ---
  if (canShow('booking')) {
    // A. Octubre a Febrero: Temporada Alta de Festivales de Verano
    if (currentMonth >= 9 || currentMonth <= 1) {
      // Oct - Feb
      alerts.push({
        id: 'seasonal_festivals_window',
        type: 'seasonal_festival',
        title: 'Ventana Abierta: Booking de Festivales de Verano',
        description:
          'Estamos en el periodo clave (octubre - febrero) donde los directores artísticos cierran el 80% de los carteles de festivales de verano. Es el momento de enviar la propuesta de festival.',
        severity: 'urgent',
        category: 'Calendario Industria',
        actionLabel: 'Contactar Festivales de Verano',
        actionType: 'open_campaign',
        actions: [
          {
            label: 'Contactar Festivales de Verano',
            actionType: 'open_campaign',
            variant: 'primary',
          },
          {
            label: 'Buscar y Añadir Festivales a Mis Contactos',
            actionType: 'scout_festivals',
            variant: 'secondary',
          },
        ],
        requiredModule: 'booking',
        monthRange: 'Octubre - Febrero',
      });
    }

    // B. Septiembre a Noviembre / Enero a Marzo: Cierre de Gira de Salas
    if ((currentMonth >= 8 && currentMonth <= 10) || (currentMonth >= 0 && currentMonth <= 2)) {
      alerts.push({
        id: 'seasonal_tour_window',
        type: 'seasonal_tour',
        title: 'Cierre de Agenda de Salas & Clubes',
        description:
          'Las salas de conciertos están cuadrando sus programaciones del próximo trimestre. Lanza las propuestas con la lista de retén de fechas resguardo.',
        severity: 'info',
        category: 'Calendario Industria',
        actionLabel: 'Ver Agenda de Booking',
        actionType: 'open_campaign',
        actions: [
          {
            label: 'Contactar Salas de Gira',
            actionType: 'open_campaign',
            variant: 'primary',
          },
          {
            label: 'Explorar Salas por Ciudad',
            actionType: 'scout_festivals',
            variant: 'secondary',
          },
        ],
        requiredModule: 'booking',
        monthRange: 'Temporada de Giras',
      });
    }

    // C. Mayo a Julio: Fiestas Mayores & Ayuntamientos
    if (currentMonth >= 4 && currentMonth <= 6) {
      // May - Jul
      alerts.push({
        id: 'seasonal_towns_window',
        type: 'seasonal_towns',
        title: 'Cierre de Presupuestos de Fiestas Mayores & Ayuntamientos',
        description:
          'Las concejalías de cultura y comisiones de fiestas rematan la contratación estival. Asegúrate de presentar la garantía de gestión legal y facturación.',
        severity: 'warning',
        category: 'Calendario Industria',
        actionLabel: 'Contactar Ayuntamientos',
        actionType: 'open_campaign',
        actions: [
          {
            label: 'Contactar Programadores de Fiestas',
            actionType: 'open_campaign',
            variant: 'primary',
          },
          {
            label: 'Añadir Contactos de Ayuntamientos',
            actionType: 'scout_festivals',
            variant: 'secondary',
          },
        ],
        requiredModule: 'booking',
        monthRange: 'Mayo - Julio',
      });
    }

    // --- 2. ALERTAS OPERATIVAS DE BOOKING (Módulo: 'booking') ---

    // D. Leads estancados en "esperando_respuesta" o "contactado" > 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const staleLeads = leads.filter((l) => {
      const status = (l.estado || '').toLowerCase();
      const isWaiting = status === 'contactado' || status === 'esperando_respuesta' || status === 'nuevo';
      if (!isWaiting) return false;
      const dateStr = l.fecha_ultima_respuesta || l.fecha_envio;
      if (!dateStr) return true;
      return new Date(dateStr) < sevenDaysAgo;
    });

    if (staleLeads.length > 0) {
      alerts.push({
        id: 'crm_stale_leads',
        type: 'crm_followup',
        title: `📬 ${staleLeads.length} Salas / Contactos sin respuesta desde hace +7 días`,
        description:
          'El 70% de las fechas se cierran en el 2º contacto. Re-contacta aportando un hito reciente (confirmación en ciudad vecina o avance de cartel).',
        severity: 'warning',
        category: 'Seguimiento CRM',
        actionLabel: 'Redactar Email de Seguimiento',
        actionType: 'view_leads_stale',
        actions: [
          {
            label: 'Redactar Email de Seguimiento',
            actionType: 'view_leads_stale',
            targetStatusFilter: 'esperando_respuesta',
            variant: 'primary',
          },
          {
            label: 'Ver Todos los Leads Estancados',
            actionType: 'open_campaign',
            variant: 'secondary',
          },
        ],
        requiredModule: 'booking',
        targetStatusFilter: 'esperando_respuesta',
      });
    }

    // E. Borradores creados por IA esperando revisión humana
    const pendingApprovalLeads = leads.filter((l) => {
      const st = (l.estado || '').toLowerCase();
      return st === 'pendiente_aprobacion' || st === 'borrador_creado';
    });

    if (pendingApprovalLeads.length > 0) {
      alerts.push({
        id: 'pending_agent_drafts',
        type: 'pending_approval',
        title: `✍️ ${pendingApprovalLeads.length} Propuestas en Borrador Esperando tu Aprobación`,
        description:
          'El Agente Redactor ha preparado propuestas personalizadas de primer contacto o réplica. Revisa y aprueba para su despacho.',
        severity: 'urgent',
        category: 'Seguimiento CRM',
        actionLabel: 'Revisar Borradores de la IA',
        actionType: 'view_drafts',
        actions: [
          {
            label: 'Revisar y Aprobar Borradores',
            actionType: 'view_drafts',
            variant: 'primary',
          },
          {
            label: 'Ajustar Autonomía de Agentes',
            actionType: 'open_autonomy',
            variant: 'secondary',
          },
        ],
        requiredModule: 'booking',
      });
    }

    // F. Oportunidades de Ruteo de Gira (Clustering Geográfico)
    const routingOpps = findTourRoutingOpportunities(concerts, leads);
    if (routingOpps.length > 0) {
      const topOpp = routingOpps[0];
      alerts.push({
        id: `tour_cluster_${topOpp.confirmedConcert.id}`,
        type: 'tour_cluster',
        title: `🚐 Oportunidad de Gira: Bolo en ${topOpp.concertCity} (${topOpp.concertDateStr})`,
        description: topOpp.suggestedAction,
        severity: 'urgent',
        category: 'Logística & Gira',
        actionLabel: 'Contactar Salas Cercanas',
        actionType: 'open_campaign',
        actions: [
          {
            label: 'Contactar Salas Cercanas',
            actionType: 'open_campaign',
            variant: 'primary',
          },
          {
            label: 'Ver Calendario de Gira',
            actionType: 'view_concerts',
            variant: 'secondary',
          },
        ],
        requiredModule: 'booking',
      });
    }

    // G. Negociaciones en Riesgo de Enfriamiento (Ghosting Warning > 5 días)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const coldNegotiations = leads.filter((l) => {
      if ((l.estado || '').toLowerCase() !== 'negociando') return false;
      const dateStr = l.fecha_ultima_respuesta || l.fecha_envio;
      if (!dateStr) return true;
      return new Date(dateStr) < fiveDaysAgo;
    });

    if (coldNegotiations.length > 0) {
      alerts.push({
        id: 'crm_cold_negotiations',
        type: 'cold_negotiation',
        title: `❄️ ${coldNegotiations.length} Negociación${coldNegotiations.length > 1 ? 'es' : ''} en Riesgo de Enfriamiento (+5 días)`,
        description:
          'Salas en negociación que no han recibido respuesta o seguimiento reciente. Envía un recordatorio ágil para cerrar fecha.',
        severity: 'warning',
        category: 'Seguimiento CRM',
        actionLabel: 'Desatascar Negociaciones',
        actionType: 'view_leads_stale',
        targetStatusFilter: 'negociando',
        actions: [
          {
            label: 'Ver Negociaciones Enfriadas',
            actionType: 'view_leads_stale',
            targetStatusFilter: 'negociando',
            variant: 'primary',
          },
          {
            label: 'Ver Pipeline Completo',
            actionType: 'open_campaign',
            variant: 'secondary',
          },
        ],
        requiredModule: 'booking',
      });
    }
  }

  // --- 3. ALERTAS DE CONCIERTOS & DIRECTOS (Módulo: 'calendario') ---
  if (canShow('calendario')) {
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    const upcomingShows = concerts.filter((c) => {
      if (!c.fecha) return false;
      const cDate = new Date(c.fecha);
      return cDate >= now && cDate <= thirtyDaysAhead;
    });

    if (upcomingShows.length > 0) {
      const nextShow = upcomingShows[0];
      alerts.push({
        id: 'upcoming_concert_promo',
        type: 'upcoming_concert',
        title: `🎸 Próximo Concierto: ${nextShow.sala || 'Directo'} (${nextShow.ciudad || 'Ciudad'})`,
        description:
          'Quedan menos de 30 días. Es el momento de lanzar la campaña digital local + aviso masivo a los fans de esa provincia.',
        severity: 'info',
        category: 'Directo & Fans',
        actionLabel: 'Gestionar Promoción de Concierto',
        actionType: 'view_concerts',
        actions: [
          {
            label: 'Gestionar Promoción de Concierto',
            actionType: 'view_concerts',
            variant: 'primary',
          },
          {
            label: 'Ver Calendario Completo',
            actionType: 'view_concerts',
            variant: 'secondary',
          },
        ],
        requiredModule: 'calendario',
      });
    }
  }

  // --- 4. ALERTAS DE FINANZAS & COBROS (Módulo: 'finanzas') ---
  if (canShow('finanzas')) {
    const unpaidConcerts = concerts.filter((c) => {
      if (!c.fecha) return false;
      const isPast = new Date(c.fecha) < now;
      return isPast && c.estado_pago === 'pendiente' && (c.cache || 0) > 0;
    });

    if (unpaidConcerts.length > 0) {
      const totalPending = unpaidConcerts.reduce((sum, c) => sum + (c.cache || 0), 0);
      alerts.push({
        id: 'finanzas_unpaid_cache',
        type: 'unpaid_cache',
        title: `💰 ${unpaidConcerts.length} Conciertos Pasados con Pago Pendiente (${totalPending}€)`,
        description: 'Tienes bolos realizados cuyo caché figura como pendiente de cobro. Revisa las facturas y estados de liquidación.',
        severity: 'urgent',
        category: 'Finanzas & Cobros',
        actionLabel: 'Revisar Cobros Pendientes',
        actionType: 'view_finanzas',
        actions: [
          {
            label: 'Revisar Cobros Pendientes',
            actionType: 'view_finanzas',
            variant: 'primary',
          },
          {
            label: 'Ver Histórico de Facturas',
            actionType: 'view_finanzas',
            variant: 'secondary',
          },
        ],
        requiredModule: 'finanzas',
      });
    }

    // Anticipo y contrato de bolos próximos (<21 días)
    const twentyOneDaysAhead = new Date();
    twentyOneDaysAhead.setDate(twentyOneDaysAhead.getDate() + 21);
    const upcomingPendingAdvance = concerts.filter((c) => {
      if (!c.fecha) return false;
      const cDate = new Date(c.fecha);
      const isNearFuture = cDate >= now && cDate <= twentyOneDaysAhead;
      const isConfirmed = c.tipo !== 'posible' && !c.is_posible;
      const hasCache = (c.cache || 0) > 0;
      const needsAttention = !c.contrato_firmado || c.estado_pago === 'pendiente';
      return isNearFuture && isConfirmed && hasCache && needsAttention;
    });

    if (upcomingPendingAdvance.length > 0) {
      const nextShow = upcomingPendingAdvance[0];
      alerts.push({
        id: 'finanzas_upcoming_advance',
        type: 'advance_pending',
        title: `📝 Contrato o Anticipo Pendiente: ${nextShow.sala || 'Bolo'} (${nextShow.ciudad || 'Ciudad'})`,
        description: `Quedan <21 días para el bolo (${nextShow.cache}€ de caché). Asegúrate de reclamar el anticipo del 50% y tener el contrato firmado antes de salir a la carretera.`,
        severity: 'warning',
        category: 'Finanzas & Cobros',
        actionLabel: 'Revisar Ficha del Concierto',
        actionType: 'view_concerts',
        actions: [
          {
            label: 'Revisar Bolo y Contrato',
            actionType: 'view_concerts',
            variant: 'primary',
          },
          {
            label: 'Ir a Finanzas',
            actionType: 'view_finanzas',
            variant: 'secondary',
          },
        ],
        requiredModule: 'finanzas',
      });
    }
  }

  // --- 5. ALERTAS DE ENSAYOS & PREPARACIÓN (Módulo: 'ensayos') ---
  if (canShow('ensayos')) {
    const fourteenDaysAhead = new Date();
    fourteenDaysAhead.setDate(fourteenDaysAhead.getDate() + 14);

    const showsSoon = concerts.filter((c) => {
      if (!c.fecha) return false;
      const cDate = new Date(c.fecha);
      return cDate >= now && cDate <= fourteenDaysAhead;
    });

    if (showsSoon.length > 0) {
      const hasUpcomingRehearsal = rehearsals.some((r) => {
        if (!r.fecha) return false;
        const rDate = new Date(r.fecha);
        return rDate >= now && rDate <= fourteenDaysAhead;
      });

      if (!hasUpcomingRehearsal) {
        alerts.push({
          id: 'ensayos_missing_before_show',
          type: 'rehearsal_missing',
          title: 'Próximo Bolo en <14 Días sin Ensayos Agendados',
          description: `Tenéis concierto en ${showsSoon[0].ciudad || 'breve'} y no consta ningún ensayo programado en la agenda esta semana.`,
          severity: 'warning',
          category: 'Ensayos & Shows',
          actionLabel: 'Programar Ensayo de Rodaje',
          actionType: 'view_ensayos',
          actions: [
            {
              label: 'Programar Ensayo de Rodaje',
              actionType: 'view_ensayos',
              variant: 'primary',
            },
            {
              label: 'Ver Calendario de Directos',
              actionType: 'view_concerts',
              variant: 'secondary',
            },
          ],
          requiredModule: 'ensayos',
        });
      }
    }
  }

  // --- 6. ALERTAS DE EPK / PRESS KIT (Módulo: 'epk') ---
  if (canShow('epk') && epkConfig) {
    const missing: string[] = [];
    if (!epkConfig.biografia) missing.push('Bio de la banda');
    if (!epkConfig.videos || epkConfig.videos.length === 0) missing.push('Vídeo de directo');
    if (!epkConfig.riderTecnico) missing.push('Rider Técnico');

    if (missing.length > 0) {
      alerts.push({
        id: 'epk_incomplete_alert',
        type: 'epk_incomplete',
        title: 'Dossier Oficial (EPK) Incompleto',
        description: `Para maximizar la conversión en salas y medios, completa: ${missing.join(', ')}.`,
        severity: 'info',
        category: 'Prensa & EPK',
        actionLabel: 'Completar EPK',
        actionType: 'open_epk',
        actions: [
          {
            label: 'Completar Dossier EPK',
            actionType: 'open_epk',
            variant: 'primary',
          },
        ],
        requiredModule: 'epk',
      });
    }
  }

  return alerts;
}
