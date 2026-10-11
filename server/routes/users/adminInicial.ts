/**
 * Alta o actualización del administrador global al arrancar (contraseña solo desde ADMIN_PASSWORD).
 */
import { verifyPassword, hashPassword } from '../../auth.js';
import { saveState } from '../../state.js';
import { dbUpsertUser } from '../../db.js';
import type { AppState, UsuarioGuardado } from '../../stateTypes.js';

/**
 * Garantiza la cuenta de administración global.
 *
 * La contraseña sale SOLO de `ADMIN_PASSWORD` (variable de entorno). Antes estaba escrita en el
 * código y se reimponía en cada arranque y en cada login «admin»: quien la leyera en el repositorio
 * entraba como admin y ningún cambio de contraseña duraba. Ahora:
 *  - con `ADMIN_PASSWORD` (≥ 12 caracteres): crea el admin si falta, o actualiza su contraseña
 *    únicamente si ha cambiado la variable (así se rota la clave);
 *  - sin ella: NO crea ningún admin y NO toca las credenciales del existente.
 */
export async function ensureAdminUserExists(state: AppState) {
  try {
    const adminPass = process.env.ADMIN_PASSWORD || '';
    const hayClaveValida = adminPass.length >= 12;
    if (adminPass && !hayClaveValida) {
      console.warn('[admin] ADMIN_PASSWORD es demasiado corta (mínimo 12 caracteres): se ignora.');
    }

    let adminUser: UsuarioGuardado | undefined = (state.users || []).find(
      (u) =>
        (u.username && u.username.toLowerCase() === 'admin') ||
        (u.email && u.email.toLowerCase() === 'admin@bandmanager.ai')
    );

    if (!adminUser && !hayClaveValida) {
      console.warn('[admin] No hay cuenta admin y ADMIN_PASSWORD no está definida: no se crea ninguna.');
      return null;
    }

    let cambiado = false;
    if (adminUser) {
      if (hayClaveValida && !(adminUser.passwordHash && adminUser.salt && verifyPassword(adminPass, adminUser.passwordHash, adminUser.salt))) {
        const { hash, salt } = hashPassword(adminPass);
        adminUser.passwordHash = hash;
        adminUser.salt = salt;
        cambiado = true;
      } else if (!hayClaveValida) {
        console.warn('[admin] ADMIN_PASSWORD no está definida: las credenciales del admin no se modifican.');
      }
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        cambiado = true;
      }
    } else {
      const { hash, salt } = hashPassword(adminPass);
      adminUser = {
        id: 'user-admin-global',
        username: 'Admin',
        email: 'admin@bandmanager.ai',
        name: 'Administrador Global',
        role: 'admin',
        plan: 'cabeza_de_cartel',
        bandName: 'Vértice',
        band_id: 'band-vertice',
        main_band_id: 'band-vertice',
        band_order: ['vertice'],
        avatarColor: '#ec4899',
        passwordHash: hash,
        salt: salt,
        createdAt: new Date().toISOString(),
      };
      if (!state.users) state.users = [];
      state.users.push(adminUser);
      cambiado = true;
    }

    if (cambiado) {
      try {
        const { getSupabase } = await import('../../db/core.js');
        const sb = getSupabase();
        const { data: dbAdmin } = await sb
          .from('users')
          .select('id')
          .or('username.ilike.admin,email.ilike.admin@bandmanager.ai')
          .maybeSingle();
        if (dbAdmin?.id) {
          adminUser.id = dbAdmin.id;
        }
      } catch {
        // Ignorar si Supabase no está disponible en este momento
      }

      saveState(state);
      await dbUpsertUser(adminUser).catch((err: unknown) =>
        console.warn('Supabase admin upsert notice:', err)
      );
    }
    return adminUser;
  } catch (err) {
    console.warn('Could not ensure admin user:', err);
    return null;
  }
}
