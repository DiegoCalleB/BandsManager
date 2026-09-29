import React, { useState } from 'react';
import { Sparkles, CreditCard, Loader2 } from 'lucide-react';
import { ThemeColors } from '../types';
import { api } from '../services/api';

interface CheckoutButtonProps {
  planId: string;
  billingInterval?: 'monthly' | 'annual';
  bandId?: string;
  userEmail?: string;
  className?: string;
  children?: React.ReactNode;
  colors?: ThemeColors;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  planId,
  billingInterval = 'monthly',
  bandId,
  userEmail,
  className = '',
  children,
  colors,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (planId === 'ensayo') {
      alert('¡Plan Gratuito activado con éxito!');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Determine effective user email and bandId
      let effectiveEmail = userEmail;
      let effectiveBandId = bandId;

      if (!effectiveEmail || !effectiveBandId) {
        try {
          const storedUser = localStorage.getItem('bakandeya_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (!effectiveEmail && parsed.email) effectiveEmail = parsed.email;
            if (!effectiveBandId && parsed.band_id) effectiveBandId = parsed.band_id;
          }
          if (!effectiveBandId) {
            const activeBandId = localStorage.getItem('bakandeya_active_band_id');
            if (activeBandId) effectiveBandId = activeBandId;
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      await api.startCheckout({
        planId,
        billingInterval,
        bandId: effectiveBandId || 'default',
        userEmail: effectiveEmail && effectiveEmail.includes('@') ? effectiveEmail : undefined,
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      setErrorMessage(error.message || 'Error desconocido al procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-block w-full">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className={`w-full py-3 px-6 rounded-[var(--r-m)] font-medium transition-ui duration-200 cursor-pointer flex items-center justify-center gap-2 hover:shadow active:scale-[0.97] disabled:opacity-75 disabled:cursor-wait ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Conectando con Stripe...</span>
          </>
        ) : (
          children || (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Suscribirme ahora</span>
            </>
          )
        )}
      </button>
      {errorMessage && (
        <p className="mt-2 text-xs text-[var(--alert)] text-center font-medium bg-[var(--alert-soft)] p-2 rounded-[var(--r-s)]">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
