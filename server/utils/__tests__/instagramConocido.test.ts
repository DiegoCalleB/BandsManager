import { describe, it, expect } from 'vitest';
import { instagramConocido } from '../instagramConocido.js';

describe('instagramConocido', () => {
  it('reconoce una sala conocida por su nombre', async () => {
    expect(await instagramConocido('La Riviera')).toBe('@salariviera');
    expect(await instagramConocido('Ferrara Buskers Festival')).toBe('@ferrarabuskersfestival');
    expect(await instagramConocido('  Cocheras del Puerto ')).toBe('@puertohuelva');
  });

  it('la reconoce también por su web o su dominio', async () => {
    expect(await instagramConocido('Sala Desconocida', 'https://www.pandamadrid.com/')).toBe('@pandaclubmadrid');
    expect(await instagramConocido('Otra', 'https://rockville.es/agenda')).toBe('@salarockville');
    expect(await instagramConocido('Otra', 'https://feverup.com/es/madrid/candlelight')).toBe('@candlelight.concerts');
  });

  it('un dominio que solo contiene el texto no cuenta como el dominio', async () => {
    expect(await instagramConocido('Otra', 'https://rockville.es.malo.com/')).toBeNull();
  });

  it('una sala que no conoce devuelve null', async () => {
    expect(await instagramConocido('Sala Inventada Número Uno', 'https://ejemplo.es')).toBeNull();
    expect(await instagramConocido('Sala Inventada Número Uno')).toBeNull();
  });
});
