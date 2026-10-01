import { calculateProject, hasOtherSources, isUpdatedModel } from './calculations';
import { countKeys, type CountKey, type Locale, type PrismaProject, type ValidationIssue } from './types';

const issue = (
  id: string,
  status: ValidationIssue['status'],
  title: string,
  location: ValidationIssue['location'],
  why: string,
  how: string,
  related: CountKey[] = [],
): ValidationIssue => ({ id, status, title, location, why, how, related });

const messages: Record<
  Locale,
  {
    missingTitle: { title: string; why: string; how: string };
    negativeNumber: { title: string; why: string; how: string };
    missingRequired: { title: string; why: string; how: string };
    updatedPrevious: { title: string; why: string; how: string };
    emptyOtherBranch: { title: string; why: string; how: string };
    otherMissing: { title: string; why: string; how: string };
    reasonsSum: (sum: number) => { title: string; why: string; how: string };
    otherReasonsSum: (sum: number) => { title: string; why: string; how: string };
    negativeDerivation: { title: string; why: string; how: string };
    reportsBelowStudies: { title: string; why: string; how: string };
    override: (hasJustification: boolean, justification: string) => { title: string; why: string; how: string };
    flowConsistent: { title: string; why: string; how: string };
  }
> = {
  'pt-BR': {
    missingTitle: {
      title: 'O título da revisão está ausente',
      why: 'O título identifica o projeto e suas exportações.',
      how: 'Informe um título descritivo.',
    },
    negativeNumber: {
      title: 'Use um número inteiro não negativo',
      why: 'Contagens do fluxo representam unidades discretas.',
      how: 'Substitua o valor por um inteiro igual ou maior que zero.',
    },
    missingRequired: {
      title: 'Contagem obrigatória ausente',
      why: 'Sem esse valor, parte do fluxo não pode ser verificada.',
      how: 'Informe zero quando a etapa ocorreu sem resultados.',
    },
    updatedPrevious: {
      title: 'A revisão atualizada precisa dos totais anteriores',
      why: 'O modelo atualizado distingue estudos anteriores dos novos.',
      how: 'Informe estudos e relatos da versão anterior.',
    },
    emptyOtherBranch: {
      title: 'O ramo de outras fontes está vazio',
      why: 'O modelo selecionado exibe um ramo que não contém dados.',
      how: 'Informe as contagens ou escolha o modelo somente com bases e registros.',
    },
    otherMissing: {
      title: 'Contagem obrigatória ausente',
      why: 'O ramo de outros métodos também precisa desse valor para fechar o fluxo.',
      how: 'Informe zero quando a etapa ocorreu sem resultados.',
    },
    reasonsSum: (sum) => ({
      title: 'As razões de exclusão não fecham o total',
      why: 'A soma detalhada deve corresponder aos relatos excluídos após elegibilidade.',
      how: `Revise as razões: a soma atual é ${sum}.`,
    }),
    otherReasonsSum: (sum) => ({
      title: 'As razões de exclusão de outros métodos não fecham o total',
      why: 'A soma detalhada deve corresponder aos relatos excluídos no ramo de outros métodos.',
      how: `Revise as razões: a soma atual é ${sum}.`,
    }),
    negativeDerivation: {
      title: 'Uma subtração do fluxo produz valor negativo',
      why: 'Há mais exclusões ou remoções do que unidades disponíveis na etapa anterior.',
      how: 'Revise os valores relacionados; o sistema não aumentará totais apenas para fazê-los fechar.',
    },
    reportsBelowStudies: {
      title: 'Há menos relatos do que estudos incluídos',
      why: 'Em geral, cada estudo incluído é descrito por pelo menos um relato.',
      how: 'Confirme a distinção entre estudo e relato e documente a exceção.',
    },
    override: (hasJustification, justification) => ({
      title: 'Valor derivado substituído manualmente',
      why: 'A substituição quebra a derivação automática e precisa ser rastreável.',
      how: hasJustification ? `Justificativa registrada: ${justification}` : 'Adicione uma justificativa ou remova a substituição.',
    }),
    flowConsistent: {
      title: 'As relações numéricas verificadas estão consistentes',
      why: 'As regras do modelo selecionado foram avaliadas.',
      how: 'Continue a revisão metodológica do manuscrito; esta verificação não equivale a certificação.',
    },
  },
  en: {
    missingTitle: {
      title: 'Review title is missing',
      why: 'The title identifies the project and its exports.',
      how: 'Enter a descriptive title.',
    },
    negativeNumber: {
      title: 'Use a non-negative integer',
      why: 'Flow counts represent discrete units.',
      how: 'Replace the value with an integer equal to or greater than zero.',
    },
    missingRequired: {
      title: 'Required count is missing',
      why: 'Without this count, part of the flow cannot be verified.',
      how: 'Enter zero if the step yielded no results.',
    },
    updatedPrevious: {
      title: 'Updated review requires previous totals',
      why: 'The updated model distinguishes previous studies from new ones.',
      how: 'Enter studies and reports from the previous version.',
    },
    emptyOtherBranch: {
      title: 'Other sources branch is empty',
      why: 'The selected model displays a branch with no data.',
      how: 'Enter counts or switch to the databases & registers only model.',
    },
    otherMissing: {
      title: 'Required count is missing',
      why: 'The other methods branch needs this value to complete the flow.',
      how: 'Enter zero if the step yielded no results.',
    },
    reasonsSum: (sum) => ({
      title: 'Exclusion reasons sum does not match total',
      why: 'The detailed sum must equal reports excluded after eligibility assessment.',
      how: `Inspect reasons: current sum is ${sum}.`,
    }),
    otherReasonsSum: (sum) => ({
      title: 'Other methods exclusion reasons sum does not match total',
      why: 'The detailed sum must equal reports excluded in the other methods branch.',
      how: `Inspect reasons: current sum is ${sum}.`,
    }),
    negativeDerivation: {
      title: 'A flow subtraction yields a negative number',
      why: 'There are more exclusions/removals than available units in the previous stage.',
      how: 'Check related counts; the system will not artificially increase totals.',
    },
    reportsBelowStudies: {
      title: 'Fewer reports than included studies',
      why: 'Typically, each included study is described by at least one report.',
      how: 'Confirm the distinction between study and report or document the exception.',
    },
    override: (hasJustification, justification) => ({
      title: 'Derived value manually overridden',
      why: 'Overrides bypass automatic calculation and must be traceable.',
      how: hasJustification ? `Recorded rationale: ${justification}` : 'Add a rationale or remove the override.',
    }),
    flowConsistent: {
      title: 'Verified numerical relationships are consistent',
      why: 'The rules of the selected model were evaluated.',
      how: 'Continue methodological manuscript review; this check does not constitute certification.',
    },
  },
  it: {
    missingTitle: {
      title: 'Il titolo della revisione è assente',
      why: 'Il titolo identifica il progetto e le esportazioni.',
      how: 'Inserisci un titolo descrittivo.',
    },
    negativeNumber: {
      title: 'Usa un numero intero non negativo',
      why: 'I conteggi del flusso rappresentano unità discrete.',
      how: 'Sostituisci il valore con un intero maggiore o uguale a zero.',
    },
    missingRequired: {
      title: 'Conteggio obbligatorio mancante',
      why: 'Senza questo valore, parte del flusso non può essere verificata.',
      how: 'Inserisci zero se la fase non ha prodotto risultati.',
    },
    updatedPrevious: {
      title: 'La revisione aggiornata richiede i totali precedenti',
      why: 'Il modello aggiornato distingue gli studi precedenti da quelli nuovi.',
      how: 'Inserisci studi e report della versione precedente.',
    },
    emptyOtherBranch: {
      title: 'Il ramo delle altre fonti è vuoto',
      why: 'Il modello selezionato mostra un ramo che non contiene dati.',
      how: 'Inserisci i conteggi o scegli il modello solo con banche dati e registri.',
    },
    otherMissing: {
      title: 'Conteggio obbligatorio mancante',
      why: 'Anche il ramo di altri metodi necessita di questo valore.',
      how: 'Inserisci zero se la fase non ha prodotto risultati.',
    },
    reasonsSum: (sum) => ({
      title: 'La somma dei motivi di esclusione non coincide con il totale',
      why: 'La somma dettagliata deve corrispondere ai report esclusi.',
      how: `Rivedi i motivi: la somma attuale è ${sum}.`,
    }),
    otherReasonsSum: (sum) => ({
      title: 'I motivi di esclusione per altri metodi non coincidono con il totale',
      why: 'La somma dettagliata deve corrispondere ai report esclusi con altri metodi.',
      how: `Rivedi i motivi: la somma attuale è ${sum}.`,
    }),
    negativeDerivation: {
      title: 'Una sottrazione del flusso produce un valore negativo',
      why: 'Ci sono più esclusioni rispetto alle unità disponibili nella fase precedente.',
      how: 'Rivedi i valori correlati.',
    },
    reportsBelowStudies: {
      title: 'Ci sono meno report che studi inclusi',
      why: 'In genere ogni studio incluso è descritto da almeno un report.',
      how: 'Verifica la distinzione tra studio e report.',
    },
    override: (hasJustification, justification) => ({
      title: 'Valore derivato sostituito manualmente',
      why: 'La sostituzione interrompe il calcolo automatico.',
      how: hasJustification ? `Giustificazione: ${justification}` : 'Aggiungi una motivazione o rimuovi la modifica.',
    }),
    flowConsistent: {
      title: 'Le relazioni numeriche verificate sono coerenti',
      why: 'Le regole del modello selezionato sono state verificate.',
      how: 'Continua la revisione metodologica del manoscritto.',
    },
  },
  fr: {
    missingTitle: {
      title: 'Le titre de la revue est manquant',
      why: 'Le titre identifie le projet et ses exports.',
      how: 'Renseignez un titre descriptif.',
    },
    negativeNumber: {
      title: 'Utilisez un entier non négatif',
      why: 'Les données de comptage représentent des unités discrètes.',
      how: 'Remplacez la valeur par un entier supérieur ou égal à zéro.',
    },
    missingRequired: {
      title: 'Comptage obligatoire manquant',
      why: 'Sans cette valeur, une partie du flux ne peut être vérifiée.',
      how: 'Renseignez zéro si l’étape n’a produit aucun résultat.',
    },
    updatedPrevious: {
      title: 'La revue mise à jour nécessite les totaux antérieurs',
      why: 'Le modèle mis à jour distingue les études antérieures des nouvelles.',
      how: 'Renseignez les études et rapports de la version précédente.',
    },
    emptyOtherBranch: {
      title: 'La branche des autres sources est vide',
      why: 'Le modèle sélectionné affiche une branche sans données.',
      how: 'Renseignez les données ou choisissez le modèle sans autres sources.',
    },
    otherMissing: {
      title: 'Comptage obligatoire manquant',
      why: 'La branche des autres méthodes a également besoin de cette valeur.',
      how: 'Renseignez zéro si l’étape n’a produit aucun résultat.',
    },
    reasonsSum: (sum) => ({
      title: 'La somme des motifs d’exclusion ne correspond pas au total',
      why: 'La somme détaillée doit être égale aux rapports exclus après éligibilité.',
      how: `Vérifiez les motifs : la somme actuelle est ${sum}.`,
    }),
    otherReasonsSum: (sum) => ({
      title: 'La somme des motifs d’exclusion (autres méthodes) ne correspond pas au total',
      why: 'La somme détaillée doit correspondre aux rapports exclus dans cette branche.',
      how: `Vérifiez les motifs : la somme actuelle est ${sum}.`,
    }),
    negativeDerivation: {
      title: 'Une soustraction du flux produit un nombre négatif',
      why: 'Il y a plus d’exclusions que d’unités disponibles à l’étape précédente.',
      how: 'Vérifiez les valeurs associées.',
    },
    reportsBelowStudies: {
      title: 'Moins de rapports que d’études incluses',
      why: 'En général, chaque étude incluse est décrite par au moins un rapport.',
      how: 'Confirmez la distinction entre étude et rapport.',
    },
    override: (hasJustification, justification) => ({
      title: 'Valeur dérivée remplacée manuellement',
      why: 'Le remplacement manuel interrompt le calcul automatique.',
      how: hasJustification ? `Justification enregistrée : ${justification}` : 'Ajoutez une justification ou retirez le remplacement.',
    }),
    flowConsistent: {
      title: 'Les relations numériques vérifiées sont cohérentes',
      why: 'Les règles du modèle sélectionné ont été évaluées.',
      how: 'Poursuivez la révision méthodologique du manuscrit.',
    },
  },
  de: {
    missingTitle: {
      title: 'Titel der Übersichtsarbeit fehlt',
      why: 'Der Titel identifiziert das Projekt und die Exporte.',
      how: 'Geben Sie einen aussagekräftigen Titel ein.',
    },
    negativeNumber: {
      title: 'Verwenden Sie eine nicht-negative ganze Zahl',
      why: 'Zählungen stellen diskrete Einheiten dar.',
      how: 'Ersetzen Sie den Wert durch eine ganze Zahl größer oder gleich null.',
    },
    missingRequired: {
      title: 'Erforderliche Zählung fehlt',
      why: 'Ohne diesen Wert kann ein Teil des Flusses nicht geprüft werden.',
      how: 'Geben Sie null ein, wenn der Schritt keine Ergebnisse lieferte.',
    },
    updatedPrevious: {
      title: 'Aktualisiertes Review benötigt vorherige Gesamtzahlen',
      why: 'Das aktualisierte Modell unterscheidet frühere von neuen Studien.',
      how: 'Geben Sie Studien und Berichte der früheren Version an.',
    },
    emptyOtherBranch: {
      title: 'Zweig weiterer Quellen ist leer',
      why: 'Das gewählte Modell zeigt einen Zweig ohne Daten.',
      how: 'Geben Sie Zählungen ein oder wechseln Sie zum Modell nur mit Datenbanken.',
    },
    otherMissing: {
      title: 'Erforderliche Zählung fehlt',
      why: 'Auch der Zweig weiterer Methoden benötigt diesen Wert.',
      how: 'Geben Sie null ein, wenn der Schritt keine Ergebnisse lieferte.',
    },
    reasonsSum: (sum) => ({
      title: 'Summe der Ausschlussgründe stimmt nicht mit Gesamtzahl überein',
      why: 'Die Summe muss den nach Eignung ausgeschlossenen Berichten entsprechen.',
      how: `Gründe prüfen: Aktuelle Summe ist ${sum}.`,
    }),
    otherReasonsSum: (sum) => ({
      title: 'Ausschlussgründe weiterer Methoden stimmen nicht mit Gesamtzahl überein',
      why: 'Die Summe muss den ausgeschlossenen Berichten dieses Zweigs entsprechen.',
      how: `Gründe prüfen: Aktuelle Summe ist ${sum}.`,
    }),
    negativeDerivation: {
      title: 'Eine Subtraktion im Fluss ergibt einen negativen Wert',
      why: 'Es gibt mehr Ausschlüsse als verfügbare Einheiten im vorherigen Schritt.',
      how: 'Verwandte Werte überprüfen.',
    },
    reportsBelowStudies: {
      title: 'Weniger Berichte als eingeschlossene Studien',
      why: 'In der Regel wird jede Studie durch mindestens einen Bericht beschrieben.',
      how: 'Unterscheidung zwischen Studie und Bericht prüfen.',
    },
    override: (hasJustification, justification) => ({
      title: 'Abgeleiteter Wert manuell überschrieben',
      why: 'Überschreibungen unterbrechen die automatische Berechnung.',
      how: hasJustification ? `Begründung: ${justification}` : 'Fügen Sie eine Begründung hinzu oder entfernen Sie die Überschreibung.',
    }),
    flowConsistent: {
      title: 'Geprüfte Zahlenverhältnisse sind konsistent',
      why: 'Die Regeln des gewählten Modells wurden ausgewertet.',
      how: 'Methodische Begutachtung fortsetzen.',
    },
  },
  'zh-CN': {
    missingTitle: {
      title: '综述标题缺失',
      why: '标题用于识别项目及其导出成果。',
      how: '请输入描述性标题。',
    },
    negativeNumber: {
      title: '请使用非负整数',
      why: '流程图计数代表独立的离散单位。',
      how: '请将数值替换为大于或等于零的整数。',
    },
    missingRequired: {
      title: '缺少必填计数项',
      why: '若缺少此数值，部分流程将无法完成验证。',
      how: '若该步骤未检索到文献，请输入 0。',
    },
    updatedPrevious: {
      title: '更新综述需要既往版本总数',
      why: '更新综述模型需区分既往纳入研究与新纳入研究。',
      how: '请输入既往版本的各项研究与报告总数。',
    },
    emptyOtherBranch: {
      title: '其他来源分支为空',
      why: '所选模型包含一个未填写任何数据的方法分支。',
      how: '请填写相关数据，或切换为仅包含数据库和注册库的模型。',
    },
    otherMissing: {
      title: '缺少必填计数项',
      why: '其他方法分支同样需要此数值以完成流程闭环。',
      how: '若该步骤未检索到文献，请输入 0。',
    },
    reasonsSum: (sum) => ({
      title: '排除理由合计与总数不一致',
      why: '各项排除理由的具体数量总和必须等于合格性评估后排除的报告总数。',
      how: `请检查排除理由：当前合计为 ${sum}。`,
    }),
    otherReasonsSum: (sum) => ({
      title: '其他方法的排除理由合计与总数不一致',
      why: '其他方法排除理由的具体数量总和必须等于该分支排除的报告数。',
      how: `请检查排除理由：当前合计为 ${sum}。`,
    }),
    negativeDerivation: {
      title: '流程图减法计算产生负数',
      why: '排除或移除的数量超过了前一阶段可用的单位总数。',
      how: '请核对相关数值；系统不会人为虚增总数。',
    },
    reportsBelowStudies: {
      title: '报告数少于纳入的研究数',
      why: '通常情况下，每项纳入的研究至少由一份报告或文献所阐述。',
      how: '请确认研究与报告的区分，并记录该特殊情况。',
    },
    override: (hasJustification, justification) => ({
      title: '派生值已手动覆盖',
      why: '手动覆盖会中断自动计算，需具备可追溯理由。',
      how: hasJustification ? `已记录理由：${justification}` : '请添加说明理由或取消手动覆盖。',
    }),
    flowConsistent: {
      title: '验证的各项数值逻辑关系完全一致',
      why: '已通过所选模型全部规则的核对评估。',
      how: '请继续文稿的方法学审查；本验证不代表期刊认证。',
    },
  },
};

export function validateProject(project: PrismaProject, locale: Locale = 'pt-BR'): ValidationIssue[] {
  const t = messages[locale] || messages['pt-BR'];
  const result: ValidationIssue[] = [];
  const calculated = calculateProject(project);
  const values = calculated.values;

  if (!project.title.trim()) {
    result.push(issue('project-title', 'missing', t.missingTitle.title, 'project', t.missingTitle.why, t.missingTitle.how));
  }

  for (const key of countKeys) {
    const raw = project.counts[key];
    if (raw !== null && (!Number.isInteger(raw) || raw < 0)) {
      result.push(issue(`number-${key}`, 'inconsistency', t.negativeNumber.title, key, t.negativeNumber.why, t.negativeNumber.how, [key]));
    }
  }

  const required: CountKey[] = ['databases', 'duplicates', 'recordsExcluded', 'reportsNotRetrieved', 'reportsExcluded', 'newStudies'];
  required.forEach((key) => {
    if (project.counts[key] === null) {
      result.push(issue(`missing-${key}`, 'missing', t.missingRequired.title, key, t.missingRequired.why, t.missingRequired.how, [key]));
    }
  });

  if (isUpdatedModel(project.model) && (project.counts.previousStudies === null || project.counts.previousReports === null)) {
    result.push(issue('updated-previous', 'missing', t.updatedPrevious.title, 'model', t.updatedPrevious.why, t.updatedPrevious.how, ['previousStudies', 'previousReports']));
  }

  if (hasOtherSources(project.model)) {
    const other = ['websites', 'organisations', 'citationSearching', 'otherSources'] as CountKey[];
    const otherSourcesList = (project.sources || []).filter((s) => s.type !== 'database');
    const hasAnyOtherInCounts = other.some((key) => (project.counts[key] ?? 0) > 0);
    const hasAnyOtherInSources = otherSourcesList.some((s) => (s.count || 0) > 0);
    if (!hasAnyOtherInCounts && !hasAnyOtherInSources && otherSourcesList.length === 0) {
      result.push(issue('empty-other-branch', 'attention', t.emptyOtherBranch.title, 'model', t.emptyOtherBranch.why, t.emptyOtherBranch.how, other));
    }

    const otherRequired: CountKey[] = ['otherReportsSought', 'otherReportsNotRetrieved', 'otherReportsAssessed', 'otherReportsExcluded'];
    otherRequired.forEach((key) => {
      if (project.counts[key] === null) {
        result.push(issue(`missing-${key}`, 'missing', t.otherMissing.title, key, t.otherMissing.why, t.otherMissing.how, [key]));
      }
    });
  }

  const exclusionSum = project.exclusionReasons.reduce((sum, reason) => sum + reason.count, 0);
  if (project.exclusionReasons.length && exclusionSum !== (project.counts.reportsExcluded ?? 0)) {
    const m = t.reasonsSum(exclusionSum);
    result.push(issue('reasons-sum', 'inconsistency', m.title, 'reportsExcluded', m.why, m.how, ['reportsExcluded']));
  }

  const otherExclusionSum = project.otherExclusionReasons.reduce((sum, reason) => sum + reason.count, 0);
  if (project.otherExclusionReasons.length && otherExclusionSum !== (project.counts.otherReportsExcluded ?? 0)) {
    const m = t.otherReasonsSum(otherExclusionSum);
    result.push(issue('other-reasons-sum', 'inconsistency', m.title, 'otherReportsExcluded', m.why, m.how, ['otherReportsExcluded']));
  }

  const otherSourcesCount = (project.sources || []).filter((s) => s.type !== 'database').reduce((acc, s) => acc + (s.count || 0), 0);
  const otherTotalVal = otherSourcesCount > 0 ? otherSourcesCount : ((project.counts.websites ?? 0) + (project.counts.organisations ?? 0) + (project.counts.citationSearching ?? 0) + (project.counts.otherSources ?? 0));
  const identified = (values.databases ?? 0) + (project.counts.registers ?? 0) + (hasOtherSources(project.model) ? otherTotalVal : 0);
  const removed = (project.counts.duplicates ?? 0) + (project.counts.automationExcluded ?? 0) + (project.counts.removedOther ?? 0);
  const otherNegative = hasOtherSources(project.model) && ((project.counts.otherReportsNotRetrieved ?? 0) > (project.counts.otherReportsSought ?? 0) || (project.counts.otherReportsExcluded ?? 0) > (project.counts.otherReportsAssessed ?? 0));
  if (removed > identified || (project.counts.recordsExcluded ?? 0) > (values.screened ?? 0) || (project.counts.reportsNotRetrieved ?? 0) > (values.reportsSought ?? 0) || (project.counts.reportsExcluded ?? 0) > (values.reportsAssessed ?? 0) || otherNegative) {
    result.push(issue('negative-derivation', 'inconsistency', t.negativeDerivation.title, 'project', t.negativeDerivation.why, t.negativeDerivation.how, ['screened', 'recordsExcluded', 'reportsSought', 'reportsNotRetrieved', 'reportsAssessed', 'reportsExcluded', 'otherReportsSought', 'otherReportsNotRetrieved', 'otherReportsAssessed', 'otherReportsExcluded']));
  }

  if ((values.totalReports ?? 0) < (values.totalStudies ?? 0)) {
    result.push(issue('reports-below-studies', 'attention', t.reportsBelowStudies.title, 'totalReports', t.reportsBelowStudies.why, t.reportsBelowStudies.how, ['totalReports', 'totalStudies']));
  }

  Object.entries(project.overrides).forEach(([key, override]) => {
    if (override) {
      const hasJust = Boolean(override.justification.trim());
      const m = t.override(hasJust, override.justification);
      result.push(issue(`override-${key}`, hasJust ? 'attention' : 'inconsistency', m.title, key as CountKey, m.why, m.how, [key as CountKey]));
    }
  });

  if (!result.some((item) => item.status === 'inconsistency' || item.status === 'missing')) {
    result.unshift(issue('flow-consistent', 'valid', t.flowConsistent.title, 'project', t.flowConsistent.why, t.flowConsistent.how));
  }
  return result;
}
