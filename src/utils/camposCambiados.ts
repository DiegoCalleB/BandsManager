/**
 * Solo los campos que el usuario ha cambiado de verdad entre una foto «original» y la «editada».
 *
 * Guardar la ficha de una sala mandaba el lead ENTERO tal y como estaba al pulsar «Editar»: si
 * mientras tanto un agente cambiaba el estado o se añadía un hilo de correo, al guardar solo el
 * teléfono se deshacía todo eso con datos viejos. Mandando únicamente lo cambiado, el resto
 * queda como lo tenga el servidor.
 */
export function camposCambiados<T extends Record<string, any>>(original: T, editado: T): Partial<T> {
  const cambios: Partial<T> = {};
  const claves = new Set([...Object.keys(original || {}), ...Object.keys(editado || {})]);
  for (const k of claves) {
    const antes = (original as any)?.[k];
    const despues = (editado as any)?.[k];
    if (JSON.stringify(antes) !== JSON.stringify(despues)) {
      (cambios as any)[k] = despues === undefined ? '' : despues;
    }
  }
  return cambios;
}
