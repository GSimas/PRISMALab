'use client';

import { ArrowRight, Check, WandSparkles, X } from 'lucide-react';
import { useApp } from '../../app/AppProviders';
import type { PrismaProject } from '../../domain/types';
import { fieldLabels } from '../../i18n/translations';
import { renderInline } from './Markdown';
import { planProposal, type ProposalChange } from './proposals';
import type { AssistantMessage } from './types';

interface Props {
  message: AssistantMessage;
  project: PrismaProject;
  canApply: boolean;
  onApply: () => void;
  onDiscard: () => void;
}

/** Shows a Primi field-update proposal as a diff the user must confirm. */
export function ProposalCard({ message, project, canApply, onApply, onDiscard }: Props) {
  const { locale, t } = useApp();
  if (!message.proposal) return null;

  const labels = fieldLabels[locale] || fieldLabels['pt-BR'];
  const pending = (message.proposalStatus ?? 'pending') === 'pending';
  // Pending proposals are diffed live against the project; applied ones keep their snapshot.
  const plan = pending ? planProposal(project, message.proposal) : null;
  const changes = plan?.changes ?? message.appliedChanges ?? [];

  const label = (change: ProposalChange) => {
    switch (change.field) {
      case 'count': return labels[change.key];
      case 'title': return t('title');
      case 'reviewKind': return t('assistantFieldReviewKind');
      case 'otherSources': return t('otherSources');
      case 'databaseSources': return t('specificDatabases');
      case 'exclusionReasons': return t('exclusionReasons');
      case 'otherExclusionReasons': return t('exclusionReasonsOther');
    }
  };
  const value = (change: ProposalChange, side: 'from' | 'to') => {
    const raw = change[side];
    if (change.field === 'reviewKind') return raw === 'updated' ? t('updatedReview') : t('newReview');
    if (typeof raw === 'boolean') return raw ? t('yes') : t('no');
    return raw === null || raw === '' ? '—' : String(raw);
  };

  return (
    <section className="assistant-proposal" data-status={message.proposalStatus ?? 'pending'} aria-label={t('assistantProposalTitle')}>
      <strong><WandSparkles size={14} aria-hidden="true" /> {t('assistantProposalTitle')}</strong>
      {message.proposal.summary && <p>{renderInline(message.proposal.summary)}</p>}
      {changes.length > 0 ? (
        <ul>
          {changes.map((change) => (
            <li key={change.field === 'count' ? change.key : change.field}>
              <span>{label(change)}</span>
              <span className="assistant-proposal-diff">
                <del>{value(change, 'from')}</del>
                <ArrowRight size={12} aria-hidden="true" />
                <ins>{value(change, 'to')}</ins>
              </span>
            </li>
          ))}
        </ul>
      ) : pending && <p>{t('assistantProposalNoChanges')}</p>}
      {plan && plan.ignored.length > 0 && (
        <small>{t('assistantProposalIgnored')} {plan.ignored.map((key) => labels[key]).join(', ')}</small>
      )}
      {pending ? (
        <div className="assistant-proposal-actions">
          {canApply && changes.length > 0 && (
            <button type="button" className="primary-button small" onClick={onApply}><Check size={14} aria-hidden="true" /> {t('assistantApply')}</button>
          )}
          <button type="button" className="text-button" onClick={onDiscard}><X size={12} aria-hidden="true" /> {t('assistantDiscard')}</button>
          {!canApply && changes.length > 0 && <small>{t('assistantApplyInBuilder')}</small>}
        </div>
      ) : (
        <small className="assistant-proposal-status">{message.proposalStatus === 'applied' ? t('assistantApplied') : t('assistantDiscarded')}</small>
      )}
    </section>
  );
}
