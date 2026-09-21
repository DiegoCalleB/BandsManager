import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import {
 PREFERENCIAS as PREFERENCIAS_ESPECTRO,
 guardarPreferencia as guardarPreferenciaEspectro,
 leerPreferencia as leerPreferenciaEspectro,
} from '../../utils/temaEspectro';
import type { PreferenciaTema } from '../../utils/temaEspectro';

interface ThemeToggleProps {
 /** Icono solo, sin la etiqueta de texto del tema activo — para sitios estrechos
 * como el pie de la barra lateral, junto a otros botones icon-only. */
 compact?: boolean;
 /** Abre el menú hacia arriba en vez de hacia abajo — para cuando el botón vive
 * pegado al borde inferior de la pantalla (pie de sidebar) y no hay sitio debajo. */
 openUpward?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false, openUpward = false }) => {
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
 className={`rounded-[var(--r-m)] bg-[var(--surface)]/60 hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors flex items-center gap-1.5 ${compact ? 'p-1.5' : 'p-2'}`}
 title="Cambiar tema"
 >
 <Palette className="w-4 h-4" />
 {!compact && (
 <span className="text-[11px] font-sans font-bold tracking-wider">
 {prefEspectro === 'system' ? 'Auto' : prefEspectro === 'light' ? 'Claro' : prefEspectro === 'dark' ? 'Oscuro' : 'Clásico'}
 </span>
 )}
 </button>

 {isOpen && (
 <>
 <div
 className="fixed inset-0 z-40"
 onClick={() => setIsOpen(false)}
 />
 <div className={`absolute ${openUpward ? 'bottom-full right-0 mb-1' : 'top-full right-0 mt-1'} bg-[var(--surface)] rounded-[var(--r-m)] z-50 min-w-[180px] overflow-hidden`}>
 {PREFERENCIAS_ESPECTRO.map((p) => {
 const isSelected = prefEspectro === p.id;
 return (
 <button
 key={p.id}
 onClick={() => handleThemeChange(p.id)}
 className={`w-full px-3 py-2 text-left text-[11px] font-sans font-semibold flex items-center justify-between gap-2 transition-colors ${
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
