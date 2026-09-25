/**
 * "Sign in with OpenRouter" (OAuth PKCE), fully client-side: the user authorizes
 * PRISMA Lab on openrouter.ai and comes back with a one-time code, which is
 * exchanged for a user-controlled API key. The key is stored like a BYOK key,
 * only in this browser, and can be revoked from the user's OpenRouter account.
 * https://openrouter.ai/docs/guides/overview/auth/oauth
 */

const AUTH_URL = 'https://openrouter.ai/auth';
const KEYS_URL = 'https://openrouter.ai/api/v1/auth/keys';
const PENDING_KEY = 'prisma-openrouter-pkce';

export const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function challengeFor(verifier: string, webCrypto: Crypto = crypto): Promise<string> {
  const digest = await webCrypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export async function createPkcePair(webCrypto: Crypto = crypto) {
  const verifier = base64Url(webCrypto.getRandomValues(new Uint8Array(32)));
  return { verifier, challenge: await challengeFor(verifier, webCrypto) };
}

export function buildAuthUrl(callbackUrl: string, challenge: string): string {
  const url = new URL(AUTH_URL);
  url.searchParams.set('callback_url', callbackUrl);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('key_label', 'PRISMA Lab');
  return url.toString();
}

/** Remembers the verifier for this tab and leaves for OpenRouter; it returns to the current page. */
export async function startOpenRouterLogin(): Promise<void> {
  const { verifier, challenge } = await createPkcePair();
  sessionStorage.setItem(PENDING_KEY, verifier);
  window.location.assign(buildAuthUrl(`${window.location.origin}${window.location.pathname}`, challenge));
}

export async function exchangeCode(code: string, verifier: string, fetcher: typeof fetch = fetch): Promise<string> {
  const response = await fetcher(KEYS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
  });
  if (!response.ok) throw new Error(`OpenRouter key exchange failed: HTTP ${response.status}`);
  const data = (await response.json()) as { key?: unknown };
  if (typeof data.key !== 'string' || !data.key) throw new Error('OpenRouter returned no key');
  return data.key;
}

/**
 * Finishes a login when this page is the OpenRouter callback (`?code=` plus a
 * verifier started in this tab). Returns the new key, or null when there is no
 * login to finish; throws when the exchange fails.
 */
export async function completeOpenRouterLogin(fetcher: typeof fetch = fetch): Promise<string | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const verifier = sessionStorage.getItem(PENDING_KEY);
  if (!code || !verifier) return null;
  // Codes and verifiers are single-use: drop both before the request, whatever happens.
  sessionStorage.removeItem(PENDING_KEY);
  url.searchParams.delete('code');
  window.history.replaceState(null, '', url);
  return exchangeCode(code, verifier, fetcher);
}
