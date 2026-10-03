import { describe, expect, it } from 'vitest';

import { EXAMPLES } from '../src/app/experimentRegistry';
import { rowsToCsv, rowsToJson } from '../src/core/dataExport';
import { summarizeMeasurements } from '../src/core/measurement';
import { ResultStore, createInitialScorecard } from '../src/results/resultStore';

describe('evaluation evidence', () => {
  it('creates at least one traceable scorecard row per example', () => {
    const rows = createInitialScorecard(EXAMPLES);

    expect(rows.length).toBeGreaterThanOrEqual(66);
    expect(new Set(rows.map((row) => row.capabilityId)).size).toBe(rows.length);
    expect(rows.every((row) => row.classification === 'Inconclusive')).toBe(true);
  });

  it('updates one capability without changing unrelated evidence', () => {
    const store = new ResultStore(createInitialScorecard(EXAMPLES));
    const before = store.get('M02-PRIMARY');

    store.update('M02-PRIMARY', {
      classification: 'Native',
      confidence: 'High',
      evidence: ['options/M02.json', 'screenshots/M02.png']
    });

    expect(store.get('M02-PRIMARY')).toEqual({
      ...before,
      classification: 'Native',
      confidence: 'High',
      evidence: ['options/M02.json', 'screenshots/M02.png']
    });
    expect(store.get('M03-PRIMARY').classification).toBe('Inconclusive');
  });

  it('reports median and observed range without averaging away outliers', () => {
    expect(summarizeMeasurements([9, 1, 7, 3, 5])).toEqual({
      median: 5,
      minimum: 1,
      maximum: 9,
      iterations: 5
    });
  });

  it('exports grouped application data independently from chart instances', () => {
    const rows = [{
      rowLabel: 'Row 1',
      columnLabel: 'Column, 1',
      cellTitle: 'Primary cell',
      series: 'Observed',
      x: 2,
      y: 3,
      value: 11
    }];
    const quote = String.fromCharCode(34);

    expect(rowsToCsv(rows)).toContain(`Row 1,${quote}Column, 1${quote},Primary cell,Observed,2,3,11`);
    expect(JSON.parse(rowsToJson(rows))).toEqual(rows);
  });
});
