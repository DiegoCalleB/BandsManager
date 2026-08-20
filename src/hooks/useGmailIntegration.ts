import { useState, useEffect } from 'react';
import { initAuth, googleSignIn, logout, fetchGmailThreadsForEmail } from '../utils/gmail';
import { Lead } from '../types';

export function useGmailIntegration(
  selectedLead: Lead | null,
  setSelectedLead: (updater: (prev: Lead | null) => Lead | null) => void,
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void
) {
 // Gmail integration states
 const [gmailUser, setGmailUser] = useState<any>(null);
 const [gmailToken, setGmailToken] = useState<string | null>(null);
 const [isSyncingGmail, setIsSyncingGmail] = useState(false);
 const [gmailStatusMsg, setGmailStatusMsg] = useState('');

 // Initialize Auth listeners
 useEffect(() => {
 const unsubscribe = initAuth(
 (user, token) => {
 setGmailUser(user);
 setGmailToken(token);
 },
 () => {
 setGmailUser(null);
 setGmailToken(null);
 }
 );
 return () => unsubscribe();
 }, []);

 const handleGmailLogin = async () => {
 try {
 setGmailStatusMsg('Conectando con Google...');
 const result = await googleSignIn();
 if (result) {
 setGmailUser(result.user);
 setGmailToken(result.accessToken);
 setGmailStatusMsg('Google conectado correctamente.');
 setTimeout(() => setGmailStatusMsg(''), 3000);
 }
 } catch (err: any) {
 console.error('Error logging in with Google:', err);
 const isIframeEnv = window.self !== window.top;
 if (
 err?.code === 'auth/popup-closed-by-user' || 
 err?.message?.includes('popup-closed-by-user') || 
 err?.message?.includes('closed-by-user') ||
 isIframeEnv
 ) {
 setGmailStatusMsg(
 '⚠️ Restricción de Iframe: El navegador bloqueó o cerró el popup de Google. ' + 
 'Para poder conectar tu cuenta, haz clic en el botón"Abrir en pestaña nueva" ' + 
 'que ves abajo o en la barra de AI Studio.'
 );
 } else {
 setGmailStatusMsg('No se pudo conectar: ' + (err.message || String(err)));
 }
 }
 };

 const handleGmailLogout = async () => {
 await logout();
 setGmailUser(null);
 setGmailToken(null);
 setGmailStatusMsg('Conexión de Google cerrada.');
 setTimeout(() => setGmailStatusMsg(''), 3000);
 };

 const handleSyncGmailForLead = async () => {
 if (!selectedLead || !gmailToken) return;
 setIsSyncingGmail(true);
 setGmailStatusMsg('Buscando correos de este contacto en tu Gmail...');
 try {
 const email = selectedLead.email_contacto;
 if (!email) {
 throw new Error('Este contacto no tiene dirección de email registrada.');
 }
 
 const fetchedMsgs = await fetchGmailThreadsForEmail(email, gmailToken);
 
 if (fetchedMsgs.length === 0) {
 setGmailStatusMsg('No se encontraron correos de este contacto en Gmail.');
 setIsSyncingGmail(false);
 setTimeout(() => setGmailStatusMsg(''), 4000);
 return;
 }

 // Merge fetched messages with existing ones
 const currentHilo = selectedLead.hilo_emails || [];
 const mergedHilo = [...currentHilo];
 
 let addedCount = 0;
 for (const newMsg of fetchedMsgs) {
 if (!mergedHilo.some(m => m.id === newMsg.id || (m.fecha === newMsg.fecha && m.mensaje === newMsg.mensaje))) {
 mergedHilo.push(newMsg);
 addedCount++;
 }
 }

 // Sort by date ascending
 mergedHilo.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

 // Update lead
 onUpdateLead(selectedLead.id, {
 hilo_emails: mergedHilo
 });

 setSelectedLead(prev => prev ? {
 ...prev,
 hilo_emails: mergedHilo
 } : null);

 setGmailStatusMsg(`¡Sincronización completada! Se añadieron ${addedCount} correos nuevos de Gmail.`);
 setTimeout(() => setGmailStatusMsg(''), 5000);
 } catch (err: any) {
 console.error('Error during Gmail sync:', err);
 setGmailStatusMsg('Error al sincronizar con Gmail: ' + (err.message || String(err)));
 } finally {
 setIsSyncingGmail(false);
 }
 };

  return {
    gmailUser, gmailToken,
    isSyncingGmail, gmailStatusMsg,
    handleGmailLogin,
    handleGmailLogout,
    handleSyncGmailForLead,
  };
}
