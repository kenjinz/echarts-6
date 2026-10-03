import { describe, expect, it } from 'vitest';

import { createCells } from '../src/data/cells';
import { createSeededRandom } from '../src/data/random';
import {
  createDefaultSnapshot,
  parseSnapshot,
  reconcileSharingState,
  serializeSnapshot
} from '../src/sharing/optionState';
import { resolveTargetCellIds } from '../src/sharing/targetResolver';

describe('deterministic foundation state', () => {
  it('generates repeatable random sequences inside the unit interval', () => {
    const first = createSeededRandom(20260914);
    const second = createSeededRandom(20260914);
    const sequence = Array.from({ length: 8 }, () => first());

    expect(sequence).toEqual(Array.from({ length: 8 }, () => second()));
    expect(sequence.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(sequence).size).toBeGreaterThan(1);
  });

  it('creates row-major cells with stable logical IDs', () => {
    expect(createCells(2, 3).map((cell) => cell.id)).toEqual([
      'row-0:column-0',
      'row-0:column-1',
      'row-0:column-2',
      'row-1:column-0',
      'row-1:column-1',
      'row-1:column-2'
    ]);
  });

  it('targets exactly the cells selected by each sharing scope', () => {
    const cells = createCells(2, 3);
    const active = 'row-1:column-1';

    expect(resolveTargetCellIds(cells, active, 'individual')).toEqual([active]);
    expect(resolveTargetCellIds(cells, active, 'all')).toEqual(cells.map((cell) => cell.id));
    expect(resolveTargetCellIds(cells, active, 'row')).toEqual([
      'row-1:column-0', 'row-1:column-1', 'row-1:column-2'
    ]);
    expect(resolveTargetCellIds(cells, active, 'column')).toEqual([
      'row-0:column-1', 'row-1:column-1'
    ]);
  });

  it('round-trips serializable sharing and interactive state', () => {
    const snapshot = createDefaultSnapshot('C06', 41);
    snapshot.sharing.dataZoomX = 'row';
    snapshot.interactive.enlargedCellId = 'row-0:column-1';
    snapshot.interactive.selectedDataItems['row-0:column-1'] = ['region-2'];

    expect(parseSnapshot(serializeSnapshot(snapshot))).toEqual(snapshot);
  });

  it('rejects incompatible snapshot versions', () => {
    expect(() => parseSnapshot(JSON.stringify({ version: 2 }))).toThrow(
      'Unsupported state snapshot version'
    );
  });

  it('rejects malformed snapshots before they reach the chart runtime', () => {
    const valid = createDefaultSnapshot('C06', 41);
    expect(() => parseSnapshot(JSON.stringify({ ...valid, rows: 9 }))).toThrow('Invalid state snapshot');
    expect(() => parseSnapshot(JSON.stringify({ ...valid, renderer: 'webgl' }))).toThrow('Invalid state snapshot');
    expect(() => parseSnapshot(JSON.stringify({ ...valid, sharing: { ...valid.sharing, xRange: 'planet' } }))).toThrow('Invalid state snapshot');
    expect(() => parseSnapshot(JSON.stringify({ ...valid, interactive: null }))).toThrow('Invalid state snapshot');
  });

  it('applies the selected conflict policy when cells become shared', () => {
    const snapshot = createDefaultSnapshot('C02', 1);
    const cells = createCells(2, 2);
    snapshot.interactive.axisRanges[cells[0].id] = { x: [3, 19] };
    snapshot.interactive.axisRanges[cells[1].id] = { x: [8, 12] };

    reconcileSharingState(snapshot, cells, cells[1].id, 'xRange', 'row', 'first-cell');
    expect(snapshot.interactive.axisRanges[cells[1].id].x).toEqual([3, 19]);

    reconcileSharingState(snapshot, cells, cells[1].id, 'xRange', 'row', 'configured');
    expect(snapshot.interactive.axisRanges[cells[0].id].x).toEqual([0, 24]);
    expect(snapshot.interactive.axisRanges[cells[1].id].x).toEqual([0, 24]);

    reconcileSharingState(snapshot, cells, cells[1].id, 'xRange', 'row', 'derived');
    expect(snapshot.interactive.axisRanges[cells[0].id].x).toBeUndefined();
    expect(snapshot.interactive.axisRanges[cells[1].id].x).toBeUndefined();

    snapshot.interactive.seriesVisibility[cells[0].id] = false;
    snapshot.interactive.seriesVisibility[cells[1].id] = true;
    reconcileSharingState(snapshot, cells, cells[1].id, 'seriesVisibility', 'row', 'first-cell');
    expect(snapshot.interactive.seriesVisibility[cells[0].id]).toBe(false);
    expect(snapshot.interactive.seriesVisibility[cells[1].id]).toBe(false);
    reconcileSharingState(snapshot, cells, cells[1].id, 'seriesVisibility', 'row', 'configured');
    expect(snapshot.interactive.seriesVisibility[cells[0].id]).toBe(true);
    reconcileSharingState(snapshot, cells, cells[1].id, 'seriesVisibility', 'row', 'derived');
    expect(snapshot.interactive.seriesVisibility[cells[0].id]).toBeUndefined();
  });
});
