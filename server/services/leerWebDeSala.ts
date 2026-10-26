/** Lectura de la web de una sala: la portada y, si hace falta, sus páginas de contacto. Es el adaptador real de `LeerWebDeSala`. */
import { fetchUrlExternaSegura } from '../utils/ssrfGuard.js';
import { urlPublica } from '../utils/salaCatalogo.js';

const RUTAS_DE_CONTACTO = ['/contacto', '/contact', '/contactos'];
/** Donde las salas suelen poner su aforo y ficha técnica. Se leen hasta `MAX_PAGINAS_DE_LA_SALA` de las que existan. */
const RUTAS_DE_LA_SALA = ['/la-sala', '/sala', '/el-espacio', '/espacio', '/ficha-tecnica', '/rider', '/alquiler', '/info'];
const MAX_PAGINAS_DE_LA_SALA = 2;

async function leer(url: string): Promise<string | null> {
  try {
    // La web es texto libre que escribió una banda o un directorio: va por el guard (DNS a IP pública, redirecciones
    // revalidadas, tope de tamaño y timeout), igual que el resto de lecturas de webs ajenas.
    const r = await fetchUrlExternaSegura(url, {
      timeoutMs: 6000,
      maxBytes: 1_500_000,
      maxRedirects: 3,
      headers: { 'User-Agent': 'BandManager/1.0 (+https://bandmanager.io; catalogo de salas)' },
    });
    return r.statusCode >= 200 && r.statusCode < 300 ? r.text() : null;
  } catch {
    return null;
  }
}

export async function leerWebDeSala(website: string): Promise<string[] | null> {
  const portada = urlPublica(website);
  if (!portada) return null;
  const paginas: string[] = [];
  const html = await leer(portada);
  if (html) paginas.push(html);
  else return null;
  const origen = new URL(portada).origin;
  for (const ruta of RUTAS_DE_CONTACTO) {
    const contacto = await leer(`${origen}${ruta}`);
    if (contacto) {
      paginas.push(contacto);
      break;
    }
  }
  let deLaSala = 0;
  for (const ruta of RUTAS_DE_LA_SALA) {
    if (deLaSala >= MAX_PAGINAS_DE_LA_SALA) break;
    const pagina = await leer(`${origen}${ruta}`);
    if (pagina) {
      paginas.push(pagina);
      deLaSala++;
    }
  }
  return paginas;
}
