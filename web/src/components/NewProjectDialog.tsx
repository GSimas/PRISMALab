'use client';

import { useEffect, useRef, useState } from 'react';
import { FilePlus2, FileUp } from 'lucide-react';
import { useApp } from '../app/AppProviders';
import { usePresence } from '../app/usePresence';
import { createProject } from '../domain/project';
import type { PrismaProject } from '../domain/types';
import { saveProject } from '../storage/db';
import { restoreProject } from '../storage/serialization';

/** "New diagram" chooser: start blank or import a .json project (PRISMA Lab backup or Simetrics export). */
export function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, t } = useApp();
  const { rendered, state } = usePresence(open);
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const openProject = async (project: PrismaProject) => {
    await saveProject(project);
    window.location.href = `/builder?project=${project.id}`;
  };

  const importFile = async (file: File) => {
    setError('');
    try {
      await openProject(restoreProject(await file.text()));
    } catch {
      setError(t('importJsonError'));
    }
  };

  if (!rendered) return null;
  return (
    <div className="modal-backdrop" data-state={state} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal new-project-modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <h2 id="new-project-title">{t('newDiagram')}</h2>
        <p>{t('newProjectLead')}</p>
        <div className="new-project-choices">
          <button type="button" autoFocus onClick={() => openProject(createProject({ locale, model: 'new-databases' }))}>
            <FilePlus2 size={22} aria-hidden="true" />
            <strong>{t('startBlank')}</strong>
            <span>{t('startBlankHint')}</span>
          </button>
          <button type="button" onClick={() => fileInput.current?.click()}>
            <FileUp size={22} aria-hidden="true" />
            <strong>{t('importJsonProject')}</strong>
            <span>{t('importJsonHint')}</span>
          </button>
          <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void importFile(file); }} />
        </div>
        {error && <p className="new-project-error" role="alert">{error}</p>}
        <div>
          <button className="secondary-button" type="button" onClick={onClose}>{t('cancel')}</button>
        </div>
      </section>
    </div>
  );
}
