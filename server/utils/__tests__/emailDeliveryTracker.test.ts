// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from "vitest";
import {
  classifyGmailError,
  classifySmtpError,
  isBounceMessage,
  extractFailedRecipientEmail,
  getReadableFailureMessage
} from "../emailDeliveryTracker.js";

describe("isBounceMessage", () => {
  it("detecta un NDR real de Gmail por subject", () => {
    expect(isBounceMessage("Delivery Status Notification (Failure)", "mailer-daemon@googlemail.com")).toBe(true);
  });

  it("detecta un bounce por remitente aunque el subject no lo delate", () => {
    expect(isBounceMessage("Re: tu evento", "postmaster@dominio.com")).toBe(true);
  });

  it("no marca como bounce una respuesta normal de un lead", () => {
    expect(isBounceMessage("Re: propuesta de actuación", "sala@ejemplo.com")).toBe(false);
  });
});

describe("extractFailedRecipientEmail", () => {
  it("extrae el email del bloque Final-Recipient de un NDR de Gmail", () => {
    const body = `
Your message wasn't delivered to email_inventado@gnail.com because the address couldn't be found or is unable to receive email.

The response from the remote server was:

550 mailbox email_inventado@gnail.com unavailable

Final-Recipient: rfc822; email_inventado@gnail.com
Action: failed
Status: 5.7.0
`;
    expect(extractFailedRecipientEmail(body)).toBe("email_inventado@gnail.com");
  });

  it("extrae el email de la frase humana cuando no hay bloque Final-Recipient", () => {
    const body = "Your message wasn't delivered to sala@noexiste.com because the address couldn't be found.";
    expect(extractFailedRecipientEmail(body)).toBe("sala@noexiste.com");
  });

  it("devuelve null si no encuentra ningún patrón reconocible", () => {
    expect(extractFailedRecipientEmail("Hola, gracias por vuestro mensaje, os contestamos pronto.")).toBeNull();
  });

  it("devuelve null con cuerpo vacío", () => {
    expect(extractFailedRecipientEmail("")).toBeNull();
  });
});

describe("classifyGmailError", () => {
  it("clasifica 404 como invalid_recipient", () => {
    expect(classifyGmailError("not found", 404)).toBe("invalid_recipient");
  });

  it("clasifica 5xx como server_error", () => {
    expect(classifyGmailError("internal error", 500)).toBe("server_error");
  });
});

describe("classifySmtpError", () => {
  it("clasifica un 550 como invalid_recipient", () => {
    expect(classifySmtpError("550 no such user here")).toBe("invalid_recipient");
  });
});

describe("getReadableFailureMessage", () => {
  it("devuelve un mensaje legible para invalid_recipient", () => {
    expect(getReadableFailureMessage("invalid_recipient")).toContain("no existe");
  });
});
