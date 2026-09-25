'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileCheck2, Focus, HelpCircle, Maximize2, Redo2, Sparkles, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { useApp } from '../../app/AppProviders';
import { useProjectStore } from '../../app/store';
import { usePresence } from '../../app/usePresence';
import { calculateProject, emptyCounts, hasOtherSources, isUpdatedModel, selectModel } from '../../domain/calculations';
import { createExampleChecklist, createChecklist } from '../../domain/checklist';
import { createProject } from '../../domain/project';
import { countKeys, type CountKey, type NodeProvenance, type PrismaProject, type SourceItem, type ValidationIssue } from '../../domain/types';
import { validateProject } from '../../domain/validation';
import { fieldDefinitions, fieldLabels, type TranslationKey } from '../../i18n/translations';
import { getProject, saveProject } from '../../storage/db';
import { PrismaDiagram, type DiagramStage } from './PrismaDiagram';
import { ChecklistPanel } from '../checklist/ChecklistPanel';
import { ExportPanel } from '../export/ExportPanel';
import { ImportWizard } from '../import/ImportWizard';

const fieldSections: { titleKey: TranslationKey; slug: string; fields: CountKey[] }[] = [
  { titleKey: 'sectionPrevious', slug: 'previous', fields: ['previousStudies', 'previousReports'] },
  { titleKey: 'sectionIdentification', slug: 'identification', fields: ['databases'] },
  { titleKey: 'sectionRemoved', slug: 'removed', fields: ['duplicates', 'automationExcluded', 'removedOther'] },
  { titleKey: 'sectionScreening', slug: 'screening', fields: ['screened', 'recordsExcluded', 'reportsSought', 'reportsNotRetrieved'] },
  { titleKey: 'sectionEligibility', slug: 'eligibility', fields: ['reportsAssessed', 'reportsExcluded'] },
  { titleKey: 'sectionOtherMethods', slug: 'other-methods', fields: ['otherReportsSought', 'otherReportsNotRetrieved', 'otherReportsAssessed', 'otherReportsExcluded'] },
  { titleKey: 'sectionInclusion', slug: 'sectionInclusion', fields: ['newStudies', 'newReports', 'totalStudies', 'totalReports'] },
];

const optionalFields: CountKey[] = ['automationExcluded', 'removedOther'];

export function BuilderWorkspace() {
  const { ready, locale, t } = useApp();
  const { project, past, future, setProject, patchProject, updateCount, updateProject, undo, redo } = useProjectStore();
  const [selected, setSelected] = useState<CountKey>('databases');
  const [tab, setTab] = useState<'data' | 'checklist' | 'export' | 'import'>('data');
  const [zoom, setZoom] = useState(0.82);
  const [saveState, setSaveState] = useState<'saving' | 'saved'>('saved');
  const [confirmClear, setConfirmClear] = useState(false);
  const clearModal = usePresence(confirmClear);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const flashTimeoutRef = useRef<number | undefined>(undefined);

  const labels = fieldLabels[locale] || fieldLabels['pt-BR'];
  const definitions = fieldDefinitions[locale] || fieldDefinitions['pt-BR'];

  const calculated = useMemo(() => calculateProject(project), [project]);
  const issues = useMemo(() => validateProject(project, locale), [project, locale]);

  const focusById = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
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
    if (item.location === 'project') { focusById('project-title-field'); return; }
    if (item.location === 'model') { focusById('model-fieldset'); return; }
    focusField(item.location);
  };

  const focusStage = (stage: DiagramStage) => focusById(`section-${stage}`);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('project') ?? localStorage.getItem('prisma-last-project');
    if (id) getProject(id).then((saved) => saved && setProject(saved));
  }, [setProject]);

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
          <h4>{t('otherMethodsSources')}</h4>
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

        <button
          className="text-button add-database-btn"
          type="button"
          onClick={() => addOtherSource('other', '')}
        >
          + {t('addOtherSource')}
        </button>
      </div>
    );
  };

  return (
    <main id="main-content" className="builder-page" data-app-ready={ready ? 'true' : 'false'} aria-busy={!ready}>
      <header className="builder-project-header">
        <div>
          <p className="kicker">{project.guideline} · {project.model.replaceAll('-', ' ')}</p>
          <input className="project-title-input" aria-label={t('title')} value={project.title} onChange={(event) => patchProject({ title: event.target.value }, 'Título alterado')} />
        </div>
        <div className="save-indicator" role="status" aria-live="polite"><span className={saveState} />{saveState === 'saving' ? t('saving') : t('saved')}</div>
      </header>

      <div className="builder-toolbar" aria-label="Ferramentas do diagrama">
        <button type="button" onClick={undo} disabled={!past.length} title={t('undo')}><Undo2 /><span>{t('undo')}</span></button>
        <button type="button" onClick={redo} disabled={!future.length} title={t('redo')}><Redo2 /><span>{t('redo')}</span></button>
        <span className="toolbar-divider" />
        <button type="button" onClick={() => setZoom((value) => Math.max(0.45, value - 0.1))} title={t('zoomOut')}><ZoomOut /><span>−</span></button>
        <output aria-label={t('zoomLevel')}>{Math.round(zoom * 100)}%</output>
        <button type="button" onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))} title={t('zoomIn')}><ZoomIn /><span>+</span></button>
        <button type="button" onClick={() => setZoom(0.82)} title={t('fit')}><Focus /><span>{t('fit')}</span></button>
        <button type="button" onClick={() => workspaceRef.current?.requestFullscreen()} title={t('fullscreen')}><Maximize2 /><span>{t('fullscreen')}</span></button>
        <button type="button" onClick={() => setTab('export')} title={t('export')}><Download /><span>{t('export')}</span></button>
        <button type="button" onClick={() => window.print()} title={t('printPreview')}><FileCheck2 /><span>{t('printPreview')}</span></button>
        <a href="/learn" title={t('help')}><HelpCircle /><span>{t('help')}</span></a>
        <button type="button" onClick={() => setConfirmClear(true)} title={t('clearAll')}><Trash2 /><span>{t('clearAll')}</span></button>
        <button type="button" onClick={loadExample} title={t('example')}><Sparkles /><span>{t('example')}</span></button>
      </div>

      <div className="builder-tabs" role="tablist" aria-label="Módulos do construtor">
        <button role="tab" disabled={!ready} aria-selected={tab === 'data'} onClick={() => setTab('data')}>{t('data')}</button>
        <button role="tab" disabled={!ready} aria-selected={tab === 'checklist'} onClick={() => setTab('checklist')}>{t('checklist')}</button>
        <button role="tab" disabled={!ready} aria-selected={tab === 'export'} onClick={() => setTab('export')}>{t('export')}</button>
        <button role="tab" disabled={!ready} aria-selected={tab === 'import'} onClick={() => setTab('import')}>{t('import')}</button>
      </div>

      {tab === 'checklist' && <div className="single-module"><ChecklistPanel project={project} onChange={(next) => updateProject(next, 'Checklist atualizado')} /></div>}
      {tab === 'export' && <div className="single-module"><ExportPanel project={project} locale={locale} /></div>}
      {tab === 'import' && <div className="single-module"><ImportWizard onImport={(next) => { setProject(next); setTab('data'); }} /></div>}

      {tab === 'data' && (
        <div className="builder-workspace" ref={workspaceRef}>
          <aside className="data-panel" aria-label="Preenchimento do diagrama">
            <section className="project-setup">
              <h2>{t('projectSetup')}</h2>
              <label id="project-title-field">{t('title')}<input value={project.title} onChange={(event) => patchProject({ title: event.target.value })} /></label>
              <label>{t('authors')}<input value={project.authors.join('; ')} onChange={(event) => patchProject({ authors: event.target.value.split(';').map((value) => value.trim()).filter(Boolean) })} placeholder={t('authorsPlaceholder')} /></label>
              <label>{t('institution')}<input value={project.institution} onChange={(event) => patchProject({ institution: event.target.value })} /></label>
              <label>{t('protocol')}<input type="url" value={project.protocolUrl} onChange={(event) => patchProject({ protocolUrl: event.target.value })} /></label>
              <fieldset id="model-fieldset"><legend>{t('flowType')}</legend>
                <label className="check-row"><input type="radio" name="review-kind" checked={project.reviewKind === 'new'} onChange={() => setReviewKind('new')} /> {t('newReview')}</label>
                <label className="check-row"><input type="radio" name="review-kind" checked={project.reviewKind === 'updated'} onChange={() => setReviewKind('updated')} /> {t('updatedReview')}</label>
                <label className="check-row"><input type="checkbox" checked={hasOtherSources(project.model)} onChange={(event) => setOtherSources(event.target.checked)} /> {t('otherSources')}</label>
              </fieldset>
            </section>
            {fieldSections.map((section) => {
              const fields = section.fields.filter(applicable);
              if (!fields.length && section.slug !== 'other-methods') return null;
              if (!fields.length && section.slug === 'other-methods' && !hasOtherSources(project.model)) return null;
              return (
                <details className="form-section" id={`section-${section.slug}`} key={section.slug} open={section.slug === 'identification' || section.slug === 'other-methods'}>
                  <summary>{t(section.titleKey)}<span>{fields.filter((field) => calculated.values[field] !== null).length}/{fields.length}</span></summary>
                  <div>
                    {section.slug === 'other-methods' && renderOtherSourcesBlock()}
                    {fields.map((field) => {
                      const origin = calculated.origins[field];
                      const fieldIssues = issues.filter((item) => item.location === field);
                      const optional = optionalFields.includes(field);
                      return (
                        <div key={field} style={{ display: 'grid', gap: '.4rem' }}>
                          <label className={`count-field ${origin}`} id={`field-${field}`}>
                            <span>{labels[field]}<small>{origin === 'derived' ? t('derived') : origin === 'override' ? t('override') : t('informed')}{optional ? ` · ${t('optional')}` : ''}</small></span>
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
                          {field === 'databases' && (
                            <div className="database-sources-block">
                              <div className="database-sources-header">
                                <h4>{t('specificDatabases')}</h4>
                                {databaseSources.length > 0 && (
                                  <span className="database-count-badge">
                                    {t('totalFromDatabases')}: {databaseSources.reduce((acc, s) => acc + (s.count || 0), 0)}
                                  </span>
                                )}
                              </div>

                              <div className="database-chips-container">
                                <span className="chips-label">{t('quickSuggestions')}</span>
                                <div className="database-chips">
                                  {popularDatabases.map((dbName) => (
                                    <button
                                      key={dbName}
                                      type="button"
                                      className="database-chip"
                                      onClick={() => addDatabaseSource(dbName)}
                                      title={`+ ${dbName}`}
                                    >
                                      + {dbName}
                                    </button>
                                  ))}
                                </div>
                              </div>

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
                                      <button
                                        type="button"
                                        className="remove-btn"
                                        aria-label={t('removeDatabase')}
                                        title={t('removeDatabase')}
                                        onClick={() => removeDatabaseSource(source.id)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <button
                                className="text-button add-database-btn"
                                type="button"
                                onClick={() => addDatabaseSource('')}
                              >
                                + {t('addDatabase')}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
            <section className="reasons-editor">
              <h2>{t('exclusionReasons')}</h2>
              {project.exclusionReasons.map((reason) => (
                <div key={reason.id}>
                  <input aria-label={t('reason')} placeholder={t('reason')} value={reason.label} onChange={(event) => patchProject({ exclusionReasons: project.exclusionReasons.map((item) => item.id === reason.id ? { ...item, label: event.target.value } : item) })} />
                  <input aria-label={t('count')} type="number" min="0" value={reason.count} onChange={(event) => patchProject({ exclusionReasons: project.exclusionReasons.map((item) => item.id === reason.id ? { ...item, count: Number(event.target.value) } : item) })} />
                  <button type="button" aria-label={t('removeReason')} title={t('removeReason')} onClick={() => patchProject({ exclusionReasons: project.exclusionReasons.filter((item) => item.id !== reason.id) })}>×</button>
                </div>
              ))}
              <button className="text-button" type="button" onClick={() => patchProject({ exclusionReasons: [...project.exclusionReasons, { id: crypto.randomUUID(), label: '', count: 0 }] })}>+ {t('addReason')}</button>
            </section>
            {hasOtherSources(project.model) && (
              <section className="reasons-editor">
                <h2>{t('exclusionReasonsOther')}</h2>
                {project.otherExclusionReasons.map((reason) => (
                  <div key={reason.id}>
                    <input aria-label={t('reason')} placeholder={t('reason')} value={reason.label} onChange={(event) => patchProject({ otherExclusionReasons: project.otherExclusionReasons.map((item) => item.id === reason.id ? { ...item, label: event.target.value } : item) })} />
                    <input aria-label={t('count')} type="number" min="0" value={reason.count} onChange={(event) => patchProject({ otherExclusionReasons: project.otherExclusionReasons.map((item) => item.id === reason.id ? { ...item, count: Number(event.target.value) } : item) })} />
                    <button type="button" aria-label={t('removeReason')} title={t('removeReason')} onClick={() => patchProject({ otherExclusionReasons: project.otherExclusionReasons.filter((item) => item.id !== reason.id) })}>×</button>
                  </div>
                ))}
                <button className="text-button" type="button" onClick={() => patchProject({ otherExclusionReasons: [...project.otherExclusionReasons, { id: crypto.randomUUID(), label: '', count: 0 }] })}>+ {t('addReason')}</button>
              </section>
            )}
          </aside>

          <section className="diagram-panel" aria-label="Editor visual do diagrama">
            <div className="canvas-label">
              <span>PRISMA 2020 · SVG</span>
              <div className="canvas-controls">
                <label>{t('visualStyle')}<select aria-label={t('visualStyle')} value={project.presentation.diagramStyle ?? 'classic'} onChange={(event) => patchProject({ presentation: { ...project.presentation, diagramStyle: event.target.value as 'classic' | 'modern' } }, 'Visual do diagrama alterado')}><option value="classic">{t('classicStyle')}</option><option value="modern">{t('modernStyle')}</option></select></label>
                <label>{t('structureMode')}<select aria-label={t('structureMode')} value={project.presentation.mode} onChange={(event) => patchProject({ presentation: { ...project.presentation, mode: event.target.value as 'prisma' | 'presentation' } })}><option value="prisma">{t('prismaMode')}</option><option value="presentation">{t('presentationMode')}</option></select></label>
              </div>
            </div>
            <PrismaDiagram project={project} locale={locale} selected={selected} onSelect={focusField} onSelectStage={focusStage} zoom={zoom} />
            <details className="diagram-alternative">
              <summary>{t('tabularAlternative')}</summary>
              <table><thead><tr><th>{t('stage')}</th><th>{t('value')}</th><th>{t('origin')}</th></tr></thead><tbody>{countKeys.filter(applicable).map((field) => <tr key={field}><th>{labels[field]}</th><td>{calculated.values[field] ?? '—'}</td><td>{calculated.origins[field]}</td></tr>)}</tbody></table>
            </details>
          </section>

          <aside className="context-panel" aria-label="Detalhes e validação">
            <section className="selected-node">
              <p className="kicker">{t('selectedNode')}</p><h2>{labels[selected]}</h2>
              <p>{definitions[selected] ?? t('defaultDefinition')}</p>
              <dl><div><dt>{t('value')}</dt><dd>{calculated.values[selected] ?? '—'}</dd></div><div><dt>{t('origin')}</dt><dd>{calculated.origins[selected]}</dd></div><div><dt>{t('formula')}</dt><dd>{calculated.formulas[selected] ?? t('directValue')}</dd></div></dl>
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
            <section className="validation-panel">
              <div className="panel-heading"><div><p className="kicker">{t('ruleEngine')}</p><h2>{t('validation')}</h2></div><span className="issue-count">{issues.filter((item) => item.status !== 'valid').length}</span></div>
              <div role="status" aria-live="polite" className="sr-only">{issues.length} {t('validationResults')}</div>
              {issues.map((item) => (
                <article
                  className={`validation-item ${item.status}`}
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleIssueClick(item)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleIssueClick(item); } }}
                >
                  <span>{item.status}</span><h3>{item.title}</h3><p>{item.why}</p><small>{item.how}</small>
                </article>
              ))}
            </section>
          </aside>
        </div>
      )}

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
