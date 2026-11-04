import { describe, expect, it } from 'vitest';
import { diagnosticar, type EntradaDiagnostico } from '../diagnostico';

const HOY = '2026-10-28';
const base: EntradaDiagnostico = { hoy: HOY, conciertos: [], lanzamiento: null, ultimaPublicacion: null };
const bolo = (id: string, fecha: string) => ({ id, fecha, sala: 'Sala El Sol', ciudad: 'Madrid' });

describe('diagnosticar', () => {
  it('modo concierto con el bolo más cercano dentro de 21 días', () => {
    const d = diagnosticar({ ...base, conciertos: [bolo('lejos', '2026-11-15'), bolo('cerca', '2026-11-06'), bolo('pasado', '2026-10-01')] });
    expect(d.modo).toBe('concierto');
    expect(d.concierto?.id).toBe('cerca');
    expect(d.porque).toContain('en 9 días');
  });

  it('un bolo a más de 60 días todavía no cuenta', () => {
    expect(diagnosticar({ ...base, conciertos: [bolo('a', '2026-12-31')] }).modo).toBe('fondo');
  });

  describe('un bolo lejano (de 3 a 6 semanas) ya toca anunciarlo', () => {
    const lejano = (fecha: string) => ({ ...base, conciertos: [bolo('lejos', fecha)] });

    it('hoy 4 de noviembre y bolo el 12 de diciembre (38 días): modo concierto, a anunciarlo y calentarlo', () => {
      const d = diagnosticar({ ...base, hoy: '2026-11-04', conciertos: [bolo('b', '2026-12-12')] });
      expect(d).toMatchObject({ modo: 'concierto', dias: 38 });
      expect(d.concierto?.id).toBe('b');
      expect(d.porque).toBe('Tocáis en 38 días en Sala El Sol, Madrid: es lo único que tenéis a la vista, así que ya toca anunciarlo y empezar a calentarlo.');
      expect(d.soloEnElHorizonte).toBe(true);
    });

    it('a 21 días o menos sigue siendo «llenar la sala»; lejos, ya toca anunciarlo', () => {
      expect(diagnosticar(lejano('2026-11-18')).porque).toContain('toca llenar la sala'); // 21 días
      expect(diagnosticar(lejano('2026-11-19')).porque).toContain('ya toca anunciarlo'); // 22
      expect(diagnosticar(lejano('2026-11-18')).soloEnElHorizonte).toBeUndefined(); // cerca no hace falta decirlo
    });

    describe('si es lo único que tienen a la vista, se empieza antes (60 días)', () => {
      it('sin otro evento antes, llega a 60 días y lo dice', () => {
        expect(diagnosticar(lejano('2026-12-27'))).toMatchObject({ modo: 'concierto', dias: 60, soloEnElHorizonte: true }); // 60
        expect(diagnosticar(lejano('2026-12-28')).modo).toBe('fondo'); // 61
        expect(diagnosticar(lejano('2026-12-20')).porque).toContain('es lo único que tenéis a la vista');
      });

      it('con un estreno fechado antes del bolo no es lo único: el límite vuelve a 45 días y no se dice', () => {
        const estreno = { titulo: 'Furgo', fecha: '2026-12-01' }; // más allá de su ventana de 30 días, pero antes del bolo
        expect(diagnosticar({ ...lejano('2026-12-12'), lanzamiento: estreno })).toMatchObject({ modo: 'concierto', soloEnElHorizonte: false }); // 45
        expect(diagnosticar({ ...lejano('2026-12-12'), lanzamiento: estreno }).porque).toBe('Tocáis en 45 días en Sala El Sol, Madrid: ya toca anunciarlo y empezar a calentarlo.');
        expect(diagnosticar({ ...lejano('2026-12-13'), lanzamiento: estreno }).modo).toBe('fondo'); // 46
      });

      it('un estreno ya pasado, o posterior al bolo, no cuenta como otro evento antes', () => {
        expect(diagnosticar({ ...lejano('2026-12-20'), lanzamiento: { titulo: 'Viejo', fecha: '2026-09-01' } }).soloEnElHorizonte).toBe(true);
        expect(diagnosticar({ ...lejano('2026-12-20'), lanzamiento: { titulo: 'Después', fecha: '2027-02-01' } }).soloEnElHorizonte).toBe(true);
      });

      it('con varios bolos, manda el más cercano, y los demás no cuentan como «antes»', () => {
        expect(diagnosticar({ ...base, conciertos: [bolo('lejos', '2026-12-20'), bolo('antes', '2026-12-05')] })).toMatchObject({ soloEnElHorizonte: true });
        expect(diagnosticar({ ...base, conciertos: [bolo('lejos', '2026-12-20'), bolo('antes', '2026-12-05')] }).concierto?.id).toBe('antes');
      });
    });

    it('un estreno inminente pasa por delante, pero un bolo cercano manda sobre el estreno', () => {
      const estreno = { titulo: 'Furgo', fecha: '2026-11-07' };
      expect(diagnosticar({ ...lejano('2026-12-05'), lanzamiento: estreno }).modo).toBe('lanzamiento');
      expect(diagnosticar({ ...lejano('2026-11-10'), lanzamiento: estreno }).modo).toBe('concierto');
    });

    it('pasa por delante del rescate y de «volver a publicar»', () => {
      const rescate = { motivo: 'tres_seguidas' as const, formatoFlojo: null, mejor: null };
      expect(diagnosticar({ ...lejano('2026-12-05'), rescate }).modo).toBe('concierto');
      expect(diagnosticar({ ...lejano('2026-12-05'), ultimaPublicacion: '2026-10-01' }).modo).toBe('concierto');
    });

    it('con varios bolos, el más cercano', () => {
      expect(diagnosticar({ ...base, conciertos: [bolo('lejos', '2026-12-05'), bolo('antes', '2026-11-25')] }).concierto?.id).toBe('antes');
    });
  });

  it('el bolo manda sobre el lanzamiento', () => {
    const d = diagnosticar({ ...base, conciertos: [bolo('a', '2026-11-01')], lanzamiento: { titulo: 'Furgo', fecha: '2026-11-02' } });
    expect(d.modo).toBe('concierto');
  });

  it('modo lanzamiento antes y después del estreno', () => {
    expect(diagnosticar({ ...base, lanzamiento: { titulo: 'Furgo', fecha: '2026-11-20' } }).porque).toContain('sale en 23 días');
    expect(diagnosticar({ ...base, lanzamiento: { titulo: 'Furgo', fecha: '2026-10-20' } }).porque).toContain('salió hace 8 días');
    expect(diagnosticar({ ...base, lanzamiento: { titulo: 'Furgo', fecha: '2026-09-01' } }).modo).toBe('fondo');
  });

  it('reactivar solo si sabemos que llevan más de 10 días sin publicar', () => {
    expect(diagnosticar({ ...base, ultimaPublicacion: '2026-10-10' }).modo).toBe('reactivar');
    expect(diagnosticar({ ...base, ultimaPublicacion: '2026-10-25' }).modo).toBe('fondo');
    expect(diagnosticar(base).modo).toBe('fondo');
  });

  it('ignora fechas rotas', () => {
    expect(diagnosticar({ ...base, conciertos: [bolo('x', 'no-fecha')] }).modo).toBe('fondo');
  });
});
