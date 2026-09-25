import { describe, expect, it } from 'vitest';
import { calculateProject } from '../../src/domain/calculations';
import { createProject } from '../../src/domain/project';
import { conversation, withDecisions } from '../../src/features/assistant/client';
import { extractProposal, planProposal } from '../../src/features/assistant/proposals';
import type { AssistantMessage } from '../../src/features/assistant/types';

const fence = (label: string, json: string, close = true) => `Proposta abaixo.\n\n\`\`\`${label}\n${json}\n${close ? '```' : ''}`;

describe('extração de propostas — variações de formato', () => {
  const json = '{"summary":"Duplicatas","counts":{"duplicates":85}}';
  const expected = { summary: 'Duplicatas', counts: { duplicates: 85 } };

  it.each([
    ['bloco canônico', fence('prisma-update', json)],
    ['rótulo json prisma-update', fence('json prisma-update', json)],
    ['rótulo prisma_update', fence('prisma_update', json)],
    ['rótulo em maiúsculas', fence('PRISMA-UPDATE', json)],
    ['bloco sem cerca de fechamento', fence('prisma-update', json, false)],
    ['bloco ```json com proposta', fence('json', json)],
  ])('%s', (_, reply) => {
    const result = extractProposal(reply);
    expect(result.proposal).toEqual(expected);
    expect(result.invalid).toBe(false);
    expect(result.text).toBe('Proposta abaixo.');
  });

  it('reconhece o eco da nota de histórico relatado pelo usuário e não o exibe como texto', () => {
    const reply = '[Field update proposal, applied by the user: {"summary":"Registrar 150 relatórios não recuperados.","counts":{"reportsNotRetrieved":150}}]';
    const result = extractProposal(reply);
    expect(result.text).toBe('');
    expect(result.proposal).toEqual({ summary: 'Registrar 150 relatórios não recuperados.', counts: { reportsNotRetrieved: 150 } });
  });

  it('remove o eco mesmo no meio de um texto', () => {
    const reply = 'Certo, registrei.\n[Field update proposal, pending by the user: {"counts":{"duplicates":12}}]\nAlgo mais?';
    const result = extractProposal(reply);
    expect(result.text).toBe('Certo, registrei.\n\nAlgo mais?');
    expect(result.proposal?.counts).toEqual({ duplicates: 12 });
  });

  it('mantém blocos ```json que não são propostas', () => {
    const reply = 'Exemplo de formato:\n```json\n{"exemplo": 1}\n```';
    expect(extractProposal(reply)).toEqual({ text: reply, proposal: null, invalid: false });
  });

  it('tolera aspas tipográficas, vírgulas sobrando e chaves dentro de strings', () => {
    const result = extractProposal(fence('prisma-update', '{“summary”: “use {x} aqui”, "counts": {"duplicates": 3,},}'));
    expect(result.proposal).toEqual({ summary: 'use {x} aqui', counts: { duplicates: 3 } });
  });

  it('converte números escritos como texto e com separador de milhar', () => {
    const result = extractProposal(fence('prisma-update', '{"counts": {"duplicates": "85", "registers": "1.234", "recordsExcluded": "1,500"}}'));
    expect(result.proposal?.counts).toEqual({ duplicates: 85, registers: 1234, recordsExcluded: 1500 });
  });

  it('entende ids em snake_case, rótulos em outros idiomas e contagens fora de "counts"', () => {
    const result = extractProposal(fence('prisma-update', '{"reports_not_retrieved": 7, "Duplicatas removidas": 20, "counts": {"Records excluded": 30}}'));
    expect(result.proposal?.counts).toEqual({ reportsNotRetrieved: 7, duplicates: 20, recordsExcluded: 30 });
  });

  it('desembrulha objetos aninhados e aceita nomes alternativos nos itens', () => {
    const result = extractProposal(fence('prisma-update', '{"prisma-update": {"databaseSources": [{"database": "PubMed", "records": "320"}], "exclusionReasons": [{"reason": "População errada", "n": 4}]}}'));
    expect(result.proposal).toEqual({
      databaseSources: [{ name: 'PubMed', count: 320 }],
      exclusionReasons: [{ label: 'População errada', count: 4 }],
    });
  });

  it('distingue o interruptor otherSources da contagem de outras fontes', () => {
    expect(extractProposal(fence('prisma-update', '{"otherSources": "true"}')).proposal).toEqual({ otherSources: true });
    expect(extractProposal(fence('prisma-update', '{"otherSources": 14}')).proposal).toEqual({ counts: { otherSources: 14 } });
  });

  it('marca como inválido um bloco sem nenhum campo aplicável ou com valores impossíveis', () => {
    expect(extractProposal(fence('prisma-update', '{"summary": "nada"}'))).toMatchObject({ proposal: null, invalid: true });
    expect(extractProposal(fence('prisma-update', '{"counts": {"duplicates": -4}}'))).toMatchObject({ proposal: null, invalid: true });
    expect(extractProposal(fence('prisma-update', '{"counts": {"duplicates": 2.5}}'))).toMatchObject({ proposal: null, invalid: true });
    expect(extractProposal(fence('prisma-update', 'isto não é json'))).toMatchObject({ proposal: null, invalid: true });
  });

  it('usa a última proposta válida quando há várias', () => {
    const reply = `${fence('prisma-update', '{"counts": {"duplicates": 1}}')}\n${fence('prisma-update', 'quebrado')}\n${fence('prisma-update', '{"counts": {"duplicates": 2}}')}`;
    const result = extractProposal(reply);
    expect(result.proposal?.counts).toEqual({ duplicates: 2 });
    expect(result.invalid).toBe(false);
  });

  it('não altera respostas sem proposta', () => {
    const reply = 'O PRISMA 2020 tem **27 itens**.\n\n- item 1\n- item 2';
    expect(extractProposal(reply)).toEqual({ text: reply, proposal: null, invalid: false });
  });
});

describe('proposta aplicada preserva as fórmulas', () => {
  it('uma proposta ecoada vira alteração real e os derivados continuam calculados', () => {
    const project = createProject({ model: 'new-databases' });
    Object.assign(project.counts, { databases: 500, duplicates: 50, recordsExcluded: 200 });
    const { proposal } = extractProposal('[Field update proposal, applied by the user: {"counts":{"reportsNotRetrieved":150}}]');
    const plan = planProposal(project, proposal!);
    expect(plan.changes).toEqual([{ field: 'count', key: 'reportsNotRetrieved', from: null, to: 150 }]);
    const { values } = calculateProject({ ...project, ...plan.patch });
    expect(values.reportsSought).toBe(250);
    expect(values.reportsAssessed).toBe(100);
  });
});

describe('histórico enviado ao modelo', () => {
  const reply = fence('prisma-update', '{"summary":"Não recuperados","counts":{"reportsNotRetrieved":150}}');
  const { text, proposal } = extractProposal(reply);
  const history: AssistantMessage[] = [
    { id: '1', role: 'user', content: 'Não recuperei 150 relatos.', at: '' },
    { id: '2', role: 'assistant', content: text, raw: reply, proposal: proposal!, proposalStatus: 'applied', at: '' },
    { id: '3', role: 'error', content: 'falha', at: '' },
    { id: '4', role: 'user', content: 'E as duplicatas?', at: '' },
  ];

  it('reenvia a resposta original com o bloco correto e sem notas imitáveis', () => {
    const messages = conversation(history);
    expect(messages.map((message) => message.role)).toEqual(['user', 'assistant', 'user']);
    expect(messages[1].content).toBe(reply);
    expect(messages.some((message) => message.content.includes('[Field update proposal'))).toBe(false);
  });

  it('informa as decisões do usuário apenas no prompt do sistema', () => {
    const system = withDecisions('BASE', history);
    expect(system).toContain('PROPOSAL DECISIONS');
    expect(system).toContain('1. applied — Não recuperados');
    expect(system).not.toContain('[Field update proposal');
    expect(withDecisions('BASE', [history[0]])).toBe('BASE');
  });
});
