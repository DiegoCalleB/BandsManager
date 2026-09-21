import { describe, it, expect, beforeAll } from 'vitest';
import { encryptCredential, decryptCredential } from '../encryption';

describe('Encryption Utils', () => {
  const testPassword = 'super-secret-app-password-12345';

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests';
  });

  it('cifra y descifra correctamente una credencial', () => {
    const encrypted = encryptCredential(testPassword);
    expect(encrypted).not.toBe(testPassword);

    const decrypted = decryptCredential(encrypted);
    expect(decrypted).toBe(testPassword);
  });

  it('genera diferente ciphertext para el mismo plaintext (por IV aleatorio)', () => {
    const encrypted1 = encryptCredential(testPassword);
    const encrypted2 = encryptCredential(testPassword);

    expect(encrypted1).not.toBe(encrypted2);
    expect(decryptCredential(encrypted1)).toBe(testPassword);
    expect(decryptCredential(encrypted2)).toBe(testPassword);
  });

  it('rechaza formato inválido', () => {
    const invalid = 'not-a-valid-encrypted-value';
    const decrypted = decryptCredential(invalid);
    expect(decrypted).toBeNull();
  });

  it('rechaza ciphertext tampeado', () => {
    const encrypted = encryptCredential(testPassword);
    const tampered = Buffer.from(encrypted, 'base64')
      .toString('utf8')
      .split('.')
      .map((part, i) => i === 2 ? part + '0' : part) // Tamper ciphertext
      .join('.');
    const tampleredBase64 = Buffer.from(tampered).toString('base64');

    const decrypted = decryptCredential(tampleredBase64);
    expect(decrypted).toBeNull();
  });

  it('maneja strings vacíos', () => {
    const encrypted = encryptCredential('');
    const decrypted = decryptCredential(encrypted);
    expect(decrypted).toBe('');
  });

  it('maneja strings muy largos', () => {
    const longPassword = 'x'.repeat(10000);
    const encrypted = encryptCredential(longPassword);
    const decrypted = decryptCredential(encrypted);
    expect(decrypted).toBe(longPassword);
  });
});
