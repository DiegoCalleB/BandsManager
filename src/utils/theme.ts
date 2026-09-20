import { ThemeName, ThemeColors } from '../types';

/**
 * Lee los valores actuales de los tokens Espectro CSS y retorna
 * un objeto ThemeColors compatible con el sistema antiguo.
 * Los valores se leen desde el documento en tiempo real.
 */
export function getEspectroColors(): ThemeColors {
  // Lee los valores de las variables CSS si estamos en el navegador
  let acc = '#D86E31'; // fallback naranja de Booking
  let accSoft = '#F9EAE1';
  let ok = '#17998C';
  let okSoft = '#DDF1EE';
  let alert = '#B3453C';
  let alertSoft = '#FAE7E5';
  let ink = '#2A2E35';
  let ink2 = '#646C78';
  let bg = '#F6F7F9';
  let surface = '#FFFFFF';

  if (typeof document !== 'undefined' && typeof getComputedStyle === 'function') {
    const root = document.documentElement;
    const style = getComputedStyle(root);

    const getValue = (varName: string) => style.getPropertyValue(varName).trim();

    acc = getValue('--acc') || acc;
    accSoft = getValue('--acc-soft') || accSoft;
    ok = getValue('--ok') || ok;
    okSoft = getValue('--ok-soft') || okSoft;
    alert = getValue('--alert') || alert;
    alertSoft = getValue('--alert-soft') || alertSoft;
    ink = getValue('--ink') || ink;
    ink2 = getValue('--ink-2') || ink2;
    bg = getValue('--bg') || bg;
    surface = getValue('--surface') || surface;
  }

  return {
    name: 'Espectro',
    bg: `bg-[${bg}]`,
    card: `bg-[${surface}]`,
    border: `border-[${bg}]`,
    primary: acc,
    primaryHover: `hover:brightness-110`,
    text: `text-[${ink}]`,
    textMuted: `text-[${ink2}]`,
    accent: `text-[${acc}]`,
    accentBg: `bg-[${accSoft}]`,
    badgeGreen: `bg-[${okSoft}] text-[${ok}]`,
    badgeYellow: `bg-[${accSoft}] text-[${acc}]`,
    badgeRed: `bg-[${alertSoft}] text-[${alert}]`,
    badgeBlue: `bg-[${accSoft}] text-[${acc}]`,
    neonShadow: 'shadow-none',
    fontDisplay: 'font-sans',
    fontSans: 'font-sans'
  };
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  indie_velvet: {
    name: 'Modern Obsidian & Gold (Por Defecto)',
    bg: 'bg-[#0c0d12] text-[#f4f4f5]',
    card: 'bg-[#16161a]/95 border border-neutral-800/80 shadow-sm rounded-2xl',
    border: 'border-neutral-800/80',
    primary: 'bg-[#f2ca50] hover:bg-[#e5bc40] text-[#2c2200] font-bold tracking-tight transition-all duration-200 rounded-xl shadow-sm',
    primaryHover: 'hover:bg-[#e5bc40]',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500/15 border border-amber-500/30 text-amber-300',
    badgeGreen: 'bg-emerald-500/15 text-emerald-300 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    badgeYellow: 'bg-amber-500/15 text-amber-300 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    badgeRed: 'bg-rose-500/15 text-rose-300 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    badgeBlue: 'bg-amber-500/15 text-amber-300 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    neonShadow: 'shadow-none',
    fontDisplay: 'font-sans',
    fontSans: 'font-sans'
  },
  stitch_dark: {
    name: 'Stitch Studio Soft',
    bg: 'bg-[#0b0f19] text-slate-100',
    card: 'bg-[#161f30]/90 border border-slate-800/90 shadow-md rounded-2xl',
    border: 'border-slate-800/90',
    primary: 'bg-slate-100 hover:bg-white text-slate-950 shadow-sm font-semibold tracking-tight transition-all duration-200 rounded-xl',
    primaryHover: 'hover:bg-white',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    accent: 'text-violet-400',
    accentBg: 'bg-violet-950/50 border border-violet-800/40 text-violet-200',
    badgeGreen: 'bg-emerald-500/15 text-emerald-300 rounded-full text-[10px] font-medium px-2.5 py-0.5',
    badgeYellow: 'bg-amber-500/15 text-amber-300 rounded-full text-[10px] font-medium px-2.5 py-0.5',
    badgeRed: 'bg-rose-500/15 text-rose-300 rounded-full text-[10px] font-medium px-2.5 py-0.5',
    badgeBlue: 'bg-sky-500/15 text-sky-300 rounded-full text-[10px] font-medium px-2.5 py-0.5',
    neonShadow: 'shadow-md',
    fontDisplay: 'font-sans',
    fontSans: 'font-sans'
  },
  backstage_neon: {
    name: 'Executive Studio (Gold & Charcoal)',
    bg: 'bg-[#0e0e11] text-[#e4e4e7]',
    card: 'bg-[#16161a]/95 border border-neutral-800 shadow-sm rounded-xl',
    border: 'border-neutral-800',
    primary: 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm font-semibold tracking-tight transition-all duration-200 rounded-lg',
    primaryHover: 'hover:bg-white',
    text: 'text-[#e4e4e7]',
    textMuted: 'text-neutral-400',
    accent: 'text-amber-300/90',
    accentBg: 'bg-neutral-800/80 border border-neutral-700/60 text-zinc-200',
    badgeGreen: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/90 rounded-md font-mono text-[9px] font-medium',
    badgeYellow: 'bg-amber-500/10 border border-amber-500/20 text-amber-300/90 rounded-md font-mono text-[9px] font-medium',
    badgeRed: 'bg-rose-500/10 border border-rose-500/20 text-rose-300/90 rounded-md font-mono text-[9px] font-medium',
    badgeBlue: 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300/90 rounded-md font-mono text-[9px] font-medium',
    neonShadow: 'shadow-sm',
    fontDisplay: 'font-display',
    fontSans: 'font-sans'
  },
  roots_ska: {
    name: 'Obsidian Studio (Dark Monochrome)',
    bg: 'bg-[#09090b] text-[#f4f4f5]',
    card: 'bg-[#121215]/95 border border-neutral-800/90 shadow-sm rounded-xl',
    border: 'border-neutral-800/80',
    primary: 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm font-semibold tracking-tight transition-all duration-200 rounded-lg',
    primaryHover: 'hover:bg-white',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accent: 'text-zinc-200',
    accentBg: 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-200',
    badgeGreen: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md font-mono text-[9px] font-medium',
    badgeYellow: 'bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-md font-mono text-[9px] font-medium',
    badgeRed: 'bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md font-mono text-[9px] font-medium',
    badgeBlue: 'bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-md font-mono text-[9px] font-medium',
    neonShadow: 'shadow-sm',
    fontDisplay: 'font-sans',
    fontSans: 'font-sans'
  },
  brutalist_fuzz: {
    name: 'Minimal Mono (Tech Clean)',
    bg: 'bg-[#0d0d0e] text-[#f4f4f5]',
    card: 'bg-[#141416]/95 border border-neutral-800 shadow-sm rounded-xl',
    border: 'border-neutral-800',
    primary: 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm font-semibold tracking-tight transition-all duration-200 rounded-lg',
    primaryHover: 'hover:bg-white',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accent: 'text-zinc-200',
    accentBg: 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-200',
    badgeGreen: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md font-mono text-[9px] font-medium',
    badgeYellow: 'bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-md font-mono text-[9px] font-medium',
    badgeRed: 'bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md font-mono text-[9px] font-medium',
    badgeBlue: 'bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-md font-mono text-[9px] font-medium',
    neonShadow: 'shadow-sm',
    fontDisplay: 'font-mono',
    fontSans: 'font-mono'
  }
};
