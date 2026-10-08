import type { EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import { getExample } from '../src/app/experimentRegistry';
import { createCells } from '../src/data/cells';
import {
  buildPerCellCartesianOption,
  buildTwoDimensionalOption
} from '../src/experiments/buildTwoDimensionalOption';
import { createDefaultSnapshot } from '../src/sharing/optionState';

type Component = Record<string, unknown>;
type InspectableOption = EChartsOption & {
  matrix?: Component | Component[];
  grid?: Component | Component[];
  xAxis?: Component | Component[];
  yAxis?: Component | Component[];
  dataZoom?: Component | Component[];
  legend?: Component | Component[];
  visualMap?: Component | Component[];
  series?: Component | Component[];
};

function list(value: Component | Component[] | undefined): Component[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function build(id: string, rows = 2, columns = 2): InspectableOption {
  const snapshot = createDefaultSnapshot(id, 20260914);
  snapshot.rows = rows;
  snapshot.columns = columns;
  return buildTwoDimensionalOption({
    example: getExample(id),
    cells: createCells(rows, columns),
    snapshot
  }) as InspectableOption;
}

describe('2D experiment option topology', () => {
  it('hosts one explicitly identified Cartesian grid in each matrix cell', () => {
    const option = build('M02');
    const matrix = list(option.matrix);
    const grids = list(option.grid);
    const xAxes = list(option.xAxis);
    const series = list(option.series);

    expect(matrix).toHaveLength(1);
    expect(matrix[0].id).toBe('matrix/main');
    expect(grids.map((grid) => grid.id)).toEqual([
      'grid/row-0:column-0/main',
      'grid/row-0:column-1/main',
      'grid/row-1:column-0/main',
      'grid/row-1:column-1/main'
    ]);
    expect(grids.every((grid) => grid.coordinateSystem === 'matrix')).toBe(true);
    expect(xAxes.every((axis) => typeof axis.gridId === 'string')).toBe(true);
    expect(series.every((entry) => typeof entry.xAxisId === 'string')).toBe(true);
  });

  it('renders M01 scatter directly in the matrix coordinate system', () => {
    const series = list(build('M01').series);

    expect(series).toHaveLength(4);
    expect(series.every((entry) => entry.type === 'scatter')).toBe(true);
    expect(series.every((entry) => entry.coordinateSystem === 'matrix')).toBe(true);
    expect(series.every((entry) => Array.isArray(entry.coord))).toBe(true);
  });

  it('targets native X dataZoom components by row scope', () => {
    const snapshot = createDefaultSnapshot('C06', 7);
    snapshot.sharing.dataZoomX = 'row';
    const option = buildTwoDimensionalOption({
      example: getExample('C06'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption;
    const zooms = list(option.dataZoom).filter((zoom) => String(zoom.id).includes('/x/'));

    expect(zooms).toHaveLength(2);
    expect(zooms.map((zoom) => zoom.xAxisId)).toEqual([
      ['xAxis/row-0:column-0/main', 'xAxis/row-0:column-1/main'],
      ['xAxis/row-1:column-0/main', 'xAxis/row-1:column-1/main']
    ]);
  });

  it('builds clipped bounded geometry with traceable custom-series IDs', () => {
    const series = list(build('S02', 1, 1).series);

    expect(series.map((entry) => entry.id)).toEqual(expect.arrayContaining([
      'series/row-0:column-0/boundary',
      'series/row-0:column-0/regions',
      'series/row-0:column-0/symbols'
    ]));
    expect(series.find((entry) => entry.id === 'series/row-0:column-0/regions')?.clip).toBe(true);
  });

  it('creates main, top, and right plots with fixed within-cell zoom coupling', () => {
    const snapshot = createDefaultSnapshot('P04', 20260914);
    snapshot.rows = 1;
    snapshot.columns = 1;
    snapshot.interactive.dataZoom['row-0:column-0/x'] = { start: 17, end: 81 };
    const option = buildTwoDimensionalOption({
      example: getExample('P04'),
      cells: createCells(1, 1),
      snapshot
    }) as InspectableOption;
    const grids = list(option.grid);
    const zooms = list(option.dataZoom);
    const xAxes = list(option.xAxis);
    const yAxes = list(option.yAxis);

    expect(grids.map((grid) => grid.id)).toEqual([
      'grid/row-0:column-0/main',
      'grid/row-0:column-0/top',
      'grid/row-0:column-0/right'
    ]);
    expect(zooms).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'dataZoom/row-0:column-0/fixed-x',
        xAxisId: ['xAxis/row-0:column-0/main', 'xAxis/row-0:column-0/top'],
        start: 17,
        end: 81
      }),
      expect.objectContaining({
        id: 'dataZoom/row-0:column-0/fixed-y',
        yAxisId: ['yAxis/row-0:column-0/main', 'yAxis/row-0:column-0/right']
      })
    ]));
    expect(xAxes.find((axis) => String(axis.id).endsWith('/main'))?.min)
      .toBe(xAxes.find((axis) => String(axis.id).endsWith('/top'))?.min);
    expect(xAxes.find((axis) => String(axis.id).endsWith('/main'))?.max)
      .toBe(xAxes.find((axis) => String(axis.id).endsWith('/top'))?.max);
    expect(yAxes.find((axis) => String(axis.id).endsWith('/main'))?.min)
      .toBe(yAxes.find((axis) => String(axis.id).endsWith('/right'))?.min);
    expect(yAxes.find((axis) => String(axis.id).endsWith('/main'))?.max)
      .toBe(yAxes.find((axis) => String(axis.id).endsWith('/right'))?.max);
  });

  it('temporarily expands only the selected cell outside matrix box layout', () => {
    const snapshot = createDefaultSnapshot('C14', 19);
    snapshot.interactive.enlargedCellId = 'row-0:column-1';
    const option = buildTwoDimensionalOption({
      example: getExample('C14'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption;
    const grids = list(option.grid);

    expect(grids).toHaveLength(1);
    expect(grids[0].id).toBe('grid/row-0:column-1/main');
    expect(grids[0]).not.toHaveProperty('coordinateSystem');
    expect(grids[0]).toEqual(expect.objectContaining({ left: 70, right: 35, top: 70, bottom: 50 }));
    expect(list(option.series).every((series) => String(series.id).includes('row-0:column-1'))).toBe(true);
  });

  it('uses interactive axis ranges and shared legend topology', () => {
    const snapshot = createDefaultSnapshot('C09', 19);
    snapshot.sharing.legendSelection = 'all';
    snapshot.interactive.axisRanges['row-0:column-0'] = { x: [4, 18] };
    const option = buildTwoDimensionalOption({
      example: getExample('C09'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption;

    expect(list(option.xAxis)[0]).toEqual(expect.objectContaining({ min: 4, max: 18 }));
    expect(list(option.legend)).toHaveLength(1);
    expect(list(option.legend)[0].data).toEqual(['Observed/all', 'Forecast/all']);
    expect(list(option.series).filter((series) => series.name === 'Observed/all')).toHaveLength(4);
  });

  it('groups visualMap targets by row scope', () => {
    const snapshot = createDefaultSnapshot('S04', 23);
    snapshot.sharing.visualMap = 'row';
    const option = buildTwoDimensionalOption({
      example: getExample('S04'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption;
    const maps = list(option.visualMap);

    expect(maps).toHaveLength(2);
    expect(maps.map((map) => map.seriesId)).toEqual([
      ['series/row-0:column-0/symbols', 'series/row-0:column-1/symbols'],
      ['series/row-1:column-0/symbols', 'series/row-1:column-1/symbols']
    ]);
  });

  it('implements mixed axes and multiple-Y examples as distinct topologies', () => {
    const mixed = build('M03');
    expect(new Set(list(mixed.xAxis).map((axis) => axis.type))).toEqual(
      new Set(['value', 'time', 'category'])
    );
    expect(list(mixed.yAxis)).toHaveLength(5);

    const multipleY = build('C12');
    expect(list(multipleY.yAxis)).toHaveLength(8);
    expect(list(multipleY.series).filter((series) => String(series.id).endsWith('/secondary'))).toHaveLength(4);
    expect(list(multipleY.yAxis).filter((axis) => String(axis.id).endsWith('/secondary')).map((axis) => axis.type))
      .toEqual(['value', 'log', 'value', 'log']);
  });

  it('uses boundary-only visible axes for the C05 synchronized-axis comparison', () => {
    const snapshot = createDefaultSnapshot('C05', 19);
    snapshot.sharing.xRange = snapshot.sharing.yRange = 'all';
    const option = buildTwoDimensionalOption({ example: getExample('C05'), cells: createCells(2, 2), snapshot }) as InspectableOption;
    const xAxes = list(option.xAxis);
    const yAxes = list(option.yAxis);
    expect(xAxes.filter((axis) => (axis.axisLine as Component).show === true)).toHaveLength(2);
    expect(yAxes.filter((axis) => (axis.axisLine as Component).show === true)).toHaveLength(2);
  });

  it('uses square grid boxes for the S09 aspect-ratio probe', () => {
    const grids = list(build('S09').grid);
    expect(grids.every((grid) => typeof grid.width === 'number' && grid.width === grid.height)).toBe(true);
  });

  it('keeps P10 top-Y and right-X ranges independent from fixed dimensions', () => {
    const snapshot = createDefaultSnapshot('P10', 11);
    snapshot.interactive.axisRanges['row-0:column-0'] = {
      x: [-10, 10],
      y: [-10, 10],
      topY: [2, 18],
      rightX: [4, 28]
    };
    const option = buildTwoDimensionalOption({
      example: getExample('P10'),
      cells: createCells(1, 1),
      snapshot
    }) as InspectableOption;
    const xAxes = list(option.xAxis);
    const yAxes = list(option.yAxis);
    expect(xAxes.find((axis) => String(axis.id).endsWith('/right'))).toEqual(
      expect.objectContaining({ min: 4, max: 28 })
    );
    expect(yAxes.find((axis) => String(axis.id).endsWith('/top'))).toEqual(
      expect.objectContaining({ min: 2, max: 18 })
    );
    expect(getExample('P10').sharing.map((capability) => capability.element)).toEqual([
      'topYRange', 'rightXRange'
    ]);
  });

  it('leaves an intentional empty matrix cell in M05', () => {
    const option = build('M05');
    expect(list(option.grid)).toHaveLength(3);
    expect(list(option.series).some((series) => String(series.id).includes('row-1:column-1'))).toBe(false);
  });

  it('uses equivalent series data in the R04 per-cell baseline', () => {
    const snapshot = createDefaultSnapshot('R04', 20260914);
    const cell = createCells(2, 2)[0];
    const baseline = buildPerCellCartesianOption(cell, snapshot) as InspectableOption;
    const matrix = buildTwoDimensionalOption({
      example: getExample('M02'),
      cells: [cell],
      snapshot
    }) as InspectableOption;

    expect(list(baseline.series).map((series) => series.data)).toEqual(
      list(matrix.series).map((series) => series.data)
    );
  });

  it('implements P08 as explicit calculated boxes rather than matrix-hosted grids', () => {
    const grids = list(build('P08').grid);

    expect(grids.length).toBeGreaterThan(0);
    expect(grids.every((grid) => !('coordinateSystem' in grid))).toBe(true);
    expect(grids.every((grid) => typeof grid.left === 'string' && typeof grid.top === 'string')).toBe(true);
  });

  it('implements P06 with distinct matrix subregions for main and marginal plots', () => {
    const option = build('P06', 1, 1);
    const matrix = list(option.matrix)[0];
    const grids = list(option.grid);

    expect((matrix.x as Component).data).toHaveLength(2);
    expect((matrix.y as Component).data).toHaveLength(2);
    expect(grids.map((grid) => grid.coord)).toEqual([[0, 1], [0, 0], [1, 1]]);
  });

  it('targets real bounded and compound series names and restores selection state', () => {
    const boundedSnapshot = createDefaultSnapshot('S02', 37);
    boundedSnapshot.interactive.symbolVisibility['row-0:column-0'] = false;
    boundedSnapshot.interactive.selectedDataItems['row-0:column-0'] = ['region-1'];
    const bounded = buildTwoDimensionalOption({
      example: getExample('S02'),
      cells: createCells(2, 2),
      snapshot: boundedSnapshot
    }) as InspectableOption;
    const boundedLegendData = list(bounded.legend).flatMap((legend) => legend.data as string[]);
    const symbolSeries = list(bounded.series).find((series) => series.id === 'series/row-0:column-0/symbols');
    const regions = list(bounded.series).find((series) => series.id === 'series/row-0:column-0/regions');

    expect(boundedLegendData).toContain('Regions/row-0:column-0');
    expect(boundedLegendData).not.toContain('Observed/row-0:column-0');
    expect(symbolSeries?.symbolSize).toBe(0);
    expect((regions?.data as Component[])[1]).toEqual(expect.objectContaining({ id: 'region-1', selected: true }));

    const compoundSnapshot = createDefaultSnapshot('P11', 41);
    compoundSnapshot.sharing.legendSelection = 'all';
    const compound = buildTwoDimensionalOption({
      example: getExample('P11'),
      cells: createCells(1, 1),
      snapshot: compoundSnapshot
    }) as InspectableOption;
    expect(list(compound.legend)[0].data).toEqual(expect.arrayContaining([
      'Main/all', 'Top marginal/all', 'Right marginal/all'
    ]));
  });

  it('applies reconciled series visibility to the effective legend state', () => {
    const snapshot = createDefaultSnapshot('C10', 5);
    snapshot.sharing.seriesVisibility = 'row';
    snapshot.interactive.seriesVisibility['row-0:column-0'] = false;
    const option = buildTwoDimensionalOption({
      example: getExample('C10'),
      cells: createCells(2, 2),
      snapshot
    }) as InspectableOption;
    expect(list(option.legend)[0].selected).toEqual({
      'Observed/row-0': false,
      'Forecast/row-0': false
    });
  });
});
