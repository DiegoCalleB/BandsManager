/**
 * Indicador de que el asistente está pensando. Dice qué hace y, si tarda, que sigue en ello:
 * una respuesta puede llevar varias consultas (agenda, catálogo) y callar tanto rato parece un cuelgue.
 */
import { useEffect, useState } from "react";
import { useChat } from "./ChatContext";

/** Segundos desde que se envía el mensaje y lo que se le cuenta a la banda a partir de ahí. */
const FASES: Array<{ desde: number; texto: string }> = [
  { desde: 0, texto: "Pensando…" },
  { desde: 4, texto: "Mirando tu agenda y el catálogo de salas…" },
  { desde: 12, texto: "Sigo en ello, esta lleva un poco más…" },
  { desde: 30, texto: "Casi, casi. Si ves que no llega, vuelve a enviarlo." },
];

const faseA = (segundos: number) => [...FASES].reverse().find((f) => segundos >= f.desde)?.texto ?? FASES[0].texto;

/** Tres barras de la Onda, con puntas redondeadas, que suben y bajan. Quietas con «reducir movimiento». */
function OndaPensando() {
  return (
    <span aria-hidden className="flex h-4 items-end gap-0.5">
      {[0, 150, 300].map((retraso) => (
        <span key={retraso} className="w-1 h-full origin-bottom rounded-[var(--r-pill)] bg-[var(--acc)] animate-pulse motion-reduce:animate-none" style={{ animationDelay: `${retraso}ms` }} />
      ))}
    </span>
  );
}

export function ChatLoadingIndicator() {
  const { isLoading } = useChat();
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const inicio = Date.now();
    const temporizador = setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 1000);
    return () => {
      clearInterval(temporizador);
      setSegundos(0);
    };
  }, [isLoading]);

  if (!isLoading) return null;
  return (
    <div role="status" aria-live="polite" className="flex max-w-[80%] self-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-s)] bg-[var(--acc-soft)]">
        <OndaPensando />
      </div>
      <p className="rounded-[var(--r-m)] rounded-tl-none bg-[var(--surface)] p-3.5 text-xs font-sans text-[var(--ink-2)]">{faseA(segundos)}</p>
    </div>
  );
}
