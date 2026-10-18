/**
 * Diálogo para vincular la sesión/cookies de YouTube de la banda y evitar bloqueos de descarga.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check, CheckCircle2, Key, RefreshCw, ShieldCheck, Upload, X } from "lucide-react";
import { Button, IconButton, Textarea } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Diálogo para vincular la sesión/cookies de YouTube de la banda y evitar bloqueos de descarga.
 * @returns Sección de interfaz.
 */
export function YoutubeCookiesDialog() {
  const { cookieModalOpen, setCookieModalOpen, cookieSuccessMsg, handleUploadCookieFile, cookiesInputText, setCookiesInputText, hasYoutubeCookies, handleDeleteCookies, handleSaveCookies, isSavingCookies } = useLiveConcertAlbum();
  return (
    <>
      {cookieModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 animate-fade-in">
          <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-xl w-full p-6 space-y-4 text-[var(--ink-2)]">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--ink)]">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink-2)]">
                    Vincular cuenta de YouTube / cookies
                  </h3>
                  <p className="text-xs text-[var(--ink-2)]">
                    Permite descargas directas en el servidor sin bloqueos
                    de bot
                  </p>
                </div>
              </div>
              <IconButton
                label="Cerrar"
                size="icon-xs"
                onClick={() => setCookieModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </IconButton>
            </div>

            {cookieSuccessMsg ? (
              <div className="p-4 bg-[var(--ok)]/20 rounded-[var(--r-m)] text-[var(--ink)] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{cookieSuccessMsg}</span>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 text-xs text-[var(--ink-2)] space-y-2 leading-relaxed">
                  <p className="font-semibold text-[var(--acc)]/70 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[var(--ok)] shrink-0" />
                    ¿Por qué es necesario autenticar el canal de la banda?
                  </p>
                  <p className="text-xs text-[var(--ink-2)]">
                    YouTube bloquea las peticiones automáticas desde centros
                    de datos con el mensaje{" "}
                    <em>“Sign in to confirm you're not a bot”</em>. Al
                    vincular las cookies de tu cuenta/canal, el servidor se
                    identifica legítimamente y descarga el vídeo o audio
                    completo al instante a máxima velocidad.
                  </p>
                  <div className="pt-2 text-xs text-[var(--ink-2)] space-y-1">
                    <p className="font-bold text-[var(--ink-2)]">
                      <ShowIcon inline emoji="📌" />Cómo obtener las cookies en 10 segundos:
                    </p>
                    <p>
                      1. Instala la extensión gratuita de Chrome/Firefox{" "}
                      <strong>“Get cookies.txt locally”</strong>.
                    </p>
                    <p>
                      2. Abre YouTube con tu cuenta de la banda iniciada.
                    </p>
                    <p>
                      3. Haz clic en la extensión, pulsa{" "}
                      <strong>“Export”</strong> y pega el contenido aquí o
                      sube el archivo.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[var(--ink-2)]">
                      Contenido de cookies.txt (formato Netscape):
                    </label>
                    <label className="text-xs font-semibold text-[var(--acc)] hover:text-[var(--acc)]/70 cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Subir archivo cookies.txt</span>
                      <input aria-label="Contenido de cookies.txt (formato Netscape)"
                        type="file"
                        accept=".txt"
                        onChange={handleUploadCookieFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <Textarea
                    rows={5}
                    value={cookiesInputText}
                    onChange={(e) => setCookiesInputText(e.target.value)}
                    placeholder="# Netscape HTTP Cookie File&#10;.youtube.com  TRUE  /  TRUE  1789000000  SID  ..."
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {hasYoutubeCookies ? (
                    <button
                      onClick={handleDeleteCookies}
                      className="px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--alert)]/20 hover:bg-[var(--alert)]/30 text-[var(--ink)] text-xs font-bold transition-ui"
                    >
                      Eliminar cookies actuales
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => setCookieModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveCookies}
                      disabled={isSavingCookies || !cookiesInputText.trim()}
                      className="items-center gap-1.5"
                    >
                      {isSavingCookies ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Guardar y habilitar descargas</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
