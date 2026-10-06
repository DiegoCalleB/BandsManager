import { describe, it, expect } from 'vitest';
import { estadoReloj, gradosDeProgreso, AVISO_CAMBIO } from '../relojAcorde';

describe('estadoReloj', () => {
  const tiempos = [0, 2, 6];

  it('el progreso va de 0 a 1 entre el acorde y el siguiente', () => {
    expect(estadoReloj(tiempos, 1, 2, 20)).toMatchObject({ progreso: 0, restante: 4 });
    expect(estadoReloj(tiempos, 1, 4, 20)).toMatchObject({ progreso: 0.5, restante: 2 });
    expect(estadoReloj(tiempos, 1, 6, 20)).toMatchObject({ progreso: 1, restante: 0 });
  });

  it('avisa en el último tramo', () => {
    expect(estadoReloj(tiempos, 1, 5.1, 20)!.avisando).toBe(false);
    expect(estadoReloj(tiempos, 1, 5.3, 20)!.avisando).toBe(true);
    expect(AVISO_CAMBIO).toBe(0.8);
  });

  it('el último acorde dura hasta el final de la canción', () => {
    expect(estadoReloj(tiempos, 2, 13, 20)).toMatchObject({ progreso: 0.5, restante: 7 });
  });

  it('fuera de rango o acorde inexistente: acotado o null', () => {
    expect(estadoReloj(tiempos, 1, 0, 20)!.progreso).toBe(0);
    expect(estadoReloj(tiempos, 9, 0, 20)).toBeNull();
  });

  it('grados del reloj', () => {
    expect(gradosDeProgreso(0.25)).toBe(90);
    expect(gradosDeProgreso(2)).toBe(360);
    expect(gradosDeProgreso(-1)).toBe(0);
  });
});
