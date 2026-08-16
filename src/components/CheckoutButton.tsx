import React, { useState } from 'react';
import { Sparkles, CreditCard, Loader2 } from 'lucide-react';
import { ThemeColors } from '../types';

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
  bandId = 'default',
  userEmail = 'diego.delacalleb@gmail.com',
  className = '',
  children,
  colors
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

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingInterval,
          bandId,
          userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al conectar con la pasarela de pago');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió la URL de redirección de Stripe');
      }
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
        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-98 disabled:opacity-75 disabled:cursor-wait ${className}`}
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
        <p className="mt-2 text-xs text-red-500 text-center font-medium bg-red-50 dark:bg-red-950/30 p-2 rounded-lg border border-red-200 dark:border-red-900">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
