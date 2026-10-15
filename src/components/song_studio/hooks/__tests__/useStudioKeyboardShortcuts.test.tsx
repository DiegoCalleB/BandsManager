// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useStudioKeyboardShortcuts, type StudioKeyboardShortcutsParams } from '../useStudioKeyboardShortcuts';
import type { Song } from '../../../../types';

function Sonda(props: StudioKeyboardShortcutsParams) {
  useStudioKeyboardShortcuts(props);
  return null;
}

function params(): StudioKeyboardShortcutsParams {
  return {
    song: { audioIdeas: [{ id: 'i1' }] } as unknown as Song,
    playingIdeaIdRef: { current: 'i1' },
    isRecordingTrack: false,
    stopRecordingTrackOverdub: vi.fn(),
    togglePlayIdea: vi.fn(async () => {}),
    handleStopIdea: vi.fn(),
    handlePauseIdea: vi.fn(),
    toggleIdeaLoop: vi.fn(),
    setIdeaCueIn: vi.fn(),
    setIdeaCueOut: vi.fn(),
    startRecordingTrackOverdub: vi.fn(async () => {}),
    setShowAddIdea: vi.fn(),
    currentTimeMap: {},
    handleSeekIdea: vi.fn(),
    durationMap: {},
    handleToggleMuteTrack: vi.fn(),
    handleToggleSoloTrack: vi.fn(),
    setShowCubaseHelp: vi.fn(),
    loopConfigMap: {},
  };
}

const pulsar = (code: string) => window.dispatchEvent(new KeyboardEvent('keydown', { code, cancelable: true }));

describe('useStudioKeyboardShortcuts', () => {
  it('Espacio alterna la reproducción de la idea en curso', () => {
    const p = params();
    render(<Sonda {...p} />);
    pulsar('Space');
    expect(p.togglePlayIdea).toHaveBeenCalledWith(p.song.audioIdeas![0]);
  });

  it('usa siempre las props más recientes (grabando: Espacio detiene la grabación)', () => {
    const p = params();
    const { rerender } = render(<Sonda {...p} />);
    rerender(<Sonda {...p} isRecordingTrack />);
    pulsar('Space');
    expect(p.stopRecordingTrackOverdub).toHaveBeenCalledTimes(1);
    expect(p.togglePlayIdea).not.toHaveBeenCalled();
  });

  it('deja de escuchar al desmontar', () => {
    const p = params();
    const { unmount } = render(<Sonda {...p} />);
    unmount();
    pulsar('Space');
    expect(p.togglePlayIdea).not.toHaveBeenCalled();
  });
});
