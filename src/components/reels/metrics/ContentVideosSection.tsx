/**
 * Vídeos y contenidos reales publicados (YouTube/Reels).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ArrowUpRight, Eye, Video, Youtube } from "lucide-react";
import { useMetrics } from "./MetricsContext";

/**
 * Vídeos y contenidos reales publicados (YouTube/Reels).
 * @returns Sección de interfaz.
 */
export function ContentVideosSection() {
  const { colors, contentItems } = useMetrics();
  return (
    <>
      {/* 3. Vistas de Videos & Contenidos Reales (YouTube / Reels) */}
      <div className={`${colors.card} p-5 space-y-4`}>
        <div
          className={` pb-2 flex items-center justify-between ${""}`}
        >
          <div>
            <h3
              className={`text-xs font-bold font-display flex items-center gap-1.5 ${"text-[var(--acc)]"}`}
            >
              <Video className="w-3.5 h-3.5 text-[var(--ok)]" /> Monitoreo
              de views y contenidos indexados
            </h3>
            <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5">
              Vídeos y lanzamientos extraídos en vivo desde los canales
              oficiales de la banda.
            </p>
          </div>
          <div className="text-micro font-sans text-[var(--ink-2)]">
            {contentItems.length} elementos indexados
          </div>
        </div>

        {contentItems.length === 0 ? (
          <div className="py-8 text-center text-[var(--ink-2)] font-sans text-xs rounded-[var(--r-m)]">
            Pulsa <b className="text-[var(--ok)]">“Ejecutar radar ahora”</b>{" "}
            para escanear y listar los vídeos y reproducciones de tus
            canales.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {contentItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`p-3.5 rounded-[var(--r-m)] flex flex-col justify-between space-y-3 ${"bg-[var(--bg)]/60 "}`}
              >
                {item.thumbnail_url && (
                  <div className="w-full h-24 rounded-[var(--r-s)] overflow-hidden relative bg-[var(--sunken)]">
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[var(--surface)] text-micro font-sans text-[var(--ink)] flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5 text-[var(--ok)]" />{" "}
                      {item.views ? item.views.toLocaleString() : "0"}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-sans font-bold text-[var(--alert)] flex items-center gap-1">
                      <Youtube className="w-2.5 h-2.5" /> {item.platform}
                    </span>
                    {item.published_at && (
                      <span className="text-micro font-sans text-[var(--ink-2)]">
                        {item.published_at.split("T")[0]}
                      </span>
                    )}
                  </div>
                  <h4
                    className={`text-xs font-bold line-clamp-2 ${"text-[var(--ink)]"}`}
                    title={item.title}
                  >
                    {item.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 ">
                  <span className="text-sm font-bold font-sans text-[var(--ok)]">
                    {(item.views || 0).toLocaleString()}{" "}
                    <span className="text-micro text-[var(--ink-2)] font-normal">
                      views
                    </span>
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors flex items-center gap-1 text-micro font-sans"
                      title="Ver contenido"
                    >
                      <span>Ver</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
