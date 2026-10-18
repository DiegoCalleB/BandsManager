/** Comunidad autónoma a partir del código postal español: sus dos primeras cifras son la provincia. */
const POR_PROVINCIA: Record<string, string> = {
  '01': 'País Vasco', '02': 'Castilla-La Mancha', '03': 'Comunidad Valenciana', '04': 'Andalucía', '05': 'Castilla y León',
  '06': 'Extremadura', '07': 'Islas Baleares', '08': 'Cataluña', '09': 'Castilla y León', '10': 'Extremadura',
  '11': 'Andalucía', '12': 'Comunidad Valenciana', '13': 'Castilla-La Mancha', '14': 'Andalucía', '15': 'Galicia',
  '16': 'Castilla-La Mancha', '17': 'Cataluña', '18': 'Andalucía', '19': 'Castilla-La Mancha', '20': 'País Vasco',
  '21': 'Andalucía', '22': 'Aragón', '23': 'Andalucía', '24': 'Castilla y León', '25': 'Cataluña',
  '26': 'La Rioja', '27': 'Galicia', '28': 'Comunidad de Madrid', '29': 'Andalucía', '30': 'Región de Murcia',
  '31': 'Navarra', '32': 'Galicia', '33': 'Asturias', '34': 'Castilla y León', '35': 'Canarias',
  '36': 'Galicia', '37': 'Castilla y León', '38': 'Canarias', '39': 'Cantabria', '40': 'Castilla y León',
  '41': 'Andalucía', '42': 'Castilla y León', '43': 'Cataluña', '44': 'Aragón', '45': 'Castilla-La Mancha',
  '46': 'Comunidad Valenciana', '47': 'Castilla y León', '48': 'País Vasco', '49': 'Castilla y León', '50': 'Aragón',
  '51': 'Ceuta', '52': 'Melilla',
};

/** Región de un código postal español, o null si no lo es. */
export function regionDeCodigoPostal(cp: unknown): string | null {
  const m = typeof cp === 'string' ? cp.trim().match(/^(\d{2})\d{3}$/) : null;
  return (m && POR_PROVINCIA[m[1]]) || null;
}
