import { describe, it, expect } from 'vitest';
import {
  parseRawPerfectSetlistPlanAIResponse,
  generateRuleBasedFallbackPlan,
  PerfectSetlistPlan
} from '../perfectSetlistPlanner';
import { Song, SetlistItem } from '../../../src/types';

describe('perfectSetlistPlanner: Resiliencia ante fallos de formato, cuotas agotadas y robustez', () => {
  const mockSongs: Song[] = [
    { id: 's1', titulo: 'Balada Tranquila', duracionSegundos: 240, energia: 8, tonalidad: 'Lam' },
    { id: 's2', titulo: 'Rock Enérgico', duracionSegundos: 210, energia: 18, tonalidad: 'Mi' },
    { id: 's3', titulo: 'Himno de Cierre', duracionSegundos: 300, energia: 20, tonalidad: 'Sol' },
  ];

  const songsById = new Map<string, Song>(mockSongs.map(s => [s.id, s]));

  const catalogCandidates: Song[] = [
    { id: 'c1', titulo: 'Cover Clásico', duracionSegundos: 190, energia: 16, tonalidad: 'Re' },
    { id: 'c2', titulo: 'Tema Medio', duracionSegundos: 200, energia: 12, tonalidad: 'Do' },
  ];

  const mockItems: SetlistItem[] = [
    { id: 'item-1', tipoItem: 'cancion', songId: 's1' },
    { id: 'item-2', tipoItem: 'cancion', songId: 's2' },
    { id: 'item-3', tipoItem: 'cancion', songId: 's3' },
  ];

  it('parsea correctamente una respuesta JSON envuelta en markdown', () => {
    const rawAiText = `\`\`\`json
{
  "summary": "Mover el tema enérgico al principio para mejorar el arranque.",
  "actions": [
    { "type": "reorder", "from_position": 2, "to_position": 1, "reason": "Arrancar con más fuerza" },
    { "type": "add_song", "catalog_index": 1, "insert_at_position": 4, "reason": "Añadir clásico al final" },
    { "type": "add_block", "block_type": "chapa", "title": "Saludo inicial", "duracion_minutos": 2, "insert_at_position": 2, "reason": "Presentación" }
  ]
}
\`\`\``;

    const plan: PerfectSetlistPlan = parseRawPerfectSetlistPlanAIResponse(rawAiText, mockItems, songsById, catalogCandidates);
    expect(plan.summary).toContain("arranque");
    expect(plan.actions.length).toBe(3);
    expect(plan.actions[0].type).toBe('reorder');
    expect(plan.actions[1].type).toBe('add_song');
    expect(plan.actions[1].song_title).toBe('Cover Clásico');
    expect(plan.actions[2].type).toBe('add_block');
  });

  it('ignora acciones con índices fuera de límites o valores inválidos de la IA', () => {
    const rawAiText = JSON.stringify({
      summary: "Plan con alucinaciones de índices",
      actions: [
        { type: "reorder", from_position: 99, to_position: 1 }, // Posición 99 inválida (solo hay 3 items)
        { type: "add_song", catalog_index: 88, insert_at_position: 1 }, // C88 inválido (solo hay 2 candidatos)
        { type: "remove_song", item_position: 2, reason: "Quitar s2" }, // Válido
        { type: "add_block", block_type: "bloque_no_soportado", insert_at_position: 1 } // Bloque inválido
      ]
    });

    const plan = parseRawPerfectSetlistPlanAIResponse(rawAiText, mockItems, songsById, catalogCandidates);
    expect(plan.actions.length).toBe(1);
    expect(plan.actions[0].type).toBe('remove_song');
    expect(plan.actions[0].song_title).toBe('Rock Enérgico');
  });

  it('evita añadir dos veces el mismo tema del catálogo en un mismo plan', () => {
    const rawAiText = JSON.stringify({
      summary: "Plan duplicando temas",
      actions: [
        { type: "add_song", catalog_index: 1, insert_at_position: 2, reason: "Añadir tema" },
        { type: "add_song", catalog_index: 1, insert_at_position: 4, reason: "Duplicado de tema" }
      ]
    });

    const plan = parseRawPerfectSetlistPlanAIResponse(rawAiText, mockItems, songsById, catalogCandidates);
    expect(plan.actions.length).toBe(1);
  });

  it('genera un plan heurístico robusto ante cuotas de IA agotadas (fallback 429)', () => {
    // Escenario: s1 (energía 8) está al inicio, s2 (energía 18) está después.
    // El generador por reglas debe detectar que abrir con s1 no es óptimo y sugerir reordenar s2 al principio.
    const fallbackPlan = generateRuleBasedFallbackPlan(mockItems, songsById, catalogCandidates);

    expect(fallbackPlan.summary).toContain('motor de reglas');
    expect(fallbackPlan.actions.length).toBeGreaterThan(0);
    
    // Debe haber detectado la necesidad de reordenar hacia la posición 1
    const reorderAction = fallbackPlan.actions.find(a => a.type === 'reorder');
    expect(reorderAction).toBeDefined();
    expect(reorderAction?.to_position).toBe(1);
  });
});
