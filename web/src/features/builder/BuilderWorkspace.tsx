'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { ArrowRight, ChevronDown, Circle, CircleCheck, CircleDashed, Coffee, Compass, Ellipsis, FileCheck2, Focus, HelpCircle, Info, Maximize2, PanelLeftClose, PanelLeftOpen, Redo2, Settings2, Sparkles, SquareFunction, Table2, Trash2, TriangleAlert, Undo2, Upload, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useApp } from '../../app/AppProviders';
import { useProjectStore } from '../../app/store';
import { usePresence } from '../../app/usePresence';
import { calculateProject, emptyCounts, hasOtherSources, isUpdatedModel, selectModel } from '../../domain/calculations';
import { createExampleChecklist, createChecklist } from '../../domain/checklist';
import { bandProgress, completenessFor, type CompletenessStageId, type StageStatus } from '../../domain/completeness';
import { createProject } from '../../domain/project';
import { countKeys, type CalculatedCounts, type CountKey, type NodeProvenance, type PrismaProject, type SourceItem, type ValidationIssue } from '../../domain/types';
import { validateProject } from '../../domain/validation';
import { fieldDefinitions, fieldLabels, type TranslationKey } from '../../i18n/translations';
import { getProject, saveProject } from '../../storage/db';
import { PrismaDiagram, type DiagramStage } from './PrismaDiagram';
import { ChecklistPanel } from '../checklist/ChecklistPanel';
import { ExportPanel } from '../export/ExportPanel';
import { ImportWizard } from '../import/ImportWizard';
import { GuidedTour } from '../tour/GuidedTour';
import { tourSteps, type BuilderTab, type TourStep } from '../tour/steps';

/** Opens or closes the Primi panel (listened to by PrismaAssistant). */
const setAssistantOpen = (open: boolean) => window.dispatchEvent(new CustomEvent('prisma:assistant', { detail: { open } }));

const fieldSections: { titleKey: TranslationKey; slug: string; stage: CompletenessStageId; fields: CountKey[] }[] = [
  { titleKey: 'sectionPrevious', slug: 'previous', stage: 'previous', fields: ['previousStudies', 'previousReports'] },
  { titleKey: 'sectionIdentification', slug: 'identification', stage: 'identification', fields: ['databases'] },
  { titleKey: 'sectionRemoved', slug: 'removed', stage: 'removed', fields: ['duplicates', 'automationExcluded', 'removedOther'] },
  { titleKey: 'sectionScreening', slug: 'screening', stage: 'screening', fields: ['screened', 'recordsExcluded', 'reportsSought', 'reportsNotRetrieved'] },
  { titleKey: 'sectionEligibility', slug: 'eligibility', stage: 'eligibility', fields: ['reportsAssessed', 'reportsExcluded'] },
  { titleKey: 'sectionOtherMethods', slug: 'other-methods', stage: 'other-methods', fields: ['otherReportsSought', 'otherReportsNotRetrieved', 'otherReportsAssessed', 'otherReportsExcluded'] },
  { titleKey: 'sectionInclusion', slug: 'sectionInclusion', stage: 'inclusion', fields: ['newStudies', 'newReports', 'totalStudies', 'totalReports'] },
];

const stageStatusKey: Record<StageStatus, TranslationKey> = {
  complete: 'stageStatusComplete',
  'in-progress': 'stageStatusInProgress',
  pending: 'stageStatusPending',
  attention: 'stageStatusAttention',
};

const originKey: Record<CalculatedCounts['origins'][CountKey], TranslationKey> = {
  informed: 'informed',
  derived: 'derived',
  override: 'override',
  'not-applicable': 'notApplicable',
};

const issueStatusKey: Record<ValidationIssue['status'], TranslationKey> = {
  valid: 'statusValid',
  attention: 'statusAttention',
  inconsistency: 'statusInconsistency',
  missing: 'statusMissing',
  'not-applicable': 'notApplicable',
};

const stageIcons: Record<StageStatus, ReactNode> = {
  complete: <CircleCheck size={15} aria-hidden="true" />,
  'in-progress': <CircleDashed size={15} aria-hidden="true" />,
  pending: <Circle size={15} aria-hidden="true" />,
  attention: <TriangleAlert size={15} aria-hidden="true" />,
};

const optionalFields: CountKey[] = ['automationExcluded', 'removedOther'];

type Panels = { data: boolean };
const PANELS_KEY = 'prisma-builder-panels';
/** What the right-hand drawer shows; null when it is closed. */
type InspectorView = 'details' | 'validation';
/** Below this width the drawer overlays the canvas instead of taking a column. */
const OVERLAY_QUERY = '(max-width: 1180px)';

/** Form section that each stage band of the diagram leads to. */
const bandSection: Record<DiagramStage, string> = { identification: 'identification', screening: 'screening', included: 'sectionInclusion' };

// Multiplicative steps feel even at every scale: 82% → 103% → 128% → … → 400%.
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.25;

export function BuilderWorkspace() {
  const { ready, locale, t } = useApp();
  const { project, past, future, setProject, patchProject, updateCount, updateProject, undo, redo } = useProjectStore();
  const [selected, setSelected] = useState<CountKey>('databases');
  const [tab, setTab] = useState<BuilderTab>('data');
  const [touring, setTouring] = useState(false);
  const [zoom, setZoom] = useState(0.82);
  const [saveState, setSaveState] = useState<'saving' | 'saved'>('saved');
  const [confirmClear, setConfirmClear] = useState(false);
  // Whether the data panel is collapsed; a per-browser preference.
  const [collapsed, setCollapsed] = useState<Panels>({ data: false });
  const [inspector, setInspector] = useState<InspectorView | null>(null);
  const inspectorTrigger = useRef<HTMLElement | null>(null);
  const clearModal = usePresence(confirmClear);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const tableRef = useRef<HTMLDetailsElement>(null);
  const flashTimeoutRef = useRef<number | undefined>(undefined);

  const labels = fieldLabels[locale] || fieldLabels['pt-BR'];
  const definitions = fieldDefinitions[locale] || fieldDefinitions['pt-BR'];

  const calculated = useMemo(() => calculateProject(project), [project]);
  const issues = useMemo(() => validateProject(project, locale), [project, locale]);
  const completeness = useMemo(() => completenessFor(project, issues), [project, issues]);
  const stagesDone = completeness.stages.filter((stage) => stage.status === 'complete').length;
  const stageTitle = (id: CompletenessStageId) => t(fieldSections.find((section) => section.stage === id)!.titleKey);
  // Announces finished stages to screen readers and plays the "complete" cue once per transition.
  const [progressMessage, setProgressMessage] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const previousProgress = useRef<{ id: string; statuses: Map<CompletenessStageId, StageStatus>; complete: boolean } | null>(null);

  const setPanels = (next: Panels) => {
    setCollapsed(next);
    localStorage.setItem(PANELS_KEY, JSON.stringify(next));
  };
  const toggleDataPanel = () => setPanels({ data: !collapsed.data });
  // The tour walks through the data panel, so it always shows it.
  const dataCollapsed = collapsed.data && !touring;

  /** Opens the drawer on a view; `focus` moves keyboard focus into it (explicit opens only). */
  const openInspector = (view: InspectorView, focus = false) => {
    if (tab !== 'data') flushSync(() => setTab('data'));
    if (focus && document.activeElement instanceof HTMLElement) inspectorTrigger.current = document.activeElement;
    flushSync(() => setInspector(view));
    if (focus) document.getElementById('inspector-title')?.focus();
  };
  const closeInspector = () => {
    setInspector(null);
    const trigger = inspectorTrigger.current;
    inspectorTrigger.current = null;
    if (trigger?.isConnected) trigger.focus();
  };

  const focusById = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Expand the collapsed data panel synchronously so the target can be scrolled to.
    if (el.closest('[data-panel="data"]') && collapsed.data) flushSync(() => setPanels({ data: false }));
    const details = el.closest('details');
    if (details && !(details as HTMLDetailsElement).open) (details as HTMLDetailsElement).open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('field-flash');
    void el.offsetWidth;
    el.classList.add('field-flash');
    window.clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = window.setTimeout(() => el.classList.remove('field-flash'), 1600);
  };

  const focusField = (field: CountKey, nodeId?: string) => {
    setSelected(field);
    if (field === 'websites' || nodeId === 'identified-other' || field === 'organisations' || field === 'citationSearching' || field === 'otherSources') {
      focusById('block-other-sources');
      return;
    }
    if (field === 'databases' || nodeId === 'identified-main') {
      focusById('field-databases');
      return;
    }
    focusById(`field-${field}`);
  };

  const handleIssueClick = (item: ValidationIssue) => {
    // An overlaying drawer would hide the field it points to.
    if (window.matchMedia(OVERLAY_QUERY).matches) setInspector(null);
    if (item.location === 'project') { focusById('project-title-field'); return; }
    if (item.location === 'model') { focusById('model-fieldset'); return; }
    focusField(item.location);
  };

  const focusStage = (stage: DiagramStage) => focusById(`section-${bandSection[stage]}`);

  /** A click on a diagram box selects its field and shows its details. */
  const selectNode = (field: CountKey, nodeId?: string) => {
    focusField(field, nodeId);
    openInspector('details');
  };

  /** Jumps to a field from anywhere in the builder, switching back to the data tab first. */
  const goToField = (field: CountKey) => {
    if (tab !== 'data') flushSync(() => setTab('data'));
    focusField(field);
  };

  const reviewFirstAlert = () => {
    const first = issues.find((item) => item.status === 'inconsistency');
    if (!first) return;
    if (tab !== 'data') flushSync(() => setTab('data'));
    handleIssueClick(first);
  };

  useEffect(() => {
    const statuses = new Map(completeness.stages.map((stage) => [stage.id, stage.status]));
    const before = previousProgress.current;
    previousProgress.current = { id: project.id, statuses, complete: completeness.complete };
    // A newly loaded project is a baseline, not progress.
    if (!before || before.id !== project.id) return;
    const finished = completeness.stages.filter((stage) => stage.status === 'complete' && before.statuses.get(stage.id) !== 'complete');
    const justCompleted = completeness.complete && !before.complete;
    if (!finished.length && !justCompleted) return;
    const message = justCompleted ? t('diagramComplete') : `${t('stageCompleted')}: ${finished.map((stage) => stageTitle(stage.id)).join(', ')}`;
    const announce = window.setTimeout(() => { setProgressMessage(message); if (justCompleted) setCelebrate(true); }, 0);
    const settle = justCompleted ? window.setTimeout(() => setCelebrate(false), 1600) : undefined;
    return () => { window.clearTimeout(announce); window.clearTimeout(settle); };
  }, [completeness, project.id]); // eslint-disable-line react-hooks/exhaustive-deps -- t/stageTitle only format the message

  // The "more actions" menu closes on Escape, on a click outside it, and after any action.
  const closeMenu = () => { if (menuRef.current) menuRef.current.open = false; };
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => { if (menuRef.current?.open && !menuRef.current.contains(event.target as Node)) closeMenu(); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !menuRef.current?.open) return;
      closeMenu();
      menuRef.current.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, []);
  const menuAction = (action: () => void) => () => { closeMenu(); action(); };

  const goToModel = () => {
    if (tab !== 'data') flushSync(() => setTab('data'));
    focusById('model-fieldset');
  };

  const openValidation = () => openInspector('validation', true);

  const toggleTable = () => {
    const details = tableRef.current;
    if (!details) return;
    details.open = !details.open;
    if (details.open) details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const alertCount = issues.filter((item) => item.status !== 'valid').length;
  const modelLabel = `${project.reviewKind === 'updated' ? t('updatedReview') : t('newReview')} · ${hasOtherSources(project.model) ? t('modelWithOther') : t('modelDatabasesOnly')}`;
  const nextLabel = completeness.next ? (completeness.next.field === 'websites' ? t('sectionOtherMethods') : labels[completeness.next.field]) : '';
  const allFilled = completeness.filled === completeness.total;

  // When a project is opened, unfold the step that needs input next.
  const nextSlug = fieldSections.find((section) => section.stage === completeness.next?.stage)?.slug;
  useEffect(() => {
    if (!nextSlug) return;
    const open = window.setTimeout(() => document.getElementById(`section-${nextSlug}`)?.setAttribute('open', ''), 0);
    return () => window.clearTimeout(open);
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps -- only when another project is loaded

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('project') ?? localStorage.getItem('prisma-last-project');
    if (id) getProject(id).then((saved) => saved && setProject(saved));
  }, [setProject]);

  useEffect(() => {
    const load = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(PANELS_KEY) ?? 'null') as Partial<Panels> | null;
        if (saved) setCollapsed({ data: saved.data === true });
      } catch { /* ignore a malformed preference */ }
    }, 0);
    return () => window.clearTimeout(load);
  }, []);

  // `?tour=1` (the landing page link) starts the guided tour once.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tour') !== '1') return;
    url.searchParams.delete('tour');
    window.history.replaceState(null, '', url);
    const start = window.setTimeout(() => setTouring(true), 0);
    return () => window.clearTimeout(start);
  }, []);

  const prepareTourStep = (step: TourStep) => {
    if (step.tab) setTab(step.tab);
    if (step.assistant) setAssistantOpen(step.assistant === 'open');
    if (step.inspector) setInspector(step.inspector === 'closed' ? null : step.inspector);
    if (step.open) document.querySelector<HTMLDetailsElement>(step.open)?.setAttribute('open', '');
  };

  const closeTour = (completed: boolean) => {
    setTouring(false);
    setAssistantOpen(false);
    if (completed) localStorage.setItem('prisma-tour-completed', '1');
  };

  useEffect(() => {
    const saving = window.setTimeout(() => setSaveState('saving'), 0);
    const save = window.setTimeout(() => saveProject({ ...project, locale }).then(() => {
      localStorage.setItem('prisma-last-project', project.id);
      setSaveState('saved');
    }), 500);
    return () => { window.clearTimeout(saving); window.clearTimeout(save); };
  }, [project, locale]);

  const applicable = (field: CountKey) => {
    if (['previousStudies', 'previousReports'].includes(field)) return isUpdatedModel(project.model);
    if (['websites', 'organisations', 'citationSearching', 'otherSources', 'otherReportsSought', 'otherReportsNotRetrieved', 'otherReportsAssessed', 'otherReportsExcluded'].includes(field)) return hasOtherSources(project.model);
    return true;
  };

  const clearAll = () => patchProject({
    counts: emptyCounts(),
    overrides: {},
    exclusionReasons: [],
    otherExclusionReasons: [],
    sources: [],
    provenance: {},
    checklist: createChecklist(),
  }, 'Dados do projeto limpos');

  const loadExample = () => {
    const example = createProject({ title: project.title, locale, model: 'updated-databases-other', example: true });
    patchProject({ ...example, id: project.id, createdAt: project.createdAt, checklist: createExampleChecklist() }, 'Exemplo carregado');
  };

  const setOtherSources = (enabled: boolean) => patchProject({ model: selectModel(project.reviewKind, enabled) }, 'Modelo alterado');
  const setReviewKind = (kind: PrismaProject['reviewKind']) => patchProject({ reviewKind: kind, model: selectModel(kind, hasOtherSources(project.model)) }, 'Tipo de revisão alterado');
  const selectedOrigin = calculated.origins[selected];
  const selectedOverride = project.overrides[selected];
  const selectedProvenance: NodeProvenance = project.provenance[selected] ?? { note: '', responsible: '', date: '', url: '', repositoryRef: '' };

  const patchProvenance = (patch: Partial<NodeProvenance>) => patchProject({
    provenance: { ...project.provenance, [selected]: { ...selectedProvenance, ...patch } },
  }, `Proveniência de ${selected} atualizada`);

  const toggleOverride = () => {
    if (selectedOverride) {
      const next = { ...project.overrides };
      delete next[selected];
      patchProject({ overrides: next }, 'Sobrescrição manual removida');
    } else {
      patchProject({ overrides: { ...project.overrides, [selected]: { value: calculated.values[selected] ?? 0, justification: '', updatedAt: new Date().toISOString() } } }, 'Valor derivado desbloqueado');
    }
  };

  const databaseSources = (project.sources || []).filter((s) => s.type === 'database');
  const popularDatabases = ['Web of Science', 'Scopus', 'PubMed', 'Embase', 'SciELO', 'Cochrane Library', 'Google Scholar'];

  const addDatabaseSource = (name = '') => {
    const newSource: SourceItem = {
      id: crypto.randomUUID(),
      type: 'database',
      name,
      count: 0,
    };
    const nextSources = [...(project.sources || []), newSource];
    patchProject({ sources: nextSources }, 'Base de dados adicionada');
  };

  const updateDatabaseSource = (id: string, patch: Partial<SourceItem>) => {
    const nextSources = (project.sources || []).map((s) => (s.id === id ? { ...s, ...patch } : s));
    patchProject({ sources: nextSources }, 'Base de dados atualizada');
  };

  const removeDatabaseSource = (id: string) => {
    const nextSources = (project.sources || []).filter((s) => s.id !== id);
    patchProject({ sources: nextSources }, 'Base de dados removida');
  };

  const otherSourcesList = (project.sources || []).filter((s) => s.type !== 'database');

  const addOtherSource = (type: SourceItem['type'] = 'other', defaultName = '') => {
    let name = defaultName;
    if (!name) {
      if (type === 'website') name = t('addWebsite');
      else if (type === 'organisation') name = t('addOrganisation');
      else if (type === 'citation') name = t('addCitation');
      else name = '';
    }
    const newSource: SourceItem = {
      id: crypto.randomUUID(),
      type,
      name,
      count: 0,
    };
    const nextSources = [...(project.sources || []), newSource];
    patchProject({ sources: nextSources }, 'Fonte adicionada');
  };

  const updateOtherSource = (id: string, patch: Partial<SourceItem>) => {
    const nextSources = (project.sources || []).map((s) => (s.id === id ? { ...s, ...patch } : s));
    patchProject({ sources: nextSources }, 'Fonte atualizada');
  };

  const removeOtherSource = (id: string) => {
    const nextSources = (project.sources || []).filter((s) => s.id !== id);
    patchProject({ sources: nextSources }, 'Fonte removida');
  };

  const renderOtherSourcesBlock = (blockId = 'block-other-sources') => {
    if (!hasOtherSources(project.model)) return null;
    const totalOther = otherSourcesList.reduce((acc, s) => acc + (s.count || 0), 0);

    return (
      <div id={blockId} className="database-sources-block other-sources-block">
        <div className="database-sources-header">
          <h3>{t('otherMethodsSources')}</h3>
          {otherSourcesList.length > 0 && (
            <span className="database-count-badge">
              {t('totalFromOtherSources')}: {totalOther}
            </span>
          )}
        </div>

        <div className="database-chips-container">
          <span className="chips-label">{t('quickSuggestions')}</span>
          <div className="database-chips">
            <button
              type="button"
              className="database-chip"
              onClick={() => addOtherSource('website', t('addWebsite'))}
              title={`+ ${t('addWebsite')}`}
            >
              + {t('addWebsite')}
            </button>
            <button
              type="button"
              className="database-chip"
              onClick={() => addOtherSource('organisation', t('addOrganisation'))}
              title={`+ ${t('addOrganisation')}`}
            >
              + {t('addOrganisation')}
            </button>
            <button
              type="button"
              className="database-chip"
              onClick={() => addOtherSource('citation', t('addCitation'))}
              title={`+ ${t('addCitation')}`}
            >
              + {t('addCitation')}
            </button>
            <button
              type="button"
              className="database-chip"
              onClick={() => addOtherSource('other', '')}
              title={`+ ${t('addCustomSource')}`}
            >
              + {t('addCustomSource')}
            </button>
          </div>
        </div>

        {otherSourcesList.length > 0 && (
          <div className="database-items-list">
            {otherSourcesList.map((source) => (
              <div key={source.id} className="database-item-row">
                <input
                  aria-label={t('sourceNamePlaceholder')}
                  placeholder={t('sourceNamePlaceholder')}
                  value={source.name}
                  onChange={(event) => updateOtherSource(source.id, { name: event.target.value })}
                />
                <input
                  aria-label={t('count')}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={source.count === 0 ? '' : source.count}
                  onChange={(event) => updateOtherSource(source.id, { count: event.target.value === '' ? 0 : Math.max(0, Number(event.target.value)) })}
                />
                <button
                  type="button"
                  className="remove-btn"
                  aria-label={t('removeSource')}
                  title={t('removeSource')}
                  onClick={() => removeOtherSource(source.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    );
  };

  const visibleSections = fieldSections.filter((section) => section.fields.some(applicable));
  const sectionAfter = (slug: string) => {
    if (slug === 'setup') return visibleSections[0];
    const index = visibleSections.findIndex((section) => section.slug === slug);
    return visibleSections[index + 1];
  };

  /** "Continue: <next step>" once a step is done; opening the next one closes this one. */
  const renderContinue = (slug: string) => {
    const next = sectionAfter(slug);
    if (!next) return null;
    return (
      <button type="button" className="continue-button" onClick={() => focusById(`section-${next.slug}`)}>
        {t('continueTo')}: {t(next.titleKey)} <ArrowRight size={13} aria-hidden="true" />
      </button>
    );
  };

  const renderReasons = (key: 'exclusionReasons' | 'otherExclusionReasons', totalField: CountKey, titleKey: TranslationKey) => {
    const reasons = project[key];
    const sum = reasons.reduce((acc, reason) => acc + reason.count, 0);
    const total = calculated.values[totalField] ?? 0;
    const matches = sum === total;
    const patchReasons = (next: typeof reasons) => patchProject({ [key]: next });
    return (
      <section className="reasons-editor" aria-labelledby={`${key}-title`}>
        <div className="reasons-header">
          <h3 id={`${key}-title`}>{t(titleKey)}</h3>
          {reasons.length > 0 && (
            <span className={`reasons-sum${matches ? ' ok' : ' off'}`} title={t('reasonsSum')} aria-label={`${t('reasonsSum')}: ${sum} / ${total}`}>
              Σ {sum} / {total} {matches ? <CircleCheck size={13} aria-hidden="true" /> : <TriangleAlert size={13} aria-hidden="true" />}
            </span>
          )}
        </div>
        {reasons.map((reason) => (
          <div className="reason-row" key={reason.id}>
            <input aria-label={t('reason')} placeholder={t('reason')} value={reason.label} onChange={(event) => patchReasons(reasons.map((item) => item.id === reason.id ? { ...item, label: event.target.value } : item))} />
            <input aria-label={t('count')} type="number" min="0" value={reason.count} onChange={(event) => patchReasons(reasons.map((item) => item.id === reason.id ? { ...item, count: Number(event.target.value) } : item))} />
            <button type="button" aria-label={t('removeReason')} title={t('removeReason')} onClick={() => patchReasons(reasons.filter((item) => item.id !== reason.id))}>×</button>
          </div>
        ))}
        <button className="text-button" type="button" onClick={() => patchReasons([...reasons, { id: crypto.randomUUID(), label: '', count: 0 }])}>+ {t('addReason')}</button>
      </section>
    );
  };

  return (
    <main id="main-content" className="builder-page" data-app-ready={ready ? 'true' : 'false'} aria-busy={!ready}>
      <header className="builder-bar">
        <div className="builder-bar-project">
          <h1 className="sr-only">{project.title.trim() || t('title')}</h1>
          <input id="project-title-field" className="project-title-input" aria-label={t('title')} value={project.title} onChange={(event) => patchProject({ title: event.target.value }, 'Título alterado')} />
          <div className="builder-bar-meta">
            <button type="button" className="model-chip" onClick={goToModel} disabled={!ready} title={t('changeModel')} aria-label={`${t('flowType')}: ${modelLabel}. ${t('changeModel')}`}>
              {modelLabel} <ChevronDown size={13} aria-hidden="true" />
            </button>
            <span className="save-indicator" role="status" aria-live="polite"><span className={saveState} />{saveState === 'saving' ? t('saving') : t('saved')}</span>
          </div>
        </div>

        <div className="builder-tabs" role="tablist" aria-label="Módulos do construtor">
          <button role="tab" disabled={!ready} aria-selected={tab === 'data'} onClick={() => setTab('data')}>{t('diagramTab')}</button>
          <button role="tab" disabled={!ready} aria-selected={tab === 'checklist'} onClick={() => setTab('checklist')}>{t('checklist')}</button>
          <button role="tab" disabled={!ready} aria-selected={tab === 'export'} onClick={() => setTab('export')}>{t('export')}</button>
        </div>

        <div className="builder-bar-tools">
            <div className={`builder-progress${completeness.complete ? ' is-complete' : ''}${celebrate ? ' celebrate' : ''}`}>
              <div
                className="completeness-ring"
                role="progressbar"
                aria-label={t('completenessLabel')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completeness.percent}
                aria-valuetext={`${completeness.percent}% · ${stagesDone}/${completeness.stages.length} ${t('stagesLabel')}`}
              >
                <svg viewBox="0 0 36 36" aria-hidden="true">
                  <circle className="completeness-track" cx="18" cy="18" r="15" />
                  <circle className="completeness-bar" cx="18" cy="18" r="15" pathLength={100} strokeDasharray={`${completeness.percent} 100`} />
                </svg>
                <span aria-hidden="true">{completeness.complete ? <CircleCheck size={16} /> : `${completeness.percent}%`}</span>
              </div>
              <div className="progress-copy">
                <strong>{completeness.complete ? t('diagramComplete') : allFilled ? t('reviewAlerts') : `${stagesDone}/${completeness.stages.length} ${t('stagesLabel')}`}</strong>
                {completeness.next ? (
                  <button type="button" className="progress-action" disabled={!ready} onClick={() => goToField(completeness.next!.field)} title={`${t('nextStep')}: ${nextLabel}`}><span>{t('nextStep')}: {nextLabel}</span> <ArrowRight size={13} aria-hidden="true" /></button>
                ) : completeness.complete ? (
                  <button type="button" className="progress-action" disabled={!ready} onClick={() => setTab('export')}>{t('export')} <ArrowRight size={13} aria-hidden="true" /></button>
                ) : (
                  <button type="button" className="progress-action" disabled={!ready} onClick={() => { reviewFirstAlert(); openInspector('validation'); }}>{t('validation')} <ArrowRight size={13} aria-hidden="true" /></button>
                )}
              </div>
              <div className="sr-only" role="status" aria-live="polite">{progressMessage}</div>
            </div>
            <button type="button" className={`alerts-chip${alertCount ? '' : ' clear'}`} disabled={!ready} onClick={openValidation} title={t('validation')} aria-label={`${t('validation')}: ${alertCount ? `${alertCount} ${t('alerts')}` : t('noAlerts')}`}>
              {alertCount ? <TriangleAlert size={14} aria-hidden="true" /> : <CircleCheck size={14} aria-hidden="true" />}<span aria-hidden="true">{alertCount}</span>
            </button>
            <span className="toolbar-divider" aria-hidden="true" />
            <button type="button" className="icon-tool" onClick={undo} disabled={!past.length} title={t('undo')} aria-label={t('undo')}><Undo2 size={17} aria-hidden="true" /></button>
            <button type="button" className="icon-tool" onClick={redo} disabled={!future.length} title={t('redo')} aria-label={t('redo')}><Redo2 size={17} aria-hidden="true" /></button>
            <details className="builder-menu" ref={menuRef}>
              <summary className="icon-tool" title={t('moreActions')} aria-label={t('moreActions')}><Ellipsis size={18} aria-hidden="true" /></summary>
              <div className="builder-menu-panel">
                <button type="button" disabled={!ready} onClick={menuAction(() => setTab('import'))}><Upload size={16} aria-hidden="true" />{t('import')}</button>
                <button type="button" onClick={menuAction(loadExample)}><Sparkles size={16} aria-hidden="true" />{t('example')}</button>
                <button type="button" onClick={menuAction(() => window.print())}><FileCheck2 size={16} aria-hidden="true" />{t('printPreview')}</button>
                <button type="button" disabled={!ready} onClick={menuAction(() => setTouring(true))}><Compass size={16} aria-hidden="true" />{t('tourStart')}</button>
                <a href="/learn" onClick={closeMenu}><HelpCircle size={16} aria-hidden="true" />{t('help')}</a>
                <a href="https://link.mercadopago.com.br/strangerhits" target="_blank" rel="noopener noreferrer" onClick={closeMenu}><Coffee size={16} aria-hidden="true" />{t('coffee')}</a>
                <hr />
                <button type="button" className="danger" onClick={menuAction(() => setConfirmClear(true))}><Trash2 size={16} aria-hidden="true" />{t('clearAll')}</button>
              </div>
            </details>
          </div>
        </header>

      {tab === 'checklist' && <div className="single-module"><ChecklistPanel project={project} onChange={(next) => updateProject(next, 'Checklist atualizado')} /></div>}
      {tab === 'export' && <div className="single-module"><ExportPanel project={project} locale={locale} /></div>}
      {tab === 'import' && <div className="single-module"><ImportWizard onImport={(next) => { setProject(next); setTab('data'); }} /></div>}

      {tab === 'data' && (
        <div className={`builder-workspace${dataCollapsed ? ' data-collapsed' : ''}${inspector ? ' inspector-open' : ''}`} ref={workspaceRef}>
          <aside className="data-panel" data-panel="data" data-collapsed={dataCollapsed || undefined} aria-label="Preenchimento do diagrama">
            <button type="button" className="panel-toggle" aria-expanded={!dataCollapsed} aria-label={`${dataCollapsed ? t('expandPanel') : t('collapsePanel')}: ${t('data')}`} title={dataCollapsed ? t('expandPanel') : t('collapsePanel')} onClick={toggleDataPanel}>
              {dataCollapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
              <span>{t('data')}</span>
            </button>
            <h2 className="sr-only">{t('data')}</h2>
            {/* One step open at a time (exclusive accordion via the shared name). */}
            <details className="form-section setup-section" id="section-setup" name="builder-steps">
              <summary>
                <span className="stage-status"><Settings2 size={15} aria-hidden="true" /></span>
                <span className="stage-title">{t('projectSetup')}</span>
              </summary>
              <div className="project-setup">
                <fieldset id="model-fieldset"><legend>{t('flowType')}</legend>
                  <label className="check-row"><input type="radio" name="review-kind" checked={project.reviewKind === 'new'} onChange={() => setReviewKind('new')} /> {t('newReview')}</label>
                  <label className="check-row"><input type="radio" name="review-kind" checked={project.reviewKind === 'updated'} onChange={() => setReviewKind('updated')} /> {t('updatedReview')}</label>
                  <label className="check-row"><input type="checkbox" checked={hasOtherSources(project.model)} onChange={(event) => setOtherSources(event.target.checked)} /> {t('otherSources')}</label>
                </fieldset>
                <details className="project-details">
                  <summary>{t('projectDetails')}</summary>
                  <div>
                    <label>{t('authors')}<input value={project.authors.join('; ')} onChange={(event) => patchProject({ authors: event.target.value.split(';').map((value) => value.trim()).filter(Boolean) })} placeholder={t('authorsPlaceholder')} /></label>
                    <label>{t('institution')}<input value={project.institution} onChange={(event) => patchProject({ institution: event.target.value })} /></label>
                    <label>{t('protocol')}<input type="url" value={project.protocolUrl} onChange={(event) => patchProject({ protocolUrl: event.target.value })} /></label>
                  </div>
                </details>
                {renderContinue('setup')}
              </div>
            </details>
            {visibleSections.map((section) => {
              const fields = section.fields.filter(applicable);
              const stage = completeness.stages.find((item) => item.id === section.stage);
              return (
                <details className="form-section" id={`section-${section.slug}`} key={section.slug} name="builder-steps" data-status={stage?.status} open={section.slug === 'identification'}>
                  <summary>
                    {stage && <span className="stage-status">{stageIcons[stage.status]}</span>}
                    <span className="stage-title">{t(section.titleKey)}{stage && <span className="sr-only"> ({t(stageStatusKey[stage.status])})</span>}</span>
                    {stage && <span className="stage-count">{stage.filled}/{stage.total}</span>}
                  </summary>
                  <div>
                    {section.slug === 'other-methods' && renderOtherSourcesBlock()}
                    {fields.map((field) => {
                      const origin = calculated.origins[field];
                      const fieldIssues = issues.filter((item) => item.location === field);
                      const optional = optionalFields.includes(field);
                      return (
                        <div key={field} className="count-row">
                          <label className={`count-field ${origin}`} id={`field-${field}`}>
                            <span>{labels[field]}<small>{origin === 'derived' && <SquareFunction size={11} aria-hidden="true" />}{t(originKey[origin])}{optional ? ` · ${t('optional')}` : ''}</small></span>
                            <input
                              type="number" min="0" step="1" inputMode="numeric" value={calculated.values[field] ?? ''}
                              disabled={origin === 'derived'} aria-invalid={fieldIssues.some((item) => item.status === 'inconsistency' || item.status === 'missing')}
                              onFocus={() => setSelected(field)}
                              onChange={(event) => origin === 'override'
                                ? patchProject({ overrides: { ...project.overrides, [field]: { ...project.overrides[field]!, value: event.target.value === '' ? 0 : Number(event.target.value) } } })
                                : updateCount(field, event.target.value === '' ? null : Number(event.target.value))}
                            />
                            {calculated.formulas[field] && <small className="formula">{calculated.formulas[field]}</small>}
                            {fieldIssues[0] && <small className="field-error">{fieldIssues[0].title}</small>}
                          </label>
                          <button type="button" className="field-info" aria-label={`${t('fieldDetails')}: ${labels[field]}`} title={t('fieldDetails')} onClick={() => { setSelected(field); openInspector('details', true); }}>
                            <Info size={14} aria-hidden="true" />
                          </button>
                          {field === 'databases' && (
                            <div className="database-sources-block">
                              <div className="database-sources-header">
                                <h3>{t('specificDatabases')}</h3>
                                {databaseSources.length > 0 && (
                                  <span className="database-count-badge">
                                    {t('totalFromDatabases')}: {databaseSources.reduce((acc, s) => acc + (s.count || 0), 0)}
                                  </span>
                                )}
                              </div>

                              {databaseSources.length === 0 && (
                                <div className="database-chips-container">
                                  <span className="chips-label">{t('quickSuggestions')}</span>
                                  <div className="database-chips">
                                    {popularDatabases.map((dbName) => (
                                      <button key={dbName} type="button" className="database-chip" onClick={() => addDatabaseSource(dbName)} title={`+ ${dbName}`}>
                                        + {dbName}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {databaseSources.length > 0 && (
                                <div className="database-items-list">
                                  {databaseSources.map((source) => (
                                    <div key={source.id} className="database-item-row">
                                      <input
                                        aria-label={t('databaseNamePlaceholder')}
                                        placeholder={t('databaseNamePlaceholder')}
                                        value={source.name}
                                        onChange={(event) => updateDatabaseSource(source.id, { name: event.target.value })}
                                      />
                                      <input
                                        aria-label={t('count')}
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={source.count === 0 ? '' : source.count}
                                        onChange={(event) => updateDatabaseSource(source.id, { count: event.target.value === '' ? 0 : Math.max(0, Number(event.target.value)) })}
                                      />
                                      <button type="button" className="remove-btn" aria-label={t('removeDatabase')} title={t('removeDatabase')} onClick={() => removeDatabaseSource(source.id)}>
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Suggestions stay one keystroke away through the datalist once the list has items. */}
                              <form
                                className="add-source-row"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  const input = event.currentTarget.elements.namedItem('database') as HTMLInputElement;
                                  addDatabaseSource(input.value.trim());
                                  input.value = '';
                                }}
                              >
                                <input name="database" list="database-suggestions" aria-label={t('addDatabase')} placeholder={t('addDatabase')} />
                                <button type="submit" className="text-button">+ {t('add')}</button>
                                <datalist id="database-suggestions">
                                  {popularDatabases.filter((name) => !databaseSources.some((source) => source.name === name)).map((name) => <option key={name} value={name} />)}
                                </datalist>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {section.slug === 'eligibility' && renderReasons('exclusionReasons', 'reportsExcluded', 'exclusionReasons')}
                    {section.slug === 'other-methods' && renderReasons('otherExclusionReasons', 'otherReportsExcluded', 'exclusionReasonsOther')}
                    {stage?.status === 'complete' && renderContinue(section.slug)}
                  </div>
                </details>
              );
            })}
          </aside>

          <section className="diagram-panel" aria-label="Editor visual do diagrama">
            <div className="canvas-stage">
            <fieldset className="style-switch canvas-style">
              <legend className="sr-only">{t('visualStyle')}</legend>
              <div>
                {(['classic', 'modern'] as const).map((value) => (
                  <label key={value}>
                    <input type="radio" name="diagram-style" value={value} checked={(project.presentation.diagramStyle ?? 'classic') === value} onChange={() => patchProject({ presentation: { ...project.presentation, diagramStyle: value } }, 'Visual do diagrama alterado')} />
                    <span>{value === 'classic' ? t('classicStyle') : t('modernStyle')}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <PrismaDiagram project={project} locale={locale} selected={selected} onSelect={selectNode} onSelectStage={focusStage} progress={{ ready: completeness.ready, bands: bandProgress(completeness), pendingLabel: t('pendingNode'), completeLabel: t('stageStatusComplete') }} zoom={zoom} onZoom={(update) => setZoom((value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, update(value))))} />
            <div className="canvas-tools" role="toolbar" aria-label={t('zoomLevel')}>
              <button type="button" onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value / ZOOM_STEP))} disabled={zoom <= MIN_ZOOM} title={t('zoomOut')} aria-label={t('zoomOut')}><ZoomOut size={16} aria-hidden="true" /></button>
              <output aria-label={t('zoomLevel')}>{Math.round(zoom * 100)}%</output>
              <button type="button" onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value * ZOOM_STEP))} disabled={zoom >= MAX_ZOOM} title={t('zoomIn')} aria-label={t('zoomIn')}><ZoomIn size={16} aria-hidden="true" /></button>
              <button type="button" onClick={() => setZoom(0.82)} title={t('fit')} aria-label={t('fit')}><Focus size={16} aria-hidden="true" /></button>
              <button type="button" onClick={() => workspaceRef.current?.requestFullscreen()} title={t('fullscreen')} aria-label={t('fullscreen')}><Maximize2 size={16} aria-hidden="true" /></button>
              <button type="button" onClick={toggleTable} title={t('viewAsTable')} aria-label={t('viewAsTable')}><Table2 size={16} aria-hidden="true" /></button>
            </div>
            </div>
            <details className="diagram-alternative" ref={tableRef}>
              <summary>{t('tabularAlternative')}</summary>
              <table><thead><tr><th>{t('stage')}</th><th>{t('value')}</th><th>{t('origin')}</th></tr></thead><tbody>{countKeys.filter(applicable).map((field) => <tr key={field}><th>{labels[field]}</th><td>{calculated.values[field] ?? '—'}</td><td>{t(originKey[calculated.origins[field]])}</td></tr>)}</tbody></table>
            </details>
          </section>

          {inspector && (
            <aside
              className="context-panel inspector"
              aria-label={inspector === 'details' ? t('details') : t('validation')}
              onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); closeInspector(); } }}
            >
              <div className="inspector-header">
                <div className="inspector-switch" role="group" aria-label={`${t('details')} / ${t('validation')}`}>
                  <button type="button" aria-pressed={inspector === 'details'} onClick={() => setInspector('details')}>{t('details')}</button>
                  <button type="button" aria-pressed={inspector === 'validation'} onClick={() => setInspector('validation')}>{t('validation')} <b className="issue-count">{alertCount}</b></button>
                </div>
                <button type="button" className="icon-tool" aria-label={t('closePanel')} title={t('closePanel')} onClick={closeInspector}><X size={17} aria-hidden="true" /></button>
              </div>
              {inspector === 'details' ? (
            <section className="selected-node">
              <p className="kicker">{t('selectedNode')}</p><h2 id="inspector-title" tabIndex={-1}>{labels[selected]}</h2>
              <p>{definitions[selected] ?? t('defaultDefinition')}</p>
              <dl><div><dt>{t('value')}</dt><dd>{calculated.values[selected] ?? '—'}</dd></div><div><dt>{t('origin')}</dt><dd>{t(originKey[calculated.origins[selected]])}</dd></div><div><dt>{t('formula')}</dt><dd>{calculated.formulas[selected] ?? t('directValue')}</dd></div></dl>
              {(selectedOrigin === 'derived' || selectedOrigin === 'override') && (
                <div className="override-box">
                  <button type="button" className="text-button" onClick={toggleOverride}>{selectedOverride ? t('restoreCalculation') : t('unlockDerived')}</button>
                  {selectedOverride && <><label>{t('manualValue')}<input type="number" min="0" value={selectedOverride.value} onChange={(event) => patchProject({ overrides: { ...project.overrides, [selected]: { ...selectedOverride, value: Number(event.target.value) } } })} /></label><label>{t('mandatoryJustification')}<textarea value={selectedOverride.justification} onChange={(event) => patchProject({ overrides: { ...project.overrides, [selected]: { ...selectedOverride, justification: event.target.value } } })} /></label></>}
                </div>
              )}
              <details className="provenance-editor"><summary>{t('notesAndProvenance')}</summary>
                <label>{t('observation')}<textarea rows={3} value={selectedProvenance.note} onChange={(event) => patchProvenance({ note: event.target.value })} /></label>
                <label>{t('responsible')}<input value={selectedProvenance.responsible} onChange={(event) => patchProvenance({ responsible: event.target.value })} /></label>
                <label>{t('date')}<input type="date" value={selectedProvenance.date} onChange={(event) => patchProvenance({ date: event.target.value })} /></label>
                <label>{t('url')}<input type="url" value={selectedProvenance.url} onChange={(event) => patchProvenance({ url: event.target.value })} /></label>
                <label>{t('repositoryOrFile')}<input value={selectedProvenance.repositoryRef} onChange={(event) => patchProvenance({ repositoryRef: event.target.value })} /></label>
              </details>
            </section>
              ) : (
            <section className="validation-panel" id="validation-panel">
              <div className="panel-heading"><div><p className="kicker">{t('ruleEngine')}</p><h2 id="inspector-title" tabIndex={-1}>{t('validation')}</h2></div><span className="issue-count">{alertCount}</span></div>
              <div role="status" aria-live="polite" className="sr-only">{issues.length} {t('validationResults')}</div>
              {issues.map((item) => (
                <article className={`validation-item ${item.status}`} key={item.id}>
                  <span>{t(issueStatusKey[item.status])}</span>
                  <h3><button type="button" className="validation-link" onClick={() => handleIssueClick(item)}>{item.title}</button></h3>
                  <p>{item.why}</p><small>{item.how}</small>
                </article>
              ))}
            </section>
              )}
            </aside>
          )}
        </div>
      )}

      {touring && ready && <GuidedTour steps={tourSteps} onPrepare={prepareTourStep} onClose={closeTour} />}

      {clearModal.rendered && (
        <div className="modal-backdrop" role="presentation" data-state={clearModal.state}>
          <section className="modal" role="alertdialog" aria-modal="true" aria-labelledby="clear-title">
            <h2 id="clear-title">{t('clearModalTitle')}</h2>
            <p>{t('clearModalBody')}</p>
            <div>
              <button className="secondary-button" type="button" onClick={() => setConfirmClear(false)}>{t('cancel')}</button>
              <button className="danger-button" type="button" onClick={() => { clearAll(); setConfirmClear(false); }}>{t('clearAll')}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
