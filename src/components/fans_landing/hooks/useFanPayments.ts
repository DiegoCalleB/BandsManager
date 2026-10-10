/**
 * Enlaces y datos de pago/donación (Revolut, PayPal, Bizum) y URL del dossier EPK.
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { safeUrl } from "../../../utils/safeUrl";
import { SocialLinks } from "../../SocialPlatformsList";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FanPaymentsParams {
  donacionRevolut: { habilitado?: boolean; revolutTag?: string; revolutUrl?: string; paypalUser?: string; paypalUrl?: string; bizumTelefono?: string; ibanCuenta?: string; metodoPorDefecto?: "revolut" | "paypal" | "bizum" | "iban"; titulo?: string; descripcion?: string; };
  socialLinks: SocialLinks;
  trackClick: (platform: string, url?: string, context?: string) => void;
}

/**
 * Enlaces y datos de pago/donación (Revolut, PayPal, Bizum) y URL del dossier EPK.
 * @param params Estado y callbacks del contenedor ({@link FanPaymentsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFanPayments({ donacionRevolut, socialLinks, trackClick }: FanPaymentsParams) {
  const [copiedBizum, setCopiedBizum] = useState(false);

  // safeUrl() al final: donacionRevolut.revolutUrl/paypalUrl es texto libre editado por el admin
  // de la banda y se renderiza como href en esta página pública sin sesión — sin filtrar el
  // esquema, un valor tipo"javascript:..." se ejecutaría en el navegador de cualquier fan.
  const rawRevolutTag =
    donacionRevolut?.revolutTag
      ?.replace(/^@/, "")
      .replace(/^revolut\.me\//i, "")
      .trim() || "";

  const rawRevolutUrl = donacionRevolut?.revolutUrl?.trim() || "";

  const rawSocialRevolut = socialLinks?.revolut?.trim() || "";

  const revolutUrl =
    safeUrl(
      rawRevolutUrl ||
        (rawRevolutTag
          ? rawRevolutTag.startsWith("http")
            ? rawRevolutTag
            : `https://revolut.me/${rawRevolutTag}`
          : "") ||
        (rawSocialRevolut
          ? rawSocialRevolut.startsWith("http")
            ? rawSocialRevolut
            : `https://revolut.me/${rawSocialRevolut.replace(/^@/, "").replace(/^revolut\.me\//i, "")}`
          : ""),
    ) || "";

  const rawPaypalUser =
    donacionRevolut?.paypalUser
      ?.replace(/^@/, "")
      .replace(/^paypal\.me\//i, "")
      .trim() || "";

  const rawPaypalUrl = donacionRevolut?.paypalUrl?.trim() || "";

  const rawSocialPaypal = socialLinks?.paypal?.trim() || "";

  const paypalUrl =
    safeUrl(
      rawPaypalUrl ||
        (rawPaypalUser
          ? rawPaypalUser.startsWith("http")
            ? rawPaypalUser
            : `https://paypal.me/${rawPaypalUser}`
          : "") ||
        (rawSocialPaypal
          ? rawSocialPaypal.startsWith("http")
            ? rawSocialPaypal
            : `https://paypal.me/${rawSocialPaypal.replace(/^@/, "").replace(/^paypal\.me\//i, "")}`
          : ""),
    ) || "";

  const bizumPhone = (
    donacionRevolut?.bizumTelefono ||
    socialLinks?.bizum ||
    ""
  ).trim();

  const rawHandle = revolutUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const revolutDisplay =
    rawHandle || (rawRevolutTag ? `revolut.me/${rawRevolutTag}` : "");

  const rawPaypalHandle = paypalUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const paypalDisplay =
    rawPaypalHandle || (rawPaypalUser ? `paypal.me/${rawPaypalUser}` : "");

  const hasRevolut = Boolean(revolutUrl);

  const hasPaypal = Boolean(paypalUrl);

  const hasBizum = Boolean(bizumPhone);

  const handleCopyBizum = (contextType: string) => {
    if (!bizumPhone) return;
    const cleanPhone = bizumPhone.replace(/[\s-]/g, "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanPhone).catch(() => {});
    }
    setCopiedBizum(true);
    trackClick("bizum", `bizum:${cleanPhone}`, contextType);
    setTimeout(() => setCopiedBizum(false), 3500);
  };

  return { revolutUrl, paypalUrl, hasBizum, hasRevolut, hasPaypal, revolutDisplay, paypalDisplay, handleCopyBizum, bizumPhone, copiedBizum };
}
