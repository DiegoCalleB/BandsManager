import { describe, it, expect } from 'vitest';
import { ETIQUETA_PLANTILLA, PAPEL_PLANTILLA, PLANTILLAS, TINTA_PLANTILLA, dibujarPlantilla, esPlantilla } from '../plantillas';

/** Un contexto de canvas que solo apunta lo que se le pide: sirve para comprobar que el dibujo es determinista. */
function contextoGrabador() {
  const llamadas: string[] = [];
  const propiedades: Record<string, unknown> = {};
  const ctx = new Proxy(propiedades, {
    get: (_o, nombre: string) => (...args: unknown[]) => {
      llamadas.push(`${nombre}(${args.map((a) => (typeof a === 'number' ? a.toFixed(2) : String(a))).join(',')})`);
      // createLinearGradient & co devuelven un objeto con addColorStop.
      return { addColorStop: () => {} };
    },
    set: (o, nombre: string, valor) => {
      llamadas.push(`${nombre}=${String(valor)}`);
      o[nombre] = valor;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, llamadas };
}

describe('plantillas de autor', () => {
  it('cada plantilla tiene nombre, papel y tinta de texto', () => {
    for (const id of PLANTILLAS) {
      expect(ETIQUETA_PLANTILLA[id], id).toBeTruthy();
      expect(PAPEL_PLANTILLA[id], id).toMatch(/^#[0-9A-F]{6}$/i);
      expect(TINTA_PLANTILLA[id], id).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('solo se aceptan ids conocidos', () => {
    expect(esPlantilla('sol')).toBe(true);
    expect(esPlantilla('hacker')).toBe(false);
    expect(esPlantilla(5)).toBe(false);
    expect(esPlantilla(undefined)).toBe(false);
  });

  it.each(PLANTILLAS)('%s: la misma semilla dibuja exactamente lo mismo', (id) => {
    const a = contextoGrabador();
    const b = contextoGrabador();
    dibujarPlantilla(id, a.ctx, 1080, 1350, 42);
    dibujarPlantilla(id, b.ctx, 1080, 1350, 42);
    expect(a.llamadas.length).toBeGreaterThan(10);
    expect(a.llamadas).toEqual(b.llamadas);
  });

  it('otra semilla da pequeñas variaciones (cada bolo, su cartel)', () => {
    const variaciones = PLANTILLAS.filter((id) => {
      const a = contextoGrabador();
      const b = contextoGrabador();
      dibujarPlantilla(id, a.ctx, 1080, 1350, 1);
      dibujarPlantilla(id, b.ctx, 1080, 1350, 999);
      return a.llamadas.join('|') !== b.llamadas.join('|');
    });
    expect(variaciones.length).toBeGreaterThanOrEqual(4);
  });

  it('en un formato más alto el motivo no baja y lo que sobra se rellena', () => {
    const { ctx, llamadas } = contextoGrabador();
    dibujarPlantilla('sol', ctx, 1080, 1920, 7);
    // El último relleno cubre desde el final del motivo (1,2 veces el ancho = 1296 px) hasta el borde inferior.
    expect(llamadas.at(-1)).toMatch(/^fillRect\(0\.00,1295\.00,1080\.00,625\.00\)$/);
  });
});
