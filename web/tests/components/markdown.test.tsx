import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from '../../src/features/assistant/Markdown';

const html = (text: string) => render(<Markdown text={text} />).container.querySelector('.assistant-markdown')!;

describe('Markdown do Primi', () => {
  it('renderiza ênfases sem deixar asteriscos ou sublinhados visíveis', () => {
    const root = html('Isto é **importante**, *sutil*, __forte__, _leve_ e ~~antigo~~.');
    expect(root.querySelector('strong')?.textContent).toBe('importante');
    expect(root.querySelectorAll('strong')).toHaveLength(2);
    expect(root.querySelectorAll('em')).toHaveLength(2);
    expect(root.querySelector('del')?.textContent).toBe('antigo');
    expect(root.textContent).not.toMatch(/[*_~]/);
  });

  it('renderiza listas com marcadores, numeradas e aninhadas', () => {
    const root = html('Passos:\n- Identificação\n- Triagem\n  - Títulos\n  - Resumos\n* Inclusão\n\n1. Primeiro\n2. Segundo');
    const lists = root.querySelectorAll(':scope > ul, :scope > ol');
    expect([...lists].map((list) => list.tagName)).toEqual(['UL', 'OL']);
    expect(lists[0].querySelectorAll(':scope > li')).toHaveLength(3);
    expect(lists[0].querySelector('li ul')?.querySelectorAll('li')).toHaveLength(2);
    expect(lists[1].querySelectorAll('li')).toHaveLength(2);
    expect(root.textContent).not.toMatch(/^\s*[-*]\s/m);
  });

  it('renderiza títulos, código, citação, tabela e linha horizontal', () => {
    const root = html('## Resumo\nTexto com `reportsExcluded`.\n\n```\nbloco\n```\n> citação\n\n---\n\n| Campo | Valor |\n|---|---:|\n| Duplicatas | 85 |');
    expect(root.querySelector('h4')?.textContent).toBe('Resumo');
    expect(root.querySelector('p code')?.textContent).toBe('reportsExcluded');
    expect(root.querySelector('pre code')?.textContent).toBe('bloco');
    expect(root.querySelector('blockquote')?.textContent).toBe('citação');
    expect(root.querySelector('hr')).not.toBeNull();
    expect([...root.querySelectorAll('td')].map((cell) => cell.textContent)).toEqual(['Duplicatas', '85']);
    expect(root.textContent).not.toMatch(/[#`|>]/);
  });

  it('só cria links seguros', () => {
    const root = html('[docs](https://prisma-statement.org) [mal](javascript:alert(1)) e https://doi.org/10.1136/bmj.n71.');
    const links = [...root.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://prisma-statement.org', 'https://doi.org/10.1136/bmj.n71']);
    expect(links.every((a) => a.getAttribute('rel') === 'noopener noreferrer')).toBe(true);
    expect(root.textContent).toContain('mal');
  });

  it('não confunde identificadores e contas com ênfase', () => {
    const root = html('Use reports_not_retrieved e calcule 2 * 3 * 4.');
    expect(root.querySelector('em')).toBeNull();
    expect(root.textContent).toBe('Use reports_not_retrieved e calcule 2 * 3 * 4.');
  });

  it('nunca interpreta HTML vindo do modelo', () => {
    const root = html('<img src=x onerror="alert(1)"> <script>alert(1)</script>');
    expect(root.querySelector('img, script')).toBeNull();
    expect(root.textContent).toContain('<script>');
  });

  it('mantém quebras de linha dentro de um parágrafo', () => {
    const root = html('linha um\nlinha dois');
    expect(root.querySelectorAll('p')).toHaveLength(1);
    expect(root.querySelectorAll('br')).toHaveLength(1);
  });
});
