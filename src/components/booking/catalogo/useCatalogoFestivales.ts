import { useCallback, useEffect, useState } from 'react';
import { anadirFestivalDelDirectorio, buscarFestivalesDelDirectorio, type FestivalDelDirectorio } from '../../../services/apiCatalogo';

export interface FiltrosFestivalesUi {
  texto: string;
  lugar: string;
  soloConConvocatoria: boolean;
}

const INICIALES: FiltrosFestivalesUi = { texto: '', lugar: '', soloConConvocatoria: false };
const ESPERA_MS = 300;

/** Festivales del directorio: búsqueda y alta en la agenda de la banda. */
export function useCatalogoFestivales(activo: boolean) {
  const [filtros, setFiltros] = useState<FiltrosFestivalesUi>(INICIALES);
  const [datos, setDatos] = useState<{ total: number; festivales: FestivalDelDirectorio[] } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [intento, setIntento] = useState(0);
  const [anadiendo, setAnadiendo] = useState<ReadonlySet<string>>(new Set());
  const [errorAlta, setErrorAlta] = useState<string | null>(null);

  useEffect(() => {
    if (!activo) return;
    const control = new AbortController();
    const temporizador = setTimeout(() => {
      setCargando(true);
      setFallo(false);
      buscarFestivalesDelDirectorio(filtros, control.signal)
        .then(setDatos)
        .catch((e: unknown) => {
          if ((e as { name?: string })?.name !== 'AbortError') setFallo(true);
        })
        .finally(() => {
          if (!control.signal.aborted) setCargando(false);
        });
    }, ESPERA_MS);
    return () => {
      clearTimeout(temporizador);
      control.abort();
    };
  }, [activo, filtros, intento]);

  const cambiar = useCallback((cambio: Partial<FiltrosFestivalesUi>) => setFiltros((f) => ({ ...f, ...cambio })), []);
  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  const anadir = useCallback(async (slug: string) => {
    setErrorAlta(null);
    setAnadiendo((s) => new Set(s).add(slug));
    try {
      const r = await anadirFestivalDelDirectorio(slug);
      if (r.ok || r.yaEnAgenda) {
        setDatos((d) => (d ? { ...d, festivales: d.festivales.map((f) => (f.slug === slug ? { ...f, ya_en_agenda: true } : f)) } : d));
        if (r.ok) window.dispatchEvent(new CustomEvent('app-data-updated'));
      } else setErrorAlta(r.error ?? 'No se pudo añadir el festival.');
    } finally {
      setAnadiendo((s) => {
        const resto = new Set(s);
        resto.delete(slug);
        return resto;
      });
    }
  }, []);

  return { filtros, cambiar, datos, cargando, fallo, reintentar, anadir, anadiendo, errorAlta };
}
