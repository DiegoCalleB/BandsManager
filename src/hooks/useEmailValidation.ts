import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

/**
 * Cachea validaciones de email para no hacer verificaciones innecesarias
 * Valida todos los leads de la banda de una vez
 */
export function useEmailValidation() {
  const [emailValidities, setEmailValidities] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadEmailValidities = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/leads/validate-emails', { method: 'GET' });
      if (data.success && data.validities) {
        setEmailValidities(data.validities);
      }
    } catch (err) {
      console.warn('Could not load email validities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar al inicializar
  useEffect(() => {
    loadEmailValidities();
  }, []);

  return { emailValidities, isLoading, reloadEmailValidities: loadEmailValidities };
}

/**
 * Helper para obtener status de email de un lead
 */
export function getEmailStatus(leadId: string, email: string | null | undefined, emailValidities: Record<string, boolean>): 'valid' | 'invalid' | 'empty' {
  if (!email) return 'empty';
  return emailValidities[leadId] === false ? 'invalid' : 'valid';
}

/**
 * El Lector marca en las notas del lead los emails que rebotaron (NDR) tras el envío -
 * el destinatario no existía, aunque el envío en sí no dio ningún error al mandarlo.
 */
export function isBouncedLead(notas: string | null | undefined): boolean {
  return !!notas && notas.includes('[Email Rechazado]');
}
