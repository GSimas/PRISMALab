import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assistantProviders } from '../../src/features/assistant/providers';

// The production CSP lives in netlify.toml; Primi calls AI providers straight from the browser.
const toml = readFileSync(resolve(process.cwd(), '../netlify.toml'), 'utf-8');
const csp = toml.match(/Content-Security-Policy = "([^"]+)"/)![1];
const connectSrc = csp.split(';').map((part) => part.trim().split(/\s+/)).find(([name]) => name === 'connect-src')!.slice(1);

/** Minimal CSP source matching: scheme, host (with a leading *. wildcard) and port (* allowed). */
function allowed(target: string): boolean {
  const url = new URL(target);
  return connectSrc.some((source) => {
    const match = source.match(/^(https?):\/\/(\*\.)?([^:/]+)(?::(\*|\d+))?$/);
    if (!match) return false;
    const [, scheme, wildcard, host, port] = match;
    if (`${scheme}:` !== url.protocol) return false;
    const hostOk = wildcard ? url.hostname.endsWith(`.${host}`) : url.hostname === host;
    const portOk = port === '*' || (port ?? '') === url.port;
    return hostOk && portOk;
  });
}

describe('política de segurança de conteúdo (CSP)', () => {
  it('libera o endpoint de cada provedor embutido do Primi', () => {
    const endpoints = [
      ...assistantProviders.filter((provider) => provider.baseUrl).map((provider) => `${provider.baseUrl!.replace(/\/$/, '')}/chat/completions`),
      'https://api.anthropic.com/v1/messages',
      'https://generativelanguage.googleapis.com/v1beta/models/x:generateContent',
    ];
    expect(endpoints.filter((endpoint) => !allowed(endpoint))).toEqual([]);
  });

  it('libera o login com OpenRouter, as regiões do Qwen e servidores locais', () => {
    for (const endpoint of [
      'https://openrouter.ai/api/v1/auth/keys',
      'https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions',
      'https://ws-123.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions',
      'http://localhost:11434/v1/chat/completions',
      'http://127.0.0.1:1234/v1/chat/completions',
    ]) expect(allowed(endpoint), endpoint).toBe(true);
  });

  it('continua bloqueando destinos arbitrários', () => {
    expect(allowed('https://example.com/collect')).toBe(false);
    expect(allowed('http://api.openai.com/v1/chat/completions')).toBe(false);
    expect(connectSrc).not.toContain('https:');
    expect(connectSrc).not.toContain('*');
  });
});
