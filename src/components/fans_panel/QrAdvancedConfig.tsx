/**
 * Configuración avanzada del QR: recompensa al fan, dominio, ruta e idioma.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle2,ExternalLink,Gift,Heart,Music,Save,Settings2,Tag } from "lucide-react";
import { FAN_FORM_LANGUAGES } from "../../i18n/fansTranslations";
import { Button,Input } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useFansPanel } from "./FansPanelContext";

/**
 * Configuración avanzada del QR: recompensa al fan, dominio, ruta e idioma.
 * @returns Sección de interfaz.
 */
export function QrAdvancedConfig() {
  const { setShowAdvancedQrConfig, showAdvancedQrConfig, savedIncentive, incentivo, setIncentivo, handleSaveIncentive, epkConfig, onNavigate, setUseCustomDomain, useCustomDomain, customDomain, setCustomDomain, routePrefix, setRoutePrefix, customSlug, setCustomSlug, setQrLanguage, qrLanguage, selectedConcert, onUpdateConcert, qrConcertUrl, setSavedToConcertFeedback, savedToConcertFeedback } = useFansPanel();
  return (
    <>
{/* Personalización avanzada: recompensa, dominio/slug e idioma — plegada porque no se toca en cada visita */}
          <div className=" pt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedQrConfig((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-bold text-[var(--ink-2)] hover:text-[var(--acc)]/70 font-sans transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" /> Personalización avanzada
                (recompensa, dominio, idioma)
              </span>
              <span>{showAdvancedQrConfig ? "▲" : "▼"}</span>
            </button>

            {showAdvancedQrConfig && (
              <div className="mt-4 space-y-4">
                {/* Incentivo / Recompensa al Fan */}
                <div
                  id="fans-incentive-section"
                  className="bg-[var(--surface)]/80 p-5 rounded-[var(--r-l)] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--acc)] font-sans flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[var(--acc)]" />
                      Recompensa / incentivo para el fan
                    </label>
                    {savedIncentive && (
                      <span className="text-xs font-sans text-[var(--ok)] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ¡Guardado!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--ink-2)] font-sans">
                    Ofrece algo de valor al fan tras registrarse (un tema en
                    directo exclusivo o descuento de merchan) para disparar la
                    tasa de escaneos.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 mb-1">
                        {" "}
                        Mensaje de Bienvenida / Agradecimiento:
                      </label>
                      <Input
                        size="sm"
                        type="text"
                        value={incentivo.mensajeAgradecimiento}
                        onChange={(e) =>
                          setIncentivo((prev) => ({
                            ...prev,
                            mensajeAgradecimiento: e.target.value,
                          }))
                        }
                        placeholder="¡Muchas gracias por unirte a la familia de la banda!"
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 mb-1">
                          <Music className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
                          Enlace de Descarga (Tema inédito/directo):
                        </label>
                        <Input
                          size="sm"
                          type="url"
                          value={incentivo.enlaceDescarga}
                          onChange={(e) =>
                            setIncentivo((prev) => ({
                              ...prev,
                              enlaceDescarga: e.target.value,
                            }))
                          }
                          placeholder="https://…"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 mb-1">
                          <Tag className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
                          Código Cupón Merchandising:
                        </label>
                        <Input
                          size="sm"
                          type="text"
                          value={incentivo.codigoDescuento}
                          onChange={(e) =>
                            setIncentivo((prev) => ({
                              ...prev,
                              codigoDescuento: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="TUBANDA-FAN-10"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        onClick={() => handleSaveIncentive()}
                        className="items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" /> Guardar Incentivo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Apoyo Económico / Revolut: se configura ahora desde el Dossier EPK, fuente única
 del resto de datos de marca (booking, redes, etc.) — aquí solo un acceso directo. */}
                <div className="bg-[var(--surface)]/80 p-5 rounded-[var(--r-l)] space-y-3">
                  <label className="text-xs font-bold text-[var(--ink-2)] font-sans flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[var(--ink-2)]" />
                    Colaboración Económica y Donaciones (Revolut, PayPal y
                    Bizum)
                  </label>
                  <p className="text-xs text-[var(--ink-2)] font-sans">
                    {epkConfig?.donacionRevolut?.habilitado !== false &&
                    epkConfig?.donacionRevolut?.revolutTag
                      ? `Activa para revolut.me/${epkConfig.donacionRevolut.revolutTag} — se muestra en el formulario público "Únete" y en la pantalla de confirmación.`
                      : "Aún no está configurada. Actívala para que tus fans puedan aportar directamente por Revolut, PayPal o Bizum, sin intermediarios."}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={() => onNavigate?.("epk")}
                    className="items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Configurar en el
                    dossier EPK
                  </Button>
                </div>

                {/* Ruta Limpia y Dominio */}
                <div className="bg-[var(--surface)]/80 p-5 rounded-[var(--r-l)] space-y-4">
                  <label className="text-xs font-bold text-[var(--acc)] font-sans flex items-center gap-2">
                    Ruta limpia y dominio base
                  </label>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setUseCustomDomain(true)}
                      className={`p-2.5 rounded-[var(--r-m)] text-left font-sans transition flex flex-col gap-1 ${
                        useCustomDomain
                          ? "bg-[var(--acc)]/15 text-[var(--ink)] font-bold"
                          : "bg-[var(--surface)] text-[var(--ink-2)] hover:"
                      }`}
                    >
                      <span><ShowIcon inline emoji="🌐" />Dominio web oficial</span>
                      <span className="text-micro text-[var(--ink-2)] font-normal">
                        Para impresiones/carteles
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomDomain(false)}
                      className={`p-2.5 rounded-[var(--r-m)] text-left font-sans transition flex flex-col gap-1 ${
                        !useCustomDomain
                          ? "bg-[var(--acc)]/15 text-[var(--ink)] font-bold"
                          : "bg-[var(--surface)] text-[var(--ink-2)] hover:"
                      }`}
                    >
                      <span><ShowIcon inline emoji="🧪" />Servidor Dev</span>
                      <span className="text-micro text-[var(--ink-2)] font-normal">
                        Para pruebas en visor actual
                      </span>
                    </button>
                  </div>

                  {useCustomDomain && (
                    <div className="space-y-1">
                      <label className="text-xs font-sans text-[var(--ink-2)]">
                        Dominio del Proyecto:
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans text-[var(--ink-2)] bg-[var(--surface)] px-3 py-2.5 rounded-[var(--r-s)]">
                          https://
                        </span>
                        <Input
                          size="sm"
                          type="text"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="bandmanager.io"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-sans text-[var(--ink-2)]">
                      Slug personalizado:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-[var(--surface)] rounded-[var(--r-m)] px-2.5 shrink-0">
                        <span className="text-xs font-sans text-[var(--ink-2)]">
                          /
                        </span>
                        <input data-raw
                          type="text"
                          value={routePrefix}
                          onChange={(e) =>
                            setRoutePrefix(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, ""),
                            )
                          }
                          className="w-16 bg-transparent text-[var(--acc)] text-xs font-sans py-2.5 font-bold outline-none"
                          placeholder="unete"
                        />
                        <span className="text-xs font-sans text-[var(--ink-2)]">
                          /
                        </span>
                      </div>
                      <Input
                        size="sm"
                        type="text"
                        value={customSlug}
                        onChange={(e) =>
                          setCustomSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-_]/g, ""),
                          )
                        }
                        placeholder="ej. madrid-sala-siroco"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-sans text-[var(--ink-2)]">
                      Idioma del formulario para este enlace:
                    </label>
                    {/* grid en vez de flex de una sola fila: con 4+ idiomas (español, inglés,
 italiano, checo) un flex sin wrap se salía de la pantalla en móvil en
 vez de pasar a una segunda fila. */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FAN_FORM_LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => setQrLanguage(l.code)}
                          className={`py-2 px-2 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            qrLanguage === l.code
                              ? "bg-[var(--acc)]/15  text-[var(--ink)]"
                              : "bg-[var(--surface)] text-[var(--ink-2)] hover:"
                          }`}
                        >
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-micro font-sans text-[var(--ink-2)]">
                      El formulario se abrirá en este idioma por defecto; quien
                      lo escanee siempre podrá cambiarlo a mano.
                    </p>
                  </div>

                  {selectedConcert && onUpdateConcert && (
                    <div className="pt-2 ">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateConcert(selectedConcert.id, {
                            customQrUrl: qrConcertUrl,
                          });
                          setSavedToConcertFeedback(true);
                          setTimeout(
                            () => setSavedToConcertFeedback(false),
                            3500,
                          );
                        }}
                        className={`w-full py-2.5 px-3 font-bold font-sans text-xs rounded-[var(--r-m)] flex items-center justify-center gap-2 transition cursor-pointer ${
                          savedToConcertFeedback
                            ? "bg-[var(--ok)] text-[var(--on-ok)]"
                            : "bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {savedToConcertFeedback
                          ? "¡QR Asignado a este Concierto en el Calendario!"
                          : "Asignar este QR a este Concierto en el Calendario"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
    </>
  );
}
