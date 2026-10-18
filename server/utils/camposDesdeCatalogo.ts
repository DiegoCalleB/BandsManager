/**
 * Un lead de una sala que el catálogo compartido ya conoce se completa con lo que otras bandas encontraron: web,
 * contacto de la sala, dirección, aforo, género... Es la etapa más barata del enriquecimiento (no gasta ninguna API)
 * y la primera que se prueba. Solo rellena huecos: nunca pisa lo que la banda ya tiene.
 */
import type { SalaGuardada } from '../services/catalogoSalas.js';

/** Campos del lead que el catálogo puede aportar, con el valor de la sala. */
export type CamposDeCatalogo = Partial<{
  place_id: string;
  direccion: string;
  region: string;
  telefono: string;
  website: string;
  email_contacto: string;
  instagram: string;
  aforo: number;
  genero: string;
}>;

const vacio = (v: unknown): boolean => v === undefined || v === null || v === '' || v === 0;

/** Lo que el catálogo aporta a un lead concreto: solo los campos que el lead tiene vacíos y la sala sí conoce. */
export function camposDesdeCatalogo(lead: object, sala: SalaGuardada | null | undefined): CamposDeCatalogo {
  if (!sala || sala.no_contactar) return {};
  const l = lead as Record<string, unknown>;
  const aporta: CamposDeCatalogo = {};
  const texto = <K extends 'place_id' | 'direccion' | 'region' | 'telefono' | 'website' | 'email_contacto' | 'instagram' | 'genero'>(
    campo: K,
    valor: string | null,
  ) => {
    if (valor && vacio(l[campo])) aporta[campo] = valor;
  };
  texto('place_id', sala.place_id);
  texto('direccion', sala.direccion);
  texto('region', sala.region);
  // El catálogo solo guarda teléfonos fijos de la sala; el lead puede tener el suyo en otro de los tres campos.
  if (sala.telefono && vacio(l.telefono) && vacio(l.telefono_fijo) && vacio(l.telefono_movil)) aporta.telefono = sala.telefono;
  texto('website', sala.website);
  texto('email_contacto', sala.email_contacto);
  texto('instagram', sala.instagram);
  texto('genero', sala.genero);
  if (sala.aforo && vacio(l.aforo)) aporta.aforo = sala.aforo;
  return aporta;
}
