/**
 * Repite una tarea que falla (red, 5xx) esperando `esperasMs[i]` entre intentos. Si `cancelado()` pasa a true
 * (la persona ya cambió algo y habrá un guardado más nuevo) deja de insistir y relanza el último error.
 */
export async function conReintentos<T>(tarea: () => Promise<T>, esperasMs: number[], cancelado: () => boolean = () => false): Promise<T> {
  for (let intento = 0; ; intento++) {
    try {
      return await tarea();
    } catch (e) {
      if (intento >= esperasMs.length || cancelado()) throw e;
      await new Promise((r) => setTimeout(r, esperasMs[intento]));
      if (cancelado()) throw e;
    }
  }
}
