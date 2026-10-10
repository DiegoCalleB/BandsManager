/**
 * Calendario de publicaciones programadas y publicadas de la banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Calendar, Clock, Trash2 } from "lucide-react";
import { IconButton } from "../ui";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Calendario de publicaciones programadas y publicadas de la banda.
 * @returns Sección de interfaz.
 */
export function PublicationsCalendar() {
  const { colors, posts, textSub, nombreBanda, onUpdatePost } = useReelsCenter();
  return (
    <>
      <div className={`${colors.card} p-5 space-y-4`}>
      <div
        className={` pb-2 flex justify-between items-center `}
      >
        <div>
          <h3
            className={`text-sm font-bold font-display flex items-center gap-1.5 text-[var(--acc)]`}
          >
            <Calendar className="w-4 h-4" /> Calendario de
            Publicaciones de la Banda ({posts.length})
          </h3>
          <p className={`text-micro font-sans mt-1 ${textSub}`}>
            Aquí puedes ver la parrilla de contenidos aprobada y
            programada de {nombreBanda}.
          </p>
        </div>
        <span
          className={`text-micro font-sans px-2 py-0.5 rounded text-[var(--ink-2)] bg-[var(--bg)]`}
        >
          Live Database
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <PublicoSilhouette opacity={0.12} size="small" />
          <p className="mt-4 font-medium text-[var(--ink)] text-xs">
            Sin publicaciones programadas
          </p>
          <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs">
            Sube un vídeo y genera un clip viral para comenzar tu
            campaña.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {[...posts].reverse().map((post) => (
            <div
              key={post.id}
              className={` rounded-[var(--r-m)] p-3 flex flex-col md:flex-row justify-between gap-3 items-stretch transition-ui bg-[var(--bg)]/50 hover:bg-[var(--sunken)]`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-micro font-sans px-2 py-0.5 rounded font-bold ${
                      post.plataforma === "Instagram"
                        ? "bg-[var(--acc)]/10 text-[var(--ink)]"
                        : post.plataforma === "TikTok"
                          ? "bg-[var(--acc)]/10 text-[var(--ink)]"
                          : "bg-[var(--surface)]/80 text-[var(--ink)]"
                    }`}
                  >
                    {post.plataforma}
                  </span>
                  <span className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--ink-2)]" />{" "}
                    {post.fecha}
                  </span>
                  <span className="text-micro font-sans px-1.5 py-0.5 rounded bg-[var(--surface)]/15 text-[var(--ok)] font-bold">
                    {post.estado}
                  </span>
                </div>
                <p
                  className={`text-xs line-clamp-3 leading-relaxed font-sans font-medium text-[var(--ink)]`}
                >
                  {post.contenido}
                </p>
              </div>

              <div
                className={`flex md:flex-col justify-end items-end gap-2 md: md: pt-2.5 md:pt-0 md:pl-4 shrink-0 `}
              >
                <span className="text-micro font-sans text-[var(--ink-2)]">
                  Responsable:{" "}
                  {post.responsable || "Community Manager"}
                </span>
                <IconButton
                  label="Eliminar del calendario"
                  variant="danger"
                  size="icon-xs"
                  id={`delete-post-${post.id}`}
                  onClick={async () => {
                    if (
                      confirm(
                        `¿Seguro que deseas eliminar esta publicación del calendario de ${nombreBanda}?`,
                      )
                    ) {
                      await onUpdatePost(post.id, {
                        estado: "borrador",
                      }); // or we can handle direct deletion or mock update
                      alert(
                        "Publicación desactivada/movida a borrador.",
                      );
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
