import { useCallback, useEffect, useRef, useState } from 'react';
import { IDEA_VACIA, ideaVacia, type BriefIdea, type CampoIdea, type IdeaCartel } from '../../../utils/cartel/idea';
import { prepararFoto } from '../../../utils/cartel/render';
import { previsualizarBriefCartel, quitarBocetoCartel, subirBocetoCartel } from '../../../utils/promocionApi';

const MAX_BOCETO_BYTES = 25 * 1024 * 1024;
const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);

export interface BriefVisto {
  brief: BriefIdea;
  /** false = la IA de texto no respondió y se usará lo que escribió la persona tal cual. */
  traducido: boolean;
}

/**
 * La idea que la persona tiene del cartel: cinco campos cortos y un boceto opcional. El boceto se guarda en
 * el servidor (un fichero por banda) y la generación solo recibe «úsalo»: es el servidor quien lo lee.
 * Solo vive en esta sesión; no se escribe nada en el bolo.
 */
export function useIdeaCartel(avisar: (mensaje: string | null) => void) {
  const [idea, setIdea] = useState<IdeaCartel>(IDEA_VACIA);
  const [boceto, setBoceto] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [visto, setVisto] = useState<BriefVisto | null>(null);
  const [cargandoBrief, setCargandoBrief] = useState(false);
  const bocetoLocal = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (bocetoLocal.current) URL.revokeObjectURL(bocetoLocal.current);
    },
    []
  );

  // Cualquier cambio de la idea deja viejo lo que se había previsualizado.
  const cambiar = useCallback((campo: CampoIdea, valor: string) => {
    setIdea((p) => ({ ...p, [campo]: valor }));
    setVisto(null);
  }, []);

  const usarEjemplo = useCallback((ejemplo: IdeaCartel) => {
    setIdea(ejemplo);
    setVisto(null);
  }, []);

  const limpiar = useCallback(() => {
    setIdea(IDEA_VACIA);
    setVisto(null);
  }, []);

  const ponerBoceto = (url: string | null) => {
    if (bocetoLocal.current) URL.revokeObjectURL(bocetoLocal.current);
    bocetoLocal.current = url;
    setBoceto(url);
    setVisto(null);
  };

  const subirBoceto = async (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) return avisar('Eso no es una imagen.');
    if (archivo.size > MAX_BOCETO_BYTES) return avisar('La imagen pesa demasiado.');
    setSubiendo(true);
    avisar(null);
    try {
      const jpeg = await prepararFoto(archivo, 1024);
      await subirBocetoCartel(jpeg);
      ponerBoceto(URL.createObjectURL(jpeg));
    } catch (e) {
      console.warn('[Cartelería] No se pudo guardar el boceto:', e);
      avisar(mensajeDe(e, 'No pudimos guardar ese boceto.'));
    } finally {
      setSubiendo(false);
    }
  };

  const quitarBoceto = () => {
    ponerBoceto(null);
    quitarBocetoCartel().catch((e) => console.warn('[Cartelería] No se pudo borrar el boceto del servidor:', e));
  };

  const verBrief = async () => {
    if (ideaVacia(idea) && !boceto) return avisar('Cuenta algo de tu idea primero, aunque sea una línea.');
    setCargandoBrief(true);
    avisar(null);
    try {
      const r = await previsualizarBriefCartel({ idea, conBoceto: !!boceto });
      setVisto(r.brief ? { brief: r.brief, traducido: r.traducido } : null);
    } catch (e) {
      console.warn('[Cartelería] No se pudo preparar la vista previa de la idea:', e);
      avisar(mensajeDe(e, 'No pudimos preparar la idea ahora mismo.'));
    } finally {
      setCargandoBrief(false);
    }
  };

  return {
    idea,
    cambiar,
    usarEjemplo,
    limpiar,
    boceto,
    subiendo,
    subirBoceto,
    quitarBoceto,
    visto,
    cargandoBrief,
    verBrief,
    /** Lo que se manda al generar: nada si la persona no ha contado nada. */
    paraGenerar: { idea: ideaVacia(idea) ? undefined : idea, conBoceto: !!boceto },
  };
}

export type IdeaCartelApi = ReturnType<typeof useIdeaCartel>;
