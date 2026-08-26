// El incentivo que ve el fan al terminar el formulario (descarga exclusiva y/o cupón de
// merchandising) es opcional: cada banda lo rellena en el apartado QR de Fans. Antes, cuando una
// banda no lo había configurado, la pantalla de éxito prometía un cupón inventado ("FAN-VIP-10")
// que la banda no podía canjear. Este helper deja fuera todo lo que no esté realmente rellenado,
// para que la landing solo enseñe el bloque de beneficios cuando hay algo que entregar.

export interface FanIncentive {
  mensajeAgradecimiento?: string;
  enlaceDescarga?: string;
  codigoDescuento?: string;
}

function textoRellenado(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpio = valor.trim();
  return limpio ? limpio : undefined;
}

export function buildFanIncentive(config: any): FanIncentive {
  const origen = config && typeof config === "object" ? config : {};
  const incentivo: FanIncentive = {};

  const mensajeAgradecimiento = textoRellenado(origen.mensajeAgradecimiento);
  const enlaceDescarga = textoRellenado(origen.enlaceDescarga);
  const codigoDescuento = textoRellenado(origen.codigoDescuento);

  if (mensajeAgradecimiento) incentivo.mensajeAgradecimiento = mensajeAgradecimiento;
  if (enlaceDescarga) incentivo.enlaceDescarga = enlaceDescarga;
  if (codigoDescuento) incentivo.codigoDescuento = codigoDescuento;

  return incentivo;
}
