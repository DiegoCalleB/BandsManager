/**
 * Escritor de copy estructurado con IA a partir de una idea de reel.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Flame, Music, RefreshCw } from "lucide-react";
import { Textarea } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Escritor de copy estructurado con IA a partir de una idea de reel.
 * @returns Sección de interfaz.
 */
export function SoulWriterCard() {
  const { colors, textSub, reelIdea, setReelIdea, handleGenerateCopy, isGenerating, generatedCopy, setGeneratedCopy } = useReelsCenter();
  return (
    <>
      <div className={`${colors.card} p-5 space-y-4`}>
      <div className={` pb-3 `}>
        <h3
          className={`text-sm font-bold font-display flex items-center gap-1.5 text-[var(--acc)]`}
        >
          AI Reels Writer (Redacción
          Estructurada)
        </h3>
        <p className={`text-micro font-sans mt-1 ${textSub}`}>
          Escribe la idea general del Reels. Elige una de las dos
          vibras sonoras identitarias de la banda para generar una
          copia adaptada mediante Gemini.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-micro font-sans text-[var(--ink-2)]">
            Idea de contenido o anécdota
          </label>
          <Textarea
            id="reels-idea-input"
            rows={3}
            value={reelIdea}
            onChange={(e) => setReelIdea(e.target.value)}
            placeholder="Ej: R-violin tocando el violín a toda velocidad o elyar ensayando con el hang pan en el camerino…"
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-4 space-y-2.5">
            <span className="block text-micro font-sans text-[var(--ink-2)]">
              Seleccionar tonalidad AI
            </span>
            <button
              id="btn-reels-hype"
              onClick={() => handleGenerateCopy("hype")}
              disabled={isGenerating}
              className={`w-full py-3 font-sans font-bold text-xs rounded-[var(--r-s)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-ui disabled:opacity-50 bg-[var(--acc)] text-[var(--on-acc)]`}
            >
              <Flame className="w-4 h-4" /> Hype festivo <ShowIcon inline emoji="🎺" /><ShowIcon inline emoji="🔥" />
            </button>
            <button
              id="btn-reels-chill"
              onClick={() => handleGenerateCopy("chill")}
              disabled={isGenerating}
              className={`w-full py-3 font-sans font-bold text-xs rounded-[var(--r-s)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-ui disabled:opacity-50 bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ok)]`}
            >
              <Music className="w-4 h-4" /> Reggae Chill <ShowIcon inline emoji="🌿" /><ShowIcon inline emoji="🕊️" />
            </button>

            {isGenerating && (
              <div className="text-micro font-sans text-[var(--ink-2)] text-center flex items-center justify-center gap-1.5 mt-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Consultando a Gemini…</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-1.5">
            <span className="block text-micro font-sans text-[var(--ink-2)]">
              Publicación generada (Listo para copiar)
            </span>
            <Textarea
              id="reels-generated-output"
              rows={6}
              value={generatedCopy}
              onChange={(e) => setGeneratedCopy(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
