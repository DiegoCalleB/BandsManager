// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { EnsayoCronometro } from '../EnsayoCronometro';

afterEach(cleanup);

describe('EnsayoCronometro', () => {
  it('muestra el tiempo inicial y lo actualiza cuando cambia initialElapsedSeg', () => {
    const { rerender } = render(<EnsayoCronometro initialElapsedSeg={65} isCompact />);
    expect(screen.getByText('01:05')).toBeTruthy();
    rerender(<EnsayoCronometro initialElapsedSeg={125} isCompact />);
    expect(screen.getByText('02:05')).toBeTruthy();
  });
});
