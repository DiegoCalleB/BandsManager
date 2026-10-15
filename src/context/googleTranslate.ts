import type { SupportedLanguage } from './idioma';

/** Lo que el widget de Google Translate cuelga de `window` (script externo, sin tipos propios). */
interface VentanaConTraductor {
  googleTranslateElementInit?: () => void;
  google?: {
    translate?: {
      TranslateElement?: new (
        opciones: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
        idElemento: string,
      ) => unknown;
    };
  };
}

const CLASE_TRADUCIENDO = 'translating-in-background';

/** Quita del documento la marca de "traduciendo en segundo plano". */
export function quitarMarcaDeTraduccion(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove(CLASE_TRADUCIENDO);
  document.body?.classList?.remove(CLASE_TRADUCIENDO);
}

function fijarCookie(valor: string, caducada = false): void {
  const caduca = caducada ? ' expires=Thu, 01 Jan 1970 00:00:00 UTC;' : '';
  document.cookie = `googtrans=${valor};${caduca} path=/;`;
  if (window.location.hostname && window.location.hostname !== 'localhost') {
    document.cookie = `googtrans=${valor};${caduca} path=/; domain=${window.location.hostname}`;
  }
}

/**
 * Pide a Google Translate (en segundo plano) el idioma indicado y avisa con `alTerminar` cuando la
 * traducción se ha aplicado o vence el temporizador de seguridad. Con `es` restaura el original y
 * avisa al instante. No toca estado de React: eso lo hace quien llama en `alTerminar`.
 */
export function traducirConGoogle(targetLang: SupportedLanguage, alTerminar: () => void): void {
  if (typeof window === 'undefined') return;

  if (targetLang === 'es') {
    fijarCookie('', true);
    const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (combo && combo.value !== 'es') {
      combo.value = 'es';
      combo.dispatchEvent(new Event('change'));
    }
    alTerminar();
    return;
  }

  document.documentElement.classList.add(CLASE_TRADUCIENDO);
  fijarCookie(`/es/${targetLang}`);

  let observer: MutationObserver | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanupAndReveal = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    // Small buffer to ensure browser paint is finished with translated DOM
    setTimeout(alTerminar, 60);
  };

  // Watch DOM for translation completion (Google Translate wraps translated nodes in <font> or marks html/body)
  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (
          document.documentElement.classList.contains('translated-ltr') ||
          document.documentElement.classList.contains('translated-rtl') ||
          document.querySelector('font[style]') !== null ||
          (m.target as HTMLElement)?.nodeName === 'FONT'
        ) {
          cleanupAndReveal();
          break;
        }
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  // Safety maximum timeout so UI never gets stuck
  fallbackTimer = setTimeout(() => {
    cleanupAndReveal();
  }, 450);

  const selectCombo = () => {
    // Sin document (pestaña cerrándose, tests ya terminados) no hay nada que buscar.
    if (typeof document === 'undefined') return true;
    const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (combo) {
      if (combo.value !== targetLang) {
        combo.value = targetLang;
        combo.dispatchEvent(new Event('change'));
      }
      return true;
    }
    return false;
  };

  if (!selectCombo()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (selectCombo() || attempts > 12) {
        clearInterval(interval);
      }
    }, 150);
  }
}

/** Inserta (una sola vez) el contenedor y el script del widget de Google Translate. */
export function montarWidgetDeGoogle(): void {
  if (typeof window === 'undefined') return;

  // Callback for Google Translate
  const ventana = window as Window & VentanaConTraductor;
  ventana.googleTranslateElementInit = () => {
    const TranslateElement = ventana.google?.translate?.TranslateElement;
    if (TranslateElement) {
      new TranslateElement(
        {
          pageLanguage: 'es',
          includedLanguages: 'es,en,ca,gl,eu,fr,de,it,pt',
          autoDisplay: false,
        },
        'google_translate_element'
      );
    }
  };

  // Ensure target div element exists
  if (!document.getElementById('google_translate_element')) {
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);
  }

  // Append script if not loaded
  if (!document.getElementById('google-translate-script')) {
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }
}
