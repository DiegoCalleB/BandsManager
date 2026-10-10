/**
 * Tablero Kanban del pipeline de reels: borradores, en edición y listos.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle2 } from "lucide-react";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Tablero Kanban del pipeline de reels: borradores, en edición y listos.
 * @returns Sección de interfaz.
 */
export function KanbanBoard() {
  const { colors, textSub, posts, setSelectedPostInPhone, selectedPostInPhone, textTitle, onUpdatePost } = useReelsCenter();
  return (
    <>
      <div className={`${colors.card} p-5 space-y-4`}>
      <div className={` pb-3 `}>
        <h3
          className={`text-sm font-bold font-display text-[var(--acc)]`}
        >
          Pipeline de Reels y contenido
        </h3>
        <p className={`text-micro font-sans mt-1 ${textSub}`}>
          Visualiza los vídeos grabados por la banda en la carretera y
          arrástralos / muévelos de etapa para coordinar la
          publicación.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Borradores */}
        <div
          className={`space-y-3 rounded-[var(--r-s)] p-3 bg-[var(--sunken)]`}
        >
          <span
            className={`text-micro font-sans font-bold block pb-1.5 text-[var(--acc)]`}
          >
            Borradores (
            {posts.filter((r) => r.estado === "borrador").length})
          </span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {posts
              .filter((r) => r.estado === "borrador")
              .map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostInPhone(post)}
                  className={` rounded-[var(--r-s)] p-2.5 cursor-pointer transition-ui space-y-1.5 bg-[var(--surface)] ${
                    selectedPostInPhone?.id === post.id
                      ? ""
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span
                      className={`text-micro font-sans px-1.5 py-0.5 rounded font-bold ${
                        post.plataforma === "Instagram"
                          ? "bg-[var(--acc)]/10 text-[var(--ink)]"
                          : post.plataforma === "TikTok"
                            ? "bg-[var(--acc)]/10 text-[var(--ink)]"
                            : "bg-[var(--surface)]/80 text-[var(--ink)]"
                      }`}
                    >
                      {post.plataforma}
                    </span>
                    <span className="text-micro font-sans text-[var(--ink-2)]">
                      {post.responsable}
                    </span>
                  </div>
                  <p
                    className={`text-xs font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}
                  >
                    {post.contenido}
                  </p>
                  <div
                    className={`flex justify-between items-center pt-1 `}
                  >
                    <span className="text-micro font-sans text-[var(--ink-2)]">
                      {post.fecha}
                    </span>
                    <button
                      id={`btn-move-aprobado-${post.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdatePost(post.id, { estado: "aprobado" });
                      }}
                      className={`text-micro font-sans hover:underline cursor-pointer bg-transparent -none p-0 text-[var(--acc)]`}
                    >
                      Aprobar →
                    </button>
                  </div>
                </div>
              ))}
            {posts.filter((r) => r.estado === "borrador").length ===
              0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <PublicoSilhouette opacity={0.1} size="small" />
                <p className="text-xs text-[var(--ink-2)]">
                  Nada en borrador. Graba algo en el próximo ensayo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* En Edición / Aprobados */}
        <div
          className={`space-y-3 rounded-[var(--r-s)] p-3 bg-[var(--sunken)]`}
        >
          <span
            className={`text-micro font-sans font-bold block pb-1.5 text-[var(--acc)]`}
          >
            En Edición / Aprobados (
            {posts.filter((r) => r.estado === "aprobado").length})
          </span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {posts
              .filter((r) => r.estado === "aprobado")
              .map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostInPhone(post)}
                  className={` rounded-[var(--r-s)] p-2.5 cursor-pointer transition-ui space-y-1.5 bg-[var(--surface)] ${
                    selectedPostInPhone?.id === post.id
                      ? ""
                      : "bg-[var(--surface)] hover:bg-[var(--acc-soft)]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span
                      className={`text-micro font-sans px-1.5 py-0.5 rounded font-bold ${
                        post.plataforma === "Instagram"
                          ? "bg-[var(--acc)]/10 text-[var(--ink)]"
                          : post.plataforma === "TikTok"
                            ? "bg-[var(--acc)]/10 text-[var(--ink)]"
                            : "bg-[var(--surface)]/80 text-[var(--ink)]"
                      }`}
                    >
                      {post.plataforma}
                    </span>
                    <span className="text-micro font-sans text-[var(--ink-2)]">
                      {post.responsable}
                    </span>
                  </div>
                  <p
                    className={`text-xs font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}
                  >
                    {post.contenido}
                  </p>
                  <div
                    className={`flex justify-between items-center pt-1 `}
                  >
                    <button
                      id={`btn-move-borrador-${post.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdatePost(post.id, { estado: "borrador" });
                      }}
                      className="text-micro font-sans text-[var(--ink-2)] hover:underline cursor-pointer bg-transparent -none p-0"
                    >
                      ← Borrador
                    </button>
                    <button
                      id={`btn-move-publicado-${post.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdatePost(post.id, {
                          estado: "publicado",
                        });
                      }}
                      className="text-micro font-sans text-[var(--ok)] hover:underline cursor-pointer font-bold bg-transparent -none p-0"
                    >
                      Publicar →
                    </button>
                  </div>
                </div>
              ))}
            {posts.filter((r) => r.estado === "aprobado").length ===
              0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <PublicoSilhouette opacity={0.1} size="small" />
                <p className="text-xs text-[var(--ink-2)]">
                  Nada en edición todavía.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Listos / Publicados */}
        <div
          className={`space-y-3 rounded-[var(--r-s)] p-3 bg-[var(--sunken)]`}
        >
          <span
            className={`text-micro font-sans text-[var(--ok)] font-bold block pb-1.5 `}
          >
            Listos / Publicados (
            {posts.filter((r) => r.estado === "publicado").length})
          </span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {posts
              .filter((r) => r.estado === "publicado")
              .map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostInPhone(post)}
                  className={` rounded-[var(--r-s)] p-2.5 cursor-pointer transition-ui space-y-1.5 bg-[var(--surface)] ${
                    selectedPostInPhone?.id === post.id
                      ? ""
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span
                      className={`text-micro font-sans px-1.5 py-0.5 rounded font-bold ${
                        post.plataforma === "Instagram"
                          ? "bg-[var(--acc)]/10 text-[var(--ink)]"
                          : post.plataforma === "TikTok"
                            ? "bg-[var(--acc)]/10 text-[var(--ink)]"
                            : "bg-[var(--surface)]/80 text-[var(--ink)]"
                      }`}
                    >
                      {post.plataforma}
                    </span>
                    <span className="text-micro font-sans text-[var(--ink-2)]">
                      {post.responsable}
                    </span>
                  </div>
                  <p
                    className={`text-xs font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}
                  >
                    {post.contenido}
                  </p>
                  <div
                    className={`flex justify-between items-center pt-1 `}
                  >
                    <button
                      id={`btn-move-aprobado-back-${post.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdatePost(post.id, { estado: "aprobado" });
                      }}
                      className="text-micro font-sans text-[var(--ink-2)] hover:underline cursor-pointer bg-transparent -none p-0"
                    >
                      ← Re-editar
                    </button>
                    <span className="text-micro font-sans text-[var(--ok)] flex items-center gap-0.5 font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5" />{" "}
                      Publicado
                    </span>
                  </div>
                </div>
              ))}
            {posts.filter((r) => r.estado === "publicado").length ===
              0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <PublicoSilhouette opacity={0.1} size="small" />
                <p className="text-xs text-[var(--ink-2)]">
                  Aún no has publicado ninguno.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
