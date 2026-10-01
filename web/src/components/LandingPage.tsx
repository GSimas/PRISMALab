'use client';

import { ArrowRight, Compass, LockKeyhole, Sparkles } from 'lucide-react';
import { useApp } from '../app/AppProviders';
import { createExampleChecklist } from '../domain/checklist';
import { createProject } from '../domain/project';
import type { Locale } from '../domain/types';
import { saveProject } from '../storage/db';

interface Stage {
  label: string;
  value: string;
  note: string;
}

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
    previewMeta: ['PRÉVIA DO FLUXO', 'EXEMPLO FICTÍCIO'],
    previewStatus: 'Estrutura compatível com o modelo selecionado',
    stages: [
      { label: 'Identificação', value: '2.481', note: 'registros encontrados' },
      { label: 'Triagem', value: '1.906', note: 'registros avaliados' },
      { label: 'Elegibilidade', value: '126', note: 'relatos avaliados' },
      { label: 'Inclusão', value: '34', note: 'estudos incluídos' },
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
    previewMeta: ['FLOW PREVIEW', 'SAMPLE WORKFLOW'],
    previewStatus: 'Structure compatible with the selected model',
    stages: [
      { label: 'Identification', value: '2,481', note: 'records found' },
      { label: 'Screening', value: '1,906', note: 'records screened' },
      { label: 'Eligibility', value: '126', note: 'reports assessed' },
      { label: 'Inclusion', value: '34', note: 'studies included' },
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
    previewMeta: ['ANTEPRIMA DEL FLUSSO', 'ESEMPIO FITTIZIO'],
    previewStatus: 'Struttura compatibile con il modello selezionato',
    stages: [
      { label: 'Identificazione', value: '2.481', note: 'record trovati' },
      { label: 'Screening', value: '1.906', note: 'record esaminati' },
      { label: 'Idoneità', value: '126', note: 'report valutati' },
      { label: 'Inclusione', value: '34', note: 'studi inclusi' },
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
    previewMeta: ['APERÇU DU FLUX', 'EXEMPLE FICTIF'],
    previewStatus: 'Structure compatible avec le modèle sélectionné',
    stages: [
      { label: 'Identification', value: '2 481', note: 'enregistrements trouvés' },
      { label: 'Sélection', value: '1 906', note: 'enregistrements examinés' },
      { label: 'Éligibilité', value: '126', note: 'rapports évalués' },
      { label: 'Inclusion', value: '34', note: 'études incluses' },
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
    previewMeta: ['FLUSS-VORSCHAU', 'BEISPIELABLAUF'],
    previewStatus: 'Struktur kompatibel mit dem gewählten Modell',
    stages: [
      { label: 'Identifikation', value: '2.481', note: 'Datensätze gefunden' },
      { label: 'Screening', value: '1.906', note: 'Datensätze geprüft' },
      { label: 'Eignung', value: '126', note: 'Berichte bewertet' },
      { label: 'Einschluss', value: '34', note: 'Studien eingeschlossen' },
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
    previewMeta: ['流程预览', '示例流程'],
    previewStatus: '与所选模型兼容的结构',
    stages: [
      { label: '识别', value: '2,481', note: '条检索到的记录' },
      { label: '筛选', value: '1,906', note: '条已筛选的记录' },
      { label: '合格性', value: '126', note: '份已评估的报告' },
      { label: '纳入', value: '34', note: '项已纳入的研究' },
    ],
  },
};

export function LandingPage() {
  const { locale, t } = useApp();
  const text = landingContent[locale] || landingContent['pt-BR'];

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
            <a className="primary-button" href="/builder">
              {text.primary} <ArrowRight size={17} />
            </a>
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
          <div className="flow">
            {text.stages.map((stage, index) => (
              <div className="flow-step" key={stage.label}>
                <span className="stage-number">0{index + 1}</span>
                <div className="flow-card">
                  <small>{stage.label}</small>
                  <strong>{stage.value}</strong>
                  <span>{stage.note}</span>
                </div>
                {index < text.stages.length - 1 && <span className="flow-line" />}
              </div>
            ))}
          </div>
          <div className="preview-status">
            <span className="status-dot" /> {text.previewStatus}
          </div>
        </div>
      </section>
    </main>
  );
}
