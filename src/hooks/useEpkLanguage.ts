import { useState, useCallback, useEffect } from 'react';
import { EpkLanguage, DEFAULT_EPK_LANGUAGE, isEpkLanguage } from '../i18n/epkTranslations';

/**
 * Determina el idioma del EPK público:
 * 1. Parámetro ?lang= en la URL (lo pone el agente Redactor al meter el enlace en el pitch,
 *    según el país del lead — ver server/utils/leadLanguage.ts).
 * 2. Idioma del navegador de quien abre la página, si es uno de los soportados.
 * 3. Español por defecto.
 */
function detectarIdiomaInicial(): EpkLanguage {
  if (typeof window === 'undefined') return DEFAULT_EPK_LANGUAGE;

  const params = new URLSearchParams(window.location.search);
  const queryLang = params.get('lang');
  if (isEpkLanguage(queryLang)) return queryLang;

  const idiomaNavegador = (navigator.language || '').slice(0, 2).toLowerCase();
  if (isEpkLanguage(idiomaNavegador)) return idiomaNavegador;

  return DEFAULT_EPK_LANGUAGE;
}

/**
 * A diferencia de useFanFormLanguage, este hook SÍ reescribe ?lang= en la URL al cambiar de
 * idioma. El EPK es un enlace que se reenvía por correo entre programadores: si un inglés
 * cambia a su idioma y pasa el enlace a un compañero, el compañero tiene que abrirlo igual.
 * También mantiene <html lang> al día, que es lo que leen lectores de pantalla y buscadores.
 */
export function useEpkLanguage(): [EpkLanguage, (lang: EpkLanguage) => void] {
  const [language, setLanguageState] = useState<EpkLanguage>(detectarIdiomaInicial);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: EpkLanguage) => {
    setLanguageState(lang);
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Si el navegador bloquea replaceState (iframe sandbox, por ejemplo) el idioma sigue
      // cambiando en pantalla: solo se pierde que quede reflejado en la URL.
    }
  }, []);

  return [language, setLanguage];
}
