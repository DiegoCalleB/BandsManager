import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Tabs } from '../ui';
import { Captura } from './Captura';

type Funcion = 'panel' | 'booking' | 'repertorio' | 'calendario' | 'hojas' | 'multibanda';

interface Texto { es: string; en: string }
interface FuncionLanding {
  id: Funcion;
  etiqueta: Texto;
  titulo: Texto;
  texto: Texto;
  puntos: Texto[];
  captura: { nombre: string; movil: string; alt: Texto };
}

const FUNCIONES: FuncionLanding[] = [
  {
    id: 'panel',
    etiqueta: { es: 'Panel', en: 'Dashboard' },
    titulo: { es: 'Qué toca hoy, nada más abrir', en: 'What is on today, the moment you open it' },
    texto: {
      es: 'Un panel que te dice lo siguiente que tienes que hacer: el próximo bolo, lo que está sin responder y lo que falta por cobrar.',
      en: 'A dashboard that tells you what to do next: the next gig, what is unanswered and what is still unpaid.',
    },
    puntos: [
      { es: 'Próximo bolo y cuenta atrás', en: 'Next gig and countdown' },
      { es: 'Tareas pendientes de toda la banda', en: 'Pending tasks for the whole band' },
      { es: 'Resumen de caja del mes', en: 'Monthly cash summary' },
    ],
    captura: { nombre: 'panel', movil: 'movil-panel', alt: { es: 'Panel de la banda', en: 'Band dashboard' } },
  },
  {
    id: 'booking',
    etiqueta: { es: 'Booking', en: 'Booking' },
    titulo: { es: 'Del primer correo a la firma, sin Excel', en: 'From first email to signature, no spreadsheet' },
    texto: {
      es: 'Cada sala y cada promotor con su ficha, su estado y su historial. Propuesta, contrato y señal por Stripe desde el mismo sitio.',
      en: 'Every venue and promoter with a profile, a status and a history. Proposal, contract and Stripe deposit in one place.',
    },
    puntos: [
      { es: 'Seguimiento: enviado, negociando, confirmado', en: 'Tracking: sent, negotiating, confirmed' },
      { es: 'Contrato digital que firma la sala desde el móvil', en: 'Digital contract the venue signs on mobile' },
      { es: 'Señal del 50% en custodia', en: '50% deposit held in escrow' },
    ],
    captura: { nombre: 'booking', movil: 'm-booking', alt: { es: 'Seguimiento de booking', en: 'Booking tracking' } },
  },
  {
    id: 'repertorio',
    etiqueta: { es: 'Repertorio e Iris', en: 'Repertoire and Iris' },
    titulo: { es: 'Setlists con mapa de energía y pistas separadas', en: 'Setlists with an energy map and separated stems' },
    texto: {
      es: 'Monta el setlist viendo cómo sube y baja la energía del concierto. Iris separa voz, bajo, batería y guitarra para ensayar silenciando tu instrumento.',
      en: 'Build the setlist watching the energy of the show rise and fall. Iris splits vocals, bass, drums and guitar so you can rehearse with your part muted.',
    },
    puntos: [
      { es: 'BPM, tonalidad y duración por tema', en: 'BPM, key and length per song' },
      { es: 'Pistas separadas con Iris', en: 'Stems separated with Iris' },
      { es: 'Cada miembro ve su versión', en: 'Each member sees their own version' },
    ],
    captura: { nombre: 'repertorio', movil: 'm-repertorio', alt: { es: 'Setlist con mapa de energía', en: 'Setlist with energy map' } },
  },
  {
    id: 'calendario',
    etiqueta: { es: 'Calendario', en: 'Calendar' },
    titulo: { es: 'Ensayos y bolos en un solo calendario', en: 'Rehearsals and gigs in one calendar' },
    texto: {
      es: 'Cruza ensayos, conciertos y disponibilidad de cada miembro y avisa al instante si dos fechas chocan.',
      en: 'Cross-checks rehearsals, gigs and every member’s availability and warns you the moment two dates clash.',
    },
    puntos: [
      { es: 'Avisos de solape entre bandas', en: 'Clash warnings across bands' },
      { es: 'Disponibilidad de cada miembro', en: 'Availability for each member' },
      { es: 'Exporta a tu calendario del móvil', en: 'Export to your phone calendar' },
    ],
    captura: { nombre: 'calendario', movil: 'm-calendario', alt: { es: 'Calendario de la banda', en: 'Band calendar' } },
  },
  {
    id: 'hojas',
    etiqueta: { es: 'Hojas de ruta', en: 'Day sheets' },
    titulo: { es: 'La hoja de ruta, lista para la furgo', en: 'The day sheet, ready for the van' },
    texto: {
      es: 'Horarios, dirección, rider técnico y contactos del bolo en una hoja que todo el equipo lleva en el móvil, siempre actualizada.',
      en: 'Times, address, technical rider and contacts for the gig in one sheet the whole crew carries on their phone, always up to date.',
    },
    puntos: [
      { es: 'Rider técnico y backline', en: 'Technical rider and backline' },
      { es: 'Horarios de carga y prueba de sonido', en: 'Load-in and soundcheck times' },
      { es: 'Liquidación clara tras el bolo', en: 'Clear settlement after the gig' },
    ],
    captura: { nombre: 'hojas', movil: 'm-hojas', alt: { es: 'Hoja de ruta de un bolo', en: 'Gig day sheet' } },
  },
  {
    id: 'multibanda',
    etiqueta: { es: 'Multibanda', en: 'Multi-band' },
    titulo: { es: 'Varias bandas, un solo acceso', en: 'Several bands, one login' },
    texto: {
      es: 'Si tocas en más de un proyecto o llevas varias bandas, cambias de una a otra con un toque. Canciones, miembros y finanzas están aislados.',
      en: 'If you play in more than one project or manage several bands, switch between them in one tap. Songs, members and finances stay separate.',
    },
    puntos: [
      { es: 'Datos totalmente separados por banda', en: 'Fully separated data per band' },
      { es: 'Permisos distintos según el rol', en: 'Different permissions by role' },
      { es: 'Pensado para mánagers y productoras', en: 'Built for managers and producers' },
    ],
    captura: { nombre: 'bandas', movil: 'm-bandas', alt: { es: 'Selector multibanda', en: 'Multi-band switcher' } },
  },
];

/** Las funciones principales de la app, una pestaña por función con su captura real. */
export const FuncionesTfm: React.FC<{ es: boolean }> = ({ es }) => {
  const [activa, setActiva] = useState<Funcion>('panel');
  const l = es ? 'es' : 'en';
  const f = FUNCIONES.find((x) => x.id === activa) ?? FUNCIONES[0];
  return (
    <section id="funciones" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {es ? 'Lo que hace BandManager por tu banda' : 'What BandManager does for your band'}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--ink-2)]">
        {es
          ? 'Booking, repertorio, calendario, hojas de ruta y cobros en una sola app. Capturas reales, no maquetas.'
          : 'Booking, repertoire, calendar, day sheets and payments in one app. Real screenshots, not mock-ups.'}
      </p>
      <Tabs<Funcion>
        aria-label={es ? 'Funciones' : 'Features'}
        className="mx-auto mt-8 max-w-full"
        value={activa}
        onChange={setActiva}
        items={FUNCIONES.map((x) => ({ id: x.id, label: x.etiqueta[l] }))}
      />
      <div className="mt-10 grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <h3 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">{f.titulo[l]}</h3>
          <p className="mt-3 text-base leading-relaxed text-[var(--ink-2)]">{f.texto[l]}</p>
          <ul className="mt-5 space-y-2 text-sm">
            {f.puntos.map((p) => (
              <li key={p.es} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                <span>{p[l]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-7">
          <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:p-3">
            <Captura nombre={f.captura.nombre} movil={f.captura.movil} alt={f.captura.alt[l]} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FuncionesTfm;
