const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatear(iso?: string): string {
  const [a, m, d] = (iso ?? "").split("-").map(Number);
  return a && m && d ? `${d} ${MESES[m - 1]} ${a}` : "";
}

/** Texto corto de la ventana de fechas de una campaña de festivales («1 jun 2027 – 30 sep 2027»), o vacío. */
export function textoDeRango(desde?: string, hasta?: string): string {
  if (!desde || !hasta) return "";
  return `${formatear(desde)} – ${formatear(hasta)}`;
}

