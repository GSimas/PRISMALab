import type { FillProposal, ProposalChange } from './proposals';

export type AssistantProviderId =
  | 'openai' | 'anthropic' | 'google' | 'deepseek' | 'zhipu' | 'qwen' | 'moonshot' | 'minimax'
  | 'mistral' | 'xai' | 'groq' | 'together' | 'openrouter' | 'ollama' | 'custom';

export interface AssistantProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  /** The key came from "Sign in with OpenRouter" rather than being pasted by the user. */
  oauth?: boolean;
}

export interface AssistantSettings {
  consent: boolean;
  activeProvider: AssistantProviderId;
  providers: Partial<Record<AssistantProviderId, AssistantProviderConfig>>;
}

export type AssistantRole = 'user' | 'assistant' | 'error';
export type ProposalStatus = 'pending' | 'applied' | 'discarded';

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  at: string;
  /** Assistant reply exactly as the provider returned it, proposal block included. */
  raw?: string;
  /** Field update proposed by Primi, awaiting the user's confirmation. */
  proposal?: FillProposal;
  proposalStatus?: ProposalStatus;
  /** Snapshot of what was changed, kept for display after applying. */
  appliedChanges?: ProposalChange[];
  /** Primi tried to propose an update but the block was malformed. */
  proposalInvalid?: boolean;
}

export type AssistantErrorReason = 'missing-key' | 'network' | 'http' | 'empty-response' | 'free-model';

export class AssistantError extends Error {
  reason: AssistantErrorReason;
  constructor(reason: AssistantErrorReason, message: string) {
    super(message);
    this.reason = reason;
  }
}
