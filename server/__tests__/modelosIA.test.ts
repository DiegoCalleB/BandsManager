import { describe, it, expect, beforeEach } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  MODELOS_RETIRADOS, modelosGoogleEnUso, modelosAProbar, registrarFalloModelo,
  reiniciarModelosApartados, esErrorModeloNoDisponible, FALLBACK_MODELS, MODELOS_EMBEDDING,
} from '../utils/modelosGemini';

/** Anti-regresión de "modelo desfasado": ver server/utils/modelosGemini.ts. */
function ficherosTs(dir: string, acc: string[] = []): string[] {
  for (const nombre of readdirSync(dir)) {
    if (nombre === 'node_modules' || nombre === '__tests__') continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) ficherosTs(ruta, acc);
    else if (/\.tsx?$/.test(nombre) && !/\.test\./.test(nombre)) acc.push(ruta);
  }
  return acc;
}

describe('registro de modelos de IA', () => {
  it('ningún modelo registrado está retirado', () => {
    for (const { id } of modelosGoogleEnUso()) expect(id, id).not.toMatch(MODELOS_RETIRADOS);
  });

  it('hay modelos de texto y de embeddings', () => {
    expect(FALLBACK_MODELS.length).toBeGreaterThan(0);
    expect(MODELOS_EMBEDDING.length).toBeGreaterThan(0);
  });

  it('ningún .ts del servidor escribe un ID de modelo entre comillas fuera de modelosGemini.ts', () => {
    const literal = /['"`](gemini-\d[\w.-]*|imagen-\d[\w.-]*|lyria-\d[\w.-]*|text-embedding-[\w.-]+|gemini-embedding-[\w.-]+|deepseek-(chat|reasoner)[\w.-]*)['"`]/;
    const infractores = ficherosTs('server')
      .filter(f => !f.endsWith('modelosGemini.ts'))
      .filter(f => literal.test(readFileSync(f, 'utf8')));
    expect(infractores, 'Mueve el ID a server/utils/modelosGemini.ts').toEqual([]);
  });
});

describe('modelos que Google retira se apartan solos', () => {
  beforeEach(() => reiniciarModelosApartados());

  it('reconoce un 404 de modelo, pero no una cuota', () => {
    expect(esErrorModeloNoDisponible(Object.assign(new Error('models/x is not found for API version'), { status: 404 }))).toBe(true);
    expect(esErrorModeloNoDisponible(new Error('429 RESOURCE_EXHAUSTED quota exceeded'))).toBe(false);
  });

  it('un modelo no disponible deja de probarse, pero nunca se queda la lista vacía', () => {
    const [a, b] = FALLBACK_MODELS;
    registrarFalloModelo(a, Object.assign(new Error('model not found'), { status: 404 }));
    expect(modelosAProbar()).not.toContain(a);
    expect(modelosAProbar()).toContain(b);
    for (const m of FALLBACK_MODELS) registrarFalloModelo(m, Object.assign(new Error('model not found'), { status: 404 }));
    expect(modelosAProbar()).toEqual(FALLBACK_MODELS);
  });

  it('un fallo de cuota NO aparta el modelo', () => {
    registrarFalloModelo(FALLBACK_MODELS[0], new Error('429 quota'));
    expect(modelosAProbar()[0]).toBe(FALLBACK_MODELS[0]);
  });
});
