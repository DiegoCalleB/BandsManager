/**
 * Subida automática desatendida y cuenta social vinculada.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShieldCheck, Zap } from "lucide-react";
import { LinkButton } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Subida automática desatendida y cuenta social vinculada.
 * @returns Sección de interfaz.
 */
export function AutoPublishPanel() {
  const { autoPublishEnabled, selectedPlatform, setAutoPublishEnabled, socialAccounts, setShowConnectModal, setConnectHandleInput, instagramHandle, bandName } = useReelsCenter();
  return (
    <>
      {/* ⚡ Subida Automática Desatendida & Conexión de Cuenta */}
      <div
        className={`p-3 rounded-[var(--r-s)] space-y-2 ${
          autoPublishEnabled
            ? "bg-[var(--acc)]/10 "
            : "bg-[var(--sunken)]/60 "
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap
              className={`w-3.5 h-3.5 ${autoPublishEnabled ? "text-[var(--acc-ink)] fill-[var(--acc)]" : "text-[var(--ink-2)]"}`}
            />
            <span className="text-micro font-mono font-bold text-[var(--ink)]">
              Subida Automática a {selectedPlatform}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoPublishEnabled}
              onChange={(e) =>
                setAutoPublishEnabled(e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-7 h-4 bg-[var(--sunken)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--ink)] after:rounded-full after:h-3 after:w-3 after:transition-ui peer-checked:bg-[var(--acc)]"></div>
          </label>
        </div>

        {/* Cuenta vinculada actual */}
        {(() => {
          const acc = socialAccounts.find(
            (a) =>
              a.plataforma?.toLowerCase() ===
              selectedPlatform.toLowerCase(),
          );
          if (acc && acc.status === "conectado") {
            return (
              <div className="flex items-center justify-between text-micro font-mono bg-[var(--scrim)]/40 p-2 rounded-[var(--r-s)] bg-[var(--ok)]/10">
                <div className="flex items-center gap-1 text-[var(--ok)] font-bold truncate">
                  <ShieldCheck className="w-3 h-3 text-[var(--ok)] shrink-0" />
                  <span className="truncate">
                    {acc.handle}
                  </span>
                </div>
                <span className="text-[var(--ok)] text-micro font-bold shrink-0">
                  ● Conectado
                </span>
              </div>
            );
          }
          return (
            <div className="flex items-center justify-between text-micro font-mono bg-[var(--scrim)]/40 p-2 rounded-[var(--r-s)] bg-[var(--acc)]/10">
              <span className="text-[var(--ink-2)]">
                Sin cuenta vinculada
              </span>
              <LinkButton
                type="button"
                onClick={() => {
                  setShowConnectModal(true);
                  setConnectHandleInput(
                    instagramHandle ||
                      `@${(bandName || "banda").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
                  );
                }}
              >
                <span><ShowIcon inline emoji="🔗" />Conectar en 1 clic</span>
              </LinkButton>
            </div>
          );
        })()}
      </div>
    </>
  );
}
