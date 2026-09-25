'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useApp } from '../../app/AppProviders';
import { withViewTransition } from '../../app/motion';
import type { TranslationKey } from '../../i18n/translations';
import { aboutContent, accessibilityContent, licenseContent, methodologyContent, privacyContent, sourceLinks, sourcesContent } from './content';

export const aboutTabs = ['about', 'methodology', 'privacy', 'accessibility', 'sources', 'license'] as const satisfies readonly TranslationKey[];
export type AboutTab = (typeof aboutTabs)[number];

const isAboutTab = (value: string | null): value is AboutTab => aboutTabs.includes(value as AboutTab);

/** The About page: every institutional section is a tab here, selected via `?tab=`. */
export function AboutPage() {
  const { locale, t } = useApp();
  const [tab, setTab] = useState<AboutTab>('about');
  const tabRefs = useRef<Partial<Record<AboutTab, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const syncFromUrl = () => {
      const requested = new URLSearchParams(window.location.search).get('tab');
      setTab(isAboutTab(requested) ? requested : 'about');
    };
    const initial = window.setTimeout(syncFromUrl, 0);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  const select = (next: AboutTab, focus = false) => {
    if (next === tab) return;
    window.history.replaceState(null, '', next === 'about' ? '/about' : `/about?tab=${next}`);
    // The view transition morphs the tab indicator and crossfades the content.
    withViewTransition(() => flushSync(() => setTab(next)));
    if (focus) tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = aboutTabs.indexOf(tab);
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: aboutTabs.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(aboutTabs[(moves[event.key] + aboutTabs.length) % aboutTabs.length], true);
  };

  const { eyebrow, title, lead, body } = renderTab(tab, locale);

  return (
    <main id="main-content" className="content-page info-page">
      <div className="about-tabs" role="tablist" aria-label={t('about')} onKeyDown={onKeyDown}>
        {aboutTabs.map((id) => (
          <button
            key={id}
            ref={(element) => { tabRefs.current[id] = element; }}
            type="button"
            role="tab"
            id={`about-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="about-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => select(id)}
          >
            {t(id)}
            {tab === id && <span className="about-tab-indicator" aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="about-panel" id="about-panel" role="tabpanel" aria-labelledby={`about-tab-${tab}`} key={tab}>
        <header className="page-hero compact"><div><p className="eyebrow"><span /> {eyebrow}</p><h1>{title}</h1><p>{lead}</p></div></header>
        <article className="prose-page">{body}</article>
      </div>
    </main>
  );
}

function renderTab(tab: AboutTab, locale: keyof typeof aboutContent): { eyebrow: string; title: string; lead: string; body: ReactNode } {
  switch (tab) {
    case 'about': {
      const text = aboutContent[locale] || aboutContent['pt-BR'];
      return {
        ...text,
        body: (
          <>
            <h2>{text.purposeTitle}</h2>
            <p>{text.purposeBody}</p>
            <h2>{text.principlesTitle}</h2>
            <ul>{text.principles.map((item) => <li key={item}>{item}</li>)}</ul>
            <h2>{text.faqTitle}</h2>
            {text.faq.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </>
        ),
      };
    }
    case 'methodology': {
      const text = methodologyContent[locale] || methodologyContent['pt-BR'];
      return {
        ...text,
        body: (
          <>
            <h2>{text.positioningTitle}</h2>
            <p>{text.positioningBody}</p>
            <h2>{text.calculationsTitle}</h2>
            <p>{text.calculationsBody}</p>
            <h2>{text.rulesTitle}</h2>
            <ul>{text.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
            <h2>{text.limitsTitle}</h2>
            <p>{text.limitsBody}</p>
          </>
        ),
      };
    }
    case 'privacy': {
      const text = privacyContent[locale] || privacyContent['pt-BR'];
      return {
        ...text,
        body: (
          <>
            <h2>{text.storageTitle}</h2>
            <p>{text.storageBody}</p>
            <h2>{text.exportsTitle}</h2>
            <p>{text.exportsBody}</p>
            <h2>{text.respTitle}</h2>
            <p>{text.respBody}</p>
          </>
        ),
      };
    }
    case 'accessibility': {
      const text = accessibilityContent[locale] || accessibilityContent['pt-BR'];
      return {
        ...text,
        body: (
          <>
            <h2>{text.featuresTitle}</h2>
            <ul>{text.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <h2>{text.limitsTitle}</h2>
            <p>{text.limitsBody}</p>
          </>
        ),
      };
    }
    case 'sources': {
      const text = sourcesContent[locale] || sourcesContent['pt-BR'];
      return {
        ...text,
        body: (
          <>
            <h2>{text.guidelineTitle}</h2>
            <p>{text.guidelineBody}</p>
            <h2>{text.sourcesTitle}</h2>
            <ol className="source-list">
              {sourceLinks.map(([name, href]) => (
                <li key={href}><a href={href} target="_blank" rel="noopener noreferrer">{name}</a></li>
              ))}
            </ol>
            <h2>{text.refsTitle}</h2>
            <p>Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. <em>BMJ</em>. 2021;372:n71. doi:10.1136/bmj.n71.</p>
            <p>Page MJ, Moher D, Bossuyt PM, et al. PRISMA 2020 explanation and elaboration. <em>BMJ</em>. 2021;372:n160. doi:10.1136/bmj.n160.</p>
            <p>Haddaway NR, Page MJ, Pritchard CC, McGuinness LA. PRISMA2020: An R package and Shiny app. <em>Campbell Systematic Reviews</em>. 2022;18:e1230. doi:10.1002/cl2.1230.</p>
            <h2>{text.transTitle}</h2>
            <p>{text.transBody}</p>
            <h2>{text.licenseTitle}</h2>
            <p>{text.licenseBody}</p>
          </>
        ),
      };
    }
    case 'license': {
      const text = licenseContent[locale] || licenseContent['pt-BR'];
      return {
        ...text,
        body: (
          <>
            <h2>{text.codeTitle}</h2>
            <p>{text.codeBody}</p>
            <h2>{text.prismaTitle}</h2>
            <p>{text.prismaBody}</p>
            <h2>{text.libsTitle}</h2>
            <p>{text.libsBody}</p>
          </>
        ),
      };
    }
  }
}
