'use client';

import { ArrowRight, ChartScatter, Compass, Database, ExternalLink, FileCheck2, LockKeyhole, Sparkles, Workflow } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../app/AppProviders';
import { createExampleChecklist } from '../domain/checklist';
import { createProject } from '../domain/project';
import type { Locale } from '../domain/types';
import { saveProject } from '../storage/db';
import { NewProjectDialog } from './NewProjectDialog';

interface Stage {
  label: string;
  note: string;
}

/* The research journey, in order: databases → Simetrics (optional) → PRISMA Lab → diagram. */
const journey = [
  { Icon: Database },
  { Icon: ChartScatter, kind: 'optional', href: 'https://simetrics.app' },
  { Icon: Workflow, kind: 'current' },
  { Icon: FileCheck2 },
] as const;

const landingContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    emphasis: string;
    lead: string;
    primary: string;
    example: string;
    secondary: string;
    privacy: string;
    previewMeta: [string, string];
    previewStatus: string;
    stages: Stage[];
    optional: string;
    current: string;
  }
> = {
  'pt-BR': {
    eyebrow: 'PRISMA 2020 · dados locais · seis idiomas',
    title: 'PRISMA',
    emphasis: 'Lab',
    lead: 'Construa, verifique e publique diagramas PRISMA 2020 com orientação metodológica, cálculos rastreáveis e controle total dos seus dados.',
    primary: 'Criar meu diagrama',
    example: 'Explorar exemplo',
    secondary: 'Entender o PRISMA',
    privacy: 'Seus projetos permanecem neste navegador. Nenhum dado é enviado por padrão.',
    previewMeta: ['SUA JORNADA', 'DA BUSCA À PUBLICAÇÃO'],
    previewStatus: 'O Simetrics exporta um .json pronto para importar aqui',
    optional: 'opcional',
    current: 'você está aqui',
    stages: [
      { label: 'Bases científicas', note: 'Scopus, Web of Science, PubMed…' },
      { label: 'Simetrics', note: 'deduplicação e triagem → .json' },
      { label: 'PRISMA Lab', note: 'contagens, validação e checklist' },
      { label: 'Diagrama PRISMA 2020', note: 'pronto para a sua publicação' },
    ],
  },
  en: {
    eyebrow: 'PRISMA 2020 · local data · six languages',
    title: 'PRISMA',
    emphasis: 'Lab',
    lead: 'Build, check and publish PRISMA 2020 diagrams with methodological guidance, traceable calculations and full control of your data.',
    primary: 'Create my diagram',
    example: 'Explore example',
    secondary: 'Understand PRISMA',
    privacy: 'Projects stay in this browser. No data is sent by default.',
    previewMeta: ['YOUR JOURNEY', 'FROM SEARCH TO PUBLICATION'],
    previewStatus: 'Simetrics exports a .json ready to import here',
    optional: 'optional',
    current: 'you are here',
    stages: [
      { label: 'Scientific databases', note: 'Scopus, Web of Science, PubMed…' },
      { label: 'Simetrics', note: 'deduplication and screening → .json' },
      { label: 'PRISMA Lab', note: 'counts, validation and checklist' },
      { label: 'PRISMA 2020 diagram', note: 'ready for your publication' },
    ],
  },
  it: {
    eyebrow: 'PRISMA 2020 · dati locali · sei lingue',
    title: 'PRISMA',
    emphasis: 'Lab',
    lead: 'Crea, verifica e pubblica diagrammi PRISMA 2020 con guida metodologica, calcoli tracciabili e pieno controllo dei dati.',
    primary: 'Crea il diagramma',
    example: 'Esplora un esempio',
    secondary: 'Comprendere PRISMA',
    privacy: 'I progetti restano nel browser. Nessun dato viene inviato per impostazione predefinita.',
    previewMeta: ['IL TUO PERCORSO', 'DALLA RICERCA ALLA PUBBLICAZIONE'],
    previewStatus: 'Simetrics esporta un .json pronto da importare qui',
    optional: 'facoltativo',
    current: 'sei qui',
    stages: [
      { label: 'Banche dati scientifiche', note: 'Scopus, Web of Science, PubMed…' },
      { label: 'Simetrics', note: 'deduplicazione e screening → .json' },
      { label: 'PRISMA Lab', note: 'conteggi, validazione e checklist' },
      { label: 'Diagramma PRISMA 2020', note: 'pronto per la tua pubblicazione' },
    ],
  },
  fr: {
    eyebrow: 'PRISMA 2020 · données locales · six langues',
    title: 'PRISMA',
    emphasis: 'Lab',
    lead: 'Créez, vérifiez et publiez des diagrammes PRISMA 2020 avec des calculs traçables et le contrôle de vos données.',
    primary: 'Créer mon diagramme',
    example: 'Explorer un exemple',
    secondary: 'Comprendre PRISMA',
    privacy: 'Les projets restent dans ce navigateur. Aucune donnée n’est envoyée par défaut.',
    previewMeta: ['VOTRE PARCOURS', 'DE LA RECHERCHE À LA PUBLICATION'],
    previewStatus: 'Simetrics exporte un .json prêt à importer ici',
    optional: 'facultatif',
    current: 'vous êtes ici',
    stages: [
      { label: 'Bases de données scientifiques', note: 'Scopus, Web of Science, PubMed…' },
      { label: 'Simetrics', note: 'dédoublonnage et sélection → .json' },
      { label: 'PRISMA Lab', note: 'comptages, validation et checklist' },
      { label: 'Diagramme PRISMA 2020', note: 'prêt pour votre publication' },
    ],
  },
  de: {
    eyebrow: 'PRISMA 2020 · lokale Daten · sechs Sprachen',
    title: 'PRISMA',
    emphasis: 'Lab',
    lead: 'Erstellen, prüfen und veröffentlichen Sie PRISMA-2020-Diagramme mit nachvollziehbaren Berechnungen und voller Datenkontrolle.',
    primary: 'Diagramm erstellen',
    example: 'Beispiel erkunden',
    secondary: 'PRISMA verstehen',
    privacy: 'Projekte bleiben in diesem Browser. Daten werden standardmäßig nicht gesendet.',
    previewMeta: ['IHR WEG', 'VON DER SUCHE ZUR PUBLIKATION'],
    previewStatus: 'Simetrics exportiert eine .json, die Sie hier importieren können',
    optional: 'optional',
    current: 'Sie sind hier',
    stages: [
      { label: 'Wissenschaftliche Datenbanken', note: 'Scopus, Web of Science, PubMed…' },
      { label: 'Simetrics', note: 'Deduplizierung und Screening → .json' },
      { label: 'PRISMA Lab', note: 'Zählungen, Validierung und Checkliste' },
      { label: 'PRISMA-2020-Diagramm', note: 'bereit für Ihre Publikation' },
    ],
  },
  'zh-CN': {
    eyebrow: 'PRISMA 2020 · 本地数据 · 六种语言',
    title: 'PRISMA',
    emphasis: 'Lab',
    lead: '借助方法提示、可追溯计算和完全本地的数据控制，创建、检查并发布 PRISMA 2020 流程图。',
    primary: '创建流程图',
    example: '浏览示例',
    secondary: '了解 PRISMA',
    privacy: '项目保存在此浏览器中，默认不会发送任何数据。',
    previewMeta: ['你的研究路径', '从检索到发表'],
    previewStatus: 'Simetrics 导出的 .json 可直接导入此处',
    optional: '可选',
    current: '你在这里',
    stages: [
      { label: '科学数据库', note: 'Scopus、Web of Science、PubMed…' },
      { label: 'Simetrics', note: '去重与筛选 → .json' },
      { label: 'PRISMA Lab', note: '计数、校验与清单' },
      { label: 'PRISMA 2020 流程图', note: '可直接用于发表' },
    ],
  },
};

export function LandingPage() {
  const { locale, t } = useApp();
  const text = landingContent[locale] || landingContent['pt-BR'];
  const [choosing, setChoosing] = useState(false);

  const exploreExample = async () => {
    const project = createProject({ locale, model: 'new-databases-other', example: true });
    await saveProject({ ...project, checklist: createExampleChecklist() });
    window.location.href = `/builder?project=${project.id}`;
  };

  return (
    <main id="main-content" className="landing-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> {text.eyebrow}
          </p>
          <h1 id="hero-title">
            {text.title} <em>{text.emphasis}</em>
          </h1>
          <p className="hero-lead">{text.lead}</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => setChoosing(true)}>
              {text.primary} <ArrowRight size={17} />
            </button>
            <button className="secondary-button" type="button" onClick={exploreExample}>
              <Sparkles size={17} /> {text.example}
            </button>
            <a className="text-link" href="/learn">
              {text.secondary} ↘
            </a>
          </div>
          <a className="tour-link" href="/builder?tour=1">
            <Compass size={16} aria-hidden="true" /> {t('tourLandingCta')}
          </a>
          <p className="scientata-app-badge">
            <a href="https://scientata.com" target="_blank" rel="noopener noreferrer">
              {t('scientataApp')}
            </a>
          </p>
          <p className="privacy-note">
            <LockKeyhole size={16} /> {text.privacy}
          </p>
        </div>
        <div className="diagram-preview" aria-label={text.previewMeta[1]}>
          <div className="preview-meta">
            <span>{text.previewMeta[0]}</span>
            <span>{text.previewMeta[1]}</span>
          </div>
          <ol className="flow">
            {text.stages.map((stage, index) => {
              const { Icon, ...step } = journey[index];
              const kind = 'kind' in step ? step.kind : undefined;
              const body = (
                <>
                  <small>{stage.label}</small>
                  <span>{stage.note}</span>
                  {kind && <em className="flow-tag">{text[kind]}{'href' in step && <ExternalLink size={11} aria-hidden="true" />}</em>}
                </>
              );
              return (
                <li className="flow-step" key={stage.label}>
                  <span className="stage-icon"><Icon size={16} aria-hidden="true" /></span>
                  {'href' in step
                    ? <a className={`flow-card is-${kind}`} href={step.href} target="_blank" rel="noopener noreferrer">{body}</a>
                    : <div className={`flow-card${kind ? ` is-${kind}` : ''}`} aria-current={kind === 'current' ? 'step' : undefined}>{body}</div>}
                  {index < text.stages.length - 1 && <span className="flow-line" />}
                </li>
              );
            })}
          </ol>
          <div className="preview-status">
            <span className="status-dot" /> {text.previewStatus}
          </div>
        </div>
      </section>
      <NewProjectDialog open={choosing} onClose={() => setChoosing(false)} />
    </main>
  );
}
