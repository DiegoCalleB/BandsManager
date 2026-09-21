/**
 * La cookie de sesión, escrita en un solo sitio.
 *
 * Estaba repetida en cinco puntos entre LoginModal y useAuth, y en ninguno llevaba `Secure`, así
 * que un token de 30 días viajaba también por http en claro si alguien conseguía degradar la
 * conexión. Se marca Secure siempre que la página vaya por https, para no romper el desarrollo
 * en local, que va por http.
 */
const NOMBRE_COOKIE = 'bakandeya_token';
const DURACION_SEGUNDOS = 30 * 24 * 60 * 60;

export function guardarCookieDeSesion(token: string): void {
 try {
 const seguro = typeof window !== 'undefined' && window.location.protocol === 'https: '? '; Secure' : '';
 document.cookie = `${NOMBRE_COOKIE}=${token}; path=/; max-age=${DURACION_SEGUNDOS}; SameSite=Lax${seguro}`;
 } catch (e) {}
}

export function borrarCookieDeSesion(): void {
 try {
 document.cookie = `${NOMBRE_COOKIE}=; max-age=0; path=/;`;
 } catch (e) {}
}
