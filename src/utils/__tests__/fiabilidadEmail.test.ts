import { describe, it, expect } from 'vitest';
import { fiabilidadDelEmail, UMBRAL_ENVIO } from '../fiabilidadEmail';

const ahora = new Date('2026-11-08T12:00:00Z');
const hace = (dias: number) => new Date(ahora.getTime() - dias * 86_400_000).toISOString();

describe('fiabilidadDelEmail', () => {
  it('sin email: 0', () => {
    expect(fiabilidadDelEmail({ email: '' }, ahora).puntos).toBe(0);
  });

  it('respondió desde ese buzón: 100, aunque la evidencia sea vieja', () => {
    const r = fiabilidadDelEmail({ email: 'info@x.es', procedencia: { fuente: 'web', en: hace(400), confirmado_por_respuesta: true } }, ahora);
    expect(r.puntos).toBe(100);
    expect(r.nivel).toBe('confirmado');
  });

  it('rebotó: 0, gane lo que gane por lo demás', () => {
    expect(fiabilidadDelEmail({ email: 'info@x.es', rebotado: true, procedencia: { fuente: 'web', en: hace(1) } }, ahora).puntos).toBe(0);
  });

  it('leído en su web y comprobado hace poco: 90', () => {
    expect(fiabilidadDelEmail({ email: 'info@x.es', procedencia: { fuente: 'web', en: hace(200), verificado_en: hace(3) } }, ahora).puntos).toBe(90);
  });

  it('leído en su web hace más de 90 días sin volver a comprobarlo: 50 (caducado)', () => {
    const r = fiabilidadDelEmail({ email: 'info@x.es', procedencia: { fuente: 'web', en: hace(120) } }, ahora);
    expect(r.puntos).toBe(50);
    expect(r.nivel).toBe('caducado');
  });

  it('catálogo o ficha institucional: 75', () => {
    expect(fiabilidadDelEmail({ email: 'info@x.es', procedencia: { fuente: 'catalogo', en: hace(10) } }, ahora).puntos).toBe(75);
  });

  it('IA o buscador sin comprobar: 0', () => {
    expect(fiabilidadDelEmail({ email: 'info@x.es', procedencia: { fuente: 'ia', en: hace(1) } }, ahora).puntos).toBe(0);
    expect(fiabilidadDelEmail({ email: 'info@x.es', procedencia: { fuente: 'buscador', en: hace(1) } }, ahora).puntos).toBe(0);
  });

  it('aviso de dominio inexistente para ese email: 0', () => {
    const r = fiabilidadDelEmail({ email: 'info@x.es', procedencia: { fuente: 'web', en: hace(1), aviso: { tipo: 'dominio_inexistente', para: 'info@x.es' } } }, ahora);
    expect(r.puntos).toBe(0);
  });

  it('sin procedencia (lo escribió una persona): 80, la banda responde de él', () => {
    expect(fiabilidadDelEmail({ email: 'pepe@x.es' }, ahora).puntos).toBe(80);
  });

  it('el umbral de envío deja pasar 75 y bloquea 50', () => {
    expect(UMBRAL_ENVIO).toBe(75);
  });

  it('siempre explica el motivo', () => {
    expect(fiabilidadDelEmail({ email: 'info@x.es', procedencia: { fuente: 'web', en: hace(1) } }, ahora).motivo).toMatch(/web/i);
  });
});
