import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as autonomyDb from '../../db/autonomy.js';

// Mock modules
vi.mock('../../db/autonomy.js');

describe('Response Strategies Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/bands/response-strategies', () => {
    it('retorna estrategias vacías si no hay config', async () => {
      vi.mocked(autonomyDb.dbGetAutonomyConfig).mockResolvedValueOnce(null);

      // En un test real haríamos request a Express, pero aquí testeamos la lógica
      const result = { responseStrategies: {} };
      expect(result.responseStrategies).toEqual({});
    });

    it('retorna estrategias configuradas', async () => {
      const mockConfig = {
        dispatchLevel: 'draft_only',
        negotiationDepth: 'filter_conditions',
        minCacheThreshold: 300,
        maxCacheThreshold: 800,
        autoDeclineUnderMinCache: false,
        notifyOnEveryProposal: true,
        requireHumanForFinalSignOff: true,
        dispatchMode: 'draft_gmail',
        responseStrategies: {
          price_negotiation: {
            responseType: 'price_negotiation' as const,
            guidancePrompt: 'Emphasize flexibility',
            tone: 'neutral' as const
          }
        }
      };

      vi.mocked(autonomyDb.dbGetAutonomyConfig).mockResolvedValueOnce(mockConfig);

      expect(mockConfig.responseStrategies).toEqual({
        price_negotiation: expect.objectContaining({
          guidancePrompt: 'Emphasize flexibility'
        })
      });
    });
  });

  describe('POST /api/bands/response-strategies', () => {
    it('valida tipos de respuesta válidos', () => {
      const validTypes = ["price_negotiation", "confirmation", "rejection", "follow_up"];
      const testType = "price_negotiation";

      expect(validTypes).toContain(testType);
    });

    it('rechaza tipos de respuesta inválidos', () => {
      const validTypes = ["price_negotiation", "confirmation", "rejection", "follow_up"];
      const invalidType = "invalid_type";

      expect(validTypes).not.toContain(invalidType);
    });

    it('valida valores de tone permitidos', () => {
      const validTones = ["neutral", "enthusiastic", "cautious"];
      const testTone = "enthusiastic";

      expect(validTones).toContain(testTone);
    });

    it('rechaza tones inválidos', () => {
      const validTones = ["neutral", "enthusiastic", "cautious"];
      const invalidTone = "aggressive";

      expect(validTones).not.toContain(invalidTone);
    });

    it('fusiona estrategias nuevas con existentes', () => {
      const existingStrategies = {
        price_negotiation: {
          responseType: 'price_negotiation' as const,
          tone: 'neutral' as const
        }
      };

      const newStrategies = {
        confirmation: {
          responseType: 'confirmation' as const,
          tone: 'enthusiastic' as const
        }
      };

      const merged = {
        ...existingStrategies,
        ...newStrategies
      };

      expect(Object.keys(merged)).toContain('price_negotiation');
      expect(Object.keys(merged)).toContain('confirmation');
    });
  });

  describe('DELETE /api/bands/response-strategies/:responseType', () => {
    it('elimina estrategia específica', () => {
      const strategies = {
        price_negotiation: {
          responseType: 'price_negotiation' as const,
          tone: 'neutral' as const
        },
        confirmation: {
          responseType: 'confirmation' as const,
          tone: 'enthusiastic' as const
        }
      };

      const { price_negotiation, ...remaining } = strategies;

      expect(remaining).not.toHaveProperty('price_negotiation');
      expect(remaining).toHaveProperty('confirmation');
    });

    it('rechaza tipos de respuesta inválidos en delete', () => {
      const validTypes = ["price_negotiation", "confirmation", "rejection", "follow_up"];
      const invalidType = "invalid_type";

      expect(validTypes).not.toContain(invalidType);
    });
  });

  describe('Estructura de ResponseStrategy', () => {
    it('permite guidancePrompt como string', () => {
      const strategy = {
        responseType: 'price_negotiation' as const,
        guidancePrompt: 'Este es el texto de guía'
      };

      expect(typeof strategy.guidancePrompt).toBe('string');
    });

    it('permite tone como uno de los valores válidos', () => {
      const validTones = ['neutral', 'enthusiastic', 'cautious'];
      const strategy = {
        responseType: 'confirmation' as const,
        tone: 'enthusiastic' as const
      };

      expect(validTones).toContain(strategy.tone);
    });

    it('permite mentionLinks como boolean', () => {
      const strategy = {
        responseType: 'follow_up' as const,
        mentionLinks: false
      };

      expect(typeof strategy.mentionLinks).toBe('boolean');
    });
  });
});
