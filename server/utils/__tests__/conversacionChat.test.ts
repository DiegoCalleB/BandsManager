import { describe, it, expect } from 'vitest';
import type { Content } from '@google/genai';
import {
  acotarHistorial,
  agregarTurno,
  mensajeAceptable,
  MAX_CARACTERES_MENSAJE,
  MAX_CARACTERES_TURNO,
  MAX_TURNOS_HISTORIAL,
} from '../conversacionChat';

describe('mensajeAceptable', () => {
  it('acepta una cadena de longitud razonable', () => {
    expect(mensajeAceptable('hola')).toBe(true);
    expect(mensajeAceptable('a'.repeat(MAX_CARACTERES_MENSAJE))).toBe(true);
  });

  it('rechaza lo que no es cadena y lo que se pasa de largo', () => {
    expect(mensajeAceptable('a'.repeat(MAX_CARACTERES_MENSAJE + 1))).toBe(false);
    expect(mensajeAceptable(undefined)).toBe(false);
    expect(mensajeAceptable(42)).toBe(false);
    expect(mensajeAceptable({ toString: () => 'hola' })).toBe(false);
    expect(mensajeAceptable(['hola'])).toBe(false);
  });
});

describe('acotarHistorial', () => {
  it('conserva solo los últimos turnos', () => {
    const historial = Array.from({ length: MAX_TURNOS_HISTORIAL + 15 }, (_, i) => ({ sender: 'user', text: `m${i}` }));
    const r = acotarHistorial(historial);
    expect(r).toHaveLength(MAX_TURNOS_HISTORIAL);
    expect(r[r.length - 1].text).toBe(`m${MAX_TURNOS_HISTORIAL + 14}`);
    expect(r[0].text).toBe('m15');
  });

  it('recorta cada turno', () => {
    const r = acotarHistorial([{ sender: 'user', text: 'x'.repeat(MAX_CARACTERES_TURNO * 3) }]);
    expect(r[0].text).toHaveLength(MAX_CARACTERES_TURNO);
  });

  it('traduce el remitente a rol y trata como modelo todo lo que no es el usuario', () => {
    const r = acotarHistorial([
      { sender: 'user', text: 'hola' },
      { sender: 'bot', text: 'qué tal' },
      { sender: 'otra-cosa', text: 'x' },
    ]);
    expect(r.map((t) => t.role)).toEqual(['user', 'model', 'model']);
  });

  it('no revienta con una entrada que no es un array ni con elementos raros', () => {
    expect(acotarHistorial(undefined)).toEqual([]);
    expect(acotarHistorial('abc')).toEqual([]);
    expect(acotarHistorial({ length: 99 })).toEqual([]);
    expect(acotarHistorial([null, 3, 'x', { sender: 'user', text: 'ok' }])).toEqual([{ role: 'user', text: 'ok' }]);
  });

  it('descarta los turnos vacíos y serializa los que no son texto', () => {
    const r = acotarHistorial([
      { sender: 'user', text: '   ' },
      { sender: 'user' },
      { sender: 'bot', text: { a: 1 } },
    ]);
    expect(r).toEqual([{ role: 'model', text: '{"a":1}' }]);
  });
});

describe('agregarTurno', () => {
  it('une turnos consecutivos del mismo rol y alterna al cambiar', () => {
    const turnos: Content[] = [];
    agregarTurno(turnos, 'user', 'a');
    agregarTurno(turnos, 'user', 'b');
    agregarTurno(turnos, 'model', 'c');
    agregarTurno(turnos, 'user', 'd');
    expect(turnos).toEqual([
      { role: 'user', parts: [{ text: 'a' }, { text: 'b' }] },
      { role: 'model', parts: [{ text: 'c' }] },
      { role: 'user', parts: [{ text: 'd' }] },
    ]);
  });

  it('con una conversación vacía abre un turno nuevo', () => {
    const turnos: Content[] = [];
    agregarTurno(turnos, 'user', 'hola');
    expect(turnos).toEqual([{ role: 'user', parts: [{ text: 'hola' }] }]);
  });
});
