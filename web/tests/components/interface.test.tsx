import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { GlobalHeader } from '../../src/components/GlobalHeader';
import { GlobalFooter } from '../../src/components/GlobalFooter';
import { LandingPage } from '../../src/components/LandingPage';
import { createProject } from '../../src/domain/project';
import { PrismaDiagram } from '../../src/features/builder/PrismaDiagram';
import { ExportPanel } from '../../src/features/export/ExportPanel';

describe('componentes essenciais', () => {
  it('troca idioma, tema e alto contraste com persistência', async () => {
    localStorage.clear();
    localStorage.setItem('prisma-locale', 'pt-BR');
    render(<AppProviders><GlobalHeader /></AppProviders>);
    await waitFor(() => expect(screen.getByLabelText('Idioma')).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Idioma'), { target: { value: 'en' } });
    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'dark' } });
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByLabelText('High contrast'));
    expect(document.documentElement.dataset.contrast).toBe('high');
    expect(localStorage.getItem('prisma-locale')).toBe('en');
  });

  it('traduz cabeçalho, rodapé e página inicial para todos os 6 idiomas', async () => {
    localStorage.clear();
    localStorage.setItem('prisma-locale', 'pt-BR');
    render(
      <AppProviders>
        <GlobalHeader />
        <LandingPage />
        <GlobalFooter />
      </AppProviders>
    );

    await waitFor(() => expect(screen.getByLabelText('Idioma')).toBeEnabled());

    // 1. pt-BR
    expect(screen.getAllByText('Uma aplicação Scientata')).toHaveLength(3);
    expect(screen.getByText('Ferramenta independente baseada no PRISMA 2020.')).toBeInTheDocument();
    expect(screen.getAllByText('Criar meu diagrama')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explorar exemplo' })).toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: 'Uma aplicação Scientata' })) expect(link).toHaveAttribute('href', 'https://scientata.com');

    // 2. English
    fireEvent.change(screen.getByLabelText('Idioma'), { target: { value: 'en' } });
    await waitFor(() => expect(screen.getAllByText('A Scientata application')).toHaveLength(3));
    expect(screen.getByText('Independent tool based on PRISMA 2020.')).toBeInTheDocument();
    expect(screen.getAllByText('Create my diagram')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore example' })).toBeInTheDocument();

    // 3. Italiano
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'it' } });
    await waitFor(() => expect(screen.getAllByText('Un’applicazione Scientata')).toHaveLength(3));
    expect(screen.getByText('Strumento indipendente basato su PRISMA 2020.')).toBeInTheDocument();
    expect(screen.getAllByText('Crea il diagramma')[0]).toBeInTheDocument();

    // 4. Français
    fireEvent.change(screen.getByLabelText('Lingua'), { target: { value: 'fr' } });
    await waitFor(() => expect(screen.getAllByText('Une application Scientata')).toHaveLength(3));
    expect(screen.getByText('Outil indépendant basé sur PRISMA 2020.')).toBeInTheDocument();
    expect(screen.getAllByText('Créer mon diagramme')[0]).toBeInTheDocument();

    // 5. Deutsch
    fireEvent.change(screen.getByLabelText('Langue'), { target: { value: 'de' } });
    await waitFor(() => expect(screen.getAllByText('Eine Scientata-Anwendung')).toHaveLength(3));
    expect(screen.getByText('Unabhängiges Werkzeug basierend auf PRISMA 2020.')).toBeInTheDocument();
    expect(screen.getAllByText('Diagramm erstellen')[0]).toBeInTheDocument();

    // 6. 简体中文
    fireEvent.change(screen.getByLabelText('Sprache'), { target: { value: 'zh-CN' } });
    await waitFor(() => expect(screen.getAllByText('Scientata 旗下应用')).toHaveLength(3));
    expect(screen.getByText('基于 PRISMA 2020 的独立工具。')).toBeInTheDocument();
    expect(screen.getAllByText('创建流程图')[0]).toBeInTheDocument();
  });

  it('oferece diagrama semântico operável por teclado', () => {
    const project = createProject({ example: true });
    let selected = '';
    render(<PrismaDiagram project={project} locale="pt-BR" selected="databases" onSelect={(field) => { selected = field; }} />);
    const nodes = screen.getAllByRole('button', { name: /Selecionar para editar detalhes/ });
    expect(screen.getByRole('group', { name: new RegExp(project.title) })).toBeInTheDocument();
    expect(document.querySelector('.prisma-svg')).toHaveAttribute('data-style', 'classic');
    fireEvent.keyDown(nodes[0], { key: 'Enter' });
    expect(selected).not.toBe('');
  });

  it('renderiza a alternativa editorial moderna quando selecionada', () => {
    const project = createProject({ example: true });
    project.presentation.diagramStyle = 'modern';
    render(<PrismaDiagram project={project} locale="pt-BR" selected="databases" onSelect={() => undefined} />);
    expect(document.querySelector('.prisma-svg')).toHaveAttribute('data-style', 'modern');
    expect(document.querySelector('.classic-chrome')).not.toBeInTheDocument();
  });

  it('expõe todos os formatos de exportação', () => {
    render(<ExportPanel project={createProject({ example: true })} locale="pt-BR" />);
    ['PDF vetorial', 'SVG', 'PNG 2×', 'HTML interativo', 'CSV', 'XLSX', 'Backup JSON', 'Relatório HTML', 'Pacote ZIP'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
  });

  it('aciona onSelect com identificador do nó ao clicar no bloco de outros métodos', () => {
    const project = createProject({ example: true, model: 'new-databases-other' });
    let selectedField = '';
    let selectedNodeId = '';
    render(
      <PrismaDiagram
        project={project}
        locale="pt-BR"
        selected="databases"
        onSelect={(field, nodeId) => {
          selectedField = field;
          selectedNodeId = nodeId ?? '';
        }}
      />
    );
    const otherNode = screen.getByRole('button', { name: /Sites.*Selecionar para editar detalhes/ });
    fireEvent.click(otherNode);
    expect(selectedField).toBe('websites');
    expect(selectedNodeId).toBe('identified-other');
  });
});
