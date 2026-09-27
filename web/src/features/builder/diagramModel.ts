import { calculateProject, hasOtherSources, isUpdatedModel } from '../../domain/calculations';
import type { CountKey, ExclusionReason, Locale, PresentationPreferences, PrismaProject, SourceItem } from '../../domain/types';

export type DiagramStyle = PresentationPreferences['diagramStyle'];

export interface DiagramNode {
  id: CountKey | 'identified-main' | 'identified-other' | 'removed';
  field: CountKey;
  x: number;
  y: number;
  width: number;
  height: number;
  lines: string[];
  value: number;
  kind?: 'side' | 'final' | 'previous' | 'other';
}

export interface DiagramConnection { id: string; d: string; }

export type DiagramStage = 'identification' | 'screening' | 'included';

/** Column header above a pipeline ("via databases and registers" / "via other methods"). */
export interface DiagramHeader { id: 'main' | 'other'; x: number; y: number; width: number; height: number; label: string; }
/** Vertical stage band on the left edge (Identification, Screening, Included). */
export interface DiagramBand { stage: DiagramStage; x: number; y: number; width: number; height: number; label: string; }

/** Everything drawn around the boxes: size, column headers, stage bands and credit. Shared by the canvas and exporters. */
export interface DiagramChrome {
  width: number;
  height: number;
  credit: string;
  creditX: number;
  hasOtherSources: boolean;
  headers: DiagramHeader[];
  bands: DiagramBand[];
  headerRadius: number;
  bandRadius: number;
}

const words: Record<Locale, Record<string, string>> = {
  'pt-BR': { previous: 'Estudos anteriores', identified: 'Registros identificados a partir de:', databases: 'Bases e registros', other: 'Outras fontes', removed: 'Registros removidos antes da triagem:', screened: 'Registros triados', excluded: 'Registros excluídos', sought: 'Relatos procurados para recuperação', notRetrieved: 'Relatos não recuperados', assessed: 'Relatos avaliados para elegibilidade', reportsExcluded: 'Relatos excluídos:', included: 'Novos estudos incluídos na revisão', total: 'Total incluído', reports: 'relatos', studies: 'estudos', mainHeader: 'Identificação de novos estudos em bases de dados e registros', otherHeader: 'Identificação de novos estudos por outros métodos', identification: 'Identificação', screening: 'Triagem', includedStage: 'Incluídos', credit: 'Baseado no PRISMA 2020 · CC BY 4.0 · PRISMA Lab | Scientata', databasesOnly: 'Bases de dados', registersOnly: 'Registros', websitesOnly: 'Sites', organisationsOnly: 'Organizações', citationOnly: 'Busca por citações', otherSourcesOnly: 'Outras fontes', duplicatesOnly: 'Registros duplicados', automationOnly: 'Marcados como inelegíveis por ferramentas de automação', removedOtherOnly: 'Removidos por outras razões', reasonFallback: 'Motivo' },
  en: { previous: 'Previous studies', identified: 'Records identified from:', databases: 'Databases and registers', other: 'Other sources', removed: 'Records removed before screening:', screened: 'Records screened', excluded: 'Records excluded', sought: 'Reports sought for retrieval', notRetrieved: 'Reports not retrieved', assessed: 'Reports assessed for eligibility', reportsExcluded: 'Reports excluded:', included: 'New studies included in review', total: 'Total included', reports: 'reports', studies: 'studies', mainHeader: 'Identification of new studies via databases and registers', otherHeader: 'Identification of new studies via other methods', identification: 'Identification', screening: 'Screening', includedStage: 'Included', credit: 'Based on PRISMA 2020 · CC BY 4.0 · PRISMA Lab | Scientata', databasesOnly: 'Databases', registersOnly: 'Registers', websitesOnly: 'Websites', organisationsOnly: 'Organisations', citationOnly: 'Citation searching', otherSourcesOnly: 'Other sources', duplicatesOnly: 'Duplicate records', automationOnly: 'Records marked as ineligible by automation tools', removedOtherOnly: 'Records removed for other reasons', reasonFallback: 'Reason' },
  it: { previous: 'Studi precedenti', identified: 'Record identificati da:', databases: 'Banche dati e registri', other: 'Altre fonti', removed: 'Record rimossi prima dello screening:', screened: 'Record sottoposti a screening', excluded: 'Record esclusi', sought: 'Report cercati per il recupero', notRetrieved: 'Report non recuperati', assessed: 'Report valutati per l’idoneità', reportsExcluded: 'Report esclusi:', included: 'Nuovi studi inclusi nella revisione', total: 'Totale incluso', reports: 'report', studies: 'studi', mainHeader: 'Identificazione di nuovi studi tramite banche dati e registri', otherHeader: 'Identificazione di nuovi studi tramite altri metodi', identification: 'Identificazione', screening: 'Screening', includedStage: 'Inclusi', credit: 'Basato su PRISMA 2020 · CC BY 4.0 · PRISMA Lab | Scientata', databasesOnly: 'Banche dati', registersOnly: 'Registri', websitesOnly: 'Siti web', organisationsOnly: 'Organizzazioni', citationOnly: 'Ricerca per citazioni', otherSourcesOnly: 'Altre fonti', duplicatesOnly: 'Record duplicati', automationOnly: 'Contrassegnati come non idonei da strumenti automatici', removedOtherOnly: 'Record rimossi per altri motivi', reasonFallback: 'Motivo' },
  fr: { previous: 'Études antérieures', identified: 'Enregistrements identifiés à partir de :', databases: 'Bases de données et registres', other: 'Autres sources', removed: 'Enregistrements retirés avant la sélection :', screened: 'Enregistrements examinés', excluded: 'Enregistrements exclus', sought: 'Rapports recherchés pour récupération', notRetrieved: 'Rapports non récupérés', assessed: 'Rapports évalués pour l’éligibilité', reportsExcluded: 'Rapports exclus :', included: 'Nouvelles études incluses dans la revue', total: 'Total inclus', reports: 'rapports', studies: 'études', mainHeader: 'Identification de nouvelles études via bases et registres', otherHeader: 'Identification de nouvelles études par d’autres méthodes', identification: 'Identification', screening: 'Sélection', includedStage: 'Inclus', credit: 'Basé sur PRISMA 2020 · CC BY 4.0 · PRISMA Lab | Scientata', databasesOnly: 'Bases de données', registersOnly: 'Registres', websitesOnly: 'Sites web', organisationsOnly: 'Organisations', citationOnly: 'Recherche par citations', otherSourcesOnly: 'Autres sources', duplicatesOnly: 'Enregistrements en double', automationOnly: 'Marqués comme non éligibles par des outils automatisés', removedOtherOnly: 'Retirés pour d’autres raisons', reasonFallback: 'Motif' },
  de: { previous: 'Frühere Studien', identified: 'Identifizierte Datensätze aus:', databases: 'Datenbanken und Register', other: 'Weitere Quellen', removed: 'Vor dem Screening entfernte Datensätze:', screened: 'Datensätze gescreent', excluded: 'Datensätze ausgeschlossen', sought: 'Zur Beschaffung gesuchte Berichte', notRetrieved: 'Nicht beschaffte Berichte', assessed: 'Auf Eignung geprüfte Berichte', reportsExcluded: 'Ausgeschlossene Berichte:', included: 'Neu in die Übersichtsarbeit eingeschlossene Studien', total: 'Insgesamt eingeschlossen', reports: 'Berichte', studies: 'Studien', mainHeader: 'Identifikation neuer Studien über Datenbanken und Register', otherHeader: 'Identifikation neuer Studien über andere Methoden', identification: 'Identifikation', screening: 'Screening', includedStage: 'Eingeschlossen', credit: 'Basierend auf PRISMA 2020 · CC BY 4.0 · PRISMA Lab | Scientata', databasesOnly: 'Datenbanken', registersOnly: 'Register', websitesOnly: 'Websites', organisationsOnly: 'Organisationen', citationOnly: 'Zitationssuche', otherSourcesOnly: 'Weitere Quellen', duplicatesOnly: 'Duplikate', automationOnly: 'Durch Automatisierungstools als nicht geeignet markiert', removedOtherOnly: 'Aus anderen Gründen entfernt', reasonFallback: 'Grund' },
  'zh-CN': { previous: '既往纳入研究', identified: '检索识别记录来自：', databases: '数据库与注册平台', other: '其他来源', removed: '筛选前移除的记录：', screened: '已筛选记录', excluded: '排除记录', sought: '寻求获取的报告', notRetrieved: '未获取报告', assessed: '合格性评估报告', reportsExcluded: '排除的报告：', included: '综述中新纳入的研究', total: '纳入总计', reports: '份报告', studies: '项研究', mainHeader: '通过数据库和注册平台识别新研究', otherHeader: '通过其他方法识别新研究', identification: '识别', screening: '筛选', includedStage: '纳入', credit: '基于 PRISMA 2020 · CC BY 4.0 · PRISMA Lab | Scientata', databasesOnly: '数据库', registersOnly: '注册库', websitesOnly: '网站', organisationsOnly: '组织机构', citationOnly: '引文检索', otherSourcesOnly: '其他来源', duplicatesOnly: '重复记录', automationOnly: '被自动化工具标记为不合格', removedOtherOnly: '因其他原因移除', reasonFallback: '原因' },
};

function wrapLine(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const parts = text.split(' ');
  const out: string[] = [];
  let current = '';
  for (const part of parts) {
    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length > maxChars && current) {
      out.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current) out.push(current);
  return out;
}

function buildLines(header: string, items: string[], width: number, style: DiagramStyle): string[] {
  const usable = width - (style === 'classic' ? 24 : 34);
  const maxChars = Math.max(12, Math.floor(usable / 6.3));
  return [header, ...items.flatMap((item) => wrapLine(item, maxChars))];
}

function boxHeight(lineCount: number, style: DiagramStyle): number {
  return style === 'classic' ? Math.max(40, 24 + lineCount * 15) : Math.max(70, 30 + lineCount * 22);
}

type Words = Record<string, string>;
type NumberFor = (key: CountKey) => number;

function databaseItems(w: Words, n: NumberFor, sources: PrismaProject['sources'] = [], raw: (key: CountKey) => number | null = () => 0): string[] {
  const dbSources = (sources || []).filter((s) => s.type === 'database' && (s.name.trim().length > 0 || (s.count ?? 0) > 0));
  const items: string[] = [];

  if (dbSources.length > 0) {
    const totalDb = dbSources.reduce((acc, s) => acc + (s.count || 0), 0);
    items.push(`${w.databasesOnly} (n = ${totalDb}):`);
    for (const source of dbSources) {
      items.push(`${source.name.trim() || w.databasesOnly} (n = ${source.count || 0})`);
    }
  } else if (raw('databases') !== null || raw('registers') === null) {
    items.push(`${w.databasesOnly} (n = ${n('databases')})`);
  }

  if (raw('registers') !== null) {
    items.push(`${w.registersOnly} (n = ${n('registers')})`);
  }

  return items.length > 0 ? items : [`${w.databasesOnly} (n = 0)`];
}

function otherSourceItems(w: Words, n: NumberFor, sources?: SourceItem[], raw?: (key: CountKey) => number | null): string[] {
  const otherSources = (sources || []).filter((s) => s.type !== 'database');
  if (otherSources.length > 0) {
    return otherSources.map((source) => {
      let defaultName = w.otherSourcesOnly;
      if (source.type === 'website') defaultName = w.websitesOnly;
      else if (source.type === 'organisation') defaultName = w.organisationsOnly;
      else if (source.type === 'citation') defaultName = w.citationOnly;
      const label = source.name.trim() || defaultName;
      return `${label} (n = ${source.count || 0})`;
    });
  }

  const items: string[] = [];
  if (raw) {
    if (raw('websites') !== null) items.push(`${w.websitesOnly} (n = ${n('websites')})`);
    if (raw('organisations') !== null) items.push(`${w.organisationsOnly} (n = ${n('organisations')})`);
    if (raw('citationSearching') !== null) items.push(`${w.citationOnly} (n = ${n('citationSearching')})`);
    if (raw('otherSources') !== null) items.push(`${w.otherSourcesOnly} (n = ${n('otherSources')})`);
  }
  return items;
}

function removedItems(w: Words, n: NumberFor, raw: (key: CountKey) => number | null): string[] {
  const items = [`${w.duplicatesOnly} (n = ${n('duplicates')})`];
  if (raw('automationExcluded') !== null) items.push(`${w.automationOnly} (n = ${n('automationExcluded')})`);
  if (raw('removedOther') !== null) items.push(`${w.removedOtherOnly} (n = ${n('removedOther')})`);
  return items;
}

function reasonItems(reasons: ExclusionReason[], fallbackCount: number, w: Words): string[] {
  if (reasons.length) return reasons.map((reason) => `${reason.label.trim() || w.reasonFallback} (n = ${reason.count})`);
  return [`n = ${fallbackCount}`];
}

interface RowBox {
  id: DiagramNode['id'];
  field: CountKey;
  header: string;
  items: string[];
  value: number;
  kind?: DiagramNode['kind'];
}

type PairRowFn = (nodes: DiagramNode[], top: number, gap: number, mainX: number, sideX: number, width: number, style: DiagramStyle, main: RowBox, side?: RowBox) => number;

const pairRowCentered: PairRowFn = (nodes, top, gap, mainX, sideX, width, style, main, side) => {
  const mainLines = buildLines(main.header, main.items, width, style);
  const mainHeight = boxHeight(mainLines.length, style);
  nodes.push({ id: main.id, field: main.field, x: mainX, y: top, width, height: mainHeight, lines: mainLines, value: main.value, kind: main.kind });
  let bottom = top + mainHeight;
  if (side) {
    const sideLines = buildLines(side.header, side.items, width, style);
    const sideHeight = boxHeight(sideLines.length, style);
    const sideY = top + (mainHeight - sideHeight) / 2;
    nodes.push({ id: side.id, field: side.field, x: sideX, y: sideY, width, height: sideHeight, lines: sideLines, value: side.value, kind: side.kind ?? 'side' });
    bottom = Math.max(bottom, sideY + sideHeight);
  }
  return bottom + gap;
};

const pairRowTopAligned: PairRowFn = (nodes, top, gap, mainX, sideX, width, style, main, side) => {
  const mainLines = buildLines(main.header, main.items, width, style);
  const mainHeight = boxHeight(mainLines.length, style);
  nodes.push({ id: main.id, field: main.field, x: mainX, y: top, width, height: mainHeight, lines: mainLines, value: main.value, kind: main.kind });
  let maxHeight = mainHeight;
  if (side) {
    const sideLines = buildLines(side.header, side.items, width, style);
    const sideHeight = boxHeight(sideLines.length, style);
    nodes.push({ id: side.id, field: side.field, x: sideX, y: top, width, height: sideHeight, lines: sideLines, value: side.value, kind: side.kind ?? 'side' });
    maxHeight = Math.max(maxHeight, sideHeight);
  }
  return top + maxHeight + gap;
};

function appendOtherPipeline(pairRow: PairRowFn, nodes: DiagramNode[], top: number, gap: number, mainX: number, sideX: number, width: number, style: DiagramStyle, project: PrismaProject, w: Words, n: NumberFor): number {
  top = pairRow(nodes, top, gap, mainX, sideX, width, style,
    { id: 'otherReportsSought', field: 'otherReportsSought', header: w.sought, items: [`n = ${n('otherReportsSought')}`], value: n('otherReportsSought'), kind: 'other' },
    { id: 'otherReportsNotRetrieved', field: 'otherReportsNotRetrieved', header: w.notRetrieved, items: [`n = ${n('otherReportsNotRetrieved')}`], value: n('otherReportsNotRetrieved'), kind: 'other' },
  );
  top = pairRow(nodes, top, gap, mainX, sideX, width, style,
    { id: 'otherReportsAssessed', field: 'otherReportsAssessed', header: w.assessed, items: [`n = ${n('otherReportsAssessed')}`], value: n('otherReportsAssessed'), kind: 'other' },
    { id: 'otherReportsExcluded', field: 'otherReportsExcluded', header: w.reportsExcluded, items: reasonItems(project.otherExclusionReasons, n('otherReportsExcluded'), w), value: n('otherReportsExcluded'), kind: 'other' },
  );
  return top;
}

function getClassicNodes(project: PrismaProject, locale: Locale): DiagramNode[] {
  const { values } = calculateProject(project);
  const w = words[locale];
  const n: NumberFor = (key) => values[key] ?? 0;
  const raw = (key: CountKey) => values[key];
  const other = hasOtherSources(project.model);
  const updated = isUpdatedModel(project.model);
  const style: DiagramStyle = 'classic';
  const colWidth = 260;
  const gap = 26;
  const nodes: DiagramNode[] = [];
  let top = 115;

  if (updated) {
    const lines = buildLines(w.previous, [`${w.studies}: n = ${n('previousStudies')}`, `${w.reports}: n = ${n('previousReports')}`], colWidth, style);
    const height = boxHeight(lines.length, style);
    nodes.push({ id: 'previousStudies', field: 'previousStudies', x: 70, y: top, width: colWidth, height, lines, value: n('previousStudies'), kind: 'previous' });
    top += height + gap;
  }

  const identifiedTop = top;
  top = pairRowCentered(nodes, top, gap, 70, 366, colWidth, style,
    { id: 'identified-main', field: 'databases', header: w.identified, items: databaseItems(w, n, project.sources, raw), value: n('databases') + n('registers') },
    { id: 'removed', field: 'duplicates', header: w.removed, items: removedItems(w, n, raw), value: n('duplicates') + n('automationExcluded') + n('removedOther'), kind: 'side' },
  );

  if (other) {
    const otherLines = buildLines(w.identified, otherSourceItems(w, n, project.sources, raw), colWidth, style);
    const otherHeight = boxHeight(otherLines.length, style);
    const otherY = identifiedTop - 10;
    const otherSourcesCount = (project.sources || []).filter((s) => s.type !== 'database').reduce((acc, s) => acc + (s.count || 0), 0);
    const otherVal = otherSourcesCount > 0 ? otherSourcesCount : (n('websites') + n('organisations') + n('citationSearching') + n('otherSources'));
    nodes.push({ id: 'identified-other', field: 'websites', x: 662, y: otherY, width: colWidth, height: otherHeight, lines: otherLines, value: otherVal, kind: 'other' });
    appendOtherPipeline(pairRowCentered, nodes, otherY + otherHeight + gap, gap, 662, 958, colWidth, style, project, w, n);
  }

  top = pairRowCentered(nodes, top, gap, 70, 366, colWidth, style,
    { id: 'screened', field: 'screened', header: w.screened, items: [`n = ${n('screened')}`], value: n('screened') },
    { id: 'recordsExcluded', field: 'recordsExcluded', header: w.excluded, items: [`n = ${n('recordsExcluded')}`], value: n('recordsExcluded'), kind: 'side' },
  );

  top = pairRowCentered(nodes, top, gap, 70, 366, colWidth, style,
    { id: 'reportsSought', field: 'reportsSought', header: w.sought, items: [`n = ${n('reportsSought')}`], value: n('reportsSought') },
    { id: 'reportsNotRetrieved', field: 'reportsNotRetrieved', header: w.notRetrieved, items: [`n = ${n('reportsNotRetrieved')}`], value: n('reportsNotRetrieved'), kind: 'side' },
  );

  top = pairRowCentered(nodes, top, gap, 70, 366, colWidth, style,
    { id: 'reportsAssessed', field: 'reportsAssessed', header: w.assessed, items: [`n = ${n('reportsAssessed')}`], value: n('reportsAssessed') },
    { id: 'reportsExcluded', field: 'reportsExcluded', header: w.reportsExcluded, items: reasonItems(project.exclusionReasons, n('reportsExcluded'), w), value: n('reportsExcluded'), kind: 'side' },
  );

  const newStudiesItems = [`n = ${n('newStudies')}`, `${w.reports}: n = ${n('newReports')}`];
  if (updated) {
    pairRowCentered(nodes, top, gap, 70, 366, colWidth, style,
      { id: 'newStudies', field: 'newStudies', header: w.included, items: newStudiesItems, value: n('newStudies'), kind: 'final' },
      { id: 'totalStudies', field: 'totalStudies', header: w.total, items: [`${n('totalStudies')} ${w.studies}`, `${n('totalReports')} ${w.reports}`], value: n('totalStudies'), kind: 'final' },
    );
  } else {
    pairRowCentered(nodes, top, gap, 70, 366, colWidth, style,
      { id: 'newStudies', field: 'newStudies', header: w.included, items: newStudiesItems, value: n('newStudies'), kind: 'final' },
    );
  }

  return nodes;
}

function getModernNodes(project: PrismaProject, locale: Locale): DiagramNode[] {
  const { values } = calculateProject(project);
  const w = words[locale];
  const n: NumberFor = (key) => values[key] ?? 0;
  const raw = (key: CountKey) => values[key];
  const other = hasOtherSources(project.model);
  const updated = isUpdatedModel(project.model);
  const style: DiagramStyle = 'modern';
  const mainX = 70;
  const sideX = 400;
  const otherX = 730;
  const otherSideX = 1060;
  const width = 300;
  const gap = 40;
  const nodes: DiagramNode[] = [];
  let y = 105;

  if (updated) {
    const lines = buildLines(w.previous, [`${n('previousStudies')} ${w.studies} · ${n('previousReports')} ${w.reports}`], width, style);
    const height = boxHeight(lines.length, style);
    nodes.push({ id: 'previousStudies', field: 'previousStudies', x: mainX, y, width, height, lines: lines, value: n('previousStudies'), kind: 'previous' });
    y += height + gap;
  }

  const identifiedY = y;
  y = pairRowTopAligned(nodes, identifiedY, gap, mainX, sideX, width, style,
    { id: 'identified-main', field: 'databases', header: w.identified, items: databaseItems(w, n, project.sources, raw), value: n('databases') + n('registers') },
  );

  if (other) {
    const otherLines = buildLines(w.identified, otherSourceItems(w, n, project.sources, raw), width, style);
    const otherHeight = boxHeight(otherLines.length, style);
    const otherSourcesCount = (project.sources || []).filter((s) => s.type !== 'database').reduce((acc, s) => acc + (s.count || 0), 0);
    const otherVal = otherSourcesCount > 0 ? otherSourcesCount : (n('websites') + n('organisations') + n('citationSearching') + n('otherSources'));
    nodes.push({ id: 'identified-other', field: 'websites', x: otherX, y: identifiedY, width, height: otherHeight, lines: otherLines, value: otherVal, kind: 'other' });
    appendOtherPipeline(pairRowTopAligned, nodes, identifiedY + otherHeight + gap, gap, otherX, otherSideX, width, style, project, w, n);
  }

  y = pairRowTopAligned(nodes, y, gap, mainX, sideX, width, style,
    { id: 'removed', field: 'duplicates', header: w.removed, items: removedItems(w, n, raw), value: n('duplicates') + n('automationExcluded') + n('removedOther'), kind: 'side' },
  );

  y = pairRowTopAligned(nodes, y, gap, mainX, sideX, width, style,
    { id: 'screened', field: 'screened', header: w.screened, items: [`n = ${n('screened')}`], value: n('screened') },
    { id: 'recordsExcluded', field: 'recordsExcluded', header: w.excluded, items: [`n = ${n('recordsExcluded')}`], value: n('recordsExcluded'), kind: 'side' },
  );

  y = pairRowTopAligned(nodes, y, gap, mainX, sideX, width, style,
    { id: 'reportsSought', field: 'reportsSought', header: w.sought, items: [`n = ${n('reportsSought')}`], value: n('reportsSought') },
    { id: 'reportsNotRetrieved', field: 'reportsNotRetrieved', header: w.notRetrieved, items: [`n = ${n('reportsNotRetrieved')}`], value: n('reportsNotRetrieved'), kind: 'side' },
  );

  y = pairRowTopAligned(nodes, y, gap, mainX, sideX, width, style,
    { id: 'reportsAssessed', field: 'reportsAssessed', header: w.assessed, items: [`n = ${n('reportsAssessed')}`], value: n('reportsAssessed') },
    { id: 'reportsExcluded', field: 'reportsExcluded', header: w.reportsExcluded, items: reasonItems(project.exclusionReasons, n('reportsExcluded'), w), value: n('reportsExcluded'), kind: 'side' },
  );

  y = pairRowTopAligned(nodes, y, gap, mainX, sideX, width, style,
    { id: 'newStudies', field: 'newStudies', header: w.included, items: [`${n('newStudies')} ${w.studies} · ${n('newReports')} ${w.reports}`], value: n('newStudies'), kind: 'final' },
  );

  if (updated) {
    pairRowTopAligned(nodes, y, gap, mainX, sideX, width, style,
      { id: 'totalStudies', field: 'totalStudies', header: w.total, items: [`${n('totalStudies')} ${w.studies} · ${n('totalReports')} ${w.reports}`], value: n('totalStudies'), kind: 'final' },
    );
  }

  return nodes;
}

export function getDiagramNodes(project: PrismaProject, locale: Locale, style: DiagramStyle = project.presentation.diagramStyle ?? 'classic'): DiagramNode[] {
  return style === 'classic' ? getClassicNodes(project, locale) : getModernNodes(project, locale);
}

export function getDiagramChrome(project: PrismaProject, locale: Locale, style: DiagramStyle = project.presentation.diagramStyle ?? 'classic'): DiagramChrome {
  const nodes = getDiagramNodes(project, locale, style);
  const w = words[locale];
  const hasOther = hasOtherSources(project.model);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const node = (id: DiagramNode['id']) => byId.get(id)!;
  const bottom = (...ids: DiagramNode['id'][]) => Math.max(...ids.filter((id) => byId.has(id)).map((id) => node(id).y + node(id).height));
  const lastNodeBottom = Math.max(...nodes.map((item) => item.y + item.height));
  const band = (stage: DiagramStage, y: number, height: number, label: string, x: number, width: number): DiagramBand => ({ stage, x, y, width, height, label });

  if (style === 'classic') {
    // Geometry of the official PRISMA 2020 template.
    const identificationTop = node('identified-main').y - 37;
    const screeningTop = node('screened').y;
    const includedTop = node('newStudies').y - 56;
    return {
      width: hasOther ? 1240 : 660,
      height: Math.max(lastNodeBottom, 650) + 55,
      credit: w.credit, creditX: 70, hasOtherSources: hasOther, headerRadius: 15.5, bandRadius: 11,
      headers: [
        { id: 'main', x: 70, y: 30, width: 557, height: 31, label: w.mainHeader },
        ...(hasOther ? [{ id: 'other' as const, x: 662, y: 30, width: 558, height: 31, label: w.otherHeader }] : []),
      ],
      bands: [
        band('identification', identificationTop, screeningTop - identificationTop - 54, w.identification, 17, 31),
        band('screening', screeningTop, includedTop - screeningTop - 18, w.screening, 17, 31),
        band('included', includedTop, lastNodeBottom - includedTop + 15, w.includedStage, 17, 31),
      ],
    };
  }

  // Modern editorial: bands hug the rows of each stage in the main column.
  const identifiedTop = node('identified-main').y;
  const screenedTop = node('screened').y;
  const includedTop = node('newStudies').y;
  const columnWidth = 630; // box + gap + side box
  return {
    width: hasOther ? 1430 : 770,
    height: Math.max(lastNodeBottom, 650) + 50,
    credit: w.credit, creditX: 70, hasOtherSources: hasOther, headerRadius: 2, bandRadius: 2,
    headers: [
      { id: 'main', x: 70, y: 40, width: columnWidth, height: 34, label: w.mainHeader },
      ...(hasOther ? [{ id: 'other' as const, x: 730, y: 40, width: columnWidth, height: 34, label: w.otherHeader }] : []),
    ],
    bands: [
      band('identification', identifiedTop, bottom('identified-main', 'removed') - identifiedTop, w.identification, 22, 30),
      band('screening', screenedTop, bottom('reportsAssessed', 'reportsExcluded') - screenedTop, w.screening, 22, 30),
      band('included', includedTop, bottom('newStudies', 'totalStudies') - includedTop, w.includedStage, 22, 30),
    ],
  };
}

function otherPipelineConnections(
  byId: Map<DiagramNode['id'], DiagramNode>,
  vertical: (fromId: DiagramNode['id'], toId: DiagramNode['id']) => void,
  horizontal: (fromId: DiagramNode['id'], toId: DiagramNode['id']) => void,
  connections: DiagramConnection[],
): void {
  if (!byId.has('identified-other')) return;
  vertical('identified-other', 'otherReportsSought');
  horizontal('otherReportsSought', 'otherReportsNotRetrieved');
  vertical('otherReportsSought', 'otherReportsAssessed');
  horizontal('otherReportsAssessed', 'otherReportsExcluded');
  const source = byId.get('otherReportsAssessed');
  const included = byId.get('newStudies');
  if (source && included) connections.push({ id: 'other-newStudies', d: `M ${source.x + source.width / 2} ${source.y + source.height} V ${included.y + included.height / 2} H ${included.x + included.width + 7}` });
}

export function getDiagramConnections(nodes: DiagramNode[], style: DiagramStyle): DiagramConnection[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const connections: DiagramConnection[] = [];
  const vertical = (fromId: DiagramNode['id'], toId: DiagramNode['id']) => { const from = byId.get(fromId); const to = byId.get(toId); if (from && to) connections.push({ id: `${fromId}-${toId}`, d: `M ${from.x + from.width / 2} ${from.y + from.height} V ${to.y - 7}` }); };
  const horizontal = (fromId: DiagramNode['id'], toId: DiagramNode['id']) => { const from = byId.get(fromId); const to = byId.get(toId); if (from && to) connections.push({ id: `${fromId}-${toId}`, d: `M ${from.x + from.width} ${from.y + from.height / 2} H ${to.x - 7}` }); };
  if (style === 'modern') {
    vertical('previousStudies', 'identified-main');
    vertical('identified-main', 'removed');
    vertical('removed', 'screened');
    horizontal('screened', 'recordsExcluded');
    vertical('screened', 'reportsSought');
    horizontal('reportsSought', 'reportsNotRetrieved');
    vertical('reportsSought', 'reportsAssessed');
    horizontal('reportsAssessed', 'reportsExcluded');
    vertical('reportsAssessed', 'newStudies');
    vertical('newStudies', 'totalStudies');
    otherPipelineConnections(byId, vertical, horizontal, connections);
    return connections;
  }
  vertical('previousStudies', 'identified-main');
  vertical('identified-main', 'screened');
  horizontal('identified-main', 'removed');
  horizontal('screened', 'recordsExcluded');
  vertical('screened', 'reportsSought');
  horizontal('reportsSought', 'reportsNotRetrieved');
  vertical('reportsSought', 'reportsAssessed');
  horizontal('reportsAssessed', 'reportsExcluded');
  vertical('reportsAssessed', 'newStudies');
  vertical('newStudies', 'totalStudies');
  otherPipelineConnections(byId, vertical, horizontal, connections);
  return connections;
}
