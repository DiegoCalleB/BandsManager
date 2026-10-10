/**
 * Recordatorio por email/push del evento a los convocados.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { getErrorMessage } from "../../../utils/errorMessage";
import { useState } from "react";
import { Concert, Rehearsal } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { triggerNativeMobileNotification } from "../../../utils/webPush";
import type { CalendarUser } from "../calendarTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface EventReminderParams {
  selectedConcert: Concert;
  selectedRehearsal: Rehearsal;
  selectedDate: Date;
  monthNames: string[];
  effectiveBandMembers: { id: string; name: string; role: string; email?: string }[];
  currentUser?: CalendarUser;
  onShowNotification: (message: string, type?: "success" | "error" | "info") => void;
}

/**
 * Recordatorio por email/push del evento a los convocados.
 * @param params Estado y callbacks del contenedor ({@link EventReminderParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useEventReminder({ selectedConcert, selectedRehearsal, selectedDate, monthNames, effectiveBandMembers, currentUser, onShowNotification }: EventReminderParams) {
  // Event Reminder Modal State
  const [showReminderModal, setShowReminderModal] = useState(false);

  const [reminderSending, setReminderSending] = useState(false);

  const [reminderSuccessMsg, setReminderSuccessMsg] = useState<string | null>(null);

  const [reminderErrorMsg, setReminderErrorMsg] = useState<string | null>(null);

  const [reminderNotes, setReminderNotes] = useState('');

  const [reminderSendEmail, setReminderSendEmail] = useState(true);

  const [reminderSendPush, setReminderSendPush] = useState(true);

  const handleSendEventReminder = async () => {
    const evt = selectedConcert || selectedRehearsal;
    if (!evt) return;

    setReminderSending(true);
    setReminderSuccessMsg(null);
    setReminderErrorMsg(null);

    const eventType = selectedConcert ? 'concierto' : selectedRehearsal?.tipo_evento === 'reunion' ? 'reunion' : 'ensayo';
    const eventTitle = selectedConcert ? selectedConcert.sala : selectedRehearsal?.asunto || selectedRehearsal?.lugar || 'Evento';
    const eventDate = `${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}, ${selectedDate.getFullYear()}`;
    const eventTime = selectedRehearsal?.hora || '';
    const eventLocation = selectedConcert ? `${selectedConcert.sala}, ${selectedConcert.ciudad}` : selectedRehearsal?.lugar || '';

    const recipientEmails = effectiveBandMembers
      .map((m) => m.email)
      .filter((e: string | undefined): e is string => !!e && e.includes('@'));

    if (recipientEmails.length === 0 && currentUser?.email) {
      recipientEmails.push(currentUser.email);
    }

    let pushSent = false;
    let emailSent = false;
    let pushMsg = '';
    let emailMsg = '';

    try {
      if (reminderSendPush) {
        const notifTitle = `🔔 ${eventType.toUpperCase()}: ${eventTitle}`;
        const notifBody = `📅 ${eventDate}${eventTime ? ` a las ${eventTime}` : ''}${eventLocation ? ` (${eventLocation})` : ''}${reminderNotes ? `\n💡 ${reminderNotes}` : ''}`;
        const pushResult = await triggerNativeMobileNotification(notifTitle, {
          body: notifBody,
        });
        if (pushResult.success) {
          pushSent = true;
          pushMsg = '📱 Notificación enviada al dispositivo móvil';
        } else {
          pushMsg = `📱 Móvil: ${pushResult.status}`;
        }
      }

      if (reminderSendEmail) {
        try {
          const data = await apiFetch<{ success?: boolean; error?: string }>('/api/bands/send-reminder', {
            method: 'POST',
            body: JSON.stringify({
              event_title: eventTitle,
              event_type: eventType,
              event_date: eventDate,
              event_time: eventTime,
              event_location: eventLocation,
              recipients: recipientEmails,
              custom_notes: reminderNotes,
              send_email: true,
            }),
          });

          if (data && data.success) {
            emailSent = true;
            emailMsg = '📧 Correo enviado a la banda';
          } else {
            emailMsg = data?.error || 'No se pudo enviar el correo';
          }
        } catch (apiErr) {
          console.warn('Error enviando correo de recordatorio:', apiErr);
          emailMsg = getErrorMessage(apiErr, 'Error en envío de correo');
        }
      }

      if (pushSent || emailSent) {
        const messages = [pushSent ? pushMsg : null, emailSent ? emailMsg : null].filter(Boolean).join(' y ');
        setReminderSuccessMsg(`¡Recordatorio enviado con éxito! (${messages})`);
        onShowNotification?.('🔔 Recordatorio enviado correctamente', 'success');
        setTimeout(() => {
          setShowReminderModal(false);
          setReminderSuccessMsg(null);
          setReminderNotes('');
        }, 2200);
      } else {
        const errDetails = [reminderSendPush ? pushMsg : null, reminderSendEmail ? emailMsg : null].filter(Boolean).join('. ');
        setReminderErrorMsg(`No se pudo enviar el recordatorio: ${errDetails}`);
      }
    } catch (err) {
      console.error('Error enviando recordatorio:', err);
      setReminderErrorMsg(getErrorMessage(err, 'Error al procesar el recordatorio'));
    } finally {
      setReminderSending(false);
    }
  };

  return { setShowReminderModal, setReminderNotes, setReminderSuccessMsg, setReminderErrorMsg, showReminderModal, reminderNotes, reminderSendPush, setReminderSendPush, reminderSendEmail, setReminderSendEmail, reminderSending, reminderSuccessMsg, reminderErrorMsg, handleSendEventReminder };
}
