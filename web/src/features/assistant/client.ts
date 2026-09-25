'use client';

import { describeProposalDecisions } from './proposals';
import { assistantProviderMeta, isOpenRouterFreeModel, isProviderConfigured, openRouterModels, resolveBaseUrl, type AssistantProviderMeta } from './providers';
import { AssistantError, type AssistantMessage, type AssistantProviderConfig, type AssistantProviderId } from './types';

interface SendParams {
  providerId: AssistantProviderId;
  config: AssistantProviderConfig;
  systemPrompt: string;
  history: AssistantMessage[];
}

const TIMEOUT_MS = 60000;
// Leaves room for reasoning models, which spend output tokens before answering.
const MAX_OUTPUT_TOKENS = 4000;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AssistantError('network', 'Request timed out.');
    }
    throw new AssistantError('network', 'Network request failed.');
  } finally {
    window.clearTimeout(timer);
  }
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 300);
  } catch {
    return '';
  }
}

// Replies go back exactly as the model wrote them (proposal block included) so it
// keeps seeing the correct protocol; the user's decisions go in the system prompt.
export const conversation = (history: AssistantMessage[]) =>
  history
    .filter((m) => m.role !== 'error')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: (m.role === 'assistant' && m.raw) || m.content || '…' }));

/** System prompt plus the decisions on earlier proposals, when there are any. */
export const withDecisions = (systemPrompt: string, history: AssistantMessage[]) => {
  const decisions = describeProposalDecisions(history);
  return decisions ? `${systemPrompt}\n\n${decisions}` : systemPrompt;
};

async function sendOpenAiCompatible(meta: AssistantProviderMeta, config: AssistantProviderConfig, systemPrompt: string, history: AssistantMessage[]): Promise<string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (config.apiKey.trim()) headers.authorization = `Bearer ${config.apiKey}`;
  if (meta.id === 'openrouter') Object.assign(headers, { 'HTTP-Referer': window.location.origin, 'X-Title': 'PRISMA Lab' });
  const limits = meta.modernOpenAiParams ? { max_completion_tokens: MAX_OUTPUT_TOKENS } : { max_tokens: MAX_OUTPUT_TOKENS, temperature: 0.3 };
  const response = await fetchWithTimeout(`${resolveBaseUrl(meta, config.baseUrl).replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...(meta.id === 'openrouter' ? openRouterModels(config.model) : { model: config.model }),
      messages: [{ role: 'system', content: systemPrompt }, ...conversation(history)],
      ...limits,
    }),
  });
  if (!response.ok) {
    const body = await readErrorBody(response);
    // Free models: daily/rate limits (429) or an account privacy setting that excludes free endpoints (404).
    const freeLimit = meta.id === 'openrouter' && isOpenRouterFreeModel(config.model) && (response.status === 429 || response.status === 404);
    throw new AssistantError(freeLimit ? 'free-model' : 'http', `HTTP ${response.status}: ${body}`);
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new AssistantError('empty-response', 'Empty response from provider.');
  return content;
}

async function sendAnthropic(config: AssistantProviderConfig, systemPrompt: string, history: AssistantMessage[]): Promise<string> {
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      system: systemPrompt,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: conversation(history),
    }),
  });
  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new AssistantError('http', `HTTP ${response.status}: ${body}`);
  }
  const data = (await response.json()) as { content?: { text?: string }[] };
  const text = Array.isArray(data?.content) ? data.content.map((block) => block.text ?? '').join('') : '';
  if (!text) throw new AssistantError('empty-response', 'Empty response from provider.');
  return text;
}

async function sendGoogle(config: AssistantProviderConfig, systemPrompt: string, history: AssistantMessage[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: conversation(history).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.3 },
    }),
  });
  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new AssistantError('http', `HTTP ${response.status}: ${body}`);
  }
  const data = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p) => p.text ?? '').join('') : '';
  if (!text) throw new AssistantError('empty-response', 'Empty response from provider.');
  return text;
}

export async function sendAssistantMessage({ providerId, config, systemPrompt, history }: SendParams): Promise<string> {
  const meta = assistantProviderMeta(providerId);
  if (!isProviderConfigured(meta, config)) throw new AssistantError('missing-key', 'Provider is not fully configured.');
  const system = withDecisions(systemPrompt, history);

  switch (meta.protocol) {
    case 'anthropic':
      return sendAnthropic(config, system, history);
    case 'google':
      return sendGoogle(config, system, history);
    default:
      return sendOpenAiCompatible(meta, config, system, history);
  }
}
