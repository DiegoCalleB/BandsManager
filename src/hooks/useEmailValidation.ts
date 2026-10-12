import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

/**
 * Cachea validaciones de email para no hacer verificaciones innecesarias
 * Valida todos los leads de la banda de una vez
 */
export function useEmailValidation() {
  const [emailValidities, setEmailValidities] = useState<Record<string, boolean>>({});
  // Arranca en true: el efecto de abajo lanza la primera carga nada más montar.
  const [isLoading, setIsLoading] = useState(true);

  const aplicar = (validities: Record<string, boolean> | null) => {
    if (validities) setEmailValidities(validities);
  };

  const loadEmailValidities = async () => {
    setIsLoading(true);
    aplicar(await pedirValidezEmails());
    setIsLoading(false);
  };

  // Cargar al inicializar
  useEffect(() => {
    let vivo = true;
    pedirValidezEmails().then((validities) => {
      if (!vivo) return;
      if (validities) setEmailValidities(validities);
      setIsLoading(false);
    });
    return () => { vivo = false; };
  }, []);

  return { emailValidities, isLoading, reloadEmailValidities: loadEmailValidities };
}

/**
 * Helper para obtener status de email de un lead
 */
/** Pide al servidor qué emails de leads son válidos; `null` si falla (se avisa en consola). */
async function pedirValidezEmails(): Promise<Record<string, boolean> | null> {
  try {
    const data = await apiFetch<{ success?: boolean; validities?: Record<string, boolean> }>('/api/leads/validate-emails', { method: 'GET' });
    return data?.success && data.validities ? data.validities : null;
  } catch (err) {
    console.warn('Could not load email validities:', err);
    return null;
  }
}

export function getEmailStatus(
  leadId: string,
  email: string | null | undefined,
  emailValidities: Record<string, boolean>
): 'valid' | 'invalid' | 'empty' {
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
