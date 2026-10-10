/**
 * Vista de tarjetas de las bandas con selección y acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckSquare, Clock, Edit3, MapPin, MessageCircle, Music, Play, Repeat, Sparkles, Square, Trash2 } from "lucide-react";
import { instagramPerfil } from "../../utils/instagramPerfil";
import { isLeadVerificado } from "../../utils/leadReliability";
import { BandListenEmbed } from "../booking/BandListenEmbed";
import { FavoriteButton } from "../common/FavoriteButton";
import { ReliabilityBadge } from "../common/ReliabilityBadge";
import { VerifiedBadge } from "../common/VerifiedBadge";
import { ActionMenu, Button } from "../ui";
import { useBandCrm } from "./BandCrmContext";
import { formatoCompacto } from "./bandMetrics";
import { BandStatusBadge } from "./BandStatusBadge";

/**
 * Vista de tarjetas de las bandas con selección y acciones.
 * @returns Sección de interfaz.
 */
export function BandCardsGrid() {
  const { filteredBands, selectedBandIds, colors, handleToggleSelectBand, handleUpdateBandFavorite, metricas, disponibles, escuchar, setCustomPitchText, setSelectedPitchBand, setIsPitchModalOpen, handleAnalyzeTone, handleOpenEditModal, handleDeleteBand } = useBandCrm();
    return (

  /* GRID CARDS VIEW */
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {filteredBands.map((band) => {
      const isSelected = selectedBandIds.includes(band.id);
      return (
        <div
          key={band.id}
          className={`p-5 rounded-[var(--r-l)] transition-ui flex flex-col justify-between space-y-4 ${colors.card} group relative overflow-hidden ${
            isSelected
              ? "ring-2 ring-[var(--acc)]/70 bg-[var(--surface)]"
              : ""
          }`}
        >
          <div className="space-y-3">
            {/* Card Top: Band Name & Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={(e) => handleToggleSelectBand(band.id, e)}
                  className="mt-0.5 p-1 rounded hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer shrink-0"
                  title={
                    isSelected
                      ? "Deseleccionar banda"
                      : "Seleccionar banda"
                  }
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-[var(--acc)]" />
                  ) : (
                    <Square className="w-4 h-4 text-[var(--ink-2)] hover:text-[var(--ink-2)]" />
                  )}
                </button>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-base font-bold font-display text-[var(--ink)] flex items-center gap-2 group-hover:text-[var(--acc)] transition-colors truncate min-w-0">
                      {band.imagen_url ? (
                        <img
                          src={band.imagen_url}
                          alt={band.nombre_banda}
                          className="w-6 h-6 rounded-[var(--r-pill)] object-cover/50 shrink-0"
                        />
                      ) : (
                        <span className="text-sm shrink-0">
                          {band.icono || "🎸"}
                        </span>
                      )}
                      <span className="truncate">
                        {band.nombre_banda}
                      </span>
                    </h3>
                    <VerifiedBadge
                      isVerified={isLeadVerificado(band)}
                      size="sm"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-micro font-sans text-[var(--ink-2)]">
                    <span
                      className="bg-[var(--surface)]/80 px-2 py-0.5 rounded-[var(--r-s)] text-[var(--acc)] flex items-center gap-1 shrink-0 max-w-[160px]"
                      title={band.estilo_musical}
                    >
                      <Music className="w-3 h-3 text-[var(--acc)] shrink-0" />
                      <span className="truncate">
                        {band.estilo_musical}
                      </span>
                    </span>

                    <span
                      className="bg-[var(--surface)]/80 px-2 py-0.5 rounded-[var(--r-s)] text-[var(--ink-2)] flex items-center gap-1 shrink-0 max-w-[140px]"
                      title={band.localizacion}
                    >
                      <MapPin className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
                      <span className="truncate">
                        {band.localizacion}
                      </span>
                    </span>

                    <ReliabilityBadge item={band} size="sm" />
                  </div>
                </div>
              </div>

              {/* Actions Dropdown / Quick Status & Favorite */}
              <div className="shrink-0 flex items-center gap-1.5">
                <FavoriteButton
                  isFavorite={!!band.es_favorito}
                  onToggle={(newVal) =>
                    handleUpdateBandFavorite(band.id, newVal)
                  }
                  size="sm"
                />
                <BandStatusBadge status={band.estado_relacion} />
              </div>
            </div>

            {/* Contact & Audience Row */}
            <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)]/80 text-micro font-sans space-y-2">
              <div className="flex items-center justify-between text-[var(--ink-2)]">
                <span className="text-micro text-[var(--ink-2)]">
                  Contacto:
                </span>
                <span className="font-bold text-[var(--acc)]">
                  {band.contacto_nombre || "Sin especificar"}
                </span>
              </div>

              {band.email && (
                <div className="flex items-center justify-between text-[var(--ink-2)] truncate">
                  <span className="text-micro text-[var(--ink-2)]">
                    Email:
                  </span>
                  <a
                    href={`mailto:${band.email}`}
                    className="text-[var(--ink-2)] hover:underline truncate max-w-[180px]"
                  >
                    {band.email}
                  </a>
                </div>
              )}

              {band.telefono && (
                <div className="flex items-center justify-between text-[var(--ink-2)]">
                  <span className="text-micro text-[var(--ink-2)]">
                    Teléfono:
                  </span>
                  <a
                    href={`tel:${band.telefono}`}
                    className="text-[var(--ok)] hover:underline"
                  >
                    {band.telefono}
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between text-[var(--ink-2)] pt-1">
                <span className="text-micro text-[var(--ink-2)]">
                  Aforo habitual:
                </span>
                <span className="font-bold text-[var(--ink-2)]">
                  {band.aforo_promedio
                    ? `~${band.aforo_promedio} pers.`
                    : "No indicado"}
                </span>
              </div>
            </div>

            {/* Notes & Collaboration Ideas */}
            {band.notas_colaboracion && (
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/60 text-micro font-sans text-[var(--ink-2)] leading-relaxed italic">
                "{band.notas_colaboracion}"
              </div>
            )}
          </div>

          {metricas[band.id] && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-[var(--ink-2)] font-sans">
                {metricas[band.id].spotify?.seguidores != null && (
                  <span title="Seguidores en Spotify">Spotify {formatoCompacto(metricas[band.id].spotify!.seguidores!)}</span>
                )}
                {metricas[band.id].youtube?.suscriptores != null && (
                  <span title="Suscriptores en YouTube">YouTube {formatoCompacto(metricas[band.id].youtube!.suscriptores!)}</span>
                )}
                <span className="text-[var(--ink-2)]">· {metricas[band.id].periodo}</span>
              </div>
            )}

          {/* Card Footer Actions */}
          <div className="pt-3 space-y-3">
            {/* Social Links & Last Contact */}
            <div className="flex items-center justify-between text-micro font-sans text-[var(--ink-2)]">
              <div className="flex items-center gap-2">
                {instagramPerfil(band.instagram) && (
                  <a
                    href={instagramPerfil(band.instagram)!.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--acc-ink)] hover:underline flex items-center gap-1"
                    title="Escribirles por Instagram (mensaje directo) o ver su perfil"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>@{instagramPerfil(band.instagram)!.handle}</span>
                  </a>
                )}
              </div>

              <span className="flex items-center gap-1 text-[var(--ink-2)]">
                <Clock className="w-3 h-3 text-[var(--ink-2)]" />
                <span>
                  Últ. contacto: {band.ultimo_contacto || "Reciente"}
                </span>
              </span>
            </div>

            {/* Escuchar: preview de 30 s en el reproductor de la app (solo si hay preview) */}
            {disponibles[band.id] && (
            <div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => escuchar(band.id)}
                  className="gap-1.5 text-[var(--acc-ink)]"
                  title={`Escuchar a ${band.nombre_banda} (preview de 30 s)`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Escuchar</span>
                </Button>
              </div>
            )}

            {/* Canción completa en el embed de Spotify (solo enlaces verificados) */}
            <BandListenEmbed spotifyUrl={band.spotify_youtube} bandName={band.nombre_banda} />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Generate Pitch */}
              <Button
                variant="neutral"
                size="xs"
                onClick={() => {
                  setCustomPitchText("");
                  setSelectedPitchBand(band);
                  setIsPitchModalOpen(true);
                }}
                className="flex-1 items-center justify-center gap-1.5"
                title="Generar pitch de intercambio de fechas (date swap)"
              >
                <Repeat className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                <span>Pitch de fechas</span>
              </Button>

              {/* More actions menu */}
              <ActionMenu
                label={`Más acciones para ${band.nombre_banda}`}
                items={[
                  {
                    label: "Tono en redes (IA)",
                    icon: Sparkles,
                    onSelect: () => handleAnalyzeTone(band),
                  },
                  {
                    label: "Editar datos",
                    icon: Edit3,
                    onSelect: () => handleOpenEditModal(band),
                  },
                  {
                    label: "Eliminar banda",
                    icon: Trash2,
                    tone: "danger",
                    onSelect: () =>
                      handleDeleteBand(band.id, band.nombre_banda),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      );
    })}
  </div>
    );

}
