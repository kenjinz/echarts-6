import type { EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import { getExample } from '../src/app/experimentRegistry';
import { createCells } from '../src/data/cells';
import { buildThreeDimensionalOption } from '../src/experiments/buildThreeDimensionalOption';
import { buildDimensionalOption } from '../src/experiments/buildDimensionalOption';
import { createDefaultSnapshot } from '../src/sharing/optionState';

type Component = Record<string, unknown>;
type InspectableOption = EChartsOption & {
  grid3D?: Component | Component[];
  grid?: Component | Component[];
  series?: Component | Component[];
  legend?: Component | Component[];
  visualMap?: Component | Component[];
  dataZoom?: Component | Component[];
};

function list(value: Component | Component[] | undefined): Component[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function build(id: string): InspectableOption {
  const snapshot = createDefaultSnapshot(id, 20260914);
  return buildThreeDimensionalOption({
    example: getExample(id),
    cells: createCells(2, 2),
    snapshot
  }) as InspectableOption;
}

describe('ECharts-GL option boundary', () => {
  it('keeps the G01 native matrix-placement attempt explicit', () => {
    const grids = list(build('G01').grid3D);

    expect(grids).toHaveLength(4);
    expect(grids.every((grid) => grid.coordinateSystem === 'matrix')).toBe(true);
    expect(grids.every((grid) => grid.matrixId === 'matrix/main')).toBe(true);
    expect(grids.map((grid) => grid.coord)).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]);
  });

  it('uses explicit one-instance boxes for the fallback grid3D layout', () => {
    const grids = list(build('G02').grid3D);

    expect(grids).toHaveLength(4);
    expect(grids.every((grid) => typeof grid.left === 'string')).toBe(true);
    expect(grids.every((grid) => typeof grid.top === 'string')).toBe(true);
    expect(grids.every((grid) => !('coordinateSystem' in grid))).toBe(true);
  });

  it('includes representative bounded 3D scatter, line, and surface series', () => {
    const seriesTypes = list(build('G06').series).map((series) => series.type);

    expect(seriesTypes).toContain('scatter3D');
    expect(seriesTypes).toContain('line3D');
    expect(seriesTypes).toContain('surface');
  });

  it('keeps 2D marginal grids in the compound 3D profile', () => {
    const snapshot = createDefaultSnapshot('G07', 20260914);
    snapshot.interactive.dataZoom['row-0:column-0/x'] = { start: 25, end: 75 };
    const option = buildThreeDimensionalOption({
      example: getExample('G07'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption & { xAxis3D?: Component | Component[] };
    const gridIds = list(option.grid).map((grid) => grid.id);

    expect(list(option.grid3D)).toHaveLength(4);
    expect(gridIds.some((id) => String(id).endsWith('/top'))).toBe(true);
    expect(gridIds.some((id) => String(id).endsWith('/right'))).toBe(true);
    expect(list(option.dataZoom)).toHaveLength(8);
    expect(list(option.legend).length).toBeGreaterThan(0);
    expect(list(option.visualMap).length).toBeGreaterThan(0);
    expect(list(option.legend).flatMap((entry) => entry.data as string[])).toEqual(
      expect.arrayContaining(['Top marginal/row-0:column-0', 'Right marginal/row-0:column-0'])
    );
    expect(list(option.xAxis3D)[0]).toEqual(expect.objectContaining({ min: -3, max: 3 }));
  });

  it('enlarges only the selected 3D viewport while preserving its identity', () => {
    const snapshot = createDefaultSnapshot('G09', 13);
    snapshot.interactive.enlargedCellId = 'row-1:column-0';
    const option = buildThreeDimensionalOption({
      example: getExample('G09'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption;
    const grids = list(option.grid3D);

    expect(grids).toHaveLength(1);
    expect(grids[0].id).toBe('grid3D/row-1:column-0/main');
    expect(grids[0]).toEqual(expect.objectContaining({ left: '4.00%', top: '5.00%' }));
  });

  it('applies maintained camera and Z-range state to each 3D cell', () => {
    const snapshot = createDefaultSnapshot('G04', 29);
    snapshot.interactive.camera['row-0:column-0'] = {
      alpha: 40,
      beta: 70,
      distance: 120,
      center: [1, 2, 3]
    };
    snapshot.interactive.axisRanges['row-0:column-0'] = { z: [-2, 9] };
    const option = buildThreeDimensionalOption({
      example: getExample('G04'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption & { zAxis3D?: Component | Component[] };

    expect(list(option.grid3D)[0].viewControl).toEqual(expect.objectContaining({
      alpha: 40,
      beta: 70,
      distance: 120,
      center: [1, 2, 3]
    }));
    expect(list(option.zAxis3D)[0]).toEqual(expect.objectContaining({ min: -2, max: 9 }));
  });

  it('combines individual 2D and 3D cells in one option', () => {
    const snapshot = createDefaultSnapshot('G08', 31);
    for (const cell of createCells(2, 2)) snapshot.interactive.viewMode[cell.id] = '3d';
    snapshot.interactive.viewMode['row-0:column-0'] = '2d';
    const option = buildDimensionalOption({
      example: getExample('G08'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption;

    expect(list(option.grid3D)).toHaveLength(3);
    expect(list(option.grid)).toHaveLength(1);
    expect(list(option.series).some((series) => String(series.id).includes('row-0:column-0'))).toBe(true);
    expect(list(option.series).some((series) => series.type === 'scatter3D')).toBe(true);
  });

  it('groups 3D visualMap and legend targets by configured scope', () => {
    const snapshot = createDefaultSnapshot('G06', 43);
    snapshot.sharing.visualMap = 'row';
    snapshot.sharing.legendSelection = 'all';
    const option = buildThreeDimensionalOption({
      example: getExample('G06'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption & {
      legend?: Component | Component[];
      visualMap?: Component | Component[];
    };

    expect(list(option.visualMap)).toHaveLength(2);
    expect(list(option.legend)).toHaveLength(1);
    expect(list(option.legend)[0].data).toEqual(expect.arrayContaining([
      'Scatter 3D/all', 'Line 3D/all', 'Surface/all'
    ]));
  });
});
