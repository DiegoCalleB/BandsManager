import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { Concert } from '../../../types';
import { FORMATOS, ORDEN_FORMATOS, type FormatoCartel } from '../../../utils/cartel/formatos';
import { bandasDelBolo, conciertosParaCartel, datosDesdeConcierto, esCompartido } from '../../../utils/cartel/datos';
import { ajustesDe, configDesdeEstado, CONFIG_INICIAL, conFondoIa, MAX_LOGOS, sanearConfigCartel, type AjustesBolo } from '../../../utils/cartel/config';
import { conSangradoYMarcas } from '../../../utils/cartel/sangrado';
import { conReintentos } from '../../../utils/reintentar';
import { prepararLogo } from '../../../utils/cartel/logos';
import { resolverComposicion, resolverVoz } from '../../../utils/cartel/voces';
import { lineaHorario } from '../../../utils/cartel/texto';
import { sinVersion } from '../../../utils/cartel/adn';
import { useAdnCartel, type DatosBandaCartel } from './useAdnCartel';
import { useIdeaCartel } from './useIdeaCartel';
import {
  canvasABlob,
  compartirODescargar,
  descargarBlob,
  nombreArchivo,
  prepararFoto,
  renderCartel,
  type FondoCartel,
  type PiezasCartel,
} from '../../../utils/cartel/render';
import {
  crearEnlace,
  generarFondoCartel,
  retocarFondoCartel,
  guardarConfigCartel,
  subirFotoCartel,
  quitarLogoCartel,
  subirLogoCartel,
  subirImagenCartel,
  type EstiloCartel,
} from '../../../utils/promocionApi';

export type { AjustesBolo };

const MAX_FOTO_BYTES = 25 * 1024 * 1024;
const ESPERA_GUARDADO_MS = 1200;

const hoyMadrid = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);
/** Lo que llega del servidor ya va saneado; aquí solo se exige https. */
const esHttps = (u: string) => u.startsWith('https://');

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
  /** Logo, plantilla del dossier y género: el ADN visual automático de la banda. */
  banda?: DatosBandaCartel;
  /** Lo que ya está guardado en el servidor, para reflejarlo en la copia en memoria de los bolos. */
  onCartelGuardado?: (concertId: string, cartel: { cartel_config?: unknown; cartel_url?: string }) => void;
}

/** Un bolo tal como llega del servidor: `cartel_config` es jsonb sin tipo (se sanea al leerlo). */
type ConciertoConCartel = Concert & { cartel_config?: unknown };

/** Lo que la persona ha tocado en esta sesión, por bolo. Lo que no ha tocado sale de lo guardado. */
type PorBolo<T> = Record<string, T>;

/** Qué hacer con el cartel del bolo tras exportar: ya tengo el PNG de feed, hay que pintarlo, o nada (cancelado). */
type TrasExportar = Blob | 'pintar-feed' | null;

export function useEditorCartel({ canvasRef, concerts, bandName, initialConcertId, puedeQuitarMarca = false, banda, onCartelGuardado }: Params) {
  const opciones = useMemo(() => conciertosParaCartel(concerts, hoyMadrid()), [concerts]);
  const [concertId, setConcertId] = useState(initialConcertId ?? '');
  const concierto = opciones.find((c) => c.id === concertId) ?? opciones[0] ?? null;
  const id = concierto?.id ?? '';

  const [formato, setFormato] = useState<FormatoCartel>('feed');
  /** Con qué estilo y qué ambiente se generó cada fondo de IA en esta sesión (para guardarlo como favorito). */
  const [metaIa, setMetaIa] = useState<Record<string, { estilo: EstiloCartel; ambiente: string }>>({});
  const [ajustesPorBolo, setAjustesPorBolo] = useState<PorBolo<AjustesBolo>>({});
  const [fondoPorBolo, setFondoPorBolo] = useState<PorBolo<FondoCartel>>({});
  const [fondosIaPorBolo, setFondosIaPorBolo] = useState<PorBolo<string[]>>({});
  const [fotoLocalPorBolo, setFotoLocalPorBolo] = useState<PorBolo<string>>({});
  const [fotoRemotaPorBolo, setFotoRemotaPorBolo] = useState<PorBolo<string>>({});
  const [logosPorBolo, setLogosPorBolo] = useState<PorBolo<string[]>>({});
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [enlaces, setEnlaces] = useState<PorBolo<EnlaceCartel | null>>({});
  const [sucios, setSucios] = useState<PorBolo<boolean>>({});
  const [publicados, setPublicados] = useState<PorBolo<boolean>>({});
  /** Imágenes que no cargan (borradas, sin red, sin CORS): se dejan de ofrecer y el cartel cae al color. */
  const [rotas, setRotas] = useState<PorBolo<true>>({});
  const [generando, setGenerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El ADN visual de la banda: «Tus colores» del logo, referencias, favoritos y estilo sugerido.
  const adn = useAdnCartel(banda ?? {}, setError);
  // Su idea del cartel (texto y boceto): se manda al generar y el servidor la traduce y la ordena.
  const idea = useIdeaCartel(setError);
  const logoUrl = banda?.logoUrl ?? null;

  // Lo guardado en el bolo (fondo, cabeza de cartel, historial de IA…), saneado.
  const guardada = useMemo(
    () => (concierto ? sanearConfigCartel((concierto as ConciertoConCartel).cartel_config, esHttps) ?? CONFIG_INICIAL : CONFIG_INICIAL),
    [concierto]
  );
  const ajustesGuardados = useMemo(() => ajustesDe(guardada), [guardada]);
  const ajustes = ajustesPorBolo[id] ?? ajustesGuardados;
  const fondosIa = useMemo(() => (fondosIaPorBolo[id] ?? guardada.fondosIa).filter((u) => !rotas[u]), [fondosIaPorBolo, id, guardada, rotas]);
  const logosExtra = useMemo(() => (logosPorBolo[id] ?? guardada.logos).filter((u) => !rotas[u]), [logosPorBolo, id, guardada, rotas]);
  const fotoRemota = fotoRemotaPorBolo[id] ?? guardada.foto;
  const fotoCandidata = fotoLocalPorBolo[id] ?? fotoRemota;
  const foto = fotoCandidata && !rotas[fotoCandidata] ? fotoCandidata : null;
  const enlace = enlaces[id] ?? null;

  // Un fondo de imagen solo vale si sigue siendo de este bolo (su historial de IA o su foto).
  const fondoElegido = fondoPorBolo[id] ?? guardada.fondo;
  const fondoValido =
    fondoElegido.tipo === 'paleta' ||
    fondoElegido.tipo === 'plantilla' ||
    (!rotas[fondoElegido.url] && (fondoElegido.origen === 'ia' ? fondosIa.includes(fondoElegido.url) : fondoElegido.url === foto));
  const fondo: FondoCartel = fondoValido ? fondoElegido : CONFIG_INICIAL.fondo;

  const compartido = concierto ? esCompartido(concierto, bandName) : false;
  const faltaCabeza = compartido && ajustes.cabeza === null;
  const marca = puedeQuitarMarca ? ajustes.marca : true;

  // Enlace corto del cartel: canal «cartel», a la página del bolo. El servidor lo reutiliza si ya
  // existe, así que sus escaneos se suman en la campaña del bolo. Sin enlace, el cartel sale sin QR.
  useEffect(() => {
    if (!id || id in enlaces) return;
    let vigente = true;
    crearEnlace({ concertId: id, destino: 'concierto', canal: 'cartel' })
      .then((r) => {
        if (vigente) setEnlaces((p) => ({ ...p, [id]: { url: r.url, corta: r.url.replace(/^https?:\/\//, '') } }));
      })
      .catch((e) => {
        console.warn('[Cartelería] Sin enlace corto; el cartel sale sin QR:', e);
        if (vigente) setEnlaces((p) => ({ ...p, [id]: null }));
      });
    return () => {
      vigente = false;
    };
  }, [id, enlaces]);

  const conLogo = ajustes.logo && !!logoUrl;
  const { paletaBanda } = adn;
  const estiloArranque = adn.estiloSugerido;
  const piezasPara = useCallback(
    (f: FormatoCartel): PiezasCartel | null => {
      if (!concierto) return null;
      const conQr = (!FORMATOS[f].digital || ajustes.qrDigital) && ajustes.qr && !!enlace;
      const voz = resolverVoz(ajustes.letra, estiloArranque);
      return {
        datos: datosDesdeConcierto(concierto, bandName, ajustes),
        opciones: { qr: conQr, urlCorta: enlace?.corta ?? null, marca },
        qrUrl: conQr ? enlace!.url : null,
        semilla: `${concierto.id}|${bandName}`,
        paletaBanda,
        // La fila de logos: primero el de la banda (si está activado) y luego los subidos para este bolo.
        logos: [...(conLogo && logoUrl ? [logoUrl] : []), ...logosExtra],
        logosTinta: ajustes.logosTinta,
        voz,
        composicion: resolverComposicion(ajustes.composicion, voz),
        vozAuto: ajustes.letra === 'auto',
        composicionAuto: ajustes.composicion === 'auto',
      };
    },
    [concierto, bandName, ajustes, enlace, marca, conLogo, logoUrl, paletaBanda, logosExtra, estiloArranque]
  );

  // Vista previa: se pinta fuera de pantalla y se copia al final, así no parpadea ni se mezclan
  // dos renders si la persona toca rápido.
  useEffect(() => {
    const piezas = piezasPara(formato);
    if (!piezas) return;
    let vigente = true;
    const fuera = document.createElement('canvas');
    renderCartel(fuera, FORMATOS[formato], 1080, fondo, piezas)
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
        if (fondo.tipo === 'imagen') {
          // Un cartel nunca se queda en blanco: ese fondo deja de ofrecerse y se pinta con color.
          setRotas((p) => ({ ...p, [fondo.url]: true }));
          setError('No pudimos cargar ese fondo; mientras, va con color.');
        } else {
          setError(mensajeDe(e, 'No pudimos pintar el cartel.'));
        }
      });
    return () => {
      vigente = false;
    };
  }, [formato, fondo, piezasPara, canvasRef]);

  // Guardado en el bolo solo si la persona ha tocado algo (abrir no escribe nada) y con espera,
  // para no mandar una petición por tecla en la línea extra.
  const configActual = useMemo(
    () => configDesdeEstado({ formato, fondo, ajustes, fondosIa, fotoRemota, logos: logosExtra, anterior: guardada }),
    [formato, fondo, ajustes, fondosIa, fotoRemota, logosExtra, guardada]
  );
  const sucio = !!sucios[id];
  useEffect(() => {
    if (!id || !sucio) return;
    // Un fallo de red al guardar se reintenta solo (2 s, 5 s, 10 s): el aviso global ignora esta ruta y solo se avisa
    // si tampoco así se pudo. Si la persona cambia algo mientras tanto, este guardado se abandona y manda el nuevo.
    let cancelado = false;
    const t = setTimeout(() => {
      conReintentos(() => guardarConfigCartel(id, configActual), [2000, 5000, 10000], () => cancelado)
        .then((r) => onCartelGuardado?.(id, { cartel_config: r.config }))
        .catch((e) => {
          console.warn('[Cartelería] No se pudo guardar el cartel en el bolo:', e);
          if (!cancelado) setError('No hemos podido guardar los últimos cambios del cartel. Comprueba la conexión: se volverá a intentar al tocar algo.');
        });
    }, ESPERA_GUARDADO_MS);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [id, sucio, configActual, onCartelGuardado]);

  // Las fotos locales viven en memoria del navegador: se liberan al salir.
  const fotosLocales = useRef<string[]>([]);
  useEffect(() => {
    const lista = fotosLocales.current;
    return () => lista.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const marcar = useCallback(() => {
    if (id) setSucios((p) => (p[id] ? p : { ...p, [id]: true }));
  }, [id]);

  const cambiarAjustes = useCallback(
    (cambio: Partial<AjustesBolo>) => {
      if (!id) return;
      setAjustesPorBolo((p) => ({ ...p, [id]: { ...(p[id] ?? ajustesGuardados), ...cambio } }));
      marcar();
    },
    [id, ajustesGuardados, marcar]
  );

  const elegirConcierto = (nuevo: string) => {
    setConcertId(nuevo);
    setError(null);
  };

  const elegirFormato = (f: FormatoCartel) => {
    setFormato(f);
    marcar();
  };

  const elegirFondo = (f: FondoCartel) => {
    if (!id) return;
    setFondoPorBolo((p) => ({ ...p, [id]: f }));
    setError(null);
    marcar();
  };

  const elegirFoto = async (archivo: File | undefined) => {
    if (!archivo || !id) return;
    if (!archivo.type.startsWith('image/')) return setError('Eso no es una imagen.');
    if (archivo.size > MAX_FOTO_BYTES) return setError('La foto pesa demasiado.');
    const bolo = id;
    try {
      const jpeg = await prepararFoto(archivo);
      const local = URL.createObjectURL(jpeg);
      fotosLocales.current.push(local);
      setFotoLocalPorBolo((p) => ({ ...p, [bolo]: local }));
      setFondoPorBolo((p) => ({ ...p, [bolo]: { tipo: 'imagen', origen: 'foto', url: local } }));
      setError(null);
      // Se sube en segundo plano: la persona sigue trabajando con la copia local.
      subirFotoCartel(bolo, jpeg)
        .then((r) => {
          setFotoRemotaPorBolo((p) => ({ ...p, [bolo]: r.url }));
          setSucios((p) => ({ ...p, [bolo]: true }));
        })
        .catch((e) => console.warn('[Cartelería] La foto no se pudo guardar en el bolo (sigue en esta sesión):', e));
    } catch (e) {
      console.warn('[Cartelería] Foto no válida:', e);
      setError(mensajeDe(e, 'No podemos usar esa foto.'));
    }
  };

  /** Un logo de otra banda del bolo: se reescala a PNG, se sube y entra en la fila de logos. */
  const subirLogo = async (archivo: File | undefined) => {
    if (!archivo || !id) return;
    if (!archivo.type.startsWith('image/')) return setError('Eso no es una imagen.');
    if (archivo.size > MAX_FOTO_BYTES) return setError('El logo pesa demasiado.');
    if (logosExtra.length >= MAX_LOGOS) return setError(`Caben como mucho ${MAX_LOGOS} logos más.`);
    const bolo = id;
    setSubiendoLogo(true);
    setError(null);
    try {
      const r = await subirLogoCartel(bolo, await prepararLogo(archivo));
      setLogosPorBolo((p) => ({ ...p, [bolo]: r.logos }));
      setSucios((p) => ({ ...p, [bolo]: true }));
    } catch (e) {
      console.warn('[Cartelería] No se pudo guardar el logo:', e);
      setError(mensajeDe(e, 'No pudimos guardar ese logo.'));
    } finally {
      setSubiendoLogo(false);
    }
  };

  /** Quita el logo de la fila al instante; el servidor borra el fichero y, si falla, se deshace. */
  const quitarLogo = (url: string) => {
    if (!id) return;
    const bolo = id;
    const antes = logosExtra;
    setLogosPorBolo((p) => ({ ...p, [bolo]: antes.filter((u) => u !== url) }));
    marcar();
    quitarLogoCartel(bolo, url).catch((e) => {
      console.warn('[Cartelería] No se pudo quitar el logo del servidor:', e);
      setLogosPorBolo((p) => ({ ...p, [bolo]: antes }));
      setError(mensajeDe(e, 'No pudimos quitar ese logo.'));
    });
  };

  // Que la IA dibuje el título y la fecha dentro del arte: más de cartel, pero solo con una banda (con varias va el lineup).
  const [letrasIa, setLetrasIa] = useState(true);
  /** El estilo del último fondo cuyas letras salieron mal (para repetirlo sin letras de IA), o null. */
  const [letrasFallidas, setLetrasFallidas] = useState<EstiloCartel | null>(null);
  const puedeLetrasIa = !compartido;

  /** Devuelve si salió bien (la vista cierra el panel de IA para que Compartir vuelva a verse). */
  const generarIa = async (estilo: EstiloCartel, conLetras: boolean = letrasIa && puedeLetrasIa): Promise<boolean> => {
    if (!id) return false;
    const bolo = id;
    setGenerando(true);
    setError(null);
    try {
      const { idea: contada, conBoceto } = idea.paraGenerar;
      const r = await generarFondoCartel({ concertId: bolo, estilo, idea: contada, conBoceto, encuadre: 'sangre', conTexto: conLetras });
      // El servidor ya lo añadió al historial guardado; aquí se refleja sin recargar.
      setFondosIaPorBolo((p) => ({ ...p, [bolo]: conFondoIa({ ...CONFIG_INICIAL, fondosIa: p[bolo] ?? fondosIa }, r.url).fondosIa }));
      setFondoPorBolo((p) => ({ ...p, [bolo]: { tipo: 'imagen', origen: 'ia', url: r.url } }));
      // Lo que pidió, para repetirlo desde favoritos: la escena y el ambiente en una línea.
      const ambiente = [contada?.escena, contada?.ambiente].filter(Boolean).join(' · ').slice(0, 300);
      setMetaIa((p) => ({ ...p, [r.url]: { estilo, ambiente } }));
      marcar();
      // Si la IA se ha equivocado en alguna letra, se ofrece repetir con el texto exacto de la app (un clic).
      setLetrasFallidas(r.conTexto === true && r.textoOk === false ? estilo : null);
      return true;
    } catch (e) {
      console.warn('[Cartelería] Falló la generación del fondo:', e);
      setError(mensajeDe(e, 'No pudimos generar el fondo. Prueba en un rato.'));
      return false;
    } finally {
      setGenerando(false);
    }
  };

  const [retocando, setRetocando] = useState(false);

  /** Retoca el fondo de IA que se ve: una versión nueva (el original sigue en el historial para volver). */
  const retocarIa = async (instruccion: string): Promise<boolean> => {
    if (!id || fondo.tipo !== 'imagen' || fondo.origen !== 'ia') return false;
    const bolo = id;
    const origen = fondo.url;
    setRetocando(true);
    setError(null);
    try {
      const r = await retocarFondoCartel({ concertId: bolo, url: origen, instruccion });
      setFondosIaPorBolo((p) => ({ ...p, [bolo]: conFondoIa({ ...CONFIG_INICIAL, fondosIa: p[bolo] ?? fondosIa }, r.url).fondosIa }));
      setFondoPorBolo((p) => ({ ...p, [bolo]: { tipo: 'imagen', origen: 'ia', url: r.url } }));
      // Mismo estilo y ambiente que el original, para guardarlo como favorito si les gusta.
      setMetaIa((p) => (p[origen] ? { ...p, [r.url]: p[origen] } : p));
      marcar();
      if (r.conTexto && r.textoOk === false) {
        setError('El retoque ha estropeado alguna letra. Vuelve a la versión anterior (miniatura de la izquierda) o prueba con otra instrucción.');
      }
      return true;
    } catch (e) {
      console.warn('[Cartelería] Falló el retoque del fondo:', e);
      setError(mensajeDe(e, 'No pudimos retocar el fondo. Prueba en un rato.'));
      return false;
    } finally {
      setRetocando(false);
    }
  };

  /** Un fondo de IA de otro bolo (favorito): gratis, y el cartel de esta banda mantiene su sello. */
  const usarFavorito = (url: string) => {
    if (!id) return;
    setFondosIaPorBolo((p) => ({ ...p, [id]: conFondoIa({ ...CONFIG_INICIAL, fondosIa: p[id] ?? fondosIa }, url).fondosIa }));
    setFondoPorBolo((p) => ({ ...p, [id]: { tipo: 'imagen', origen: 'ia', url } }));
    setError(null);
    marcar();
  };

  /** Carteles de OTROS bolos de la banda que se pueden ofrecer como referencia (ya viven en su carpeta). */
  const anteriores = useMemo(() => {
    const yaSon = new Set(adn.adn.referencias.map(sinVersion));
    const vistos = new Set<string>();
    const lista: string[] = [];
    for (const c of concerts) {
      const u = c.id !== id ? c.cartel_url || c.cartelUrl : undefined;
      if (!u || !u.startsWith('https://') || !u.includes('/storage/v1/object/public/') || !u.includes('/carteles/')) continue;
      if (yaSon.has(sinVersion(u)) || vistos.has(sinVersion(u))) continue;
      vistos.add(sinVersion(u));
      lista.push(u);
    }
    return lista.slice(0, 6);
  }, [concerts, id, adn.adn.referencias]);

  const exportar = useCallback(
    async (f: FormatoCartel, paraImprenta = false): Promise<Blob> => {
      const piezas = piezasPara(f);
      if (!piezas) throw new Error('Elige un bolo.');
      const lienzo = document.createElement('canvas');
      await renderCartel(lienzo, FORMATOS[f], FORMATOS[f].ancho, fondo, piezas);
      return canvasABlob(paraImprenta ? conSangradoYMarcas(lienzo) : lienzo);
    },
    [piezasPara, fondo]
  );

  /**
   * Al compartir o descargar, el cartel de feed pasa a ser el del bolo: lo enseñan su página pública
   * y la vista previa al pegar el enlace en WhatsApp. En segundo plano, sin bloquear nada.
   */
  const publicarEnBolo = (feed: Blob | 'pintar-feed') => {
    const bolo = id;
    if (!bolo) return;
    (feed === 'pintar-feed' ? exportar('feed') : Promise.resolve(feed))
      .then((png) => subirImagenCartel(bolo, png))
      .then((r) => {
        setPublicados((p) => ({ ...p, [bolo]: true }));
        onCartelGuardado?.(bolo, { cartel_url: r.url });
      })
      .catch((e) => console.warn('[Cartelería] No se pudo poner el cartel en la página del bolo:', e));
  };

  const conExportacion = async (tarea: () => Promise<TrasExportar>) => {
    setExportando(true);
    setError(null);
    try {
      const despues = await tarea();
      if (despues) {
        publicarEnBolo(despues);
        // Si lo ha compartido o descargado con un fondo de IA, ese fondo le ha gustado: favorito.
        if (fondo.tipo === 'imagen' && fondo.origen === 'ia') {
          const m = metaIa[fondo.url];
          adn.marcarFavorito({ url: fondo.url, estilo: m?.estilo ?? adn.estiloSugerido, ambiente: m?.ambiente ?? '' });
        }
      }
    } catch (e) {
      console.warn('[Cartelería] Falló la exportación:', e);
      setError(mensajeDe(e, 'No pudimos exportar el cartel.'));
    } finally {
      setExportando(false);
    }
  };

  const nombre = (f: string, ext?: string) => nombreArchivo(bandName, concierto?.fecha.slice(0, 10) ?? '', f, ext);
  const feedDe = (f: FormatoCartel, blob: Blob): TrasExportar => (f === 'feed' ? blob : 'pintar-feed');

  const compartir = () =>
    conExportacion(async () => {
      const blob = await exportar(formato);
      const r = await compartirODescargar(blob, nombre(formato), `${bandName} · ${concierto?.sala ?? ''}`);
      // Si la persona cierra la hoja de compartir, no ha elegido este cartel: no se publica.
      return r === 'cancelado' ? null : feedDe(formato, blob);
    });

  const descargar = () =>
    conExportacion(async () => {
      const blob = await exportar(formato);
      descargarBlob(blob, nombre(formato));
      return feedDe(formato, blob);
    });

  /** El A4 para imprenta: 3 mm de sangrado y marcas de corte. Solo tiene sentido en el formato de impresión. */
  const descargarImprenta = () =>
    conExportacion(async () => {
      descargarBlob(await exportar('imprimir', true), nombre('imprenta'));
      return 'pintar-feed' as const;
    });

  const descargarTodos = () =>
    conExportacion(async () => {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      let feed: Blob | null = null;
      for (const f of ORDEN_FORMATOS) {
        const blob = await exportar(f);
        if (f === 'feed') feed = blob;
        zip.file(nombre(f), blob);
      }
      descargarBlob(await zip.generateAsync({ type: 'blob' }), nombre('pack', 'zip'));
      return feed;
    });

  return {
    opciones,
    concierto,
    elegirConcierto,
    formato,
    elegirFormato,
    fondo,
    elegirFondo,
    foto,
    elegirFoto,
    fondosIa,
    generarIa,
    generando,
    retocarIa,
    retocando,
    letrasFallidas,
    repetirSinLetras: async () => {
      if (!letrasFallidas) return false;
      setLetrasIa(false);
      return generarIa(letrasFallidas, false);
    },
    letrasIa,
    setLetrasIa,
    puedeLetrasIa,
    ajustes,
    cambiarAjustes,
    compartido,
    bandas: concierto ? bandasDelBolo(concierto, bandName) : [],
    faltaCabeza,
    tieneDireccion: !!concierto?.direccion?.trim(),
    tieneHorario: !!concierto && !!lineaHorario(concierto.logisticaTecnica?.horaAperturaPuertas, concierto.logisticaTecnica?.horaShow),
    tieneEnlace: !!enlace,
    puedeQuitarMarca,
    adn,
    idea,
    anteriores,
    usarFavorito,
    tieneLogo: !!logoUrl,
    logos: logosExtra,
    subirLogo,
    quitarLogo,
    subiendoLogo,
    /** El bolo ya tiene cartel en su página pública (de antes o de esta sesión). */
    publicado: !!publicados[id] || !!concierto?.cartel_url || !!concierto?.cartelUrl,
    compartir,
    descargar,
    descargarImprenta,
    descargarTodos,
    exportando,
    error,
  };
}

export type EditorCartel = ReturnType<typeof useEditorCartel>;
