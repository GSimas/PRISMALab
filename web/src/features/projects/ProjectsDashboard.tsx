'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, FilePlus2, FolderOpen, Pencil, Search, Trash2 } from 'lucide-react';
import { useApp } from '../../app/AppProviders';
import { usePresence } from '../../app/usePresence';
import { createProject } from '../../domain/project';
import { progressFor, validateProject } from '../../domain/validation';
import type { PrismaProject, ProjectStatus } from '../../domain/types';
import { deleteProject, duplicateProject, listProjects, saveProject } from '../../storage/db';
import { exportProject } from '../export/exporters';
import { ImportWizard } from '../import/ImportWizard';

export function ProjectsDashboard() {
  const { locale, t } = useApp();
  const [projects, setProjects] = useState<PrismaProject[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [sort, setSort] = useState<'updated' | 'title'>('updated');
  const [confirmDelete, setConfirmDelete] = useState<PrismaProject | null>(null);
  const [deleted, setDeleted] = useState<PrismaProject | null>(null);
  const [renaming, setRenaming] = useState<PrismaProject | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const deleteModal = usePresence(confirmDelete);
  const renameModal = usePresence(renaming);
  const undoToast = usePresence(deleted);
  const deleting = deleteModal.rendered;
  const renamed = renameModal.rendered;
  const restorable = undoToast.rendered;

  const refresh = () => listProjects().then(setProjects);
  useEffect(() => {
    refresh();
  }, []);

  const visible = useMemo(
    () =>
      projects
        .filter((project) => status === 'all' || project.status === status)
        .filter((project) => project.title.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (sort === 'title' ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt))),
    [projects, query, sort, status],
  );

  const openNew = async (example = false) => {
    const project = createProject({ locale, model: example ? 'new-databases-other' : 'new-databases', example });
    await saveProject(project);
    window.location.href = `/builder?project=${project.id}`;
  };

  const importProject = async (project: PrismaProject) => {
    await saveProject(project);
    await refresh();
  };

  return (
    <main id="main-content" className="content-page projects-page">
      <header className="page-hero compact">
        <div>
          <p className="eyebrow">
            <span /> {t('projectsHeroEyebrow')}
          </p>
          <h1>{t('dashboard')}</h1>
          <p>{t('projectsHeroLead')}</p>
        </div>
        <button className="primary-button" type="button" onClick={() => openNew(false)}>
          <FilePlus2 size={18} /> {t('newDiagram')}
        </button>
      </header>

      <section className="dashboard-controls" aria-label={t('projects')}>
        <label className="search-box">
          <Search size={17} />
          <span className="sr-only">{t('search')}</span>
          <input placeholder={t('search')} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          {t('status')}
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">{t('all')}</option>
            <option value="draft">{t('draft')}</option>
            <option value="review">{t('inReview')}</option>
            <option value="complete">{t('completed')}</option>
          </select>
        </label>
        <label>
          {t('sortBy')}
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="updated">{t('lastModified')}</option>
            <option value="title">{t('title')}</option>
          </select>
        </label>
        <button className="secondary-button" type="button" onClick={() => openNew(true)}>
          {t('createFromExample')}
        </button>
      </section>

      {visible.length ? (
        <section className="project-grid" aria-label={t('projects')}>
          {visible.map((project) => {
            const warnings = validateProject(project, locale).filter((item) => item.status === 'attention' || item.status === 'inconsistency' || item.status === 'missing').length;
            return (
              <article className="project-card" key={project.id}>
                <div className="project-card-meta">
                  <span>{project.status === 'draft' ? t('draft') : project.status === 'review' ? t('inReview') : t('completed')}</span>
                  <time dateTime={project.updatedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(project.updatedAt))}</time>
                </div>
                <h2>{project.title}</h2>
                <p>{project.reviewType} · {project.model.replaceAll('-', ' ')} · {project.locale}</p>
                <div className="project-progress">
                  <span><i style={{ width: `${progressFor(project)}%` }} /></span>
                  <small>{progressFor(project)}% {t('filled')} · {warnings} {t('alerts')}</small>
                </div>
                <div className="card-actions">
                  <a className="primary-button small" href={`/builder?project=${project.id}`}>
                    <FolderOpen size={15} /> {t('open')}
                  </a>
                  <button type="button" onClick={() => { setRenaming(project); setRenameValue(project.title); }} aria-label={`${t('rename')} ${project.title}`}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => duplicateProject(project).then(refresh)} aria-label={`${t('duplicate')} ${project.title}`}>
                    <Copy size={16} />
                  </button>
                  <button type="button" onClick={() => exportProject(project, locale, 'json')} aria-label={`${t('backup')} ${project.title}`}>
                    <Download size={16} />
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(project)} aria-label={`${t('delete')} ${project.title}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="empty-state">
          <span>PD—00</span>
          <h2>{t('emptyProjects')}</h2>
          <p>{t('emptyProjectsLead')}</p>
          <button className="primary-button" onClick={() => openNew(false)}>
            {t('createFirst')}
          </button>
        </section>
      )}

      <ImportWizard onImport={importProject} />

      {deleting && (
        <div className="modal-backdrop" role="presentation" data-state={deleteModal.state}>
          <section className="modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <h2 id="delete-title">{t('deleteProjectTitle')}</h2>
            <p>“{deleting.title}” {t('deleteProjectBody')}</p>
            <div>
              <button className="secondary-button" onClick={() => setConfirmDelete(null)}>
                {t('cancel')}
              </button>
              <button
                className="danger-button"
                onClick={async () => {
                  await deleteProject(deleting.id);
                  setDeleted(deleting);
                  setConfirmDelete(null);
                  refresh();
                }}
              >
                {t('delete')}
              </button>
            </div>
          </section>
        </div>
      )}

      {renamed && (
        <div className="modal-backdrop" data-state={renameModal.state}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="rename-title">
            <h2 id="rename-title">{t('renameProjectTitle')}</h2>
            <label>
              {t('newTitle')}
              <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
            </label>
            <div>
              <button className="secondary-button" onClick={() => setRenaming(null)}>
                {t('cancel')}
              </button>
              <button
                className="primary-button"
                onClick={async () => {
                  await saveProject({ ...renamed, title: renameValue });
                  setRenaming(null);
                  refresh();
                }}
              >
                {t('save')}
              </button>
            </div>
          </section>
        </div>
      )}

      {restorable && (
        <div className="undo-toast" role="status" data-state={undoToast.state}>
          {t('projectDeleted')}{' '}
          <button
            onClick={async () => {
              await saveProject(restorable);
              setDeleted(null);
              refresh();
            }}
          >
            {t('undo')}
          </button>
        </div>
      )}
    </main>
  );
}
