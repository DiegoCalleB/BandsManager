/**
 * Tipo de elemento que se puede añadir a un setlist desde los atajos y el editor: una canción,
 * un bloque genérico o cualquiera de los subtipos de bloque (presentación, chapa, bis...).
 */
import type { SetlistItem } from "../../types";

/** `bloque_header` es el valor heredado que sigue enviando el botón «Bloque nuevo». Valor aceptado por `handleAddItemToSetlist` como primer discriminador del item. */
export type AddableItemKind = "cancion" | "bloque_header" | NonNullable<SetlistItem["bloqueSubtipo"]>;
