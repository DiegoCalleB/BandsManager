/**
 * Constantes del perfil de usuario.
 * Extraído de UserProfileModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
export const isStitchLight = false;

// Fase beta: crear un proyecto adicional desde aquí va directo al plan Promo, sin pasar por
// este selector legacy de 3 planes de pago (mismo criterio que BandSwitcherModal.tsx y
// SimplePromoLoginModal.tsx). El selector se conserva intacto más abajo para cuando se quiera
// reabrir la creación de bandas con todos los planes — basta con volver a poner esto a false.
export const SIMPLE_PROMO_ONLY_BAND_CREATION = true;
