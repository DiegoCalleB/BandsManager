import { describe, expect, it } from 'vitest';
import { GoogleVerifyError, verificarAccessTokenDeGoogle } from '../googleVerify';

const CLIENT = 'cliente-123.apps.googleusercontent.com';
const TOKEN = 'ya29.' + 'x'.repeat(40);

const respuesta = (cuerpo: any, status = 200) => async () =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });

const valida = { aud: CLIENT, email: 'Diego@Gmail.com', email_verified: 'true', sub: '1234' };

describe('verificarAccessTokenDeGoogle', () => {
  it('acepta un token válido y devuelve el email y sub que dice GOOGLE, normalizados', async () => {
    const r = await verificarAccessTokenDeGoogle(TOKEN, { emailDeclarado: 'diego@gmail.com', subDeclarado: '1234', fetchImpl: respuesta(valida) as any, clientIds: [CLIENT] });
    expect(r).toEqual({ email: 'diego@gmail.com', sub: '1234' });
  });

  it('rechaza si falta el token (el ataque: mandar solo el email de otra cuenta)', async () => {
    await expect(verificarAccessTokenDeGoogle(undefined, { emailDeclarado: 'admin@x.com', clientIds: [CLIENT] })).rejects.toBeInstanceOf(GoogleVerifyError);
    await expect(verificarAccessTokenDeGoogle('corto', { clientIds: [CLIENT] })).rejects.toThrow('Falta el token');
  });

  it('rechaza un token que Google no reconoce', async () => {
    await expect(verificarAccessTokenDeGoogle(TOKEN, { fetchImpl: respuesta({ error: 'invalid_token' }, 400) as any, clientIds: [CLIENT] })).rejects.toThrow('rechazó');
  });

  it('rechaza un token válido pero emitido para OTRA aplicación', async () => {
    await expect(verificarAccessTokenDeGoogle(TOKEN, { fetchImpl: respuesta({ ...valida, aud: 'otra-app' }) as any, clientIds: [CLIENT] })).rejects.toThrow('no es de esta aplicación');
  });

  it('rechaza si el email del cuerpo no es el del token (suplantación)', async () => {
    await expect(verificarAccessTokenDeGoogle(TOKEN, { emailDeclarado: 'admin@bandmanager.ai', fetchImpl: respuesta(valida) as any, clientIds: [CLIENT] })).rejects.toThrow('no coincide');
  });

  it('rechaza si el uid del cuerpo no es el sub del token', async () => {
    await expect(verificarAccessTokenDeGoogle(TOKEN, { emailDeclarado: 'diego@gmail.com', subDeclarado: '9999', fetchImpl: respuesta(valida) as any, clientIds: [CLIENT] })).rejects.toThrow('identificador');
  });

  it('rechaza emails sin verificar', async () => {
    await expect(verificarAccessTokenDeGoogle(TOKEN, { fetchImpl: respuesta({ ...valida, email_verified: 'false' }) as any, clientIds: [CLIENT] })).rejects.toThrow('verificado');
  });

  it('falla cerrado si no hay client id configurado o Google no responde', async () => {
    await expect(verificarAccessTokenDeGoogle(TOKEN, { fetchImpl: respuesta(valida) as any, clientIds: [] })).rejects.toThrow('GOOGLE_CLIENT_ID');
    await expect(verificarAccessTokenDeGoogle(TOKEN, { fetchImpl: (async () => { throw new Error('red'); }) as any, clientIds: [CLIENT] })).rejects.toThrow('contactar');
  });
});
