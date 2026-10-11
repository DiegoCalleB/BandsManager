/**
 * Editor del copy con pestañas de objetivo y copia formateada en un clic.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Bookmark, Check } from "lucide-react";
import { Button, Textarea } from "../ui";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Editor del copy con pestañas de objetivo y copia formateada en un clic.
 * @returns Sección de interfaz.
 */
export function CopyEditor() {
  const { handleSwitchCopyObjective, copyObjective, editedCopy, setEditedCopy, highlights, selectedHighlightIndex, copiedNotification, handleCopyFormattedPost } = useReelsCenter();
  return (
    <>
      {/* Copy editor with 3.0 Objective Tabs */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="block text-micro font-mono text-[var(--ink-2)]">
            Variante de copy con ADN
          </label>
          <div className="flex gap-1">
            {[
              {
                id: "viral" as const,
                label: "Viral",
                tip: "Algoritmo y debate en comentarios",
              },
              {
                id: "comunidad" as const,
                label: "Comunidad",
                tip: "Conexión y lore de la banda",
              },
              {
                id: "conversion" as const,
                label: "Conversión",
                tip: "Spotify, entradas y EPK",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  handleSwitchCopyObjective(tab.id)
                }
                title={tab.tip}
                className={`px-2 py-1 rounded text-micro font-mono font-bold transition-ui cursor-pointer ${
                  copyObjective === tab.id
                    ? "bg-[var(--ink)] text-[var(--bg)] "
                    : "bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          id="highlight-copy-editor"
          rows={4}
          value={editedCopy}
          onChange={(e) => setEditedCopy(e.target.value)}
          className="w-full"
        />

        {/* Quick action: 1-Click Formatted Copy for Instagram/TikTok */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {highlights[selectedHighlightIndex]?.hashtags
              ?.slice(0, 4)
              .map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="text-micro font-mono text-[var(--ink-2)] bg-[var(--sunken)] px-1.5 py-0.5 rounded "
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
          </div>
          <Button
            variant={copiedNotification ? "primary" : "neutral"}
            size="xs"
            type="button"
            onClick={handleCopyFormattedPost}
            className="items-center gap-1.5 shrink-0"
            title="Copia el gancho, el copy y los hashtags formateados listos para pegar en Instagram o TikTok"
          >
            {copiedNotification ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Copiado para redes!</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>1-Click copiar formato</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
