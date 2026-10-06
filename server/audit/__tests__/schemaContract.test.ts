/**
 * AUDITORÍA 1 — Contrato código ↔ esquema.
 * Toda columna que el servidor escribe, filtra, ordena o selecciona con supabase-js debe existir
 * en el esquema real (supabase_schema.sql + migraciones). Habría cazado de inmediato las
 * columnas nuevas de epk_configs o `apoyo_porcentaje` usadas antes de aplicar su migración, y
 * los UPDATE de billing/tracking que fallaban en silencio.
 *
 * Si falla: añade la columna con una migración (y aplícala en Supabase) o corrige el código.
 * No amplíes las listas de excepciones sin una razón escrita.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { cargarEsquema, columnasPorTabla } from '../pgliteSchema';
import { escanearUsosDeColumnas, type UsoColumna } from '../codeScanner';

/** Tablas que el código prueba como alternativa y puede no existir (hay fallback explícito). */
const TABLAS_OPCIONALES = new Set(['booking_campaigns']);

/** Errores de carga del esquema aceptados, con motivo. */
const ERRORES_ESQUEMA_ACEPTADOS: Array<{ contiene: string; motivo: string }> = [
  { contiene: 'Función RPC de recuperación híbrida', motivo: 'usa el operador <=> de pgvector, que PGlite no incluye' },
  { contiene: 'public.band_campaigns', motivo: 'la migración 20260919 protege una tabla band_campaigns que no existe en ningún sitio (huérfana)' },
];

let columnas: Map<string, Set<string>>;
let erroresEsquema: Array<{ fichero: string; mensaje: string }>;
let usos: UsoColumna[];

beforeAll(async () => {
  const carga = await cargarEsquema();
  columnas = await columnasPorTabla(carga.db);
  erroresEsquema = carga.errores;
  usos = escanearUsosDeColumnas();
}, 180_000);

describe('contrato código ↔ esquema', () => {
  it('el esquema del repo se carga entero (salvo excepciones documentadas)', () => {
    const inesperados = erroresEsquema.filter((e) => !ERRORES_ESQUEMA_ACEPTADOS.some((a) => e.mensaje.includes(a.contiene)));
    expect(inesperados).toEqual([]);
  });

  it('el escáner encuentra usos (si no, el test no protege nada)', () => {
    expect(usos.length).toBeGreaterThan(500);
  });

  it('todas las tablas que usa el código existen', () => {
    const faltan = [...new Set(usos.filter((u) => !columnas.has(u.tabla) && !TABLAS_OPCIONALES.has(u.tabla)).map((u) => u.tabla))];
    expect(faltan).toEqual([]);
  });

  it('todas las columnas que el código escribe, filtra, ordena o selecciona existen', () => {
    const desconocidas = usos
      .filter((u) => columnas.has(u.tabla) && !columnas.get(u.tabla)!.has(u.columna))
      .map((u) => `${u.tabla}.${u.columna} [${u.tipo}/${u.metodo}] ${u.fichero}:${u.linea}`);
    expect(desconocidas).toEqual([]);
  });
});
