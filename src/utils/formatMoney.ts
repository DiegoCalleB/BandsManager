const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const EUR_DEC = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** «1.510 €» (espacio duro, separador de millares es-ES). Sin decimales salvo que se pidan o el importe los tenga. */
export function formatEur(value: number, opts: { signed?: boolean; decimals?: boolean } = {}): string {
  const n = Number.isFinite(value) ? value : 0;
  const fmt = opts.decimals || !Number.isInteger(n) ? EUR_DEC : EUR;
  const base = fmt.format(Math.abs(n));
  if (n < 0) return `−${base}`;
  return opts.signed && n > 0 ? `+${base}` : base;
}
