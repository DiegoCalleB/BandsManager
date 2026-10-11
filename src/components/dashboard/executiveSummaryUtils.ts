export const diasHasta = (fechaIso: string): number => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(fechaIso);
  objetivo.setHours(0, 0, 0, 0);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86400000);
};

export const formatearCuentaAtras = (dias: number): string => {
  if (dias === 0) return "¡Es hoy!";
  if (dias === 1) return "Mañana";
  if (dias > 1) return `En ${dias} días`;
  return "Hoy";
};
