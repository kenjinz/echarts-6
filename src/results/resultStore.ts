import type { ExampleDefinition } from '../core/types';
import type { ScorecardRow } from './resultTypes';

function primaryRow(example: ExampleDefinition): ScorecardRow {
  return {
    capabilityId: `${example.id}-PRIMARY`,
    capability: example.title,
    appliesTo: example.family,
    experiment: example.id,
    nativeApi: 'Pending runtime observation',
    classification: 'Inconclusive',
    confidence: 'Low',
    evidence: [],
    limitation: 'Run the example and record evidence.',
    complexity: 'Low'
  };
}

function sharingRows(example: ExampleDefinition): ScorecardRow[] {
  return example.sharing.map((capability, index) => ({
    capabilityId: `${example.id}-${capability.element.toUpperCase()}-${index + 1}`,
    capability: `${capability.element} sharing`,
    appliesTo: example.family,
    experiment: example.id,
    nativeApi: capability.fixed ? 'Fixed within-cell coupling' : 'Option targets and public actions',
    classification: 'Inconclusive',
    confidence: 'Low',
    evidence: [],
    limitation: capability.reason ?? 'Requires scope-by-scope runtime verification.',
    complexity: capability.fixed ? 'Low' : 'Medium'
  }));
}

export function createInitialScorecard(
  examples: readonly ExampleDefinition[]
): ScorecardRow[] {
  return examples.flatMap((example) => [primaryRow(example), ...sharingRows(example)]);
}

export class ResultStore {
  readonly #rows: Map<string, ScorecardRow>;

  constructor(rows: readonly ScorecardRow[]) {
    this.#rows = new Map(rows.map((row) => [row.capabilityId, { ...row, evidence: [...row.evidence] }]));
  }

  get(capabilityId: string): ScorecardRow {
    const row = this.#rows.get(capabilityId);
    if (!row) throw new Error(`Unknown capability: ${capabilityId}`);
    return { ...row, evidence: [...row.evidence] };
  }

  update(
    capabilityId: string,
    changes: Partial<Omit<ScorecardRow, 'capabilityId'>>
  ): void {
    const current = this.get(capabilityId);
    this.#rows.set(capabilityId, {
      ...current,
      ...changes,
      evidence: changes.evidence ? [...changes.evidence] : current.evidence
    });
  }

  list(): ScorecardRow[] {
    return [...this.#rows.values()].map((row) => ({ ...row, evidence: [...row.evidence] }));
  }
}

