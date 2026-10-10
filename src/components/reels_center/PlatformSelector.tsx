/**
 * Selector de red social destino del post.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useReelsCenter } from "./ReelsCenterContext";
import { copyForPlatform } from "./reelsHelpers";

/**
 * Selector de red social destino del post.
 * @returns Sección de interfaz.
 */
export function PlatformSelector() {
  const { setSelectedPlatform, setEditedCopy, highlights, selectedHighlightIndex, selectedPlatform } = useReelsCenter();
  return (
    <>
      {/* Platform Selector */}
      <div className="space-y-1.5">
        <span className="block text-micro font-sans text-[var(--ink-2)]">
          Plataforma objetivo
        </span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "Instagram", name: "Instagram Reels" },
            { id: "TikTok", name: "TikTok Video" },
            { id: "YouTube", name: "YouTube Shorts" },
            { id: "Facebook", name: "Facebook" },
          ].map((plat) => (
            <button
              type="button"
              key={plat.id}
              onClick={() => {
                const nuevaPlataforma = plat.id as
                  | "Instagram"
                  | "TikTok"
                  | "YouTube"
                  | "Facebook";
                setSelectedPlatform(nuevaPlataforma);
                setEditedCopy(
                  copyForPlatform(
                    highlights[selectedHighlightIndex],
                    nuevaPlataforma,
                  ),
                );
              }}
              className={`py-2 px-2 rounded-[var(--r-pill)] text-micro font-sans text-center transition-ui cursor-pointer ${
                selectedPlatform === plat.id
                  ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                  : " bg-[var(--surface)] text-[var(--ink-2)]"
              }`}
            >
              {plat.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
