import { describe, it, expect } from 'vitest';
import { defaultEpkConfigFor, EMPTY_EPK_CONFIG } from '../demoEpk.js';

describe('defaultEpkConfigFor', () => {
  it('una banda cualquiera recibe la base vacía, sin texto de otra banda', () => {
    const cfg = defaultEpkConfigFor('ruta66');
    expect(cfg).toBe(EMPTY_EPK_CONFIG);
    expect(JSON.stringify(cfg).toLowerCase()).not.toContain('bakandeya');
  });

  it('solo la banda demo de la plataforma recibe su semilla', () => {
    expect(defaultEpkConfigFor('bakandeya')).not.toBe(EMPTY_EPK_CONFIG);
  });
});
