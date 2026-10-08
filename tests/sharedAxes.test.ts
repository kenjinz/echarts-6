import { describe, expect, it } from 'vitest';
import { getExample } from '../src/app/experimentRegistry';
import { createCells } from '../src/data/cells';
import { buildTwoDimensionalOption } from '../src/experiments/buildTwoDimensionalOption';
import { captureOptionState } from '../src/sharing/captureState';
import { createDefaultSnapshot, reconcileSharingState, parseSnapshot, serializeSnapshot } from '../src/sharing/optionState';

const cells = createCells(2, 2);
const first = cells[0].id;

describe('shared axis ownership', () => {
  it('shares range and zoom together and reconciles every row group', () => {
    const snapshot = createDefaultSnapshot('C08', 42);
    snapshot.interactive.axisRanges[first] = { x: [3, 18] };
    snapshot.interactive.dataZoom[`${first}/x`] = { start: 20, end: 75 };
    snapshot.interactive.axisRanges[cells[2].id] = { x: [-5, 8] };
    snapshot.interactive.dataZoom[`${cells[2].id}/x`] = { start: 10, end: 90 };
    reconcileSharingState(snapshot, cells, first, 'xRange', 'row', 'first-cell');
    expect(snapshot.sharing.dataZoomX).toBe('row');
    expect(snapshot.interactive.dataZoom[`${cells[1].id}/x`]).toEqual({ start: 20, end: 75 });
    expect(snapshot.interactive.axisRanges[cells[3].id].x).toEqual([-5, 8]);
    expect(snapshot).toMatchObject({ sharedAxes: { x: { scope: 'row', groups: {
      'row-0': { range: [3, 18], zoom: { start: 20, end: 75 } },
      'row-1': { range: [-5, 8], zoom: { start: 10, end: 90 } }
    } } } });
  });

  it('treats legacy zoom sharing as shared axes, including range and visible axes', () => {
    const snapshot = createDefaultSnapshot('C06', 42);
    snapshot.interactive.axisRanges[first] = { x: [4, 19] };
    reconcileSharingState(snapshot, cells, first, 'dataZoomX', 'column', 'first-cell');
    expect(snapshot.sharing.xRange).toBe('column');
    const option = buildTwoDimensionalOption({ example: getExample('C06'), cells, snapshot }) as Record<string, any>;
    expect(option.xAxis[2]).toMatchObject({ min: 4, max: 19 });
    expect(option.xAxis.map((axis: any) => axis.axisLabel.show)).toEqual([false, false, true, true]);
  });

  it('creates group zoom controllers even when the example originally offered only range sharing', () => {
    const snapshot = createDefaultSnapshot('C04', 42);
    reconcileSharingState(snapshot, cells, first, 'xRange', 'all', 'first-cell');
    reconcileSharingState(snapshot, cells, first, 'yRange', 'all', 'first-cell');
    const option = buildTwoDimensionalOption({ example: getExample('C04'), cells, snapshot }) as Record<string, any>;
    const xZoom = option.dataZoom.filter((zoom: any) => zoom.type === 'inside' && zoom.xAxisId);
    expect(xZoom).toHaveLength(1);
    expect(xZoom[0].xAxisId).toHaveLength(4);
    expect(option.dataZoom.filter((zoom: any) => zoom.type === 'slider')).toHaveLength(2);
    expect(option.toolbox).toHaveLength(1);
  });

  it('uses the group as the authority after zoom and rebuild, and preserves state when detached', () => {
    const snapshot = createDefaultSnapshot('C04', 42);
    snapshot.interactive.axisRanges[first] = { x: [2, 21] };
    reconcileSharingState(snapshot, cells, first, 'xRange', 'all', 'first-cell');
    captureOptionState(snapshot, { dataZoom: [{ id: 'dataZoom/group-0/x/native', xAxisId: cells.map((cell) => `xAxis/${cell.id}/main`), start: 25, end: 60 }] });
    expect(snapshot).toMatchObject({ sharedAxes: { x: { groups: { all: { range: [2, 21], zoom: { start: 25, end: 60 } } } } } });
    snapshot.interactive.axisRanges[cells[1].id] = { x: [100, 200] };
    const option = buildTwoDimensionalOption({ example: getExample('C04'), cells, snapshot }) as Record<string, any>;
    expect(option.xAxis.every((axis: any) => axis.min === 2 && axis.max === 21)).toBe(true);
    expect(parseSnapshot(serializeSnapshot(snapshot))).toEqual(snapshot);
    reconcileSharingState(snapshot, cells, first, 'xRange', 'individual', 'first-cell');
    expect(snapshot.sharing.dataZoomX).toBe('individual');
    expect(snapshot.interactive.axisRanges[cells[1].id].x).toEqual([2, 21]);
    expect(snapshot.interactive.dataZoom[`${cells[1].id}/x`]).toEqual({ start: 25, end: 60 });
  });
});
