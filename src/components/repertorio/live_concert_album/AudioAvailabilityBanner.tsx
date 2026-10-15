/**
 * Aviso de audio no disponible o bloqueado en YouTube con acciones para vincular archivo o demo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertTriangle, Download, ExternalLink, Lock, Sparkles, Upload } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Aviso de audio no disponible o bloqueado en YouTube con acciones para vincular archivo o demo.
 * @returns Sección de interfaz.
 */
export function AudioAvailabilityBanner() {
  const { audioAvailable, youtubeBlocked, setCookieModalOpen, hasYoutubeCookies, youtubeUrl, handleLoadDemoAudio, isLinkingLocalFile, handleAttachLocalAudioFile } = useLiveConcertAlbum();
  return (
    <>
      {/* Local File / YouTube Audio Availability Status Banner */}
      {(!audioAvailable || youtubeBlocked) && (
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--ink)] text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--ink)] text-sm">
                <ShowIcon inline emoji="🎬" />Audio y muestras de YouTube listos para escuchar
              </p>
              <p className="text-[var(--acc)]/70 mt-1 leading-relaxed">
                Puedes{" "}
                <strong>escuchar las muestras de cada corte</strong>{" "}
                directamente haciendo clic en{" "}
                <strong>"<ShowIcon inline emoji="🔊" />Escuchar muestra"</strong> (se reproduce
                el vídeo/audio original de YouTube sincronizado con
                los timestamps).
              </p>
              <p className="text-[var(--acc)]/80 mt-1 text-xs">
                <ShowIcon inline emoji="ℹ️" />{" "}
                <em>
                  Para trocear físicamente el concierto en archivos
                  MP3 independientes descargables en el servidor o
                  transcribir con Gemini:
                </em>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 ">
            <Button
              variant="neutral"
              size="sm"
              type="button"
              onClick={() => setCookieModalOpen(true)}
              className="items-center gap-1.5"
              title="Configurar cookies de la cuenta de YouTube para descargar automáticamente en el servidor sin bloqueos"
            >
              <Lock className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>
                {hasYoutubeCookies
                  ? "Sesión YouTube Activa"
                  : "Vincular Sesión de la Banda"}
              </span>
            </Button>

            <a
              href={`https://cobalt.tools/#${encodeURIComponent(youtubeUrl || "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)] font-bold rounded-[var(--r-s)] flex items-center gap-1.5 transition-ui text-xs"
              title="Abrir Cobalt para descargar el MP3 completo de YouTube en 5 segundos y adjuntarlo aquí"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Extraer MP3 (Cobalt)</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>

            <Button
              variant="primary"
              size="sm"
              onClick={handleLoadDemoAudio}
              disabled={isLinkingLocalFile}
              className="items-center gap-1.5"
              title="Cargar audio de ensayo demo instantáneamente para probar muestras y transcripciones"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--ink)]" />
              <span>Cargar demo</span>
            </Button>

            <label className="px-3.5 py-2 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold rounded-[var(--r-s)] cursor-pointer flex items-center justify-center gap-1.5 transition-ui text-xs">
              <Upload className="w-4 h-4" />
              <span>
                {isLinkingLocalFile
                  ? "Subiendo..."
                  : "Adjuntar Archivo Local"}
              </span>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleAttachLocalAudioFile}
                disabled={isLinkingLocalFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </>
  );
}
