import { describe, it, expect } from 'vitest';
import { ESTILOS_CARTEL } from '../estilos';
import { ETIQUETA_LETRA, LETRAS_CARTEL, VOCES, VOCES_CARTEL, resolverVoz } from '../voces';

describe('voces del cartel', () => {
  it('cada estilo tiene una voz, y una letra elegida manda sobre el estilo', () => {
    for (const e of ESTILOS_CARTEL) expect(VOCES_CARTEL).toContain(resolverVoz('auto', e));
    for (const v of VOCES_CARTEL) expect(resolverVoz(v, 'neon')).toBe(v);
  });

  it('el rock y el punk van en letra de cartel y lo vintage en serifa', () => {
    expect(resolverVoz('auto', 'gigposter')).toBe('cartel');
    expect(resolverVoz('auto', 'collage')).toBe('cartel');
    expect(resolverVoz('auto', 'vintage')).toBe('clasica');
    expect(resolverVoz('auto', 'minimal')).toBe('moderna');
  });

  it('todas tienen etiqueta y medidas coherentes (con ilustración el nombre es más pequeño)', () => {
    for (const l of LETRAS_CARTEL) expect(ETIQUETA_LETRA[l]).toBeTruthy();
    for (const v of VOCES_CARTEL) {
      expect(VOCES[v].tituloCompacto).toBeLessThan(VOCES[v].titulo);
      expect(VOCES[v].interlinea).toBeGreaterThan(0.8);
      expect(VOCES[v].interlinea).toBeLessThan(1.1);
    }
  });
});
