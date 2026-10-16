/**
 * Piezas del móvil de vista previa que cambian con la plataforma (ver `plataformaSkin.ts`).
 * Extraído de ReelsPhoneMockup para que ese fichero no crezca.
 */
import { Bookmark, Disc, Heart, MessageCircle, MoreHorizontal, Send, Share2, ThumbsDown, UserPlus, type LucideIcon } from "lucide-react";
import type { AccionId, SkinPlataforma } from "./plataformaSkin";

const ICONOS: Record<AccionId, LucideIcon> = {
  like: Heart,
  dislike: ThumbsDown,
  comment: MessageCircle,
  share: Share2,
  send: Send,
  save: Bookmark,
  more: MoreHorizontal
};

/** Pestañas de la cabecera: la activa va en tinta fuerte y las demás atenuadas. */
export function CabeceraPlataforma({ skin }: { skin: SkinPlataforma }) {
  return (
    <div className="flex items-center gap-2.5" data-testid="cabecera-plataforma">
      {skin.pestanas.map((p, i) => (
        <span key={p} className={`text-xs font-display font-bold ${i === skin.activa ? "text-[var(--ink)]" : "text-[var(--ink-3)]"}`}>
          {p}
        </span>
      ))}
    </div>
  );
}

/** Botón junto al usuario: "Seguir" en Instagram y Facebook, "Suscribirse" en Shorts. */
export function BotonSeguir({ etiqueta }: { etiqueta: string }) {
  return (
    <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ink)]/20 text-[var(--ink)] text-micro font-semibold flex items-center gap-0.5">
      <UserPlus className="w-2.5 h-2.5" /> {etiqueta}
    </span>
  );
}

/** Columna derecha de botones, con los que usa cada plataforma. */
export function AccionesLaterales({ skin, nombreBanda }: { skin: SkinPlataforma; nombreBanda: string }) {
  return (
    <div className="absolute right-2.5 bottom-12 z-20 flex flex-col items-center gap-3" data-testid="acciones-plataforma">
      {skin.avatarEnColumna && (
        <div className="relative mb-1">
          <div className="w-8 h-8 rounded-full p-0.5 flex items-center justify-center">
            <span className="w-full h-full rounded-full bg-[var(--sunken)] flex items-center justify-center text-micro font-bold text-[var(--ink)]">
              {nombreBanda.charAt(0)}
            </span>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--alert)] rounded-full flex items-center justify-center text-[var(--on-alert)] text-micro font-bold leading-none">
            +
          </div>
        </div>
      )}

      {skin.acciones.map((a) => {
        const Icono = ICONOS[a.id];
        return (
          <div key={a.id} data-accion={a.id} className="flex flex-col items-center gap-0.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[var(--scrim)]/40 flex items-center justify-center text-[var(--ink)]">
              <Icono className={`w-4 h-4 ${a.id === "like" ? "fill-[var(--ink)]/10" : ""}`} />
            </div>
            {a.etiqueta && <span className="w-12 text-center leading-tight tabular-nums text-[10px] font-sans text-[var(--ink)] font-bold">{a.etiqueta}</span>}
          </div>
        );
      })}

      {skin.discoAudio && (
        <div className="w-7 h-7 rounded-full bg-[var(--sunken)] flex items-center justify-center animate-spin mt-0.5" data-testid="disco-audio">
          <Disc className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
        </div>
      )}
    </div>
  );
}
