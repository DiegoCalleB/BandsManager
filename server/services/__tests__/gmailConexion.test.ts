import { describe, it, expect, vi, beforeEach } from 'vitest';

// Base de datos en memoria: solo registered_bands.
const bandas: any[] = [];
const actualizaciones: any[] = [];
vi.mock('../../db/core.js', () => ({
  getSupabase: () => ({
    from: () => {
      const filtros: Array<(f: any) => boolean> = [];
      let cambios: any = null;
      const c: any = {
        select: () => c,
        update: (f: any) => { cambios = f; return c; },
        eq: (k: string, v: any) => (filtros.push((f) => f[k] === v), c),
        neq: (k: string, v: any) => (filtros.push((f) => f[k] !== v), c),
        ilike: (k: string, v: string) => (filtros.push((f) => String(f[k]).toLowerCase() === v.toLowerCase()), c),
        limit: () => c,
        maybeSingle: () => Promise.resolve({ data: bandas.find((f) => filtros.every((p) => p(f))) ?? null }),
        then: (r: any) => {
          const filas = bandas.filter((f) => filtros.every((p) => p(f)));
          if (cambios) { filas.forEach((f) => Object.assign(f, cambios)); actualizaciones.push(cambios); return Promise.resolve({ error: null }).then(r); }
          return Promise.resolve({ data: filas, error: null }).then(r);
        },
      };
      return c;
    },
  }),
}));

const enviar = vi.fn();
vi.mock('../transactionalEmail.js', () => ({
  sendTransactionalEmail: (...a: any[]) => enviar(...a),
  getProductionAppUrl: () => 'https://app.ejemplo.io',
}));

import { trasConectarGmail } from '../gmailConexion';

beforeEach(() => {
  vi.clearAllMocks();
  actualizaciones.length = 0;
  bandas.length = 0;
  bandas.push({ band_id: 'b1', nombre_banda: 'Los Ejemplo', email: 'viejo@correo.es' }, { band_id: 'b2', nombre_banda: 'Otra', email: 'ocupado@gmail.com' });
  enviar.mockResolvedValue({ success: true });
});

describe('trasConectarGmail', () => {
  it('Gmail distinto al email de acceso: sincroniza el email y avisa (conexión al Gmail, cambio al email anterior)', async () => {
    await trasConectarGmail('b1', 'Nuevo@Gmail.com');
    expect(bandas[0].email).toBe('nuevo@gmail.com');
    expect(enviar).toHaveBeenCalledTimes(2);
    const para = enviar.mock.calls.map((c) => c[0].to).sort();
    expect(para).toEqual(['nuevo@gmail.com', 'viejo@correo.es']);
    const aViejo = enviar.mock.calls.find((c) => c[0].to === 'viejo@correo.es')![0];
    expect(aViejo.html).toContain('viejo@correo.es');
    expect(aViejo.html).toContain('nuevo@gmail.com');
  });

  it('conecta la misma cuenta que ya era el email de acceso: un único aviso y sin cambios en la banda', async () => {
    bandas[0].email = 'banda@gmail.com';
    await trasConectarGmail('b1', 'banda@gmail.com');
    expect(actualizaciones.length).toBe(0);
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(enviar.mock.calls[0][0].to).toBe('banda@gmail.com');
  });

  it('el Gmail ya es el email de acceso de OTRA banda: no se pisa y el aviso de conexión llega a los dos', async () => {
    await trasConectarGmail('b1', 'ocupado@gmail.com');
    expect(bandas[0].email).toBe('viejo@correo.es');
    expect(bandas[1].email).toBe('ocupado@gmail.com');
    expect(enviar.mock.calls.map((c) => c[0].to).sort()).toEqual(['ocupado@gmail.com', 'viejo@correo.es']);
  });

  it('si el envío falla (o lanza) la conexión no se rompe', async () => {
    enviar.mockRejectedValue(new Error('Resend caído'));
    await expect(trasConectarGmail('b1', 'nuevo@gmail.com')).resolves.toBeUndefined();
    enviar.mockResolvedValue({ success: false, error: 'dominio no verificado' });
    await expect(trasConectarGmail('b1', 'otro@gmail.com')).resolves.toBeUndefined();
  });

  it('Google no devolvió el email: no se toca el email de acceso y se avisa al de la banda', async () => {
    await trasConectarGmail('b1', '');
    expect(bandas[0].email).toBe('viejo@correo.es');
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(enviar.mock.calls[0][0].to).toBe('viejo@correo.es');
  });

  it('una banda que no existe no rompe nada ni envía nada', async () => {
    await trasConectarGmail('no-existe', 'x@gmail.com');
    expect(enviar).not.toHaveBeenCalled();
  });
});
