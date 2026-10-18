// Instancia única de la consulta al catálogo de salas sobre Supabase (comparte caché entre la ruta REST y el chat).
import { crearConsultaCatalogo } from '../services/consultaCatalogo.js';
import { puertoCatalogoSupabase } from './salasCatalogo.js';

export const consultaCatalogo = crearConsultaCatalogo(puertoCatalogoSupabase);
