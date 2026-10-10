/**
 * Acciones finales del editor: limpiar, publicar ahora o programar, y avisos de cadencia.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle, Calendar, Camera, Check, CheckCircle2, Copy, Download, RefreshCw, Rocket } from "lucide-react";
import { Button } from "../ui";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Acciones finales del editor: limpiar, publicar ahora o programar, y avisos de cadencia.
 * @returns Sección de interfaz.
 */
export function EditorActions() {
  const { handleDownloadCompletePack, packDownloadedSuccess, thumbnailCapturedSuccess, handleCaptureThumbnail, handleCopyFormattedPost, handlePublishNowDirectly, isPublishingNow, isScheduling, publishNowSuccess, schedulingSuccess, scheduleErrors, scheduleWarnings } = useReelsCenter();
  return (
    <>
      {/* Master Actions: Marie Kondo Clean & Zen Tiers */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={handleDownloadCompletePack}
          className={`w-full py-2.5 px-3 rounded-[var(--r-s)] font-mono text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-ui ${
            packDownloadedSuccess
              ? "bg-[var(--ok)] text-[var(--on-ok)] font-bold"
              : "bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--acc-ink)] "
          }`}
          title="Descarga el vídeo, subtítulos, portada y copy formateado"
        >
          {packDownloadedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>¡PACK 4-EN-1 DESCARGADO!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Descargar pack completo</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={thumbnailCapturedSuccess ? "inverse" : "neutral"}
            size="sm"
            type="button"
            onClick={handleCaptureThumbnail}
            className="items-center justify-center gap-1.5"
            title="Captura el fotograma actual en alta resolución para usar de portada"
          >
            <Camera className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
            <span>
              {thumbnailCapturedSuccess
                ? "¡Portada Guardada!"
                : "Guardar Portada"}
            </span>
          </Button>

          <Button
            variant="neutral"
            size="sm"
            type="button"
            onClick={handleCopyFormattedPost}
            className="items-center justify-center gap-1.5"
            title="Copia el texto formateado al portapapeles"
          >
            <Copy className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
            <span>Copiar copy</span>
          </Button>
        </div>

        {/* Action Buttons: Publicar Ahora (1-Clic) vs Programar en Calendario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handlePublishNowDirectly}
            disabled={isPublishingNow}
            className={`py-3 px-2 rounded-[var(--r-s)] font-mono text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-ui ${
              isPublishingNow
                ? "bg-[var(--sunken)] text-[var(--ink-2)] cursor-not-allowed"
                : "bg-[var(--alert)] hover:brightness-95 text-[var(--on-alert)] active:scale-[0.97]"
            }`}
            title="Publica inmediatamente este Reel en tu cuenta oficial"
          >
            {isPublishingNow ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>PUBLICANDO…</span>
              </>
            ) : (
              <>
                <Rocket className="w-3.5 h-3.5" />
                <span>PUBLICAR AHORA</span>
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={isScheduling}
            className={`py-3 px-2 rounded-[var(--r-s)] font-mono text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-ui ${
              isScheduling
                ? "bg-[var(--sunken)] text-[var(--ink-2)] cursor-not-allowed"
                : "bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)] "
            }`}
          >
            {isScheduling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AGENDANDO…</span>
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                <span>AGENDAR</span>
              </>
            )}
          </button>
        </div>
      </div>

      {publishNowSuccess && (
        <div className="p-2.5 bg-[var(--alert)]/10 rounded-[var(--r-s)] text-[var(--alert)] text-xs text-center font-mono animate-fade-in mt-2 flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4 text-[var(--alert)]" />
          <span>{publishNowSuccess}</span>
        </div>
      )}

      {schedulingSuccess && (
        <div className="p-2.5 bg-[var(--ok)]/10 rounded-[var(--r-s)] text-[var(--ok)] text-xs text-center font-sans mt-2 flex items-center justify-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
          <span>¡Reel programado con éxito!</span>
        </div>
      )}
      {scheduleErrors.length > 0 && (
        <div className="p-2.5 bg-[var(--alert)]/10 rounded-[var(--r-s)] text-[var(--alert)] text-xs font-sans mt-2 space-y-1">
          {scheduleErrors.map((problema) => (
            <div
              key={problema}
              className="flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{problema}</span>
            </div>
          ))}
        </div>
      )}
      {scheduleWarnings.length > 0 && (
        <div className="p-2.5 bg-[var(--acc)]/10 rounded-[var(--r-s)] text-[var(--ink)] text-xs font-sans mt-2 space-y-1">
          {scheduleWarnings.map((aviso) => (
            <div
              key={aviso}
              className="flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{aviso}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
