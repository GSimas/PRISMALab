import { webcrypto } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAuthUrl, challengeFor, completeOpenRouterLogin, createPkcePair, exchangeCode } from '../../src/features/assistant/openrouterAuth';

const nodeCrypto = webcrypto as unknown as Crypto;
const okResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

describe('login com OpenRouter (OAuth PKCE)', () => {
  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('gera o code_challenge S256 conforme o vetor da RFC 7636', async () => {
    expect(await challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk', nodeCrypto)).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('cria verificadores aleatórios em base64url sem padding', async () => {
    const a = await createPkcePair(nodeCrypto);
    const b = await createPkcePair(nodeCrypto);
    expect(a.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a.verifier).not.toBe(b.verifier);
    expect(a.challenge).toBe(await challengeFor(a.verifier, nodeCrypto));
  });

  it('monta a URL de autorização com retorno, desafio e rótulo da chave', () => {
    const url = new URL(buildAuthUrl('https://prisma.example/builder', 'abc'));
    expect(url.origin + url.pathname).toBe('https://openrouter.ai/auth');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      callback_url: 'https://prisma.example/builder',
      code_challenge: 'abc',
      code_challenge_method: 'S256',
      key_label: 'PRISMA Lab',
    });
  });

  it('troca o código pela chave do usuário', async () => {
    const fetcher = vi.fn(async () => okResponse({ key: 'sk-or-v1-user' }));
    await expect(exchangeCode('code-1', 'verifier-1', fetcher as typeof fetch)).resolves.toBe('sk-or-v1-user');
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/auth/keys');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ code: 'code-1', code_verifier: 'verifier-1', code_challenge_method: 'S256' });
  });

  it('falha quando o OpenRouter recusa o código ou não devolve chave', async () => {
    await expect(exchangeCode('x', 'y', (async () => new Response('{}', { status: 403 })) as typeof fetch)).rejects.toThrow('HTTP 403');
    await expect(exchangeCode('x', 'y', (async () => okResponse({})) as typeof fetch)).rejects.toThrow('no key');
  });

  it('conclui o login no retorno, usando código e verificador uma única vez', async () => {
    sessionStorage.setItem('prisma-openrouter-pkce', 'verifier-2');
    window.history.replaceState(null, '', '/builder?project=p1&code=code-2');
    const fetcher = vi.fn(async () => okResponse({ key: 'sk-or-v1-new' }));

    await expect(completeOpenRouterLogin(fetcher as typeof fetch)).resolves.toBe('sk-or-v1-new');
    expect(window.location.search).toBe('?project=p1');
    expect(sessionStorage.getItem('prisma-openrouter-pkce')).toBeNull();
    await expect(completeOpenRouterLogin(fetcher as typeof fetch)).resolves.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('ignora ?code= quando o login não foi iniciado nesta aba', async () => {
    window.history.replaceState(null, '', '/builder?code=alheio');
    const fetcher = vi.fn();
    await expect(completeOpenRouterLogin(fetcher as unknown as typeof fetch)).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
    expect(window.location.search).toBe('?code=alheio');
  });
});
