import { describe, it, expect } from 'vitest';
import {
  extraerMinutos,
  construirEventos,
  detectarChoques,
  choquesDeEvento,
  describirChoque,
  describirEvento,
  redactarChoque,
  type ContextoConflictos,
} from '../calendarConflicts';
import type { Concert, Rehearsal } from '../../types';

function concierto(id: string, fecha: string, extra: Partial<Concert> = {}): Concert {
  return {
    id,
    band_id: 'A',
    fecha,
    ciudad: 'Madrid',
    sala: `Sala ${id}`,
    cache: 0,
    aforo_vendido: 0,
    aforo_total: 0,
    contrato_firmado: true,
    estado_pago: 'pendiente',
    notas: '',
    tipo: 'sala',
    ...extra,
  };
}

function ensayo(id: string, fecha: string, hora: string, extra: Partial<Rehearsal> = {}): Rehearsal {
  return {
    id,
    band_id: 'A',
    fecha,
    hora,
    lugar: 'Local',
    asistentes: [],
    notas: '',
    estado: 'programado',
    ...extra,
  };
}

const ctx: ContextoConflictos = {
  miembrosDe: (b) => ({ A: ['u1', 'u2', 'u3'], B: ['u3', 'u4'], C: ['u5'] })[b] ?? [],
};

const choques = (cs: Concert[], rs: Rehearsal[], c: ContextoConflictos = ctx) =>
  detectarChoques(construirEventos(cs, rs, 'A'), c);

describe('extraerMinutos', () => {
  it('lee rangos, puntos y "h", e ignora números sueltos', () => {
    expect(extraerMinutos('18:00 - 21:30')).toEqual([1080, 1290]);
    expect(extraerMinutos('19.30')).toEqual([1170]);
    expect(extraerMinutos('20h')).toEqual([1200]);
    expect(extraerMinutos('5 músicos')).toEqual([]);
    expect(extraerMinutos('25:00')).toEqual([]);
    expect(extraerMinutos(undefined)).toEqual([]);
  });
});

describe('detectarChoques — misma banda', () => {
  it('dos ensayos que se pisan en horas → choque', () => {
    const r = choques([], [ensayo('r1', '2026-11-05', '18:00 - 20:00'), ensayo('r2', '2026-11-05', '19:00 - 21:00')]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ severidad: 'choque', motivo: 'solape_horario' });
  });

  it('ensayos seguidos sin solape y con margen → nada', () => {
    const r = choques([], [ensayo('r1', '2026-11-05', '16:00 - 18:00'), ensayo('r2', '2026-11-05', '19:30 - 21:00')]);
    expect(r).toEqual([]);
  });

  it('margen corto en sitios distintos → aviso, no choque', () => {
    const c = concierto('c1', '2026-11-05', {
      ciudad: 'Toledo',
      logisticaTecnica: { horaShow: '21:00', horaCierreToque: '23:00' },
    });
    const r = choques([c], [ensayo('r1', '2026-11-05', '22:30 - 23:00')]);
    // solapa (22:30 < 23:00) → choque. Probamos el margen con un ensayo que acaba justo antes:
    expect(r[0].severidad).toBe('choque');
    const r2 = choques([c], [ensayo('r2', '2026-11-05', '12:00 - 20:30')]);
    expect(r2).toHaveLength(1);
    expect(r2[0]).toMatchObject({ severidad: 'aviso', motivo: 'margen_corto', margenMin: 30 });
  });

  it('dos bolos confirmados el mismo día sin horas → choque; con uno posible → aviso', () => {
    const dos = choques([concierto('c1', '2026-11-05'), concierto('c2', '2026-11-05', { ciudad: 'Sevilla' })], []);
    expect(dos[0]).toMatchObject({ severidad: 'choque', motivo: 'mismo_dia' });

    const posible = choques([concierto('c1', '2026-11-05'), concierto('c2', '2026-11-05', { is_posible: true })], []);
    expect(posible[0].severidad).toBe('aviso');
  });

  it('bolo y ensayo el mismo día sin horas → solo aviso', () => {
    const r = choques([concierto('c1', '2026-11-05')], [ensayo('r1', '2026-11-05', '')]);
    expect(r[0]).toMatchObject({ severidad: 'aviso', motivo: 'mismo_dia' });
  });

  it('un ensayo cancelado no choca con nada', () => {
    const r = choques([], [ensayo('r1', '2026-11-05', '18:00'), ensayo('r2', '2026-11-05', '18:00', { estado: 'cancelado' })]);
    expect(r).toEqual([]);
  });

  it('convocatorias parciales con músicos distintos → no hay choque', () => {
    const r = choques(
      [],
      [
        ensayo('r1', '2026-11-05', '18:00 - 20:00', { convocatoria_tipo: 'parcial', convocados_ids: ['u1'] }),
        ensayo('r2', '2026-11-05', '18:00 - 20:00', { convocatoria_tipo: 'parcial', convocados_ids: ['u2'] }),
      ],
    );
    expect(r).toEqual([]);
  });

  it('una parcial contra una completa choca solo por los convocados', () => {
    const r = choques(
      [],
      [
        ensayo('r1', '2026-11-05', '18:00 - 20:00', { convocatoria_tipo: 'parcial', convocados_ids: ['u2'] }),
        ensayo('r2', '2026-11-05', '19:00 - 20:00'),
      ],
    );
    expect(r[0].personas).toEqual(['u2']);
  });

  it('el mismo evento duplicado (vista Todos + activa) no se choca consigo mismo', () => {
    const r1 = ensayo('r1', '2026-11-05', '18:00 - 20:00');
    expect(choques([], [r1, { ...r1 }])).toEqual([]);
  });

  it('ignora lo anterior a `desde`', () => {
    const rs = [ensayo('r1', '2026-01-05', '18:00 - 20:00'), ensayo('r2', '2026-01-05', '19:00 - 21:00')];
    expect(choques([], rs, { ...ctx, desde: '2026-06-01' })).toEqual([]);
  });
});

describe('detectarChoques — entre bandas', () => {
  const bolo = (id: string, band: string) => concierto(id, '2026-11-07', { band_id: band, bandName: `Banda ${band}` });

  it('solo choca si comparten músico (u3 está en A y B)', () => {
    const r = choques([bolo('c1', 'A'), bolo('c2', 'B')], []);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ entreBandas: true, personas: ['u3'] });
  });

  it('bandas sin músicos en común no chocan', () => {
    expect(choques([bolo('c1', 'A'), bolo('c2', 'C')], [])).toEqual([]);
  });

  it('sin mapa de miembros no se inventa nada entre bandas', () => {
    expect(choques([bolo('c1', 'A'), bolo('c2', 'B')], [], {})).toEqual([]);
  });

  it('si una banda no tiene miembros conocidos no se inventan choques con la otra', () => {
    const r = choques(
      [
        bolo('c1', 'A'),
        concierto('c2', '2026-11-07', { band_id: 'Z' }),
      ],
      [],
    );
    expect(r).toEqual([]);
  });

  it('si el compartido no está convocado en la parcial, no choca', () => {
    const r = choques(
      [
        bolo('c1', 'A'),
        concierto('c2', '2026-11-07', { band_id: 'B', convocatoria_tipo: 'parcial', convocados_ids: ['u4'] }),
      ],
      [],
    );
    expect(r).toEqual([]);
  });
});

describe('huella', () => {
  it('es estable entre llamadas y cambia si cambia la hora', () => {
    const base = [ensayo('r1', '2026-11-05', '18:00 - 20:00'), ensayo('r2', '2026-11-05', '19:00 - 21:00')];
    const h1 = choques([], base)[0].huella;
    expect(choques([], [...base].reverse())[0].huella).toBe(h1);
    const movido = [base[0], ensayo('r2', '2026-11-05', '19:30 - 21:00')];
    expect(choques([], movido)[0].huella).not.toBe(h1);
  });
});

describe('choquesDeEvento', () => {
  it('distingue concierto y ensayo con el mismo id', () => {
    const cs = choques([concierto('x', '2026-11-05')], [ensayo('x', '2026-11-05', '')]);
    expect(choquesDeEvento(cs, 'concierto', 'x')).toHaveLength(1);
    expect(choquesDeEvento(cs, 'ensayo', 'x')).toHaveLength(1);
    expect(choquesDeEvento(cs, 'ensayo', 'otro')).toHaveLength(0);
  });
});

describe('privacidad entre bandas (AGENTS.md §2.1)', () => {
  it('quien no está en la otra banda no ve dónde toca', () => {
    const [c] = choques(
      [
        concierto('c1', '2026-11-07', { band_id: 'A', sala: 'Sala Pública' }),
        concierto('c2', '2026-11-07', { band_id: 'B', sala: 'Sala Secreta', bandName: 'Los Otros' }),
      ],
      [],
    );
    const soloA = new Set(['A']);
    const texto = describirChoque(c, soloA);
    expect(texto).toContain('Sala Pública');
    expect(texto).not.toContain('Sala Secreta');
    expect(texto).not.toContain('Los Otros');
    expect(describirChoque(c, new Set(['A', 'B']))).toContain('Sala Secreta');
    expect(describirEvento(c.a)).toContain('Sala');
  });
});

describe('redactarChoque', () => {
  it('borra del dato (no solo del texto) lo que pertenece a bandas no visibles', () => {
    const [c] = choques(
      [
        concierto('c1', '2026-11-07', { band_id: 'A', sala: 'Sala Pública' }),
        concierto('c2', '2026-11-07', { band_id: 'B', sala: 'Sala Secreta', ciudad: 'Vigo', bandName: 'Los Otros' }),
      ],
      [],
    );
    const json = JSON.stringify(redactarChoque(c, new Set(['A'])));
    expect(json).toContain('Sala Pública');
    for (const secreto of ['Sala Secreta', 'Vigo', 'Los Otros', '"c2"']) expect(json).not.toContain(secreto);
  });
});
