import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Trash2,
  X,
  Bot,
  ShieldCheck,
  Zap,
  Cpu,
  Server,
  Check,
  ArrowRight,
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { ModalPortal } from '../common/ModalPortal';

interface QueueJobItem {
  id: string;
  agent_type: string;
  status: string;
  attempts: number;
  error_message?: string;
  scheduled_at: string;
  completed_at?: string;
  created_at: string;
  duration_ms?: number;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

interface AgentQueueMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
}

export const AgentQueueMonitorModal: React.FC<AgentQueueMonitorModalProps> = ({ isOpen, onClose, bandName }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<QueueStats>({ pending: 0, processing: 0, completed: 0, failed: 0, total: 0 });
  const [recentJobs, setRecentJobs] = useState<QueueJobItem[]>([]);
  const [workerOnline, setWorkerOnline] = useState(true);
  const [isPruning, setIsPruning] = useState(false);
  const [pruneSuccessMsg, setPruneSuccessMsg] = useState<string | null>(null);

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await apiFetch('/api/agent-queue/metrics');
      if (data && data.success) {
        setStats(data.stats || { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 });
        setRecentJobs(data.recentJobs || []);
        setWorkerOnline(data.workerOnline ?? true);
      }
    } catch (err) {
      console.warn('Error fetching agent queue metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchMetrics();
    const interval = setInterval(() => {
      fetchMetrics();
    }, 4000); // Auto refresco cada 4 segundos mientras el modal está abierto
    return () => clearInterval(interval);
  }, [isOpen]);

  const handlePruneCompleted = async () => {
    setIsPruning(true);
    setPruneSuccessMsg(null);
    try {
      const data = await apiFetch('/api/agent-queue/prune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedDays: 0, failedDays: 30 }), // Poda inmediata de completados
      });
      if (data && data.success) {
        setPruneSuccessMsg(`Poda realizada: ${data.deletedCount} tareas archivadas.`);
        fetchMetrics(true);
        setTimeout(() => setPruneSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error al podar cola:', err);
    } finally {
      setIsPruning(false);
    }
  };

  if (!isOpen) return null;

  const getAgentBadge = (type: string) => {
    switch (type) {
      case 'lector_inbox_check':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            📥 Lector Inbox
          </span>
        );
      case 'redactor_pitch_dispatch':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            📤 Redactor Dispatch
          </span>
        );
      case 'scout_enrichment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            🔍 Scout Enrichment
          </span>
        );
      case 'campaign_radar_sync':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            🛰️ Radar Sync
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700/50 text-zinc-300 border border-zinc-600">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            ✓ Completado
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/40 animate-pulse">
            ● En Proceso
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
            ⏳ En Cola
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
            ✕ Fallido
          </span>
        );
      default:
        return <span className="text-zinc-400 text-xs">{status}</span>;
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-[#12110e] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1a1916]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide">Monitor de Cola & Workers en Vivo</h2>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Worker Online
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Arquitectura distribuida de agentes de IA con persistencia en Supabase (
                  <code className="text-zinc-300 text-[10px] font-mono">agent_jobs_queue</code>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchMetrics(true)}
                disabled={refreshing}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all border border-white/5 cursor-pointer disabled:opacity-50"
                title="Refrescar métricas"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all border border-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-[#161512] to-[#0f0e0c]">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#1c1b18] border border-amber-500/20 flex flex-col">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
                  <span>En Cola</span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-2xl font-black text-amber-300 font-mono">{stats.pending}</span>
                <span className="text-[10px] text-zinc-500 mt-1">Trabajos esperando turno</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1c1b18] border border-sky-500/20 flex flex-col">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
                  <span>En Proceso</span>
                  <Activity className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                </div>
                <span className="text-2xl font-black text-sky-300 font-mono">{stats.processing}</span>
                <span className="text-[10px] text-zinc-500 mt-1">Ejecutando en worker</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1c1b18] border border-emerald-500/20 flex flex-col">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
                  <span>Completados</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-emerald-300 font-mono">{stats.completed}</span>
                <span className="text-[10px] text-zinc-500 mt-1">Procesados con éxito</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1c1b18] border border-rose-500/20 flex flex-col">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
                  <span>Con Error / Backoff</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-2xl font-black text-rose-300 font-mono">{stats.failed}</span>
                <span className="text-[10px] text-zinc-500 mt-1">Reintentos exponenciales</span>
              </div>
            </div>

            {/* Notification / Alert messages */}
            {pruneSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{pruneSuccessMsg}</span>
              </div>
            )}

            {/* Architecture Details Banner */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-300">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span>Mantenimiento & Retención Automática (Auto-Vacuum)</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Las tareas completadas se archivan automáticamente tras 7 días para preservar la máxima velocidad de lectura en
                  PostgreSQL.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePruneCompleted}
                disabled={isPruning}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isPruning ? 'Podando...' : 'Podar Completados'}</span>
              </button>
            </div>

            {/* Recent Jobs Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Historial de Trabajos en la Cola (Últimos 10 eventos)</span>
                </h3>
                <span className="text-[11px] text-zinc-500 font-mono">Sondeo worker: 3s</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Cargando telemetría de Supabase...</span>
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-xs bg-[#161512] rounded-xl border border-white/5">
                  No hay trabajos recientes en cola. El sistema está en reposo.
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#161512] overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-3.5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="p-2 rounded-lg bg-zinc-800/80 border border-white/5 shrink-0">
                            <Bot className="w-4 h-4 text-zinc-400" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getAgentBadge(job.agent_type)}
                              {getStatusBadge(job.status)}
                              <span className="font-mono text-[10px] text-zinc-500">{job.id}</span>
                            </div>
                            {job.error_message && (
                              <p className="text-[11px] text-rose-400/90 font-mono bg-rose-950/20 px-2 py-1 rounded border border-rose-900/30">
                                {job.error_message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-zinc-400 shrink-0 self-end sm:self-center font-mono">
                          {job.duration_ms !== undefined && <span className="text-zinc-300 font-semibold">{job.duration_ms}ms</span>}
                          <span className="text-zinc-500">
                            {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-white/10 bg-[#161512] flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Concurrencia atómica garantizada con Exponential Backoff</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
