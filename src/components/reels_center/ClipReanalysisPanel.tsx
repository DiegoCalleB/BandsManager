/**
 * Panel de reanálisis IA con nota del usuario y valoración de la versión anterior.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle2, Sparkles, Star } from "lucide-react";
import { Button, Input } from "../ui";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Panel de reanálisis IA con nota del usuario y valoración de la versión anterior.
 * @returns Sección de interfaz.
 */
export function ClipReanalysisPanel() {
  const { textTitle, handleReanalyzeClip, isReanalyzingClip, clipUserNote, setClipUserNote, setClipToneRating, clipToneRating, setClipContentRating, clipContentRating, setClipFeedbackScope, clipFeedbackScope, reanalyzeSuccessMsg, highlights, selectedHighlightIndex } = useReelsCenter();
  return (
    <>
      {/* AI Re-analyzer & User Notes Panel */}
      <div
        className={`p-3.5 rounded-[var(--r-l)] space-y-3 bg-[var(--surface)]/90 `}
      >
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-sans font-bold ${textTitle}`}
            >
              Reanalizar y refinar fragmento con IA
            </span>
          </div>
          <button
            type="button"
            onClick={handleReanalyzeClip}
            disabled={isReanalyzingClip}
            className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-2 transition-ui cursor-pointer active:scale-[0.97] ${
              isReanalyzingClip
                ? "bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed"
                : "bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${isReanalyzingClip ? "animate-spin" : ""}`}
            />
            {isReanalyzingClip
              ? "Reanalizando..."
              : "Reanalizar Corte con IA"}
          </button>
        </div>

        <div className="space-y-1">
          <label className="block text-micro font-sans text-[var(--ink-2)]">
            Notas u Observaciones del Fragmento (Opcional -
            ej:"En este tramo toca el bajo Jon","Sólo
            instrumental","Presentación de la banda")
          </label>
          <Input
            size="sm"
            type="text"
            value={clipUserNote}
            onChange={(e) => setClipUserNote(e.target.value)}
            placeholder="Ej: En este tramo del 0:15 al 0:45 sólo toca el bajo Jon y la batería, no hay violín…"
            className="w-full"
          />
        </div>

        {/* Valorar la versión anterior (como el entrenamiento de pitches en Booking CRM):
 estrellas + comentario ya existente arriba, y decidir si se recuerda para siempre
 o es solo un ajuste puntual de este corte. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            className={`p-2 rounded-[var(--r-m)] space-y-1 bg-[var(--surface)]`}
          >
            <span className="text-micro font-sans text-[var(--ink-2)] block">
              Tono (versión anterior)
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`clip-tone-${star}`}
                  type="button"
                  onClick={() =>
                    setClipToneRating(
                      clipToneRating === star ? 0 : star,
                    )
                  }
                  className={`p-0.5 rounded cursor-pointer transition-colors ${clipToneRating >= star ? "text-[var(--acc)]" : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"}`}
                  title={`Valorar el tono: ${star}/5`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <div
            className={`p-2 rounded-[var(--r-m)] space-y-1 bg-[var(--surface)]`}
          >
            <span className="text-micro font-sans text-[var(--ink-2)] block">
              Contenido (versión anterior)
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`clip-content-${star}`}
                  type="button"
                  onClick={() =>
                    setClipContentRating(
                      clipContentRating === star ? 0 : star,
                    )
                  }
                  className={`p-0.5 rounded cursor-pointer transition-colors ${clipContentRating >= star ? "text-[var(--acc)]" : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"}`}
                  title={`Valorar el contenido: ${star}/5`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-micro font-sans">
          <span className="text-[var(--ink-2)]">
            Alcance del ajuste:
          </span>
          <button
            type="button"
            onClick={() => setClipFeedbackScope("este_reel")}
            className={`px-2 py-1 rounded-[var(--r-pill)] cursor-pointer transition-ui ${
              clipFeedbackScope === "este_reel"
                ? "bg-[var(--surface)]/70 text-[var(--ink)] font-bold"
                : "bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            Solo este corte
          </button>
          <Button
            variant={clipFeedbackScope === "global" ? "selected" : "ghost"}
            size="xs"
            type="button"
            onClick={() => setClipFeedbackScope("global")}
            className="items-center gap-1"
            title="La IA recordará esta corrección también para futuros Reels de la banda"
          >
            <Sparkles className="w-3 h-3" /> Recordar para
            siempre
          </Button>
        </div>

        {reanalyzeSuccessMsg && (
          <div className="text-xs font-sans text-[var(--ok)] flex items-center gap-1.5 bg-[var(--ok)]/10 p-2 rounded-[var(--r-s)] ">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
            <span>{reanalyzeSuccessMsg}</span>
          </div>
        )}

        {highlights[selectedHighlightIndex]?.reason && (
          <div
            className={`p-2.5 rounded-[var(--r-m)] text-xs font-sans leading-relaxed bg-[var(--surface)]/80 text-[var(--ink-2)]`}
          >
            <span className="font-sans text-micro font-bold text-[var(--ink-2)] block mb-0.5">
              Diagnóstico IA del Fragmento:
            </span>
            <p>
              {highlights[selectedHighlightIndex]?.reason}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
