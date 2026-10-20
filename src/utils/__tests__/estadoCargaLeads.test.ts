import { describe, expect, it } from 'vitest';
import { estaCargandoLeads } from '../estadoCargaLeads';

describe('estaCargandoLeads', () => {
  it('primera carga (sincronizando y sin leads): muestra esqueleto', () => {
    expect(estaCargandoLeads('syncing', 0)).toBe(true);
  });

  it('recarga con leads ya cargados: no oculta la lista', () => {
    expect(estaCargandoLeads('syncing', 12)).toBe(false);
  });

  it('sincronizado y sin leads: es un vacío real, no una carga', () => {
    expect(estaCargandoLeads('synced', 0)).toBe(false);
  });

  it('error y sin leads: no se queda en esqueleto eterno', () => {
    expect(estaCargandoLeads('error', 0)).toBe(false);
  });
});
