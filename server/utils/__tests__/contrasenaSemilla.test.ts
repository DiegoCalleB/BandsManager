import { describe, expect, it } from 'vitest';
import { contrasenaSemilla } from '../contrasenaSemilla';

describe('contrasenaSemilla', () => {
  it('usa SEED_USER_PASSWORD cuando está definida (desarrollo y E2E)', () => {
    expect(contrasenaSemilla({ SEED_USER_PASSWORD: 'clave-local-1' } as NodeJS.ProcessEnv)).toBe('clave-local-1');
  });

  it('sin variable, genera una contraseña aleatoria y distinta cada vez', () => {
    const a = contrasenaSemilla({} as NodeJS.ProcessEnv);
    const b = contrasenaSemilla({} as NodeJS.ProcessEnv);
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(20);
  });

  it('ignora una variable demasiado corta: nunca una contraseña débil', () => {
    const v = contrasenaSemilla({ SEED_USER_PASSWORD: '123' } as NodeJS.ProcessEnv);
    expect(v).not.toBe('123');
    expect(v.length).toBeGreaterThanOrEqual(20);
  });
});
