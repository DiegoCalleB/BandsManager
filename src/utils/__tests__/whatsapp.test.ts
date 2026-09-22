import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  normalizeWhatsAppPhone, 
  getWhatsAppUrl, 
  openWhatsAppChat, 
  WHATSAPP_WINDOW_NAME 
} from '../whatsapp';

describe('whatsapp utils', () => {
  it('has WHATSAPP_WINDOW_NAME defined as whatsapp_web', () => {
    expect(WHATSAPP_WINDOW_NAME).toBe('whatsapp_web');
  });

  describe('normalizeWhatsAppPhone', () => {
    it('returns empty string if input is null or undefined or empty', () => {
      expect(normalizeWhatsAppPhone('')).toBe('');
      expect(normalizeWhatsAppPhone(null)).toBe('');
      expect(normalizeWhatsAppPhone(undefined)).toBe('');
    });

    it('adds 34 to 9-digit Spanish mobile numbers starting with 6 or 7', () => {
      expect(normalizeWhatsAppPhone('612345678')).toBe('34612345678');
      expect(normalizeWhatsAppPhone('722345678')).toBe('34722345678');
      expect(normalizeWhatsAppPhone('612 34 56 78')).toBe('34612345678');
    });

    it('preserves country code if already present with + or 00', () => {
      expect(normalizeWhatsAppPhone('+34 612 34 56 78')).toBe('34612345678');
      expect(normalizeWhatsAppPhone('0034612345678')).toBe('34612345678');
      expect(normalizeWhatsAppPhone('+44 7911 123456')).toBe('447911123456');
    });

    it('removes spaces, hyphens, and parentheses', () => {
      expect(normalizeWhatsAppPhone('+34 (612) 34-56-78')).toBe('34612345678');
    });
  });

  describe('getWhatsAppUrl', () => {
    it('generates web.whatsapp.com URL on desktop with phone', () => {
      const url = getWhatsAppUrl('612345678');
      expect(url).toBe('https://web.whatsapp.com/send?phone=34612345678');
    });

    it('appends encoded text parameter when provided', () => {
      const url = getWhatsAppUrl('612345678', 'Hola, ¿cómo estás?');
      expect(url).toContain('https://web.whatsapp.com/send?phone=34612345678&text=Hola%2C%20%C2%BFc%C3%B3mo%20est%C3%A1s%3F');
    });
  });

  describe('openWhatsAppChat', () => {
    let originalWindow: any;

    beforeEach(() => {
      originalWindow = (globalThis as any).window;
    });

    afterEach(() => {
      (globalThis as any).window = originalWindow;
    });

    it('opens window with name whatsapp_web to reuse existing session', () => {
      const focusSpy = vi.fn();
      const openSpy = vi.fn().mockReturnValue({ focus: focusSpy, closed: false });
      (globalThis as any).window = { open: openSpy };

      openWhatsAppChat('612345678', 'Test message');

      expect(openSpy).toHaveBeenCalledWith(
        'https://web.whatsapp.com/send?phone=34612345678&text=Test%20message',
        'whatsapp_web'
      );
      expect(focusSpy).toHaveBeenCalled();
    });
  });
});
