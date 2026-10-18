import { describe, expect, it } from 'vitest';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseMarkdown } from '../chatFormatting';

const render = (text: string) => renderToStaticMarkup(createElement(Fragment, null, parseMarkdown(text)));

describe('parseMarkdown', () => {
  it('renders plain lines as paragraphs', () => {
    expect(render('Hola banda')).toContain('<p');
    expect(render('Hola banda')).toContain('Hola banda');
  });

  it('renders "- " lines as list items without the dash', () => {
    const html = render('- Primer punto');
    expect(html).toContain('<li');
    expect(html).toContain('Primer punto');
    expect(html).not.toContain('- Primer');
  });

  it('wraps **bold** fragments in <strong>', () => {
    const html = render('Esto es **importante** de verdad');
    expect(html).toContain('<strong');
    expect(html).toContain('importante');
    expect(html).not.toContain('**');
  });

  it('escapes HTML instead of injecting it', () => {
    const html = render('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('keeps one element per input line', () => {
    expect(parseMarkdown('a\nb\n- c')).toHaveLength(3);
  });
});
