// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { LanguageProvider } from '../../context/LanguageContext';
import { PublicLanding } from '../PublicLanding';

/** Lee el JSON-LD que la landing inyecta en <head>. */
const leerJsonLd = () => {
  const script = document.getElementById('ld-json');
  expect(script).not.toBeNull();
  return JSON.parse(script!.textContent || '{}') as { '@graph': Array<Record<string, unknown>> };
};

describe('PublicLanding: datos estructurados', () => {
  beforeEach(() => {
    cleanup();
    document.getElementById('ld-json')?.remove();
  });

  it('no declara valoraciones: sin reseñas reales verificables, Google lo considera reseña inventada', () => {
    render(
      <LanguageProvider>
        <PublicLanding onEntrar={() => {}} />
      </LanguageProvider>,
    );
    const tipos = leerJsonLd()['@graph'];
    const app = tipos.find((n) => n['@type'] === 'SoftwareApplication');
    expect(app).toBeTruthy();
    expect(app).not.toHaveProperty('aggregateRating');
    expect(JSON.stringify(tipos)).not.toMatch(/AggregateRating|ratingValue|ratingCount/);
  });

  it('mantiene la aplicación, la oferta gratuita y las preguntas frecuentes', () => {
    render(
      <LanguageProvider>
        <PublicLanding onEntrar={() => {}} />
      </LanguageProvider>,
    );
    const tipos = leerJsonLd()['@graph'];
    const app = tipos.find((n) => n['@type'] === 'SoftwareApplication') as { offers?: { price?: string } };
    expect(app.offers?.price).toBe('0');
    const faq = tipos.find((n) => n['@type'] === 'FAQPage') as { mainEntity?: unknown[] };
    expect(faq.mainEntity?.length).toBeGreaterThan(0);
  });
});
