import { describe, expect, it } from 'vitest';
import { calculateProject, describeFlow, selectModel } from '../../src/domain/calculations';
import { createProject } from '../../src/domain/project';
import { migrateProject } from '../../src/domain/schema';
import { validateProject } from '../../src/domain/validation';
import { detectLocale } from '../../src/i18n/locale';
import { restoreProject, safeFileName, serializeProject } from '../../src/storage/serialization';
import { resolveTheme } from '../../src/app/AppProviders';

describe('motor de domínio', () => {
  it('seleciona os quatro modelos PRISMA 2020', () => {
    expect(selectModel('new', false)).toBe('new-databases');
    expect(selectModel('new', true)).toBe('new-databases-other');
    expect(selectModel('updated', false)).toBe('updated-databases');
    expect(selectModel('updated', true)).toBe('updated-databases-other');
  });

  it('calcula o fluxo sem alterar a entrada', () => {
    const project = createProject({ model: 'new-databases', example: true });
    const before = structuredClone(project.counts);
    const result = calculateProject(project);
    expect(result.values.screened).toBe(1906);
    expect(result.values.reportsSought).toBe(126);
    expect(result.values.reportsAssessed).toBe(102);
    expect(result.values.newReports).toBe(34);
    expect(project.counts).toEqual(before);
  });

  it('respeita sobrescrição rastreável', () => {
    const project = createProject({ example: true });
    project.overrides.screened = { value: 1900, justification: 'Auditoria externa', updatedAt: project.updatedAt };
    expect(calculateProject(project).origins.screened).toBe('override');
    expect(calculateProject(project).values.screened).toBe(1900);
    expect(validateProject(project).some((entry) => entry.id === 'override-screened')).toBe(true);
  });

  it('detecta subtrações impossíveis e razões que não fecham', () => {
    const project = createProject({ example: true });
    project.counts.duplicates = 9999;
    project.exclusionReasons[0].count = 999;
    const ids = validateProject(project).map((entry) => entry.id);
    expect(ids).toContain('negative-derivation');
    expect(ids).toContain('reasons-sum');
  });

  it('migra objetos legados preenchendo o esquema atual', () => {
    const migrated = migrateProject({ title: 'Legado', counts: { databases: 3 } });
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.title).toBe('Legado');
    expect(migrated.counts.databases).toBe(3);
    expect(migrated.checklist).toHaveLength(27);
    expect(migrated.presentation.diagramStyle).toBe('classic');
  });

  it('recusa JSON que não é um projeto', () => {
    expect(() => migrateProject({ not: 'a project' })).toThrow();
    expect(() => migrateProject(null)).toThrow();
  });

  it('usa o diagrama PRISMA clássico como visual padrão', () => {
    expect(createProject().presentation.diagramStyle).toBe('classic');
  });

  it('detecta locale exato, base e fallback', () => {
    expect(detectLocale(['zh-CN'])).toBe('zh-CN');
    expect(detectLocale(['pt-PT'])).toBe('pt-BR');
    expect(detectLocale(['xx'])).toBe('en');
  });

  it('resolve a preferência de tema do sistema', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('serializa, restaura e gera nomes seguros', () => {
    const project = createProject({ title: 'Revisão: Saúde & Educação', example: true });
    expect(restoreProject(serializeProject(project))).toEqual(project);
    expect(safeFileName(project.title, '.json')).toBe('revisao-saude-educacao.json');
  });

  // The landing page promises this: Simetrics exports a .json that imports as-is.
  it('importa o .json exportado pelo Simetrics', () => {
    const base = createProject();
    const simetrics = {
      ...base, title: 'Memetics and cultural evolution: a scoping review', locale: 'en', updatedDate: '2026-10-01',
      sources: [{ id: 'e034da07-a284-4ce3-961c-962e71ea4863', type: 'database', name: 'Outra', count: 331 }],
      counts: { ...base.counts, databases: 331, registers: 0, duplicates: 0, automationExcluded: 0, removedOther: 0, screened: 331, recordsExcluded: 0 },
      history: [{ id: '766c1630-dff3-436f-9a27-9583449bdff0', at: '2026-10-01T22:13:37.758Z', action: 'Imported from Simetrics' }],
    };
    const project = restoreProject(JSON.stringify(simetrics));
    expect(project.counts.databases).toBe(331);
    expect(project.history.at(-1)?.action).toBe('Imported from Simetrics');
  });

  it('gera descrição textual com as unidades científicas', () => {
    const description = describeFlow(createProject({ example: true }));
    expect(description).toContain('registros foram triados');
    expect(description).toContain('estudos');
    expect(description).toContain('relatos');
  });

  it('exibe bases de dados individuais e valores especificados no diagrama', async () => {
    const { getDiagramNodes } = await import('../../src/features/builder/diagramModel');
    const project = createProject({ model: 'new-databases' });
    project.sources = [
      { id: '1', type: 'database', name: 'Web of Science', count: 120 },
      { id: '2', type: 'database', name: 'Scopus', count: 85 },
    ];
    const calc = calculateProject(project);
    expect(calc.values.databases).toBe(205);
    expect(calc.origins.databases).toBe('derived');

    const nodes = getDiagramNodes(project, 'pt-BR');
    const mainNode = nodes.find((n) => n.id === 'identified-main');
    expect(mainNode?.lines).toContain('Bases de dados (n = 205):');
    expect(mainNode?.lines).toContain('Web of Science (n = 120)');
    expect(mainNode?.lines).toContain('Scopus (n = 85)');
  });

  it('oculta itens em branco de outros métodos no diagrama até receberem valor', async () => {
    const { getDiagramNodes } = await import('../../src/features/builder/diagramModel');
    const project = createProject({ model: 'new-databases-other' });
    project.counts.websites = null;
    project.counts.organisations = null;
    project.counts.citationSearching = null;
    project.counts.otherSources = null;

    let nodes = getDiagramNodes(project, 'pt-BR');
    let otherNode = nodes.find((n) => n.id === 'identified-other');
    expect(otherNode?.lines.some((l) => l.includes('Sites'))).toBe(false);
    expect(otherNode?.lines.some((l) => l.includes('Organizações'))).toBe(false);
    expect(otherNode?.lines.some((l) => l.includes('Busca por citações'))).toBe(false);

    project.counts.websites = 42;
    nodes = getDiagramNodes(project, 'pt-BR');
    otherNode = nodes.find((n) => n.id === 'identified-other');
    expect(otherNode?.lines.some((l) => l.includes('Sites (n = 42)'))).toBe(true);
    expect(otherNode?.lines.some((l) => l.includes('Organizações'))).toBe(false);
    expect(otherNode?.lines.some((l) => l.includes('Busca por citações'))).toBe(false);

    project.counts.citationSearching = 15;
    nodes = getDiagramNodes(project, 'pt-BR');
    otherNode = nodes.find((n) => n.id === 'identified-other');
    expect(otherNode?.lines.some((l) => l.includes('Sites (n = 42)'))).toBe(true);
    expect(otherNode?.lines.some((l) => l.includes('Busca por citações (n = 15)'))).toBe(true);
    expect(otherNode?.lines.some((l) => l.includes('Organizações'))).toBe(false);
  });

  it('exibe fontes selecionadas dinamicamente em outros métodos com nomes e valores', async () => {
    const { getDiagramNodes } = await import('../../src/features/builder/diagramModel');
    const project = createProject({ model: 'new-databases-other' });
    project.sources = [
      { id: '1', type: 'website', name: 'Sites', count: 45 },
      { id: '2', type: 'organisation', name: 'Organizações Internacionais', count: 20 },
      { id: '3', type: 'other', name: 'Contato com autores', count: 5 },
    ];
    const calc = calculateProject(project);
    expect(calc.values.websites).toBe(45);
    expect(calc.values.organisations).toBe(20);
    expect(calc.values.otherSources).toBe(5);

    const nodes = getDiagramNodes(project, 'pt-BR');
    const otherNode = nodes.find((n) => n.id === 'identified-other');
    expect(otherNode?.lines).toContain('Sites (n = 45)');
    expect(otherNode?.lines).toContain('Organizações Internacionais (n = 20)');
    expect(otherNode?.lines).toContain('Contato com autores (n = 5)');
    expect(otherNode?.value).toBe(70);
  });
});
