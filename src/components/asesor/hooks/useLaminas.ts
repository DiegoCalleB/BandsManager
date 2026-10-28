import { useEffect, useMemo, useState } from 'react';
import { cargarImagen, compartirODescargar, descargarBlob } from '../../../utils/cartel/render';
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

/**
 * Las imágenes de unas stories o un carrusel: se pintan en el navegador (gratis e instantáneo) con
 * los colores del logo de la banda si los hay. Cambiar color o letra repinta; no se llama a la IA.
 */
export function useLaminas(pieza: Pieza, formato: FormatoLamina, banda: BandaLaminas) {
  const laminas = useMemo(() => laminasDePieza(pieza), [pieza]);
  const [deLogo, setDeLogo] = useState<{ fondo: string; acento: string } | null>(null);
  const [paletaId, setPaletaId] = useState<string | null>(null);
  const [voz, setVoz] = useState<VozCartel>('moderna');
  const [render, setRender] = useState<Render | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  // «Tus colores» salen del logo: si no carga, quedan las paletas de serie.
  useEffect(() => {
    if (!banda.logoUrl) return;
    let vigente = true;
    cargarImagen(banda.logoUrl)
      .then((img) => { if (vigente) setDeLogo(paletaDeImagen(img)); })
      .catch((e) => console.warn('[Asesor] Sin «Tus colores»: no se pudo leer el logo:', e));
    return () => {
      vigente = false;
    };
  }, [banda.logoUrl]);

  const paletas = useMemo(() => opcionesPaleta(deLogo), [deLogo]);
  const paleta = paletas.find((p) => p.id === paletaId) ?? paletas[0];
  const clave = `${paleta.id}|${voz}|${laminas.map((l) => l.texto).join('¶')}`;

  useEffect(() => {
    let vigente = true;
    renderLaminas(laminas, { formato, diseno: disenoDe(paleta), voz, banda: banda.nombre })
      .then((blobs) => {
        if (!vigente) return;
        setRender({ clave, blobs, urls: blobs.map((b) => URL.createObjectURL(b)) });
        setError(null);
      })
      .catch((e) => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudieron pintar las imágenes.'); });
    return () => {
      vigente = false;
    };
    // `clave` resume paleta, voz y textos: no hace falta repintar por nada más.
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
    urls: render?.clave === clave ? render.urls : [],
    pintando: render?.clave !== clave && !error,
    error, exportando, exportar,
  };
}
