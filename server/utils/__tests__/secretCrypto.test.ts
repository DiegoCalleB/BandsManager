import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { encryptSecret, decryptSecret, isEncryptedSecret, faltaClaveDeCifradoEnProduccion } from '../secretCrypto';

describe('secretCrypto', () => {
  beforeEach(() => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
  });

  it('cifra y descifra de ida y vuelta sin dejar el texto en claro', () => {
    const enc = encryptSecret('abcd efgh ijkl mnop');
    expect(isEncryptedSecret(enc)).toBe(true);
    expect(enc).not.toContain('abcd');
    expect(decryptSecret(enc)).toBe('abcd efgh ijkl mnop');
  });

  it('usa IV aleatorio: dos cifrados del mismo valor difieren', () => {
    expect(encryptSecret('x')).not.toBe(encryptSecret('x'));
  });

  it('no recifra un valor ya cifrado y deja pasar texto plano heredado', () => {
    const enc = encryptSecret('x');
    expect(encryptSecret(enc)).toBe(enc);
    expect(decryptSecret('legacy-plain')).toBe('legacy-plain');
  });

  it('detecta manipulación del ciphertext', () => {
    const enc = encryptSecret('secreto');
    const tampered = enc.slice(0, -3) + (enc.endsWith('AAA') ? 'BBB' : 'AAA');
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe('faltaClaveDeCifradoEnProduccion (aviso al arrancar)', () => {
  const ENV = { ...process.env };
  const restaurar = () => { process.env.NODE_ENV = ENV.NODE_ENV; if (ENV.CREDENTIALS_ENCRYPTION_KEY === undefined) delete process.env.CREDENTIALS_ENCRYPTION_KEY; else process.env.CREDENTIALS_ENCRYPTION_KEY = ENV.CREDENTIALS_ENCRYPTION_KEY; };

  it('en producción sin clave: avisa (y entonces no se puede guardar ninguna credencial de correo)', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    expect(faltaClaveDeCifradoEnProduccion()).toBe(true);
    expect(() => encryptSecret('token')).toThrow(/CREDENTIALS_ENCRYPTION_KEY/);
    restaurar();
  });

  it('en producción con clave, o fuera de producción, no avisa', () => {
    process.env.NODE_ENV = 'production';
    process.env.CREDENTIALS_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
    expect(faltaClaveDeCifradoEnProduccion()).toBe(false);
    process.env.NODE_ENV = 'development';
    delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    expect(faltaClaveDeCifradoEnProduccion()).toBe(false);
    restaurar();
  });
});
