/**
 * Un fallo inesperado al sacar la letra (base de datos, disco…) no debe llegar al navegador con su
 * mensaje interno: el cuerpo de la respuesta lleva un texto fijo y el detalle queda en el log.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db.js', () => ({
  dbGetSongs: async () => {
    throw new Error('SECRETO-PG: relation "songs" no existe en el esquema interno');
  },
  dbUpsertSong: async () => undefined,
}));
vi.mock('../../routes/concert_to_album.js', () => ({ getAudioSnippetPath: async () => '' }));

import { ejecutarLetraSincronizada } from '../letraCancion.js';

describe('ejecutarLetraSincronizada: errores sin filtrar detalles internos', () => {
  it('con un fallo inesperado responde 500 con un texto fijo, sin el mensaje interno', async () => {
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await ejecutarLetraSincronizada('cancion-1', 'band-a');
    expect(r.status).toBe(500);
    expect(r.body.error).toBe('No se pudo procesar la letra.');
    expect(JSON.stringify(r.body)).not.toContain('SECRETO-PG');
    // el detalle sí queda en el log para poder diagnosticarlo
    expect((consola.mock.calls[0][1] as { message?: string }).message).toContain('SECRETO-PG');
    consola.mockRestore();
  });
});
