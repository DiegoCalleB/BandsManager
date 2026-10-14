import { describe, it, expect } from 'vitest';
import { calcularIndicadores, textoVariacion } from '../indicadoresMarketing';
import type { Fan, Lead } from '../../types';

const HOY = new Date('2026-10-20T12:00:00Z');
const hace = (dias: number) => new Date(HOY.getTime() - dias * 86_400_000).toISOString();
const fan = (fechaCaptura: string) => ({ id: fechaCaptura, nombre: 'x', email: 'x@x.com', fechaCaptura, consentimientoRGPD: true }) as Fan;
const lead = (extra: Partial<Lead>) => ({ id: 'l', ...extra }) as Lead;

describe('calcularIndicadores', () => {
  it('reparte fans entre la ventana actual y la anterior, e ignora lo demás', () => {
    const r = calcularIndicadores({
      fans: [fan(hace(1)), fan(hace(29)), fan(hace(31)), fan(hace(59)), fan(hace(61)), fan('no-es-fecha'), fan(hace(-3))],
      leads: [],
      hoy: HOY,
    });
    expect(r.fans).toEqual({ actual: 2, anterior: 2 });
  });

  it('cuenta envíos, respuestas y síes por su fecha', () => {
    const r = calcularIndicadores({
      fans: [],
      hoy: HOY,
      leads: [
        lead({ fecha_envio: hace(5), fecha_ultima_respuesta: hace(2), estado: 'confirmado' }),
        lead({ fecha_envio: hace(10), fecha_ultima_respuesta: hace(3), estado: 'negociando' }),
        lead({ fecha_envio: hace(40), estado: 'enviado' }),
        lead({ estado: 'nuevo' }),
      ],
    });
    expect(r.enviados).toEqual({ actual: 2, anterior: 1 });
    expect(r.respondieron).toEqual({ actual: 2, anterior: 0 });
    expect(r.dijeronSi).toEqual({ actual: 1, anterior: 0 });
    expect(r.vacio).toBe(false);
  });

  it('cuenta salas distintas que abrieron el dossier, una vez por ventana', () => {
    const vista = (fecha: string, id = 'epk-view-1') => ({ id, fecha, tipo: 'Email', notas: '' }) as NonNullable<Lead['historial_contacto']>[number];
    const r = calcularIndicadores({
      fans: [],
      hoy: HOY,
      leads: [
        // dos visitas en la ventana actual: sigue siendo una sala
        lead({ historial_contacto: [vista(hace(2)), vista(hace(4), 'epk-view-2')] }),
        // una ahora y otra en la ventana anterior: cuenta en las dos
        lead({ historial_contacto: [vista(hace(10)), vista(hace(40), 'epk-view-3')] }),
        // solo en la ventana anterior
        lead({ historial_contacto: [vista(hace(50))] }),
        // un clic de correo no es una visita al dossier
        lead({ historial_contacto: [{ id: 'click-1', fecha: hace(1), tipo: 'Email', notas: '' } as never] }),
        lead({}),
      ],
    });
    expect(r.abrieronDossier).toEqual({ actual: 2, anterior: 2 });
    expect(r.vacio).toBe(false);
  });

  it('sin nada en ninguna ventana está vacío', () => {
    expect(calcularIndicadores({ fans: [], leads: [lead({ estado: 'nuevo' })], hoy: HOY }).vacio).toBe(true);
  });
});

describe('textoVariacion', () => {
  it('lo dice en llano, sin sube/baja', () => {
    expect(textoVariacion({ actual: 0, anterior: 0 })).toBe('sin movimiento');
    expect(textoVariacion({ actual: 3, anterior: 3 })).toBe('igual que los 30 días anteriores');
    expect(textoVariacion({ actual: 3, anterior: 0 })).toBe('antes no había ninguno');
    expect(textoVariacion({ actual: 5, anterior: 2 })).toBe('3 más que los 30 días anteriores');
    expect(textoVariacion({ actual: 1, anterior: 4 })).toBe('3 menos que los 30 días anteriores');
  });
});
