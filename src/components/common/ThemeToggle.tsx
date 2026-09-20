import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import {
  PREFERENCIAS as PREFERENCIAS_ESPECTRO,
  guardarPreferencia as guardarPreferenciaEspectro,
  leerPreferencia as leerPreferenciaEspectro,
} from '../../utils/temaEspectro';
import type { PreferenciaTema } from '../../utils/temaEspectro';

export const ThemeToggle: React.FC = () => {
  const [prefEspectro, setPrefEspectro] = useState<PreferenciaTema>(() =>
    leerPreferenciaEspectro()
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (theme: PreferenciaTema) => {
    setPrefEspectro(theme);
    guardarPreferenciaEspectro(theme);
    setIsOpen(false);
  };

  return (
    <div className="relative hidden md:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-[var(--r-m)] bg-[var(--surface)]/60 hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors flex items-center gap-1.5"
        title="Cambiar tema"
      >
        <Palette className="w-4 h-4" />
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
          {prefEspectro === 'system' ? 'Auto' : prefEspectro === 'light' ? 'Claro' : prefEspectro === 'dark' ? 'Oscuro' : 'Clásico'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 bg-[var(--surface)] rounded-[var(--r-m)] shadow-lg border border-[var(--hair)] z-50 min-w-[180px] overflow-hidden">
            {PREFERENCIAS_ESPECTRO.map((p) => {
              const isSelected = prefEspectro === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleThemeChange(p.id)}
                  className={`w-full px-3 py-2 text-left text-[11px] font-mono font-semibold flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? 'bg-[var(--acc)]/15 text-[var(--acc)]'
                      : 'text-[var(--ink-2)] hover:bg-[var(--surface)]/60'
                  }`}
                  title={p.descripcion}
                >
                  <span>{p.etiqueta}</span>
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
