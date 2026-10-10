/**
 * Logo de la banda activa (estilo perfil de Netflix).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ArrowUpDown,Camera,Guitar,Loader2,Sparkles,Upload } from "lucide-react";
import { Button } from "../ui";
import { useUserProfile } from "./UserProfileContext";

/**
 * Logo de la banda activa (estilo perfil de Netflix).
 * @returns Sección de interfaz.
 */
export function BandLogoSection() {
  const { bandLogoUrl, logoImgError, setLogoImgError, activeBandName, currentUser, isPromoUser, currentPlanDef, setShowUpgradeModal, uploadingLogo, handleLogoChangeInProfile } = useUserProfile();
  return (
    <>
      <div className="space-y-2 pt-2 ">
        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>Logo de tu banda / proyecto musical</span>
          </span>
          <span className="text-micro text-[var(--acc)]/80 font-normal font-sans">
            Editar Avatar
          </span>
        </label>

        <div
          className={`p-3 rounded-[var(--r-m)] flex items-center justify-between gap-3 ${"bg-[var(--sunken)]"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[var(--r-m)] bg-[var(--surface)] overflow-hidden flex items-center justify-center p-1 shrink-0 relative group">
              {bandLogoUrl && !logoImgError ? (
                <img
                  src={bandLogoUrl}
                  alt="Logo banda"
                  onError={() => setLogoImgError(true)}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Guitar className="w-6 h-6 text-[var(--acc)]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-bold text-[var(--ink)]">
                  {activeBandName || currentUser.bandName || "Tu Banda"}
                </p>
                {isPromoUser ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-sans font-extrabold bg-[var(--acc)] text-[var(--on-acc)]">
                    <span>{currentPlanDef.name}</span>
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="items-center gap-1"
                    title="Cambiar o mejorar suscripción"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[var(--acc)]" />
                    <span>{currentPlanDef.name}</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-[var(--acc)] ml-0.5" />
                  </Button>
                )}
              </div>
              <p className="text-micro text-[var(--ink-2)] font-sans">
                Avatar / Logo oficial de la banda
              </p>
            </div>
          </div>

          <label className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] text-xs font-sans font-bold transition-ui cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-[0.97]">
            {uploadingLogo ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
                <span>Subiendo…</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Cambiar logo</span>
              </>
            )}
            <input aria-label="Logo de tu banda / proyecto musical editar avatar"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingLogo}
              onChange={handleLogoChangeInProfile}
            />
          </label>
        </div>
      </div>
    </>
  );
}
