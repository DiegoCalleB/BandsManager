import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SupportedLanguage = 'es' | 'en' | 'ca' | 'gl' | 'eu';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ca', label: 'Català', flag: '🇦🇩' },
  { code: 'gl', label: 'Galego', flag: '🇪🇸' },
  { code: 'eu', label: 'Euskara', flag: '🇪🇸' },
];

// Dictionary of translations
export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    // Navigation
    'nav.resumen': 'Dashboard',
    'nav.booking': 'Escenarios',
    'nav.medios': 'Medios',
    'nav.management': 'Management',
    'nav.bandas': 'Grupos',
    'nav.calendario': 'Calendario',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'Dossier (EPK)',
    'nav.fans': 'Captura QR & Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertorios',
    'nav.ensayos': 'Ensayos',
    'nav.discografia': 'Discografía',
    'nav.chat': 'Agente Mánager',
    'nav.finanzas': 'Finanzas',
    'nav.merchan': 'Merchandising',

    // Headers & Labels
    'app.active_band': 'Banda activa',
    'app.switch_band': 'Cambiar de banda',
    'app.tools': 'Herramientas',
    'app.metronome': 'Metrónomo',
    'app.tuner': 'Afinador',
    'app.upgrade_plan': 'Mejorar Plan',
    'app.settings': 'Configuración',
    'app.profile': 'Perfil de Usuario',
    'app.logout': 'Cerrar Sesión',
    'app.language': 'Idioma',
    'app.theme': 'Tema Visual',

    // Actions
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.add': 'Añadir',
    'action.search': 'Buscar...',
    'action.filter': 'Filtrar',
    'action.close': 'Cerrar',
    'action.approve': 'Aprobar',
    'action.reject': 'Rechazar',
    'action.confirm': 'Confirmar',
    'action.loading': 'Cargando...',
    'action.export': 'Exportar',
    'action.import': 'Importar',

    // Statuses
    'status.nuevo': 'Nuevo',
    'status.pendiente_aprobacion': 'Pendiente Aprobación',
    'status.aprobado': 'Aprobado',
    'status.esperando_respuesta': 'Esperando Respuesta',
    'status.interesado': 'Interesado',
    'status.no_interesado': 'No Interesado',
    'status.negociando': 'Negociando',

    // General UI
    'general.no_data': 'Sin datos disponibles',
    'general.search_placeholder': 'Buscar sala, ciudad, contacto...',
    'general.welcome': '¡Bienvenido a BandManager.io!',
  },
  en: {
    // Navigation
    'nav.resumen': 'Overview',
    'nav.booking': 'Venues',
    'nav.medios': 'Media',
    'nav.management': 'Management',
    'nav.bandas': 'Bands',
    'nav.calendario': 'Calendar',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'EPK Dossier',
    'nav.fans': 'QR Capture & Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Setlists',
    'nav.ensayos': 'Rehearsals',
    'nav.discografia': 'Discography',
    'nav.chat': 'AI Manager Agent',
    'nav.finanzas': 'Finances',
    'nav.merchan': 'Merchandise',

    // Headers & Labels
    'app.active_band': 'Active Band',
    'app.switch_band': 'Switch Band',
    'app.tools': 'Tools',
    'app.metronome': 'Metronome',
    'app.tuner': 'Tuner',
    'app.upgrade_plan': 'Upgrade Plan',
    'app.settings': 'Settings',
    'app.profile': 'User Profile',
    'app.logout': 'Log Out',
    'app.language': 'Language',
    'app.theme': 'Visual Theme',

    // Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.add': 'Add',
    'action.search': 'Search...',
    'action.filter': 'Filter',
    'action.close': 'Close',
    'action.approve': 'Approve',
    'action.reject': 'Reject',
    'action.confirm': 'Confirm',
    'action.loading': 'Loading...',
    'action.export': 'Export',
    'action.import': 'Import',

    // Statuses
    'status.nuevo': 'New',
    'status.pendiente_aprobacion': 'Pending Approval',
    'status.aprobado': 'Approved',
    'status.esperando_respuesta': 'Awaiting Reply',
    'status.interesado': 'Interested',
    'status.no_interesado': 'Not Interested',
    'status.negociando': 'Negotiating',

    // General UI
    'general.no_data': 'No data available',
    'general.search_placeholder': 'Search venue, city, contact...',
    'general.welcome': 'Welcome to BandManager.io!',
  },
  ca: {
    // Navigation
    'nav.resumen': 'Resum',
    'nav.booking': 'Escenaris',
    'nav.medios': 'Mitjans',
    'nav.management': 'Management',
    'nav.bandas': 'Grups',
    'nav.calendario': 'Calendari',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'Dossier (EPK)',
    'nav.fans': 'Captura QR i Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertoris',
    'nav.ensayos': 'Assajos',
    'nav.discografia': 'Discografia',
    'nav.chat': 'Agent Mànager',
    'nav.finanzas': 'Finances',
    'nav.merchan': 'Merchandising',

    // Headers & Labels
    'app.active_band': 'Banda activa',
    'app.switch_band': 'Canviar de banda',
    'app.tools': 'Eines',
    'app.metronome': 'Metrònom',
    'app.tuner': 'Afinador',
    'app.upgrade_plan': 'Millorar Pla',
    'app.settings': 'Configuració',
    'app.profile': "Perfil d'Usuari",
    'app.logout': 'Tancar Sessió',
    'app.language': 'Idioma',
    'app.theme': 'Tema Visual',

    // Actions
    'action.save': 'Desar',
    'action.cancel': 'Cancel·lar',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.add': 'Afegir',
    'action.search': 'Cercar...',
    'action.filter': 'Filtrar',
    'action.close': 'Tancar',
    'action.approve': 'Aprovar',
    'action.reject': 'Rebutjar',
    'action.confirm': 'Confirmar',
    'action.loading': 'Carregant...',
    'action.export': 'Exportar',
    'action.import': 'Importar',

    // Statuses
    'status.nuevo': 'Nou',
    'status.pendiente_aprobacion': "Pendent d'Aprovació",
    'status.aprobado': 'Aprovat',
    'status.esperando_respuesta': 'Esperant Resposta',
    'status.interesado': 'Interessat',
    'status.no_interesado': 'No Interessat',
    'status.negociando': 'Negociant',

    // General UI
    'general.no_data': 'Sense dades disponibles',
    'general.search_placeholder': 'Cercar sala, ciutat, contacte...',
    'general.welcome': 'Benvingut a BandManager.io!',
  },
  gl: {
    // Navigation
    'nav.resumen': 'Resumo',
    'nav.booking': 'Escenarios',
    'nav.medios': 'Medios',
    'nav.management': 'Management',
    'nav.bandas': 'Grupos',
    'nav.calendario': 'Calendario',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'Dossier (EPK)',
    'nav.fans': 'Captura QR e Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertorios',
    'nav.ensayos': 'Ensaios',
    'nav.discografia': 'Discografía',
    'nav.chat': 'Axente Mánager',
    'nav.finanzas': 'Finanzas',
    'nav.merchan': 'Merchandising',

    // Headers & Labels
    'app.active_band': 'Banda activa',
    'app.switch_band': 'Mudar de banda',
    'app.tools': 'Ferramentas',
    'app.metronome': 'Metrónomo',
    'app.tuner': 'Afinador',
    'app.upgrade_plan': 'Mellorar Plan',
    'app.settings': 'Configuración',
    'app.profile': 'Perfil de Usuario',
    'app.logout': 'Cerrar Sesión',
    'app.language': 'Idioma',
    'app.theme': 'Tema Visual',

    // Actions
    'action.save': 'Gardar',
    'action.cancel': 'Cancelar',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.add': 'Engadir',
    'action.search': 'Buscar...',
    'action.filter': 'Filtrar',
    'action.close': 'Pechar',
    'action.approve': 'Aprobar',
    'action.reject': 'Rexeitar',
    'action.confirm': 'Confirmar',
    'action.loading': 'Cargando...',
    'action.export': 'Exportar',
    'action.import': 'Importar',

    // Statuses
    'status.nuevo': 'Novo',
    'status.pendiente_aprobacion': 'Pendente Aprobación',
    'status.aprobado': 'Aprobado',
    'status.esperando_respuesta': 'Agardando Resposta',
    'status.interesado': 'Interesado',
    'status.no_interesado': 'Non Interesado',
    'status.negociando': 'Negociando',

    // General UI
    'general.no_data': 'Sen datos dispoñibles',
    'general.search_placeholder': 'Buscar sala, cidade, contacto...',
    'general.welcome': 'Benvido a BandManager.io!',
  },
  eu: {
    // Navigation
    'nav.resumen': 'Laburpena',
    'nav.booking': 'Eszenatokiak',
    'nav.medios': 'Hedabideak',
    'nav.management': 'Management',
    'nav.bandas': 'Taldeak',
    'nav.calendario': 'Egutegia',
    'nav.giras': 'Bira Kudeatzailea',
    'nav.epk': 'Dosierra (EPK)',
    'nav.fans': 'QR Harrapaketa eta Zaleak',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Errepertorioak',
    'nav.ensayos': 'Entseguak',
    'nav.discografia': 'Diskografia',
    'nav.chat': 'AI Kudeatzaile Eragilea',
    'nav.finanzas': 'Finantzak',
    'nav.merchan': 'Merchandising-a',

    // Headers & Labels
    'app.active_band': 'Talde aktiboa',
    'app.switch_band': 'Taldea aldatu',
    'app.tools': 'Tresnak',
    'app.metronome': 'Metronomoa',
    'app.tuner': 'Afinagailua',
    'app.upgrade_plan': 'Plana hobetu',
    'app.settings': 'Ezarpenak',
    'app.profile': 'Erabiltzaile Profila',
    'app.logout': 'Saioa itxi',
    'app.language': 'Hizkuntza',
    'app.theme': 'Gai Bisuala',

    // Actions
    'action.save': 'Gorde',
    'action.cancel': 'Ezeztatu',
    'action.edit': 'Editatu',
    'action.delete': 'Ezabatu',
    'action.add': 'Gehitu',
    'action.search': 'Bilatu...',
    'action.filter': 'Iragazi',
    'action.close': 'Itxi',
    'action.approve': 'Onartu',
    'action.reject': 'Ezeztatu',
    'action.confirm': 'Berretsi',
    'action.loading': 'Kargatzen...',
    'action.export': 'Exportatu',
    'action.import': 'Importatu',

    // Statuses
    'status.nuevo': 'Berria',
    'status.pendiente_aprobacion': 'Onarpenaren zain',
    'status.aprobado': 'Onartua',
    'status.esperando_respuesta': 'Erantzunaren zain',
    'status.interesado': 'Interesatua',
    'status.no_interesado': 'Ez interesatua',
    'status.negociando': 'Negoziatzen',

    // General UI
    'general.no_data': 'Ez dago daturik eskuragarri',
    'general.search_placeholder': 'Bilatu aretoa, hiria, kontaktua...',
    'general.welcome': 'Ongi etorri BandManager.io-ra!',
  },
};

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
  isTranslating: boolean;
  refreshTranslation: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('bakandeya_language') as SupportedLanguage;
    if (saved && TRANSLATIONS[saved]) {
      return saved;
    }
    // Try browser language default
    const navLang = navigator.language.slice(0, 2).toLowerCase();
    if (navLang === 'ca' || navLang === 'gl' || navLang === 'eu' || navLang === 'en' || navLang === 'es') {
      return navLang as SupportedLanguage;
    }
    return 'es';
  });

  const [isTranslating, setIsTranslating] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bakandeya_language');
      return saved !== null && saved !== 'es';
    }
    return false;
  });

  // Helper to finish background translation seamlessly without flickering
  const finishTranslation = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('translating-in-background');
      document.body?.classList?.remove('translating-in-background');
    }
    setIsTranslating(false);
  };

  // Helper to trigger Google Translate Widget in the background
  const triggerGoogleTranslate = (targetLang: SupportedLanguage) => {
    if (typeof window === 'undefined') return;

    if (targetLang === 'es') {
      // Clear translation cookies & reset
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      if (window.location.hostname && window.location.hostname !== 'localhost') {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      }
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo && combo.value !== 'es') {
        combo.value = 'es';
        combo.dispatchEvent(new Event('change'));
      }
      finishTranslation();
      return;
    }

    // Entering background translation mode
    setIsTranslating(true);
    document.documentElement.classList.add('translating-in-background');

    // Set google translate cookie
    const cookieVal = `/es/${targetLang}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (window.location.hostname && window.location.hostname !== 'localhost') {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname}`;
    }

    let observer: MutationObserver | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;

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
      setTimeout(() => {
        finishTranslation();
      }, 60);
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
  };

  // Mount Google Translate Widget script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Callback for Google Translate
    (window as any).googleTranslateElementInit = () => {
      if ((window as any).google?.translate?.TranslateElement) {
        new (window as any).google.translate.TranslateElement(
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

    // Apply saved language if not default
    if (language !== 'es') {
      triggerGoogleTranslate(language);
    } else {
      finishTranslation();
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('bakandeya_language', lang);
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

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
