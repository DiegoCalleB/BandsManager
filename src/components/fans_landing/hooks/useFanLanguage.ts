/**
 * Idioma del formulario público, idiomas ofrecidos y traducción.
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useState } from "react";
import { useFanFormLanguage } from "../../../hooks/useFanFormLanguage";
import { FAN_FORM_LANGUAGES,FAN_FORM_TRANSLATIONS,FanFormLanguage,idiomasDisponiblesParaConcierto,interpolate } from "../../../i18n/fansTranslations";

type FanFormDictionary = (typeof FAN_FORM_TRANSLATIONS)[FanFormLanguage];

/** Traduce una clave del diccionario del formulario público, con variables opcionales. */
export type FanFormTranslate = (key: keyof FanFormDictionary, vars?: Record<string, string | undefined>) => string;

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FanLanguageParams {
  isPreview: boolean;
  previewLanguage: FanFormLanguage;
}

/**
 * Idioma del formulario público, idiomas ofrecidos y traducción.
 * @param params Estado y callbacks del contenedor ({@link FanLanguageParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFanLanguage({ isPreview, previewLanguage }: FanLanguageParams) {
  const [language, setLanguage] = useFanFormLanguage(
    isPreview ? previewLanguage : undefined,
  );

  // El idioma"del concierto": el que trae el QR (o el de la previsualización), capturado una
  // sola vez al montar. A propósito NO seguimos a `language` según el fan va tocando el
  // selector: si es-tiquetara"English" en un show en Praga, tomar ahí el ancla habría hecho
  // desaparecer el checo del selector (es/en da solo 2 idiomas). El idioma de fondo del
  // concierto se queda fijo; solo decide QUÉ 2-3 banderas se ofrecen, no cuál está activa.
  const [conciertoLanguage, setConciertoLanguage] = useState<FanFormLanguage>(
    () => language,
  );

  const availableLanguages = FAN_FORM_LANGUAGES.filter((l) =>
    idiomasDisponiblesParaConcierto(conciertoLanguage).includes(l.code),
  ).sort(
    (a, b) =>
      idiomasDisponiblesParaConcierto(conciertoLanguage).indexOf(a.code) -
      idiomasDisponiblesParaConcierto(conciertoLanguage).indexOf(b.code),
  );

  // Sincronizar idioma si se proporciona en modo preview
  useEffect(() => {
    if (isPreview && previewLanguage && previewLanguage !== language) {
      setLanguage(previewLanguage);
    }
    if (isPreview && previewLanguage && previewLanguage !== conciertoLanguage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el modo previsualización sincroniza el estado con las props de la app anfitriona
      setConciertoLanguage(previewLanguage);
    }
  }, [isPreview, previewLanguage]);

  const dict = FAN_FORM_TRANSLATIONS[language];
  const t: FanFormTranslate = (key, vars) => (vars ? interpolate(dict[key], vars) : dict[key]);

  return { dict, t, conciertoLanguage, language, setLanguage, availableLanguages };
}
