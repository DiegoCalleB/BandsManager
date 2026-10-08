import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { guardarCookieDeSesion, borrarCookieDeSesion } from '../utils/sessionCookie';
import { syncAllUserPreferencesFromUser } from '../utils/userPreferences';
import { atribuirReferidoPendiente } from '../utils/referido';
import { atribuirReferido } from '../utils/promocionApi';

/** Sesión del usuario: estado persistido en `localStorage` (`bakandeya_user`), login y logout. */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('bakandeya_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        syncAllUserPreferencesFromUser(parsed);
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('bakandeya_token') || null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('bakandeya_token') || localStorage.getItem('bakandeya_logged_in') === 'true';
  });

  const [availableBands, setAvailableBands] = useState<any[]>(() => {
    try {
      const savedBands = localStorage.getItem('bakandeya_available_bands');
      return savedBands ? JSON.parse(savedBands) : [];
    } catch (e) {
      return [];
    }
  });

  const isAdmin = Boolean(currentUser && (currentUser.role === 'leader' || currentUser.role === 'admin'));

  // Set 30-day cookie helper
  const syncSessionCookie = useCallback((token: string) => {
    guardarCookieDeSesion(token);
  }, []);

  // Silent session refresh function
  const refreshSession = useCallback(async () => {
    const tokenToUse = authToken || localStorage.getItem('bakandeya_token');
    if (!tokenToUse) return;

    try {
      const data = await api.verifyMe();
      if (data && data.user) {
        setCurrentUser(data.user);
        setAvailableBands(data.availableBands || []);
        localStorage.setItem('bakandeya_user', JSON.stringify(data.user));
        syncAllUserPreferencesFromUser(data.user);
        localStorage.setItem('bakandeya_available_bands', JSON.stringify(data.availableBands || []));
        if (data.token) {
          setAuthToken(data.token);
          localStorage.setItem('bakandeya_token', data.token);
          syncSessionCookie(data.token);
        } else {
          syncSessionCookie(tokenToUse);
        }
        setIsLoggedIn(true);
      }
    } catch (err: any) {
      console.warn('Silent session refresh skipped or offline:', err?.message || err);
      // Un 401 real solo puede venir de una respuesta del servidor, así que nunca coincide con
      // estar offline (sin red, el fetch falla con un error de red, no con un 401). Antes ambas
      // condiciones se comprobaban juntas y el caso "offline" quedaba inalcanzable; y cualquier
      // fallo que NO fuera un 401 explícito (500, CORS, timeout) no hacía nada: la sesión seguía
      // marcada como activa con datos potencialmente obsoletos, sin avisar de que algo falló.
      const isExplicit401 =
        err?.status === 401 ||
        err?.message?.includes('401') ||
        err?.message?.includes('no autorizable') ||
        err?.message?.includes('no válida');
      if (isExplicit401) {
        // El servidor rechazó la sesión de forma explícita: cerrarla siempre.
        setCurrentUser(null);
        setAuthToken(null);
        setIsLoggedIn(false);
        localStorage.removeItem('bakandeya_token');
        localStorage.removeItem('bakandeya_user');
        localStorage.removeItem('bakandeya_logged_in');
        localStorage.removeItem('bakandeya_available_bands');
        try {
          borrarCookieDeSesion();
        } catch (e) {}
      } else if (!navigator.onLine) {
        // Fallo de red real por estar offline: mantener la sesión en caché activa (móvil sin cobertura).
        const savedUserStr = localStorage.getItem('bakandeya_user');
        if (savedUserStr) {
          try {
            setCurrentUser(JSON.parse(savedUserStr));
            setIsLoggedIn(true);
          } catch (e) {}
        }
      }
      // Online pero con un fallo no-401 (500, CORS, timeout...): no forzamos el cierre de sesión
      // por un error transitorio del servidor, pero tampoco lo ocultamos (ver console.warn arriba).
    }
  }, [authToken, syncSessionCookie]);

  // Las preferencias de interfaz (p. ej. la disposición del dashboard) se guardan desde los
  // componentes: aquí se reflejan en el usuario en memoria para que no reaparezca la versión antigua.
  useEffect(() => {
    const onPrefsSaved = (e: Event) => {
      const prefs = (e as CustomEvent).detail;
      if (!prefs || typeof prefs !== 'object') return;
      setCurrentUser((prev) =>
        prev ? { ...prev, ui_preferences: { ...(prev.ui_preferences || {}), ...prefs } } : prev
      );
    };
    window.addEventListener('bm:ui-preferences-saved', onPrefsSaved);
    return () => window.removeEventListener('bm:ui-preferences-saved', onPrefsSaved);
  }, []);

  // Initial verification on mount
  useEffect(() => {
    if (authToken) {
      syncSessionCookie(authToken);
      refreshSession();
    }
  }, [authToken, refreshSession, syncSessionCookie]);

  // Periodic silent background refresh (every 15 mins) & mobile app resume
  useEffect(() => {
    if (!isLoggedIn || !authToken) return;

    // Refresh every 15 minutes in background
    const intervalId = setInterval(
      () => {
        refreshSession();
      },
      15 * 60 * 1000
    );

    // Refresh on page focus / tab switch (mobile phone unlock)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isLoggedIn, authToken, refreshSession]);

  // Una banda recién registrada que llegó por una invitación (?ref=) se atribuye a quien la invitó.
  // El servidor decide (solo altas recientes, la primera atribución manda); aquí se envía una vez.
  useEffect(() => {
    if (!isLoggedIn || !authToken) return;
    void atribuirReferidoPendiente((codigo) => atribuirReferido(codigo));
  }, [isLoggedIn, authToken]);

  const handleLoginSuccess = useCallback(
    (user: User, token: string, bandsList?: any[]) => {
      // If the user has a designated main_band_id or preferred band, ensure the active band matches it on login.
      // Antes, si no había ninguna banda preferida, se caía en'band-bakandeya' en silencio: una
      // cuenta nueva sin banda todavía asignada entraba viendo los datos reales de esa banda. Sin
      // banda preferida, dejamos band_id sin normalizar y que el resto de la app pida elegir/crear
      // una banda en vez de asumir una por defecto.
      const preferredBandId =
        user.main_band_id || (Array.isArray(user.band_order) && user.band_order.length > 0 ? user.band_order[0] : null) || user.band_id;

      const normalizedBandId = preferredBandId
        ? preferredBandId.startsWith('band-') || preferredBandId.startsWith('reg-')
          ? preferredBandId
          : `band-${preferredBandId}`
        : undefined;

      const resolvedUser: User = {
        ...user,
        band_id: normalizedBandId,
        main_band_id: user.main_band_id || normalizedBandId,
      };

      // If availableBands list is provided, synchronize band name & plan with the active main band
      if (bandsList && Array.isArray(bandsList) && bandsList.length > 0) {
        const cleanPref = normalizedBandId.replace(/^(band|reg)-/, '');
        const match = bandsList.find(
          (b: any) =>
            b.band_id === normalizedBandId ||
            b.id === normalizedBandId ||
            (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanPref) ||
            (b.id && b.id.replace(/^(band|reg)-/, '') === cleanPref)
        );
        if (match) {
          resolvedUser.bandName = match.bandName || match.nombre_banda || match.name || resolvedUser.bandName;
          if (match.plan) {
            resolvedUser.plan = match.plan;
          }
        }
      }

      setCurrentUser(resolvedUser);
      setAuthToken(token);
      syncSessionCookie(token);
      if (bandsList) {
        setAvailableBands(bandsList);
        localStorage.setItem('bakandeya_available_bands', JSON.stringify(bandsList));
      }
      localStorage.setItem('bakandeya_token', token);
      localStorage.setItem('bakandeya_user', JSON.stringify(resolvedUser));
      syncAllUserPreferencesFromUser(resolvedUser);
      localStorage.setItem('bakandeya_remember_me', 'true');
      localStorage.setItem('bakandeya_logged_in', 'true');
      localStorage.setItem('bandmanager_registered_user', 'true');
      setIsLoggedIn(true);
    },
    [syncSessionCookie]
  );

  const handleSwitchBand = useCallback(
    async (band_id: string) => {
      const tokenToUse = authToken || localStorage.getItem('bakandeya_token');
      const response = await fetch('/api/auth/switch-band', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
        },
        body: JSON.stringify({ band_id }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar de banda');
      }

      if (data.token) {
        setAuthToken(data.token);
        localStorage.setItem('bakandeya_token', data.token);
        syncSessionCookie(data.token);
      }
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('bakandeya_user', JSON.stringify(data.user));
      }
      if (data.availableBands) {
        setAvailableBands(data.availableBands);
        localStorage.setItem('bakandeya_available_bands', JSON.stringify(data.availableBands));
      }
      return data.user;
    },
    [authToken, syncSessionCookie]
  );

  const handleSetMainBand = useCallback(async (band_id: string) => {
    const res = await api.setMainBand(band_id);
    if (res.user) {
      setCurrentUser(res.user);
      localStorage.setItem('bakandeya_user', JSON.stringify(res.user));
    }
    if (res.availableBands) {
      setAvailableBands(res.availableBands);
      localStorage.setItem('bakandeya_available_bands', JSON.stringify(res.availableBands));
    }
    return res.user;
  }, []);

  const handleLogout = useCallback(async () => {
    if (authToken) {
      try {
        await api.logout(authToken);
      } catch (e) {
        console.error('Error logging out on server:', e);
      }
    }
    setCurrentUser(null);
    setAuthToken(null);
    setAvailableBands([]);
    setIsLoggedIn(false);
    localStorage.removeItem('bakandeya_token');
    localStorage.removeItem('bakandeya_user');
    localStorage.removeItem('bakandeya_logged_in');
    localStorage.removeItem('bakandeya_available_bands');
    try {
      borrarCookieDeSesion();
    } catch (e) {}
  }, [authToken]);

  return {
    currentUser,
    authToken,
    isLoggedIn,
    isAdmin,
    availableBands,
    setCurrentUser,
    refreshSession,
    handleLoginSuccess,
    handleSwitchBand,
    handleSetMainBand,
    handleLogout,
  };
}
