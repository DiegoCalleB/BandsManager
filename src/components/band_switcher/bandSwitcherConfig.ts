/** Configuración del selector de bandas. */

// Fase beta: crear una banda nueva desde aquí va directa al plan Promo, sin pasar por la
// parrilla de planes de pago (mismo criterio que SimplePromoLoginModal.tsx). El selector de
// planes de este modal (paso 2) se conserva intacto más abajo para cuando se quiera reabrir
// la creación de bandas con todos los planes — basta con volver a poner esto a false.
export const SIMPLE_PROMO_ONLY_BAND_CREATION = true;
