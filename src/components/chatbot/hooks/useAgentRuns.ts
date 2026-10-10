/**
 * Estado de los agentes autónomos, su configuración y el seguimiento de la ejecución activa.
 * Extraído de Chatbot.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import type { ActiveAgentRun, AgentRunStep, ChatAutonomyConfig, RemoteAgentRun } from "../chatTypes";

/**
 * Estado de los agentes autónomos, su configuración y el seguimiento de la ejecución activa.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAgentRuns() {
  const [isAutonomyModalOpen, setIsAutonomyModalOpen] = useState(false);

  // Switch mode between Python GitHub Agents vs Direct Gemini AI
  const [agentsEnabled, setAgentsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('bakandeya_agents_enabled');
    return saved !== null ? saved === 'true' : false; // Default to false (Gemini Direct Mode)
  });

  const [autonomyConfig, setAutonomyConfig] = useState<ChatAutonomyConfig>(() => {
    try {
      const saved = localStorage.getItem('bakandeya_agent_autonomy');
      if (saved) return JSON.parse(saved) as ChatAutonomyConfig;
    } catch (e) {
      console.error(e);
    }
    return {
      dispatchLevel: 'draft_only',
      negotiationDepth: 'filter_conditions',
      minCacheThreshold: 300,
      maxCacheThreshold: 800,
      autoDeclineUnderMinCache: false,
      notifyOnEveryProposal: true,
      requireHumanForFinalSignOff: true,
    };
  });

  const [activeRun, setActiveRun] = useState<ActiveAgentRun | null>(null);

  useEffect(() => {
    localStorage.setItem('bakandeya_agents_enabled', String(agentsEnabled));
  }, [agentsEnabled]);

  useEffect(() => {
    const handleAutonomyChange = () => {
      try {
        const saved = localStorage.getItem('bakandeya_agent_autonomy');
        if (saved) setAutonomyConfig(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('autonomy-settings-changed', handleAutonomyChange);
    return () => window.removeEventListener('autonomy-settings-changed', handleAutonomyChange);
  }, []);

  useEffect(() => {
    let isMounted = true;
    api
      .getAutonomyConfig()
      .then((cfg) => {
        if (isMounted && cfg && cfg.dispatchLevel) {
          setAutonomyConfig(cfg);
          try {
            localStorage.setItem('bakandeya_agent_autonomy', JSON.stringify(cfg));
          } catch {
            // Ignorado a propósito: es un efecto secundario opcional (evento de actualización, dictado o limpieza).
          }
        }
      })
      .catch((e) => {
        console.warn('Notice fetching initial autonomy config for chat:', e);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeRun || activeRun.status === 'completed' || activeRun.status === 'error') return;

    let attempts = 0;

    const pollStatus = async () => {
      if (activeRun?.isDemo) {
        attempts += 1;
        if (attempts >= 4) {
          setActiveRun((prev) => {
            if (!prev) return null;
            setTimeout(() => {
              window.dispatchEvent(new Event('github-agent-completed'));
            }, 50);
            return {
              ...prev,
              status: 'completed',
              conclusion: 'success',
              steps: prev.steps.map((s) =>
                s.name.includes('Agent') || s.number === 5 ? { ...s, status: 'completed', conclusion: 'success' } : s
              ),
            };
          });
        }
        return;
      }

      try {
        const token = localStorage.getItem('bakandeya_token');
        const pat = localStorage.getItem('bakandeya_github_pat') || '';
        const owner = localStorage.getItem('bakandeya_github_owner') || '';
        const repo = localStorage.getItem('bakandeya_github_repo') || '';

        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          headers['x-auth-token'] = token;
        }
        if (pat) headers['x-github-pat'] = pat;
        if (owner) headers['x-github-owner'] = owner;
        if (repo) headers['x-github-repo'] = repo;

        if (!activeRun?.id) {
          // Find newly started run
          const res = await fetch('/api/agent-runs', { headers });
          if (res.ok) {
            const data = await res.json().catch(() => null);
            const recentRuns = data?.runs || [];

            const matchedRun = recentRuns.find((run: RemoteAgentRun) => {
              const runTime = new Date(run.created_at).getTime();
              const timeDiff = Math.abs(Date.now() - runTime);
              return timeDiff < 180000; // 3 minutes
            });

            if (matchedRun) {
              setActiveRun((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  id: matchedRun.id,
                  status: matchedRun.status,
                  conclusion: matchedRun.conclusion,
                };
              });
            }
          }
        } else {
          // Poll specific run status and job steps
          const runId = activeRun.id;
          const runsRes = await fetch('/api/agent-runs', { headers });
          if (runsRes.ok) {
            const runsData = await runsRes.json().catch(() => null);
            const matchingRun = (runsData?.runs || []).find((r: RemoteAgentRun) => r.id === runId);

            if (matchingRun) {
              const updatedStatus = matchingRun.status;
              const updatedConclusion = matchingRun.conclusion;

              // Fetch job steps
              const jobsRes = await fetch(`/api/agent-runs/${runId}/jobs`, { headers });
              let steps: AgentRunStep[] = [];
              if (jobsRes.ok) {
                const jobsData = await jobsRes.json().catch(() => null);
                if (jobsData?.jobs && jobsData.jobs.length > 0) {
                  steps = jobsData.jobs[0].steps || [];
                }
              }

              setActiveRun((prev) => {
                if (!prev) return null;

                if (updatedStatus === 'completed' && prev.status !== 'completed') {
                  if (updatedConclusion === 'success') {
                    setTimeout(() => {
                      window.dispatchEvent(new Event('github-agent-completed'));
                    }, 50);

                    // Delay showing success for 3s while App.tsx fetches new state
                    setTimeout(() => {
                      setActiveRun((current) => (current ? { ...current, status: 'completed', conclusion: 'success' } : null));
                    }, 3000);

                    return {
                      ...prev,
                      status: 'in_progress', // Keep it visually running
                      conclusion: null,
                      steps: [
                        ...(steps.length > 0 ? steps : prev.steps),
                        { name: 'Sincronizando con Supabase...', status: 'in_progress', conclusion: null },
                      ],
                    };
                  }
                }

                return {
                  ...prev,
                  status: updatedStatus,
                  conclusion: updatedConclusion,
                  steps: steps.length > 0 ? steps : prev.steps,
                };
              });
            }
          }
        }
      } catch {
        // Silent retry on network flicker
      }
    };

    pollStatus();
    const intervalId = setInterval(pollStatus, 6000);

    return () => clearInterval(intervalId);
  }, [activeRun?.id, activeRun?.status, activeRun?.isDemo]);

  return { agentsEnabled, autonomyConfig, setActiveRun, setIsAutonomyModalOpen, setAgentsEnabled, activeRun, isAutonomyModalOpen };
}
