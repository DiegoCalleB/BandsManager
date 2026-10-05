import React, { useState } from 'react';
import { Button, PublicoSilhouette } from '../ui';
import { apiFetch } from '../../utils/api';
import type { ApoyableDeal } from '../../hooks/useApoyableDeals';

interface DealSupportCardProps {
  deal: ApoyableDeal;
  /** Si se pasa, aparece "Ahora no" (el aviso flotante); en la ficha del bolo no hace falta. */
  onDismiss?: () => void;
}

const euros = (cents: number) =>
  (cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/**
 * Aportación VOLUNTARIA a BandManager al cerrar un bolo. No es una comisión: el caché es íntegro
 * para la banda. El importe sugerido (3% redondeado al euro) lo calcula el servidor y en el
 * checkout de Stripe se puede cambiar o cerrar sin pagar.
 */
export const DealSupportCard: React.FC<DealSupportCardProps> = ({ deal, onDismiss }) => {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apoyar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const data = await apiFetch<{ url?: string }>('/api/donations/deal-support/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ dealId: deal.deal_id })
      });
      if (!data?.url) throw new Error('No se ha podido abrir el pago.');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.message || 'No se ha podido abrir el pago. Inténtalo en un rato.');
      setEnviando(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[var(--r-l)] bg-[var(--sunken)] p-4 sm:p-5">
      <PublicoSilhouette opacity={0.08} size="medium" animated className="pointer-events-none absolute -right-5 -bottom-6" />
      <div className="relative space-y-3">
        <div className="space-y-1">
          <p className="text-base font-bold text-[var(--ink)]">
            ¡Bolo cerrado en {deal.lugar_sala}!
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-2)]">
            BandManager no te cobra comisión: el caché es íntegro para la banda. Si te ha ahorrado
            horas de WhatsApp y de papeleo, apoya el proyecto con lo que te parezca justo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="md" onClick={apoyar} disabled={enviando}>
            {enviando ? 'Abriendo el pago…' : `Apoyar con ${euros(deal.suggested_cents)} €`}
          </Button>
          {onDismiss && (
            <Button variant="ghost" size="md" onClick={onDismiss} disabled={enviando}>
              Ahora no
            </Button>
          )}
        </div>

        <p className="text-xs text-[var(--ink-3)]">
          Es opcional. En el siguiente paso puedes cambiar la cifra o cerrar sin pagar.
        </p>
        {error && (
          <p role="alert" className="text-xs font-semibold text-[var(--alert)]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
