import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cargarImagen, compartirODescargar, descargarBlob, prepararFoto } from '../../../utils/cartel/render';
import { paletaDeImagen } from '../../../utils/cartel/paleta';
import type { VozCartel } from '../../../utils/cartel/voces';
import { disenoDe, laminasDePieza, nombreArchivoLamina, opcionesPaleta, type FormatoLamina } from '../../../utils/asesor/laminas';
import { renderLaminas } from '../../../utils/asesor/renderLaminas';
import type { Pieza } from '../../../utils/asesor/pieza';

export interface BandaLaminas {
  nombre: string;
  logoUrl: string | null;
}

type Render = { clave: string; blobs: Blob[]; urls: string[] };
interface Foto {
  /** Cambia en cada foto nueva: es lo que hace repintar. */
  id: number;
  url: string;
  img: HTMLImageElement;
}

const MAX_FOTO_BYTES = 25 * 1024 * 1024;

/**
 * Las imágenes de unas stories o un carrusel: se pintan en el navegador (gratis e instantáneo) con
 * los colores y el logo de la banda y, si se quiere, una foto de fondo por lámina. Cambiar color,
 * letra o foto repinta; no se llama a la IA. Las fotos no salen del navegador.
 */
export function useLaminas(pieza: Pieza, formato: FormatoLamina, banda: BandaLaminas) {
  const laminas = useMemo(() => laminasDePieza(pieza), [pieza]);
  const [logo, setLogo] = useState<{ img: HTMLImageElement; url: string } | null>(null);
  const [deLogo, setDeLogo] = useState<{ fondo: string; acento: string } | null>(null);
  const [paletaId, setPaletaId] = useState<string | null>(null);
  const [voz, setVoz] = useState<VozCartel>('moderna');
  const [fotos, setFotos] = useState<Record<number, Foto>>({});
  const [render, setRender] = useState<Render | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const idFoto = useRef(0);
  const urlsFotos = useRef(new Set<string>());

  // El logo da «Tus colores» y firma cada lámina. Si no carga, quedan las paletas de serie y sin logo.
  useEffect(() => {
    if (!banda.logoUrl) return;
    let vigente = true;
    cargarImagen(banda.logoUrl)
      .then((img) => {
        if (!vigente) return;
        setLogo({ img, url: banda.logoUrl as string });
        setDeLogo(paletaDeImagen(img));
      })
      .catch((e) => console.warn('[Asesor] Sin logo en las imágenes: no se pudo leer:', e));
    return () => {
      vigente = false;
    };
  }, [banda.logoUrl]);

  // Las fotos son locales (blob:): se sueltan al cerrar la hoja.
  useEffect(() => {
    const urls = urlsFotos.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const ponerFoto = useCallback(async (indice: number, archivo: File): Promise<string | null> => {
    if (archivo.size > MAX_FOTO_BYTES) return 'Esa foto pesa demasiado. Prueba con una de menos de 25 MB.';
    try {
      const url = URL.createObjectURL(await prepararFoto(archivo));
      urlsFotos.current.add(url);
      const img = await cargarImagen(url);
      setFotos((f) => ({ ...f, [indice]: { id: ++idFoto.current, url, img } }));
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'No se pudo usar esa foto.';
    }
  }, []);

  const quitarFoto = useCallback((indice: number) => {
    setFotos((f) => {
      const { [indice]: _quitada, ...resto } = f;
      return resto;
    });
  }, []);

  const paletas = useMemo(() => opcionesPaleta(deLogo), [deLogo]);
  const paleta = paletas.find((p) => p.id === paletaId) ?? paletas[0];
  const clave = [paleta.id, voz, logo ? 'logo' : '', Object.entries(fotos).map(([i, f]) => `${i}:${f.id}`).join(','), laminas.map((l) => l.texto).join('¶')].join('|');

  useEffect(() => {
    let vigente = true;
    const lista = laminas.map((_, i) => fotos[i]?.img ?? null);
    renderLaminas(laminas, { formato, diseno: disenoDe(paleta), voz, banda: banda.nombre, logo, fotos: lista })
      .then((blobs) => {
        if (!vigente) return;
        setRender({ clave, blobs, urls: blobs.map((b) => URL.createObjectURL(b)) });
        setError(null);
      })
      .catch((e) => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudieron pintar las imágenes.'); });
    return () => {
      vigente = false;
    };
    // `clave` resume paleta, letra, logo, fotos y textos: no hace falta repintar por nada más.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, formato, banda.nombre]);

  // Las imágenes de un pintado se liberan cuando llega el siguiente o se cierra la hoja.
  useEffect(() => () => render?.urls.forEach((u) => URL.revokeObjectURL(u)), [render]);

  const nombres = (render?.blobs ?? []).map((_, i) => nombreArchivoLamina(banda.nombre, formato, i + 1));

  /** Una sola imagen: compartir o descargar. Varias: compartirlas juntas si el móvil puede; si no, un ZIP. */
  const exportar = async () => {
    if (!render?.blobs.length) return;
    setExportando(true);
    try {
      if (render.blobs.length === 1) {
        await compartirODescargar(render.blobs[0], nombres[0], banda.nombre);
        return;
      }
      const archivos = render.blobs.map((b, i) => new File([b], nombres[i], { type: 'image/png' }));
      if (navigator.canShare?.({ files: archivos })) {
        try {
          await navigator.share({ files: archivos, title: banda.nombre });
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') return;
        }
      }
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      archivos.forEach((f) => zip.file(f.name, f));
      descargarBlob(await zip.generateAsync({ type: 'blob' }), nombres[0].replace(/-1\.png$/, '.zip'));
    } finally {
      setExportando(false);
    }
  };

  return {
    laminas, paletas, paleta, setPaletaId, voz, setVoz,
    tieneFoto: (i: number) => Boolean(fotos[i]), ponerFoto, quitarFoto,
    urls: render?.clave === clave ? render.urls : [],
    pintando: render?.clave !== clave && !error,
    error, exportando, exportar,
  };
}
