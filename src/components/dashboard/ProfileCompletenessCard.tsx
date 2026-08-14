import React, { useState, useEffect } from 'react';
import { EPKConfig, Lead, Concert, Rehearsal, SocialMetric, Fan, Tour, User } from '../../types';
import { 
  Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, 
  HelpCircle, ChevronDown, ChevronUp, Bot, FileText, Disc3, Calendar,
  Activity, Heart, Truck, X, BookOpen, Layers, Sliders, Clock, Mail, Key
} from 'lucide-react';
import { api } from '../../services/api';

interface ProfileCompletenessCardProps {
  epkConfig?: Partial<EPKConfig>;
  leads: Lead[];
  concerts: Concert[];
  rehearsals: Rehearsal[];
  metrics: SocialMetric[];
  fans?: Fan[];
  tours?: Tour[];
  isStitchLight?: boolean;
  bandName?: string;
  currentUser?: User | null;
  onNavigate?: (view: any, options?: any) => void;
  onOpenAutonomyModal?: () => void;
  onOpenProfileModal?: () => void;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  epkConfig,
  leads = [],
  concerts = [],
  rehearsals = [],
  metrics = [],
  fans = [],
  tours = [],
  isStitchLight = false,
  bandName = 'Tu Banda',
  currentUser,
  onNavigate,
  onOpenAutonomyModal,
  onOpenProfileModal
}) => {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasScheduleConfigured, setHasScheduleConfigured] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkSchedule = async () => {
      try {
        const bandId = currentUser?.band_id || 'bakandeya';
        const schedule = await api.getBandSchedule(bandId);
        if (isMounted && schedule) {
          const hasHours = (Array.isArray(schedule.horas_lector) && schedule.horas_lector.length > 0) ||
                           (Array.isArray(schedule.horas_enviador) && schedule.horas_enviador.length > 0);
          setHasScheduleConfigured(hasHours);
        }
      } catch {
        if (isMounted) setHasScheduleConfigured(false);
      }
    };
    checkSchedule();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Read stored songs from localStorage safely
  const storedSongsCount = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('bakandeya_songs_catalog') || localStorage.getItem('bakandeya_songs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.length;
      }
      return 0;
    } catch {
      return 0;
    }
  }, []);

  const storedSetlistsCount = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('bakandeya_setlists_data') || localStorage.getItem('bakandeya_setlists');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.length;
      }
      return 0;
    } catch {
      return 0;
    }
  }, []);

  // Compute profile completeness pillars
  const pillars = React.useMemo(() => {
    const hasBio = Boolean(
      epkConfig?.biografia && 
      epkConfig.biografia.trim().length >= 80 && 
      !epkConfig.biografia.toLowerCase().includes('por definir') &&
      !epkConfig.biografia.includes('Propuesta musical en directo')
    );
    const hasPhotoLogo = Boolean(epkConfig?.logoUrl || (epkConfig?.bandPhotos && epkConfig.bandPhotos.length > 0));
    const hasDossierPdf = Boolean(
      (epkConfig?.dossierPdfUrl && epkConfig.dossierPdfUrl.trim().length > 5) || 
      (epkConfig?.dossierDocumentUrl && epkConfig.dossierDocumentUrl.trim().length > 5) || 
      (epkConfig?.dossierTextoExtra && epkConfig.dossierTextoExtra.trim().length >= 80 && !epkConfig.dossierTextoExtra.toLowerCase().includes('por definir'))
    );
    const hasRiderPdf = Boolean(
      (epkConfig?.riderPdfUrl && epkConfig.riderPdfUrl.trim().length > 5) || 
      (epkConfig?.riderTecnico && epkConfig.riderTecnico.trim().length >= 80 && !epkConfig.riderTecnico.toLowerCase().includes('por definir'))
    );
    const hasLeads = leads.length > 0;
    const hasVerifiedEmails = leads.some(l => l.email_contacto && l.email_contacto.includes('@'));
    const hasSongs = storedSongsCount > 0;
    const hasAgenda = concerts.length > 0 || rehearsals.length > 0;
    const hasMetrics = metrics.length > 0;
    const hasFans = fans.length > 0 || Boolean(epkConfig?.incentivoFans?.enlaceDescarga || epkConfig?.incentivoFans?.codigoDescuento);
    const hasGoogleOAuth = Boolean(currentUser?.googleOAuth?.connected);

    return [
      {
        id: 'epk_bio',
        title: 'Biografía & Logo (EPK)',
        completed: hasBio && hasPhotoLogo,
        weight: 10,
        view: 'epk',
        missingLabel: 'Rellenar Bio (mín 80 chars)',
        agentImpact: 'El Agente Redactor usa la Bio e identidad de la banda para los emails de presentación.'
      },
      {
        id: 'dossier_pdf',
        title: 'Dossier Promocional PDF',
        completed: hasDossierPdf,
        weight: 10,
        view: 'epk',
        missingLabel: 'Subir Dossier PDF',
        agentImpact: 'Los programadores de salas solicitan el Dossier PDF adjunto para valorar el proyecto de un vistazo.'
      },
      {
        id: 'rider_pdf',
        title: 'Rider Técnico / Input List',
        completed: hasRiderPdf,
        weight: 10,
        view: 'epk',
        missingLabel: 'Subir Rider Técnico',
        agentImpact: 'Las salas necesitan confirmar qué microfonía y líneas requiere la banda antes de reservar fecha.'
      },
      {
        id: 'leads',
        title: 'Directorio Booking & Salas',
        completed: hasLeads && hasVerifiedEmails,
        weight: 15,
        view: 'booking',
        missingLabel: 'Añadir Salas / Scout',
        agentImpact: 'Scout y el Redactor usan los contactos en Hoja para enviar campañas automáticas de booking.'
      },
      {
        id: 'smart_gate',
        title: 'Horarios Agentes (Smart Gate)',
        completed: hasScheduleConfigured,
        weight: 15,
        view: 'profile',
        missingLabel: 'Configurar Horarios',
        agentImpact: 'Sincroniza la zona horaria y ventanas de lectura/envío para los scripts Python de GitHub Actions.'
      },
      {
        id: 'google_oauth',
        title: 'Conexión Google OAuth',
        completed: hasGoogleOAuth,
        weight: 10,
        view: 'profile',
        missingLabel: 'Conectar Gmail',
        agentImpact: 'Permite a los agentes redactar y consultar directamente la bandeja de entrada de tu correo.'
      },
      {
        id: 'repertorio',
        title: 'Discografía & Repertorio',
        completed: hasSongs,
        weight: 10,
        view: 'repertorio',
        missingLabel: 'Cargar Canciones',
        agentImpact: 'Permite al Mánager AI crear setlists ajustados exactamente al tiempo de show permitido (45m, 60m, 90m).'
      },
      {
        id: 'agenda',
        title: 'Agenda & Conciertos',
        completed: hasAgenda,
        weight: 10,
        view: 'calendario',
        missingLabel: 'Agendar Evento',
        agentImpact: 'El bot verifica huecos libres en tu calendario antes de proponer fechas a las salas.'
      },
      {
        id: 'metrics_fans',
        title: 'Métricas & Comunidad Fans',
        completed: hasMetrics || hasFans,
        weight: 10,
        view: 'reels',
        missingLabel: 'Métricas / Regalo Fans',
        agentImpact: 'El agente utiliza tus seguidores y escuchas en Spotify como argumento de venta de entradas.'
      }
    ];
  }, [epkConfig, leads, storedSongsCount, concerts, rehearsals, metrics, fans, hasScheduleConfigured, currentUser]);

  const totalCompletedWeight = pillars.reduce((acc, p) => p.completed ? acc + p.weight : acc, 0);
  const totalPossibleWeight = pillars.reduce((acc, p) => acc + p.weight, 0);
  const percentage = Math.min(100, Math.round((totalCompletedWeight / totalPossibleWeight) * 100));
  const completedPillarsCount = pillars.filter(p => p.completed).length;

  const getStatusBadge = () => {
    if (percentage >= 85) return { label: 'Perfil Optimizado (100% Agéntico)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (percentage >= 50) return { label: 'Perfil Intermedio', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { label: 'Perfil Inicial (Requiere Datos)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  };

  const handlePillarClick = (view: string) => {
    if (view === 'profile') {
      if (onOpenProfileModal) {
        onOpenProfileModal();
      } else if (onNavigate) {
        onNavigate('profile');
      }
    } else if (onNavigate) {
      onNavigate(view);
    }
  };

  const badgeInfo = getStatusBadge();

  return (
    <div className={`p-4 sm:p-5 rounded-2xl transition-all border shadow-sm ${
      isStitchLight 
        ? 'bg-white border-slate-200 text-slate-800' 
        : 'bg-[#181716] border-stone-800 text-zinc-100'
    }`}>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
            {percentage}%
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-100">
                Estado del Perfil de {bandName}
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${badgeInfo.color}`}>
                {badgeInfo.label}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Completa los datos clave para entrenar la IA y mejorar la negociación de fechas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={() => onOpenAutonomyModal && onOpenAutonomyModal()}
            className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xs:inline">Autonomía IA</span>
          </button>

          <button
            onClick={() => setShowAuditModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-neutral-300 text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>Info</span>
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            title="Expandir/colapsar checklist"
          >
            <span>{isExpanded ? 'Ocultar' : 'Ver pasos'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="pt-3 space-y-1.5">
        <div className="w-full h-2 rounded-full bg-stone-900 overflow-hidden relative">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Compact Trigger Button when Collapsed (Mobile Space Saver) */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full mt-3 p-2.5 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800/80 text-xs font-mono text-stone-300 flex items-center justify-between transition-all cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Pasos de Configuración ({completedPillarsCount}/{pillars.length} completados)
            </span>
          </div>
          <div className="flex items-center gap-1 text-amber-400 font-bold shrink-0 text-[11px] group-hover:underline">
            <span>Ver detalles</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </button>
      )}

      {/* Full Grid and Detailed Accordion when Expanded */}
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-in fade-in duration-200">
          {/* Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {pillars.map(pillar => (
              <button
                key={pillar.id}
                onClick={() => handlePillarClick(pillar.view)}
                className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between gap-1 cursor-pointer group active:scale-95 ${
                  pillar.completed
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300 hover:bg-emerald-950/30'
                    : 'bg-amber-950/20 border-amber-500/20 text-amber-200 hover:bg-amber-950/30'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-mono font-bold truncate">{pillar.title}</span>
                  {pillar.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                </div>

                <span className={`text-[9px] font-mono font-medium truncate ${
                  pillar.completed ? 'text-emerald-400/80' : 'text-amber-400 group-hover:underline'
                }`}>
                  {pillar.completed ? 'Completado' : pillar.missingLabel}
                </span>
              </button>
            ))}
          </div>

          {/* Detailed Breakdown List */}
          <div className="pt-2 border-t border-amber-500/10 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-amber-400">
              Checklist Completo de Entrenabilidad IA (9/9 Pasos)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-sans">
              {pillars.map(pillar => (
                <div 
                  key={`exp-${pillar.id}`}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    pillar.completed ? 'bg-neutral-900/60 border-neutral-800' : 'bg-amber-500/5 border-amber-500/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {pillar.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-bold text-zinc-100">{pillar.title}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      {pillar.agentImpact}
                    </p>
                  </div>

                  {!pillar.completed && (
                    <button
                      onClick={() => handlePillarClick(pillar.view)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-mono font-bold text-[10px] shrink-0 hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      Configurar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181716] border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display uppercase tracking-wider text-zinc-100">
                    ¿Por qué importa completar el Perfil de {bandName}?
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Cómo funcionan autónomamente los 4 agentes Python con tu información
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 font-sans leading-relaxed">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm font-display">
                  <Bot className="w-4 h-4" /> 1. Agente Scout (Búsqueda e Investigación de Salas)
                </h4>
                <p>
                  Busca automáticamente salas, festivales y fiestas patronales en las regiones que solicites. Utiliza tu género musical y tu aforo promedio para descartar recintos incompatibles.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm font-display">
                  <FileText className="w-4 h-4" /> 2. Agente Redactor (Redacción de Pitches de Booking)
                </h4>
                <p>
                  Redacta automáticamente las propuestas por correo para las salas. Extrae párrafos clave de tu <strong className="text-zinc-100">Biografía</strong>, adjunta el enlace a tu <strong className="text-zinc-100">Dossier PDF</strong> y menciona tu récord de aforo o número de seguidores en redes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm font-display">
                  <Disc3 className="w-4 h-4" /> 3. Agente Mánager AI (Chatbot y Negociación de Fechas)
                </h4>
                <p>
                  Cuando una sala responde solicitando fecha, caché o rider técnico, el Mánager AI consulta tu <strong className="text-zinc-100">Rider Técnico</strong> y tu <strong className="text-zinc-100">Calendario</strong> para proponer opciones sin solapar ensayos ni otros bolos.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm font-display">
                  <Heart className="w-4 h-4" /> 4. Agente Lector de Bandeja (Clasificación de Correos)
                </h4>
                <p>
                  Monitoriza las respuestas recibidas en la bandeja de entrada según tu <strong className="text-zinc-100">Smart Gate Scheduler</strong> y clasifica si el programador está interesado, si pide presupuesto o si rechaza la propuesta.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold font-mono text-xs hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
