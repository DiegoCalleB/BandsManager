# ADR: Modularización de server/routes/users.ts en sub-routers

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6, §2 (autenticación y multi-tenancy), continuación de [0042](./0042-modularizacion-ai-music.md)

## Problema
`server/routes/users.ts` tenía 3652 líneas: 35 rutas de cuentas y sesión (alta, login con contraseña y con Google, invitaciones, recuperación de contraseña, cambio de banda, preferencias, bandas y miembros) y los helpers que deciden qué bandas ve un usuario y quién puede restablecer la contraseña de quién. Es la superficie de autenticación del producto.

## Decisión
**Primero los tests de seguridad**, sobre el código original (`superficieUsersAiMusic.test.ts`, ver ADR 0042): inventario exacto **y en orden** de las 35 rutas, toda ruta no pública exige `requireAuth` (las públicas están listadas con su motivo), la gestión de miembros exige `requireLeader`, y cambiar de banda sin sesión da 401 y a una banda ajena 404 sin emitir sesión. Junto a los tests de seguridad que ya existían (Google, invitaciones, cuentas, autorización), todos pasan sin cambios tras la partición.

`users.ts` queda como router contenedor que monta once sub-routers de `server/routes/users/` **en el orden original** y reexporta `cleanBandId`, `buildAvailableBandsForUser` y `ensureAdminUserExists`:

| Sub-router | Rutas |
|---|---|
| `rutasRegistro` | alta y bandas registradas |
| `rutasInvitacion` | comprobar invitación y activar miembro |
| `rutasGoogle`, `rutasLogin`, `rutasRecuperacion` | acceso con Google, con contraseña, recuperación y correo de prueba |
| `rutasSesion` | `/auth/me`, cambio de banda y cierre de sesión |
| `rutasPreferencias` | banda principal, orden de bandas y preferencias de interfaz |
| `rutasBandas`, `rutasSalidaBanda` | logo, crear banda, salir de una banda |
| `rutasMiembros`, `rutasMiembrosEdicion` | asociar, listar, alta, edición y baja de miembros |

Helpers: `bandasDisponibles`, `permisosCuenta`, `adminInicial`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `users.ts` | 3652 | 42 |
| Mayor módulo | 3652 | 370 (`rutasRecuperacion`) |

## Por qué el orden importa aquí
`POST /users/upload-logo` está declarada dos veces (en `rutasBandas` y en `rutasSalidaBanda`) y Express atiende la primera. El test de superficie compara el orden de users para que mover un sub-router no cambie en silencio qué handler responde. Unificar la ruta duplicada queda como deuda: hacerlo cambia comportamiento y merece su propio cambio.

## Consecuencias
Una ruta nueva va a su sub-router y al inventario del test, con su motivo si es pública.
