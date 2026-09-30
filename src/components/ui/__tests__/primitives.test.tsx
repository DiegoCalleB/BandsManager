import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Input, Textarea, Select, Field, Switch, Card, EmptyState, Button, Tabs, CurveSeries, ChannelChip } from '..';
import { Heart } from 'lucide-react';

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe('primitivas de formulario (Espectro)', () => {
  it('Input: borde de campo con token, 16 px en móvil y sin borde por defecto de Tailwind', () => {
    const out = html(<Input placeholder="Nombre" />);
    expect(out).toContain('border-[var(--line)]');
    expect(out).toContain('text-base sm:text-sm');
    expect(out).toContain('rounded-[var(--r-s)]');
    expect(out).toContain('type="text"');
  });

  it('Input invalid: aria-invalid y borde de alerta', () => {
    const out = html(<Input invalid />);
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain('border-[var(--alert)]');
  });

  it('Input respeta className del llamador (el último gana) y tamaño', () => {
    const out = html(<Input size="sm" className="w-24" />);
    expect(out).toContain('h-9');
    expect(out).toContain('w-24');
    expect(out).not.toContain('w-full');
  });

  it('Textarea comparte la piel del campo y es redimensionable en vertical', () => {
    const out = html(<Textarea />);
    expect(out).toContain('border-[var(--line)]');
    expect(out).toContain('resize-y');
  });

  it('Select: nativo con chevrón propio decorativo', () => {
    const out = html(
      <Select defaultValue="a">
        <option value="a">A</option>
      </Select>,
    );
    expect(out).toContain('<select');
    expect(out).toContain('appearance-none');
    expect(out).toContain('aria-hidden');
  });

  it('Field: etiqueta envolvente, ayuda y error con role=alert', () => {
    const ok = html(<Field label="Correo" hint="Lo usamos para el dossier"><Input /></Field>);
    expect(ok).toContain('<label');
    expect(ok).toContain('Lo usamos para el dossier');
    expect(ok).not.toContain('role="alert"');
    const bad = html(<Field label="Correo" error="Falta el @" hint="ignorada"><Input /></Field>);
    expect(bad).toContain('role="alert"');
    expect(bad).toContain('Falta el @');
    expect(bad).not.toContain('ignorada');
    expect(html(<Field label="Web" optional><Input /></Field>)).toContain('(opcional)');
  });

  it('Switch: role=switch, aria-checked y acento cuando está encendido', () => {
    const on = html(<Switch checked onCheckedChange={() => {}} aria-label="Avisos" />);
    expect(on).toContain('role="switch"');
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain('bg-[var(--acc)]');
    const off = html(<Switch checked={false} onCheckedChange={() => {}} aria-label="Avisos" />);
    expect(off).toContain('aria-checked="false"');
    expect(off).toContain('bg-[var(--line-strong)]');
  });

  it('Card: sin borde (Ley 1) y radio del sistema', () => {
    const out = html(<Card>hola</Card>);
    expect(out).toContain('bg-[var(--surface)]');
    expect(out).toContain('rounded-[var(--r-l)]');
    expect(out).not.toMatch(/\bborder\b/);
  });

  it('EmptyState: El Público, frase con voz y acción', () => {
    const out = html(<EmptyState title="La sala está vacía." description="Vamos a llenarla." action={<Button>Añadir</Button>} />);
    expect(out).toContain('La sala está vacía.');
    expect(out).toContain('Añadir');
    expect(out).toContain('<svg');
  });
});

describe('Tabs, CurveSeries y ChannelChip', () => {
  const items = [
    { id: 'a', label: 'Uno' },
    { id: 'b', label: 'Dos', hidden: true },
    { id: 'c', label: 'Tres' },
  ];

  it('Tabs: rol tablist/tab, solo la activa entra en el orden de tabulación y las ocultas no se pintan', () => {
    const out = html(<Tabs aria-label="Secciones" items={items} value="a" onChange={() => {}} />);
    expect(out).toContain('role="tablist"');
    expect(out.match(/role="tab"/g)).toHaveLength(2);
    expect(out).toContain('aria-selected="true"');
    expect(out).toContain('tabindex="-1"');
    expect(out).not.toContain('Dos');
    expect(out).not.toMatch(/\bborder\b/);
  });

  it('CurveSeries: curva por serie con su color y etiqueta accesible', () => {
    const out = html(
      <CurveSeries
        series={[{ label: 'Fans', color: 'var(--acc)', data: [{ label: 'ene', value: 1 }, { label: 'feb', value: 5 }, { label: 'mar', value: 9 }] }]}
      />,
    );
    expect(out).toContain('aria-label="Evolución de Fans"');
    expect(out).toContain('stroke="var(--acc)"');
    expect(out).toContain('<path');
  });

  it('ChannelChip: pressed según estado y "Solo" como acción aparte', () => {
    const out = html(<ChannelChip canal="spotify" label="Spotify" icon={Heart} value={3755} active onToggle={() => {}} onSolo={() => {}} />);
    expect(out).toContain('aria-pressed="true"');
    expect(out).toContain('Solo');
    expect(out).toContain('var(--ok)');
  });
});
