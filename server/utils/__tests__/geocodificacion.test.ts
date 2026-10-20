import { describe, it, expect } from 'vitest';
import { consultaDeCiudad, consultaDeSala, enEspana, puntoDeLaCiudad, puntoDeLaSala, urlNominatim } from '../geocodificacion.js';

const r = (o: Record<string, string>) => ({ lat: '40.4', lon: '-3.7', class: 'amenity', display_name: 'Sala Moby, Calle Mayor, Madrid, España', ...o });

describe('puntoDeLaSala', () => {
  it('acepta un local de la ciudad de la sala', () => {
    expect(puntoDeLaSala([r({})], 'Madrid')).toEqual({ lat: 40.4, lon: -3.7 });
  });
  it('descarta una calle o un municipio: no son la sala', () => {
    expect(puntoDeLaSala([r({ class: 'highway' }), r({ class: 'boundary' })], 'Madrid')).toBeNull();
  });
  it('descarta un homónimo de otra ciudad', () => {
    expect(puntoDeLaSala([r({ display_name: 'Sala Moby, Calle Real, Sevilla, España' })], 'Madrid')).toBeNull();
  });
  it('ignora tildes y mayúsculas al comparar la ciudad', () => {
    expect(puntoDeLaSala([r({ display_name: 'Sala X, MÁLAGA, España' })], 'malaga')).not.toBeNull();
  });
  it('descarta un punto fuera de España', () => {
    expect(puntoDeLaSala([r({ lat: '48.8', lon: '2.3', display_name: 'Sala Moby, Madrid, París' })], 'Madrid')).toBeNull();
    expect(puntoDeLaSala([r({ lat: 'abc' })], 'Madrid')).toBeNull();
  });
  it('prueba el siguiente resultado si el primero no vale', () => {
    expect(puntoDeLaSala([r({ class: 'highway' }), r({ lat: '41', lon: '-4' })], 'Madrid')).toEqual({ lat: 41, lon: -4 });
  });
});

describe('puntoDeLaCiudad y consultas', () => {
  it('toma el primer resultado dentro de España', () => {
    expect(puntoDeLaCiudad([r({ lat: '10', lon: '10' }), r({ lat: '43.01', lon: '-7.55' })])).toEqual({ lat: 43.01, lon: -7.55 });
    expect(puntoDeLaCiudad([])).toBeNull();
  });
  it('construye consultas legibles y acotadas a España', () => {
    expect(consultaDeSala({ nombre: 'Moby Dick', ciudad: 'Madrid' })).toBe('Moby Dick, Madrid, España');
    expect(consultaDeCiudad({ ciudad: 'Lugo', region: 'Galicia' })).toBe('Lugo, Galicia, España');
    expect(consultaDeCiudad({ ciudad: null, region: 'Galicia' })).toBeNull();
    const url = new URL(urlNominatim('Sala & Co, Madrid'));
    expect(url.hostname).toBe('nominatim.openstreetmap.org');
    expect(url.searchParams.get('countrycodes')).toBe('es');
    expect(url.searchParams.get('q')).toBe('Sala & Co, Madrid');
  });
  it('las islas y las ciudades autónomas están dentro de España', () => {
    expect(enEspana({ lat: 28.1, lon: -15.4 })).toBe(true);
    expect(enEspana({ lat: 39.6, lon: 3.0 })).toBe(true);
    expect(enEspana({ lat: 35.9, lon: -5.3 })).toBe(true);
  });
});
