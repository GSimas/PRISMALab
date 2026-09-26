import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { BuilderWorkspace } from '../../src/features/builder/BuilderWorkspace';

describe('painéis laterais do construtor', () => {
  it('recolhe, persiste e reabre ao focar um campo', async () => {
    Element.prototype.scrollIntoView = vi.fn(); // not implemented by jsdom
    localStorage.clear();
    localStorage.setItem('prisma-locale', 'pt-BR');
    const { container } = render(<AppProviders><BuilderWorkspace /></AppProviders>);
    const dataPanel = () => container.querySelector('.data-panel')!;
    await waitFor(() => expect(screen.getByLabelText('Recolher painel: Dados')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Recolher painel: Dados'));
    expect(dataPanel()).toHaveAttribute('data-collapsed');
    expect(screen.getByLabelText('Expandir painel: Dados')).toHaveAttribute('aria-expanded', 'false');
    expect(JSON.parse(localStorage.getItem('prisma-builder-panels')!)).toEqual({ data: true, context: false });

    // A validation item points into the collapsed data panel: it must reopen.
    fireEvent.click(container.querySelector('.validation-item')!);
    expect(dataPanel()).not.toHaveAttribute('data-collapsed');
  });
});
