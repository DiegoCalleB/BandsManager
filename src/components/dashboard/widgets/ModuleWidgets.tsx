import React, { useState, useEffect } from 'react';
import {
  Building2,
  Music,
  DollarSign,
  Users,
  BookOpen,
  Bot,
  Truck,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  QrCode,
  Disc3,
  ShieldCheck,
} from 'lucide-react';
import { Lead, Concert, Rehearsal, Tour, Fan, SocialPost, EPKConfig, ThemeColors } from '../../../types';
import { api } from '../../../services/api';
import { Onda } from '../../ui/Onda';
import { ShowIcon } from '../../ui/ShowIcon';

export interface ModuleWidgetProps {
  /** Heredado de main: Espectro resuelve el tema en tokens, así que se acepta y se ignora. */
  isStitchLight?: boolean;
  leads?: Lead[];
  concerts?: Concert[];
  rehearsals?: Rehearsal[];
  tours?: Tour[];
  fans?: Fan[];
  posts?: SocialPost[];
  epkConfig?: Partial<EPKConfig>;
  currentUser?: any;
  activeBandName?: string;
  colors?: ThemeColors;
  onNavigate?: (view: string, options?: any) => void;
}

/* 1. CRM PIPELINE WIDGET */
export function CrmPipelineWidget({ leads = [], onNavigate }: ModuleWidgetProps) {
  const urgentRepliesNeeded = leads.filter((l) => l.estado === 'interesado' || l.estado === 'negociando');
  const urgentApprovalsNeeded = leads.filter((l) => l.estado === 'pendiente_aprobacion' || (l.pitch_generado && l.estado === 'nuevo'));
  const confirmedShows = leads.filter((l) => l.estado === 'confirmado');

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--ink)]">Booking</h3>
            <p className="text-xs text-[var(--ink-2)]">Resumen de contrataciones</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('booking')}
            className="text-xs text-[var(--acc-ink)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver CRM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <Onda
        className="mx-auto"
        height={leads.length ? 104 : 16}
        barWidth={56}
        gap={24}
        showValues
        data={[
          { label: 'Negociando', value: urgentRepliesNeeded.length, color: 'var(--ok)' },
          { label: 'Por aprobar', value: urgentApprovalsNeeded.length, color: 'var(--ok)' },
          { label: 'Confirmados', value: confirmedShows.length },
        ]}
      />

      {leads.length === 0 && (
        <p className="text-xs text-[var(--ink-2)] text-center">Todavía no hay ninguna sala en el embudo. Busca las primeras.</p>
      )}

      <div className="text-xs text-[var(--ink-2)] flex items-center justify-between pt-1">
        <span>Total de salas y eventos en el embudo</span>
        <span className="font-semibold text-[var(--ink-2)] tabular-nums">{leads.length}</span>
      </div>
    </div>
  );
}

/* 2. REPERTORIO WIDGET */
export function RepertorioWidget({ onNavigate }: ModuleWidgetProps) {
  const [songCount, setSongCount] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    const loadSongCount = async () => {
      try {
        const res = await api.getSongs();
        if (isMounted && res?.songs && Array.isArray(res.songs)) {
          setSongCount(res.songs.length);
        }
      } catch (err) {
        console.error('Failed to load song count:', err);
        if (isMounted) setSongCount(0);
      }
    };
    loadSongCount();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--tentative)]/15 text-[var(--acc-ink)]">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--ink-2)]">Repertorio y setlists</h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">Canciones e Iris Stems</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('repertorio')}
            className="text-xs font-sans text-[var(--acc)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Temas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-[var(--sunken)]">
        <div className="flex items-center gap-3">
          <Disc3 className="w-8 h-8 text-[var(--acc)] animate-spin-slow shrink-0" />
          <div>
            <span className="text-xl font-sans font-bold text-[var(--ink-2)]">{songCount}</span>
            <p className="text-xs font-sans text-[var(--ink-2)]">Temas guardados en catálogo</p>
          </div>
        </div>
        <span className="text-micro font-sans px-2 py-1 rounded bg-[var(--acc)]/20 text-[var(--acc-ink)] font-bold">Iris IA activo</span>
      </div>
    </div>
  );
}

/* 3. FINANCES WIDGET */
export function FinancesWidget({ concerts = [], onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  const totalCache = concerts.reduce((acc, c) => acc + (Number(c.cache) || 0), 0);

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--ok)]/15 text-[var(--ink)]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--ink-2)]">Balance y cachés</h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">Recaudación bruta proyectada</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('finanzas')}
            className="text-xs font-sans text-[var(--acc)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Finanzas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-between">
        <div>
          <span className="text-2xl font-sans font-black text-[var(--ok)]">{totalCache.toLocaleString('es-ES')} €</span>
          <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5">Suma de cachés de bolos</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-sans text-[var(--ink-2)] font-bold">{concerts.length} conciertos</span>
          <p className="text-micro font-sans text-[var(--ink-2)]">
            Caché medio: {concerts.length > 0 ? Math.round(totalCache / concerts.length) : 0} €
          </p>
        </div>
      </div>
    </div>
  );
}

/* 4. SOCIAL & FANS WIDGET */
export function SocialFansWidget({ fans = [], onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc-ink)]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--ink-2)]">Fans y Captación</h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">Comunidad y códigos QR</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('fans')}
            className="text-xs font-sans text-[var(--acc)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Fans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)]">
          <span className="text-2xl font-sans font-bold text-[var(--acc)]">{fans.length}</span>
          <p className="text-micro font-sans text-[var(--ink-2)] mt-1">Fans registrados</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('fans')}
          className="p-3 rounded-[var(--r-m)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc-ink)] transition-ui flex flex-col items-center justify-center cursor-pointer"
        >
          <QrCode className={`w-5 h-5 ${'text-[var(--acc)]'} mb-1`} />
          <span className="text-xs font-sans font-bold">Generar QR concierto</span>
        </button>
      </div>
    </div>
  );
}

/* 5. EPK DOSSIER WIDGET */
export function EpkStatusWidget({ epkConfig, onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--tentative)]/15 text-[var(--acc-ink)]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--ink-2)]">Dossier EPK público</h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">Presencia y prensa para salas</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('epk')}
            className="text-xs font-sans text-[var(--acc)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Editar EPK</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-between">
        <div>
          <span className="text-xs font-sans font-bold text-[var(--tentative)]/80">EPK activo y listo</span>
          <p className="text-micro font-sans text-[var(--ink-2)]">Optimizado para agentes y programadores</p>
        </div>
        <a
          href="/epk"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--tentative)]/20 text-[var(--tentative)] font-sans text-xs font-bold hover:bg-[var(--tentative)]/30 transition-ui"
        >
          Ver EPK Vivo <ShowIcon inline emoji="↗" />
        </a>
      </div>
    </div>
  );
}

/* 6. AI AGENT WIDGET */
export function AiAgentWidget({ leads = [], currentUser, onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  const pendingApprovals = leads.filter((l) => l.estado === 'pendiente_aprobacion').length;

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc-ink)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--ink-2)]">Agente IA de Booking</h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">Redactor y lector autónomo</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('booking')}
            className="text-xs font-sans text-[var(--acc)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Agentes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-between">
        <div>
          <span className="text-lg font-sans font-bold text-[var(--acc)]">{pendingApprovals} Borradores</span>
          <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5">Pendientes de aprobación humana</p>
        </div>
        <span className="px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--ok)]/20 text-[var(--ink)] text-micro font-sans font-bold">● Activo</span>
      </div>
    </div>
  );
}

/* 7. TOUR LOGISTICS WIDGET */
export function TourStatusWidget({ tours = [], onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)]">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--ink-2)]">Giras y Logística</h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">Rutas de conciertos y producción</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('tour')}
            className="text-xs font-sans text-[var(--acc)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Giras</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-between">
        <div>
          <span className="text-sm font-sans font-bold text-[var(--ink-2)]">{tours.length} Giras Programadas</span>
          <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5">Rutas y hoteles unificados</p>
        </div>
      </div>
    </div>
  );
}
