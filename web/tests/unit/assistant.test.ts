import { describe, expect, it } from 'vitest';
import { calculateProject } from '../../src/domain/calculations';
import { createProject } from '../../src/domain/project';
import { assistantProviderMeta, isProviderConfigured, resolveBaseUrl } from '../../src/features/assistant/providers';
import { buildAssistantSystemPrompt } from '../../src/features/assistant/context';
import { extractProposal, planProposal } from '../../src/features/assistant/proposals';

const reply = (json: string) => `Vou preencher as bases informadas.\n\n\`\`\`prisma-update\n${json}\n\`\`\``;

describe('propostas de preenchimento do Primi', () => {
  it('extrai o bloco, remove-o do texto e valida o conteúdo', () => {
    const result = extractProposal(reply('{"summary": "Bases e duplicatas", "counts": {"duplicates": 85}}'));
    expect(result.text).toBe('Vou preencher as bases informadas.');
    expect(result.proposal).toEqual({ summary: 'Bases e duplicatas', counts: { duplicates: 85 } });
    expect(result.invalid).toBe(false);
  });

  it('sinaliza blocos malformados sem aplicar nada', () => {
    expect(extractProposal(reply('{"counts": {"duplicates": -3}}'))).toMatchObject({ proposal: null, invalid: true });
    expect(extractProposal(reply('{not json'))).toMatchObject({ proposal: null, invalid: true });
    expect(extractProposal('Resposta sem proposta.')).toEqual({ text: 'Resposta sem proposta.', proposal: null, invalid: false });
  });

  it('preenche campos informados e mantém as fórmulas calculando os derivados', () => {
    const project = createProject({ model: 'new-databases' });
    const plan = planProposal(project, {
      counts: { registers: 40, duplicates: 85, recordsExcluded: 300, screened: 999 },
      databaseSources: [{ name: 'PubMed', count: 320 }, { name: 'Scopus', count: 210 }],
    });

    expect(plan.ignored).toEqual(['screened']);
    const next = { ...project, ...plan.patch };
    const { values, origins } = calculateProject(next);
    expect(values.databases).toBe(530);
    expect(origins.databases).toBe('derived');
    expect(values.screened).toBe(530 + 40 - 85);
    expect(values.reportsSought).toBe(530 + 40 - 85 - 300);
  });

  it('não sobrescreve a contagem de bases quando há bases individuais', () => {
    const project = createProject({ model: 'new-databases' });
    const plan = planProposal(project, { counts: { databases: 10 }, databaseSources: [{ name: 'Embase', count: 7 }] });
    expect(plan.ignored).toContain('databases');
    expect(plan.patch.counts).toBeUndefined();
  });

  it('só aceita campos do modelo resultante e ajusta o modelo quando proposto', () => {
    const project = createProject({ model: 'new-databases' });
    expect(planProposal(project, { counts: { previousStudies: 12 } }).ignored).toEqual(['previousStudies']);

    const plan = planProposal(project, { reviewKind: 'updated', counts: { previousStudies: 12 } });
    expect(plan.patch).toMatchObject({ reviewKind: 'updated', model: 'updated-databases' });
    expect(plan.patch.counts?.previousStudies).toBe(12);
    expect(plan.changes.map((change) => change.field)).toEqual(['reviewKind', 'count']);
  });

  it('não gera alterações quando os valores já correspondem ao projeto', () => {
    const project = createProject({ model: 'new-databases' });
    project.counts.duplicates = 85;
    const plan = planProposal(project, { counts: { duplicates: 85 } });
    expect(plan.changes).toEqual([]);
    expect(plan.patch).toEqual({});
  });
});

describe('provedores do Primi', () => {
  it('exige chave, modelo e endpoint conforme o provedor', () => {
    expect(isProviderConfigured(assistantProviderMeta('deepseek'), { apiKey: '', model: 'deepseek-flash' })).toBe(false);
    expect(isProviderConfigured(assistantProviderMeta('deepseek'), { apiKey: 'sk-x', model: 'deepseek-flash' })).toBe(true);
    expect(isProviderConfigured(assistantProviderMeta('ollama'), { apiKey: '', model: 'qwen3' })).toBe(true);
    expect(isProviderConfigured(assistantProviderMeta('custom'), { apiKey: 'k', model: 'm' })).toBe(false);
    expect(isProviderConfigured(assistantProviderMeta('custom'), { apiKey: 'k', model: 'm', baseUrl: 'https://llm.example/v1' })).toBe(true);
  });

  it('só permite trocar o endpoint em provedores editáveis', () => {
    expect(resolveBaseUrl(assistantProviderMeta('zhipu'), 'https://evil.example')).toBe('https://open.bigmodel.cn/api/paas/v4');
    expect(resolveBaseUrl(assistantProviderMeta('qwen'), 'https://dashscope-us.aliyuncs.com/compatible-mode/v1')).toBe('https://dashscope-us.aliyuncs.com/compatible-mode/v1');
  });
});

describe('idioma das respostas do Primi', () => {
  it('responde na língua do usuário e usa a da interface só como padrão', () => {
    const prompt = buildAssistantSystemPrompt('en');
    expect(prompt).toMatch(/language of the user's latest message/);
    expect(prompt).toMatch(/use the interface language: English/);
    expect(prompt).not.toMatch(/Always respond in this language/);
  });
});
