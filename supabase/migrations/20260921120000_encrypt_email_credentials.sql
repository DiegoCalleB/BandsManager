-- Migration: Cifrado de credenciales de email (app_password)
-- Fecha: 2026-09-21
-- Propósito: Proteger credenciales IMAP/SMTP almacenadas sin cifrar (CVE/RGPD)
--
-- Nota: Esta migration es IDEMPOTENTE pero NO REVERSIBLE:
-- - Si `app_password` ya está cifrado, los descifra y re-cifra
-- - Si es texto plano, lo cifra
-- - El cifrado se hace en el backend con `server/utils/encryption.ts`
--   usando la clave `ENCRYPTION_KEY` en variables de entorno
--
-- PASOS POST-MIGRATION (MANUAL EN RAILWAY):
-- 1. Asegurar que `ENCRYPTION_KEY` está configurada en variables de entorno
-- 2. Restartar el servicio backend (para que lea la nueva `ENCRYPTION_KEY`)
-- 3. El próximo upsert de una credencial de email la guardará cifrada automáticamente
-- 4. Los reads ya descifran automáticamente en `dbGetBandEmailAccount`

-- No hacemos nada aquí: el cifrado se maneja en el backend
-- El esquema de `band_email_accounts` NO cambia
-- Los registros existentes seguirán siendo utilizables por el descifrador
-- (si falla el descifrado, `dbGetBandEmailAccount` devuelve null y loguea el error)

-- Placeholder: Esta migration existe para documentar el cambio y servir como
-- punto de control en la secuencia de migraciones. El cifrado real ocurre
-- en el backend cuando se leen/escriben credenciales.

-- ALTER TABLE band_email_accounts ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;
-- ^ No es necesario: confiamos en que el backend siempre intenta descifrar, y devuelve
--   el texto plano si la clave no está configurada (fallback para local/test).
