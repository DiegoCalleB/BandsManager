// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';

const modal = vi.fn((_props: Record<string, unknown>) => null);
vi.mock('../../dashboard/AgentAutonomySettingsModal', () => ({
  AgentAutonomySettingsModal: (props: Record<string, unknown>) => modal(props),
}));
vi.mock('../ChatContext', () => ({
  useChat: () => ({
    isAdmin: true,
    isAutonomyModalOpen: true,
    setIsAutonomyModalOpen: () => undefined,
    bandDisplayName: 'Mi banda',
    currentUser: { id: 'u1', band_id: 'band-xyz' },
  }),
}));

import { AutonomyModalHost } from '../AutonomyModalHost';

describe('AutonomyModalHost', () => {
  it('pasa la banda y el usuario al modal: sin ellos el panel de email no carga la cuenta', () => {
    render((<AutonomyModalHost />) as ReactNode);
    expect(modal).toHaveBeenCalledWith(
      expect.objectContaining({ bandId: 'band-xyz', currentUser: expect.objectContaining({ id: 'u1' }), bandName: 'Mi banda' }),
    );
    cleanup();
  });
});
