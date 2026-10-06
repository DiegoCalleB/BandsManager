/**
 * Rastreo de fallos de entrega de email
 * Clasifica errores: invalid_recipient, invalid_email, server_error, network_error
 */

export type EmailDeliveryFailureReason =
  | 'invalid_recipient'  // Gmail/SMTP: 400/550 "user not found", "no such user"
  | 'invalid_email'       // Sintaxis o dominio inválido
  | 'bounced'             // NDR/bounce message recibido
  | 'server_error'        // 5xx error, timeout
  | 'network_error'       // Connection error
  | 'unknown';            // No se pudo determinar

export interface EmailDeliveryStatus {
  success: boolean;
  leadId: string;
  email: string;
  timestamp: string;
  failureReason?: EmailDeliveryFailureReason;
  failureMessage?: string;
}

/**
 * Parsea error de Gmail API y detecta si es "usuario no existe"
 * Busca patterns en la respuesta de error
 */
export function classifyGmailError(errBody: string, statusCode: number): EmailDeliveryFailureReason {
  const lower = errBody.toLowerCase();

  // 400 = recipient rejected, user not found
  if (statusCode === 400) {
    if (lower.includes('recipient') || lower.includes('invalid') || lower.includes('address')) {
      return 'invalid_recipient';
    }
  }

  // 404 = not found
  if (statusCode === 404) {
    return 'invalid_recipient';
  }

  // 5xx = server error (puede ser que no existe pero es ambiguo)
  if (statusCode >= 500 && statusCode < 600) {
    return 'server_error';
  }

  // 4xx = client error
  if (statusCode >= 400 && statusCode < 500) {
    return 'invalid_recipient';
  }

  return 'unknown';
}

/**
 * Parsea error de SMTP (IMAP/emailAgentClient)
 * Busca códigos de rechazo estándar
 */
export function classifySmtpError(errMessage: string): EmailDeliveryFailureReason {
  const lower = errMessage.toLowerCase();

  // 550/551 = User not found
  if (lower.includes('550') || lower.includes('551') || lower.includes('no such user')) {
    return 'invalid_recipient';
  }

  // 5xx = Permanent failure
  if (lower.includes('5')) {
    return 'server_error';
  }

  // 4xx = Temporary failure
  if (lower.includes('4')) {
    return 'server_error';
  }

  if (lower.includes('timeout') || lower.includes('timeout')) {
    return 'network_error';
  }

  if (lower.includes('connection') || lower.includes('unreachable')) {
    return 'network_error';
  }

  return 'unknown';
}

/**
 * Detecta si un mensaje es un bounce/NDR (Non-Delivery Report)
 * Usado por lectorAgent para marcar emails como bounced
 */
export function isBounceMessage(subject: string, from: string): boolean {
  const lowerSubj = subject.toLowerCase();
  const lowerFrom = from.toLowerCase();

  // Common bounce message subjects
  const bouncePatterns = [
    'undeliverable',
    'delivery failed',
    'returned mail',
    'failure notice',
    'mail delivery failed',
    'message not delivered',
    'could not be delivered',
    'bounce',
    'mailbox unavailable',
    'no such user'
  ];

  if (bouncePatterns.some(p => lowerSubj.includes(p))) {
    return true;
  }

  // Common bounce senders
  const bounceSenders = [
    'mailer-daemon',
    'postmaster',
    'no-reply',
    'noreply',
    'system',
    'bounced'
  ];

  return bounceSenders.some(s => lowerFrom.includes(s));
}

/**
 * Extrae el email del destinatario que falló de un mensaje de bounce/NDR.
 * El remitente de un bounce es mailer-daemon, nunca el lead, así que hay que sacar la
 * dirección fallida del cuerpo del mensaje para poder emparejarla con un lead.
 */
export function extractFailedRecipientEmail(bodyText: string): string | null {
  if (!bodyText) return null;

  const patterns = [
    /Final-Recipient:\s*rfc822;\s*([^\s<>]+@[^\s<>]+)/i,
    /Original-Recipient:\s*rfc822;\s*([^\s<>]+@[^\s<>]+)/i,
    /wasn'?t delivered to\s*:?\s*([^\s<>]+@[^\s<>]+)/i,
    /couldn'?t be delivered to\s*:?\s*([^\s<>]+@[^\s<>]+)/i,
    /delivery to the following recipient(?:s)? failed[\s\S]{0,120}?([^\s<>]+@[^\s<>]+)/i,
  ];

  for (const pattern of patterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      return match[1].replace(/[.,;:]+$/, '').toLowerCase();
    }
  }

  return null;
}

/**
 * Genera descripción legible del error
 */
export function getReadableFailureMessage(reason: EmailDeliveryFailureReason): string {
  switch (reason) {
    case 'invalid_recipient':
      return 'Usuario no existe en el servidor de correo';
    case 'invalid_email':
      return 'Email inválido o dominio no existe';
    case 'bounced':
      return 'Email rebotó (NDR recibido)';
    case 'server_error':
      return 'Error del servidor de correo';
    case 'network_error':
      return 'Error de conexión';
    default:
      return 'Error desconocido al enviar';
  }
}
