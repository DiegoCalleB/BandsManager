import { ThemeName, ThemeColors } from '../types';

/**
 * Lee los valores actuales de los tokens Espectro CSS y retorna
 * un objeto ThemeColors compatible con el sistema antiguo.
 * Los valores se leen desde el documento en tiempo real.
 */
export function getEspectroColors(): ThemeColors {
  const fallbacks = {
    acc: '#D86E31',
    accSoft: '#F9EAE1',
    accInk: '#813F18',
    ok: '#17998C',
    okSoft: '#DDF1EE',
    alert: '#B3453C',
    alertSoft: '#FAE7E5',
    ink: '#2A2E35',
    ink2: '#646C78',
    ink3: '#5D6A7A',
    bg: '#F6F7F9',
    surface: '#FFFFFF',
    hair: 'rgba(42, 46, 53, 0.065)',
  };

  const colors = { ...fallbacks };

  if (typeof document !== 'undefined' && typeof getComputedStyle === 'function') {
    const root = document.documentElement;
    const style = getComputedStyle(root);

    const getValue = (varName: string) => {
      const val = style.getPropertyValue(varName).trim();
      return val || undefined;
    };

    colors.acc = getValue('--acc') || colors.acc;
    colors.accSoft = getValue('--acc-soft') || colors.accSoft;
    colors.accInk = getValue('--acc-ink') || colors.accInk;
    colors.ok = getValue('--ok') || colors.ok;
    colors.okSoft = getValue('--ok-soft') || colors.okSoft;
    colors.alert = getValue('--alert') || colors.alert;
    colors.alertSoft = getValue('--alert-soft') || colors.alertSoft;
    colors.ink = getValue('--ink') || colors.ink;
    colors.ink2 = getValue('--ink-2') || colors.ink2;
    colors.ink3 = getValue('--ink-3') || colors.ink3;
    colors.bg = getValue('--bg') || colors.bg;
    colors.surface = getValue('--surface') || colors.surface;
    colors.hair = getValue('--hair') || colors.hair;
  }

  return {
    name: 'Espectro',
    bg: `bg-[var(--bg)]`,
    card: `bg-[var(--surface)]`,
    border: `border-[var(--hair)]`,
    primary: colors.acc,
    primaryHover: 'hover:opacity-90',
    text: colors.ink,
    textMuted: colors.ink2,
    accent: colors.acc,
    accentBg: colors.accSoft,
    badgeGreen: `bg-[var(--ok-soft)] text-[var(--ok)]`,
    badgeYellow: `bg-[var(--acc-soft)] text-[var(--acc-ink)]`,
    badgeRed: `bg-[var(--alert-soft)] text-[var(--alert)]`,
    badgeBlue: `bg-[var(--acc-soft)] text-[var(--acc-ink)]`,
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
  },
  classic: {
    name: 'Clásico (Diseño Original)',
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
  }
};
