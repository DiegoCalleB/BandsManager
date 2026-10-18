/**
 * Un email que ha aportado una IA o un buscador no es un hecho: se comprueba que su dominio existe (registros MX o A).
 * Si no se puede confirmar, el email SE GUARDA igual pero con un aviso para que la banda lo compruebe: un fallo de DNS
 * pasajero no debe hacer perder un email real, y la decisión de fiarse o no es de quien conoce la sala.
 * Los de Google Maps, la web de la sala o el catálogo se dan por buenos y no se consultan.
 */
import { isValidEmailCached } from '../utils/emailValidator.js';
import { procedenciaValida, type CamposDeEnriquecimiento } from '../utils/procedenciaDatos.js';

const CAMPOS_EMAIL = ['email_contacto', 'email_secundario'] as const;

/** Marca con un aviso los emails dudosos del lead. Devuelve los campos marcados. */
export async function avisarEmailsDudosos(
  lead: Partial<Record<(typeof CAMPOS_EMAIL)[number], string>> & CamposDeEnriquecimiento,
  validar: (email: string) => Promise<boolean> = isValidEmailCached,
): Promise<string[]> {
  const procedencia = procedenciaValida(lead.datos_fuentes);
  const marcados: string[] = [];
  for (const campo of CAMPOS_EMAIL) {
    const email = lead[campo];
    const origen = procedencia[campo];
    if (!email || !origen || (origen.fuente !== 'ia' && origen.fuente !== 'buscador')) continue;
    if (await validar(email).catch(() => true)) continue;
    origen.aviso = { tipo: 'dominio_inexistente', para: email };
    marcados.push(campo);
  }
  if (marcados.length) lead.datos_fuentes = procedencia;
  return marcados;
}
