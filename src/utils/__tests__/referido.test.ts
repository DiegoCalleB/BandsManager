import { describe, expect, it, vi } from 'vitest';
import {
  CADUCIDAD_REFERIDO_MS,
  atribuirReferidoPendiente,
  guardarReferido,
  leerCodigoDeUrl,
  limpiarReferido,
  referidoPendiente,
  type AlmacenReferido,
} from '../referido';

const almacenFalso = (): AlmacenReferido & { datos: Record<string, string> } => {
  const datos: Record<string, string> = {};
  return {
    datos,
    getItem: (k) => (k in datos ? datos[k] : null),
    setItem: (k, v) => void (datos[k] = v),
    removeItem: (k) => void delete datos[k],
  };
};
const AHORA = 1_800_000_000_000;

describe('leerCodigoDeUrl', () => {
  it('lee y normaliza un código válido', () => {
    expect(leerCodigoDeUrl('?ref=abcd2345&utm_source=insignia')).toBe('ABCD2345');
    expect(leerCodigoDeUrl('?utm_source=x&ref=A3F9C21B')).toBe('A3F9C21B');
  });
  it('ignora lo que no es un código', () => {
    for (const s of ['', '?ref=', '?ref=abc', '?ref=ABCD234567', '?ref=<script>', '?ref=ABCD-234', '?otro=ABCD2345', 'sin-interrogacion=1']) {
      expect(leerCodigoDeUrl(s)).toBeNull();
    }
  });
});

describe('guardado y caducidad', () => {
  it('guarda y recupera el código', () => {
    const a = almacenFalso();
    guardarReferido(a, 'ABCD2345', AHORA);
    expect(referidoPendiente(a, AHORA + 1000)).toBe('ABCD2345');
  });

  it('caduca a los 30 días', () => {
    const a = almacenFalso();
    guardarReferido(a, 'ABCD2345', AHORA);
    expect(referidoPendiente(a, AHORA + CADUCIDAD_REFERIDO_MS - 1)).toBe('ABCD2345');
    expect(referidoPendiente(a, AHORA + CADUCIDAD_REFERIDO_MS + 1)).toBeNull();
  });

  it('la primera invitación vigente manda: una segunda no la pisa', () => {
    const a = almacenFalso();
    guardarReferido(a, 'AAAA2222', AHORA);
    guardarReferido(a, 'BBBB3333', AHORA + 1000);
    expect(referidoPendiente(a, AHORA + 2000)).toBe('AAAA2222');
  });

  it('pero una invitación caducada sí se sustituye', () => {
    const a = almacenFalso();
    guardarReferido(a, 'AAAA2222', AHORA);
    guardarReferido(a, 'BBBB3333', AHORA + CADUCIDAD_REFERIDO_MS + 5);
    expect(referidoPendiente(a, AHORA + CADUCIDAD_REFERIDO_MS + 10)).toBe('BBBB3333');
  });

  it('un valor manipulado en el almacenamiento no sirve', () => {
    const a = almacenFalso();
    for (const raro of ['no es json', '{"codigo":"x","ts":1}', '{"codigo":"ABCD2345"}', '{"codigo":"ABCD2345","ts":"hoy"}', `{"codigo":"ABCD2345","ts":${AHORA * 2}}`, 'null', '[]']) {
      a.datos.bm_ref = raro;
      expect(referidoPendiente(a, AHORA)).toBeNull();
    }
  });

  it('sin almacenamiento disponible no revienta', () => {
    const roto: AlmacenReferido = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
    };
    expect(() => guardarReferido(roto, 'ABCD2345')).not.toThrow();
    expect(referidoPendiente(roto)).toBeNull();
    expect(() => limpiarReferido(roto)).not.toThrow();
  });
});

describe('atribuirReferidoPendiente', () => {
  it('envía el código una vez y lo borra', async () => {
    const a = almacenFalso();
    guardarReferido(a, 'ABCD2345');
    const enviar = vi.fn().mockResolvedValue({ atribuido: true });
    await atribuirReferidoPendiente(enviar, a);
    expect(enviar).toHaveBeenCalledWith('ABCD2345');
    expect(a.datos.bm_ref).toBeUndefined();
    await atribuirReferidoPendiente(enviar, a);
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('lo borra también si el servidor falla o rechaza (no se reintenta eternamente)', async () => {
    const a = almacenFalso();
    guardarReferido(a, 'ABCD2345');
    await atribuirReferidoPendiente(vi.fn().mockRejectedValue(new Error('sin red')), a);
    expect(a.datos.bm_ref).toBeUndefined();
  });

  it('sin código pendiente no llama al servidor', async () => {
    const enviar = vi.fn();
    await atribuirReferidoPendiente(enviar, almacenFalso());
    expect(enviar).not.toHaveBeenCalled();
  });
});
