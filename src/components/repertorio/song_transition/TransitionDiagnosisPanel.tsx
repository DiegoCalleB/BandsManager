/**
 * Panel de diagnóstico musical: pros y contras, métricas armónicas y recomendaciones de escenario.
 */
import { AlertTriangle, CheckCircle2, Music, Zap, Flame, ThumbsUp, ThumbsDown, Compass } from "lucide-react";
import { Button } from "../../ui";
import { useSongTransition } from "./SongTransitionContext";

/** Panel de diagnóstico musical: pros y contras, métricas armónicas y recomendaciones de escenario. */
export function TransitionDiagnosisPanel() {
  const { diagnosis, activeTab, setActiveTab } = useSongTransition();
  return (
    <div className="rounded-[var(--r-m)] bg-[var(--sunken)] overflow-hidden">
      {/* Tab Navigation Ribbon & Verdict Summary */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5800 bg-[var(--surface)]">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <Button
            variant={activeTab === "pros_cons" ? "neutral" : "ghost"}
            size="xs"
            type="button"
            onClick={() => setActiveTab("pros_cons")}
            className="items-center gap-1"
          >
            <span>Pros y Contras</span>
            <span className="text-micro font-sans px-1 rounded bg-[var(--surface)] text-[var(--ink-2)]">
              +{diagnosis.porQueSi.length} / -
              {diagnosis.porQueNo.length}
            </span>
          </Button>

          <Button
            variant={activeTab === "metrics" ? "neutral" : "ghost"}
            size="xs"
            type="button"
            onClick={() => setActiveTab("metrics")}
            className="items-center gap-1"
          >
            <span>Métricas Armónicas</span>
          </Button>

          <Button
            variant={activeTab === "stagecraft" ? "neutral" : "ghost"}
            size="xs"
            type="button"
            onClick={() => setActiveTab("stagecraft")}
            className="items-center gap-1"
          >
            <span>
              Stagecraft ({diagnosis.stageRecommendations.length})
            </span>
          </Button>
        </div>

        {/* Right Summary Verdict */}
        <div className="text-micro text-[var(--ink-2)] flex items-center gap-1">
          <span>
            Recomendado:{" "}
            <strong className="text-[var(--ink)] font-bold">
              {diagnosis.recommendedStyle}
            </strong>
          </span>
        </div>
      </div>

      {/* Tab Content Container */}
      <div className="p-2 max-h-32 sm:max-h-28 overflow-y-auto">
        {activeTab === "pros_cons" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* POR QUÉ SÍ */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-micro font-bold text-[var(--ok)]">
                <ThumbsUp className="w-2.5 h-2.5" />
                <span>
                  Por qué SÍ funciona ({diagnosis.porQueSi.length})
                </span>
              </div>
              <div className="space-y-1">
                {diagnosis.porQueSi.map((pro) => (
                  <div
                    key={pro.id}
                    className="p-1.5 rounded-[var(--r-s)] bg-[var(--ok-soft)] text-micro space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[var(--ink-2)] flex items-center gap-1 truncate">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[var(--ok)] shrink-0" />
                        {pro.title}
                      </span>
                      <span className="text-micro px-1 rounded font-sans bg-[var(--ok)]/20 text-[var(--ink)] shrink-0">
                        {pro.category}
                      </span>
                    </div>
                    <p className="text-[var(--ink-2)] leading-tight pl-3.5 text-micro">
                      {pro.detail}
                    </p>
                  </div>
                ))}
                {diagnosis.porQueSi.length === 0 && (
                  <div className="p-1.5 rounded-[var(--r-s)] bg-[var(--bg)]/50 text-micro text-[var(--ink-2)] text-center">
                    Sin factores musicales especialmente favorables.
                  </div>
                )}
              </div>
            </div>

            {/* POR QUÉ NO / CRÍTICA */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-micro font-bold text-[var(--alert)]">
                <ThumbsDown className="w-2.5 h-2.5" />
                <span>
                  Puntos a vigilar ({diagnosis.porQueNo.length})
                </span>
              </div>
              <div className="space-y-1">
                {diagnosis.porQueNo.map((con) => (
                  <div
                    key={con.id}
                    className={`p-1.5 rounded-[var(--r-s)] text-micro space-y-0.5 ${
                      con.severity === "critico"
                        ? "bg-[var(--alert-soft)]/40"
                        : con.severity === "aviso"
                          ? "bg-[var(--acc-soft)] "
                          : "bg-[var(--bg)]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-bold flex items-center gap-1 truncate ${
                          con.severity === "critico"
                            ? "text-[var(--ink-2)]"
                            : con.severity === "aviso"
                              ? "text-[var(--acc)]/70"
                              : "text-[var(--ink-2)]"
                        }`}
                      >
                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                        {con.title}
                      </span>
                      <span className="text-micro px-1 rounded font-sans bg-[var(--sunken)] text-[var(--ink-2)] shrink-0">
                        {con.severity}
                      </span>
                    </div>
                    <p className="text-[var(--ink-2)] leading-tight pl-3.5 text-micro">
                      {con.detail}
                    </p>
                  </div>
                ))}
                {diagnosis.porQueNo.length === 0 && (
                  <div className="p-1.5 rounded-[var(--r-s)] bg-[var(--ok)]/5 text-center text-micro text-[var(--ink-2)] flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[var(--ok)]" />
                    <span>Enlace limpio sin objeciones.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
            <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)] space-y-0.5">
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--acc)]/70">
                <Music className="w-3 h-3" />
                <span>Armonía y tono</span>
              </div>
              <p className="text-micro text-[var(--ink-2)] leading-tight">
                {diagnosis.harmonyDescription}
              </p>
            </div>

            <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)] space-y-0.5">
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--ink-2)]">
                <Zap className="w-3 h-3" />
                <span>Salto BPM</span>
              </div>
              <p className="text-micro text-[var(--ink-2)] leading-tight">
                {diagnosis.bpmDescription}
              </p>
            </div>

            <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)] space-y-0.5">
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--ink-2)]">
                <Flame className="w-3 h-3" />
                <span>Energía Escénica</span>
              </div>
              <p className="text-micro text-[var(--ink-2)] leading-tight">
                {diagnosis.energyDescription}
              </p>
            </div>
          </div>
        )}

        {activeTab === "stagecraft" && (
          <div className="space-y-1">
            {diagnosis.stageRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 bg-[var(--surface)] p-1.5 rounded-[var(--r-s)] text-micro"
              >
                <Compass className="w-3 h-3 text-[var(--acc)] shrink-0 mt-0.5" />
                <p className="text-micro leading-tight text-[var(--ink-2)]">
                  {rec}
                </p>
              </div>
            ))}
            {diagnosis.stageRecommendations.length === 0 && (
              <div className="text-micro text-[var(--ink-2)] text-center py-2">
                Sin sugerencias adicionales de escenario para este
                enlace.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
