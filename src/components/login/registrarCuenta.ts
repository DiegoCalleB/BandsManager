import { guardarCookieDeSesion } from '../../utils/sessionCookie';
import { registrarEvento } from '../../utils/analitica';

export interface DatosAlta {
  leaderName: string;
  bandName: string;
  email: string;
  password: string;
  plan: string;
}

/** Crea la cuenta en el servidor, guarda la sesión y cuenta el alta en la analítica. Lanza con el mensaje del servidor si falla. */
export async function registrarCuenta(datos: DatosAlta) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Fallo en la creación de cuenta');
  if (data.token) {
    localStorage.setItem('bandmanager_token', data.token);
    guardarCookieDeSesion(data.token);
  }
  registrarEvento('Registro');
  return data;
}
