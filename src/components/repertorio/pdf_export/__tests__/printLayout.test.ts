import { describe, expect, it } from 'vitest';
import {
  AUTO_COLUMNS_MIN_SONGS,
  COLUMN_WIDTH_PX,
  FLOOR_TITLE_FONT_PT,
  MAX_DESIGN_TITLE_FONT_PT,
  MIN_TITLE_FONT_PT,
  PAGE_CONTENT_WIDTH_PX,
  PAGE_SHEET_HEIGHT_MM,
  deriveNoteFontPt,
  deriveSongNumFontPt,
  ptToPx,
} from '../printLayout';
import { buildPrintScripts } from '../buildPrintScripts';

describe('printLayout constants', () => {
  it('converts points to CSS pixels at 96 dpi', () => {
    expect(ptToPx(72)).toBe(96);
    expect(ptToPx(0)).toBe(0);
  });

  it('keeps two columns narrower than the printable width and the sheet shorter than A4', () => {
    expect(COLUMN_WIDTH_PX * 2).toBeLessThan(PAGE_CONTENT_WIDTH_PX);
    expect(PAGE_SHEET_HEIGHT_MM).toBeLessThan(297);
  });

  it('orders the title font limits floor <= min <= max design', () => {
    expect(FLOOR_TITLE_FONT_PT).toBeLessThanOrEqual(MIN_TITLE_FONT_PT);
    expect(MIN_TITLE_FONT_PT).toBeLessThan(MAX_DESIGN_TITLE_FONT_PT);
    expect(AUTO_COLUMNS_MIN_SONGS).toBeGreaterThan(1);
  });
});

describe('deriveNoteFontPt / deriveSongNumFontPt', () => {
  it('scales the note font with the title and caps it at 20pt', () => {
    expect(deriveNoteFontPt(28)).toBe(19);
    expect(deriveNoteFontPt(40)).toBe(20);
    expect(deriveNoteFontPt(17)).toBeLessThan(deriveNoteFontPt(28));
  });

  it('derives the song number size proportionally to the title', () => {
    expect(deriveSongNumFontPt(28)).toBe(22);
    expect(deriveSongNumFontPt(14)).toBe(11);
  });
});

describe('buildPrintScripts', () => {
  it('returns the print and preview scripts as non-empty strings', () => {
    const { printScript, previewScript, previewCss } = buildPrintScripts();
    expect(printScript).toContain('window');
    expect(previewScript.length).toBeGreaterThan(0);
    expect(previewCss.length).toBeGreaterThan(0);
  });
});
