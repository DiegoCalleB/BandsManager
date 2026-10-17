# Aviso real «Alguien está viendo tu TFM»

En la escena «El reloj» (a los ~8,5 s, para que el correo llegue cuando sale la notificación en pantalla, a los 11,6 s) la presentación
manda UN correo de verdad a quien ve la película. Está **apagado por defecto**: no se envía nada hasta que se active a propósito.

## Cómo funciona
- `aviso.js` (navegador): solo en la web publicada (https, no localhost), en modo película, una vez por pestaña. `?sinaviso` lo desactiva.
- `aviso/servidor.mjs` (servidor, detrás de Caddy, en 127.0.0.1): atiende `POST /aviso`. Sin las variables de abajo responde «apagado» y no envía.
- Resend con el dominio `bandmanager.io` (verificado), remitente `BandManager <avisos@bandmanager.io>`.

## Activarlo (Railway → servicio de la presentación → Variables)
| Variable | Valor |
|---|---|
| `AVISO_ACTIVO` | `ensayo` (solo escribe en el log lo que enviaría) o `1` (envía de verdad). Cualquier otro valor, o quitarla = apagado |
| `AVISO_DESTINO` | el correo que lo recibe (no hay destinatario por defecto en el código) |
| `RESEND_API_KEY` | la clave de Resend (nunca en el repositorio) |
| `AVISO_ORIGENES` | opcional; por defecto `presentacion-storytelling.up.railway.app` |
| `AVISO_MIN_HORAS` | opcional; por defecto 6 (como mucho un aviso cada 6 h en total) |

Orden recomendado: 1) `AVISO_ACTIVO=ensayo` y ver en los logs de Railway que sale «[aviso] ENSAYO», 2) el día de la defensa, `AVISO_ACTIVO=1`,
3) después, quitar `AVISO_ACTIVO`. Para pararlo al instante basta quitar la variable (o ponerla en `0`) y redesplegar.
