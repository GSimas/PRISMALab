import { describe, expect, it } from 'vitest';
import { calculateProject } from '../../src/domain/calculations';
import { bandProgress, completenessFor, progressFor } from '../../src/domain/completeness';
import { createProject } from '../../src/domain/project';

describe('completude do diagrama', () => {
  it('começa vazio e aponta a identificação como próximo passo', () => {
    const project = createProject({ model: 'new-databases' });
    const result = completenessFor(project);
    expect(result.stages.map((stage) => stage.id)).toEqual(['identification', 'removed', 'screening', 'eligibility', 'inclusion']);
    expect(result.total).toBe(6);
    expect(result.percent).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.next).toEqual({ stage: 'identification', field: 'databases' });
    expect(result.stages.every((stage) => stage.status === 'pending')).toBe(true);
    expect(result.ready.screened).toBe(false);
  });

  it('inclui etapas do modelo atualizado e de outras fontes', () => {
    const project = createProject({ model: 'updated-databases-other' });
    const ids = completenessFor(project).stages.map((stage) => stage.id);
    expect(ids).toEqual(['previous', 'identification', 'removed', 'screening', 'eligibility', 'other-methods', 'inclusion']);
    expect(completenessFor(project).total).toBe(13);
  });

  it('avança etapa por etapa e libera as caixas derivadas', () => {
    const project = createProject({ model: 'new-databases' });
    project.counts.databases = 500;
    project.counts.duplicates = 40;
    const result = completenessFor(project);
    expect(result.stages.find((stage) => stage.id === 'identification')!.status).toBe('complete');
    expect(result.stages.find((stage) => stage.id === 'removed')!.status).toBe('complete');
    expect(result.percent).toBe(33);
    expect(result.ready.screened).toBe(true);
    expect(result.ready.reportsSought).toBe(false);
    expect(result.next).toEqual({ stage: 'screening', field: 'recordsExcluded' });

    project.counts.recordsExcluded = 300;
    const partial = completenessFor(project);
    expect(partial.stages.find((stage) => stage.id === 'screening')!.status).toBe('in-progress');
    expect(partial.ready.reportsSought).toBe(true);
  });

  it('considera o exemplo didático completo', () => {
    const project = createProject({ model: 'new-databases', example: true });
    const result = completenessFor(project);
    expect(result.percent).toBe(100);
    expect(result.complete).toBe(true);
    expect(result.next).toBeNull();
    expect(Object.values(bandProgress(result)).every((band) => band.complete && band.fraction === 1)).toBe(true);
  });

  it('marca a etapa com inconsistência e não declara o diagrama completo', () => {
    const project = createProject({ model: 'new-databases', example: true });
    project.exclusionReasons[0].count += 5;
    const result = completenessFor(project);
    expect(result.percent).toBe(100);
    expect(result.stages.find((stage) => stage.id === 'eligibility')!.status).toBe('attention');
    expect(result.complete).toBe(false);
  });

  it('conta bases detalhadas como identificação preenchida', () => {
    const project = createProject({ model: 'new-databases' });
    project.sources = [{ id: 'a', type: 'database', name: 'PubMed', count: 120 }];
    expect(completenessFor(project).stages[0].status).toBe('complete');
  });

  it('exige ao menos uma fonte no ramo de outros métodos', () => {
    const project = createProject({ model: 'new-databases-other' });
    const otherStage = () => completenessFor(project).stages.find((stage) => stage.id === 'other-methods')!;
    expect(otherStage().filled).toBe(0);
    project.sources = [{ id: 'w', type: 'website', name: 'Site', count: 8 }];
    expect(otherStage().filled).toBe(1);
  });

  it('não altera as contagens nem os cálculos', () => {
    const project = createProject({ model: 'new-databases', example: true });
    const counts = structuredClone(project.counts);
    const before = calculateProject(project);
    completenessFor(project);
    expect(project.counts).toEqual(counts);
    expect(calculateProject(project)).toEqual(before);
  });

  it('expõe o percentual para a lista de projetos', () => {
    const project = createProject({ model: 'new-databases' });
    project.counts.databases = 10;
    expect(progressFor(project)).toBe(completenessFor(project).percent);
  });
});
