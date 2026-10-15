import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ADN_INICIAL, conFavorito, conReferencia, estiloSugerido, referenciasParaIa, sanearAdn, sinFavorito, sinReferencia, sinVersion,
  type AdnCartel, type FavoritoCartel,
} from '../../../utils/cartel/adn';
import { paletaDeImagen, type PaletaBanda } from '../../../utils/cartel/paleta';
import { cargarImagen, prepararFoto } from '../../../utils/cartel/render';
import { guardarAdnCartel, obtenerAdnCartel, subirReferenciaCartel } from '../../../utils/promocionApi';

const MAX_REFERENCIA_BYTES = 25 * 1024 * 1024;
const esHttps = (u: string) => u.startsWith('https://');
const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);

export interface DatosBandaCartel {
  logoUrl?: string | null;
  /** Plantilla del dossier (`stage`, `neon`…): pista del estilo. */
  plantilla?: string;
  genero?: string;
}

/**
 * El ADN visual de la banda: lo que hace que sus carteles se parezcan a ellos.
 *  · «Tus colores»: paleta sacada del logo al abrir (barata; no se guarda porque depende del logo actual).
 *  · Referencias y favoritos: se guardan en el servidor; la IA los lee de allí, no se los manda el cliente.
 */
export function useAdnCartel(banda: DatosBandaCartel, avisar: (mensaje: string | null) => void) {
  const [adn, setAdn] = useState<AdnCartel>(ADN_INICIAL);
  const [paletaBanda, setPaletaBanda] = useState<PaletaBanda | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  // Lo último que se ha puesto, para que varios cambios seguidos partan de lo anterior y no de un render viejo.
  const actual = useRef<AdnCartel>(ADN_INICIAL);
  const poner = useCallback((siguiente: AdnCartel) => {
    actual.current = siguiente;
    setAdn(siguiente);
  }, []);

  useEffect(() => {
    let vigente = true;
    obtenerAdnCartel()
      .then((r) => {
        const limpio = sanearAdn(r.adn, esHttps);
        if (vigente && limpio) poner(limpio);
      })
      .catch((e) => console.warn('[Cartelería] No se pudo leer el estilo de la banda (se usa el de serie):', e));
    return () => {
      vigente = false;
    };
  }, [poner]);

  const { logoUrl } = banda;
  useEffect(() => {
    if (!logoUrl) return;
    let vigente = true;
    cargarImagen(logoUrl)
      .then((img) => {
        if (vigente) setPaletaBanda(paletaDeImagen(img));
      })
      .catch((e) => console.warn('[Cartelería] Sin «Tus colores»: no se pudo leer el logo:', e));
    return () => {
      vigente = false;
    };
  }, [logoUrl]);

  /** Optimista: se ve al instante y se deshace si el servidor no lo guarda. */
  const guardar = useCallback(
    (siguiente: AdnCartel) => {
      const anterior = actual.current;
      poner(siguiente);
      guardarAdnCartel(siguiente)
        .then((r) => {
          const limpio = sanearAdn(r.adn, esHttps);
          if (limpio) poner(limpio);
        })
        .catch((e) => {
          console.warn('[Cartelería] No se pudo guardar el estilo de la banda:', e);
          poner(anterior);
          avisar(mensajeDe(e, 'No pudimos guardar el estilo de la banda.'));
        });
    },
    [avisar, poner]
  );

  const subirReferencia = async (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) return avisar('Eso no es una imagen.');
    if (archivo.size > MAX_REFERENCIA_BYTES) return avisar('La imagen pesa demasiado.');
    setSubiendo(true);
    avisar(null);
    try {
      const r = await subirReferenciaCartel(await prepararFoto(archivo, 1024));
      const limpio = sanearAdn(r.adn, esHttps);
      if (limpio) poner(limpio);
    } catch (e) {
      console.warn('[Cartelería] No se pudo subir la referencia:', e);
      avisar(mensajeDe(e, 'No pudimos guardar esa referencia.'));
    } finally {
      setSubiendo(false);
    }
  };

  const marcarFavorito = (f: FavoritoCartel) => {
    // Ya es el último favorito: no se vuelve a escribir cada vez que comparte el mismo cartel.
    if (actual.current.favoritos[0] && sinVersion(actual.current.favoritos[0].url) === sinVersion(f.url)) return;
    guardar(conFavorito(actual.current, f));
  };

  const sugerido = useMemo(() => estiloSugerido(adn, { plantilla: banda.plantilla, genero: banda.genero }), [adn, banda.plantilla, banda.genero]);

  return {
    adn,
    paletaBanda,
    subiendo,
    estiloSugerido: sugerido,
    referenciasQueMiraLaIa: referenciasParaIa(adn).length,
    subirReferencia,
    usarComoReferencia: (url: string) => guardar(conReferencia(actual.current, url)),
    quitarReferencia: (url: string) => guardar(sinReferencia(actual.current, url)),
    marcarFavorito,
    quitarFavorito: (url: string) => guardar(sinFavorito(actual.current, url)),
    alternarAprender: () => guardar({ ...actual.current, aprender: !actual.current.aprender }),
  };
}

export type AdnCartelApi = ReturnType<typeof useAdnCartel>;
