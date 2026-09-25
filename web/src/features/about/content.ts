import type { Locale } from '../../domain/types';

// Content of every tab on the About page, per locale.

export const aboutContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    purposeTitle: string;
    purposeBody: string;
    principlesTitle: string;
    principles: string[];
    faqTitle: string;
    faq: [string, string][];
  }
> = {
  'pt-BR': {
    eyebrow: 'PROJETO AUTORAL · CIÊNCIA ABERTA',
    title: 'Sobre o PRISMA Lab',
    lead: 'Uma ferramenta independente para transformar contagens e decisões documentadas em relatos mais claros, rastreáveis e publicáveis.',
    purposeTitle: 'Propósito',
    purposeBody: 'O PRISMA Lab atende pesquisadores, estudantes, bibliotecários, orientadores, revisores e editores envolvidos em síntese de evidências. Ele combina educação, edição vetorial, validação numérica, checklist e exportação científica.',
    principlesTitle: 'Princípios',
    principles: [
      'Dados locais e portáteis.',
      'Regras determinísticas e explicáveis.',
      'Sem correções silenciosas de dados científicos.',
      'Acessibilidade e internacionalização desde o modelo de domínio.',
      'Independência institucional explícita.',
    ],
    faqTitle: 'Perguntas frequentes',
    faq: [
      ['O PRISMA Lab certifica uma revisão?', 'Não. A aplicação verifica a consistência do diagrama e auxilia o relato, mas não certifica o manuscrito nem garante aceitação editorial.'],
      ['Meus dados são enviados a um servidor?', 'Não por padrão. Projetos e exportações são processados localmente no navegador.'],
      ['Qual é a diferença entre estudo e relato?', 'Um estudo é a investigação única; um ou mais documentos — os relatos — podem descrever o mesmo estudo.'],
      ['Posso usar o diagrama em uma publicação?', 'Sim, respeitando a atribuição CC BY 4.0 dos templates PRISMA 2020 e as políticas da revista.'],
    ],
  },
  en: {
    eyebrow: 'AUTHORIAL PROJECT · OPEN SCIENCE',
    title: 'About PRISMA Lab',
    lead: 'An independent tool to transform counts and documented decisions into clearer, traceable and publishable reporting.',
    purposeTitle: 'Purpose',
    purposeBody: 'PRISMA Lab serves researchers, students, librarians, advisors, peer reviewers and editors involved in evidence synthesis. It combines education, vector diagram editing, numerical validation, checklist tracking and scientific export.',
    principlesTitle: 'Principles',
    principles: [
      'Local-first and portable data.',
      'Deterministic and explainable rule engine.',
      'No silent corrections of scientific data.',
      'Accessibility and internationalization built in from domain model.',
      'Explicit institutional independence.',
    ],
    faqTitle: 'Frequently Asked Questions',
    faq: [
      ['Does PRISMA Lab certify a review?', 'No. The application verifies diagram consistency and assists reporting, but does not certify the manuscript or guarantee editorial acceptance.'],
      ['Is my data sent to a server?', 'No by default. Projects and exports are processed locally in your browser.'],
      ['What is the difference between a study and a report?', 'A study is the unique investigation; one or more documents (reports) may describe the same study.'],
      ['Can I use the diagram in a publication?', 'Yes, respecting CC BY 4.0 attribution of PRISMA 2020 templates and journal editorial policies.'],
    ],
  },
  it: {
    eyebrow: 'PROGETTO AUTORIALE · SCIENZA APERTA',
    title: 'Informazioni su PRISMA Lab',
    lead: 'Uno strumento indipendente per trasformare conteggi e decisioni documentate in report più chiari, tracciabili e pubblicabili.',
    purposeTitle: 'Scopo',
    purposeBody: 'PRISMA Lab serve ricercatori, studenti, bibliotecari, revisori ed editori coinvolti nella sintesi delle evidenze. Combina istruzione, editing vettoriale, validazione numerica, checklist ed esportazione scientifica.',
    principlesTitle: 'Principi',
    principles: [
      'Dati locali e portatili.',
      'Regole deterministiche e spiegabili.',
      'Nessuna correzione silenziosa dei dati scientifici.',
      'Accessibilità e internazionalizzazione native.',
      'Indipendenza istituzionale esplicita.',
    ],
    faqTitle: 'Domande frequenti',
    faq: [
      ['PRISMA Lab certifica una revisione?', 'No. L’applicazione verifica la coerenza del diagramma ma non certifica il manoscritto.'],
      ['I miei dati vengono inviati a un server?', 'No. Progetti ed esportazioni sono elaborati localmente nel browser.'],
      ['Qual è la differenza tra studio e report?', 'Uno studio è l’indagine unica; più documenti (report) possono descrivere lo stesso studio.'],
      ['Posso usare il diagramma in una pubblicazione?', 'Sì, rispettando l’attribuzione CC BY 4.0 dei template PRISMA 2020.'],
    ],
  },
  fr: {
    eyebrow: 'PROJET D’AUTEUR · SCIENCE OUVERTE',
    title: 'À propos de PRISMA Lab',
    lead: 'Un outil indépendant pour transformer données et décisions documentées en comptes rendus plus clairs, traçables et publiables.',
    purposeTitle: 'Objectif',
    purposeBody: 'PRISMA Lab s’adresse aux chercheurs, étudiants, bibliothécaires, évaluateurs et éditeurs impliqués dans la synthèse des données probantes.',
    principlesTitle: 'Principes',
    principles: [
      'Données locales et portables.',
      'Règles déterministes et explicables.',
      'Aucune correction silencieuse de données scientifiques.',
      'Accessibilité et internationalisation dès la conception.',
      'Indépendance institutionnelle explicite.',
    ],
    faqTitle: 'Foire aux questions',
    faq: [
      ['PRISMA Lab certifie-t-il une revue ?', 'Non. L’application vérifie la cohérence du diagramme et aide à la rédaction, mais ne certifie pas le manuscrit.'],
      ['Mes données sont-elles envoyées à un serveur ?', 'Non par défaut. Projets et exports sont traités localement dans le navigateur.'],
      ['Quelle est la différence entre une étude et un rapport ?', 'Une étude est l’investigation unique ; plusieurs documents (rapports) peuvent décrire la même étude.'],
      ['Puis-je utiliser le diagramme dans une publication ?', 'Oui, conformément à la licence CC BY 4.0 des modèles PRISMA 2020.'],
    ],
  },
  de: {
    eyebrow: 'AUTORENPROJEKT · OFFENE WISSENSCHAFT',
    title: 'Über PRISMA Lab',
    lead: 'Ein unabhängiges Werkzeug zur Erstellung transparenter, nachvollziehbarer und veröffentlichungsreifer Berichte.',
    purposeTitle: 'Zweck',
    purposeBody: 'PRISMA Lab richtet sich an Forschende, Studierende, Bibliothekar:innen, Gutachter:innen und Herausgeber:innen in der Evidenzsynthese.',
    principlesTitle: 'Prinzipien',
    principles: [
      'Lokale und portable Daten.',
      'Deterministisches und erklärbares Regelwerk.',
      'Keine stillschweigenden Datenkorrekturen.',
      'Barrierefreiheit und Internationalisierung.',
      'Explizite institutionelle Unabhängigkeit.',
    ],
    faqTitle: 'Häufig gestellte Fragen',
    faq: [
      ['Zertifiziert PRISMA Lab ein Review?', 'Nein. Das Werkzeug prüft Diagrammkonsistenz, zertifiziert jedoch kein Manuskript.'],
      ['Werden meine Daten an einen Server gesendet?', 'Nein. Projekte und Exporte werden lokal im Browser verarbeitet.'],
      ['Was ist der Unterschied zwischen Studie und Bericht?', 'Eine Studie ist die eindeutige Untersuchung; mehrere Berichte können dieselbe Studie beschreiben.'],
      ['Darf das Diagramm veröffentlicht werden?', 'Ja, unter Einhaltung der CC BY 4.0-Lizenz der PRISMA-2020-Vorlagen.'],
    ],
  },
  'zh-CN': {
    eyebrow: '原创项目 · 开放科学',
    title: '关于 PRISMA Lab',
    lead: '一款将文献计数和筛选决定转化为清晰、可追溯且易于发表之报告的独立学术工具。',
    purposeTitle: '宗旨',
    purposeBody: 'PRISMA Lab 致力于服务从事证据综合的研究人员、学生、图书情报专家、导师、审稿专家及期刊编辑。系统集方法学教育、矢量流程图编辑、数值验证、核对清单追踪与学术导出于一体。',
    principlesTitle: '核心原则',
    principles: [
      '本地优先与便携数据架构。',
      '确定性且具可解释性的规则引擎。',
      '绝不静默篡改或修正科学数据。',
      '自领域模型起即融入无障碍与国际化支持。',
      '明确的学术与机构独立性。',
    ],
    faqTitle: '常见问题解答',
    faq: [
      ['PRISMA Lab 是否对系统综述进行认证？', '不对。本工具用于核对流程图逻辑一致性并辅助规范化报告，不代表对稿件的认证，亦不保证期刊录用。'],
      ['我的数据是否会上传至服务器？', '默认不会。所有项目与导出文件均在您的本地浏览器中完成处理。'],
      ['研究与报告有何区别？', '研究是唯一的科学调查；一份或多份文献/出版物（即报告）可以共同描述同一项研究。'],
      ['我可以在学术发表中使用生成的流程图吗？', '可以，请遵守 PRISMA 2020 模板的 CC BY 4.0 署名协议及所在期刊的发表政策。'],
    ],
  },
};

export const methodologyContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    positioningTitle: string;
    positioningBody: string;
    calculationsTitle: string;
    calculationsBody: string;
    rulesTitle: string;
    rules: string[];
    limitsTitle: string;
    limitsBody: string;
  }
> = {
  'pt-BR': {
    eyebrow: 'REGRAS EXPLÍCITAS',
    title: 'Metodologia da aplicação',
    lead: 'O sistema modela registros, relatos e estudos como unidades diferentes e deriva valores apenas quando a relação é metodologicamente defensável.',
    positioningTitle: 'Posicionamento',
    positioningBody: 'PRISMA é uma diretriz para melhorar a transparência e a completude do relato de revisões; não é uma metodologia para executar a revisão. O aplicativo oferece assistência ao relato e validação de consistência do diagrama.',
    calculationsTitle: 'Cálculos',
    calculationsBody: 'Valores derivados exibem a memória da operação. Sobrescrições manuais exigem justificativa e permanecem marcadas. Nenhum total é modificado apenas para “fechar” o fluxo.',
    rulesTitle: 'Classificação das regras',
    rules: [
      'Válida: relação verificada e consistente.',
      'Atenção: situação possível que merece revisão.',
      'Inconsistência: relação numérica incompatível.',
      'Informação ausente: campo necessário sem valor.',
      'Não aplicável: etapa fora do modelo selecionado.',
    ],
    limitsTitle: 'Limite',
    limitsBody: 'As verificações não avaliam integralmente a estratégia de busca, critérios, risco de viés, síntese ou qualidade científica do manuscrito.',
  },
  en: {
    eyebrow: 'EXPLICIT RULES',
    title: 'Application Methodology',
    lead: 'The system models records, reports and studies as distinct units and only derives values when mathematically and methodologically sound.',
    positioningTitle: 'Positioning',
    positioningBody: 'PRISMA is a reporting guideline to improve transparency and completeness; it is not a methodology for conducting reviews. The application provides reporting assistance and diagram consistency checks.',
    calculationsTitle: 'Calculations',
    calculationsBody: 'Derived values display calculation memory. Manual overrides require justification and remain tracked. No total is artificially altered just to force the flow to close.',
    rulesTitle: 'Rule Classification',
    rules: [
      'Valid: verified consistent relationship.',
      'Attention: possible situation worth reviewing.',
      'Inconsistency: incompatible numerical relationship.',
      'Missing information: required field without value.',
      'Not applicable: stage outside the selected model.',
    ],
    limitsTitle: 'Limitations',
    limitsBody: 'Validations do not evaluate search strategies, inclusion criteria validity, risk of bias assessments, synthesis models, or scientific quality.',
  },
  it: {
    eyebrow: 'REGOLE ESPLICITE',
    title: 'Metodologia dell’applicazione',
    lead: 'Il sistema modella record, report e studi come unità distinte e deriva i valori solo quando metodologicamente fondato.',
    positioningTitle: 'Posizionamento',
    positioningBody: 'PRISMA è una linea guida per migliorare la trasparenza del reporting; non è una metodologia per condurre la revisione.',
    calculationsTitle: 'Calcoli',
    calculationsBody: 'I valori derivati mostrano la memoria di calcolo. Le modifiche manuali richiedono una motivazione.',
    rulesTitle: 'Classificazione delle regole',
    rules: [
      'Valida: relazione verificata e coerente.',
      'Attenzione: situazione possibile che merita revisione.',
      'Incoerenza: relazione numerica incompatibile.',
      'Informazione mancante: campo necessario privo di valore.',
      'Non applicabile: fase non inclusa nel modello.',
    ],
    limitsTitle: 'Limiti',
    limitsBody: 'I controlli non valutano la strategia di ricerca o la qualità scientifica del manoscritto.',
  },
  fr: {
    eyebrow: 'RÈGLES EXPLICITES',
    title: 'Méthodologie de l’application',
    lead: 'Le système modélise les enregistrements, rapports et études comme des unités distinctes et ne déduit les valeurs que lorsqu’elles sont méthodologiquement défendables.',
    positioningTitle: 'Positionnement',
    positioningBody: 'PRISMA est une directive de rédaction visant à améliorer la transparence ; ce n’est pas une méthode pour exécuter la revue.',
    calculationsTitle: 'Calculs',
    calculationsBody: 'Les valeurs dérivées affichent la mémoire de calcul. Les remplacements manuels exigent une justification.',
    rulesTitle: 'Classification des règles',
    rules: [
      'Valide : relation vérifiée et cohérente.',
      'Attention : situation possible nécessitant vérification.',
      'Incohérence : relation numérique incompatible.',
      'Information manquante : champ nécessaire sans valeur.',
      'Non applicable : étape hors du modèle sélectionné.',
    ],
    limitsTitle: 'Limites',
    limitsBody: 'Les vérifications n’évaluent pas la stratégie de recherche ni la qualité scientifique du manuscrit.',
  },
  de: {
    eyebrow: 'EXPLIZITE REGELN',
    title: 'Methodik der Anwendung',
    lead: 'Das System modelliert Datensätze, Berichte und Studien als separate Einheiten und leitet Werte nur bei methodischer Konsistenz ab.',
    positioningTitle: 'Positionierung',
    positioningBody: 'PRISMA ist eine Berichtsleitlinie zur Verbesserung der Transparenz, keine Methodik zur Durchführung der Review.',
    calculationsTitle: 'Berechnungen',
    calculationsBody: 'Abgeleitete Werte zeigen den Berechnungsweg. Manuelle Überschreibungen erfordern eine Begründung.',
    rulesTitle: 'Regelklassifikation',
    rules: [
      'Gültig: geprüfte, konsistente Beziehung.',
      'Hinweis: mögliche Situation, die Prüfung verdient.',
      'Inkonsistenz: inkompatibles Zahlenverhältnis.',
      'Fehlende Angabe: erforderliches Feld ohne Wert.',
      'Nicht zutreffend: Stufe außerhalb des Modells.',
    ],
    limitsTitle: 'Grenzen',
    limitsBody: 'Die Prüfungen bewerten nicht die Suchstrategie oder die wissenschaftliche Qualität der Publikation.',
  },
  'zh-CN': {
    eyebrow: '明确的方法学规则',
    title: '应用方法学说明',
    lead: '系统将记录、报告和研究建模为不同的独立单位，仅在方法学逻辑成立的前提下自动派生数值。',
    positioningTitle: '工具定位',
    positioningBody: 'PRISMA 是旨在提高系统综述报告透明度与完整性的撰写指南，而非执行系统综述的方法学本身。本应用提供报告辅助与流程图一致性验证。',
    calculationsTitle: '数值计算机制',
    calculationsBody: '所有派生数值均展示其推导与计算过程。手动覆盖必须填写理由并全程追踪，系统绝不会为了“拼凑闭合”而人为修改任何总数。',
    rulesTitle: '规则判定分类',
    rules: [
      '有效（Valid）：经检验各项数值逻辑完全一致。',
      '注意（Attention）：可能存在的合理情况，建议复核。',
      '不一致（Inconsistency）：数值逻辑存在冲突或负数。',
      '信息缺失（Missing）：必填步骤未填写数值。',
      '不适用（Not applicable）：所选模型中未启用的阶段。',
    ],
    limitsTitle: '验证局限性',
    limitsBody: '本系统的验证仅限于流程图的结构与数值逻辑，不负责评估检索策略、纳入排除标准、偏倚风险评价、综合分析模型或文稿的整体科学质量。',
  },
};

export const privacyContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    storageTitle: string;
    storageBody: string;
    exportsTitle: string;
    exportsBody: string;
    respTitle: string;
    respBody: string;
  }
> = {
  'pt-BR': {
    eyebrow: 'LOCAL-FIRST',
    title: 'Privacidade por arquitetura',
    lead: 'O funcionamento central não exige cadastro, cookies de rastreamento, analytics invasivo ou envio de dados.',
    storageTitle: 'Armazenamento',
    storageBody: 'Projetos são persistidos em IndexedDB no próprio navegador. Preferências de idioma, tema e acessibilidade usam armazenamento local. Limpar os dados do site pode apagar projetos sem backup.',
    exportsTitle: 'Exportações e links',
    exportsBody: 'Arquivos são gerados no dispositivo. Links externos só são abertos por ação do usuário. O aplicativo não coloca dados do projeto em URLs.',
    respTitle: 'Responsabilidade',
    respBody: 'Evite inserir ou publicar resultados licenciados de bases, resumos protegidos, dados pessoais ou arquivos que contrariem direitos autorais e termos de uso. Gere backups JSON regularmente.',
  },
  en: {
    eyebrow: 'LOCAL-FIRST',
    title: 'Privacy by Design',
    lead: 'Core functionality requires no account registration, tracking cookies, invasive analytics, or remote data transmission.',
    storageTitle: 'Local Storage',
    storageBody: 'Projects are persisted in IndexedDB within your browser. Language, theme, and accessibility preferences use localStorage. Clearing browser site data may delete projects without backup.',
    exportsTitle: 'Exports and Links',
    exportsBody: 'All files are generated on your local device. External links only open upon user action. The application never embeds project counts or sensitive data into URLs.',
    respTitle: 'User Responsibility',
    respBody: 'Avoid publishing proprietary database abstracts or copyrighted materials. Regularly generate JSON backups to safeguard your research data.',
  },
  it: {
    eyebrow: 'LOCAL-FIRST',
    title: 'Privacy per progettazione',
    lead: 'Il funzionamento centrale non richiede registrazione, cookie di tracciamento o invio di dati a server.',
    storageTitle: 'Archiviazione',
    storageBody: 'I progetti vengono memorizzati in IndexedDB nel browser.',
    exportsTitle: 'Esportazioni e link',
    exportsBody: 'I file vengono generati sul dispositivo.',
    respTitle: 'Responsabilità',
    respBody: 'Genera regolarmente backup JSON per proteggere le tue ricerche.',
  },
  fr: {
    eyebrow: 'LOCAL-FIRST',
    title: 'Confidentialité par conception',
    lead: 'Le fonctionnement principal ne requiert aucune inscription ni transmission de données.',
    storageTitle: 'Stockage',
    storageBody: 'Les projets sont enregistrés dans IndexedDB sur votre navigateur.',
    exportsTitle: 'Exports et liens',
    exportsBody: 'Tous les fichiers sont créés sur votre appareil.',
    respTitle: 'Responsabilité',
    respBody: 'Effectuez régulièrement des sauvegardes JSON.',
  },
  de: {
    eyebrow: 'LOCAL-FIRST',
    title: 'Datenschutz durch Design',
    lead: 'Keine Registrierung, keine Tracking-Cookies und keine Datenübertragung an Server.',
    storageTitle: 'Speicherung',
    storageBody: 'Projekte werden lokal in IndexedDB gespeichert.',
    exportsTitle: 'Exporte und Links',
    exportsBody: 'Dateien werden direkt auf Ihrem Gerät generiert.',
    respTitle: 'Verantwortung',
    respBody: 'Erstellen Sie regelmäßig JSON-Sicherungen.',
  },
  'zh-CN': {
    eyebrow: '本地优先架构',
    title: '隐私保护设计',
    lead: '核心功能无需注册登录，不使用追踪 Cookies 或侵入性分析工具，默认不向远程服务器传输任何数据。',
    storageTitle: '数据存储',
    storageBody: '所有项目数据均保存在浏览器的 IndexedDB 本地数据库中。语言、主题及无障碍设置保存在 localStorage 中。清理浏览器网站数据可能会清除未备份的项目。',
    exportsTitle: '文件导出与外链',
    exportsBody: '所有格式的文件均在您的本地设备上生成。仅在用户主动点击时才打开外部链接，应用绝不会将项目数据拼接到 URL 参数中。',
    respTitle: '用户须知与责任',
    respBody: '请避免在项目中录入受版权保护的摘要或专有数据。建议定期导出 JSON 备份以确保文献综述数据安全。',
  },
};

export const accessibilityContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    featuresTitle: string;
    features: string[];
    limitsTitle: string;
    limitsBody: string;
  }
> = {
  'pt-BR': {
    eyebrow: 'WCAG 2.2 AA',
    title: 'Acessibilidade',
    lead: 'A interface foi projetada para operar com teclado, ampliação, alto contraste, redução de movimento e tecnologias assistivas.',
    featuresTitle: 'Recursos',
    features: [
      'Skip links, foco visível e ordem lógica.',
      'Labels explícitos, erros associados e regiões ao vivo.',
      'Alternativa textual e tabular para o SVG.',
      'Alvos de toque e drawers responsivos.',
      'Tema claro, escuro, alto contraste e escala de fonte.',
      'Preferência de movimento reduzido.',
    ],
    limitsTitle: 'Limitações e contato',
    limitsBody: 'Acessibilidade é um processo contínuo. Exportações complexas podem variar conforme leitor de PDF ou editor gráfico; use o HTML interativo para a alternativa mais rica.',
  },
  en: {
    eyebrow: 'WCAG 2.2 AA',
    title: 'Accessibility',
    lead: 'The interface is engineered to work smoothly with keyboard navigation, screen magnification, high contrast, reduced motion, and assistive technologies.',
    featuresTitle: 'Implemented Features',
    features: [
      'Skip navigation links, visible focus indicators, and logical DOM order.',
      'Explicit form labels, aria-describedby error associations, and live regions.',
      'Complete textual and tabular alternatives for SVG diagrams.',
      'Generous touch targets and responsive mobile drawers.',
      'Light, dark, high contrast modes and dynamic font scaling.',
      'Reduced motion preference support.',
    ],
    limitsTitle: 'Continuous Improvement',
    limitsBody: 'Accessibility is an ongoing priority. Complex vector outputs may render differently depending on PDF reader; interactive HTML provides the richest accessible representation.',
  },
  it: {
    eyebrow: 'WCAG 2.2 AA',
    title: 'Accessibilità',
    lead: 'L’interfaccia è progettata per funzionare con tastiera, alto contrasto, riduzione del movimento e tecnologie assistive.',
    featuresTitle: 'Funzionalità',
    features: [
      'Skip link, focus visibile e ordine logico.',
      'Etichette esplicite e aree live.',
      'Alternativa testuale e tabellare all’SVG.',
      'Modalità chiaro, scuro, alto contrasto e ridimensionamento caratteri.',
    ],
    limitsTitle: 'Miglioramento continuo',
    limitsBody: 'L’accessibilità è una priorità continua.',
  },
  fr: {
    eyebrow: 'WCAG 2.2 AA',
    title: 'Accessibilité',
    lead: 'L’interface est conçue pour fonctionner avec clavier, contraste élevé, réduction des animations et technologies d’assistance.',
    featuresTitle: 'Fonctionnalités',
    features: [
      'Liens d’évitement, focus visible et ordre logique.',
      'Labels explicites et régions en direct.',
      'Alternative textuelle et tabulaire pour le SVG.',
      'Thèmes clair, sombre, contraste élevé et zoom du texte.',
    ],
    limitsTitle: 'Amélioration continue',
    limitsBody: 'L’accessibilité fait l’objet d’un engagement constant.',
  },
  de: {
    eyebrow: 'WCAG 2.2 AA',
    title: 'Barrierefreiheit',
    lead: 'Die Oberfläche wurde für Tastaturbedienung, Vergrößerung, hohen Kontrast und assistive Technologien entwickelt.',
    featuresTitle: 'Funktionen',
    features: [
      'Skip-Links, sichtbarer Fokus und logische Tab-Reihenfolge.',
      'Explizite Labels und Live-Regionen.',
      'Textuelle und tabellarische Alternative zum SVG.',
      'Hell-, Dunkel-, Kontrastmodus und variable Schriftgröße.',
    ],
    limitsTitle: 'Kontinuierliche Verbesserung',
    limitsBody: 'Barrierefreiheit ist ein fortlaufender Prozess.',
  },
  'zh-CN': {
    eyebrow: 'WCAG 2.2 AA 规范',
    title: '无障碍访问承诺',
    lead: '界面专为键盘无障碍导航、屏幕放大、高对比度、动态效果减弱及各类辅助技术而设计。',
    featuresTitle: '已实现的无障碍功能',
    features: [
      '跳至主要内容链接（Skip links）、清晰的高亮焦点及逻辑 DOM 顺序。',
      '明确的表单标签关联、错误信息 ARIA 提示及屏幕阅读器实时播报区。',
      '为 SVG 流程图提供完整的文本与表格替代视图。',
      '友好的触控点击区域与移动端响应式抽屉。',
      '浅色、深色、高对比度主题以及字体自由缩放功能。',
      '支持系统级减少动态效果偏好设置。',
    ],
    limitsTitle: '持续优化',
    limitsBody: '无障碍体验是一项持续优化的工程。复杂的矢量导出文件在不同 PDF 阅读器中的朗读支持可能存在差异，推荐使用交互式 HTML 获取最丰富的无障碍体验。',
  },
};

export const sourceLinks = [
  ['PRISMA website', 'https://www.prisma-statement.org/'],
  ['PRISMA 2020', 'https://www.prisma-statement.org/prisma-2020'],
  ['Flow diagram', 'https://www.prisma-statement.org/prisma-2020-flow-diagram'],
  ['Checklist', 'https://www.prisma-statement.org/prisma-2020-checklist'],
  ['Explanation & Elaboration', 'https://www.prisma-statement.org/prisma-2020-explanation-elaboration'],
  ['PRISMA-P', 'https://www.prisma-statement.org/protocols'],
  ['Extensions', 'https://www.prisma-statement.org/extensions'],
  ['Translations', 'https://www.prisma-statement.org/translations'],
  ['PRISMA2020 R package', 'https://github.com/prisma-flowdiagram/PRISMA2020'],
  ['Haddaway et al. 2022', 'https://doi.org/10.1002/cl2.1230'],
];

export const sourcesContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    guidelineTitle: string;
    guidelineBody: string;
    sourcesTitle: string;
    refsTitle: string;
    transTitle: string;
    transBody: string;
    licenseTitle: string;
    licenseBody: string;
  }
> = {
  'pt-BR': {
    eyebrow: 'VERIFICADO EM 26 AGO. 2026',
    title: 'Fontes e referências',
    lead: 'A implementação adota PRISMA 2020 como versão principal e registra explicitamente fontes, licença e proveniência terminológica.',
    guidelineTitle: 'Diretriz implementada',
    guidelineBody: 'PRISMA 2020, publicada em 2021, incluindo os quatro modelos de fluxo para revisões novas ou atualizadas, com bases e registros apenas ou também outras fontes.',
    sourcesTitle: 'Fontes primárias consultadas',
    refsTitle: 'Referências bibliográficas',
    transTitle: 'Traduções',
    transBody: 'A interface usa tradução própria da aplicação alinhada aos termos dos documentos oficiais do PRISMA Statement.',
    licenseTitle: 'Licença',
    licenseBody: 'Documentos e templates PRISMA 2020: Creative Commons Attribution 4.0. A ferramenta é independente do PRISMA Executive.',
  },
  en: {
    eyebrow: 'VERIFIED AUGUST 2026',
    title: 'Sources & References',
    lead: 'PRISMA Lab adopts PRISMA 2020 as its primary foundation, documenting sources, licenses, and terminological provenance.',
    guidelineTitle: 'Implemented Guideline',
    guidelineBody: 'PRISMA 2020, published in 2021, featuring all four flow diagram models for new or updated reviews, via databases & registers or also other methods.',
    sourcesTitle: 'Primary Consulted Sources',
    refsTitle: 'Bibliographic References',
    transTitle: 'Translations & Provenance',
    transBody: 'Interface translations align closely with official PRISMA terminology and published multilingual resources.',
    licenseTitle: 'License & Attribution',
    licenseBody: 'PRISMA 2020 documents and templates are distributed under Creative Commons Attribution 4.0. PRISMA Lab is independent of the PRISMA Executive.',
  },
  it: {
    eyebrow: 'VERIFICATO AD AGOSTO 2026',
    title: 'Fonti e riferimenti',
    lead: 'L’implementazione adotta PRISMA 2020 come versione principale.',
    guidelineTitle: 'Linea guida implementata',
    guidelineBody: 'PRISMA 2020, con i quattro modelli di flusso.',
    sourcesTitle: 'Fonti primarie consultate',
    refsTitle: 'Riferimenti bibliografici',
    transTitle: 'Traduzioni',
    transBody: 'La traduzione dell’interfaccia è allineata alla terminologia ufficiale.',
    licenseTitle: 'Licenza',
    licenseBody: 'Documenti e template PRISMA 2020: Creative Commons Attribution 4.0.',
  },
  fr: {
    eyebrow: 'VÉRIFIÉ EN AOÛT 2026',
    title: 'Sources et références',
    lead: 'L’application adopte PRISMA 2020 comme référence principale.',
    guidelineTitle: 'Directive implémentée',
    guidelineBody: 'PRISMA 2020 avec les quatre modèles de flux officiels.',
    sourcesTitle: 'Sources primaires consultées',
    refsTitle: 'Références bibliographiques',
    transTitle: 'Traductions',
    transBody: 'Les traductions respectent la terminologie officielle.',
    licenseTitle: 'Licence',
    licenseBody: 'Modèles et documents PRISMA 2020 : Creative Commons Attribution 4.0.',
  },
  de: {
    eyebrow: 'GEPRÜFT IM AUGUST 2026',
    title: 'Quellen und Referenzen',
    lead: 'Die Anwendung basiert auf PRISMA 2020 als Hauptversion.',
    guidelineTitle: 'Implementierte Leitlinie',
    guidelineBody: 'PRISMA 2020 mit allen vier Flussdiagramm-Modellen.',
    sourcesTitle: 'Konsultierte Primärquellen',
    refsTitle: 'Bibliografische Referenzen',
    transTitle: 'Übersetzungen',
    transBody: 'Die Benutzeroberfläche orientiert sich an der offiziellen Terminologie.',
    licenseTitle: 'Lizenz',
    licenseBody: 'PRISMA-2020-Vorlagen stehen unter Creative Commons Attribution 4.0.',
  },
  'zh-CN': {
    eyebrow: '2026年8月核验',
    title: '来源与参考文献',
    lead: '本系统以 PRISMA 2020 作为核心规范依据，详实记录数据源、授权协议及多语言术语溯源。',
    guidelineTitle: '实施的报告指南',
    guidelineBody: 'PRISMA 2020（2021年发布），完整涵盖新综述与更新综述、仅数据库/注册库或包含其他来源的全部四种官方流程图模型。',
    sourcesTitle: '查阅的官方一手来源',
    refsTitle: '主要参考文献',
    transTitle: '多语言术语校准',
    transBody: '界面术语已对齐 PRISMA 官方多语言文献及学术界通用译名。',
    licenseTitle: '许可证与署名',
    licenseBody: 'PRISMA 2020 官方文档及流程图模板遵循 Creative Commons Attribution 4.0（CC BY 4.0）署名协议。本工具保持学术独立性。',
  },
};

export const licenseContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    codeTitle: string;
    codeBody: string;
    prismaTitle: string;
    prismaBody: string;
    libsTitle: string;
    libsBody: string;
  }
> = {
  'pt-BR': {
    eyebrow: 'PROVENIÊNCIA',
    title: 'Licenças e atribuições',
    lead: 'O código do PRISMA Lab é MIT; documentos e templates PRISMA 2020 usados como base são CC BY 4.0.',
    codeTitle: 'Código',
    codeBody: 'Copyright © 2026 Gustavo Simas. Licenciado sob MIT, conforme o arquivo LICENSE do repositório.',
    prismaTitle: 'PRISMA 2020',
    prismaBody: 'Os templates de diagrama, checklist, statement e explanation & elaboration são distribuídos sob CC BY 4.0. Atribuição: Page MJ et al. The PRISMA 2020 statement. BMJ 2021;372:n71.',
    libsTitle: 'Bibliotecas',
    libsBody: 'React, Next, Vite, Dexie, Zod, Zustand, JSZip, SheetJS, jsPDF, Lucide, Vitest, Testing Library e Playwright mantêm suas respectivas licenças de código aberto.',
  },
  en: {
    eyebrow: 'PROVENANCE',
    title: 'Licenses & Attributions',
    lead: 'PRISMA Lab source code is released under the MIT License; foundational PRISMA 2020 templates and documents are licensed under CC BY 4.0.',
    codeTitle: 'Source Code',
    codeBody: 'Copyright © 2026 Gustavo Simas. Licensed under the MIT License, as detailed in the LICENSE repository file.',
    prismaTitle: 'PRISMA 2020 Foundation',
    prismaBody: 'Flow diagram templates, checklists, statement, and explanation & elaboration documents are distributed under CC BY 4.0. Attribution: Page MJ et al. The PRISMA 2020 statement. BMJ 2021;372:n71.',
    libsTitle: 'Open Source Libraries',
    libsBody: 'React, Next, Vite, Dexie, Zod, Zustand, JSZip, SheetJS, jsPDF, Lucide, Vitest, Testing Library, and Playwright retain their respective open source licenses.',
  },
  it: {
    eyebrow: 'PROVENIENZA',
    title: 'Licenze e attribuzioni',
    lead: 'Il codice sorgente di PRISMA Lab è MIT; i template PRISMA 2020 sono CC BY 4.0.',
    codeTitle: 'Codice',
    codeBody: 'Copyright © 2026 Gustavo Simas. Licenza MIT.',
    prismaTitle: 'PRISMA 2020',
    prismaBody: 'I template di diagramma e checklist sono distribuiti sotto licenza CC BY 4.0.',
    libsTitle: 'Librerie',
    libsBody: 'React, Next, Vite, Dexie, Zod e le altre librerie mantengono le rispettive licenze.',
  },
  fr: {
    eyebrow: 'PROVENANCE',
    title: 'Licences et attributions',
    lead: 'Le code source de PRISMA Lab est sous licence MIT ; les modèles PRISMA 2020 sont sous CC BY 4.0.',
    codeTitle: 'Code source',
    codeBody: 'Copyright © 2026 Gustavo Simas. Sous licence MIT.',
    prismaTitle: 'PRISMA 2020',
    prismaBody: 'Les modèles de diagramme et listes de contrôle sont distribués sous licence CC BY 4.0.',
    libsTitle: 'Bibliothèques',
    libsBody: 'React, Next, Vite, Dexie, Zod et les autres dépendances conservent leurs licences respectives.',
  },
  de: {
    eyebrow: 'HERKUNFT',
    title: 'Lizenzen und Namensnennung',
    lead: 'Der Quellcode von PRISMA Lab steht unter der MIT-Lizenz; PRISMA-2020-Vorlagen unter CC BY 4.0.',
    codeTitle: 'Quellcode',
    codeBody: 'Copyright © 2026 Gustavo Simas. Lizenziert unter MIT.',
    prismaTitle: 'PRISMA 2020',
    prismaBody: 'Diagrammvorlagen und Checklisten werden unter CC BY 4.0 bereitgestellt.',
    libsTitle: 'Bibliotheken',
    libsBody: 'React, Next, Vite, Dexie, Zod und weitere Bibliotheken behalten ihre jeweiligen Open-Source-Lizenzen.',
  },
  'zh-CN': {
    eyebrow: '来源与许可溯源',
    title: '开源许可与署名',
    lead: 'PRISMA Lab 源代码采用 MIT 开源许可证发布；PRISMA 2020 官方规范与流程图模板遵循 CC BY 4.0 许可。',
    codeTitle: '源代码许可',
    codeBody: '版权所有 © 2026 Gustavo Simas。基于 MIT 许可证分发，详见仓库 LICENSE 文件。',
    prismaTitle: 'PRISMA 2020 官方模板',
    prismaBody: '流程图模板、核对清单、声明文件及解释阐述文档均在 CC BY 4.0 协议下分发。署名引文：Page MJ et al. The PRISMA 2020 statement. BMJ 2021;372:n71。',
    libsTitle: '开源第三方库',
    libsBody: 'React、Next、Vite、Dexie、Zod、Zustand、JSZip、SheetJS、jsPDF、Lucide、Vitest、Testing Library 与 Playwright 均保留各自的开源软件许可证。',
  },
};
