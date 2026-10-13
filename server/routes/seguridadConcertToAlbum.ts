import path from "path";

/**
 * Ruta local de un fichero fuente, confinada a public/.
 *
 * El `sourceFilePath` llegaba del body y se usaba tal cual: valía cualquier ruta absoluta del
 * servidor, y como estas rutas devuelven el trozo de audio o su transcripción, servía para
 * leerse ficheros que no son de nadie. Solo se aceptan los que están bajo public/, que es donde
 * viven las subidas y los temporales.
 */
export function rutaFuenteSegura(rutaPedida: unknown): string | null {
  if (typeof rutaPedida !== "string" || !rutaPedida.trim()) return null;
  const raiz = path.resolve(process.cwd(), "public");
  const resuelta = path.resolve(raiz, rutaPedida.trim());
  // La guarda va inline (sin variable intermedia) para que el análisis estático la reconozca.
  // La propia raíz tampoco vale: es un directorio, no un fichero fuente.
  if (!resuelta.startsWith(raiz + path.sep)) return null;
  return resuelta;
}

/**
 * Ruta de un fichero con nombre `nombre` dentro de `base`. El nombre ha de ser un nombre plano
 * (sin separadores ni `..`): títulos, índices o hashes que acaban en el nombre de un fichero
 * podían traer `../` del cliente y escribir fuera del directorio.
 */
export function rutaEnDirectorio(base: string, nombre: string): string {
  const raiz = path.resolve(base);
  if (!nombre || nombre.includes("\0") || nombre !== path.basename(nombre)) {
    throw new Error("Nombre de fichero no válido.");
  }
  const resuelta = path.resolve(raiz, nombre);
  if (!resuelta.startsWith(raiz + path.sep)) throw new Error("Nombre de fichero no válido.");
  return resuelta;
}

/** Índice de pista apto para un nombre de fichero: entero no negativo (el cliente manda cualquier cosa). */
export function indicePistaSeguro(valor: unknown): number {
  const n = Number.parseInt(String(valor), 10);
  return Number.isFinite(n) ? Math.abs(n) : 1;
}

/** Hosts de YouTube por hostname parseado; `evil.com/youtube.com` o `youtube.com.evil.com` no cuentan. */
export function esUrlYoutube(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
  } catch {
    return false;
  }
}

/**
 * Objeto JSON que la IA envuelve en texto: del primer `{` al último `}`. Equivale a
 * `/\{[\s\S]*\}/` pero sin la regex, que sobre texto largo es de coste polinómico.
 */
export function extraerObjetoJson(texto: string): string | null {
  const ini = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  return ini !== -1 && fin > ini ? texto.slice(ini, fin + 1) : null;
}
