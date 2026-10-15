/**
 * Solo los campos que el usuario ha cambiado de verdad entre una foto «original» y la «editada».
 *
 * Guardar la ficha de una sala mandaba el lead ENTERO tal y como estaba al pulsar «Editar»: si
 * mientras tanto un agente cambiaba el estado o se añadía un hilo de correo, al guardar solo el
 * teléfono se deshacía todo eso con datos viejos. Mandando únicamente lo cambiado, el resto
 * queda como lo tenga el servidor.
 */
export function camposCambiados<T extends object>(original: T, editado: T): Partial<T> {
  // Un campo borrado se manda como '' (no undefined, que JSON.stringify omitiría): de ahí `unknown`.
  const cambios: Partial<Record<keyof T, unknown>> = {};
  const claves = new Set([...Object.keys(original || {}), ...Object.keys(editado || {})] as (keyof T)[]);
  for (const k of claves) {
    const antes = original?.[k];
    const despues = editado?.[k];
    if (JSON.stringify(antes) !== JSON.stringify(despues)) {
      cambios[k] = despues === undefined ? '' : despues;
    }
  }
  return cambios as Partial<T>;
}
