/**
 * Conciertos y giras son cosa de la dirección (líder o admin), igual que en el servidor (`requireLeader`).
 * Esto solo decide qué botones se muestran; quien manda de verdad es el servidor, que responde 403.
 */
export const puedeCrearConcierto = (role: string | undefined): boolean => role === 'leader' || role === 'admin';
