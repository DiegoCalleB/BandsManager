// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import { dbDeleteConcert } from '../../db/concerts.js';
import { dbDeleteRehearsal } from '../../db/rehearsals.js';

describe('dbDeleteConcert & dbDeleteRehearsal helper function logic', () => {
  it('dbDeleteConcert export function exists', () => {
    expect(typeof dbDeleteConcert).toBe('function');
  });

  it('dbDeleteRehearsal export function exists', () => {
    expect(typeof dbDeleteRehearsal).toBe('function');
  });
});
