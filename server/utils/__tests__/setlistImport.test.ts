// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { parseRawSetlistAIResponse, extractJsonFromAiText } from '../setlistImport';

describe('setlistImport: Resiliencia ante fallos de formato y parseo', () => {
  it('extrae JSON limpio rodeado de delimitadores markdown ```json ... ```', () => {
    const rawAiOutput = `Aquí tienes el repertorio extraído:
\`\`\`json
{
  "nombreSugerido": "Concierto Sala Sol 2026",
  "items": [
    { "type": "song", "titulo": "Héroes del Silencio - Entre dos tierras" },
    { "type": "block", "titulo": "Presentación de la banda", "blockType": "presentacion" },
    { "type": "song", "titulo": "Fiesta Pagana" },
    { "type": "block", "titulo": "BIS", "blockType": "bis" },
    { "type": "song", "titulo": "Dolores se llamaba Lola" }
  ]
}
\`\`\`
Espero que te sea de gran utilidad.`;

    const result = parseRawSetlistAIResponse(rawAiOutput);
    expect(result.nombreSugerido).toBe("Concierto Sala Sol 2026");
    expect(result.items.length).toBe(5);
    expect(result.items[0]).toEqual({ type: 'song', titulo: 'Héroes del Silencio - Entre dos tierras' });
    expect(result.items[1]).toEqual({ type: 'block', titulo: 'Presentación de la banda', blockType: 'presentacion' });
    expect(result.items[3]).toEqual({ type: 'block', titulo: 'BIS', blockType: 'bis' });
  });

  it('normaliza subtipos de bloque desconocidos a "otro" sin romper la ejecución', () => {
    const rawAiOutput = JSON.stringify({
      nombreSugerido: "Setlist Test",
      items: [
        { type: "song", titulo: "Canción 1" },
        { type: "block", titulo: "Momento acústico improvisado", blockType: "subtipo_inexistente_123" }
      ]
    });

    const result = parseRawSetlistAIResponse(rawAiOutput);
    expect(result.items[1].type).toBe('block');
    expect(result.items[1].blockType).toBe('otro');
  });

  it('trata tipos no reconocidos como "song" en lugar de descartar la línea', () => {
    const rawAiOutput = JSON.stringify({
      items: [
        { type: "pista_extra", titulo: "Tema Inesperado" }
      ]
    });

    const result = parseRawSetlistAIResponse(rawAiOutput);
    expect(result.items.length).toBe(1);
    expect(result.items[0].type).toBe('song');
    expect(result.items[0].titulo).toBe('Tema Inesperado');
    expect(result.nombreSugerido).toBe('Repertorio importado');
  });

  it('lanza error descriptivo cuando la IA devuelve texto vacío o sin canciones', () => {
    expect(() => parseRawSetlistAIResponse('')).toThrow(/sin respuesta de la IA/i);
    expect(() => parseRawSetlistAIResponse(JSON.stringify({ nombreSugerido: "Vacío", items: [] }))).toThrow(/No se detectó ningún tema/i);
  });

  it('extractJsonFromAiText maneja casos extremos sin lanzar excepciones', () => {
    expect(extractJsonFromAiText('')).toBe('');
    expect(extractJsonFromAiText('{"a": 1}')).toBe('{"a": 1}');
    expect(extractJsonFromAiText('Prefix {"k": "v"} Suffix')).toBe('{"k": "v"}');
  });
});
