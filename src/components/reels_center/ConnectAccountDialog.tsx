/**
 * Diálogo para conectar una cuenta oficial de red social con su usuario (1 clic).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle2, RefreshCw, ShieldCheck, X, Zap } from "lucide-react";
import { IconButton, Input } from "../ui";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Diálogo para conectar una cuenta oficial de red social con su usuario (1 clic).
 * @returns Sección de interfaz.
 */
export function ConnectAccountDialog() {
  const { showConnectModal, setShowConnectModal, connectHandleInput, setConnectHandleInput, connectingPlatform, handleConnectSocialAccount } = useReelsCenter();
  return (
    <>
      {showConnectModal && (
      <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--sunken)] w-full max-w-md rounded-[var(--r-m)] p-6 space-y-5 text-left relative">
        <IconButton
          label="Cerrar"
          onClick={() => setShowConnectModal(false)}
          className="absolute top-4 right-4"
        >
          <X className="w-4 h-4" />
        </IconButton>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[var(--acc-ink)]">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-sm font-bold font-mono text-[var(--ink)]">
              Vincular cuenta oficial
            </h3>
          </div>
          <p className="text-xs text-[var(--ink-2)] font-sans">
            Conecta tu perfil oficial en 1 clic para publicar
            automáticamente a la hora que elijas y monitorizar las
            reproducciones sin contraseñas ni paneles raros.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-micro font-mono font-bold text-[var(--ink-2)] block">
            Nombre de usuario / Handle oficial:
          </label>
          <Input
            size="sm"
            type="text"
            value={connectHandleInput}
            onChange={(e) => setConnectHandleInput(e.target.value)}
            placeholder="@tubanda_oficial"
            className="w-full"
          />
        </div>

        <div className="space-y-2 pt-2">
          <span className="text-micro font-mono font-bold text-[var(--ink-2)] block">
            Elige la red a vincular:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: "Instagram" as const,
                name: "Instagram",
                color: "hover:text-[var(--alert)] bg-[var(--alert)]/10",
              },
              {
                id: "YouTube" as const,
                name: "YouTube",
                color: "hover:text-[var(--alert)] bg-[var(--alert)]/10",
              },
              {
                id: "TikTok" as const,
                name: "TikTok",
                color: "hover:text-[var(--on-acc)] bg-[var(--acc)]/10",
              },
            ].map((plat) => (
              <button
                key={plat.id}
                type="button"
                disabled={connectingPlatform !== null}
                onClick={() => handleConnectSocialAccount(plat.id)}
                className={`p-3 rounded-[var(--r-s)] bg-[var(--sunken)]/80 text-xs font-mono font-bold text-center transition-ui cursor-pointer flex flex-col items-center gap-1.5 ${plat.color} active:scale-[0.97] disabled:opacity-50`}
              >
                {connectingPlatform === plat.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--acc-ink)]" />
                ) : (
                  <Zap className="w-4 h-4 text-[var(--acc-ink)]" />
                )}
                <span>{plat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-[var(--sunken)]/80 rounded-[var(--r-s)] text-micro font-mono text-[var(--ink-2)] flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
          <span>
            Tus permisos se almacenan de forma cifrada y solo se usan para
            tus posts autorizados.
          </span>
        </div>
      </div>
      </div>
      )}
    </>
  );
}
