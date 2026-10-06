// Los popups de los mapas (Leaflet) se construyen concatenando datos de banda/sala directamente
// en una plantilla HTML asignada a innerHTML. Sin escapar, un nombre de banda o sala con
// "<img src=x onerror=...>" ejecuta JS en el navegador de quien abra el mapa.
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
