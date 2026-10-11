// Cuentas, sesión y bandas de un usuario: alta, login (contraseña o Google), recuperación de
// contraseña, cambio de banda, preferencias y gestión de miembros.
//
// Router contenedor (ADR 0043): cada grupo de rutas vive en su sub-router de `users/`. El orden de
// montaje es el de declaración original y SÍ importa: `POST /users/upload-logo` está declarada en
// `rutasBandas` y en `rutasSalidaBanda`, y atiende la primera.
import express from 'express';
import { dbCleanCorruptedLeadFields, dbMigrateAllPlansToNewTiers } from '../db.js';
import rutasBandas from './users/rutasBandas.js';
import rutasGoogle from './users/rutasGoogle.js';
import rutasInvitacion from './users/rutasInvitacion.js';
import rutasLogin from './users/rutasLogin.js';
import rutasMiembros from './users/rutasMiembros.js';
import rutasMiembrosEdicion from './users/rutasMiembrosEdicion.js';
import rutasPreferencias from './users/rutasPreferencias.js';
import rutasRecuperacion from './users/rutasRecuperacion.js';
import rutasRegistro from './users/rutasRegistro.js';
import rutasSalidaBanda from './users/rutasSalidaBanda.js';
import rutasSesion from './users/rutasSesion.js';

export { cleanBandId, buildAvailableBandsForUser } from './users/bandasDisponibles.js';
export { ensureAdminUserExists } from './users/adminInicial.js';

// Migraciones y limpiezas de datos que se lanzan al arrancar, sin bloquear el servidor.
dbMigrateAllPlansToNewTiers().catch((err: unknown) => console.warn("[Usuarios] Falló la migración de planes al arrancar:", err));
dbCleanCorruptedLeadFields().catch((err: unknown) => console.warn("[Usuarios] Falló la limpieza de campos corruptos de leads al arrancar:", err));

const router = express.Router();

router.use(rutasRegistro);
router.use(rutasInvitacion);
router.use(rutasGoogle);
router.use(rutasLogin);
router.use(rutasRecuperacion);
router.use(rutasSesion);
router.use(rutasPreferencias);
router.use(rutasBandas);
router.use(rutasSalidaBanda);
router.use(rutasMiembros);
router.use(rutasMiembrosEdicion);

export default router;
