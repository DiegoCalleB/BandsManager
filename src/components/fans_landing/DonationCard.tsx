/**
 * Tarjeta de donación (Revolut, PayPal y Bizum) en las pantallas de redes, formulario y éxito.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,Copy,Lock as LockIcon } from "lucide-react";
import { BizumLogo,PayPalLogo } from "../SocialPlatformsList";
import { useFansLanding } from "./FansLandingContext";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface DonationCardProps {
  contextType: "redes" | "form" | "success";
}

/**
 * Tarjeta de donación (Revolut, PayPal y Bizum) en las pantallas de redes, formulario y éxito.
 * @returns Sección de interfaz.
 */
export function DonationCard({ contextType }: DonationCardProps) {
  const { revolutUrl, paypalUrl, hasBizum, donacionRevolut, language, t, bandName, clickCounts, hasRevolut, hasPaypal, trackClick, revolutDisplay, paypalDisplay, handleCopyBizum, bizumPhone, copiedBizum } = useFansLanding();
    if (
      (!revolutUrl && !paypalUrl && !hasBizum) ||
      donacionRevolut?.habilitado === false
    )
      return null;

    const isSuccessScreen = contextType === "success";
    const isFormScreen = contextType === "form";

    const customTitle = donacionRevolut?.titulo?.trim();
    const isDefaultSpanishTitle =
      !customTitle ||
      customTitle === "Colabora con una aportación económica" ||
      customTitle === "Colabora con la banda" ||
      customTitle === "Apoyo Económico & Donaciones";

    const label =
      language === "es" && !isDefaultSpanishTitle
        ? customTitle
        : isSuccessScreen
          ? t("revolutSuccessPrompt", { bandName })
          : t("economicSupportTitle", { bandName });

    const customDesc = donacionRevolut?.descripcion?.trim();
    const isDefaultSpanishDesc =
      !customDesc ||
      customDesc.includes("Tu aportación directa nos ayuda a financiar") ||
      customDesc.includes("financiar furgoneta de gira");

    const descText =
      language === "es" && !isDefaultSpanishDesc
        ? customDesc
        : isSuccessScreen
          ? t("revolutSuccessPrompt", { bandName })
          : t("economicSupportSubtitle");

    const revolutClicks = clickCounts["revolut"] || 0;
    const paypalClicks = clickCounts["paypal"] || 0;
    const bizumClicks = clickCounts["bizum"] || 0;
    const totalClicks = revolutClicks + paypalClicks + bizumClicks;

    const preferredMethodSetting =
      (donacionRevolut?.metodoPorDefecto as "revolut" | "paypal" | "bizum") ||
      "revolut";

    // Lista de métodos disponibles
    const availableMethods: Array<"revolut" | "paypal" | "bizum"> = [];
    if (hasRevolut) availableMethods.push("revolut");
    if (hasPaypal) availableMethods.push("paypal");
    if (hasBizum) availableMethods.push("bizum");

    const primaryMethod = availableMethods.includes(preferredMethodSetting)
      ? preferredMethodSetting
      : availableMethods[0];

    const secondaryMethods = availableMethods.filter(
      (m) => m !== primaryMethod,
    );

    const renderPaymentButton = (
      method: "revolut" | "paypal" | "bizum",
      variant: "full" | "half",
    ) => {
      const isFull = variant === "full";
      if (method === "revolut") {
        return (
          <a
            key={`revolut-${variant}`}
            href={revolutUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick("revolut", revolutUrl, contextType)}
            className={`group relative w-full flex items-center justify-center ${isFull ? "gap-3.5 p-4 min-h-[64px]" : "gap-2 px-2.5 py-2 min-h-[42px] sm:min-h-[44px]"} rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)]  transition-ui duration-200 ease-out text-center active:scale-[0.97] cursor-pointer overflow-hidden`}
          >
            <div
              className={`${isFull ? "w-8 h-8 sm:w-9 sm:h-9 p-1.5" : "w-6 h-6 p-1"} rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink)] flex items-center justify-center shrink-0 shadow transition-transform`}
            >
              <svg
                className="w-full h-full fill-[var(--ink)]"
                viewBox="0 0 24 24"
              >
                <path d="M18.72 9.24c-.06-.5-.2-.98-.44-1.42a4.43 4.43 0 0 0-1.12-1.3A4.78 4.78 0 0 0 15.5 5.6c-.63-.23-1.3-.35-1.98-.35H6.28v2.75h7.24c.72 0 1.39.28 1.9.79.5.5.79 1.18.79 1.9 0 .73-.29 1.4-.79 1.91-.51.5-1.18.78-1.9.78h-3.3v2.8h2.64l4.28 7.82h3.28l-4.14-7.57a4.93 4.93 0 0 0 2.94-4.23zM6.28 10.3v13.7h2.75V10.3H6.28z" />
              </svg>
            </div>
            <div className="text-center min-w-0">
              <span
                className={`${isFull ? "text-sm sm:text-base" : "text-xs"} font-extrabold text-[var(--ink)] group-hover:text-[var(--acc)]/70 transition-colors block truncate leading-tight`}
              >
                Revolut
              </span>
              <span
                className={`${isFull ? "text-xs" : "text-micro"} text-[var(--ink-2)] font-sans block truncate group-hover:text-[var(--ink-2)] leading-tight`}
              >
                {revolutDisplay.replace(/^revolut\.me\//, "@")}
              </span>
            </div>
          </a>
        );
      }

      if (method === "paypal") {
        return (
          <a
            key={`paypal-${variant}`}
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick("paypal", paypalUrl, contextType)}
            className={`group relative w-full flex items-center justify-center ${isFull ? "gap-3.5 p-4 min-h-[64px]" : "gap-2 px-2.5 py-2 min-h-[42px] sm:min-h-[44px]"} rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--sunken)] transition-ui duration-200 ease-out text-center active:scale-[0.97] cursor-pointer overflow-hidden`}
          >
            <div
              className={`${isFull ? "w-8 h-8 sm:w-9 sm:h-9 p-1.5" : "w-6 h-6 p-1"} rounded-[var(--r-s)] bg-[var(--sunken)] text-[#003087] flex items-center justify-center shrink-0 shadow transition-transform`}
            >
              <PayPalLogo className="w-full h-full" />
            </div>
            <div className="text-center min-w-0">
              <span
                className={`${isFull ? "text-sm sm:text-base" : "text-xs"} font-extrabold text-[var(--ink)] group-hover:text-[var(--acc)]/70 transition-colors block truncate leading-tight`}
              >
                PayPal
              </span>
              <span
                className={`${isFull ? "text-xs" : "text-micro"} text-[var(--tentative)] font-sans block truncate group-hover:text-[var(--ink)] leading-tight`}
              >
                {paypalDisplay.replace(/^paypal\.me\//, "@")}
              </span>
            </div>
          </a>
        );
      }

      if (method === "bizum") {
        return (
          <button
            key={`bizum-${variant}`}
            type="button"
            onClick={() => handleCopyBizum(contextType)}
            className={`group relative w-full flex items-center justify-center ${isFull ? "gap-3.5 p-4 min-h-[64px]" : "gap-2 px-2.5 py-2 min-h-[42px] sm:min-h-[44px]"} rounded-[var(--r-m)] bg-[var(--ok-soft)] hover:bg-[var(--ok)]/20 transition-ui duration-200 ease-out text-center active:scale-[0.97] cursor-pointer overflow-hidden`}
          >
            <div
              className={`${isFull ? "w-8 h-8 sm:w-9 sm:h-9 p-1.5" : "w-6 h-6 p-1"} rounded-[var(--r-s)] bg-[var(--ok)] text-[var(--on-ok)] flex items-center justify-center shrink-0 shadow font-bold transition-transform`}
            >
              <BizumLogo className="w-full h-full" />
            </div>
            <div className="text-center min-w-0">
              <span
                className={`${isFull ? "text-sm sm:text-base" : "text-xs"} font-extrabold text-[var(--ink)] group-hover:text-[var(--ink)] transition-colors block truncate leading-tight`}
              >
                Bizum
              </span>
              <span
                className={`${isFull ? "text-xs" : "text-micro"} text-[var(--ok)] font-sans block truncate group-hover:text-[var(--ink-2)] leading-tight`}
              >
                {bizumPhone}
              </span>
            </div>
            {isFull && (
              <span className="p-1.5 rounded-[var(--r-s)] bg-[var(--ok)]/20 text-[var(--ink)] shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        );
      }

      return null;
    };

    return (
      <div
        className={
          isSuccessScreen ? "pt-3 text-left" : isFormScreen ? "pt-2" : "pt-1.5"
        }
      >
        <div className="relative rounded-[var(--r-l)] bg-[var(--surface)]/95   p-3.5 sm:p-4 transition-ui duration-300 text-left overflow-hidden">
          {/* Halo ambiental sutil */}

          {/* Cabecera de la tarjeta: Screenshot / Imagen + Título + Badge */}
          <div className="relative flex items-start gap-3 sm:gap-3.5">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-[var(--r-m)] overflow-hidden bg-[var(--surface)] flex items-center justify-center shrink-0 transition-transform">
              <img
                src="/Screenshot_20260824_164054_Google.jpg"
                alt={t("revolutBadge") || "Colaboración"}
                className="w-full h-full object-cover scale-110 transition-transform duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] tracking-tight leading-snug">
                  {label}
                </h3>
                <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--ink)] font-bold shrink-0">
                  {t("revolutBadge") || "Contribución"}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)]/90 leading-relaxed mt-1">
                {descText}
              </p>
            </div>
          </div>

          {/* Notificación de Bizum Copiado */}
          {copiedBizum && (
            <div className="mt-2.5 p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/20 text-[var(--ink)] text-xs font-sans flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-[var(--ok)] shrink-0" />
              <span className="font-bold">
                {t("bizumCopiedNotification", { phone: bizumPhone }) ||
                  `¡Teléfono de Bizum (${bizumPhone}) copiado! Abre tu banco para enviarlo.`}
              </span>
            </div>
          )}

          {/* Botones de Pasarelas / Métodos de Pago */}
          <div className="pt-3">
            {availableMethods.length === 1 &&
              renderPaymentButton(availableMethods[0], "full")}

            {availableMethods.length === 2 && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {availableMethods.map((m) => renderPaymentButton(m, "half"))}
              </div>
            )}

            {availableMethods.length === 3 && (
              <div className="space-y-2.5">
                {primaryMethod && renderPaymentButton(primaryMethod, "full")}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {secondaryMethods.map((m) => renderPaymentButton(m, "half"))}
                </div>
              </div>
            )}
          </div>

          {/* Pie de seguridad y métricas */}
          <div className="pt-2.5 flex items-center justify-between text-micro text-[var(--ink-2)]">
            <span className="flex items-center gap-1">
              <LockIcon className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
              <span>
                {t("revolutSecureDirect") ||
                  "Pago seguro y directo a la banda · Sin intermediarios"}
              </span>
            </span>
            {totalClicks > 0 && (
              <span className="text-micro font-sans text-[var(--ink-2)] bg-[var(--surface)] px-1.5 py-0.5 rounded">
                {totalClicks}{" "}
                {totalClicks === 1 ? t("clickSingular") : t("clickPlural")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  
}
