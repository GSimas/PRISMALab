import { z } from 'zod';
import { countKeys, SCHEMA_VERSION, type PrismaProject } from './types';
import { createProject } from './project';

const countShape = Object.fromEntries(
  countKeys.map((key) => [key, z.number().int().nonnegative().nullable().default(null)]),
) as unknown as Record<(typeof countKeys)[number], z.ZodType<number | null>>;

export const projectSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string().min(1),
  title: z.string(),
  shortTitle: z.string(),
  authors: z.array(z.string()),
  institution: z.string(),
  protocolUrl: z.string(),
  reviewType: z.enum(['systematic', 'scoping', 'living', 'network-meta-analysis']),
  reviewKind: z.enum(['new', 'updated']),
  model: z.enum(['new-databases', 'new-databases-other', 'updated-databases', 'updated-databases-other']),
  guideline: z.literal('PRISMA 2020'),
  extensions: z.array(z.string()),
  locale: z.enum(['pt-BR', 'en', 'it', 'fr', 'de', 'zh-CN']),
  status: z.enum(['draft', 'review', 'complete']),
  updatedDate: z.string(),
  observations: z.string(),
  sources: z.array(z.object({ id: z.string(), type: z.enum(['database', 'register', 'website', 'organisation', 'citation', 'other']), name: z.string(), count: z.number().int().nonnegative() })),
  counts: z.object(countShape),
  overrides: z.record(z.string(), z.object({ value: z.number().int().nonnegative(), justification: z.string(), updatedAt: z.string() })),
  exclusionReasons: z.array(z.object({ id: z.string(), label: z.string(), count: z.number().int().nonnegative() })),
  otherExclusionReasons: z.array(z.object({ id: z.string(), label: z.string(), count: z.number().int().nonnegative() })).default([]),
  provenance: z.record(z.string(), z.object({ note: z.string(), responsible: z.string(), date: z.string(), url: z.string(), repositoryRef: z.string() })),
  checklist: z.array(z.object({ item: z.number().int().min(1).max(27), status: z.enum(['not-started', 'in-progress', 'complete', 'not-applicable']), note: z.string(), location: z.string(), page: z.string(), section: z.string(), url: z.string(), reviewedAt: z.string() })),
  presentation: z.object({ mode: z.enum(['prisma', 'presentation']), diagramStyle: z.enum(['classic', 'modern']).default('classic'), density: z.enum(['compact', 'comfortable']), orientation: z.enum(['portrait', 'landscape']), accent: z.string(), showTitle: z.boolean(), showOptionalDetails: z.boolean() }),
  history: z.array(z.object({ id: z.string(), at: z.string(), action: z.string(), field: z.enum(countKeys).optional(), previous: z.number().nullable().optional(), next: z.number().nullable().optional() })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export function migrateProject(input: unknown): PrismaProject {
  const raw = input as Record<string, unknown>;
  if (raw?.schemaVersion === SCHEMA_VERSION) return projectSchema.parse(raw) as PrismaProject;
  // Any JSON object would otherwise "migrate" into a blank project; a project always has counts.
  if (typeof raw?.counts !== 'object' || raw.counts === null) throw new Error('Not a PRISMA Lab project.');
  const base = createProject();
  const legacy = raw;
  return projectSchema.parse({
    ...base,
    ...legacy,
    schemaVersion: SCHEMA_VERSION,
    counts: { ...base.counts, ...((legacy.counts as object) ?? {}) },
    presentation: { ...base.presentation, ...((legacy.presentation as object) ?? {}) },
    checklist: Array.isArray(legacy.checklist) ? legacy.checklist : base.checklist,
  }) as PrismaProject;
}
