'use client';

import { ArrowRight, Compass, Database, FileDown, Languages, LockKeyhole, Network, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react';
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

interface Feature {
  title: string;
  description: string;
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
    sectionKicker: string;
    section: string;
    sectionLead: string;
    previewMeta: [string, string];
    previewStatus: string;
    stages: Stage[];
    features: Feature[];
    independenceTitle: string;
    independenceBody: string;
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
    sectionKicker: 'ASSISTÊNCIA AO RELATO',
    section: 'Uma ferramenta de relato, não um atalho metodológico.',
    sectionLead: 'Cada recurso preserva a distinção entre registros, relatos e estudos — sem corrigir dados silenciosamente.',
    previewMeta: ['PRÉVIA DO FLUXO', 'EXEMPLO FICTÍCIO'],
    previewStatus: 'Estrutura compatível com o modelo selecionado',
    stages: [
      { label: 'Identificação', value: '2.481', note: 'registros encontrados' },
      { label: 'Triagem', value: '1.906', note: 'registros avaliados' },
      { label: 'Elegibilidade', value: '126', note: 'relatos avaliados' },
      { label: 'Inclusão', value: '34', note: 'estudos incluídos' },
    ],
    features: [
      { title: 'Quatro modelos oficiais', description: 'Revisões novas ou atualizadas, com bases e registros ou também outras fontes.' },
      { title: 'Validação explicável', description: 'Cada alerta mostra o que ocorreu, por que importa e quais valores revisar.' },
      { title: 'Publicação científica', description: 'PDF e SVG vetoriais, PNG, HTML interativo, dados, relatório e pacote ZIP.' },
      { title: 'Seis idiomas', description: 'Português, inglês, italiano, francês, alemão e chinês simplificado.' },
      { title: 'Checklist integrado', description: 'Acompanhe os 27 itens, a localização no manuscrito e o progresso por seção.' },
      { title: 'Local-first', description: 'IndexedDB, salvamento automático, backups portáteis e funcionamento sem login.' },
    ],
    independenceTitle: 'Independente por definição.',
    independenceBody: 'Baseado no PRISMA 2020. As verificações avaliam a consistência do diagrama e auxiliam na clareza do relato metodológico.',
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
    sectionKicker: 'REPORTING ASSISTANCE',
    section: 'A reporting tool, not a methodological shortcut.',
    sectionLead: 'Every feature preserves the distinction between records, reports and studies—without silently correcting data.',
    previewMeta: ['FLOW PREVIEW', 'SAMPLE WORKFLOW'],
    previewStatus: 'Structure compatible with the selected model',
    stages: [
      { label: 'Identification', value: '2,481', note: 'records found' },
      { label: 'Screening', value: '1,906', note: 'records screened' },
      { label: 'Eligibility', value: '126', note: 'reports assessed' },
      { label: 'Inclusion', value: '34', note: 'studies included' },
    ],
    features: [
      { title: 'Four official models', description: 'New or updated reviews, via databases & registers or also other methods.' },
      { title: 'Explainable validation', description: 'Every issue shows what happened, why it matters, and which counts to inspect.' },
      { title: 'Scientific publishing', description: 'Vector PDF and SVG, PNG, interactive HTML, datasets, report and ZIP bundle.' },
      { title: 'Six languages', description: 'Portuguese, English, Italian, French, German, and Simplified Chinese.' },
      { title: 'Integrated checklist', description: 'Track all 27 items, manuscript location, and section completion.' },
      { title: 'Local-first', description: 'IndexedDB, autosave, portable backups, and full workflow without sign-in.' },
    ],
    independenceTitle: 'Independent by design.',
    independenceBody: 'Based on PRISMA 2020. Validations inspect diagram consistency and assist transparent methodological reporting.',
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
    sectionKicker: 'ASSISTENZA AL REPORTING',
    section: 'Uno strumento di reporting, non una scorciatoia metodologica.',
    sectionLead: 'Ogni funzione distingue record, report e studi senza correggere silenziosamente i dati.',
    previewMeta: ['ANTEPRIMA DEL FLUSSO', 'ESEMPIO FITTIZIO'],
    previewStatus: 'Struttura compatibile con il modello selezionato',
    stages: [
      { label: 'Identificazione', value: '2.481', note: 'record trovati' },
      { label: 'Screening', value: '1.906', note: 'record esaminati' },
      { label: 'Idoneità', value: '126', note: 'report valutati' },
      { label: 'Inclusione', value: '34', note: 'studi inclusi' },
    ],
    features: [
      { title: 'Quattro modelli ufficiali', description: 'Revisioni nuove o aggiornate, con banche dati e registri o altre fonti.' },
      { title: 'Validazione spiegabile', description: 'Ogni avviso mostra cosa è successo, perché è importante e quali valori rivedere.' },
      { title: 'Pubblicazione scientifica', description: 'PDF e SVG vettoriali, PNG, HTML interattivo, dati, report e archivio ZIP.' },
      { title: 'Sei lingue', description: 'Portoghese, inglese, italiano, francese, tedesco e cinese semplificato.' },
      { title: 'Checklist integrata', description: 'Segui i 27 elementi, la posizione nel manoscritto e i progressi per sezione.' },
      { title: 'Local-first', description: 'IndexedDB, salvataggio automatico, backup portatili e nessun login richiesto.' },
    ],
    independenceTitle: 'Indipendente per definizione.',
    independenceBody: 'Basato su PRISMA 2020. I controlli valutano la coerenza del diagramma e supportano la chiarezza del reporting.',
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
    sectionKicker: 'AIDE AU COMPTE RENDU',
    section: 'Un outil de compte rendu, pas un raccourci méthodologique.',
    sectionLead: 'Chaque fonction distingue enregistrements, rapports et études sans corriger silencieusement les données.',
    previewMeta: ['APERÇU DU FLUX', 'EXEMPLE FICTIF'],
    previewStatus: 'Structure compatible avec le modèle sélectionné',
    stages: [
      { label: 'Identification', value: '2 481', note: 'enregistrements trouvés' },
      { label: 'Sélection', value: '1 906', note: 'enregistrements examinés' },
      { label: 'Éligibilité', value: '126', note: 'rapports évalués' },
      { label: 'Inclusion', value: '34', note: 'études incluses' },
    ],
    features: [
      { title: 'Quatre modèles officiels', description: 'Revues nouvelles ou mises à jour, via bases et registres ou autres sources.' },
      { title: 'Validation explicable', description: 'Chaque alerte indique ce qui s’est passé, son importance et les valeurs à réviser.' },
      { title: 'Publication scientifique', description: 'PDF et SVG vectoriels, PNG, HTML interactif, jeux de données, rapport et ZIP.' },
      { title: 'Six langues', description: 'Portugais, anglais, italien, français, allemand et chinois simplifié.' },
      { title: 'Liste de contrôle intégrée', description: 'Suivez les 27 items, l’emplacement dans le manuscrit et l’état par section.' },
      { title: 'Local-first', description: 'IndexedDB, sauvegarde automatique, exports portables et fonctionnement sans compte.' },
    ],
    independenceTitle: 'Indépendant par conception.',
    independenceBody: 'Basé sur PRISMA 2020. Les vérifications évaluent la cohérence du diagramme et favorisent la transparence méthodologique.',
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
    sectionKicker: 'BERICHTSHILFE',
    section: 'Ein Berichtswerkzeug, keine methodische Abkürzung.',
    sectionLead: 'Jede Funktion unterscheidet Datensätze, Berichte und Studien, ohne Daten stillschweigend zu korrigieren.',
    previewMeta: ['FLUSS-VORSCHAU', 'BEISPIELABLAUF'],
    previewStatus: 'Struktur kompatibel mit dem gewählten Modell',
    stages: [
      { label: 'Identifikation', value: '2.481', note: 'Datensätze gefunden' },
      { label: 'Screening', value: '1.906', note: 'Datensätze geprüft' },
      { label: 'Eignung', value: '126', note: 'Berichte bewertet' },
      { label: 'Einschluss', value: '34', note: 'Studien eingeschlossen' },
    ],
    features: [
      { title: 'Vier offizielle Modelle', description: 'Neue oder aktualisierte Reviews, über Datenbanken & Register oder weitere Methoden.' },
      { title: 'Nachvollziehbare Validierung', description: 'Jeder Hinweis erklärt Ursache, Relevanz und erforderliche Korrekturen.' },
      { title: 'Wissenschaftliche Publikation', description: 'Vektor-PDF und SVG, PNG, interaktives HTML, Datensätze, Bericht und ZIP.' },
      { title: 'Sechs Sprachen', description: 'Portugiesisch, Englisch, Italienisch, Französisch, Deutsch und vereinfachtes Chinesisch.' },
      { title: 'Integrierte Checkliste', description: 'Alle 27 Items, Fundstellen im Manuskript und Fortschritt je Abschnitt erfassen.' },
      { title: 'Local-first', description: 'IndexedDB, automatisches Speichern, portable Sicherungen und ohne Login.' },
    ],
    independenceTitle: 'Unabhängig im Konzept.',
    independenceBody: 'Basierend auf PRISMA 2020. Die Prüfungen analysieren die Diagrammkonsistenz und unterstützen transparente Berichterstattung.',
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
    sectionKicker: '报告撰写辅助',
    section: '报告工具，而非方法学捷径。',
    sectionLead: '每项功能都区分记录、报告和研究，绝不静默修改数据。',
    previewMeta: ['流程预览', '示例流程'],
    previewStatus: '与所选模型兼容的结构',
    stages: [
      { label: '识别', value: '2,481', note: '条检索到的记录' },
      { label: '筛选', value: '1,906', note: '条已筛选的记录' },
      { label: '合格性', value: '126', note: '份已评估的报告' },
      { label: '纳入', value: '34', note: '项已纳入的研究' },
    ],
    features: [
      { title: '四种官方模型', description: '支持新综述与更新综述，涵盖数据库、注册平台及其他检索方法。' },
      { title: '可解释性验证', description: '每条提示均详述原因、重要性以及需要复核的具体数值。' },
      { title: '科学论文发表', description: '支持矢量 PDF、SVG、PNG、交互式 HTML、数据集、报告与 ZIP 压缩包。' },
      { title: '六种语言支持', description: '支持葡萄牙语、英语、意大利语、法语、德语及简体中文。' },
      { title: '内置核对清单', description: '追踪全部 27 个条目、在文稿中的具体页码位置以及各章节完成进度。' },
      { title: '本地优先架构', description: '基于 IndexedDB 自动保存，支持便携备份，无需注册登录即可使用。' },
    ],
    independenceTitle: '独立构建，科学中立。',
    independenceBody: '基于 PRISMA 2020 规范构建。验证规则专注于流程图的内在逻辑一致性，提升方法学报告的透明度。',
  },
};

const featureIcons = [Network, ShieldCheck, FileDown, Languages, ScanSearch, Database];

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

      <section className="home-intro">
        <p className="kicker">{text.sectionKicker}</p>
        <h2>{text.section}</h2>
        <p>{text.sectionLead}</p>
      </section>

      <section className="feature-grid">
        {text.features.map((feature, index) => {
          const Icon = featureIcons[index] || Network;
          return (
            <article key={feature.title}>
              <Icon />
              <span>0{index + 1}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          );
        })}
      </section>

      <section className="independence-note">
        <ShieldCheck size={26} />
        <div>
          <h2>{text.independenceTitle}</h2>
          <p>{text.independenceBody}</p>
        </div>
      </section>
    </main>
  );
}
