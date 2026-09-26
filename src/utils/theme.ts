import { ThemeName, ThemeColors } from '../types';

/**
 * Lee los valores actuales de los tokens Espectro CSS y retorna
 * un objeto ThemeColors compatible con el sistema antiguo.
 * Los valores se leen desde el documento en tiempo real.
 */
export function getEspectroColors(): ThemeColors {
  const fallbacks = {
    acc: '#2563EB',
    accSoft: '#DBEAFE',
    accInk: '#1D4ED8',
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

  if (
    typeof document !== 'undefined' &&
    typeof getComputedStyle === 'function'
  ) {
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
    fontSans: 'font-sans',
  };
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  indie_velvet: {
    name: 'Modern Obsidian & Gold (Por Defecto)',
    bg: 'bg-[#0c0d12] text-[#f4f4f5]',
    card: 'bg-[#16161a]/95 rounded-2xl',
    primary:
      'bg-[#f2ca50] hover:bg-[#e5bc40] text-[#2c2200] font-bold tracking-tight transition-all duration-200 rounded-xl',
    primaryHover: 'hover:bg-[#e5bc40]',
    text: 'text-[var(--ink)]/80',
    textMuted: 'text-[var(--ink-2)]',
    accent: 'text-[var(--acc)]/80',
    accentBg: 'bg-[var(--acc)]/15 text-[var(--acc)]/80',
    badgeGreen:
      'bg-[var(--ok)]/15 text-[var(--ok)]/80 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    badgeYellow:
      'bg-[var(--acc)]/15 text-[var(--acc)]/80 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    badgeRed:
      'bg-[var(--alert)]/15 text-[var(--alert)]/80 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    badgeBlue:
      'bg-[var(--acc)]/15 text-[var(--acc)]/80 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    neonShadow: 'shadow-none',
    fontDisplay: 'font-sans',
    fontSans: 'font-sans',
  },
  stitch_dark: {
    name: 'Stitch Studio Soft',
    bg: 'bg-[#0b0f19] text-[var(--ink)]',
    card: 'bg-[#161f30]/90 rounded-2xl',
    primary:
      'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-semibold tracking-tight transition-all duration-200 rounded-xl',
    primaryHover: 'hover:bg-[var(--surface)]',
    text: 'text-[var(--ink)]',
    textMuted: 'text-[var(--ink-2)]',
    accent: 'text-[var(--tentative)]',
    accentBg: 'bg-[var(--acc)]/20 text-[var(--acc)]/40',
    badgeGreen:
      'bg-[var(--ok)]/15 text-[var(--ok)]/80 rounded-full text-[10px] font-medium px-2.5 py-0.5',
    badgeYellow:
      'bg-[var(--acc)]/15 text-[var(--acc)]/80 rounded-full text-[10px] font-medium px-2.5 py-0.5',
    badgeRed:
      'bg-[var(--alert)]/15 text-[var(--alert)]/80 rounded-full text-[10px] font-medium px-2.5 py-0.5',
    badgeBlue:
      'bg-[var(--acc)]/15 text-[var(--ink-3)] rounded-full text-[10px] font-medium px-2.5 py-0.5',
    neonShadow: 'shadow-none',
    fontDisplay: 'font-sans',
    fontSans: 'font-sans',
  },
  backstage_neon: {
    name: 'Executive Studio (Gold & Charcoal)',
    bg: 'bg-[#0e0e11] text-[#e4e4e7]',
    card: 'bg-[#16161a]/95 rounded-xl',
    primary:
      'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-semibold tracking-tight transition-all duration-200 rounded-lg',
    primaryHover: 'hover:bg-[var(--surface)]',
    text: 'text-[#e4e4e7]',
    textMuted: 'text-[var(--ink-3)]',
    accent: 'text-[var(--acc)]/80/90',
    accentBg: 'bg-[var(--sunken)]/80 text-[var(--ink-2)]/80',
    badgeGreen:
      'bg-[var(--ok)]/10 text-[var(--ok)]/90 rounded-md text-[9px] font-medium',
    badgeYellow:
      'bg-[var(--acc)]/10 text-[var(--acc)]/80/90 rounded-md text-[9px] font-medium',
    badgeRed:
      'bg-[var(--alert)]/10 text-[var(--alert)]/80/90 rounded-md text-[9px] font-medium',
    badgeBlue:
      'bg-[var(--tentative)]/10 text-[var(--tentative)]/80/90 rounded-md text-[9px] font-medium',
    neonShadow: 'shadow-none',
    fontDisplay: 'font-display',
    fontSans: 'font-sans',
  },
  roots_ska: {
    name: 'Obsidian Studio (Dark Monochrome)',
    bg: 'bg-[#09090b] text-[#f4f4f5]',
    card: 'bg-[#121215]/95 rounded-xl',
    primary:
      'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-semibold tracking-tight transition-all duration-200 rounded-lg',
    primaryHover: 'hover:bg-[var(--surface)]',
    text: 'text-[var(--ink)]/80',
    textMuted: 'text-[var(--ink-2)]',
    accent: 'text-[var(--ink-2)]/80',
    accentBg: 'bg-[var(--ink-3)]/40/80 text-[var(--ink-2)]/80',
    badgeGreen:
      'bg-[var(--ok)]/10 text-[var(--ok)] rounded-md text-[9px] font-medium',
    badgeYellow:
      'bg-[var(--acc)]/10 text-[var(--acc)]/80 rounded-md text-[9px] font-medium',
    badgeRed:
      'bg-[var(--alert)]/10 text-[var(--alert)]/80 rounded-md text-[9px] font-medium',
    badgeBlue:
      'bg-[var(--acc)]/10 text-[var(--ink-3)] rounded-md text-[9px] font-medium',
    neonShadow: 'shadow-none',
    fontDisplay: 'font-sans',
    fontSans: 'font-sans',
  },
  brutalist_fuzz: {
    name: 'Minimal Mono (Tech Clean)',
    bg: 'bg-[#0d0d0e] text-[#f4f4f5]',
    card: 'bg-[#141416]/95 rounded-xl',
    primary:
      'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-semibold tracking-tight transition-all duration-200 rounded-lg',
    primaryHover: 'hover:bg-[var(--surface)]',
    text: 'text-[var(--ink)]/80',
    textMuted: 'text-[var(--ink-2)]',
    accent: 'text-[var(--ink-2)]/80',
    accentBg: 'bg-[var(--ink-3)]/40/80 text-[var(--ink-2)]/80',
    badgeGreen:
      'bg-[var(--ok)]/10 text-[var(--ok)] rounded-md text-[9px] font-medium',
    badgeYellow:
      'bg-[var(--acc)]/10 text-[var(--acc)]/80 rounded-md text-[9px] font-medium',
    badgeRed:
      'bg-[var(--alert)]/10 text-[var(--alert)]/80 rounded-md text-[9px] font-medium',
    badgeBlue:
      'bg-[var(--acc)]/10 text-[var(--ink-3)] rounded-md text-[9px] font-medium',
    neonShadow: 'shadow-none',
    fontDisplay: 'font-sans',
    fontSans: 'font-sans',
  },
  classic: {
    name: 'Clásico (Diseño Original)',
    bg: 'bg-[#0c0d12] text-[#f4f4f5]',
    card: 'bg-[#16161a]/95 rounded-2xl',
    primary:
      'bg-[#f2ca50] hover:bg-[#e5bc40] text-[#2c2200] font-bold tracking-tight transition-all duration-200 rounded-xl',
    primaryHover: 'hover:bg-[#e5bc40]',
    text: 'text-[var(--ink)]/80',
    textMuted: 'text-[var(--ink-2)]',
    accent: 'text-[var(--acc)]/80',
    accentBg: 'bg-[var(--acc)]/15 text-[var(--acc)]/80',
    badgeGreen:
      'bg-[var(--ok)]/15 text-[var(--ok)]/80 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    badgeYellow:
      'bg-[var(--acc)]/15 text-[var(--acc)]/80 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    badgeRed:
      'bg-[var(--alert)]/15 text-[var(--alert)]/80 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    badgeBlue:
      'bg-[var(--acc)]/15 text-[var(--acc)]/80 rounded-full text-[10px] font-medium tracking-normal px-2.5 py-0.5',
    neonShadow: 'shadow-none',
    fontDisplay: 'font-sans',
    fontSans: 'font-sans',
  },
};
