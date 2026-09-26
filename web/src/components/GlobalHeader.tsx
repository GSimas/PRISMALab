'use client';

import { useRef } from 'react';
import { Menu, Plus, Settings2 } from 'lucide-react';
import { useApp } from '../app/AppProviders';
import { localeNames } from '../i18n/translations';
import { supportedLocales } from '../i18n/locale';

export function GlobalHeader() {
  const { ready, locale, setLocale, theme, setTheme, accessibility, setAccessibility, restoreAccessibility, t } = useApp();
  const settingsMenu = useRef<HTMLDetailsElement>(null);
  const navMenu = useRef<HTMLDetailsElement>(null);
  return (
    <>
      <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
      <header className="global-header">
        {/* A full page load, like the nav links: next/link's client router throws in the static vinext export. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="brand" href="/" aria-label="PRISMA Lab">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><rect x="3" y="3" width="18" height="4" rx="1.2" /><rect x="6" y="10" width="12" height="4" rx="1.2" /><rect x="9" y="17" width="6" height="4" rx="1.2" /></svg>
          </span>
          <span><strong>PRISMA Lab</strong><small>{t('scientataApp')}</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <a href="/learn">{t('learn')}</a>
          <a href="/projects">{t('projects')}</a>
          <a href="/guidelines">{t('guidelines')}</a>
          <a href="/about">{t('about')}</a>
        </nav>
        <div className="header-tools">
          <details className="settings-menu" ref={settingsMenu} onToggle={(event) => { if (event.currentTarget.open && navMenu.current) navMenu.current.open = false; }}>
            <summary aria-label={t('settings')} title={t('settings')}><Settings2 size={18} aria-hidden="true" /></summary>
            <div className="settings-panel">
              <label>{t('language')}
                <select disabled={!ready} value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>
                  {supportedLocales.map((code) => <option key={code} value={code}>{localeNames[code]}</option>)}
                </select>
              </label>
              <label>{t('theme')}
                <select disabled={!ready} value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)}>
                  <option value="system">{t('system')}</option>
                  <option value="light">{t('light')}</option>
                  <option value="dark">{t('dark')}</option>
                </select>
              </label>
              <fieldset className="settings-a11y">
                <legend>{t('accessibility')}</legend>
                <label>{t('fontSize')}
                  <select value={accessibility.fontScale} onChange={(event) => setAccessibility({ ...accessibility, fontScale: Number(event.target.value) as 1 | 1.125 | 1.25 })}>
                    <option value="1">100%</option><option value="1.125">112%</option><option value="1.25">125%</option>
                  </select>
                </label>
                <label className="check-row"><input type="checkbox" checked={accessibility.contrast} onChange={(event) => setAccessibility({ ...accessibility, contrast: event.target.checked })} /> {t('highContrast')}</label>
                <label className="check-row"><input type="checkbox" checked={accessibility.reduceMotion} onChange={(event) => setAccessibility({ ...accessibility, reduceMotion: event.target.checked })} /> {t('reduceMotion')}</label>
                <button className="text-button" type="button" onClick={restoreAccessibility}>{t('restore')}</button>
              </fieldset>
            </div>
          </details>
          <a className="header-scientata-link" href="https://scientata.com" target="_blank" rel="noopener noreferrer" title="Scientata">Scientata</a>
          <a className="header-primary" href="/builder"><Plus size={16} aria-hidden="true" /> <span>{t('newDiagram')}</span></a>
          <details className="mobile-menu" ref={navMenu} onToggle={(event) => { if (event.currentTarget.open && settingsMenu.current) settingsMenu.current.open = false; }}>
            <summary aria-label="Menu"><Menu size={20} aria-hidden="true" /></summary>
            <nav aria-label="Navegação móvel">
              <a href="/learn">{t('learn')}</a>
              <a href="/projects">{t('projects')}</a><a href="/guidelines">{t('guidelines')}</a><a href="/about">{t('about')}</a>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
