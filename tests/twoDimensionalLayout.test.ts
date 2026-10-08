import { describe, expect, it } from 'vitest';
import { getExample } from '../src/app/experimentRegistry';
import { createCells } from '../src/data/cells';
import { buildTwoDimensionalOption } from '../src/experiments/buildTwoDimensionalOption';
import { createDefaultSnapshot, parseSnapshot, serializeSnapshot } from '../src/sharing/optionState';

function build(id: string, shared = false, positions?: { x: 'top' | 'bottom'; y: 'left' | 'right' }) {
  const snapshot = createDefaultSnapshot(id, 42);
  if (shared) snapshot.sharing.xRange = snapshot.sharing.yRange = 'all';
  if (positions) Object.assign(snapshot, { sharedAxisPositions: positions });
  return buildTwoDimensionalOption({ example: getExample(id), cells: createCells(2, 2), snapshot }) as Record<string, any>;
}

describe('2D comparison layout', () => {
  it('lays out enlarged matrix-subregion plots in distinct canvas regions', () => {
    const snapshot = createDefaultSnapshot('P06', 42);
    snapshot.interactive.enlargedCellId = 'row-0:column-0';
    const option = buildTwoDimensionalOption({ example: getExample('P06'), cells: createCells(2, 2), snapshot }) as Record<string, any>;
    const [main, top, right] = option.grid;
    expect(main.left).toBe(top.left);
    expect(main.top).toBe(right.top);
    expect(parseFloat(top.top)).toBeLessThan(parseFloat(main.top));
    expect(parseFloat(right.left)).toBeGreaterThan(parseFloat(main.left));
    expect(option.grid.every((grid: any) => grid.coordinateSystem === undefined)).toBe(true);
  });

  it('keeps compound marginal value axes out of main toolbox zoom groups', () => {
    const option = build('P04');
    const zoom = option.dataZoom.find((entry: any) => entry.id === 'dataZoom/row-0:column-0/toolbox-x');
    expect(zoom.xAxisId).toEqual(['xAxis/row-0:column-0/main', 'xAxis/row-0:column-0/top']);
    const yZoom = option.dataZoom.find((entry: any) => entry.id === 'dataZoom/row-0:column-0/toolbox-y');
    expect(yZoom.yAxisId).toEqual(['yAxis/row-0:column-0/main', 'yAxis/row-0:column-0/right']);
  });

  it('preserves marginal regions when shared axes use row and column groups', () => {
    const snapshot = createDefaultSnapshot('P09', 42);
    snapshot.sharing.xRange = 'row';
    snapshot.sharing.yRange = 'column';
    const option = buildTwoDimensionalOption({ example: getExample('P09'), cells: createCells(2, 2), snapshot }) as Record<string, any>;
    expect(option.grid[1].bottom).toBe('80%');
    expect(option.grid[2].left).toBe('80%');
  });

  it('gives each independent chart a local legend and toolbox targeting its own axes', () => {
    const option = build('M02');
    expect(option.legend).toHaveLength(4);
    expect(option.toolbox).toHaveLength(4);
    for (const [index, cell] of createCells(2, 2).entries()) {
      expect(option.legend[index]).toMatchObject({ coordinateSystem: 'matrix', coord: [cell.column, cell.row] });
      expect(option.legend[index].data).toEqual([`Observed/${cell.id}`, `Forecast/${cell.id}`]);
      expect(option.toolbox[index]).toMatchObject({ coordinateSystem: 'matrix', coord: [cell.column, cell.row] });
      expect(option.toolbox[index].feature.dataZoom).toMatchObject({ xAxisId: [`xAxis/${cell.id}/main`], yAxisId: [`yAxis/${cell.id}/main`] });
    }
  });

  it.each(['S04', 'S05'])('keeps each %s visual map inside its own chart', (id) => {
    const option = build(id);
    expect(option.visualMap).toHaveLength(4);
    expect(option.visualMap.map((map: any) => map.coord)).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]);
    expect(option.visualMap.every((map: any) => map.coordinateSystem === 'matrix')).toBe(true);
  });

  it.each([
    { x: 'bottom', y: 'left', xShown: [false, false, true, true], yShown: [true, false, true, false] },
    { x: 'top', y: 'right', xShown: [true, true, false, false], yShown: [false, true, false, true] }
  ] as const)('packs shared charts and shows only $x / $y outer axes', ({ x, y, xShown, yShown }) => {
    const option = build('C04', true, { x, y });
    expect(option.grid.every((grid: any) => grid.left === 2 && grid.right === 2 && grid.top === 2 && grid.bottom === 2)).toBe(true);
    expect(option.xAxis.map((axis: any) => axis.axisLabel.show)).toEqual(xShown);
    expect(option.yAxis.map((axis: any) => axis.axisLabel.show)).toEqual(yShown);
    expect(option.xAxis.every((axis: any) => axis.position === x && axis.axisLine.onZero === false)).toBe(true);
    expect(option.yAxis.every((axis: any) => axis.position === y && axis.axisLine.onZero === false)).toBe(true);
    expect(option.xAxis.map((axis: any) => axis.axisTick.show)).toEqual(xShown);
    expect(option.yAxis.map((axis: any) => axis.axisTick.show)).toEqual(yShown);
  });

  it('restores independent axes and controls when sharing is disabled', () => {
    const option = build('C05');
    expect(option.xAxis.every((axis: any) => axis.axisLabel.show !== false)).toBe(true);
    expect(option.yAxis.every((axis: any) => axis.axisLabel.show !== false)).toBe(true);
    expect(option.toolbox).toHaveLength(4);
  });

  it('preserves axis sides in exported state and rejects invalid positions', () => {
    const snapshot = createDefaultSnapshot('C04', 42);
    Object.assign(snapshot, { sharedAxisPositions: { x: 'top', y: 'right' } });
    expect(parseSnapshot(serializeSnapshot(snapshot))).toMatchObject({ sharedAxisPositions: { x: 'top', y: 'right' } });
    Object.assign(snapshot, { sharedAxisPositions: { x: 'left', y: 'right' } });
    expect(() => parseSnapshot(serializeSnapshot(snapshot))).toThrow('Invalid state snapshot');
  });
});
