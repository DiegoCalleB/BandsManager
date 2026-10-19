import { useCallback, useEffect, useState } from 'react';
import { anadirSalaDelCatalogo, buscarSalasDelCatalogo, type ResultadoDelCatalogo } from '../../../services/apiCatalogo';

export interface FiltrosUi {
  texto: string;
  lugar: string;
  tipo: string;
  conContacto: boolean;
}

export const FILTROS_INICIALES: FiltrosUi = { texto: '', lugar: '', tipo: '', conContacto: false };
const ESPERA_MS = 300;

/** Explorar el catálogo: busca al escribir (con un respiro) y deja añadir cada sala a la agenda de la banda. */
export function useCatalogoSalas(abierto: boolean) {
  const [filtros, setFiltros] = useState<FiltrosUi>(FILTROS_INICIALES);
  const [resultado, setResultado] = useState<ResultadoDelCatalogo | null>(null);
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [intento, setIntento] = useState(0);
  const [anadiendo, setAnadiendo] = useState<ReadonlySet<string>>(new Set());
  const [errorAlta, setErrorAlta] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    const control = new AbortController();
    const temporizador = setTimeout(() => {
      setCargando(true);
      setFallo(false);
      buscarSalasDelCatalogo(filtros, control.signal)
        .then(setResultado)
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
  }, [abierto, filtros, intento]);

  const cambiar = useCallback((cambio: Partial<FiltrosUi>) => setFiltros((f) => ({ ...f, ...cambio })), []);
  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  const marcarEnAgenda = (salaId: string) =>
    setResultado((r) => (r ? { ...r, salas: r.salas.map((s) => (s.id === salaId ? { ...s, ya_en_agenda: true } : s)) } : r));

  const anadir = useCallback(async (salaId: string) => {
    setErrorAlta(null);
    setAnadiendo((s) => new Set(s).add(salaId));
    try {
      const r = await anadirSalaDelCatalogo(salaId);
      if (r.ok || r.yaEnAgenda) {
        marcarEnAgenda(salaId);
        // La agenda de la banda se recarga sola con este aviso (el mismo que usa el resto del CRM).
        if (r.ok) window.dispatchEvent(new CustomEvent('app-data-updated'));
      } else {
        setErrorAlta(r.error ?? 'No se pudo añadir la sala.');
      }
    } finally {
      setAnadiendo((s) => {
        const resto = new Set(s);
        resto.delete(salaId);
        return resto;
      });
    }
  }, []);

  return { filtros, cambiar, resultado, cargando, fallo, reintentar, anadir, anadiendo, errorAlta };
}
