import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { Concert } from '../../../types';
import { FORMATOS, ORDEN_FORMATOS, type FormatoCartel } from '../../../utils/cartel/formatos';
import { bandasDelBolo, conciertosParaCartel, datosDesdeConcierto, esCompartido } from '../../../utils/cartel/datos';
import {
  canvasABlob,
  compartirODescargar,
  descargarBlob,
  nombreArchivo,
  renderCartel,
  type FondoCartel,
  type PiezasCartel,
} from '../../../utils/cartel/render';
import { crearEnlace, generarFondoCartel, type EstiloCartel } from '../../../utils/promocionApi';
import { lineaHorario } from '../../../utils/cartel/texto';

/** Lo que la persona decide por bolo (la cabeza de cartel de un bolo no vale para otro). */
export interface AjustesBolo {
  cabeza: string | null;
  extra: string;
  horario: boolean;
  qr: boolean;
  marca: boolean;
}

export const AJUSTES_INICIALES: AjustesBolo = { cabeza: null, extra: '', horario: true, qr: true, marca: true };
const FONDO_INICIAL: FondoCartel = { tipo: 'paleta', id: 'noche' };
const MAX_FONDOS_IA = 3;
const MAX_FOTO_BYTES = 15 * 1024 * 1024;

const hoyMadrid = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);

export interface EnlaceCartel {
  /** URL completa (la del QR). */
  url: string;
  /** Sin protocolo, para imprimir debajo: `bandmanager.io/r/ab3k9x2`. */
  corta: string;
}

interface Params {
  /** Lienzo de la vista previa. Lo crea la vista: devolverlo desde aquí hace que React trate todo el objeto como un ref. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  concerts: Concert[];
  bandName: string;
  initialConcertId?: string;
  /** Si el plan permite quitar la marca BandManager. */
  puedeQuitarMarca?: boolean;
}

export function useEditorCartel({ canvasRef, concerts, bandName, initialConcertId, puedeQuitarMarca = false }: Params) {
  const opciones = useMemo(() => conciertosParaCartel(concerts, hoyMadrid()), [concerts]);
  const [concertId, setConcertId] = useState(initialConcertId ?? '');
  const concierto = opciones.find((c) => c.id === concertId) ?? opciones[0] ?? null;

  const [formato, setFormato] = useState<FormatoCartel>('feed');
  const [fondo, setFondo] = useState<FondoCartel>(FONDO_INICIAL);
  const [foto, setFoto] = useState<string | null>(null);
  const [fondosIa, setFondosIa] = useState<Record<string, string[]>>({});
  const [ajustesPorBolo, setAjustesPorBolo] = useState<Record<string, AjustesBolo>>({});
  const [generando, setGenerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [enlaces, setEnlaces] = useState<Record<string, EnlaceCartel | null>>({});
  const ajustes = (concierto && ajustesPorBolo[concierto.id]) || AJUSTES_INICIALES;
  const enlace = (concierto && enlaces[concierto.id]) || null;
  const conciertoId = concierto?.id;

  // Enlace corto del cartel: canal «cartel», a la página del bolo. El servidor lo reutiliza si ya
  // existe, así que sus escaneos se suman en la campaña del bolo. Sin enlace, el cartel sale sin QR.
  useEffect(() => {
    if (!conciertoId || conciertoId in enlaces) return;
    let vigente = true;
    crearEnlace({ concertId: conciertoId, destino: 'concierto', canal: 'cartel' })
      .then((r) => {
        if (vigente) setEnlaces((p) => ({ ...p, [conciertoId]: { url: r.url, corta: r.url.replace(/^https?:\/\//, '') } }));
      })
      .catch((e) => {
        console.warn('[Cartelería] Sin enlace corto; el cartel sale sin QR:', e);
        if (vigente) setEnlaces((p) => ({ ...p, [conciertoId]: null }));
      });
    return () => {
      vigente = false;
    };
  }, [conciertoId, enlaces]);
  const iaDelBolo = useMemo(() => (concierto && fondosIa[concierto.id]) || [], [concierto, fondosIa]);

  // Un fondo de IA es de su bolo: al cambiar de bolo no se arrastra.
  const fondoEfectivo: FondoCartel =
    fondo.tipo === 'imagen' && fondo.origen === 'ia' && !iaDelBolo.includes(fondo.url) ? FONDO_INICIAL : fondo;

  const compartido = concierto ? esCompartido(concierto, bandName) : false;
  const faltaCabeza = compartido && ajustes.cabeza === null;
  const marca = puedeQuitarMarca ? ajustes.marca : true;

  const piezasPara = useCallback(
    (f: FormatoCartel): PiezasCartel | null => {
      if (!concierto) return null;
      const conQr = !FORMATOS[f].digital && ajustes.qr && !!enlace;
      return {
        datos: datosDesdeConcierto(concierto, bandName, ajustes),
        opciones: { qr: conQr, urlCorta: enlace?.corta ?? null, marca },
        qrUrl: conQr ? enlace!.url : null,
        semilla: `${concierto.id}|${bandName}`,
      };
    },
    [concierto, bandName, ajustes, enlace, marca]
  );

  // Vista previa: se pinta fuera de pantalla y se copia al final, así no parpadea ni se mezclan
  // dos renders si la persona toca rápido.
  useEffect(() => {
    const piezas = piezasPara(formato);
    if (!piezas) return;
    let vigente = true;
    const fuera = document.createElement('canvas');
    renderCartel(fuera, FORMATOS[formato], 1080, fondoEfectivo, piezas)
      .then(() => {
        const visible = canvasRef.current;
        if (!vigente || !visible) return;
        visible.width = fuera.width;
        visible.height = fuera.height;
        visible.getContext('2d')?.drawImage(fuera, 0, 0);
      })
      .catch((e) => {
        if (!vigente) return;
        console.warn('[Cartelería] No se pudo pintar la vista previa:', e);
        setError(mensajeDe(e, 'No pudimos pintar el cartel.'));
      });
    return () => {
      vigente = false;
    };
  }, [formato, fondoEfectivo, piezasPara, canvasRef]);

  // La foto vive en memoria del navegador: se libera al cambiarla y al salir.
  const fotoRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (fotoRef.current) URL.revokeObjectURL(fotoRef.current);
  }, []);

  const cambiarAjustes = useCallback(
    (cambio: Partial<AjustesBolo>) => {
      if (!concierto) return;
      setAjustesPorBolo((prev) => ({ ...prev, [concierto.id]: { ...(prev[concierto.id] ?? AJUSTES_INICIALES), ...cambio } }));
    },
    [concierto]
  );

  const elegirConcierto = (id: string) => {
    setConcertId(id);
    setError(null);
  };

  const elegirFondo = (f: FondoCartel) => {
    setFondo(f);
    setError(null);
  };

  const elegirFoto = (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) return setError('Eso no es una imagen.');
    if (archivo.size > MAX_FOTO_BYTES) return setError('La foto pesa demasiado (máximo 15 MB).');
    if (fotoRef.current) URL.revokeObjectURL(fotoRef.current);
    const url = URL.createObjectURL(archivo);
    fotoRef.current = url;
    setFoto(url);
    elegirFondo({ tipo: 'imagen', url, origen: 'foto' });
  };

  /** Devuelve si salió bien (la vista cierra el panel de IA para que Compartir vuelva a verse). */
  const generarIa = async (estilo: EstiloCartel, instrucciones: string): Promise<boolean> => {
    if (!concierto) return false;
    const id = concierto.id;
    setGenerando(true);
    setError(null);
    try {
      const r = await generarFondoCartel({ concertId: id, estilo, instrucciones: instrucciones.trim() || undefined });
      setFondosIa((prev) => ({ ...prev, [id]: [r.url, ...(prev[id] ?? []).filter((u) => u !== r.url)].slice(0, MAX_FONDOS_IA) }));
      setFondo({ tipo: 'imagen', url: r.url, origen: 'ia' });
      return true;
    } catch (e) {
      console.warn('[Cartelería] Falló la generación del fondo:', e);
      setError(mensajeDe(e, 'No pudimos generar el fondo. Prueba en un rato.'));
      return false;
    } finally {
      setGenerando(false);
    }
  };

  const exportar = useCallback(
    async (f: FormatoCartel): Promise<Blob> => {
      const piezas = piezasPara(f);
      if (!piezas) throw new Error('Elige un bolo.');
      const lienzo = document.createElement('canvas');
      await renderCartel(lienzo, FORMATOS[f], FORMATOS[f].ancho, fondoEfectivo, piezas);
      return canvasABlob(lienzo);
    },
    [piezasPara, fondoEfectivo]
  );

  const conExportacion = async (tarea: () => Promise<void>) => {
    setExportando(true);
    setError(null);
    try {
      await tarea();
    } catch (e) {
      console.warn('[Cartelería] Falló la exportación:', e);
      setError(mensajeDe(e, 'No pudimos exportar el cartel.'));
    } finally {
      setExportando(false);
    }
  };

  const nombre = (f: string, ext?: string) => nombreArchivo(bandName, concierto?.fecha.slice(0, 10) ?? '', f, ext);

  const compartir = () =>
    conExportacion(async () => {
      const blob = await exportar(formato);
      await compartirODescargar(blob, nombre(formato), `${bandName} · ${concierto?.sala ?? ''}`);
    });

  const descargar = () =>
    conExportacion(async () => {
      descargarBlob(await exportar(formato), nombre(formato));
    });

  const descargarTodos = () =>
    conExportacion(async () => {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (const f of ORDEN_FORMATOS) zip.file(nombre(f), await exportar(f));
      descargarBlob(await zip.generateAsync({ type: 'blob' }), nombre('pack', 'zip'));
    });

  return {
    opciones,
    concierto,
    elegirConcierto,
    formato,
    setFormato,
    fondo: fondoEfectivo,
    elegirFondo,
    foto,
    elegirFoto,
    fondosIa: iaDelBolo,
    generarIa,
    generando,
    ajustes,
    cambiarAjustes,
    compartido,
    bandas: concierto ? bandasDelBolo(concierto, bandName) : [],
    faltaCabeza,
    tieneHorario: !!concierto && !!lineaHorario(concierto.logisticaTecnica?.horaAperturaPuertas, concierto.logisticaTecnica?.horaShow),
    tieneEnlace: !!enlace,
    puedeQuitarMarca,
    compartir,
    descargar,
    descargarTodos,
    exportando,
    error,
  };
}

export type EditorCartel = ReturnType<typeof useEditorCartel>;
