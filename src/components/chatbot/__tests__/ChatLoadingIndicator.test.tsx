// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';

const chat = vi.hoisted(() => ({ isLoading: true }));
vi.mock('../ChatContext', () => ({ useChat: () => chat }));

import { ChatLoadingIndicator } from '../ChatLoadingIndicator';

beforeEach(() => {
  vi.useFakeTimers();
  chat.isLoading = true;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ChatLoadingIndicator', () => {
  it('no pinta nada si no está pensando', () => {
    chat.isLoading = false;
    const { container } = render(<ChatLoadingIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('dice «Pensando…» desde el primer momento y avisa para lectores de pantalla', () => {
    render(<ChatLoadingIndicator />);
    expect(screen.getByRole('status').textContent).toContain('Pensando…');
  });

  it('si tarda, cuenta qué hace y que sigue en ello', () => {
    render(<ChatLoadingIndicator />);
    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.getByRole('status').textContent).toContain('catálogo de salas');
    act(() => void vi.advanceTimersByTime(8000));
    expect(screen.getByRole('status').textContent).toContain('Sigo en ello');
  });
});
