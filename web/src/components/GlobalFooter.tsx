'use client';

import { Coffee } from 'lucide-react';
import { useApp } from '../app/AppProviders';

export function GlobalFooter() {
  const { t } = useApp();
  return (
    <>
      <footer className="global-footer">
        <p><a href="https://scientata.com" target="_blank" rel="noopener noreferrer">{t('scientataApp')}</a></p>
        <nav aria-label="Links institucionais">
          <a href="/about">{t('about')}</a>
        </nav>
        <small>{t('independentTool')}</small>
      </footer>
      <aside className="coffee-region" aria-label={t('coffee')}>
        <a className="coffee-button" href="https://link.mercadopago.com.br/strangerhits" target="_blank" rel="noopener noreferrer" aria-label={t('coffee')} title={t('coffee')}>
          <Coffee size={18} aria-hidden="true" /><span>{t('coffee')}</span>
        </a>
      </aside>
    </>
  );
}
