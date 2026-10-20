// Un fondo de IA puede traer el título y la fecha ya dibujados dentro de la ilustración. Se sabe por el nombre del
// fichero (`ia-t-…png`), así el cliente no necesita guardar nada más para saber que no debe pintar su propio texto.

export const PREFIJO_FONDO_CON_TEXTO = 'ia-t-';

export const fondoConTexto = (url: string): boolean => /\/ia-t-[^/?#]*\.png(?:[?#]|$)/.test(url);
