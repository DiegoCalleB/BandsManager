/**
 * Concierto seleccionado, dominio, ruta e idioma del enlace del QR.
 * Extraído de FansPanel.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useState } from "react";
import { DEFAULT_FAN_FORM_LANGUAGE,FanFormLanguage,isFanFormLanguage } from "../../../i18n/fansTranslations";
import { Concert } from "../../../types";
import { encodeBandIdClient } from "../../../utils/bandHash";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface QrLinkParams {
  concerts: Concert[];
  selectedConcertId: string;
  currentBandId: string;
  cleanBandId: string;
}

/**
 * Concierto seleccionado, dominio, ruta e idioma del enlace del QR.
 * @param params Estado y callbacks del contenedor ({@link QrLinkParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useQrLink({ concerts, selectedConcertId, currentBandId, cleanBandId }: QrLinkParams) {
  const selectedConcert = concerts.find((c) => c.id === selectedConcertId);

  const [customSlug, setCustomSlug] = useState("");

  const [useCustomDomain, setUseCustomDomain] = useState(true);

 // Default to clean custom domain like bandmanager.io
  const defaultDomain = "bandmanager.io";

  const [customDomain, setCustomDomain] = useState(defaultDomain);

  const [routePrefix, setRoutePrefix] = useState("unete");

  const [qrLanguage, setQrLanguage] = useState<FanFormLanguage>(
    DEFAULT_FAN_FORM_LANGUAGE,
  );

  useEffect(() => {
    if (selectedConcert) {
      const defaultSlug = `${selectedConcert.ciudad}-${selectedConcert.sala}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado local con la prop o la banda activa
      setCustomSlug(defaultSlug);
      // Precarga el idioma guardado en el concierto; el manager siempre puede cambiarlo a mano abajo.
      setQrLanguage(
        isFanFormLanguage(selectedConcert.idioma)
          ? selectedConcert.idioma
          : DEFAULT_FAN_FORM_LANGUAGE,
      );
    } else {
      setCustomSlug("");
    }
  }, [selectedConcertId]);

  // Build clean target URL
  const rawDomain = useCustomDomain
    ? customDomain.trim().startsWith("http")
      ? customDomain.trim()
      : `https://${customDomain.trim().replace(/\/$/, "")}`
    : typeof window !== "undefined"
      ? window.location.origin
      : "https://bandmanager.io";

  const cleanPrefix = routePrefix.trim().replace(/^\/+|\/+$/g, "");

  const cleanSlugVal = customSlug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

  const pathFormatted = cleanSlugVal
    ? cleanPrefix
      ? `/${cleanPrefix}/${cleanSlugVal}`
      : `/${cleanSlugVal}`
    : cleanPrefix
      ? `/${cleanPrefix}`
      : "/unete";

  const qrQueryParams: string[] = [];

  if (currentBandId)
    qrQueryParams.push(
      `b=${encodeURIComponent(encodeBandIdClient(currentBandId))}`,
    );
  else if (cleanBandId)
    qrQueryParams.push(
      `b=${encodeURIComponent(encodeBandIdClient(cleanBandId))}`,
    );

  if (qrLanguage !== DEFAULT_FAN_FORM_LANGUAGE)
    qrQueryParams.push(`lang=${qrLanguage}`);

  if (selectedConcert) {
    // Permite que /api/public/fans guarde el concierto de origen real (concierto_origen_id)
    // en vez de depender solo del slug de la URL para adivinar el nombre.
    qrQueryParams.push(`concertId=${encodeURIComponent(selectedConcert.id)}`);
    qrQueryParams.push(
      `concertName=${encodeURIComponent(`${selectedConcert.sala} (${selectedConcert.ciudad})`)}`,
    );
  }

  const qrConcertUrl = `${rawDomain}${pathFormatted}${qrQueryParams.length ? `?${qrQueryParams.join("&")}` : ""}`;

  return { qrConcertUrl, selectedConcert, setUseCustomDomain, useCustomDomain, customDomain, setCustomDomain, routePrefix, setRoutePrefix, customSlug, setCustomSlug, setQrLanguage, qrLanguage };
}
