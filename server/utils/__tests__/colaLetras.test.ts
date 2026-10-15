import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  estadoTrasEjecucion, huecoDisponible, limiteLetrasMes, retrasoReintentoMs, MAX_INTENTOS, inicioDeMes,
} from '../colaLetras';

const leer = (r: string) => readFileSync(new URL(r, import.meta.url), 'utf8');

describe('reglas de la cola de letras', () => {
  it('traduce el resultado de la transcripción al estado del trabajo', () => {
    expect(estadoTrasEjecucion(200, 1).estado).toBe('hecha');
    expect(estadoTrasEjecucion(422, 1).estado).toBe('sin_letra'); // instrumental, no es fallo
    for (const s of [409, 400, 404]) expect(estadoTrasEjecucion(s, 1).estado).toBe('omitida');
  });

  it('reintenta los fallos transitorios y se rinde tras MAX_INTENTOS', () => {
    expect(estadoTrasEjecucion(502, 1)).toEqual({ estado: 'pendiente', reintentar: true });
    expect(estadoTrasEjecucion(500, MAX_INTENTOS - 1).reintentar).toBe(true);
    expect(estadoTrasEjecucion(502, MAX_INTENTOS)).toEqual({ estado: 'fallida', reintentar: false });
    expect(retrasoReintentoMs(2)).toBeGreaterThan(retrasoReintentoMs(1));
  });

  it('el tope mensual descuenta lo hecho y lo ya encolado, y nunca es negativo', () => {
    expect(huecoDisponible(20, 5, 3)).toBe(12);
    expect(huecoDisponible(5, 5, 0)).toBe(0);
    expect(huecoDisponible(5, 9, 4)).toBe(0);
    expect(limiteLetrasMes('local')).toBe(20);
    expect(limiteLetrasMes('plan-inventado')).toBe(limiteLetrasMes('ensayo'));
    expect(inicioDeMes(new Date('2026-10-17T10:00:00Z'))).toBe('2026-10-01T00:00:00.000Z');
  });
});

describe('cola de letras: garantías en el código', () => {
  const cola = leer('../../services/colaLetras.ts');
  const repo = leer('../../db/repertoire.ts');
  const rutas = leer('../../routes/repertorio.ts');
  const migracion = leer('../../../supabase/migrations/20261014_letras_automaticas.sql');

  it('revalida en el servidor con el mismo selector que el cliente y nunca sobrescribe', () => {
    expect(cola).toContain('resumirTranscripcion(');
    expect(cola).toContain('sobrescribir: false');
  });

  it('todo va acotado a la banda y respeta el tope del plan al encolar y al ejecutar', () => {
    expect(cola).toContain('cleanBandId(');
    expect(cola.match(/limiteLetrasMes\(/g)!.length).toBeGreaterThanOrEqual(3);
    expect(rutas).toContain('getTargetBandId(req)');
  });

  it('el disparo automático solo ocurre con audio nuevo y sin cifrado, y el ajuste nace apagado', () => {
    expect(repo).toContain('encolarLetraAutomatica');
    expect(repo).toMatch(/cifrado_texto \|\| ""\)\.trim\(\)/);
    expect(migracion).toMatch(/activado BOOLEAN NOT NULL DEFAULT false/);
    expect(migracion).toContain('UNIQUE (band_id, song_id)');
  });

  it('la ruta manual y la cola comparten la misma lógica y el mismo bloqueo', () => {
    expect(rutas).toContain('ejecutarLetraSincronizada(');
    expect(leer('../../services/letraCancion.ts')).toContain('analisisAcordesEnCurso.has(clave)');
  });
});
