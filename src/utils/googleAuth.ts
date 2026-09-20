import firebaseConfig from '../../firebase-applet-config.json';

export interface GoogleUserInfo {
 email: string;
 name: string;
 sub: string;
 picture?: string;
 accessToken?: string;
}

const GOOGLE_CLIENT_ID =
 (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
 firebaseConfig.oAuthClientId ||
 '36068629683-o8nr6e9vleqqv9bvs3qaemp9m4b2hrnm.apps.googleusercontent.com';

let gisScriptLoaded = false;
let gisScriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
 if (gisScriptLoaded || (window as any).google?.accounts?.oauth2) {
 gisScriptLoaded = true;
 return Promise.resolve();
 }
 if (gisScriptPromise) return gisScriptPromise;

 gisScriptPromise = new Promise((resolve, reject) => {
 const script = document.createElement('script');
 script.src = 'https://accounts.google.com/gsi/client';
 script.async = true;
 script.defer = true;
 script.onload = () => {
 gisScriptLoaded = true;
 resolve();
 };
 script.onerror = (err) => {
 gisScriptPromise = null;
 reject(new Error('No se pudo cargar el script de Google Identity Services.'));
 };
 document.head.appendChild(script);
 });

 return gisScriptPromise;
}

/**
 * Direct Google OAuth 2.0 Sign-In using Google Identity Services (GIS).
 * Bypasses Firebase Auth popup completely, requesting only identity scopes (openid, email, profile).
 */
export async function signInWithGoogleIdentity(): Promise<GoogleUserInfo | null> {
 await loadGisScript();

 const google = (window as any).google;
 if (!google?.accounts?.oauth2) {
 throw new Error('Google Identity Services no está disponible en el navegador.');
 }

 return new Promise((resolve, reject) => {
 let resolved = false;

 const tokenClient = google.accounts.oauth2.initTokenClient({
 client_id: GOOGLE_CLIENT_ID,
 scope: 'openid email profile',
 prompt: 'select_account',
 callback: async (tokenResponse: any) => {
 if (tokenResponse.error) {
 if (
 tokenResponse.error === 'popup_closed' ||
 tokenResponse.error === 'access_denied' ||
 tokenResponse.error === 'user_logged_out'
 ) {
 resolve(null);
 return;
 }
 reject(new Error(`Error de Google OAuth: ${tokenResponse.error}`));
 return;
 }

 const accessToken = tokenResponse.access_token;
 if (!accessToken) {
 reject(new Error('No se obtuvo el token de acceso de Google.'));
 return;
 }

 try {
 const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
 headers: { Authorization: `Bearer ${accessToken}` }
 });
 if (!res.ok) {
 throw new Error('No se pudo obtener el perfil de usuario de Google.');
 }
 const info = await res.json();
 resolved = true;
 resolve({
 email: info.email,
 name: info.name || info.email.split('@')[0],
 sub: info.sub,
 picture: info.picture,
 accessToken
 });
 } catch (err) {
 reject(err);
 }
 },
 error_callback: (err: any) => {
 if (!resolved) {
 if (err?.type === 'popup_closed') {
 resolve(null);
 } else {
 reject(new Error(err?.message || 'Error al abrir la ventana de inicio de sesión con Google.'));
 }
 }
 }
 });

 tokenClient.requestAccessToken();
 });
}
