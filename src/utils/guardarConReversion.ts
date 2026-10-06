/**
 * Guardado optimista con marcha atrás.
 *
 * Muchos handlers de la UI actualizan el estado al instante y lanzan el `fetch` sin mirar la
 * respuesta (`fetch(...).catch(log)`): si el servidor rechazaba el cambio (4xx/5xx) o no había red,
 * la pantalla seguía mostrando algo que NO estaba guardado y se perdía en el siguiente refresco.
 * El aviso global (`saveErrors.ts`) ya dice «No se pudo guardar»; esto además deja la pantalla
 * como estaba, para que lo que se ve sea lo que hay guardado.
 *
 * Devuelve true si el servidor aceptó el cambio.
 */
export async function guardarOReverter(peticion: Promise<Response>, revertir: () => void): Promise<boolean> {
  try {
    const res = await peticion;
    if (res.ok) return true;
  } catch {
    // sin red / cancelada: se trata igual que un rechazo
  }
  try {
    revertir();
  } catch (e) {
    console.error('Error revirtiendo un cambio no guardado:', e);
  }
  return false;
}
