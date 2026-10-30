import { describe, expect, it } from 'vitest';
import { diagnosticar, type EntradaDiagnostico } from '../diagnostico';
import { ESTRATEGIA_INICIAL, type EstrategiaMarketing } from '../estrategia';
import { buscarTarjeta, opcionesDeHoy, penalizacionPorFormato, semana, type AccionRegistrada } from '../opciones';

const HOY = '2026-10-28';
const base: EntradaDiagnostico = { hoy: HOY, conciertos: [], lanzamiento: null, ultimaPublicacion: null };
const bolo = (id: string, fecha: string) => ({ id, fecha, sala: 'Sala El Sol', ciudad: 'Madrid' });
const est = (cambios: Partial<EstrategiaMarketing> = {}): EstrategiaMarketing => ({ ...ESTRATEGIA_INICIAL, ...cambios });
const accion = (tarjetaId: string, formato: AccionRegistrada['formato'], a: AccionRegistrada['accion'], fecha = '2026-10-20'): AccionRegistrada => ({ fecha, tarjetaId, formato, accion: a });

describe('opcionesDeHoy', () => {
  it('el día de un hito lo recomienda primero, con atajo a la cartelería', () => {
    const d = diagnosticar({ ...base, conciertos: [bolo('b1', '2026-11-04')] }); // a 7 días: recordatorio
    const { recomendadas, alternativas } = opcionesDeHoy(d, est(), HOY);
    expect(recomendadas[0].id).toBe('hito-recordatorio');
    expect(recomendadas[0].atajo).toEqual({ vista: 'carteleria', concertId: 'b1' });
    expect(alternativas.length).toBeGreaterThan(0);
  });

  it('recorta las recomendadas al tiempo de la banda y deja el resto como alternativas', () => {
    const d = diagnosticar(base);
    expect(opcionesDeHoy(d, est({ horasSemana: 1 }), HOY).recomendadas).toHaveLength(1);
    const seis = opcionesDeHoy(d, est({ horasSemana: 6 }), HOY);
    expect(seis.recomendadas).toHaveLength(3);
    expect(seis.alternativas).toHaveLength(1);
  });

  it('respeta a quien no quiere salir a cámara', () => {
    const { recomendadas } = opcionesDeHoy(diagnosticar(base), est({ camara: 'nadie' }), HOY);
    expect(recomendadas[0].idea).toContain('Sin hablar a cámara');
  });

  it('rota los temas propios', () => {
    const { recomendadas } = opcionesDeHoy(diagnosticar(base), est({ pilares: ['La furgo'] }), HOY);
    expect(recomendadas[0].titulo).toBe('Tema de la semana: La furgo');
  });

  it('una idea saltada hoy desaparece y sube la siguiente', () => {
    const d = diagnosticar(base);
    const { recomendadas } = opcionesDeHoy(d, est({ horasSemana: 1 }), HOY, [accion('fondo-pilar', 'reel', 'saltado', HOY)]);
    expect(recomendadas[0].id).toBe('fondo-carrusel');
  });

  it('una idea hecha hoy se queda marcada', () => {
    const { recomendadas } = opcionesDeHoy(diagnosticar(base), est(), HOY, [accion('fondo-pilar', 'reel', 'hecho', HOY)]);
    expect(recomendadas.find((t) => t.id === 'fondo-pilar')?.hecha).toBe(true);
  });

  it('aprende: el formato que la banda siempre salta baja puestos', () => {
    const historial = [accion('x', 'reel', 'saltado'), accion('y', 'reel', 'saltado'), accion('z', 'reel', 'saltado')];
    const { recomendadas } = opcionesDeHoy(diagnosticar(base), est({ horasSemana: 1 }), HOY, historial);
    expect(recomendadas[0].formato).not.toBe('reel');
  });

  it('pero los hitos de un bolo no se mueven', () => {
    const d = diagnosticar({ ...base, conciertos: [bolo('b1', '2026-11-04')] });
    const historial = [1, 2, 3, 4].map((k) => accion(`p${k}`, 'post', 'saltado'));
    expect(opcionesDeHoy(d, est({ horasSemana: 1 }), HOY, historial).recomendadas[0].id).toBe('hito-recordatorio');
  });
});

describe('penalizacionPorFormato', () => {
  it('cuenta saltos menos hechos del último mes, entre 0 y 3', () => {
    const pen = penalizacionPorFormato([
      accion('a', 'reel', 'saltado'), accion('b', 'reel', 'saltado'), accion('c', 'reel', 'hecho'),
      accion('d', 'stories', 'hecho'),
      accion('e', 'carrusel', 'saltado', '2026-08-01'), // fuera de la ventana
    ], HOY);
    expect(pen).toEqual({ reel: 1, stories: 0 });
  });
});

describe('buscarTarjeta y semana', () => {
  it('solo encuentra ideas de hoy, también las que no salen entre las opciones', () => {
    const d = diagnosticar(base);
    expect(buscarTarjeta(d, est({ horasSemana: 1 }), HOY, 'stories-dia')?.formato).toBe('stories');
    expect(buscarTarjeta(d, est(), HOY, 'hito-anuncio')).toBeNull();
    expect(buscarTarjeta(d, est(), HOY, 42)).toBeNull();
  });

  it('devuelve los 7 últimos días con las piezas hechas', () => {
    const s = semana([accion('a', 'reel', 'hecho', HOY), accion('b', 'reel', 'saltado', HOY), accion('c', 'post', 'hecho', '2026-10-22')], HOY);
    expect(s).toHaveLength(7);
    expect(s[6]).toEqual({ fecha: HOY, hechas: 1 });
    expect(s[0]).toEqual({ fecha: '2026-10-22', hechas: 1 });
  });
});

describe('ideas según las redes de la banda', () => {
  const d = diagnosticar({ ...base, conciertos: [bolo('b1', '2026-11-04')] });
  const todas = (e: EstrategiaMarketing) => { const o = opcionesDeHoy(d, e, HOY); return [...o.recomendadas, ...o.alternativas]; };
  const e6 = (redes: EstrategiaMarketing['redes']) => est({ redes, horasSemana: 6 });

  it('por defecto el vídeo va a Instagram y TikTok, nunca a YouTube sin pedirlo', () => {
    const reel = todas(e6(['instagram', 'tiktok'])).find((t) => t.formato === 'reel')!;
    expect(reel.redes).toEqual(['instagram', 'tiktok']);
  });

  it('el mismo vídeo sirve para YouTube Shorts si la banda está allí', () => {
    const reel = todas(e6(['instagram', 'tiktok', 'youtube'])).find((t) => t.formato === 'reel')!;
    expect(reel.redes).toEqual(['instagram', 'tiktok', 'youtube']);
  });

  it('una banda solo de TikTok o de YouTube no ve carruseles ni stories de Instagram', () => {
    for (const redes of [['tiktok'], ['youtube'], ['tiktok', 'youtube']] as const) {
      const ideas = todas(e6([...redes]));
      expect(ideas.length).toBeGreaterThan(0);
      expect(ideas.every((t) => t.formato === 'reel' && t.redes.every((r) => redes.includes(r as never)))).toBe(true);
    }
  });

  it('el servidor valida con las mismas redes: una idea de Instagram no existe para una banda de TikTok', () => {
    const solo = e6(['tiktok']);
    expect(buscarTarjeta(d, solo, HOY, 'bolo-setlist')).toBeNull();
    expect(buscarTarjeta(d, solo, HOY, 'bolo-teaser')).toMatchObject({ formato: 'reel', redes: ['tiktok'] });
  });

  it('si ninguna idea del día encaja con sus redes, se dejan todas antes que un plan vacío', () => {
    const hito = diagnosticar({ ...base, conciertos: [bolo('b1', '2026-11-04')] });
    const sinIg = opcionesDeHoy(hito, e6(['youtube']), HOY);
    expect(sinIg.recomendadas.length + sinIg.alternativas.length).toBeGreaterThan(0);
  });
});

