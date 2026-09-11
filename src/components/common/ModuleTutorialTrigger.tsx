import React from 'react';
import { HelpCircle } from 'lucide-react';
import { ModuleTutorialId } from '../../types/tutorial';

interface ModuleTutorialTriggerProps {
  moduleId: ModuleTutorialId;
  onClick: () => void;
  label?: string;
  variant?: 'compact' | 'pill' | 'button';
  className?: string;
}

export const ModuleTutorialTrigger: React.FC<ModuleTutorialTriggerProps> = ({
  moduleId,
  onClick,
  label = 'Guía rápida',
  variant = 'pill',
  className = ''
}) => {
  if (variant === 'compact') {
    return (
      <button
        id={`tutorial-trigger-compact-${moduleId}`}
        type="button"
        onClick={onClick}
        title={`Abrir guía y tutorial interactivo de ${moduleId}`}
        className={`p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-amber-400 border border-stone-700/70 transition-all cursor-pointer flex items-center justify-center active:scale-95 ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      id={`tutorial-trigger-${moduleId}`}
      type="button"
      onClick={onClick}
      title="Abrir guía interactiva paso a paso con las funciones clave"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700/90 text-stone-300 hover:text-amber-300 border border-stone-700/70 hover:border-amber-500/30 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-xs ${className}`}
    >
      <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden font-mono font-black text-amber-400">?</span>
    </button>
  );
};
