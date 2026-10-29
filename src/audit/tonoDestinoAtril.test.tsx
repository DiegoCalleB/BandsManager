import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ControlTonoDestino } from '../components/chords/ControlTonoDestino';

describe('selector de tono destino', () => {
  it('muestra el tono original y el destino ya transpuesto', () => {
    const html = renderToStaticMarkup(<ControlTonoDestino tonica={4} menor={false} bemoles={false} notation="EN" transpose={3} onTranspose={() => {}} />);
    expect(html).toContain('E →');
    expect(html).toMatch(/<option value="7" selected[^>]*>G<\/option>|<option selected[^>]*value="7"[^>]*>G<\/option>/);
    expect(html.match(/<option/g)).toHaveLength(12);
  });
});
