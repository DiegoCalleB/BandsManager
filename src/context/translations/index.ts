import type { SupportedLanguage } from '../idioma';
import { es } from './es';
import { en } from './en';
import { ca } from './ca';
import { gl } from './gl';
import { eu } from './eu';

/** Diccionario de traducciones por idioma. */
export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = { es, en, ca, gl, eu };
