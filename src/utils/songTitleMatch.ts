/** Minúsculas, sin tildes/diacríticos, sin espacios extra — para que "Traca Final" case con "traca final" o "Traca Fínal" sin fallar por acentuación. */
export function normalizeSongTitle(title?: string | null): string {
  return (title || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** true si algún título de `needles` coincide (exacto o parcial) con `haystackTitle`. */
export function titlesMatch(haystackTitle: string, needles: string[]): boolean {
  const normalizedHaystack = normalizeSongTitle(haystackTitle);
  if (!normalizedHaystack) return false;
  return needles.some(needle => {
    const normalizedNeedle = normalizeSongTitle(needle);
    if (!normalizedNeedle) return false;
    return normalizedHaystack === normalizedNeedle ||
           normalizedHaystack.includes(normalizedNeedle) ||
           normalizedNeedle.includes(normalizedHaystack);
  });
}
