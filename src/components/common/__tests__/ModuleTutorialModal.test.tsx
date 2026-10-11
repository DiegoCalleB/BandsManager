// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { ModuleTutorialModal } from '../ModuleTutorialModal';
import { MODULE_TUTORIALS } from '../../../config/moduleTutorials';

afterEach(cleanup);
const id = 'epk' as keyof typeof MODULE_TUTORIALS;

describe('ModuleTutorialModal', () => {
  it('navega con las flechas y cierra con Escape', () => {
    const onClose = vi.fn();
    render(<ModuleTutorialModal moduleId={id} isOpen onClose={onClose} />);
    expect(document.body.textContent).toContain("Paso 1/");
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(document.body.textContent).toContain("Paso 2/");
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(document.body.textContent).toContain("Paso 1/");
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('al reabrirse vuelve al primer paso', () => {
    const { rerender } = render(<ModuleTutorialModal moduleId={id} isOpen onClose={() => {}} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(document.body.textContent).toContain("Paso 2/");
    rerender(<ModuleTutorialModal moduleId={id} isOpen={false} onClose={() => {}} />);
    rerender(<ModuleTutorialModal moduleId={id} isOpen onClose={() => {}} />);
    expect(document.body.textContent).toContain("Paso 1/");
  });
});
