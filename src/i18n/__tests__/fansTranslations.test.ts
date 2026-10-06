// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import {
  FAN_FORM_LANGUAGES,
  FAN_FORM_TRANSLATIONS,
  idiomasDisponiblesParaConcierto,
} from '../fansTranslations';

describe('fansTranslations', () => {
  it('todos los idiomas declarados tienen su diccionario', () => {
    for (const l of FAN_FORM_LANGUAGES) {
      expect(FAN_FORM_TRANSLATIONS[l.code], `falta el diccionario de ${l.code}`).toBeDefined();
    }
    expect(Object.keys(FAN_FORM_TRANSLATIONS).sort()).toEqual(FAN_FORM_LANGUAGES.map(l => l.code).sort());
  });
});

describe('idiomasDisponiblesParaConcierto: solo 2-3 banderas, nunca las 4', () => {
  it('concierto en español: solo español e inglés', () => {
    expect(idiomasDisponiblesParaConcierto('es')).toEqual(['es', 'en']);
  });

  it('concierto en inglés: solo español e inglés', () => {
    expect(idiomasDisponiblesParaConcierto('en')).toEqual(['es', 'en']);
  });

  it('concierto en checo (el caso de Praga): checo primero, luego inglés y español', () => {
    expect(idiomasDisponiblesParaConcierto('cs')).toEqual(['cs', 'en', 'es']);
  });

  it('concierto en italiano: italiano primero, luego inglés y español', () => {
    expect(idiomasDisponiblesParaConcierto('it')).toEqual(['it', 'en', 'es']);
  });

  it('nunca devuelve más de 3 idiomas', () => {
    for (const l of FAN_FORM_LANGUAGES) {
      expect(idiomasDisponiblesParaConcierto(l.code).length).toBeLessThanOrEqual(3);
    }
  });
});
