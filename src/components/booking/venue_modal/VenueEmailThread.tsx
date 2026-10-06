import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Mail,
  Clock,
  Send,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  MousePointerClick,
  ArrowUpDown,
  Copy,
  Check,
  Building2,
  User,
  Flame,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Zap,
  Download,
} from 'lucide-react';
import { Lead, EmailMessage } from '../../../types';
import { isLeadNeedsFollowup, getDaysSinceContact, generateFollowupTemplate } from '../../../utils/bookingFollowup';
import { Button, IconButton } from '../../ui';
import { ShowIcon } from '../../ui/ShowIcon';
import { EmailDeliveryTicks } from '../EmailDeliveryTicks';
import { apiFetch } from '../../../utils/api';

interface VenueEmailThreadProps {
  lead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onSelectPitchTab: () => void;
  bandName?: string;
}

export const VenueEmailThread: React.FC<VenueEmailThreadProps> = ({
  lead,
  onUpdateLead,
  onSelectPitchTab,
  bandName,
}) => {
  const needsFollowup = isLeadNeedsFollowup(lead);
  const daysSince = getDaysSinceContact(lead);

  const [dbMessages, setDbMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc' = newest first (default)
  const [expandedMessageIds, setExpandedMessageIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch real conversation messages from backend
  const fetchMessages = useCallback(async () => {
    if (!lead?.id) return;
    try {
      setLoadingMessages(true);
      const res = await apiFetch(`/api/leads/${lead.id}/messages`);
      if (res?.success && Array.isArray(res.messages)) {
        setDbMessages(res.messages);
      }
    } catch (err) {
      console.warn('Error fetching lead messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [lead?.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Combine lead.mensajes with dbMessages
  const rawMessages: any[] = useMemo(() => {
    return dbMessages.length > 0
      ? dbMessages
      : (lead as any).mensajes || (lead as any).email_thread || [];
  }, [dbMessages, lead]);

  // Sort messages (Newest first by default)
  const sortedMessages = useMemo(() => {
    return [...rawMessages].sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [rawMessages, sortOrder]);

  // Expand newest message by default
  useEffect(() => {
    if (sortedMessages.length > 0) {
      const newestId = sortedMessages[0].id || 'msg-0';
      setExpandedMessageIds((prev) => ({
        ...prev,
        [newestId]: true,
      }));
    }
  }, [sortedMessages.length]);

  const toggleExpand = (id: string) => {
    setExpandedMessageIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Instant Agent Lector Sync
  const handleSyncLector = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await apiFetch('/api/trigger-agent', {
        method: 'POST',
        body: JSON.stringify({
          agentName: 'lector',
          params: { trigger_type: 'usuario_manual' },
        }),
      });

      await fetchMessages();

      const updatedLeadRes = await apiFetch(`/api/leads/${lead.id}`).catch(() => null);
      if (updatedLeadRes?.lead) {
        onUpdateLead(lead.id, updatedLeadRes.lead);
      }

      setSyncFeedback(res?.message || 'Bandeja sincronizada con éxito.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Error al sincronizar con la bandeja de entrada');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyFollowupNudge = () => {
    const draft = generateFollowupTemplate(lead, bandName || 'la banda');
    onUpdateLead(lead.id, {
      pitch_generado: draft,
      estado: 'pendiente_aprobacion',
    });
    onSelectPitchTab();
  };

  // Tracking details
  const isSent = Boolean(
    lead.fecha_envio &&
    !['nuevo', 'pendiente_aprobacion', 'aprobado_propuesta'].includes(lead.estado)
  );

  const venueReply = useMemo(() => {
    return sortedMessages.find((m) => m.remitente === 'sala' || m.remitente === 'promotor');
  }, [sortedMessages]);

  const hasReceivedReply = Boolean(
    isSent && (
      lead.fecha_ultima_respuesta ||
      ['respondido', 'negociando', 'confirmado'].includes(lead.estado) ||
      Boolean(venueReply)
    )
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return dateStr;
    }
  };

  const formatTelemetryItem = (item: any) => {
    const notas = String(item.notas || '');
    const res = String(item.resultado || '');
    const id = String(item.id || '');

    // 1. Detección de canciones / audio
    if (res.includes('Audio') || res.includes('Reproducción') || notas.includes('Reprodujo') || notas.includes('canción')) {
      const match = notas.match(/Reprodujo "([^"]+)"/i) || notas.match(/"([^"]+)"/);
      const songName = match ? match[1] : 'Canción';
      return {
        icon: '🎵',
        badgeBg: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
        title: `Escuchó la canción: "${songName}"`,
        detail: notas.includes('(') ? notas : `Reproducción completa en el reproductor de audio del Dossier`,
        category: 'Audio'
      };
    }

    // 2. Detección de descarga de Rider o Dossier PDF
    if (res.includes('Rider') || notas.includes('Rider') || res.includes('Descarga') || notas.includes('Descargó') || notas.includes('PDF') || res.includes('Dossier PDF')) {
      const isRider = res.includes('Rider') || notas.includes('Rider');
      return {
        icon: isRider ? '📋' : '📥',
        badgeBg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
        title: isRider ? 'Consultó o Descargó el Rider Técnico' : 'Descargó el Dossier PDF Oficial',
        detail: notas.replace(/https?:\/\/\S+/g, '').trim() || 'Acceso directo a la ficha técnica o kit de prensa PDF',
        category: 'Documentos'
      };
    }

    // 3. Detección de contacto (Email, Teléfono, WhatsApp, Caché)
    if (res.includes('Contacto') || res.includes('Caché') || notas.includes('contactar') || notas.includes('teléfono') || notas.includes('email') || notas.includes('WhatsApp')) {
      return {
        icon: res.includes('Caché') ? '💰' : '✉️',
        badgeBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
        title: res.includes('Caché') ? 'Consultó Caché / Contratación' : 'Pulsó en Contactar con la Banda',
        detail: notas || 'Hizo clic en el correo o teléfono de contacto de booking',
        category: 'Contacto'
      };
    }

    // 4. Detección de Redes Sociales
    if (res.includes('Spotify') || notas.includes('Spotify')) {
      return {
        icon: '🎧',
        badgeBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
        title: 'Abrió Spotify de la banda',
        detail: notas || 'Pulsó en el icono de Spotify de la banda',
        category: 'Streaming'
      };
    }
    if (res.includes('Instagram') || notas.includes('Instagram')) {
      return {
        icon: '📸',
        badgeBg: 'bg-pink-950/60 border-pink-500/40 text-pink-300',
        title: 'Abrió Instagram de la banda',
        detail: notas || 'Pulsó en el perfil de Instagram de la banda',
        category: 'Redes'
      };
    }
    if (res.includes('YouTube') || notas.includes('YouTube')) {
      return {
        icon: '▶️',
        badgeBg: 'bg-red-950/60 border-red-500/40 text-red-300',
        title: 'Abrió canal de YouTube',
        detail: notas || 'Pulsó en el canal de YouTube de la banda',
        category: 'Vídeo'
      };
    }
    if (res.includes('TikTok') || notas.includes('TikTok')) {
      return {
        icon: '🎵',
        badgeBg: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300',
        title: 'Abrió TikTok de la banda',
        detail: notas || 'Pulsó en el canal de TikTok de la banda',
        category: 'Redes'
      };
    }
    if (res.includes('Facebook') || notas.includes('Facebook')) {
      return {
        icon: '📘',
        badgeBg: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
        title: 'Abrió Facebook de la banda',
        detail: notas || 'Pulsó en la página de Facebook de la banda',
        category: 'Redes'
      };
    }
    if (res.includes('Web Oficial') || notas.includes('Web Oficial') || notas.includes('website')) {
      return {
        icon: '🌐',
        badgeBg: 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300',
        title: 'Visitó la Web Oficial',
        detail: notas || 'Pulsó en el enlace hacia la web oficial de la banda',
        category: 'Web'
      };
    }

    // 5. Detección de apertura de Dossier Web / EPK
    if (res.includes('Dossier') || notas.includes('Dossier') || notas.includes('EPK') || id.startsWith('epk-view-') || notas.includes('visualizó el Dossier')) {
      return {
        icon: '📄',
        badgeBg: 'bg-sky-950/60 border-sky-500/40 text-sky-300',
        title: 'Abrió y visualizó el Dossier Web (EPK)',
        detail: 'Navegó por el dossier interactivo oficial de la banda',
        category: 'Dossier'
      };
    }

    // 6. Detección de apertura de correo
    if (id.startsWith('open-') || notas.includes('abrió el correo') || notas.includes('Email Abierto') || notas.includes('Apertura') || res.includes('Info recibida')) {
      const matchNumber = res.match(/#(\d+)/) || notas.match(/#(\d+)/) || notas.match(/\((\d+)ª vez\)/);
      const openNum = matchNumber ? `#${matchNumber[1]}` : '';
      return {
        icon: '👁️',
        badgeBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
        title: `Apertura de correo electrónico ${openNum}`.trim(),
        detail: notas.includes('apertura #') || notas.includes('vez') || notas.includes('Gmail') || notas.includes('Apple') ? notas : 'El programador abrió el mensaje en su bandeja de entrada',
        category: 'Email'
      };
    }

    // 7. Clic genérico en enlace del correo
    if (id.startsWith('click-') || notas.includes('pulsó en enlace') || res.includes('Interesado')) {
      return {
        icon: '🔗',
        badgeBg: 'bg-sky-950/60 border-sky-500/40 text-sky-300',
        title: 'Clic en enlace del Dossier Oficial',
        detail: 'Pulsó en el botón o enlace interactivo del correo',
        category: 'Enlace'
      };
    }

    return {
      icon: '🎯',
      badgeBg: 'bg-slate-800 border-slate-700 text-slate-300',
      title: 'Interacción registrada',
      detail: notas.replace(/https?:\/\/\S+/g, '').trim() || 'Actividad registrada por la telemetría',
      category: 'Actividad'
    };
  };

  /**
   * Calcula la telemetría específica vinculada a cada mensaje individual del hilo
   */
  const getMessageTelemetry = (msg: any, msgIndex: number) => {
    if (msg.remitente !== 'banda') return null;
    const historial = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];
    const msgTime = msg.fecha ? new Date(msg.fecha).getTime() : 0;

    const nextBandMsg = sortedMessages
      .filter((m, i) => i > msgIndex && m.remitente === 'banda' && m.fecha)
      .sort((a, b) => new Date(a.fecha!).getTime() - new Date(b.fecha!).getTime())[0];
    const nextMsgTime = nextBandMsg?.fecha ? new Date(nextBandMsg.fecha).getTime() : Infinity;

    const cleanMsgId = (msg.id || '').replace(/^imap-/, '').replace(/^gmail-/, '');

    const matchingEvents = historial.filter((h: any) => {
      if (h.email_id) {
        const cleanEventEmailId = String(h.email_id).replace(/^imap-/, '').replace(/^gmail-/, '');
        if (cleanEventEmailId === cleanMsgId || h.email_id === msg.id || h.email_id === msg.gmail_message_id) {
          return true;
        }
      }

      if (!h.email_id && msgTime > 0 && h.fecha) {
        const evTime = new Date(h.fecha).getTime();
        return evTime >= (msgTime - 60000) && evTime < nextMsgTime;
      }

      return false;
    });

    const openEvents = matchingEvents.filter(
      (h: any) => h.id?.startsWith('open-') || h.notas?.includes('abrió el correo') || h.resultado?.includes('Apertura')
    );
    const clickEvents = matchingEvents.filter(
      (h: any) => h.id?.startsWith('click-') || h.id?.startsWith('epk-') || (h.tipo as string) === 'Interacción EPK'
    );
    const pdfEvents = matchingEvents.filter(
      (h: any) => h.id?.startsWith('pdf-open-') || (h.tipo as string) === 'Dossier PDF' || h.resultado?.includes('Dossier PDF')
    );

    let maxParsedOpen = openEvents.length;
    openEvents.forEach((ev: any) => {
      const match = String(ev.resultado || ev.notas || '').match(/#(\d+)|(\d+)ª vez/);
      if (match) {
        const num = parseInt(match[1] || match[2], 10);
        if (!isNaN(num) && num > maxParsedOpen) maxParsedOpen = num;
      }
    });

    const isOpened = openEvents.length > 0 || clickEvents.length > 0 || pdfEvents.length > 0;
    const openCount = Math.max(maxParsedOpen, openEvents.length, isOpened ? 1 : 0);

    return {
      opened: isOpened,
      openCount,
      epkClicks: clickEvents.length,
      pdfOpens: pdfEvents.length,
      events: matchingEvents,
      lastActivity: matchingEvents[0]?.fecha
    };
  };

  // Mensaje más reciente enviado por la banda
  const latestBandMsg = useMemo(() => {
    return sortedMessages
      .filter((m) => m.remitente === 'banda')
      .sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())[0];
  }, [sortedMessages]);

  const latestMsgTelemetry = useMemo(() => {
    if (!latestBandMsg) return null;
    const idx = sortedMessages.indexOf(latestBandMsg);
    return getMessageTelemetry(latestBandMsg, idx);
  }, [latestBandMsg, sortedMessages, getMessageTelemetry]);

  const wasEmailOpened = Boolean(
    isSent && (latestMsgTelemetry ? latestMsgTelemetry.opened : false)
  );

  const openCount = isSent && latestMsgTelemetry
    ? latestMsgTelemetry.openCount
    : (isSent && wasEmailOpened ? 1 : 0);

  const epkClicks = isSent && latestMsgTelemetry
    ? latestMsgTelemetry.epkClicks
    : 0;

  const hasClickedEpk = epkClicks > 0;

  const pdfOpens = isSent && latestMsgTelemetry
    ? latestMsgTelemetry.pdfOpens
    : 0;

  const lastOpenDate = isSent && latestMsgTelemetry?.lastActivity
    ? latestMsgTelemetry.lastActivity
    : undefined;

  const interaccionesBotones = useMemo(() => {
    if (!isSent || !latestMsgTelemetry) return [];
    return latestMsgTelemetry.events;
  }, [isSent, latestMsgTelemetry]);

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar p-3 sm:p-5 space-y-4">
      {/* 1. TELEMETRÍA & RADAR DE TRACKING EN VIVO (OPEN & CLICK TRACKER) */}
      <div className="rounded-[var(--r-l)] bg-[var(--surface)] border border-[var(--hair)] p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--hair)] pb-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--acc)]" />
            <span className="text-xs font-bold font-sans text-[var(--ink)]">
              Telemetría de Lectura & Aperturas
            </span>
          </div>
          <span className="text-micro font-mono text-[var(--ink-2)]">
            {lead.email_contacto || 'Sin email registrado'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Tarjeta 1: Apertura de Email */}
          <div
            className={`p-3 rounded-[var(--r-m)] border transition-all flex items-start gap-3 ${
              wasEmailOpened
                ? 'bg-emerald-950/40 border-emerald-500/40 shadow-xs'
                : 'bg-[var(--sunken)]/70 border-[var(--hair)]'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-[var(--r-pill)] flex items-center justify-center shrink-0 ${
                wasEmailOpened
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-[var(--sunken)] text-[var(--ink-2)]'
              }`}
            >
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${
                  wasEmailOpened ? 'text-emerald-400' : 'text-[var(--ink-2)]'
                }`}
              >
                Apertura de Email
              </span>
              <span
                className={`text-xs sm:text-sm font-bold block leading-tight ${
                  wasEmailOpened ? 'text-white' : 'text-[var(--ink)]'
                }`}
              >
                {wasEmailOpened ? (
                  hasReceivedReply ? (
                    <>Leído / Confirmado {openCount > 1 ? `(${openCount}x)` : ''}</>
                  ) : (
                    <>Abierto {openCount > 1 ? `(${openCount} veces)` : '(1 vez)'}</>
                  )
                ) : isSent ? (
                  'Entregado (No abierto aún)'
                ) : (
                  'No enviado todavía'
                )}
              </span>
              {wasEmailOpened && lastOpenDate ? (
                <span className="text-[11px] font-mono text-emerald-300/80 block mt-1">
                  Último: {formatDate(lastOpenDate)}
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[var(--ink-2)] block mt-1">
                  {isSent ? 'Esperando lectura' : 'En preparación'}
                </span>
              )}
            </div>
          </div>

          {/* Tarjeta 2: Clics e Interacción con Dossier/EPK */}
          <div
            className={`p-3 rounded-[var(--r-m)] border transition-all flex items-start gap-3 ${
              hasClickedEpk
                ? 'bg-sky-950/40 border-sky-500/40 shadow-xs'
                : 'bg-[var(--sunken)]/70 border-[var(--hair)]'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-[var(--r-pill)] flex items-center justify-center shrink-0 ${
                hasClickedEpk
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-[var(--sunken)] text-[var(--ink-2)]'
              }`}
            >
              <MousePointerClick className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${
                  hasClickedEpk ? 'text-sky-400' : 'text-[var(--ink-2)]'
                }`}
              >
                Dossier Web / EPK
              </span>
              <span
                className={`text-xs sm:text-sm font-bold block leading-tight ${
                  hasClickedEpk ? 'text-white' : 'text-[var(--ink)]'
                }`}
              >
                {hasClickedEpk ? (
                  <>Dossier Visto ({epkClicks} {epkClicks === 1 ? 'visita' : 'visitas'})</>
                ) : (
                  'Sin clics registrados'
                )}
              </span>
              {hasClickedEpk && lead.ultimo_clic_at ? (
                <span className="text-[11px] font-mono text-sky-300/80 block mt-1">
                  Último: {formatDate(lead.ultimo_clic_at)}
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[var(--ink-2)] block mt-1">
                  Enlace interactivo
                </span>
              )}
            </div>
          </div>

          {/* Tarjeta 3: Estado de Conversación */}
          <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)]/70 border border-[var(--hair)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-[var(--r-pill)] bg-[var(--surface)] text-[var(--ink-2)] flex items-center justify-center shrink-0 border border-[var(--hair)]">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 text-[var(--ink-2)]">
                Ciclo de Respuesta
              </span>
              <span className="text-xs sm:text-sm font-bold font-sans text-white block leading-tight">
                {lead.fecha_ultima_respuesta
                  ? 'Respuesta recibida'
                  : isSent
                  ? `${daysSince} días sin respuesta`
                  : 'Pendiente de inicio'}
              </span>
              <span className="text-[11px] text-[var(--ink-2)] block font-mono mt-1">
                {lead.fecha_ultima_respuesta ? formatDate(lead.fecha_ultima_respuesta) : isSent ? 'En plazo habitual' : 'Sin actividad'}
              </span>
            </div>
          </div>
        </div>

        {/* Desglose de Botones & Acciones Clicadas */}
        {interaccionesBotones.length > 0 && (
          <div className="pt-2.5 border-t border-[var(--hair)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-micro font-bold uppercase tracking-wider text-slate-400">
                <ShowIcon inline emoji="🎯" />Botones & Acciones Detectadas ({interaccionesBotones.length})
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">
                En vivo
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {interaccionesBotones.map((item, idx) => {
                const info = formatTelemetryItem(item);

                return (
                  <div
                    key={item.id || idx}
                    className={`p-2.5 rounded-[var(--r-m)] border flex items-center justify-between gap-3 text-xs ${info.badgeBg} shadow-xs`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="shrink-0 text-base leading-none">
                        {info.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white block truncate leading-tight">
                          {info.title}
                        </span>
                        <p className="text-xs text-slate-200 truncate mt-0.5 font-normal">
                          {info.detail}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono shrink-0 text-sky-300 font-semibold bg-black/30 px-2 py-0.5 rounded">
                      {formatDate(item.fecha)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. GENTLE NUDGE / FOLLOW-UP BANNER IF NEEDED */}
      {needsFollowup && (
        <div className="p-3.5 sm:p-4 rounded-[var(--r-l)] bg-[var(--acc-soft)] border border-[var(--acc)]/30 text-[var(--ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[var(--acc-ink)]" />
            </div>
            <div>
              <span className="text-xs font-bold font-sans text-[var(--acc-ink)] block">
                <ShowIcon inline emoji="⏰" /> Seguimiento recomendado ({daysSince} días sin respuesta)
              </span>
              <span className="text-micro text-[var(--ink-2)] font-sans">
                La sala no ha respondido. Puedes cargar un recordatorio breve y educado.
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="xs"
            onClick={handleApplyFollowupNudge}
            className="items-center gap-1.5 shrink-0 self-end sm:self-auto"
          >
            <Sparkles className="w-3 h-3" />
            <span>Cargar mensaje de seguimiento</span>
          </Button>
        </div>
      )}

      {/* 3. BARRA DE CONTROL ESTILO GMAIL (ORDEN + SYNC) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--ink)] font-sans">
            Hilo de mensajes ({sortedMessages.length})
          </span>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="text-micro text-[var(--ink-2)] hover:text-[var(--ink)] items-center gap-1 cursor-pointer"
            title="Cambiar orden cronológico"
          >
            <ArrowUpDown className="w-3 h-3 text-[var(--ink-2)]" />
            <span>{sortOrder === 'desc' ? 'Más recientes arriba' : 'Más antiguos arriba'}</span>
          </Button>
        </div>

        <Button
          variant="neutral"
          size="xs"
          onClick={handleSyncLector}
          disabled={isSyncing}
          className="items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[var(--acc)]' : ''}`} />
          <span>{isSyncing ? 'Comprobando buzón...' : 'Sincronizar correos'}</span>
        </Button>
      </div>

      {syncFeedback && (
        <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 border border-[var(--acc)]/20 text-xs text-[var(--ink)] flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[var(--acc)] shrink-0" />
          <span className="leading-snug">{syncFeedback}</span>
        </div>
      )}

      {/* 4. LISTADO DE CORREOS ESTILO GMAIL / SUPERHUMAN */}
      {loadingMessages && sortedMessages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-16 text-[var(--ink-2)] text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[var(--acc)]" />
          <span>Cargando conversación con la sala...</span>
        </div>
      ) : sortedMessages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center rounded-[var(--r-l)] bg-[var(--sunken)]/40 border border-dashed border-[var(--hair)]">
          <div className="w-12 h-12 rounded-[var(--r-pill)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink-2)] mb-3 shadow-xs border border-[var(--hair)]">
            <Mail className="w-6 h-6 text-[var(--acc)]" />
          </div>
          <h4 className="text-sm font-bold text-[var(--ink)]">Sin correspondencia todavía</h4>
          <p className="text-xs text-[var(--ink-2)] max-w-sm mt-1 mb-4">
            Cuando envíes la propuesta a través del Agente Enviador o recibas respuestas en tu buzón conectado, el hilo de conversación se mostrará aquí ordenado y con análisis de IA.
          </p>
          <Button
            variant="neutral"
            size="sm"
            onClick={handleSyncLector}
            disabled={isSyncing}
            className="items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Comprobar bandeja ahora</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMessages.map((msg, idx) => {
            const isFromVenue = msg.remitente === 'sala';
            const msgId = msg.id || `msg-${idx}`;
            const isExpanded = expandedMessageIds[msgId] ?? (idx === 0);
            const sentimentLabel = msg.sentimiento_label || msg.intencion_etiqueta;
            const msgTelemetry = getMessageTelemetry(msg, idx);

            // Sender badge formatting
            const senderDisplayName = isFromVenue
              ? msg.remitente_nombre || lead.nombre_sala || 'Programador de Sala'
              : bandName || 'Tu Banda / Productora';
            const senderInitial = senderDisplayName.charAt(0).toUpperCase();

            return (
              <div
                key={msgId}
                className={`rounded-[var(--r-l)] border transition-all shadow-xs overflow-hidden ${
                  isFromVenue
                    ? 'bg-[var(--surface)] border-[var(--acc)]/30 ring-1 ring-[var(--acc)]/10'
                    : 'bg-[var(--surface)] border-[var(--hair)]'
                }`}
              >
                {/* Cabecera del Mensaje (Gmail Header) */}
                <div
                  onClick={() => toggleExpand(msgId)}
                  className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-ui hover:bg-[var(--sunken)]/40 ${
                    isExpanded ? 'border-b border-[var(--hair)] bg-[var(--sunken)]/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-[var(--r-pill)] flex items-center justify-center font-bold text-xs shrink-0 ${
                        isFromVenue
                          ? 'bg-[var(--acc)] text-[var(--on-acc)] shadow-xs'
                          : 'bg-[var(--ink)] text-[var(--bg)]'
                      }`}
                    >
                      {isFromVenue ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[var(--ink)] truncate max-w-[200px] sm:max-w-[300px]">
                          {senderDisplayName}
                        </span>

                        <span
                          className={`text-micro px-1.5 py-0.2 rounded font-sans font-semibold ${
                            isFromVenue
                              ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] border border-[var(--acc)]/30'
                              : 'bg-[var(--sunken)] text-[var(--ink-2)] border border-[var(--hair)]'
                          }`}
                        >
                          {isFromVenue ? 'Sala / Promotor' : 'Nosotros'}
                        </span>

                        {isFromVenue && sentimentLabel && (
                          <span className="text-micro font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {sentimentLabel}
                          </span>
                        )}

                        {/* Telemetría individual por mensaje */}
                        {!isFromVenue && msgTelemetry && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {msgTelemetry.opened ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 font-semibold">
                                <Eye className="w-3 h-3" />
                                <span>Abierto {msgTelemetry.openCount > 1 ? `(${msgTelemetry.openCount}x)` : '(1x)'}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--sunken)] border border-[var(--hair)] text-[var(--ink-2)] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Sin abrir</span>
                              </span>
                            )}

                            {msgTelemetry.epkClicks > 0 && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-500/40 text-sky-300 flex items-center gap-1 font-semibold">
                                <ExternalLink className="w-3 h-3" />
                                <span>Dossier ({msgTelemetry.epkClicks})</span>
                              </span>
                            )}

                            {msgTelemetry.pdfOpens > 0 && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 flex items-center gap-1 font-semibold">
                                <Download className="w-3 h-3" />
                                <span>PDF ({msgTelemetry.pdfOpens})</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {!isExpanded && (
                        <p className="text-micro text-[var(--ink-2)] truncate max-w-[280px] sm:max-w-[450px] mt-0.5">
                          {msg.asunto ? `${msg.asunto} — ` : ''}{msg.mensaje}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isFromVenue && <EmailDeliveryTicks lead={lead} size="sm" />}
                    <span className="text-micro text-[var(--ink-2)] font-mono">
                      {formatDate(msg.fecha)}
                    </span>
                    <button
                      type="button"
                      className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1 rounded hover:bg-[var(--sunken)] transition-ui"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Cuerpo del Mensaje Expandido (Gmail Body) */}
                {isExpanded && (() => {
                  const displayedBody = (msg.mensaje && !msg.mensaje.startsWith('(Correo enviado a mano'))
                    ? msg.mensaje
                    : (lead.pitch_generado || msg.mensaje);

                  return (
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Asunto y Datos de Cabecera */}
                      {msg.asunto && (
                        <div className="text-xs font-bold text-[var(--ink)] border-b border-[var(--hair)] pb-2.5 flex items-center justify-between gap-2">
                          <span className="truncate">Asunto: {msg.asunto}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyText(msgId, displayedBody);
                            }}
                            className="text-micro text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1 px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--sunken)] hover:bg-[var(--sunken)]/80 transition-ui cursor-pointer shrink-0 font-sans"
                          >
                            {copiedId === msgId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar texto</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Texto íntegro del correo (Estilo Superhuman / Gmail) */}
                      <div className="p-3.5 sm:p-4 rounded-[var(--r-m)] bg-[var(--sunken)]/40 border border-[var(--hair)]/60 text-xs sm:text-[13px] text-[var(--ink)] font-sans leading-relaxed whitespace-pre-wrap selection:bg-[var(--acc-soft)] selection:text-[var(--acc-ink)]">
                        {displayedBody}
                      </div>

                      {/* Telemetría y acciones detectadas en este envío concreto */}
                      {!isFromVenue && msgTelemetry && msgTelemetry.events.length > 0 && (
                        <div className="p-3 rounded-[var(--r-m)] bg-slate-950/40 border border-[var(--hair)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                              <Zap className="w-3 h-3 text-[var(--acc)]" />
                              <span>Actividad registrada en este envío ({msgTelemetry.events.length})</span>
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              {msgTelemetry.openCount > 1 ? `${msgTelemetry.openCount} lecturas` : '1ª lectura'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {msgTelemetry.events.slice(0, 6).map((ev: any, evIdx: number) => {
                              const info = formatTelemetryItem(ev);
                              return (
                                <div key={ev.id || evIdx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-black/40 border border-white/5 gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-sm shrink-0">{info.icon}</span>
                                    <span className="font-semibold text-slate-200 truncate text-[11px]">{info.title}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{formatDate(ev.fecha)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Footer con Acciones Rápidas */}
                      {isFromVenue && (
                        <div className="pt-2 border-t border-[var(--hair)] flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={onSelectPitchTab}
                            className="items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Redactar Réplica / Ver Contrapropuesta IA</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
