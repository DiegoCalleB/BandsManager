import React from 'react';
import { HelpCircle } from 'lucide-react';
import { ModuleTutorialId } from '../../types/tutorial';

interface ModuleTutorialTriggerProps {
  moduleId?: ModuleTutorialId;
  onClick?: () => void;
  onOpen?: () => void;
  label?: string;
  variant?: 'compact' | 'pill' | 'button';
  className?: string;
}

export const ModuleTutorialTrigger: React.FC<ModuleTutorialTriggerProps> = ({
  moduleId = 'booking',
  onClick,
  onOpen,
  label = 'Guía rápida',
  variant = 'pill',
  className = '',
}) => {
  const handleClick = onClick || onOpen || (() => {});

  if (variant === 'compact') {
    return (
      <button
        id={`tutorial-trigger-compact-${moduleId}`}
        type="button"
        onClick={handleClick}
        title={`Abrir guía y tutorial interactivo de ${moduleId}`}
        className={`p-2 rounded-[var(--r-pill)] bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)] hover:text-[var(--acc-ink)] transition-colors cursor-pointer flex items-center justify-center active:scale-[0.97] ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      id={`tutorial-trigger-${moduleId}`}
      type="button"
      onClick={handleClick}
      title="Abrir guía interactiva paso a paso con las funciones clave"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-bold transition-colors cursor-pointer active:scale-[0.97] ${className}`}
    >
      <HelpCircle className="w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden font-bold text-[var(--acc-ink)]">?</span>
    </button>
  );
};
