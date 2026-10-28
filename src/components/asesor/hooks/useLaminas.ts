import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sanearAdn, type AdnCartel } from '../../../utils/cartel/adn';
import { cargarImagen, compartirODescargar, descargarBlob, prepararFoto } from '../../../utils/cartel/render';
import { paletaDeImagen } from '../../../utils/cartel/paleta';
import { obtenerAdnCartel } from '../../../utils/promocionApi';
import { fotosDeLaBanda, fotosIniciales, vozDeLaBanda } from '../../../utils/asesor/adnVisual';
import type { VozCartel } from '../../../utils/cartel/voces';
import { disenoDe, laminasDePieza, nombreArchivoLamina, opcionesPaleta, type FormatoLamina } from '../../../utils/asesor/laminas';
import { renderLaminas } from '../../../utils/asesor/renderLaminas';
import type { Pieza } from '../../../utils/asesor/pieza';

export interface BandaLaminas {
  nombre: string;
  logoUrl: string | null;
  /** Plantilla y género del dossier: pistas de su estilo visual. */
  plantilla?: string;
  genero?: string;
  /** La galería de fotos de su dossier (`bandPhotos`). */
  galeria?: unknown[];
}

const SIN_FOTOS: unknown[] = [];
/** Las rutas de nuestro propio servidor se resuelven contra el origen; el resto va tal cual. */
const absoluta = (u: string) => (u.startsWith('/') ? new URL(u, window.location.origin).href : u);

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
 * el ADN visual de la banda: los colores de su logo, la letra de su estilo y sus propias fotos
 * (galería del dossier, referencias y fondos que ha compartido en Cartelería). Arrancan ya así y la
 * banda lo cambia con un toque. Cambiar color, letra o foto repinta; no se llama a la IA, y las
 * fotos que sube no salen del navegador.
 */
export function useLaminas(pieza: Pieza, formato: FormatoLamina, banda: BandaLaminas) {
  const laminas = useMemo(() => laminasDePieza(pieza), [pieza]);
  const [logo, setLogo] = useState<{ img: HTMLImageElement; url: string } | null>(null);
  const [deLogo, setDeLogo] = useState<{ fondo: string; acento: string } | null>(null);
  const [paletaId, setPaletaId] = useState<string | null>(null);
  const [adn, setAdn] = useState<AdnCartel | null>(null);
  const [adnListo, setAdnListo] = useState(false);
  const [vozElegida, setVoz] = useState<VozCartel | null>(null);
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

  // Su estilo visual (Cartelería): lo que comparte y las imágenes que la representan. Sin él, se tira del dossier.
  useEffect(() => {
    let vigente = true;
    obtenerAdnCartel()
      .then((r) => { if (vigente) setAdn(sanearAdn(r.adn, (u) => u.startsWith('https://'))); })
      .catch((e) => console.warn('[Asesor] Sin el estilo visual de la banda; se usa su dossier:', e))
      .finally(() => { if (vigente) setAdnListo(true); });
    return () => {
      vigente = false;
    };
  }, []);

  const galeria = banda.galeria ?? SIN_FOTOS;
  const fotosBanda = useMemo(() => fotosDeLaBanda({ galeria, logoUrl: banda.logoUrl, adn }), [galeria, banda.logoUrl, adn]);
  const vozAuto = useMemo(() => vozDeLaBanda(adn, { plantilla: banda.plantilla, genero: banda.genero }), [adn, banda.plantilla, banda.genero]);
  const voz = vozElegida ?? vozAuto;

  // Arrancan con sus fotos: una sola vez, cuando ya se sabe cuáles son, y sin pisar lo que la banda haya elegido.
  const arrancado = useRef(false);
  useEffect(() => {
    if (!adnListo || arrancado.current) return;
    arrancado.current = true;
    fotosIniciales(formato, laminas.length, fotosBanda).forEach((url, indice) => {
      if (!url) return;
      cargarImagen(absoluta(url))
        .then((img) => setFotos((f) => (f[indice] ? f : { ...f, [indice]: { id: ++idFoto.current, url, img } })))
        .catch((e) => console.warn('[Asesor] Una foto de la banda no se pudo usar de fondo (la imagen sale en color):', e));
    });
  }, [adnListo, formato, laminas.length, fotosBanda]);

  // Las fotos subidas son locales (blob:): se sueltan al cerrar la hoja.
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

  const ponerFotoDeBanda = useCallback(async (indice: number, url: string): Promise<string | null> => {
    try {
      const img = await cargarImagen(absoluta(url));
      setFotos((f) => ({ ...f, [indice]: { id: ++idFoto.current, url, img } }));
      return null;
    } catch (e) {
      console.warn('[Asesor] Foto de la banda no utilizable:', e);
      return 'Esa foto no se puede usar aquí. Prueba con otra o súbela desde tu dispositivo.';
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
    // Hasta saber su estilo no se pinta: así la primera imagen ya sale con su letra y no se repinta.
    if (!adnListo) return;
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
  }, [clave, formato, banda.nombre, adnListo]);

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
    laminas, paletas, paleta, setPaletaId, voz, vozAuto, setVoz,
    fotosBanda, tieneFoto: (i: number) => Boolean(fotos[i]), ponerFoto, ponerFotoDeBanda, quitarFoto,
    urls: render?.clave === clave ? render.urls : [],
    pintando: render?.clave !== clave && !error,
    error, exportando, exportar,
  };
}
