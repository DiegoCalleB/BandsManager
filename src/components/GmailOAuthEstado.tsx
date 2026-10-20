import { AlertCircle, CheckCircle2, Loader2, Mail, Unlink } from "lucide-react";
import { Button } from "./ui/Button";
import type { EstadoGmailOAuth } from "../services/tiposApi";

interface Props {
  estado: Pick<EstadoGmailOAuth, "connected" | "gmail_email" | "needs_reauth_at">;
  cargando: boolean;
  conectando: boolean;
  desconectando: boolean;
  onConectar: () => void;
  onDesconectar: () => void;
}

/** Estado de la conexión de Gmail por OAuth: comprobando, conectado, a reconectar o sin conectar. */
export function GmailOAuthEstado({ estado, cargando, conectando, desconectando, onConectar, onDesconectar }: Props) {
  return (
    cargando ? (
      <div className="flex items-center gap-2 text-xs font-sans text-[var(--ink-2)]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Comprobando conexión de Gmail…</span>
      </div>
    ) : estado.connected && estado.needs_reauth_at ? (
    <div className="p-3 rounded-[var(--r-s)] bg-[var(--alert)]/10 text-xs space-y-2.5">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--alert)]" />
        <span className="text-[var(--ink)]">
          Google ha cortado el acceso a <strong>{estado.gmail_email || "tu Gmail"}</strong>. Los agentes
          están en pausa y no leen respuestas de las salas hasta que vuelvas a conectar.
        </span>
      </div>
      <Button size="sm" onClick={onConectar} disabled={conectando}>
        {conectando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
        <span>{conectando ? "Redirigiendo a Google…" : "Reconectar con Google"}</span>
      </Button>
    </div>
  ) : estado.connected ? (
      <div
        className={`p-3 rounded-[var(--r-s)] text-xs flex items-center justify-between gap-3 ${"bg-[var(--ok)]/10 text-[var(--ink)]"}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ok)]" />
          <span className="truncate">
            Conectado como <strong>{estado.gmail_email}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={onDesconectar}
          disabled={desconectando}
          className="shrink-0 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] text-xs font-sans font-bold transition-ui cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          {desconectando ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Unlink className="w-3 h-3" />
          )}
          Desconectar
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={onConectar}
        disabled={conectando}
        className="w-full sm:w-auto px-4 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--on-acc)] font-bold text-xs font-sans transition-ui active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
      >
        {conectando ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
        <span>
          {conectando
            ? "Redirigiendo a Google…"
            : "Conectar con Google"}
        </span>
      </button>
    )
  );
}
