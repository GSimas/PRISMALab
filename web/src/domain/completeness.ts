import { calculateProject, hasOtherSources, isUpdatedModel } from './calculations';
import type { CalculatedCounts, CountKey, PrismaProject, ValidationIssue } from './types';
import { validateProject } from './validation';

/**
 * How far the PRISMA diagram has been filled in. This is an interface metric only:
 * it reads the same inputs as the calculations and never changes a count.
 */

export type CompletenessStageId = 'previous' | 'identification' | 'removed' | 'screening' | 'eligibility' | 'other-methods' | 'inclusion';
export type StageStatus = 'pending' | 'in-progress' | 'complete' | 'attention';

export interface CompletenessStage {
  id: CompletenessStageId;
  /** Inputs the user must provide for this stage (derived values are excluded). */
  required: CountKey[];
  filled: number;
  total: number;
  status: StageStatus;
}

export interface Completeness {
  stages: CompletenessStage[];
  filled: number;
  total: number;
  percent: number;
  /** Every required input is present and no stage has an inconsistency. */
  complete: boolean;
  /** First required input still empty, in the order the form is filled. */
  next: { stage: CompletenessStageId; field: CountKey } | null;
  /** Whether each box of the diagram already shows a determined value. */
  ready: Record<CountKey, boolean>;
}

/** Fields the user fills per stage, in form order. `websites` stands for the whole "other sources" group. */
const requiredByStage: Record<CompletenessStageId, CountKey[]> = {
  previous: ['previousStudies', 'previousReports'],
  identification: ['databases'],
  removed: ['duplicates'],
  screening: ['recordsExcluded', 'reportsNotRetrieved'],
  eligibility: ['reportsExcluded'],
  'other-methods': ['websites', 'otherReportsSought', 'otherReportsNotRetrieved', 'otherReportsAssessed', 'otherReportsExcluded'],
  inclusion: ['newStudies'],
};

/** Every field shown in a stage, used to attach validation inconsistencies to it. */
export const stageFields: Record<CompletenessStageId, CountKey[]> = {
  previous: ['previousStudies', 'previousReports'],
  identification: ['databases', 'registers'],
  removed: ['duplicates', 'automationExcluded', 'removedOther'],
  screening: ['screened', 'recordsExcluded', 'reportsSought', 'reportsNotRetrieved'],
  eligibility: ['reportsAssessed', 'reportsExcluded'],
  'other-methods': ['websites', 'organisations', 'citationSearching', 'otherSources', 'otherReportsSought', 'otherReportsNotRetrieved', 'otherReportsAssessed', 'otherReportsExcluded'],
  inclusion: ['newStudies', 'newReports', 'totalStudies', 'totalReports'],
};

const stageOrder: CompletenessStageId[] = ['previous', 'identification', 'removed', 'screening', 'eligibility', 'other-methods', 'inclusion'];

const otherGroup: CountKey[] = ['websites', 'organisations', 'citationSearching', 'otherSources'];

export function applicableStages(project: PrismaProject): CompletenessStageId[] {
  return stageOrder.filter((id) => {
    if (id === 'previous') return isUpdatedModel(project.model);
    if (id === 'other-methods') return hasOtherSources(project.model);
    return true;
  });
}

function readiness(project: PrismaProject, calculated: CalculatedCounts): Record<CountKey, boolean> {
  const { values } = calculated;
  const has = (key: CountKey) => values[key] !== null || Boolean(project.overrides[key]);
  const updated = isUpdatedModel(project.model);
  const other = hasOtherSources(project.model);
  const otherFilled = (project.sources || []).some((s) => s.type !== 'database') || otherGroup.some((key) => project.counts[key] !== null);

  const ready = Object.fromEntries(Object.keys(values).map((key) => [key, has(key as CountKey)])) as Record<CountKey, boolean>;
  for (const key of otherGroup) ready[key] = otherFilled;
  // Derived boxes only count once every input they depend on is present.
  ready.screened = Boolean(project.overrides.screened) || (ready.databases && ready.duplicates && (!other || otherFilled));
  ready.reportsSought = Boolean(project.overrides.reportsSought) || (ready.screened && ready.recordsExcluded);
  ready.reportsAssessed = Boolean(project.overrides.reportsAssessed) || (ready.reportsSought && ready.reportsNotRetrieved);
  ready.newReports = Boolean(project.overrides.newReports) || (ready.reportsAssessed && ready.reportsExcluded);
  ready.totalStudies = Boolean(project.overrides.totalStudies) || (ready.newStudies && (!updated || ready.previousStudies));
  ready.totalReports = Boolean(project.overrides.totalReports) || (ready.newReports && (!updated || ready.previousReports));
  return ready;
}

const isInconsistency = (issue: ValidationIssue) => issue.status === 'inconsistency';
const issueFields = (issue: ValidationIssue): CountKey[] => (issue.location === 'project' || issue.location === 'model' ? issue.related : [issue.location]);

export function completenessFor(project: PrismaProject, issues: ValidationIssue[] = validateProject(project)): Completeness {
  const calculated = calculateProject(project);
  const ready = readiness(project, calculated);
  const problems = issues.filter(isInconsistency).flatMap(issueFields);

  const stages = applicableStages(project).map((id): CompletenessStage => {
    const required = requiredByStage[id];
    const filled = required.filter((key) => ready[key]).length;
    const total = required.length;
    const attention = stageFields[id].some((key) => problems.includes(key));
    const status: StageStatus = attention ? 'attention' : filled === total ? 'complete' : filled > 0 ? 'in-progress' : 'pending';
    return { id, required, filled, total, status };
  });

  const filled = stages.reduce((sum, stage) => sum + stage.filled, 0);
  const total = stages.reduce((sum, stage) => sum + stage.total, 0);
  const nextStage = stages.find((stage) => stage.filled < stage.total);
  const next = nextStage ? { stage: nextStage.id, field: nextStage.required.find((key) => !ready[key])! } : null;

  return {
    stages,
    filled,
    total,
    percent: total ? Math.round((filled / total) * 100) : 0,
    complete: stages.every((stage) => stage.status === 'complete'),
    next,
    ready,
  };
}

export type BandId = 'identification' | 'screening' | 'included';
export interface BandProgress { fraction: number; complete: boolean; }

/** Which form stages feed each stage band drawn on the left edge of the diagram. */
const bandStages: Record<BandId, CompletenessStageId[]> = {
  identification: ['identification', 'removed'],
  screening: ['screening', 'eligibility', 'other-methods'],
  included: ['previous', 'inclusion'],
};

export function bandProgress(completeness: Completeness): Record<BandId, BandProgress> {
  const entries = (Object.keys(bandStages) as BandId[]).map((band) => {
    const stages = completeness.stages.filter((stage) => bandStages[band].includes(stage.id));
    const filled = stages.reduce((sum, stage) => sum + stage.filled, 0);
    const total = stages.reduce((sum, stage) => sum + stage.total, 0);
    return [band, { fraction: total ? filled / total : 0, complete: stages.every((stage) => stage.status === 'complete') }];
  });
  return Object.fromEntries(entries) as Record<BandId, BandProgress>;
}

/** Share of required inputs filled, as a whole percentage (projects list and Primi context). */
export const progressFor = (project: PrismaProject) => completenessFor(project).percent;
