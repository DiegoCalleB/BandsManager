import React, { useState } from "react";
import {
  Heart,
  Flame,
  Sparkles,
  MessageCircle,
  Send,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  Music,
  Instagram,
  Award,
  ExternalLink,
  Check,
  Share2,
  Mail,
  Filter,
  Search,
  ShieldCheck,
  UserCheck,
  Megaphone,
  Pin,
  Star,
} from "lucide-react";
import { Fan, Concert, ThemeColors } from "../../types";
import { ShowIcon } from '../ui/ShowIcon';
import { Button, IconButton, Input, Select, Textarea } from '../ui';

interface BandAnnouncement {
  id: string;
  fecha: string;
  autor: string;
  titulo: string;
  contenido: string;
  fijado?: boolean;
  reacciones: {
    likes: number;
    fire: number;
    applause: number;
    guitars: number;
  };
}

interface FansCommunityViewProps {
  fans: Fan[];
  concerts: Concert[];
  effectiveBandName: string;
  effectiveBandLogo?: string;
  colors?: ThemeColors;
  onUpdateFan?: (fanId: string, updates: Partial<Fan>) => void;
  onDeleteFan?: (fanId: string) => void;
  onOpenAddModal: () => void;
  selectedCityFilter: string;
}

export const FansCommunityView: React.FC<FansCommunityViewProps> = ({
  fans = [],
  concerts = [],
  effectiveBandName,
  effectiveBandLogo,
  colors,
  onUpdateFan,
  onDeleteFan,
  onOpenAddModal,
  selectedCityFilter,
}) => {
  // Local announcements from the band
  const [announcements, setAnnouncements] = useState<BandAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem(
        `bakandeya_community_announcements_${effectiveBandName}`,
      );
      if (saved) return JSON.parse(saved);
    } catch {}
    // Sin comunicados propios el muro arranca vacío. Antes se sembraba un comunicado de
    // bienvenida firmado por la banda (con 24 likes y 18 fuegos inventados) que nadie había
    // publicado: la banda veía como suyo un texto y unas reacciones que no existían.
    return [];
  });

  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  // Local reaction states for instant reactive feedback
  const [userReactions, setUserReactions] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [fanReactionCounts, setFanReactionCounts] = useState<
    Record<
      string,
      { likes: number; fire: number; applause: number; guitars: number }
    >
  >(() => {
    const initial: Record<
      string,
      { likes: number; fire: number; applause: number; guitars: number }
    > = {};
    fans.forEach((f) => {
      initial[f.id] = {
        likes: f.reacciones?.likes ?? 0,
        fire: f.reacciones?.fire ?? 0,
        applause: f.reacciones?.applause ?? 0,
        guitars: f.reacciones?.guitars ?? 0,
      };
    });
    return initial;
  });

  const handleReactFan = (
    fanId: string,
    type: "likes" | "fire" | "applause" | "guitars",
  ) => {
    const isAlreadyReacted = userReactions[fanId]?.[type];

    setUserReactions((prev) => ({
      ...prev,
      [fanId]: {
        ...(prev[fanId] || {}),
        [type]: !isAlreadyReacted,
      },
    }));

    setFanReactionCounts((prev) => {
      const current = prev[fanId] || {
        likes: 0,
        fire: 0,
        applause: 0,
        guitars: 0,
      };
      const delta = isAlreadyReacted ? -1 : 1;
      const updated = {
        ...current,
        [type]: Math.max(0, (current[type] || 0) + delta),
      };

      if (onUpdateFan) {
        onUpdateFan(fanId, { reacciones: updated });
      }

      return {
        ...prev,
        [fanId]: updated,
      };
    });
  };

  const handleReactAnnouncement = (
    annId: string,
    type: "likes" | "fire" | "applause" | "guitars",
  ) => {
    setAnnouncements((prev) => {
      const updated = prev.map((a) => {
        if (a.id === annId) {
          return {
            ...a,
            reacciones: {
              ...a.reacciones,
              [type]: (a.reacciones[type] || 0) + 1,
            },
          };
        }
        return a;
      });
      try {
        localStorage.setItem(
          `bakandeya_community_announcements_${effectiveBandName}`,
          JSON.stringify(updated),
        );
      } catch {}
      return updated;
    });
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newAnn: BandAnnouncement = {
      id: `ann-${Date.now()}`,
      fecha: new Date().toISOString().split("T")[0],
      autor: effectiveBandName,
      titulo: newPostTitle.trim() || "Comunicado Oficial",
      contenido: newPostContent.trim(),
      fijado: false,
      reacciones: { likes: 1, fire: 1, applause: 0, guitars: 0 },
    };

    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    try {
      localStorage.setItem(
        `bakandeya_community_announcements_${effectiveBandName}`,
        JSON.stringify(updated),
      );
    } catch {}

    setNewPostTitle("");
    setNewPostContent("");
    setShowNewPostModal(false);
  };

  const getFanLevelBadge = (fan: Fan) => {
    const level =
      fan.nivelFan ||
      (fan.conciertoOrigenId ||
      fan.comoConocio?.toLowerCase().includes("concierto")
        ? "superfan"
        : "fiel");
    switch (level) {
      case "fundador":
        return {
          label: "Fan Fundador",
          icon: Star,
          bg: "bg-[var(--acc)]/15 text-[var(--acc-ink)] ",
          dot: "bg-[var(--acc)]",
        };
      case "superfan":
        return {
          label: "Superfan Directos",
          icon: Flame,
          bg: "bg-[var(--alert)]/15 text-[var(--ink)]",
          dot: "bg-[var(--alert)]",
        };
      case "backstage":
        return {
          label: "Backstage VIP",
          icon: Award,
          bg: "bg-[var(--tentative)]/15 text-[var(--tentative)]",
          dot: "bg-[var(--acc)]",
        };
      default:
        return {
          label: "Oyente Fiel",
          icon: Music,
          bg: "bg-[var(--ok)]/15 text-[var(--ink)]",
          dot: "bg-[var(--ok)]",
        };
    }
  };

  const getRandomGradient = (name: string) => {
    const gradients = [
      "bg-[var(--acc)]/35",
      "bg-[var(--ok)]/35",
      "bg-[var(--tentative)]/35",
      "bg-[var(--acc-soft)]",
      "bg-[var(--sunken)]",
      "bg-[var(--ok-soft)]",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="space-y-6">
      {/* Pinned / Band Post Box */}
      <div className="bg-[var(--acc)]/10  rounded-[var(--r-l)] p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {effectiveBandLogo ? (
              <img
                src={effectiveBandLogo}
                alt="Logo"
                className="w-12 h-12 object-contain rounded-[var(--r-m)] p-1 bg-[var(--surface)] shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)] flex items-center justify-center font-bold font-display text-lg shrink-0">
                {effectiveBandName[0] || "B"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans font-bold text-[var(--acc)]">
                  Muro oficial de la banda
                </span>
                <span className="px-1.5 py-0.5 rounded text-micro font-sans font-bold bg-[var(--acc)]/20 text-[var(--acc-ink)] flex items-center gap-1">
                  <Megaphone className="w-2.5 h-2.5" /> Oficial
                </span>
              </div>
              <h3 className="text-[var(--ink)] font-bold text-base font-display">
                Comunidad y red social de {effectiveBandName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewPostModal(true)}
              className="items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Publicar Comunicado
            </Button>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)] text-xs font-sans font-bold rounded-[var(--r-pill)] transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Fan
            </button>
          </div>
        </div>
      </div>

      {/* Band Announcements Feed */}
      {announcements.length === 0 && (
        <div className="bg-[var(--surface)]/60 rounded-[var(--r-l)] p-6 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-[var(--r-pill)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink-2)]">
            <Megaphone className="w-5 h-5" />
          </div>
          <h4 className="text-[var(--ink)] font-bold text-sm">
            Todavía no has publicado ningún comunicado
          </h4>
          <p className="text-[var(--ink-2)] text-xs font-sans max-w-sm mx-auto">
            Usa «Publicar Comunicado» para contarle a tu comunidad las próximas
            fechas, lanzamientos o sorteos.
          </p>
        </div>
      )}

      {announcements.map((ann) => (
        <div
          key={ann.id}
          className="bg-[var(--surface)]/90 rounded-[var(--r-l)] p-5 space-y-3.5 relative group transition hover:"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-pill)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--acc-ink)] font-bold">
                <Pin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--ink)] text-sm">
                    {ann.autor}
                  </span>
                  <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--acc-ink)] font-sans font-bold">
                    Noticia banda
                  </span>
                </div>
                <span className="text-xs text-[var(--ink-2)] font-sans">
                  {ann.fecha}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pl-1">
            <h4 className="text-[var(--ink)] font-bold text-sm">
              {ann.titulo}
            </h4>
            <p className="text-[var(--ink-2)] text-xs font-sans leading-relaxed whitespace-pre-line">
              {ann.contenido}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 ">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReactAnnouncement(ann.id, "likes")}
                className="px-2.5 py-1 bg-[var(--surface)] hover:bg-[var(--surface)] rounded-[var(--r-pill)] text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 transition active:scale-[0.97]"
              >
                <span><ShowIcon inline emoji="❤️" /></span>
                <span className="font-bold text-[var(--ink-2)]">
                  {ann.reacciones.likes}
                </span>
              </button>
              <button
                onClick={() => handleReactAnnouncement(ann.id, "fire")}
                className="px-2.5 py-1 bg-[var(--surface)] hover:bg-[var(--surface)] rounded-[var(--r-pill)] text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 transition active:scale-[0.97]"
              >
                <span><ShowIcon inline emoji="🔥" /></span>
                <span className="font-bold text-[var(--ink-2)]">
                  {ann.reacciones.fire}
                </span>
              </button>
              <button
                onClick={() => handleReactAnnouncement(ann.id, "guitars")}
                className="px-2.5 py-1 bg-[var(--surface)] hover:bg-[var(--surface)] rounded-[var(--r-pill)] text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 transition active:scale-[0.97]"
              >
                <span><ShowIcon inline emoji="🎸" /></span>
                <span className="font-bold text-[var(--ink-2)]">
                  {ann.reacciones.guitars}
                </span>
              </button>
              <button
                onClick={() => handleReactAnnouncement(ann.id, "applause")}
                className="px-2.5 py-1 bg-[var(--surface)] hover:bg-[var(--surface)] rounded-[var(--r-pill)] text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 transition active:scale-[0.97]"
              >
                <span><ShowIcon inline emoji="👏" /></span>
                <span className="font-bold text-[var(--ink-2)]">
                  {ann.reacciones.applause}
                </span>
              </button>
            </div>
            <span className="text-micro text-[var(--ink-2)] font-sans">
              Fijado en cabecera
            </span>
          </div>
        </div>
      ))}

      {/* Fan Posts / Shouts Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-2">
          <h4 className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-[var(--acc)]" />
            Muro de Fans y Mensajes de la Comunidad ({fans.length})
          </h4>
          <span className="text-xs text-[var(--ink-2)] font-sans">
            {selectedCityFilter
              ? `Filtrando por: ${selectedCityFilter}`
              : "Mostrando todos"}
          </span>
        </div>

        {fans.length === 0 ? (
          <div className="p-12 text-center bg-[var(--surface)] rounded-[var(--r-l)] space-y-3">
            <div className="w-12 h-12 mx-auto rounded-[var(--r-pill)] bg-[var(--sunken)] flex items-center justify-center text-[var(--ink-2)]">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h4 className="text-[var(--ink)] font-bold text-sm">
              Aún no hay fans en el muro
            </h4>
            <p className="text-[var(--ink-2)] text-xs font-sans max-w-sm mx-auto">
              Comparte el código QR o el enlace público de captura en tus
              conciertos y redes para que tus seguidores se unan a la comunidad.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddModal}
            >
              Registrar primer fan
            </Button>
          </div>
        ) : (
          fans.map((fan) => {
            const badge = getFanLevelBadge(fan);
            const BadgeIcon = badge.icon;
            const fanReactions = fanReactionCounts[fan.id] || {
              likes: 0,
              fire: 0,
              applause: 0,
              guitars: 0,
            };
            const fanUserReactions = userReactions[fan.id] || {};
            const initialLetter = fan.nombre?.charAt(0)?.toUpperCase() || "F";
            const gradient = getRandomGradient(fan.nombre || "fan");

            // El muro solo puede enseñar lo que el fan escribió de verdad en el formulario. Antes,
            // si dejaba el mensaje en blanco, se pintaba entre comillas una frase inventada
            // ("¡Directo brutal en...!") como si fuera suya: la banda leía testimonios que nadie
            // había escrito. Si no hay mensaje, se dice claramente que no lo dejó.
            const mensajeFan =
              typeof fan.mensaje === "string" ? fan.mensaje.trim() : "";

            return (
              <div
                key={fan.id}
                className="bg-[var(--surface)] hover:rounded-[var(--r-l)] p-5 space-y-3.5 transition-ui group"
              >
                {/* Header with Avatar & Details */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-[var(--r-l)] ${gradient} flex items-center justify-center text-[var(--ink)] font-bold font-display text-base shrink-0`}
                    >
                      {initialLetter}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[var(--ink)] text-sm truncate">
                          {fan.nombre}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] font-bold ${badge.bg}`}
                        >
                          <BadgeIcon className="w-2.5 h-2.5" />
                          <span>{badge.label}</span>
                        </span>
                        {fan.consentimientoRGPD && (
                          <span
                            className="text-micro text-[var(--ok)]/80 font-sans flex items-center gap-0.5"
                            title="Consentimiento RGPD Verificado"
                          >
                            <ShieldCheck className="w-3 h-3 text-[var(--ok)]" />
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ink-2)] font-sans mt-0.5">
                        {fan.ciudad && (
                          <span className="flex items-center gap-1 text-[var(--ink-2)]">
                            <MapPin className="w-3 h-3 text-[var(--acc)]" />
                            {fan.ciudad}
                          </span>
                        )}
                        {fan.instagram && (
                          <a
                            href={`https://instagram.com/${fan.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[var(--acc)] hover:text-[var(--acc)]/70 transition"
                          >
                            <Instagram className="w-3 h-3" />@{fan.instagram}
                          </a>
                        )}
                        <span className="flex items-center gap-1 text-[var(--ink-2)] text-xs">
                          <Calendar className="w-3 h-3" />
                          {fan.fechaCaptura}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Quick buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`mailto:${fan.email}?subject=¡Un abrazo de ${encodeURIComponent(effectiveBandName)}!`}
                      className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--sunken)] hover:bg-[var(--surface)] rounded-[var(--r-s)] transition"
                      title="Enviar Email de agradecimiento"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                    {onDeleteFan && (
                      <IconButton
                        label="Eliminar Fan"
                        variant="danger"
                        onClick={() => {
                          if (
                            confirm(`¿Eliminar a ${fan.nombre} del Fan Club?`)
                          ) {
                            onDeleteFan(fan.id);
                          }
                        }}
                        className="opacity-60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconButton>
                    )}
                  </div>
                </div>

                {/* Favorite Song Badge */}
                {fan.cancionFavorita && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--acc)]/10 rounded-[var(--r-m)] text-xs font-sans text-[var(--acc-ink)]">
                    <Music className="w-3.5 h-3.5 text-[var(--acc)]" />
                    <span>
                      Tema favorito:{" "}
                      <strong className="text-[var(--ink)]">
                        {fan.cancionFavorita}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Fan Post / Message / Shout */}
                <div className="bg-[var(--surface)]/70 rounded-[var(--r-m)] p-3.5">
                  {mensajeFan ? (
                    <p className="text-[var(--ink-2)] text-xs font-sans leading-relaxed">
                      "{mensajeFan}"
                    </p>
                  ) : (
                    <p className="text-[var(--ink-2)] text-xs font-sans italic leading-relaxed">
                      Sin mensaje: este fan no escribió nada al registrarse.
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 text-micro text-[var(--ink-2)] font-sans">
                    <span>
                      Origen:{" "}
                      {fan.conciertoOrigenNombre
                        ? `Concierto ${fan.conciertoOrigenNombre}`
                        : fan.comoConocio || "Fan Club Web"}
                    </span>
                    <span>ID: {fan.id.slice(-6)}</span>
                  </div>
                </div>

                {/* Social Reactions Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleReactFan(fan.id, "likes")}
                      className={`px-2.5 py-1 rounded-[var(--r-pill)] text-xs font-sans flex items-center gap-1.5 transition-ui active:scale-[0.97] cursor-pointer ${
                        fanUserReactions.likes
                          ? "bg-[var(--alert)]/20 text-[var(--ink)] font-bold"
                          : "bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)]"
                      }`}
                      title="Me gusta"
                    >
                      <span><ShowIcon inline emoji="❤️" /></span>
                      <span>{fanReactions.likes}</span>
                    </button>

                    <Button
                      variant={fanUserReactions.fire ? "soft" : "neutral"}
                      size="xs"
                      type="button"
                      onClick={() => handleReactFan(fan.id, "fire")}
                      className="items-center gap-1.5"
                      title="Fuego / Brutal"
                    >
                      <span><ShowIcon inline emoji="🔥" /></span>
                      <span>{fanReactions.fire}</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleReactFan(fan.id, "guitars")}
                      className={`px-2.5 py-1 rounded-[var(--r-pill)] text-xs font-sans flex items-center gap-1.5 transition-ui active:scale-[0.97] cursor-pointer ${
                        fanUserReactions.guitars
                          ? "bg-[var(--tentative)]/20 text-[var(--tentative)] font-bold"
                          : "bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)]"
                      }`}
                      title="Púa de oro / rock On"
                    >
                      <span><ShowIcon inline emoji="🎸" /></span>
                      <span>{fanReactions.guitars}</span>
                    </button>

                    <Button
                      variant={fanUserReactions.applause ? "soft" : "neutral"}
                      size="xs"
                      type="button"
                      onClick={() => handleReactFan(fan.id, "applause")}
                      className="items-center gap-1.5"
                      title="Aplausos"
                    >
                      <span><ShowIcon inline emoji="👏" /></span>
                      <span>{fanReactions.applause}</span>
                    </Button>
                  </div>

                  {/* Level Switcher */}
                  <div className="flex items-center gap-1 text-xs font-sans text-[var(--ink-2)]">
                    <span className="hidden sm:inline">Nivel:</span>
                    <Select
                      size="sm"
                      value={
                        fan.nivelFan ||
                        (fan.conciertoOrigenId ? "superfan" : "fiel")
                      }
                      onChange={(e) => {
                        if (onUpdateFan) {
                          onUpdateFan(fan.id, {
                            nivelFan: e.target.value as any,
                          });
                        }
                      }}
                    >
                      <option value="fiel">Oyente Fiel</option>
                      <option value="superfan">Superfan</option>
                      <option value="fundador">Fundador</option>
                      <option value="backstage">Backstage VIP</option>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Announcement Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-[var(--surface)]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-base font-bold text-[var(--ink)] font-display flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[var(--acc)]" />
                Publicar comunicado en el muro social
              </h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                  Título o Titular *
                </label>
                <Input
                  size="sm"
                  type="text"
                  required
                  placeholder="Ej: ¡Nuevo single este viernes! / Concierto en Sevilla"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                  Mensaje para la comunidad de fans *
                </label>
                <Textarea
                  rows={4}
                  required
                  placeholder="Escribe las novedades, agradecimiento o anuncio exclusivo para tus seguidores…"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  variant="neutral"
                  size="sm"
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Publicar en el muro
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
