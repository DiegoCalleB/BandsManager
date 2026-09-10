import React from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';

interface ModuleTutorialTriggerProps {
  onOpen: () => void;
  hasSeen?: boolean;
  label?: string;
  className?: string;
}

export const ModuleTutorialTrigger: React.FC<ModuleTutorialTriggerProps> = ({
  onOpen,
  hasSeen = false,
  label = 'Guía Rápida',
  className = '',
}) => {
  return (
    <button
      onClick={onOpen}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold rounded-xl transition-all shadow-sm ${className}`}
      title="Ver tutorial y guía rápida de este módulo"
    >
      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      <span>{label}</span>
      {!hasSeen && (
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
      )}
    </button>
  );
};
