import type { TranslationKey } from '../../i18n/translations';
import type { AssistantProviderId } from './types';

/**
 * Every provider is called directly from the browser, so each endpoint must allow
 * CORS. Z.ai's international endpoint (api.z.ai) does not, which is why GLM is
 * offered through the BigModel endpoint. Model ids change often: defaults are
 * only suggestions and the user can type any id their account serves.
 */
export interface AssistantProviderMeta {
  id: AssistantProviderId;
  label: string;
  protocol: 'openai' | 'anthropic' | 'google';
  /** OpenAI-compatible base URL (the part before /chat/completions). */
  baseUrl?: string;
  defaultModel: string;
  modelHint: string;
  keyUrl: string;
  /** Shows the endpoint field, prefilled with `baseUrl` (regions, local servers, custom endpoints). */
  editableBaseUrl?: boolean;
  keyOptional?: boolean;
  /** OpenAI's reasoning models reject `max_tokens` and custom `temperature`. */
  modernOpenAiParams?: boolean;
  noteKey?: TranslationKey;
}

/** Free OpenRouter model used by default; `openrouter/free` routes to any free model when it is busy. */
export const OPENROUTER_FREE_MODEL = 'google/gemma-4-31b-it:free';
export const OPENROUTER_FREE_ROUTER = 'openrouter/free';
/** Former paid default: treated as "not chosen" when signing in with OpenRouter. */
export const OPENROUTER_PREVIOUS_DEFAULT = 'openai/gpt-6-luna';

/** Free OpenRouter models (`:free` or the free router). */
export const isOpenRouterFreeModel = (model: string) => model.endsWith(':free') || model === OPENROUTER_FREE_ROUTER;

/** A free model falls back to the free router when it is rate-limited or unavailable. */
export const openRouterModels = (model: string) =>
  model.endsWith(':free') ? { models: [model, OPENROUTER_FREE_ROUTER] } : { model };

export const assistantProviders: AssistantProviderMeta[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    protocol: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-6-luna',
    modelHint: 'e.g. gpt-6-luna, gpt-4o-mini',
    keyUrl: 'https://platform.openai.com/api-keys',
    modernOpenAiParams: true,
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    protocol: 'anthropic',
    defaultModel: 'claude-sonnet-5',
    modelHint: 'e.g. claude-sonnet-5, claude-haiku-4-5',
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'google',
    label: 'Google (Gemini)',
    protocol: 'google',
    defaultModel: 'gemini-3.5-flash-lite',
    modelHint: 'e.g. gemini-3.5-flash-lite, gemini-3.8-flash',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    protocol: 'openai',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-flash',
    modelHint: 'e.g. deepseek-flash, deepseek-v4-pro',
    keyUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'zhipu',
    label: 'Zhipu GLM (BigModel)',
    protocol: 'openai',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4.7-flash',
    modelHint: 'e.g. glm-4.7-flash, glm-5.3',
    keyUrl: 'https://bigmodel.cn/usercenter/proj-mgmt/apikeys',
  },
  {
    id: 'qwen',
    label: 'Alibaba Qwen (Model Studio)',
    protocol: 'openai',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-flash',
    modelHint: 'e.g. qwen-flash, qwen-plus',
    keyUrl: 'https://modelstudio.console.alibabacloud.com/model/settings/api-key',
    // The endpoint depends on the region (and workspace) where the key was created.
    editableBaseUrl: true,
  },
  {
    id: 'moonshot',
    label: 'Moonshot (Kimi)',
    protocol: 'openai',
    baseUrl: 'https://api.moonshot.ai/v1',
    defaultModel: 'kimi-k2.6',
    modelHint: 'e.g. kimi-k2.6, kimi-k3',
    keyUrl: 'https://platform.kimi.ai/console/api-keys',
  },
  {
    id: 'minimax',
    label: 'MiniMax',
    protocol: 'openai',
    baseUrl: 'https://api.minimax.io/v1',
    defaultModel: 'MiniMax-M2.7-highspeed',
    modelHint: 'e.g. MiniMax-M2.7-highspeed, MiniMax-M3',
    keyUrl: 'https://platform.minimax.io/user-center/basic-information/interface-key',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    protocol: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    modelHint: 'e.g. mistral-small-latest, mistral-large-latest',
    keyUrl: 'https://console.mistral.ai',
  },
  {
    id: 'xai',
    label: 'xAI (Grok)',
    protocol: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4.3',
    modelHint: 'e.g. grok-4.3, grok-4.7',
    keyUrl: 'https://console.x.ai',
  },
  {
    id: 'groq',
    label: 'Groq',
    protocol: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-20b',
    modelHint: 'e.g. openai/gpt-oss-20b, llama-3.3-70b-versatile',
    keyUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'together',
    label: 'Together AI',
    protocol: 'openai',
    baseUrl: 'https://api.together.ai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    modelHint: 'e.g. openai/gpt-oss-120b, meta-llama/Llama-3.3-70B-Instruct-Turbo',
    keyUrl: 'https://api.together.ai/settings/projects/~current/api-keys',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    protocol: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    // Free by default: sign-in users start without paying (free models have daily limits).
    defaultModel: OPENROUTER_FREE_MODEL,
    modelHint: 'e.g. google/gemma-4-31b-it:free, openrouter/free, deepseek/deepseek-v4-pro',
    keyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    protocol: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: '',
    modelHint: 'a model you have pulled, e.g. qwen3, llama3.2',
    keyUrl: '',
    editableBaseUrl: true,
    keyOptional: true,
    noteKey: 'assistantLocalHint',
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    protocol: 'openai',
    defaultModel: '',
    modelHint: 'exact model id served by your endpoint',
    keyUrl: '',
    editableBaseUrl: true,
  },
];

export const assistantProviderMeta = (id: AssistantProviderId): AssistantProviderMeta =>
  assistantProviders.find((provider) => provider.id === id) ?? assistantProviders[0];

/** Endpoint in use: the user's override when the provider allows one, else the default. */
export const resolveBaseUrl = (meta: AssistantProviderMeta, override?: string) =>
  (meta.editableBaseUrl && override?.trim()) || meta.baseUrl || '';

export const isProviderConfigured = (meta: AssistantProviderMeta, config?: { apiKey: string; model: string; baseUrl?: string }) =>
  !!config && (meta.keyOptional || !!config.apiKey.trim()) && !!config.model.trim() && (meta.protocol !== 'openai' || !!resolveBaseUrl(meta, config.baseUrl));
