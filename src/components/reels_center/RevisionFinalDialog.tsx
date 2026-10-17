/**
 * Última revisión antes de programar un Reel: todo lo que va a salir en una sola pantalla y un
 * único botón de aprobar. La persona sigue siendo quien da el visto bueno (human-in-the-loop).
 */
import { AlertCircle, Check } from "lucide-react";
import { Button } from "../ui";
import ModalPortal from "../common/ModalPortal";
import type { EntradaRevision, RevisionFinal } from "./revisionFinal";

interface Props {
  entrada: EntradaRevision;
  revision: RevisionFinal;
  guardando?: boolean;
  onAprobar: () => void;
  onVolver: () => void;
}

const esVideoReproducible = (url?: string) => Boolean(url) && /\.mp4(\?|$)/i.test(url!);

const cuando = (fecha: string, hora: string): string => {
  const d = new Date(`${fecha}T12:00:00`);
  const dia = Number.isNaN(d.getTime()) ? fecha : d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return `${dia} a las ${hora}`;
};

export function RevisionFinalDialog({ entrada, revision, guardando, onAprobar, onVolver }: Props) {
  const { bloqueos, avisos, puedeAprobar, saldraSolo } = revision;
  return (
    <ModalPortal onClose={onVolver}>
      <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4 animate-fade-in">
        <div role="dialog" aria-modal="true" aria-label="Última revisión" className="bg-[var(--surface)] w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[var(--r-xl)] p-5 sm:p-6 space-y-5 text-left">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-display text-[var(--ink)]">Última revisión</h3>
            <p className="text-xs text-[var(--ink-2)]">Mira cómo va a salir. Si te encaja, apruébalo y queda programado.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-4">
            {esVideoReproducible(entrada.videoUrl) ? (
              <video src={entrada.videoUrl} controls muted playsInline className="w-36 aspect-[9/16] rounded-[var(--r-m)] bg-[var(--sunken)] object-cover mx-auto sm:mx-0" />
            ) : (
              <div className="w-36 aspect-[9/16] rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-center text-center text-micro text-[var(--ink-3)] p-3 mx-auto sm:mx-0">
                Aún sin clip renderizado
              </div>
            )}
            <div className="space-y-3 min-w-0">
              <div className="space-y-1">
                <p className="text-micro text-[var(--ink-3)]">Sale en {entrada.plataforma}</p>
                <p className="text-sm font-semibold text-[var(--ink)] first-letter:uppercase">{cuando(entrada.fecha, entrada.hora)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-micro text-[var(--ink-3)]">Texto</p>
                <p className="text-sm text-[var(--ink)] whitespace-pre-wrap break-words rounded-[var(--r-m)] bg-[var(--sunken)] p-3">{entrada.copy}</p>
              </div>
            </div>
          </div>

          <div role="status" className="rounded-[var(--r-m)] bg-[var(--sunken)] p-3 text-xs space-y-1.5">
            {bloqueos.map((b) => (
              <p key={b} className="flex items-start gap-1.5 text-[var(--alert)]"><AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />{b}</p>
            ))}
            {avisos.map((a) => (
              <p key={a} className="flex items-start gap-1.5 text-[var(--ink)]"><AlertCircle className="w-3.5 h-3.5 mt-px shrink-0 text-[var(--acc-ink)]" />{a}</p>
            ))}
            {puedeAprobar && (
              <p className="flex items-start gap-1.5 text-[var(--ink)] font-semibold">
                <Check className="w-3.5 h-3.5 mt-px shrink-0 text-[var(--acc-ink)]" />
                {saldraSolo
                  ? "Todo en orden: saldrá solo a esa hora."
                  : entrada.autoPublish
                    ? "Quedará en tu calendario. Para que salga solo, arregla lo de arriba."
                    : "Quedará en tu calendario para que lo subas tú."}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="ghost" onClick={onVolver} disabled={guardando}>Volver a editar</Button>
            <Button variant="primary" onClick={onAprobar} disabled={!puedeAprobar || guardando}>
              {guardando ? "Programando…" : "Aprobar y programar"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
