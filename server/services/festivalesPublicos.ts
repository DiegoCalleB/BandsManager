// Proveedor de las fichas públicas de festivales: base de datos con respaldo en las fichas fijas (ver crearProveedorFestivales).
import { festivalesPublicosDeDb } from '../db/festivales.js';
import { captureError } from '../utils/errorTracking.js';
import { FESTIVALES } from '../utils/seo/festivales/datos.js';
import { crearProveedorFestivales } from '../utils/seo/festivales/proveedor.js';

export const obtenerFestivales = crearProveedorFestivales(() => festivalesPublicosDeDb(), FESTIVALES, {
  alFallar: (e) => captureError(e instanceof Error ? e : new Error(String(e)), { servicio: 'festivalesPublicos' }),
});
