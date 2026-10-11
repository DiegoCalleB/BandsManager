/**
 * Forma del estado local de la aplicación (data.json / caché en memoria de server/state.ts).
 *
 * `loadState()` devolvía `any`, y de ahí colgaban cientos de callbacks sin tipo
 * (`state.leads.find((l: any) => …)`). Con este tipo, TypeScript comprueba cada acceso. Los tipos
 * de dominio salen de src/types.ts; aquí se declaran solo los que no existían.
 */
import type {
  BandContact,
  Concert,
  EPKConfig,
  Fan,
  Lead,
  Message,
  Payment,
  RegisteredBand,
  Rehearsal,
  Setlist,
  SocialMetric,
  SocialPost,
  Song,
  Tour,
  UserWithHash,
} from '../src/types.js';

/** Pertenencia de un usuario a una banda. */
export interface UserBand {
  id?: string;
  user_id: string;
  band_id: string;
  role?: string;
  email?: string;
  createdAt?: string;
  is_main?: boolean;
}

/** Sesión persistida (las activas viven además en memoria, ACTIVE_SESSIONS). */
export interface SesionGuardada {
  userId: string;
  createdAt: number;
}

/** Usuario guardado: el de la app más los campos que solo existen en el servidor. */
export type UsuarioGuardado = Omit<UserWithHash, 'passwordHash' | 'salt'> & {
  /** Sin contraseña en las cuentas de Google. */
  passwordHash?: string;
  salt?: string;
  main_band_id?: string;
  band_order?: string[];
  initialPassword?: string;
  /** Recuperación de contraseña: código, caducidad (ms) e intentos fallidos. */
  resetCode?: string;
  resetCodeExpires?: number;
  resetIntentos?: number;
  [campo: string]: unknown;
};

/** Banda registrada tal como se guarda (los datos legados traen alias de campos). */
export type BandaRegistradaGuardada = Omit<RegisteredBand, 'fecha_registro'> & {
  /** Las bandas semilla (demo, Vértice) no la traen. */
  fecha_registro?: string;
  bandName?: string;
  name?: string;
  user_id?: string;
  logo_url?: string;
  imagen_url?: string;
  [campo: string]: unknown;
};

/** Colecciones con `?`: las crea el código la primera vez que se usan (no vienen en la semilla). */
export interface AppState {
  users: UsuarioGuardado[];
  registeredBands: BandaRegistradaGuardada[];
  userBands?: UserBand[];
  sessions?: Record<string, SesionGuardada>;
  leads: Lead[];
  bands: BandContact[];
  concerts: Concert[];
  rehearsals: Rehearsal[];
  fans: Fan[];
  songs: Song[];
  setlists: Setlist[];
  tours: Tour[];
  posts: SocialPost[];
  payments: Payment[];
  messages: Message[];
  metrics: SocialMetric[];
  /** EPK guardado por banda: se va completando por partes (logo, bio…), por eso es parcial. */
  epkConfig: Partial<EPKConfig>;
  epkConfigsByBand?: Record<string, Partial<EPKConfig>>;
  runOfShow: Record<string, unknown>;
  gearChecklists: Record<string, unknown>;
  autonomyConfigsByBand?: Record<string, unknown>;
  /** Clics por botón de la página de fans, y `<botón>_last_at` con la fecha del último. */
  clickMetricsByBand?: Record<string, Record<string, number | string>>;
  categoryTemplates?: Record<string, unknown>;
  musiciansWaitlist?: unknown[];
  [coleccion: string]: unknown;
}
