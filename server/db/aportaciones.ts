// Aportaciones del público al directorio (`catalogo_aportaciones`): solo inserción desde el backend.
// La tabla no tiene políticas para anon/authenticated: el email opcional de quien aporta no sale de aquí.

import { getSupabase } from './core.js';
import type { Aportacion } from '../utils/aportaciones.js';

export async function dbGuardarAportacion(a: Aportacion): Promise<void> {
  const { error } = await getSupabase().from('catalogo_aportaciones').insert(a);
  if (error) throw new Error(`No se pudo guardar la aportación: ${error.message}`);
}
