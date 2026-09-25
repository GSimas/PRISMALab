'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Loader2, Send, Settings, Sparkles, Trash2, X } from 'lucide-react';
import { useApp } from '../app/AppProviders';
import { useProjectStore } from '../app/store';
import { usePresence } from '../app/usePresence';
import { assistantProviderMeta, assistantProviders } from '../features/assistant/providers';
import { useAssistantSettings } from '../features/assistant/useAssistantSettings';
import { buildAssistantSystemPrompt, buildProjectContext } from '../features/assistant/context';
import { sendAssistantMessage } from '../features/assistant/client';
import { AssistantError, type AssistantMessage, type AssistantProviderId } from '../features/assistant/types';
import type { TranslationKey } from '../i18n/translations';

const MAX_HISTORY = 12;

const errorMessageKeys: Record<AssistantError['reason'], TranslationKey> = {
  'missing-key': 'assistantErrorMissingKey',
  network: 'assistantErrorNetwork',
  http: 'assistantErrorHttp',
  'empty-response': 'assistantErrorEmpty',
};
const errorKeyFor = (reason: AssistantError['reason']) => errorMessageKeys[reason];

export function PrismaAssistant() {
  const { locale, t } = useApp();
  const project = useProjectStore((state) => state.project);
  const { ready, settings, activeConfig, isConfigured, setActiveProvider, updateProvider, clearProvider, setConsent } = useAssistantSettings();

  const [open, setOpen] = useState(false);
  const panel = usePresence(open);
  const [view, setView] = useState<'chat' | 'settings'>('settings');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [draftProvider, setDraftProvider] = useState<AssistantProviderId>('openai');
  const [draftApiKey, setDraftApiKey] = useState('');
  const [draftModel, setDraftModel] = useState('');
  const [draftBaseUrl, setDraftBaseUrl] = useState('');
  const [draftConsent, setDraftConsent] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const draftMeta = assistantProviderMeta(draftProvider);
  const canSave = draftApiKey.trim().length > 0 && draftModel.trim().length > 0 && draftConsent && (!draftMeta.needsBaseUrl || draftBaseUrl.trim().length > 0);

  const resetDraftForProvider = (id: AssistantProviderId) => {
    const meta = assistantProviderMeta(id);
    const existing = settings.providers[id];
    setDraftProvider(id);
    setDraftApiKey(existing?.apiKey ?? '');
    setDraftModel(existing?.model ?? meta.defaultModel);
    setDraftBaseUrl(existing?.baseUrl ?? '');
  };

  const enterSettingsView = () => {
    resetDraftForProvider(settings.activeProvider);
    setDraftConsent(settings.consent);
    setView('settings');
  };

  const handleSave = () => {
    updateProvider(draftProvider, { apiKey: draftApiKey.trim(), model: draftModel.trim(), baseUrl: draftBaseUrl.trim() || undefined });
    setActiveProvider(draftProvider);
    setConsent(draftConsent);
    setView('chat');
  };

  const handleRemove = () => {
    clearProvider(draftProvider);
    setDraftApiKey('');
  };

  const toggleOpen = () => setOpen((wasOpen) => {
    const next = !wasOpen;
    if (next) {
      if (isConfigured && settings.consent) setView('chat');
      else enterSettingsView();
    }
    return next;
  });

  const submitMessage = async () => {
    const text = input.trim();
    if (!text || sending || !activeConfig) return;
    const userMessage: AssistantMessage = { id: crypto.randomUUID(), role: 'user', content: text, at: new Date().toISOString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    try {
      const systemPrompt = `${buildAssistantSystemPrompt(locale)}\n\n${buildProjectContext(project)}`;
      const reply = await sendAssistantMessage({
        providerId: settings.activeProvider,
        config: activeConfig,
        systemPrompt,
        history: nextMessages.slice(-MAX_HISTORY),
      });
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply, at: new Date().toISOString() }]);
    } catch (error) {
      const reason = error instanceof AssistantError ? error.reason : 'network';
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'error', content: t(errorKeyFor(reason)), at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  if (!ready) return null;

  return (
    <>
      <button type="button" className="assistant-fab" onClick={toggleOpen} aria-label={t('assistantOpen')} aria-expanded={open} title="Primi">
        <Sparkles size={20} aria-hidden="true" />
      </button>
      {panel.rendered && (
        <div className="assistant-panel" role="dialog" aria-label="Primi — Assistente PRISMA" data-state={panel.state}>
          <header className="assistant-panel-header">
            <div>
              <strong>Primi</strong>
              <span>{t('assistantTagline')}</span>
            </div>
            <div className="assistant-header-actions">
              <button type="button" className="icon-button" onClick={() => (view === 'settings' ? setView('chat') : enterSettingsView())} aria-label={t('assistantSettings')} title={t('assistantSettings')}>
                <Settings size={16} aria-hidden="true" />
              </button>
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label={t('assistantClose')} title={t('assistantClose')}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </header>

          {view === 'settings' ? (
            <div className="assistant-settings">
              <p className="assistant-disclosure"><AlertTriangle size={13} aria-hidden="true" /> {t('assistantScopeNote')}</p>
              <label>
                {t('assistantProvider')}
                <select value={draftProvider} onChange={(event) => resetDraftForProvider(event.target.value as AssistantProviderId)}>
                  {assistantProviders.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.id === 'custom' ? t('assistantProviderCustom') : provider.label}</option>
                  ))}
                </select>
              </label>

              {draftMeta.needsBaseUrl && (
                <label>
                  {t('assistantBaseUrl')}
                  <input value={draftBaseUrl} onChange={(event) => setDraftBaseUrl(event.target.value)} placeholder="https://your-endpoint/v1" autoComplete="off" />
                </label>
              )}

              <label>
                {t('assistantApiKey')}
                <div className="assistant-key-row">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={draftApiKey}
                    onChange={(event) => setDraftApiKey(event.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="sk-…"
                  />
                  <button type="button" className="icon-button" onClick={() => setShowKey((v) => !v)} aria-label={showKey ? t('assistantClose') : t('assistantApiKey')}>
                    {showKey ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                  </button>
                </div>
                <small>{t('assistantApiKeyHelp')}</small>
              </label>

              <label>
                {t('assistantModel')}
                <input value={draftModel} onChange={(event) => setDraftModel(event.target.value)} placeholder={draftMeta.modelHint} autoComplete="off" />
              </label>

              {draftMeta.keyUrl && (
                <a className="source-link" href={draftMeta.keyUrl} target="_blank" rel="noopener noreferrer">{t('assistantGetKey')} ↗</a>
              )}

              <label className="check-row">
                <input type="checkbox" checked={draftConsent} onChange={(event) => setDraftConsent(event.target.checked)} />
                {t('assistantConsent')}
              </label>

              <div className="assistant-settings-actions">
                <button type="button" className="primary-button" disabled={!canSave} onClick={handleSave}>{t('assistantSaveKey')}</button>
                {settings.providers[draftProvider] && (
                  <button type="button" className="text-button" onClick={handleRemove}>{t('assistantRemoveKey')}</button>
                )}
              </div>
            </div>
          ) : (
            <div className="assistant-chat">
              <div className="assistant-messages" ref={scrollRef}>
                {messages.length === 0 && <p className="assistant-empty">{t('assistantEmptyState')}</p>}
                {messages.map((message) => (
                  <div key={message.id} className={`assistant-message ${message.role}`}>
                    {message.role === 'error' && <AlertTriangle size={13} aria-hidden="true" />}
                    <p>{message.content}</p>
                  </div>
                ))}
                {sending && (
                  <div className="assistant-message assistant thinking">
                    <Loader2 size={14} className="assistant-spin" aria-hidden="true" /> {t('assistantThinking')}
                  </div>
                )}
              </div>
              <form className="assistant-input-row" onSubmit={(event) => { event.preventDefault(); void submitMessage(); }}>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={t('assistantPlaceholder')}
                  rows={2}
                  disabled={sending}
                  maxLength={4000}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submitMessage(); }
                  }}
                />
                <button type="submit" className="icon-button" disabled={sending || !input.trim()} aria-label={t('assistantSend')}>
                  <Send size={16} aria-hidden="true" />
                </button>
              </form>
              <div className="assistant-chat-footer">
                <small>{t('assistantNoHistory')}</small>
                <button type="button" className="text-button" onClick={() => setMessages([])} disabled={!messages.length}>
                  <Trash2 size={12} aria-hidden="true" /> {t('assistantClear')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
