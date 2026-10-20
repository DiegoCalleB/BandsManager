/**
 * Decide si el listado de leads debe mostrar el esqueleto de carga.
 * Solo hay "carga" cuando aún no llegó ningún dato: con leads ya en pantalla una recarga no los
 * oculta (evita parpadeos). Sin esto, la primera carga pintaba el vacío "ninguna sala" por error.
 */
export function estaCargandoLeads(syncStatus: 'synced' | 'syncing' | 'error', totalLeads: number): boolean {
  return syncStatus === 'syncing' && totalLeads === 0;
}
