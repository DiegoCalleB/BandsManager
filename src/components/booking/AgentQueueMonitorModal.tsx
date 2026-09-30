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
import { ShowIcon } from '../ui/ShowIcon';

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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--acc)]/20 text-[var(--acc)] ">
            <ShowIcon inline emoji="📥" />Lector Inbox
          </span>
        );
      case 'redactor_pitch_dispatch':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--ok)]/20 text-[var(--ok)] ">
            <ShowIcon inline emoji="📤" />Redactor Dispatch
          </span>
        );
      case 'scout_enrichment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--acc)]/20 text-[var(--acc)] ">
            <ShowIcon inline emoji="🔍" />Scout Enrichment
          </span>
        );
      case 'campaign_radar_sync':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--acc)]/20 text-[var(--acc)] ">
            <ShowIcon inline emoji="🛰️" />Radar sync
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--sunken)]/50 text-[var(--ink-2)] ">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--ok)]/20 text-[var(--ok)] ">
            ✓ Completado
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--acc)]/20 text-[var(--acc)] ">
            ● En Proceso
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--acc)]/20 text-[var(--acc)] ">
            <ShowIcon inline emoji="⏳" />En Cola
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--alert)]/20 text-[var(--alert)] ">
            ✕ Fallido
          </span>
        );
      default:
        return <span className="text-[var(--ink-2)] text-xs">{status}</span>;
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/85 animate-in fade-in duration-200">
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--hair)]/10 bg-[var(--sunken)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc)]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--ink)] tracking-wide">Monitor de cola y workers en vivo</h2>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--r-pill)] text-xs font-semibold bg-[var(--ok)]/15 text-[var(--ok)] ">
                    <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)] animate-ping" />
                    Worker Online
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-2)]">
                  Arquitectura distribuida de agentes de IA con persistencia en Supabase (
                  <code className="text-[var(--ink-2)] text-micro font-mono">agent_jobs_queue</code>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchMetrics(true)}
                disabled={refreshing}
                className="p-2 rounded-[var(--r-pill)] bg-[var(--sunken)]/80 hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-ui cursor-pointer disabled:opacity-50"
                title="Refrescar métricas"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[var(--acc)]' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-[var(--r-pill)] bg-[var(--sunken)]/80 hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-ui cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--bg)]">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-col">
                <div className="flex items-center justify-between text-[var(--ink-2)] text-xs font-semibold mb-1">
                  <span>En Cola</span>
                  <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />
                </div>
                <span className="text-2xl font-black text-[var(--acc)] font-mono">{stats.pending}</span>
                <span className="text-micro text-[var(--ink-2)] mt-1">Trabajos esperando turno</span>
              </div>

              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-col">
                <div className="flex items-center justify-between text-[var(--ink-2)] text-xs font-semibold mb-1">
                  <span>En Proceso</span>
                  <Activity className="w-3.5 h-3.5 text-[var(--acc)] animate-spin" />
                </div>
                <span className="text-2xl font-black text-[var(--acc)] font-mono">{stats.processing}</span>
                <span className="text-micro text-[var(--ink-2)] mt-1">Ejecutando en worker</span>
              </div>

              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-col">
                <div className="flex items-center justify-between text-[var(--ink-2)] text-xs font-semibold mb-1">
                  <span>Completados</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)]" />
                </div>
                <span className="text-2xl font-black text-[var(--ok)] font-mono">{stats.completed}</span>
                <span className="text-micro text-[var(--ink-2)] mt-1">Procesados con éxito</span>
              </div>

              <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-col">
                <div className="flex items-center justify-between text-[var(--ink-2)] text-xs font-semibold mb-1">
                  <span>Con Error / Backoff</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--alert)]" />
                </div>
                <span className="text-2xl font-black text-[var(--alert)] font-mono">{stats.failed}</span>
                <span className="text-micro text-[var(--ink-2)] mt-1">Reintentos exponenciales</span>
              </div>
            </div>

            {/* Notification / Alert messages */}
            {pruneSuccessMsg && (
              <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok)]/10 text-[var(--ok)] text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span>{pruneSuccessMsg}</span>
              </div>
            )}

            {/* Architecture Details Banner */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--ink-2)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                  <Server className="w-4 h-4 text-[var(--acc)]" />
                  <span>Mantenimiento y Retención Automática (Auto-Vacuum)</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Las tareas completadas se archivan automáticamente tras 7 días para preservar la máxima velocidad de lectura en
                  PostgreSQL.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePruneCompleted}
                disabled={isPruning}
                className="px-3 py-2 rounded-[var(--r-pill)] bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] font-bold transition-ui text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span>{isPruning ? 'Podando...' : 'Podar Completados'}</span>
              </button>
            </div>

            {/* Recent Jobs Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[var(--ink)] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>Historial de Trabajos en la Cola (Últimos 10 eventos)</span>
                </h3>
                <span className="text-xs text-[var(--ink-2)] font-mono">Sondeo worker: 3s</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-[var(--ink-2)] text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--acc)]" />
                  <span>Cargando telemetría de Supabase…</span>
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="py-10 text-center text-[var(--ink-2)] text-xs bg-[var(--sunken)] rounded-[var(--r-m)] ">
                  No hay trabajos recientes en cola. El sistema está en reposo.
                </div>
              ) : (
                <div className="rounded-[var(--r-m)] bg-[var(--sunken)] overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-3.5 hover:bg-[var(--surface)]/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)]/80 shrink-0">
                            <Bot className="w-4 h-4 text-[var(--ink-2)]" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getAgentBadge(job.agent_type)}
                              {getStatusBadge(job.status)}
                              <span className="font-mono text-micro text-[var(--ink-2)]">{job.id}</span>
                            </div>
                            {job.error_message && (
                              <p className="text-xs text-[var(--alert)]/90 font-mono bg-[var(--alert)]/20 px-2 py-1 rounded ">
                                {job.error_message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[var(--ink-2)] shrink-0 self-end sm:self-center font-mono">
                          {job.duration_ms !== undefined && <span className="text-[var(--ink-2)] font-semibold">{job.duration_ms}ms</span>}
                          <span className="text-[var(--ink-2)]">
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
          <div className="px-6 py-3.5 border-t border-[var(--hair)]/10 bg-[var(--sunken)] flex items-center justify-between text-xs text-[var(--ink-2)]">
            <span className="flex items-center gap-1.5 text-[var(--ink-2)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--ok)]" />
              <span>Concurrencia atómica garantizada con Exponential Backoff</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-bold transition-ui cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
