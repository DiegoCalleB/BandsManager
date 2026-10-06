import { describe, expect, it } from 'vitest';
import { columnasOmitidasEnPeticion, avisarGuardadoParcial, CABECERA_GUARDADO_PARCIAL } from '../../utils/guardadoParcial';
import { columnaAusenteDe, escrituraTolerante } from '../tolerantWrite';

const falta = (col: string, tabla: string) => ({ code: 'PGRST204', message: `Could not find the '${col}' column of '${tabla}' in the schema cache` });

/** Escritor falso: rechaza las columnas que `inexistentes` dice que no están en la tabla. */
function escritor(tabla: string, inexistentes: string[]) {
  const llamadas: any[] = [];
  const escribir = async (payload: any) => {
    llamadas.push(JSON.parse(JSON.stringify(payload)));
    const filas = Array.isArray(payload) ? payload : [payload];
    const mala = inexistentes.find((c) => filas.some((f) => c in f));
    return mala ? { data: null, error: falta(mala, tabla) } : { data: payload, error: null };
  };
  return { escribir, llamadas };
}

describe('escrituraTolerante', () => {
  it('sin columnas ausentes escribe una sola vez', async () => {
    const { escribir, llamadas } = escritor('leads', []);
    const r = await escrituraTolerante('leads', { id: 'a', nombre_sala: 'x' }, escribir);
    expect(r.error).toBeNull();
    expect(r.omitidas).toEqual([]);
    expect(llamadas).toHaveLength(1);
  });

  it('quita solo la columna que falta y conserva el resto', async () => {
    const { escribir, llamadas } = escritor('epk_configs', ['traducciones']);
    const entrada = { band_id: 'b', biografia: 'hola', traducciones: { en: 1 } };
    const r = await escrituraTolerante('epk_configs', entrada, escribir);
    expect(r.error).toBeNull();
    expect(r.omitidas).toEqual(['traducciones']);
    expect(llamadas[1]).toEqual({ band_id: 'b', biografia: 'hola' });
    expect(entrada.traducciones).toBeDefined(); // no muta la entrada
  });

  it('encadena varias columnas ausentes', async () => {
    const { escribir } = escritor('concerts', ['gira_id', 'idioma']);
    const r = await escrituraTolerante('concerts', { id: '1', gira_id: 'g', idioma: 'es', sala: 's' }, escribir);
    expect(r.omitidas.sort()).toEqual(['gira_id', 'idioma']);
    expect(r.error).toBeNull();
  });

  it('funciona con arrays de filas', async () => {
    const { escribir, llamadas } = escritor('songs', ['notas_miembros']);
    await escrituraTolerante('songs', [{ id: '1', notas_miembros: {} }, { id: '2', notas_miembros: {} }], escribir);
    expect(llamadas[1]).toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('otros errores no se reintentan ni se esconden', async () => {
    let n = 0;
    const r = await escrituraTolerante('leads', { id: 'a' }, async () => {
      n++;
      return { data: null, error: { code: '23502', message: 'null value in column "nombre_sala"' } };
    });
    expect(n).toBe(1);
    expect(r.error.code).toBe('23502');
  });

  it('un error de columna de OTRA tabla no se confunde', () => {
    expect(columnaAusenteDe(falta('x', 'otra'), 'leads')).toBeNull();
    expect(columnaAusenteDe(falta('x', 'leads'), 'leads')).toBe('x');
  });

  it('no entra en bucle si la columna "ausente" no estaba en el payload', async () => {
    let n = 0;
    const r = await escrituraTolerante('leads', { id: 'a' }, async () => {
      n++;
      return { data: null, error: falta('fantasma', 'leads') };
    });
    expect(n).toBe(1);
    expect(r.error).not.toBeNull();
  });
});

describe('aviso de guardado parcial por petición', () => {
  it('vuelca las columnas omitidas en la cabecera al responder', async () => {
    const cabeceras: Record<string, any> = {};
    const res: any = {
      headersSent: false,
      writeHead: () => res,
      setHeader: (k: string, v: any) => (cabeceras[k] = v),
    };
    await new Promise<void>((resolve) => {
      avisarGuardadoParcial()({} as any, res, async () => {
        await escrituraTolerante('epk_configs', { band_id: 'b', miembros: [] }, async (p: any) => ('miembros' in p ? { data: null, error: falta('miembros', 'epk_configs') } : { data: p, error: null }));
        expect(columnasOmitidasEnPeticion()).toEqual(['epk_configs.miembros']);
        res.writeHead(200);
        resolve();
      });
    });
    expect(cabeceras[CABECERA_GUARDADO_PARCIAL]).toBe('epk_configs.miembros');
  });

  it('sin petición activa no rompe', async () => {
    expect(columnasOmitidasEnPeticion()).toEqual([]);
  });
});
