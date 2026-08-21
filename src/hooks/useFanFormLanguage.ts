import { useState } from 'react';
import { FanFormLanguage, DEFAULT_FAN_FORM_LANGUAGE, isFanFormLanguage } from '../i18n/fansTranslations';

/**
 * Determina el idioma inicial del formulario público "Únete":
 * 1. Parámetro ?lang= en la URL (lo fija el manager al generar el QR de un concierto concreto).
 * 2. Idioma del navegador del fan, si es uno de los soportados.
 * 3. Español por defecto.
 * El fan puede cambiarlo a mano en cualquier momento con el selector.
 */
function detectInitialFanFormLanguage(): FanFormLanguage {
  if (typeof window === 'undefined') return DEFAULT_FAN_FORM_LANGUAGE;

  const params = new URLSearchParams(window.location.search);
  const queryLang = params.get('lang');
  if (isFanFormLanguage(queryLang)) return queryLang;

  const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
  if (isFanFormLanguage(browserLang)) return browserLang;

  return DEFAULT_FAN_FORM_LANGUAGE;
}

export function useFanFormLanguage(): [FanFormLanguage, (lang: FanFormLanguage) => void] {
  const [language, setLanguage] = useState<FanFormLanguage>(detectInitialFanFormLanguage);
  return [language, setLanguage];
}
