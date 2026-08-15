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
    'nav.resumen': 'Resumen',
    'nav.booking': 'Booking Salas',
    'nav.medios': 'Medios y Prensa',
    'nav.bandas': 'Grupos & Agencias',
    'nav.calendario': 'Calendario',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'Dossier (EPK)',
    'nav.fans': 'Base de Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertorio',
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
    'general.welcome': '¡Bienvenido a BandManager.ai!',
  },
  en: {
    // Navigation
    'nav.resumen': 'Overview',
    'nav.booking': 'Venue Booking',
    'nav.medios': 'Media & Press',
    'nav.bandas': 'Bands & Agencies',
    'nav.calendario': 'Calendar',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'EPK Dossier',
    'nav.fans': 'Fan Base',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertoire',
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
    'general.welcome': 'Welcome to BandManager.ai!',
  },
  ca: {
    // Navigation
    'nav.resumen': 'Resum',
    'nav.booking': 'Booking Sales',
    'nav.medios': 'Mitjans i Premsa',
    'nav.bandas': 'Grups i Agències',
    'nav.calendario': 'Calendari',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'Dossier (EPK)',
    'nav.fans': 'Base de Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertori',
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
    'app.profile': 'Perfil d\'Usuari',
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
    'status.pendiente_aprobacion': 'Pendent d\'Aprovació',
    'status.aprobado': 'Aprovat',
    'status.esperando_respuesta': 'Esperant Resposta',
    'status.interesado': 'Interessat',
    'status.no_interesado': 'No Interessat',
    'status.negociando': 'Negociant',

    // General UI
    'general.no_data': 'Sense dades disponibles',
    'general.search_placeholder': 'Cercar sala, ciutat, contacte...',
    'general.welcome': 'Benvingut a BandManager.ai!',
  },
  gl: {
    // Navigation
    'nav.resumen': 'Resumo',
    'nav.booking': 'Booking Salas',
    'nav.medios': 'Módulos e Prensa',
    'nav.bandas': 'Grupos e Axencias',
    'nav.calendario': 'Calendario',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'Dossier (EPK)',
    'nav.fans': 'Base de Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertorio',
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
    'general.welcome': 'Benvido a BandManager.ai!',
  },
  eu: {
    // Navigation
    'nav.resumen': 'Laburpena',
    'nav.booking': 'Atoien Booking-a',
    'nav.medios': 'Hedabideak eta Prentsa',
    'nav.bandas': 'Taldeak eta Agentziak',
    'nav.calendario': 'Egutegia',
    'nav.giras': 'Bira Kudeatzailea',
    'nav.epk': 'Dosierra (EPK)',
    'nav.fans': 'Zaleen Oinarria',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Errepertorioa',
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
    'general.welcome': 'Ongi etorri BandManager.ai-ra!',
  },
};

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
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

  // Helper to trigger Google Translate Widget
  const triggerGoogleTranslate = (targetLang: SupportedLanguage) => {
    if (typeof window === 'undefined') return;

    // Set google translate cookie
    const cookieVal = `/es/${targetLang}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (window.location.hostname && window.location.hostname !== 'localhost') {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname}`;
    }

    const selectCombo = () => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo) {
        combo.value = targetLang;
        combo.dispatchEvent(new Event('change'));
        return true;
      }
      return false;
    };

    if (!selectCombo()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (selectCombo() || attempts > 15) {
          clearInterval(interval);
        }
      }, 300);
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
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('bakandeya_language', lang);
    triggerGoogleTranslate(lang);
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
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
