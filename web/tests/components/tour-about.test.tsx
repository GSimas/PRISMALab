import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { AboutPage } from '../../src/features/about/AboutPage';
import { GuidedTour } from '../../src/features/tour/GuidedTour';
import { tourSteps, tourText, type TourStep } from '../../src/features/tour/steps';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.setItem('prisma-locale', 'pt-BR');
});

describe('tour guiado', () => {
  it('tem texto para todos os passos em todos os idiomas', () => {
    for (const texts of Object.values(tourText)) {
      for (const step of tourSteps) expect(texts[step.id].every((part) => part.trim().length > 0)).toBe(true);
    }
  });

  it('prepara cada passo, navega e conclui', async () => {
    document.body.insertAdjacentHTML('beforeend', '<section class="tour-target">alvo</section>');
    // jsdom has no layout; the tour skips zero-size (hidden) targets.
    document.querySelector('.tour-target')!.getBoundingClientRect = () => DOMRect.fromRect({ x: 50, y: 100, width: 200, height: 80 });
    const steps: TourStep[] = [{ id: 'welcome', tab: 'data' }, { id: 'checklist', target: '.tour-target', tab: 'checklist' }, { id: 'finish' }];
    const onPrepare = vi.fn();
    const onClose = vi.fn();
    render(<AppProviders><GuidedTour steps={steps} onPrepare={onPrepare} onClose={onClose} /></AppProviders>);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Boas-vindas ao PRISMA Lab' })).toBeInTheDocument());
    expect(onPrepare).toHaveBeenLastCalledWith(steps[0]);
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Próximo/ }));
    expect(screen.getByRole('heading', { name: 'Complete o checklist' })).toBeInTheDocument();
    expect(onPrepare).toHaveBeenLastCalledWith(steps[1]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(document.querySelector('.tour-spotlight')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Próximo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('fecha com Escape sem marcar como concluído', async () => {
    const onClose = vi.fn();
    render(<AppProviders><GuidedTour steps={tourSteps} onPrepare={vi.fn()} onClose={onClose} /></AppProviders>);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledWith(false);
  });
});

describe('página Sobre com abas', () => {
  it('troca de aba sem mudar de página e reflete a aba na URL', async () => {
    window.history.replaceState(null, '', '/about?tab=privacy');
    render(<AppProviders><AboutPage /></AppProviders>);
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Privacidade' })).toHaveAttribute('aria-selected', 'true'));
    expect(screen.getByRole('heading', { level: 1, name: 'Privacidade por arquitetura' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Metodologia' }));
    expect(screen.getByRole('tab', { name: 'Metodologia' })).toHaveAttribute('aria-selected', 'true');
    expect(window.location.search).toBe('?tab=methodology');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Metodologia' }), { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Sobre' })).toHaveAttribute('aria-selected', 'true');
    expect(window.location.search).toBe('');
  });
});
