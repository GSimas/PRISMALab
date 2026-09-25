'use client';

import { useEffect, useState } from 'react';
import { assistantProviderMeta, isProviderConfigured, OPENROUTER_PREVIOUS_DEFAULT } from './providers';
import type { AssistantProviderConfig, AssistantProviderId, AssistantSettings } from './types';

const STORAGE_KEY = 'prisma-assistant-settings-v1';

const defaults: AssistantSettings = {
  consent: false,
  activeProvider: 'openai',
  providers: {},
};

const isValidSettings = (value: unknown): value is AssistantSettings =>
  !!value && typeof value === 'object' && 'providers' in (value as Record<string, unknown>);

export function useAssistantSettings() {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AssistantSettings>(defaults);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
        if (isValidSettings(saved)) setSettings({ ...defaults, ...saved, providers: { ...saved.providers } });
      } catch {
        /* keep defaults */
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [ready, settings]);

  const setActiveProvider = (id: AssistantProviderId) => setSettings((s) => ({ ...s, activeProvider: id }));

  const updateProvider = (id: AssistantProviderId, patch: Partial<AssistantProviderConfig>) =>
    setSettings((s) => ({
      ...s,
      providers: {
        ...s.providers,
        [id]: { apiKey: '', model: '', ...s.providers[id], ...patch },
      },
    }));

  const clearProvider = (id: AssistantProviderId) =>
    setSettings((s) => {
      const providers = { ...s.providers };
      delete providers[id];
      return { ...s, providers };
    });

  const setConsent = (consent: boolean) => setSettings((s) => ({ ...s, consent }));

  /** Stores the key from "Sign in with OpenRouter" and makes OpenRouter the active provider. */
  const connectOpenRouter = (apiKey: string) =>
    setSettings((s) => {
      // Keeps a model the user picked; otherwise starts on the free default.
      const saved = s.providers.openrouter?.model;
      const model = saved && saved !== OPENROUTER_PREVIOUS_DEFAULT ? saved : assistantProviderMeta('openrouter').defaultModel;
      return {
        ...s,
        consent: true,
        activeProvider: 'openrouter',
        providers: {
          ...s.providers,
          openrouter: { ...s.providers.openrouter, apiKey, model, oauth: true },
        },
      };
    });

  const activeConfig = settings.providers[settings.activeProvider];
  const isConfigured = isProviderConfigured(assistantProviderMeta(settings.activeProvider), activeConfig);

  return { ready, settings, activeConfig, isConfigured, setActiveProvider, updateProvider, clearProvider, setConsent, connectOpenRouter };
}
