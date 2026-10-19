import React, { useCallback, useEffect, useEffectEvent, useState, ReactNode } from 'react';
import { LanguageContext, TRANSLATIONS, type SupportedLanguage } from './idioma';
import { idiomaSugerido } from '../utils/idiomaNavegador';
import { montarWidgetDeGoogle, quitarMarcaDeTraduccion, traducirConGoogle } from './googleTranslate';

/** Idioma guardado, si no el del navegador (si está soportado) y si no el sugerido: inglés fuera del español, español sin información. */
function idiomaInicial(): SupportedLanguage {
  // /en es la landing en inglés: manda la URL sobre lo guardado, para que lo que ve Google coincida.
  if (window.location.pathname.replace(/\/+$/, '').toLowerCase() === '/en') return 'en';
  const saved = localStorage.getItem('bandmanager_language') as SupportedLanguage | null;
  if (saved && TRANSLATIONS[saved]) {
    return saved;
  }
  // Idioma del navegador: el primero de la lista de preferencias (un japonés con ['ja', 'en-US'] no debe ver español).
  const preferidos = navigator.languages?.length ? navigator.languages : [navigator.language];
  const navLang = String(preferidos[0] ?? '').slice(0, 2).toLowerCase();
  if (navLang === 'ca' || navLang === 'gl' || navLang === 'eu' || navLang === 'en' || navLang === 'es') {
    return navLang as SupportedLanguage;
  }
  return idiomaSugerido(preferidos);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(idiomaInicial);

  // Fuera del español la página arranca ya traduciéndose (el efecto de montaje lanza la traducción).
  const [isTranslating, setIsTranslating] = useState<boolean>(() => idiomaInicial() !== 'es');

  // Helper to finish background translation seamlessly without flickering
  const finishTranslation = useCallback(() => {
    quitarMarcaDeTraduccion();
    setIsTranslating(false);
  }, []);

  // Helper to trigger Google Translate Widget in the background
  const triggerGoogleTranslate = (targetLang: SupportedLanguage) => {
    if (typeof window === 'undefined') return;
    // Entering background translation mode
    if (targetLang !== 'es') setIsTranslating(true);
    traducirConGoogle(targetLang, finishTranslation);
  };

  // Aplica el idioma ya elegido al montar. Es un evento de efecto: lee `language` actual sin
  // convertirlo en dependencia (el efecto solo debe correr una vez).
  const aplicarIdiomaAlMontar = useEffectEvent(() => {
    // El estado inicial ya refleja el idioma (traduciendo si no es español): solo falta el DOM.
    if (language !== 'es') {
      traducirConGoogle(language, finishTranslation);
    } else {
      quitarMarcaDeTraduccion();
    }
  });

  // Mount Google Translate Widget script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    montarWidgetDeGoogle();
    aplicarIdiomaAlMontar();
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('bandmanager_language', lang);
    triggerGoogleTranslate(lang);
  };

  const refreshTranslation = () => {
    if (language !== 'es') {
      triggerGoogleTranslate(language);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const dict = TRANSLATIONS[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to Spanish dictionary
    if (TRANSLATIONS['es'][key]) {
      return TRANSLATIONS['es'][key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isTranslating, refreshTranslation }}>{children}</LanguageContext.Provider>
  );
}
