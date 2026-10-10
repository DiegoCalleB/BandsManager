/**
 * Formulario de alta de fan
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,ChevronDown,ChevronUp,Loader2 } from "lucide-react";
import { SocialPlatformsList } from "../SocialPlatformsList";
import { Input,LinkButton,Textarea } from "../ui";
import { DonationCard } from "./DonationCard";
import { useFansLanding } from "./FansLandingContext";

/**
 * Formulario de alta de fan
 * @returns Sección de interfaz.
 */
export function SignupFormTab() {
  const { activeTab, handleSubmit, error, t, formData, setFormData, setShowOptionalFields, showOptionalFields, bandName, setShowPrivacyModal, loading, socialLinks, language, trackClick, clickCounts } = useFansLanding();
  return (
    <>
{/* Tab 2: Formulario de Registro */}
        {activeTab === "form" && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 pt-1 animate-fade-in text-left"
          >
            {error && (
              <div className="p-3 bg-[var(--alert)]/10 text-[var(--alert)] text-xs font-sans rounded-[var(--r-m)] text-center">
                {error}
              </div>
            )}

            {/* CAMPOS OBLIGATORIOS (Rápidos y sin fricción) */}
            <div>
              <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                {t("labelName")} *
              </label>
              <Input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full"
                placeholder={t("placeholderName")}
              />
            </div>
            <div>
              <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                {t("labelEmail")} *
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full"
                placeholder="tu@email.com"
              />
            </div>

            {/* BOTÓN PARA EXPANDIR DETALLES OPCIONALES (Sin obligar al fan) */}
            <div>
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="w-full py-2 px-3 rounded-[var(--r-m)] bg-[var(--sunken)]  text-[var(--ink-2)] hover:text-[var(--acc)]/70 text-xs font-sans flex items-center justify-between transition-colors"
              >
                <span>
                  {showOptionalFields
                    ? "– Ocultar detalles adicionales"
                    : "+ Añadir ciudad, canción o mensaje (opcional)"}
                </span>
                {showOptionalFields ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* CAMPOS OPCIONALES COLAPSABLES */}
            {showOptionalFields && (
              <div className="space-y-3.5 pt-1 pl-1 pr-1 animate-in fade-in duration-200">
                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelCity")}
                  </label>
                  <Input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) =>
                      setFormData({ ...formData, ciudad: e.target.value })
                    }
                    className="w-full"
                    placeholder={t("placeholderCity")}
                  />
                </div>
                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelHowFound")}
                  </label>
                  <select data-raw
                    value={formData.comoConocio}
                    onChange={(e) =>
                      setFormData({ ...formData, comoConocio: e.target.value })
                    }
                    className="w-full bg-[var(--sunken)] focus:rounded-[var(--r-m)] p-3 text-[var(--ink)] font-sans text-sm outline-none transition-colors appearance-none"
                  >
                    <option value="">{t("optionSelect")}</option>
                    <option value="Concierto">{t("optionConcert")}</option>
                    <option value="Redes Sociales">{t("optionSocial")}</option>
                    <option value="Amigo">{t("optionFriend")}</option>
                    <option value="Spotify">{t("optionSpotify")}</option>
                    <option value="Otro">{t("optionOther")}</option>
                  </select>
                </div>

                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelFavSong", { bandName })}
                  </label>
                  <Input
                    type="text"
                    value={formData.cancionFavorita}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cancionFavorita: e.target.value,
                      })
                    }
                    className="w-full"
                    placeholder={t("placeholderFavSong")}
                  />
                </div>

                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelInstagram")}
                  </label>
                  <Input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                    className="w-full"
                    placeholder={t("placeholderInstagram")}
                  />
                </div>

                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelMessage")}
                  </label>
                  <Textarea
                    rows={2}
                    value={formData.mensaje}
                    onChange={(e) =>
                      setFormData({ ...formData, mensaje: e.target.value })
                    }
                    className="w-full"
                    placeholder={t("placeholderMessage")}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 pb-1">
              <label className="flex items-start gap-3 cursor-pointer group p-3 bg-[var(--surface)]/50 rounded-[var(--r-m)] hover:transition-colors">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    required
                    checked={formData.consentimiento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consentimiento: e.target.checked,
                      })
                    }
                    className="peer appearance-none w-5 h-5 rounded bg-[var(--sunken)] checked:bg-[var(--acc)] checked: transition-colors shrink-0 cursor-pointer"
                  />
                  <Check
                    className="w-3.5 h-3.5 text-[var(--ink)] absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    strokeWidth={4}
                  />
                </div>
                <span className="text-micro text-[var(--ink-2)] font-sans leading-relaxed group-hover:text-[var(--ink-2)] transition-colors pt-0.5">
                  {t("consentPrefix")}
                  <LinkButton
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    {t("consentPrivacyLink")}
                  </LinkButton>
                  {t("consentMiddle")}
                  <strong className="text-[var(--ink-2)]">
                    {t("consentExplicit")}
                  </strong>
                  {t("consentSuffix")}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-1 bg-[var(--acc)]  hover:bg-[var(--acc-soft)] text-[#121111] font-bold text-sm font-sans rounded-[var(--r-m)] transition-ui active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submitJoin", { bandName })
              )}
            </button>

            {/* Colaborar económicamente: fuera del flujo principal del formulario, después de enviar */}
            <div className="pt-1"><DonationCard contextType="form" /></div>

            {/* Social Links shown below form as well */}
            {socialLinks && Object.values(socialLinks).some(Boolean) && (
              <div className="pt-4 space-y-2">
                <p className="text-xs font-bold text-[var(--ink-2)] font-sans text-center">
                  {t("followUsAlso")}
                </p>
                <SocialPlatformsList
                  links={socialLinks}
                  variant="pills"
                  showTitle={false}
                  language={language}
                  onPlatformClick={(plat, url) => trackClick(plat, url, "form")}
                  clickCounts={clickCounts}
                  showClickCounts={true}
                />
              </div>
            )}
          </form>
        )}
    </>
  );
}
