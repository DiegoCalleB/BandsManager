import { describe, it, expect } from 'vitest';
import { estimarViaje, mismaCiudad, resolverCiudad, normalizarCiudad } from '../viajeEstimado';

describe('resolverCiudad', () => {
  it('ignora tildes, mayúsculas y texto alrededor', () => {
    expect(resolverCiudad('MÁLAGA')).not.toBeNull();
    expect(resolverCiudad('Sala Apolo, Barcelona')?.clave).toBe('barcelona');
    expect(resolverCiudad('Teatro de Getafe (Madrid)')).not.toBeNull();
  });

  it('el alias más largo gana: Santa Cruz de Tenerife no es Tenerife a secas ni "cruz"', () => {
    expect(resolverCiudad('Santa Cruz de Tenerife')?.clave).toBe('santa cruz de tenerife');
  });

  it('no inventa ciudades ni se deja engañar por subcadenas', () => {
    expect(resolverCiudad('Local de ensayo')).toBeNull();
    expect(resolverCiudad('Calle Madridejos')).toBeNull();
    expect(resolverCiudad('')).toBeNull();
  });

  it('Ciudad Real no pierde la palabra "ciudad"', () => {
    expect(normalizarCiudad('Ciudad Real')).toBe('ciudad real');
    expect(resolverCiudad('Ciudad Real')?.clave).toBe('ciudad real');
  });
});

describe('mismaCiudad', () => {
  it('reconoce alias y satélites como la misma ciudad', () => {
    expect(mismaCiudad('Vitoria', 'Vitoria-Gasteiz')).toBe(true);
    expect(mismaCiudad('Getafe', 'Madrid')).toBe(true);
    expect(mismaCiudad('Madrid', 'Sevilla')).toBe(false);
  });
  it('desconocida contra desconocida solo es "misma" si el texto coincide', () => {
    expect(mismaCiudad('Villaquiensea', 'villaquiensea')).toBe(true);
    expect(mismaCiudad('Villaquiensea', 'Otraparte')).toBeNull();
  });
});

describe('estimarViaje', () => {
  it('Madrid–Sevilla ronda las 5-6 h de furgo', () => {
    const v = estimarViaje('Madrid', 'Sevilla')!;
    expect(v.medio).toBe('carretera');
    expect(v.minutos).toBeGreaterThan(300);
    expect(v.minutos).toBeLessThan(400);
  });

  it('Madrid–Toledo es un viaje corto', () => {
    expect(estimarViaje('Madrid', 'Toledo')!.minutos).toBeLessThan(90);
  });

  it('es simétrico', () => {
    expect(estimarViaje('Bilbao', 'Valencia')!.minutos).toBe(estimarViaje('Valencia', 'Bilbao')!.minutos);
  });

  it('misma ciudad o ciudad desconocida: sin estimación', () => {
    expect(estimarViaje('Madrid', 'Getafe')).toBeNull();
    expect(estimarViaje('Madrid', 'Villaquiensea')).toBeNull();
  });

  it('islas: no se conduce, vuelo/ferry con tiempo fijo', () => {
    expect(estimarViaje('Palma', 'Madrid')).toMatchObject({ medio: 'vuelo_o_ferry', minutos: 240 });
    expect(estimarViaje('Las Palmas', 'Sevilla')).toMatchObject({ medio: 'vuelo_o_ferry', minutos: 300 });
    expect(estimarViaje('Ibiza', 'Palma')).toMatchObject({ medio: 'vuelo_o_ferry', minutos: 180 });
  });
});
