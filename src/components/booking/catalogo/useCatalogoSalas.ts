import { useCallback, useEffect, useState } from 'react';
import { anadirSalaDelCatalogo, buscarSalasDelCatalogo, cargarFichaDeSala, cargarMapaDelCatalogo, type ResultadoDelCatalogo, type ResultadoMapa, type SalaDelCatalogo } from '../../../services/apiCatalogo';

export interface FiltrosUi {
  texto: string;
  lugar: string;
  tipo: string;
  conContacto: boolean;
  /** Rango de aforo; vacío = sin límite por ese lado. */
  aforoMin: string;
  aforoMax: string;
}

export type VistaCatalogo = 'lista' | 'mapa';

export const FILTROS_INICIALES: FiltrosUi = { texto: '', lugar: '', tipo: '', conContacto: false, aforoMin: '', aforoMax: '' };
const ESPERA_MS = 300;

const esAborto = (e: unknown) => (e as { name?: string })?.name === 'AbortError';

/** Pide algo al servidor al cambiar los filtros (con un respiro) y descarta la respuesta anterior si llega tarde. */
function useConsultaCatalogo<T>(activa: boolean, filtros: FiltrosUi, intento: number, pedir: (f: FiltrosUi, signal: AbortSignal) => Promise<T>) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    if (!activa) return;
    const control = new AbortController();
    const temporizador = setTimeout(() => {
      setCargando(true);
      setFallo(false);
      pedir(filtros, control.signal)
        .then(setDatos)
        .catch((e: unknown) => {
          if (!esAborto(e)) setFallo(true);
        })
        .finally(() => {
          if (!control.signal.aborted) setCargando(false);
        });
    }, ESPERA_MS);
    return () => {
      clearTimeout(temporizador);
      control.abort();
    };
    // `pedir` es siempre la misma función del módulo: lo que cambia la consulta son los filtros.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa, filtros, intento]);

  return { datos, setDatos, cargando, fallo };
}

/** Explorar el catálogo: lista o mapa, ficha de cada sala y alta en la agenda de la banda. */
export function useCatalogoSalas(abierto: boolean, vista: VistaCatalogo = 'lista') {
  const [filtros, setFiltros] = useState<FiltrosUi>(FILTROS_INICIALES);
  const [intento, setIntento] = useState(0);
  const [anadiendo, setAnadiendo] = useState<ReadonlySet<string>>(new Set());
  const [errorAlta, setErrorAlta] = useState<string | null>(null);
  const [ficha, setFicha] = useState<SalaDelCatalogo | null>(null);
  const [abriendoFicha, setAbriendoFicha] = useState(false);

  const lista = useConsultaCatalogo<ResultadoDelCatalogo>(abierto && vista === 'lista', filtros, intento, (f, signal) => buscarSalasDelCatalogo(f, signal));
  const mapa = useConsultaCatalogo<ResultadoMapa>(abierto && vista === 'mapa', filtros, intento, (f, signal) => cargarMapaDelCatalogo(f, signal));

  const cambiar = useCallback((cambio: Partial<FiltrosUi>) => setFiltros((f) => ({ ...f, ...cambio })), []);
  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const cerrarFicha = useCallback(() => setFicha(null), []);

  /** Desde la lista la ficha ya está; desde el mapa solo se conoce el punto y se pide al servidor. */
  const abrirFicha = useCallback(async (sala: SalaDelCatalogo | string) => {
    setErrorAlta(null);
    if (typeof sala !== 'string') return setFicha(sala);
    setAbriendoFicha(true);
    try {
      const f = await cargarFichaDeSala(sala);
      if (f) setFicha(f);
      else setErrorAlta('Esa sala ya no está disponible en el catálogo.');
    } catch {
      setErrorAlta('No hemos podido abrir la ficha. Prueba otra vez.');
    } finally {
      setAbriendoFicha(false);
    }
  }, []);

  const marcarEnAgenda = (salaId: string) => {
    lista.setDatos((r) => (r ? { ...r, salas: r.salas.map((s) => (s.id === salaId ? { ...s, ya_en_agenda: true } : s)) } : r));
    mapa.setDatos((r) => (r ? { ...r, puntos: r.puntos.map((p) => (p.id === salaId ? { ...p, ya_en_agenda: true } : p)) } : r));
    setFicha((f) => (f?.id === salaId ? { ...f, ya_en_agenda: true } : f));
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    filtros, cambiar, reintentar, anadir, anadiendo, errorAlta,
    resultado: lista.datos, cargando: lista.cargando, fallo: lista.fallo,
    mapa: mapa.datos, cargandoMapa: mapa.cargando, falloMapa: mapa.fallo,
    ficha, abrirFicha, cerrarFicha, abriendoFicha,
  };
}
