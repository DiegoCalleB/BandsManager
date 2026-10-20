import { describe, it, expect } from 'vitest';
import { logoDeSala } from '../logoDeSala';

describe('logoDeSala', () => {
  it('saca el icono del dominio, sin www ni ruta', () => {
    expect(logoDeSala('https://www.salamoby.es/conciertos?x=1')).toBe('https://www.google.com/s2/favicons?domain=salamoby.es&sz=128');
  });
  it('acepta una web sin protocolo', () => {
    expect(logoDeSala('salamoby.es')).toBe('https://www.google.com/s2/favicons?domain=salamoby.es&sz=128');
  });
  it('sin web o con algo que no es un dominio, no hay logo', () => {
    expect(logoDeSala(null)).toBeNull();
    expect(logoDeSala('  ')).toBeNull();
    expect(logoDeSala('localhost')).toBeNull();
    expect(logoDeSala('http://')).toBeNull();
  });
  it('el dominio va codificado: no se puede colar otra consulta', () => {
    expect(logoDeSala('https://sala.es&sz=1')).not.toContain('&sz=1&');
  });
});
