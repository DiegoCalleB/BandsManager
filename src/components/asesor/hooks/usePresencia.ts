import { useCallback, useEffect, useState } from 'react';
import { crearEnlace } from '../../../utils/promocionApi';
import type { BiosPegadas, Presencia } from '../../../utils/asesor/presencia';
import type { Red } from '../../../utils/asesor/reglasFormato';
import { obtenerPresencia } from '../../../utils/asesorApi';

const CLAVE_BIOS = 'asesor-bios-pegadas';
const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);

/** Las bios que la banda pegó la última vez en este navegador. Sin almacenamiento (o roto) se parte de cero. */
function leerBios(): BiosPegadas {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE_BIOS) || '{}');
    return crudo && typeof crudo === 'object' ? (crudo as BiosPegadas) : {};
  } catch {
    return {};
  }
}

function guardarBios(bios: BiosPegadas) {
  try {
    localStorage.setItem(CLAVE_BIOS, JSON.stringify(bios));
  } catch {
    // Sin almacenamiento no pasa nada: la bio se vuelve a pegar.
  }
}

/**
 * La presencia de la banda: auditoría, kit SEO y enlaces. Las bios se guardan solo en este navegador
 * (no en el servidor) y viajan en cada petición. Crear un enlace con seguimiento recarga la revisión.
 */
export function usePresencia() {
  const [presencia, setPresencia] = useState<Presencia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bios, setBios] = useState<BiosPegadas>(leerBios);
  const [creando, setCreando] = useState<ReadonlySet<Red>>(new Set());

  const revisar = useCallback(async (biosActuales: BiosPegadas) => {
    setCargando(true);
    setError(null);
    try {
      setPresencia(await obtenerPresencia(biosActuales));
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo revisar vuestra presencia.'));
    } finally {
      setCargando(false);
    }
  }, []);

  // La primera revisión, con las bios guardadas. Como en `useAsesor`, el estado se pone desde la promesa y no directamente en el efecto.
  useEffect(() => {
    let vigente = true;
    obtenerPresencia(leerBios())
      .then((p) => { if (vigente) setPresencia(p); })
      .catch((e) => { if (vigente) setError(mensajeDe(e, 'No se pudo revisar vuestra presencia.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => {
      vigente = false;
    };
  }, []);

  const ponerBio = useCallback((red: Red, texto: string) => setBios((b) => ({ ...b, [red]: texto })), []);

  const revisarDeNuevo = useCallback(async () => {
    guardarBios(bios);
    await revisar(bios);
  }, [bios, revisar]);

  /** Crea (o recupera: es idempotente) el enlace con seguimiento de una red, hacia donde conviene ahora. */
  const crearEnlaceDeRed = useCallback(async (red: Red): Promise<boolean> => {
    if (!presencia) return false;
    const { destino, concertId } = presencia.enlaces.recomendado;
    setCreando((s) => new Set(s).add(red));
    setError(null);
    try {
      await crearEnlace({ concertId, destino, canal: red });
      await revisar(bios);
      return true;
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo crear el enlace.'));
      return false;
    } finally {
      setCreando((s) => {
        const n = new Set(s);
        n.delete(red);
        return n;
      });
    }
  }, [presencia, bios, revisar]);

  return { presencia, cargando, error, bios, ponerBio, revisarDeNuevo, crearEnlaceDeRed, creando };
}
