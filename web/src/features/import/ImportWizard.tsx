'use client';

import { useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import { useApp } from '../../app/AppProviders';
import { countKeys, type CountKey, type PrismaProject } from '../../domain/types';
import { createProject } from '../../domain/project';
import { restoreProject } from '../../storage/serialization';

interface Preview {
  headers: string[];
  rows: unknown[][];
  name: string;
}

export function ImportWizard({ onImport, compact = false }: { onImport: (project: PrismaProject) => void; compact?: boolean }) {
  const { t } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fieldColumn, setFieldColumn] = useState(0);
  const [valueColumn, setValueColumn] = useState(1);
  const [error, setError] = useState('');

  const readFile = async (file: File) => {
    setError('');
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        onImport(restoreProject(await file.text()));
        return;
      }
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      if (matrix.length < 2) throw new Error('Table needs a header and at least one data row.');
      const headers = matrix[0].map((cell) => String(cell));
      setPreview({ headers, rows: matrix.slice(1, 21), name: file.name });
      const fieldIndex = headers.findIndex((header) => /field|campo|id/i.test(header));
      const valueIndex = headers.findIndex((header) => /value|valor|count|contagem|n$/i.test(header));
      setFieldColumn(fieldIndex >= 0 ? fieldIndex : 0);
      setValueColumn(valueIndex >= 0 ? valueIndex : Math.min(1, headers.length - 1));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Invalid file.');
    }
  };

  const confirm = () => {
    if (!preview) return;
    const project = createProject({ title: `${t('importedFrom')} ${preview.name}` });
    let imported = 0;
    preview.rows.forEach((row) => {
      const field = String(row[fieldColumn]).trim() as CountKey;
      const value = Number(row[valueColumn]);
      if (countKeys.includes(field) && Number.isInteger(value) && value >= 0) {
        project.counts[field] = value;
        imported += 1;
      }
    });
    if (!imported) {
      setError('No rows matched PRISMA field IDs. Check column mapping.');
      return;
    }
    onImport(project);
    setPreview(null);
  };

  return (
    <section className={compact ? 'import-wizard compact' : 'import-wizard'} aria-labelledby="import-title">
      <div className="panel-heading">
        <div>
          <p className="kicker">{t('localData')}</p>
          <h2 id="import-title">{t('importProjectOrTable')}</h2>
        </div>
        <FileUp aria-hidden="true" />
      </div>
      <p>{t('importLead')}</p>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".json,.csv,.xlsx,.xls"
        aria-label={t('selectFile')}
        onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])}
      />
      <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>
        <FileUp size={17} aria-hidden="true" /> {t('selectFile')}
      </button>
      {preview && (
        <div className="mapping-preview">
          <button className="icon-button close" type="button" onClick={() => setPreview(null)} aria-label={t('closePreview')}>
            <X size={16} />
          </button>
          <h3>{t('columnMapping')}</h3>
          <div className="mapping-controls">
            <label>
              {t('fieldColumn')}
              <select value={fieldColumn} onChange={(event) => setFieldColumn(Number(event.target.value))}>
                {preview.headers.map((header, index) => (
                  <option value={index} key={`${header}-${index}`}>
                    {header || `${t('column')} ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('valueColumn')}
              <select value={valueColumn} onChange={(event) => setValueColumn(Number(event.target.value))}>
                {preview.headers.map((header, index) => (
                  <option value={index} key={`${header}-${index}`}>
                    {header || `${t('column')} ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {preview.headers.map((header, index) => (
                    <th key={`${header}-${index}`}>{header || `${t('column')} ${index + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="primary-button" type="button" onClick={confirm}>
            {t('validateAndImport')}
          </button>
        </div>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </section>
  );
}
