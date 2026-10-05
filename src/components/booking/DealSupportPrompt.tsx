import React, { useEffect, useState } from 'react';
import { useApoyableDeals } from '../../hooks/useApoyableDeals';
import { DealSupportCard } from './DealSupportCard';

interface DealSupportPromptProps {
  isLoggedIn: boolean;
  bandId?: string;
}

const claveDescartado = (bandId: string, dealId: string) => `bandmanager_apoyo_descartado_${bandId}_${dealId}`;

function leerDescartado(bandId: string, dealId: string): boolean {
  try {
    return localStorage.getItem(claveDescartado(bandId, dealId)) === '1';
  } catch {
    return false;
  }
}

/**
 * Aviso tras la firma de la sala: cuando un bolo se confirma, ofrece (una vez, descartable) la
 * aportación voluntaria. Solo muestra UN bolo a la vez para no atosigar, y no vuelve a salir
 * si la banda lo descarta o ya apoyó. También da las gracias al volver del pago (?apoyo=success).
 */
export const DealSupportPrompt: React.FC<DealSupportPromptProps> = ({ isLoggedIn, bandId }) => {
  const { deals } = useApoyableDeals(isLoggedIn, bandId);
  const [descartados, setDescartados] = useState<Set<string>>(new Set());
  const [gracias, setGracias] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultado = params.get('apoyo');
    if (!resultado) return;
    if (resultado === 'success') {
      setGracias(true);
      window.setTimeout(() => setGracias(false), 7000);
    }
    params.delete('apoyo');
    const resto = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${resto ? `?${resto}` : ''}${window.location.hash}`);
  }, []);

  if (!isLoggedIn || !bandId) return null;

  const pendiente = deals.find((d) => !descartados.has(d.deal_id) && !leerDescartado(bandId, d.deal_id));

  const descartar = (dealId: string) => {
    try {
      localStorage.setItem(claveDescartado(bandId, dealId), '1');
    } catch {
      /* sin localStorage: se descarta solo en esta sesión */
    }
    setDescartados((prev) => new Set(prev).add(dealId));
  };

  if (!pendiente && !gracias) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:right-4 sm:w-96" role="status" aria-live="polite">
      {gracias ? (
        <div className="rounded-[var(--r-l)] bg-[var(--ok-soft)] p-4 text-sm font-semibold text-[var(--ink)]">
          ¡Gracias por apoyar BandManager! Con esto pagamos servidor e IA para que otras bandas cierren sus bolos.
        </div>
      ) : (
        pendiente && <DealSupportCard deal={pendiente} onDismiss={() => descartar(pendiente.deal_id)} />
      )}
    </div>
  );
};
