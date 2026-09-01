import { describe, it, expect, vi, beforeEach } from 'vitest';

function crearQueryBuilderMock(resultadoTerminal: any = { data: { id: 'thread-1', band_id: 'la-banda-real', category: 'salas', titulo: '', mensajes: [], resultado: 'positiva', notas: '', created_at: '2026-01-01' }, error: null }) {
  const builder: any = {
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(async () => resultadoTerminal)
  };
  return builder;
}

const fromMock = vi.fn();

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, '')
}));

import { dbUpdateExampleThread, dbDeleteExampleThread } from '../exampleThreads';

describe('dbUpdateExampleThread', () => {
  let builder: ReturnType<typeof crearQueryBuilderMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    builder = crearQueryBuilderMock();
    fromMock.mockReturnValue(builder);
  });

  // Un hilo de ejemplo se busca solo por id en la UI - si el update no filtrara también por
  // band_id de la sesión, cualquier banda que adivinara/reutilizara un id de hilo de otra banda
  // podría sobrescribir su contenido. Mismo tipo de comprobación que bandIdTrustBoundary.test.ts
  // hace para los `dbUpsertX`, aplicado aquí al UPDATE.
  it('filtra el update por id Y por la banda de la sesión, nunca solo por id', async () => {
    await dbUpdateExampleThread('thread-1', 'la-banda-real', {
      titulo: 'Editado',
      mensajes: [{ rol: 'banda', texto: 'hola', orden: 0 }],
      resultado: 'positiva'
    });

    expect(builder.eq).toHaveBeenCalledWith('id', 'thread-1');
    expect(builder.eq).toHaveBeenCalledWith('band_id', 'la-banda-real');
  });

  it('actualiza solo titulo/mensajes/resultado/notas, sin tocar category ni band_id', async () => {
    await dbUpdateExampleThread('thread-1', 'la-banda-real', {
      titulo: 'Editado',
      mensajes: [{ rol: 'sala', texto: 'respuesta', orden: 0 }],
      resultado: 'negativa',
      notas: 'nota'
    });

    expect(builder.update).toHaveBeenCalledWith({
      titulo: 'Editado',
      mensajes: [{ rol: 'sala', texto: 'respuesta', orden: 0 }],
      resultado: 'negativa',
      notas: 'nota'
    });
  });

  it('respeta cleanBandId igual que el resto de operaciones sobre el hilo', async () => {
    await dbUpdateExampleThread('thread-1', 'band-la-banda-real', {
      mensajes: [{ rol: 'banda', texto: 'hola', orden: 0 }]
    });

    expect(builder.eq).toHaveBeenCalledWith('band_id', 'la-banda-real');
  });
});

describe('dbDeleteExampleThread', () => {
  it('sigue filtrando por id y band_id (regresión: no perder el scoping al tocar este archivo)', async () => {
    const builder = crearQueryBuilderMock({ data: null, error: null });
    builder.delete = vi.fn(() => builder);
    fromMock.mockReturnValue(builder);

    await dbDeleteExampleThread('thread-1', 'la-banda-real');

    expect(builder.eq).toHaveBeenCalledWith('id', 'thread-1');
    expect(builder.eq).toHaveBeenCalledWith('band_id', 'la-banda-real');
  });
});
