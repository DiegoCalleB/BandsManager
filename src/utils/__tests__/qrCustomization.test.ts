import { describe, it, expect } from 'vitest';
import {
  DEFAULT_QR_CUSTOM_CONFIG,
  QR_PRESET_THEMES,
  getStoredQrConfig,
  saveStoredQrConfig,
} from '../../components/fans/qr/qrCustomizationConfig';

describe('QR Customization Engine', () => {
  it('has valid default configuration with high error correction level', () => {
    expect(DEFAULT_QR_CUSTOM_CONFIG.dotStyle).toBe('squircle');
    expect(DEFAULT_QR_CUSTOM_CONFIG.eyeStyle).toBe('rounded');
    expect(DEFAULT_QR_CUSTOM_CONFIG.colorPreset).toBe('band_accent');
    expect(DEFAULT_QR_CUSTOM_CONFIG.mascot).toBe('band_logo');
  });

  it('contains Dinosaurio Rockero and Pac-Man Arcade presets', () => {
    const dino = QR_PRESET_THEMES.find((t) => t.id === 'dino');
    expect(dino).toBeDefined();
    expect(dino?.config.mascot).toBe('dino');
    expect(dino?.config.eyeStyle).toBe('dino');
    expect(dino?.config.colorPreset).toBe('dino_jungle');

    const pacman = QR_PRESET_THEMES.find((t) => t.id === 'pacman');
    expect(pacman).toBeDefined();
    expect(pacman?.config.mascot).toBe('pacman');
    expect(pacman?.config.eyeStyle).toBe('pacman');
    expect(pacman?.config.dotStyle).toBe('pixel');
  });

  it('contains Rock Calavera, Cyberpunk, Vinilo and Cassette themes', () => {
    const skull = QR_PRESET_THEMES.find((t) => t.id === 'rock_skull');
    expect(skull).toBeDefined();
    expect(skull?.config.mascot).toBe('rock_skull');

    const vinyl = QR_PRESET_THEMES.find((t) => t.id === 'vinyl');
    expect(vinyl).toBeDefined();
    expect(vinyl?.config.mascot).toBe('vinyl');

    const cyberpunk = QR_PRESET_THEMES.find((t) => t.id === 'cyberpunk');
    expect(cyberpunk).toBeDefined();
    expect(cyberpunk?.config.mascot).toBe('electric_bolt');
  });

  it('stores and retrieves configuration per band correctly', () => {
    const customConfig = {
      ...DEFAULT_QR_CUSTOM_CONFIG,
      mascot: 'dino' as const,
      dotStyle: 'pixel' as const,
      primaryColor: '#10b981',
    };

    saveStoredQrConfig('test-band-123', customConfig);
    const loaded = getStoredQrConfig('test-band-123');

    expect(loaded.mascot).toBe('dino');
    expect(loaded.dotStyle).toBe('pixel');
    expect(loaded.primaryColor).toBe('#10b981');
  });
});
