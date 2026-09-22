import React from 'react';
import { 
  Building2, Music, DollarSign, Users, BookOpen, Bot, Truck, ArrowRight, 
  CheckCircle2, Clock, AlertCircle, Sparkles, QrCode, Disc3, ShieldCheck
} from 'lucide-react';
import { Lead, Concert, Rehearsal, Tour, Fan, SocialPost, EPKConfig, ThemeColors } from '../../../types';

export interface ModuleWidgetProps {
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
  isStitchLight?: boolean;
  onNavigate?: (view: string, options?: any) => void;
}

/* 1. CRM PIPELINE WIDGET */
export function CrmPipelineWidget({ leads = [], onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  const urgentRepliesNeeded = leads.filter(l => l.estado === 'interesado' || l.estado === 'negociando');
  const urgentApprovalsNeeded = leads.filter(l => l.estado === 'pendiente_aprobacion' || (l.pitch_generado && l.estado === 'nuevo'));
  const confirmedShows = leads.filter(l => l.estado === 'confirmado');

  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-4 transition-colors`}>
      <div className={`flex items-center justify-between pb-3 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-sky-500/15 text-sky-400'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Pipeline de Booking
            </h3>
            <p className={`text-xs font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Resumen CRM de contrataciones</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('booking')}
            className={`text-xs font-mono ${isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'} hover:underline font-bold flex items-center gap-1 cursor-pointer`}
          >
            <span>Ver CRM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center font-mono">
        <div className={`p-3 rounded-xl ${
          isStitchLight ? 'bg-amber-50/70 border border-amber-200' : 'bg-[#121214] border border-amber-500/30'
        }`}>
          <span className={`text-xl font-bold ${isStitchLight ? 'text-amber-800' : 'text-amber-400'}`}>{urgentRepliesNeeded.length}</span>
          <p className={`text-[10px] ${isStitchLight ? 'text-amber-700 font-medium' : 'text-neutral-400'} uppercase tracking-wider mt-1`}>Negociando</p>
        </div>
        <div className={`p-3 rounded-xl ${
          isStitchLight ? 'bg-purple-50/70 border border-purple-200' : 'bg-[#121214] border border-purple-500/30'
        }`}>
          <span className={`text-xl font-bold ${isStitchLight ? 'text-purple-800' : 'text-purple-400'}`}>{urgentApprovalsNeeded.length}</span>
          <p className={`text-[10px] ${isStitchLight ? 'text-purple-700 font-medium' : 'text-neutral-400'} uppercase tracking-wider mt-1`}>Por Aprobar</p>
        </div>
        <div className={`p-3 rounded-xl ${
          isStitchLight ? 'bg-emerald-50/70 border border-emerald-200' : 'bg-[#121214] border border-emerald-500/30'
        }`}>
          <span className={`text-xl font-bold ${isStitchLight ? 'text-emerald-800' : 'text-emerald-400'}`}>{confirmedShows.length}</span>
          <p className={`text-[10px] ${isStitchLight ? 'text-emerald-700 font-medium' : 'text-neutral-400'} uppercase tracking-wider mt-1`}>Confirmados</p>
        </div>
      </div>

      <div className={`text-xs font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'} flex items-center justify-between pt-1`}>
        <span>Total de salas & eventos en embudo:</span>
        <span className={`font-bold ${isStitchLight ? 'text-zinc-800' : 'text-neutral-200'}`}>{leads.length} registros</span>
      </div>
    </div>
  );
}

/* 2. REPERTORIO WIDGET */
export function RepertorioWidget({ onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  let songCount = 0;
  try {
    const raw = localStorage.getItem('bakandeya_songs_catalog') || localStorage.getItem('bakandeya_songs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) songCount = parsed.length;
    }
  } catch {}

  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-4 transition-colors`}>
      <div className={`flex items-center justify-between pb-3 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-purple-500/15 text-purple-400'}`}>
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Repertorio & Setlists
            </h3>
            <p className={`text-xs font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Canciones e Iris Stems</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('repertorio')}
            className={`text-xs font-mono ${isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'} hover:underline font-bold flex items-center gap-1 cursor-pointer`}
          >
            <span>Ver Temas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className={`flex items-center justify-between p-3 rounded-xl ${
        isStitchLight ? 'bg-zinc-50 border border-zinc-200' : 'bg-[#121214] border border-neutral-800'
      }`}>
        <div className="flex items-center gap-3">
          <Disc3 className="w-8 h-8 text-purple-500 animate-spin-slow shrink-0" />
          <div>
            <span className={`text-xl font-mono font-bold ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>{songCount}</span>
            <p className={`text-xs font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Temas guardados en catálogo</p>
          </div>
        </div>
        <span className={`text-[10px] font-mono px-2 py-1 rounded font-bold border ${
          isStitchLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}>
          Iris IA Activo
        </span>
      </div>
    </div>
  );
}

/* 3. FINANCES WIDGET */
export function FinancesWidget({ concerts = [], onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  const totalCache = concerts.reduce((acc, c) => acc + (Number(c.cache) || 0), 0);

  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-4 transition-colors`}>
      <div className={`flex items-center justify-between pb-3 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400'}`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Balance & Cachés
            </h3>
            <p className={`text-xs font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Recaudación bruta proyectada</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('finanzas')}
            className={`text-xs font-mono ${isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'} hover:underline font-bold flex items-center gap-1 cursor-pointer`}
          >
            <span>Finanzas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className={`p-3.5 rounded-xl ${
        isStitchLight ? 'bg-emerald-50/60 border border-emerald-200' : 'bg-[#121214] border border-emerald-500/30'
      } flex items-center justify-between`}>
        <div>
          <span className={`text-2xl font-mono font-black ${isStitchLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{totalCache.toLocaleString('es-ES')} €</span>
          <p className={`text-[10px] font-mono ${isStitchLight ? 'text-emerald-800' : 'text-neutral-400'} uppercase tracking-wider mt-0.5`}>Suma de cachés de bolos</p>
        </div>
        <div className="text-right">
          <span className={`text-xs font-mono ${isStitchLight ? 'text-zinc-800 font-bold' : 'text-neutral-300 font-bold'}`}>{concerts.length} conciertos</span>
          <p className={`text-[10px] font-mono ${isStitchLight ? 'text-emerald-700 font-medium' : 'text-emerald-300'}`}>Caché medio: {concerts.length > 0 ? Math.round(totalCache / concerts.length) : 0} €</p>
        </div>
      </div>
    </div>
  );
}

/* 4. SOCIAL & FANS WIDGET */
export function SocialFansWidget({ fans = [], onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-4 transition-colors`}>
      <div className={`flex items-center justify-between pb-3 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-amber-500/15 text-amber-400'}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Fans & Captación
            </h3>
            <p className={`text-xs font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Comunidad y códigos QR</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('fans')}
            className={`text-xs font-mono ${isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'} hover:underline font-bold flex items-center gap-1 cursor-pointer`}
          >
            <span>Ver Fans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-xl ${
          isStitchLight ? 'bg-amber-50/70 border border-amber-200' : 'bg-[#121214] border border-amber-500/30'
        }`}>
          <span className={`text-2xl font-mono font-bold ${isStitchLight ? 'text-amber-800' : 'text-amber-400'}`}>{fans.length}</span>
          <p className={`text-[10px] font-mono ${isStitchLight ? 'text-amber-700 font-medium' : 'text-neutral-400'} uppercase tracking-wider mt-1`}>Fans Registrados</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('fans')}
          className={`p-3 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer ${
            isStitchLight ? 'bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-800' : 'bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300'
          }`}
        >
          <QrCode className={`w-5 h-5 ${isStitchLight ? 'text-indigo-600' : 'text-amber-400'} mb-1`} />
          <span className="text-[11px] font-mono font-bold">Generar QR Concierto</span>
        </button>
      </div>
    </div>
  );
}

/* 5. EPK DOSSIER WIDGET */
export function EpkStatusWidget({ epkConfig, onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-4 transition-colors`}>
      <div className={`flex items-center justify-between pb-3 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-purple-500/15 text-purple-400'}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Dossier EPK Público
            </h3>
            <p className={`text-xs font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Presencia y prensa para salas</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('epk')}
            className={`text-xs font-mono ${isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'} hover:underline font-bold flex items-center gap-1 cursor-pointer`}
          >
            <span>Editar EPK</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className={`p-3.5 rounded-xl ${
        isStitchLight ? 'bg-purple-50/60 border border-purple-200' : 'bg-[#121214] border border-neutral-800'
      } flex items-center justify-between`}>
        <div>
          <span className={`text-xs font-mono font-bold ${isStitchLight ? 'text-purple-900' : 'text-purple-300'}`}>EPK Activo & Listo</span>
          <p className={`text-[10px] font-mono ${isStitchLight ? 'text-purple-700' : 'text-neutral-400'}`}>Optimizado para agentes y programadores</p>
        </div>
        <a
          href="/epk"
          target="_blank"
          rel="noopener noreferrer"
          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
            isStitchLight ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
          }`}
        >
          Ver EPK Vivo ↗
        </a>
      </div>
    </div>
  );
}

/* 6. AI AGENT WIDGET */
export function AiAgentWidget({ leads = [], currentUser, onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  const pendingApprovals = leads.filter(l => l.estado === 'pendiente_aprobacion').length;

  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-4 transition-colors`}>
      <div className={`flex items-center justify-between pb-3 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-amber-500/15 text-amber-400'}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Agente IA de Booking
            </h3>
            <p className={`text-xs font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Redactor & Lector Autónomo</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('booking')}
            className={`text-xs font-mono ${isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'} hover:underline font-bold flex items-center gap-1 cursor-pointer`}
          >
            <span>Agentes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className={`p-3.5 rounded-xl ${
        isStitchLight ? 'bg-indigo-50/60 border border-indigo-200' : 'bg-[#121214] border border-amber-500/30'
      } flex items-center justify-between`}>
        <div>
          <span className={`text-lg font-mono font-bold ${isStitchLight ? 'text-indigo-900' : 'text-amber-400'}`}>{pendingApprovals} Borradores</span>
          <p className={`text-[10px] font-mono ${isStitchLight ? 'text-indigo-700' : 'text-neutral-400'} uppercase tracking-wider mt-0.5`}>Pendientes de Aprobación Humana</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
          isStitchLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
        }`}>
          ● Activo
        </span>
      </div>
    </div>
  );
}

/* 7. TOUR LOGISTICS WIDGET */
export function TourStatusWidget({ tours = [], onNavigate, isStitchLight = false }: ModuleWidgetProps) {
  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-4 transition-colors`}>
      <div className={`flex items-center justify-between pb-3 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-sky-500/15 text-sky-400'}`}>
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Giras & Logística
            </h3>
            <p className={`text-xs font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Rutas de conciertos y producción</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('tour')}
            className={`text-xs font-mono ${isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'} hover:underline font-bold flex items-center gap-1 cursor-pointer`}
          >
            <span>Ver Giras</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className={`p-3.5 rounded-xl ${
        isStitchLight ? 'bg-zinc-50 border border-zinc-200' : 'bg-[#121214] border border-neutral-800'
      } flex items-center justify-between`}>
        <div>
          <span className={`text-sm font-mono font-bold ${isStitchLight ? 'text-zinc-900' : 'text-neutral-200'}`}>{tours.length} Giras Programadas</span>
          <p className={`text-[10px] font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'} mt-0.5`}>Rutas y hoteles unificados</p>
        </div>
      </div>
    </div>
  );
}
