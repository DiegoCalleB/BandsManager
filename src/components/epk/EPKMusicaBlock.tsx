import React from "react";
import { Music, Share2, Trash2, Info, Star } from "lucide-react";
import {
  EPKConfig,
  Song,
  EPKVideo,
  DatosContratacion,
  User,
} from "../../types";
import { EPKBlockWrapper } from "./EPKBlockWrapper";
import { EPK_BLOCKS, EPKBlockMeta } from "./epkBlocks";

interface EPKMusicaBlockProps {
  config: EPKConfig;
  setConfig: React.Dispatch<React.SetStateAction<EPKConfig>>;
  songs: Song[];
  isPromoUser?: boolean;
  currentUser?: User | null;
  videos: EPKVideo[];
  anadirVideo: () => void;
  editarVideo: (id: string, patch: Partial<EPKVideo>) => void;
  quitarVideo: (id: string) => void;
  destacarVideo: (id: string) => void;
  editarDatoContratacion: (campo: keyof DatosContratacion, valor: any) => void;
  prevBlock?: EPKBlockMeta | null;
  nextBlock?: EPKBlockMeta | null;
  onNavigate?: (blockId: any) => void;
  onSave?: () => void;
  isAllView?: boolean;
}

export const EPKMusicaBlock: React.FC<EPKMusicaBlockProps> = ({
  config,
  setConfig,
  songs,
  isPromoUser = false,
  currentUser,
  videos,
  anadirVideo,
  editarVideo,
  quitarVideo,
  destacarVideo,
  editarDatoContratacion,
  prevBlock,
  nextBlock,
  onNavigate,
  onSave,
  isAllView = false,
}) => {
  return (
    <EPKBlockWrapper
      meta={EPK_BLOCKS[2]}
      prevBlock={prevBlock}
      nextBlock={nextBlock}
      onNavigate={onNavigate}
      onSave={onSave}
      isAllView={isAllView}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AUDIO PREVIEW ADELANTO EN LANDING DE FANS & EPK */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2">
              <Music className="w-5 h-5" /> Canción / Adelanto en Audio Preview
              (Landing de Fans & EPK)
            </h3>
            <span className="text-[10px] font-bold tracking-wider text-[var(--acc)] bg-[var(--acc)]/10 px-2.5 py-1 rounded-[var(--r-pill)]">
              Player Interactivo
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)]">
            Permite a fans y programadores escuchar un fragmento o tema
            destacado de la banda. Puedes activar el reproductor, elegir una
            canción del repertorio o pegar una URL de audio directa.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              {/* Switch de activación */}
              <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-[var(--r-m)]">
                <div className="space-y-0.5 pr-3">
                  <span className="text-xs font-bold text-[var(--ink)]">
                    Activar reproductor de adelanto
                  </span>
                  <p className="text-[10px] text-[var(--ink-2)]">
                    Si está desactivado, el widget no se mostrará en la landing
                    pública.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.audioPreview?.habilitado ?? true}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      audioPreview: {
                        ...(config.audioPreview || {}),
                        habilitado: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-[var(--acc)] rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Selector de canción del repertorio */}
              {!isPromoUser && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ink-2)] flex items-center justify-between">
                    <span>Elegir tema de vuestro repertorio</span>
                    {songs.length > 0 && (
                      <span className="text-[10px] text-[var(--acc)] font-sans">
                        {songs.length} temas disponibles
                      </span>
                    )}
                  </label>
                  <select
                    value={config.audioPreview?.cancionId || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedSong = songs.find(
                        (s) => s.id === selectedId,
                      );
                      setConfig((prev) => ({
                        ...prev,
                        audioPreview: {
                          ...(prev.audioPreview || {}),
                          cancionId: selectedId,
                          tituloTema: selectedSong
                            ? selectedSong.titulo
                            : prev.audioPreview?.tituloTema,
                          audioUrl:
                            selectedSong?.audioPrincipalUrl ||
                            prev.audioPreview?.audioUrl ||
                            "",
                        },
                      }));
                    }}
                    className="w-full bg-[var(--surface)] focus:rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none"
                  >
                    <option value="">
                      -- Seleccionar tema del repertorio o usar personalizado --
                    </option>
                    {songs.map((song, idx) => (
                      <option key={song.id || `song-${idx}`} value={song.id}>
                        {song.titulo}{" "}
                        {song.duracion ? `(${song.duracion})` : ""}{" "}
                        {song.audioPrincipalUrl ? "🎵 (Con audio subido)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Título y subtítulo visual del reproductor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--ink-2)]">
                    Título mostrado en el reproductor
                  </label>
                  <input
                    type="text"
                    value={config.audioPreview?.tituloTema ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        audioPreview: {
                          ...(config.audioPreview || {}),
                          tituloTema: e.target.value,
                        },
                      })
                    }
                    placeholder="Ej: Single Debut / Directo Preview"
                    className="w-full bg-[var(--surface)] focus:rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--ink-2)]">
                    Subtítulo / Mensaje de escucha
                  </label>
                  <input
                    type="text"
                    value={config.audioPreview?.subtitulo ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        audioPreview: {
                          ...(config.audioPreview || {}),
                          subtitulo: e.target.value,
                        },
                      })
                    }
                    placeholder="Ej: Dale al play para escuchar cómo sonamos"
                    className="w-full bg-[var(--surface)] focus:rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none"
                  />
                </div>
              </div>

              {/* URL del archivo de audio */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--ink-2)]">
                  URL del archivo de audio (MP3 / OGG / WAV)
                </label>
                <input
                  type="url"
                  value={config.audioPreview?.audioUrl ?? ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      audioPreview: {
                        ...(config.audioPreview || {}),
                        audioUrl: e.target.value,
                      },
                    })
                  }
                  placeholder="https://.../tema-adelanto.mp3"
                  className="w-full bg-[var(--surface)] focus:rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none font-sans"
                />
              </div>
            </div>

            {/* Vista previa en vivo del reproductor */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] flex flex-col justify-center space-y-3">
              <span className="text-[10px] font-sans font-bold text-[var(--ink-2)]">
                Previsualización del reproductor
              </span>
              <div
                className={`p-3 rounded-[var(--r-l)] bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface)] ${
                  config.audioPreview?.habilitado !== false
                    ? "/40"
                    : "opacity-50"
                } flex items-center justify-between gap-3 text-left`}
              >
                <div className="w-10 h-10 rounded-[var(--r-m)] bg-gradient-to-br from-[var(--acc)] to-[var(--acc)] text-[var(--ink)] flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 fill-bg-[var(--surface)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] truncate">
                    <span className="truncate">
                      {config.audioPreview?.tituloTema?.trim() ||
                        `${currentUser?.bandName || "Tu Banda"} · Directo Preview`}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--ink-2)] font-sans truncate">
                    {config.audioPreview?.subtitulo?.trim() ||
                      "Dale al play para escuchar cómo sonamos"}
                  </p>
                </div>
                <div className="flex items-center gap-1 h-5 shrink-0 px-2">
                  <span className="w-1 h-3 bg-[var(--acc)]/60 rounded-[var(--r-pill)]" />
                  <span className="w-1 h-5 bg-[var(--acc)]/60 rounded-[var(--r-pill)] animate-bounce" />
                  <span className="w-1 h-2 bg-[var(--acc)]/60 rounded-[var(--r-pill)]" />
                </div>
              </div>
              {config.audioPreview?.habilitado === false && (
                <p className="text-[11px] text-[var(--acc)]/90 font-sans text-center">
                  ⚠️ Reproductor actualmente desactivado para los fans.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* VÍDEOS DE DIRECTO */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[var(--acc)]" />
              <h3 className="text-base sm:text-lg font-bold text-[var(--acc)]">
                Vídeos de Directo ({videos.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={anadirVideo}
              className="text-xs bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold px-3 py-1.5 rounded-[var(--r-s)] transition cursor-pointer"
            >
              + Añadir vídeo
            </button>
          </div>
          <p className="text-xs text-[var(--ink-2)]">
            Pega enlaces de YouTube o Vimeo. El vídeo marcado con la estrella se
            muestra destacado: elige el mejor directo que tengáis.
          </p>
          {videos.length === 0 && (
            <div className="rounded-[var(--r-m)] bg-[var(--surface)] p-4 text-xs text-[var(--ink-2)]">
              Todavía no hay vídeos añadidos. Es el material que más convence al
              programar — añade al menos uno en directo.
            </div>
          )}
          <div className="space-y-3">
            {videos.map((v, idx) => (
              <div
                key={v.id || `video-${idx}-${v.url || ""}`}
                className={`rounded-[var(--r-m)] p-3 space-y-2 ${v.destacado ? "/60 bg-[var(--acc)]/5" : "bg-[var(--surface)]"}`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => destacarVideo(v.id)}
                    title={
                      v.destacado ? "Vídeo principal" : "Marcar como principal"
                    }
                    className={`shrink-0 w-8 h-8 rounded-[var(--r-s)] flex items-center justify-center text-sm transition cursor-pointer ${
                      v.destacado
                        ? "bg-[var(--acc)] text-[var(--ink)] font-bold"
                        : "text-[var(--ink-2)] hover:text-[var(--acc)]/70"
                    }`}
                  >
                    ★
                  </button>
                  <input
                    type="text"
                    value={v.titulo}
                    onChange={(e) =>
                      editarVideo(v.id, { titulo: e.target.value })
                    }
                    placeholder="Título (ej. Directo en Sala Caracol, 2026)"
                    className="flex-1 bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => quitarVideo(v.id)}
                    className="shrink-0 p-2 text-[var(--ink-2)] hover:text-[var(--alert)] transition cursor-pointer"
                    title="Quitar vídeo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="url"
                  value={v.url}
                  onChange={(e) => editarVideo(v.id, { url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* DATOS LOGÍSTICOS & GIRA (DATOS DE CONTRATACIÓN) */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
          <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2 pb-3">
            <Info className="w-5 h-5" /> Datos de Gira y Contratación
          </h3>
          <p className="text-xs text-[var(--ink-2)]">
            Lo que un programador siempre necesita saber antes de cerrar fecha.
            Cuanto más claro, menos correos de ida y vuelta.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--ink-2)] block mb-1">
                Nº de músicos en escena
              </label>
              <input
                type="number"
                value={config.datosContratacion?.numMusicos ?? ""}
                onChange={(e) =>
                  editarDatoContratacion("numMusicos", e.target.value)
                }
                placeholder="4"
                className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--ink-2)] block mb-1">
                Duración del directo
              </label>
              <div className="flex items-center bg-[var(--surface)] rounded-[var(--r-s)] focus-within:">
                <input
                  type="number"
                  value={config.datosContratacion?.duracionDirecto ?? ""}
                  onChange={(e) =>
                    editarDatoContratacion("duracionDirecto", e.target.value)
                  }
                  placeholder="75"
                  className="w-full bg-transparent px-3 py-2 text-sm text-[var(--ink)] outline-none"
                />
                <span className="pr-3 text-xs text-[var(--ink-2)] font-semibold">
                  min
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--ink-2)] block mb-1">
                Ciudad base
              </label>
              <input
                type="text"
                value={config.datosContratacion?.ciudadBase ?? ""}
                onChange={(e) =>
                  editarDatoContratacion("ciudadBase", e.target.value)
                }
                placeholder="Madrid"
                className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--ink-2)] block mb-1">
                Formatos disponibles
              </label>
              <input
                type="text"
                value={config.datosContratacion?.formatos ?? ""}
                onChange={(e) =>
                  editarDatoContratacion("formatos", e.target.value)
                }
                placeholder="Banda completa / Acústico"
                className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--ink-2)] block mb-1">
              Necesidades de escenario (resumen corto)
            </label>
            <input
              type="text"
              value={config.datosContratacion?.necesidadesEscenario || ""}
              onChange={(e) =>
                editarDatoContratacion("necesidadesEscenario", e.target.value)
              }
              placeholder="Escenario mínimo 5x4m, 4 tomas de corriente, PA con 8 canales"
              className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none"
            />
          </div>
          {/* PARÁMETROS OPERATIVOS PARA EL AGENTE DE BOOKING (ANTI-ALUCINACIONES) */}
          <div className="pt-4 border-t border-[var(--hair)]/80">
            <h4 className="text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)]"></span>
              Operativa Real para el Agente de IA (Anti-Alucinaciones)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Técnico de sonido propio vs sala */}
              <div className="bg-[var(--surface)]/60 border border-[var(--hair)]/80 rounded-[var(--r-m)] p-3.5 space-y-2">
                <span className="text-xs font-semibold text-[var(--ink-2)] block">
                  Técnico de sonido en directo
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      editarDatoContratacion("tieneTecnicoSonidoPropio", false)
                    }
                    className={`flex-1 py-1.5 px-2 rounded-[var(--r-m)] text-xs font-medium border transition-colors ${!config.datosContratacion?.tieneTecnicoSonidoPropio ? "bg-[var(--acc)]/20 text-[var(--acc)] border-[var(--acc)]/30" : "bg-[var(--surface)] text-[var(--ink-2)] border-[var(--hair)] hover:text-[var(--ink)]"}`}
                  >
                    De la sala / casa
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editarDatoContratacion("tieneTecnicoSonidoPropio", true)
                    }
                    className={`flex-1 py-1.5 px-2 rounded-[var(--r-m)] text-xs font-medium border transition-colors ${config.datosContratacion?.tieneTecnicoSonidoPropio ? "bg-[var(--ok)]/20 text-[var(--ok)] border-[var(--ok)]/30" : "bg-[var(--surface)] text-[var(--ink-2)] border-[var(--hair)] hover:text-[var(--ink)]"}`}
                  >
                    Propio de la banda
                  </button>
                </div>
                <p className="text-[11px] text-[var(--ink-2)]">
                  El agente no prometerá técnico propio si marcáis "De la sala".
                </p>
              </div>
              {/* Merchandising */}
              <div className="bg-[var(--surface)]/60 border border-[var(--hair)]/80 rounded-[var(--r-m)] p-3.5 space-y-2">
                <span className="text-xs font-semibold text-[var(--ink-2)] block">
                  Merchandising físico en bolos
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      editarDatoContratacion("tieneMerchandising", false)
                    }
                    className={`flex-1 py-1.5 px-2 rounded-[var(--r-m)] text-xs font-medium border transition-colors ${!config.datosContratacion?.tieneMerchandising ? "bg-[var(--acc)]/20 text-[var(--acc)] border-[var(--acc)]/30" : "bg-[var(--surface)] text-[var(--ink-2)] border-[var(--hair)] hover:text-[var(--ink)]"}`}
                  >
                    No disponemos
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editarDatoContratacion("tieneMerchandising", true)
                    }
                    className={`flex-1 py-1.5 px-2 rounded-[var(--r-m)] text-xs font-medium border transition-colors ${config.datosContratacion?.tieneMerchandising ? "bg-[var(--ok)]/20 text-[var(--ok)] border-[var(--ok)]/30" : "bg-[var(--surface)] text-[var(--ink-2)] border-[var(--hair)] hover:text-[var(--ink)]"}`}
                  >
                    Sí (tenemos stock)
                  </button>
                </div>
                {config.datosContratacion?.tieneMerchandising && (
                  <input
                    type="text"
                    value={
                      config.datosContratacion?.detallesMerchandising || ""
                    }
                    onChange={(e) =>
                      editarDatoContratacion(
                        "detallesMerchandising",
                        e.target.value,
                      )
                    }
                    placeholder="Ej: Camisetas y vinilos con TPV propio"
                    className="w-full bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-m)] px-2.5 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--ink-2)] focus:border-[var(--ink-3)] outline-none"
                  />
                )}
              </div>
              {/* Transporte y Hospedaje */}
              <div className="bg-[var(--surface)]/60 border border-[var(--hair)]/80 rounded-[var(--r-m)] p-3.5 space-y-2">
                <span className="text-xs font-semibold text-[var(--ink-2)] block">
                  Transporte & Logística
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      editarDatoContratacion(
                        "transportePropio",
                        !config.datosContratacion?.transportePropio,
                      )
                    }
                    className={`flex-1 py-1.5 px-2 rounded-[var(--r-m)] text-xs font-medium border transition-colors ${config.datosContratacion?.transportePropio ? "bg-[var(--ok)]/20 text-[var(--ok)] border-[var(--ok)]/30" : "bg-[var(--surface)] text-[var(--ink-2)] border-[var(--hair)] hover:text-[var(--ink)]"}`}
                  >
                    {config.datosContratacion?.transportePropio
                      ? "Furgoneta propia"
                      : "Sin furgoneta"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editarDatoContratacion(
                        "hospedajeRequerido",
                        !config.datosContratacion?.hospedajeRequerido,
                      )
                    }
                    className={`flex-1 py-1.5 px-2 rounded-[var(--r-m)] text-xs font-medium border transition-colors ${config.datosContratacion?.hospedajeRequerido ? "bg-[var(--ok)]/20 text-[var(--ok)] border-[var(--ok)]/30" : "bg-[var(--surface)] text-[var(--ink-2)] border-[var(--hair)] hover:text-[var(--ink)]"}`}
                  >
                    {config.datosContratacion?.hospedajeRequerido
                      ? "Pide hotel"
                      : "Hotel no obligatorio"}
                  </button>
                </div>
                <p className="text-[11px] text-[var(--ink-2)]">
                  Ayuda a calcular cachés y viabilidad de kilometraje.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EPKBlockWrapper>
  );
};
