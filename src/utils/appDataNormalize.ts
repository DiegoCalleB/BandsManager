import type { Concert, Rehearsal } from '../types';

export const dedupeById = <T extends { id?: string }>(arr: T[] = []): T[] => {
  const seen = new Set<string>();
  return arr.filter((item) => {
    if (!item) return false;
    const idStr = item.id ? String(item.id).trim() : null;
    if (!idStr) return true;
    if (seen.has(idStr)) return false;
    seen.add(idStr);
    return true;
  });
};

// Cada elemento puede ser un texto o un objeto {name|nombre} (filas antiguas guardadas como JSON).
const textoDeElemento = (x: unknown): string => {
  if (typeof x === 'string') return x;
  const conNombre = x as { name?: string; nombre?: string } | null | undefined;
  return conNombre?.name || conNombre?.nombre || String(x);
};

const parseSafeList = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return (val as unknown[]).map(textoDeElemento).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed))
          return (parsed as unknown[]).map(textoDeElemento).filter(Boolean);
      } catch { /* texto no JSON: se trata como lista separada por comas */ }
    }
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const normalizeRehearsal = (r: Rehearsal): Rehearsal => {
  if (!r) return r;
  return {
    ...r,
    asistentes: parseSafeList(r.asistentes),
    convocados_nombres: r.convocados_nombres ? parseSafeList(r.convocados_nombres) : undefined,
    convocados_ids: r.convocados_ids ? parseSafeList(r.convocados_ids) : undefined,
  };
};

export const normalizeConcert = (c: Concert): Concert => {
  if (!c) return c;
  return {
    ...c,
    convocados_nombres: c.convocados_nombres ? parseSafeList(c.convocados_nombres) : undefined,
    convocados_ids: c.convocados_ids ? parseSafeList(c.convocados_ids) : undefined,
  };
};
