import type { EChartsOption } from 'echarts';

import type { CellDefinition } from '../core/types';
import { buildTwoDimensionalOption, type TwoDimensionalBuildContext } from './buildTwoDimensionalOption';

type Component = Record<string, unknown>;

function scopeKey(
  cell: CellDefinition,
  scope: TwoDimensionalBuildContext['snapshot']['sharing']['camera']
): string {
  if (scope === 'all') return 'all';
  if (scope === 'row') return `row-${cell.row}`;
  if (scope === 'column') return `column-${cell.column}`;
  return cell.id;
}

function groupCells(
  cells: readonly CellDefinition[],
  scope: TwoDimensionalBuildContext['snapshot']['sharing']['camera']
): CellDefinition[][] {
  const groups = new Map<string, CellDefinition[]>();
  for (const cell of cells) {
    const key = scopeKey(cell, scope);
    const group = groups.get(key) ?? [];
    group.push(cell);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function componentId(kind: string, cell: CellDefinition, suffix = 'main'): string {
  return `${kind}/${cell.id}/${suffix}`;
}

function percent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function threeDimensionalCellBox(context: TwoDimensionalBuildContext, cell: CellDefinition) {
  const enlarged = Boolean(context.snapshot.interactive.enlargedCellId);
  const rows = enlarged ? 1 : context.snapshot.rows;
  const columns = enlarged ? 1 : context.snapshot.columns;
  const width = (92 - 2 * (columns - 1)) / columns;
  const height = (90 - 2 * (rows - 1)) / rows;
  return { left: 4 + (enlarged ? 0 : cell.column) * (width + 2), top: 5 + (enlarged ? 0 : cell.row) * (height + 2), width, height };
}

function absoluteGrid(
  cell: CellDefinition,
  rows: number,
  columns: number,
  camera?: TwoDimensionalBuildContext['snapshot']['interactive']['camera'][string]
): Component {
  const gap = 2;
  const marginX = 4;
  const marginY = 5;
  const width = (100 - marginX * 2 - gap * (columns - 1)) / columns;
  const height = (100 - marginY * 2 - gap * (rows - 1)) / rows;
  return {
    id: componentId('grid3D', cell),
    left: percent(marginX + cell.column * (width + gap)),
    top: percent(marginY + cell.row * (height + gap)),
    width: percent(width),
    height: percent(height),
    boxWidth: 80,
    boxDepth: 80,
    boxHeight: 55,
    environment: '#f8fafc',
    viewControl: {
      alpha: camera?.alpha ?? 25,
      beta: camera?.beta ?? 35,
      distance: camera?.distance ?? 150,
      center: camera?.center,
      projection: 'perspective'
    }
  };
}

function nativeMatrixGrid(cell: CellDefinition): Component {
  return {
    id: componentId('grid3D', cell),
    coordinateSystem: 'matrix',
    matrixId: 'matrix/main',
    coord: [cell.column, cell.row],
    boxWidth: 70,
    boxDepth: 70,
    boxHeight: 50,
    viewControl: { alpha: 25, beta: 35, distance: 140 }
  };
}

function surfaceData(cell: CellDefinition): [number, number, number][] {
  const values: [number, number, number][] = [];
  for (let x = -4; x <= 4; x += 1) {
    for (let y = -4; y <= 4; y += 1) {
      values.push([x, y, Math.sin((x + cell.column) / 2) * Math.cos((y + cell.row) / 2) * 2]);
    }
  }
  return values;
}

function addAxes(
  xAxis3D: Component[],
  yAxis3D: Component[],
  zAxis3D: Component[],
  cell: CellDefinition,
  index: number,
  context: TwoDimensionalBuildContext
): void {
  const range = context.snapshot.interactive.axisRanges[cell.id];
  const applyZoom = (domain: [number, number], dimension: 'x' | 'y'): [number, number] => {
    if (context.example.id !== 'G07') return domain;
    const zoom = context.snapshot.interactive.dataZoom[`${cell.id}/${dimension}`];
    if (!zoom) return domain;
    const span = domain[1] - domain[0];
    return [domain[0] + span * zoom.start / 100, domain[0] + span * zoom.end / 100];
  };
  const xRange = applyZoom(range?.x ?? [-6, 6], 'x');
  const yRange = applyZoom(range?.y ?? [-6, 6], 'y');
  xAxis3D.push({
    id: componentId('xAxis3D', cell),
    type: 'value',
    min: xRange[0],
    max: xRange[1],
    grid3DIndex: index,
    name: 'X'
  });
  yAxis3D.push({
    id: componentId('yAxis3D', cell),
    type: 'value',
    min: yRange[0],
    max: yRange[1],
    grid3DIndex: index,
    name: 'Y'
  });
  zAxis3D.push({
    id: componentId('zAxis3D', cell),
    type: 'value',
    min: range?.z?.[0] ?? -4,
    max: range?.z?.[1] ?? 6,
    grid3DIndex: index,
    name: 'Z'
  });
}

function addSeries(
  series: Component[],
  cell: CellDefinition,
  index: number,
  includeProfileSeries: boolean,
  context: TwoDimensionalBuildContext
): void {
  const legendScope = context.example.sharing.some((capability) => capability.element === 'legendSelection')
    ? context.snapshot.sharing.legendSelection
    : context.example.sharing.some((capability) => capability.element === 'seriesVisibility')
      ? context.snapshot.sharing.seriesVisibility
      : 'individual';
  const groupKey = scopeKey(cell, legendScope);
  const axisIndexes = {
    grid3DIndex: index,
    xAxis3DIndex: index,
    yAxis3DIndex: index,
    zAxis3DIndex: index
  };
  series.push({
    id: componentId('series', cell, 'scatter3D'),
    name: `Scatter 3D/${groupKey}`,
    type: 'scatter3D',
    coordinateSystem: 'cartesian3D',
    ...axisIndexes,
    symbolSize: context.snapshot.interactive.symbolVisibility[cell.id] === false ? 0 : 7,
    data: [[-4, -3, 1], [-1, 2, 3], [2, -1, 4], [4, 3, 2]]
  });
  if (!includeProfileSeries) return;
  series.push(
    {
      id: componentId('series', cell, 'line3D'),
      name: `Line 3D/${groupKey}`,
      type: 'line3D',
      coordinateSystem: 'cartesian3D',
      ...axisIndexes,
      lineStyle: { width: 3 },
      data: (() => {
        const scale = context.snapshot.interactive.vectorScale[cell.id] ?? 1;
        return [[-5, -5, 0], [-2, -1, 2 * scale], [1, 2, 4 * scale], [5, 5, scale]];
      })()
    },
    {
      id: componentId('series', cell, 'surface'),
      name: `Surface/${groupKey}`,
      type: 'surface',
      coordinateSystem: 'cartesian3D',
      ...axisIndexes,
      wireframe: { show: false },
      shading: 'lambert',
      data: surfaceData(cell)
    }
  );
}

function list(value: unknown): Component[] {
  if (!value) return [];
  return Array.isArray(value) ? value as Component[] : [value as Component];
}

export function buildThreeDimensionalOption(
  context: TwoDimensionalBuildContext
): EChartsOption {
  const { example, cells, snapshot } = context;
  const enlargedCellId = snapshot.interactive.enlargedCellId;
  const renderCells = enlargedCellId
    ? cells.filter((cell) => cell.id === enlargedCellId)
    : cells;
  const useNativeMatrixAttempt = example.id === 'G01';
  const includeProfileSeries = example.id === 'G06' || example.id === 'G07';
  const grid3D = renderCells.map((cell) => {
    if (useNativeMatrixAttempt) return nativeMatrixGrid(cell);
    const grid = absoluteGrid(
      cell,
      snapshot.rows,
      snapshot.columns,
      snapshot.interactive.camera[cell.id]
    );
    const viewport = enlargedCellId
      ? { ...grid, left: '4.00%', top: '5.00%', width: '92.00%', height: '90.00%' }
      : grid;
    const box = threeDimensionalCellBox(context, cell);
    if (example.id === 'G07') Object.assign(viewport, {
      left: percent(box.left), top: percent(box.top + box.height * .4),
      width: percent(box.width * .67), height: percent(box.height * .58)
    });
    else if (example.sharing.some(capability => capability.element === 'visualMap')) Object.assign(viewport, {
      top: percent(box.top + box.height * .12), width: percent(box.width * .88), height: percent(box.height * .86)
    });
    return viewport;
  });
  const titles = renderCells.map(cell => {
    const box = threeDimensionalCellBox(context, cell);
    return { id: componentId('title', cell), text: cell.title, left: percent(box.left), top: percent(box.top - 3), textStyle: { fontSize: 11, color: '#64748b' } };
  });
  const legendPosition = (cell: CellDefinition) => {
    const box = threeDimensionalCellBox(context, cell);
    return { left: percent(box.left), top: percent(box.top), width: percent(box.width - 1), type: 'scroll', formatter: (name: string) => name.split('/')[0], textStyle: { fontSize: 9 }, itemWidth: 12, itemHeight: 9 };
  };
  const xAxis3D: Component[] = [];
  const yAxis3D: Component[] = [];
  const zAxis3D: Component[] = [];
  const series: Component[] = [];

  renderCells.forEach((cell, index) => {
    addAxes(xAxis3D, yAxis3D, zAxis3D, cell, index, context);
    addSeries(series, cell, index, includeProfileSeries, context);
  });

  const sharingElements = new Set(example.sharing.map((capability) => capability.element));
  const legend: Component[] = [];
  if (sharingElements.has('legendSelection') || sharingElements.has('seriesVisibility')) {
    const scope = sharingElements.has('legendSelection')
      ? snapshot.sharing.legendSelection
      : snapshot.sharing.seriesVisibility;
    groupCells(renderCells, scope).forEach((group, index) => {
      const names = [...new Set(group.flatMap((cell) => series
        .filter((entry) => String(entry.id).includes(cell.id))
        .map((entry) => String(entry.name))))];
      const selected = snapshot.interactive.legendSelections[group[0].id] ?? {};
      legend.push({
        id: `legend3D/group-${index}/${scopeKey(group[0], scope)}`,
        data: names,
        selected: Object.fromEntries(names.map((name) => [
          name,
          selected[name.split('/')[0]] !== false &&
          snapshot.interactive.seriesVisibility[group[0].id] !== false
        ])),
        ...legendPosition(group[0])
      });
    });
  }

  const visualMap: Component[] = [];
  if (sharingElements.has('visualMap')) {
    const scope = snapshot.sharing.visualMap;
    groupCells(renderCells, scope).forEach((group, index) => {
      const range = snapshot.interactive.colorScaleRange[group[0].id] ?? [-4, 6];
      const box = threeDimensionalCellBox(context, group[0]);
      visualMap.push({
        id: `visualMap3D/group-${index}/${scopeKey(group[0], scope)}`,
        type: 'continuous',
        min: range[0],
        max: range[1],
        dimension: 2,
        left: percent(box.left + box.width * .94), top: percent(box.top + box.height * .35),
        itemWidth: 9, itemHeight: 65, textStyle: { fontSize: 9 },
        seriesId: group.flatMap((cell) => series
          .filter((entry) => String(entry.id).includes(cell.id))
          .map((entry) => entry.id))
      });
    });
  }

  if (example.id === 'G07') {
    const base = buildTwoDimensionalOption(context) as EChartsOption & Record<string, unknown>;
    const auxiliaryGrids = list(base.grid).filter((grid) =>
      String(grid.id).endsWith('/top') || String(grid.id).endsWith('/right')
    );
    for (const grid of auxiliaryGrids) {
      const cell = renderCells.find(cell => String(grid.id).includes(cell.id))!;
      const box = threeDimensionalCellBox(context, cell);
      const top = String(grid.id).endsWith('/top');
      for (const key of ['coordinateSystem', 'matrixId', 'coord', 'right', 'bottom']) delete grid[key];
      Object.assign(grid, {
        left: percent(box.left + box.width * (top ? .08 : .76)),
        top: percent(box.top + box.height * (top ? .18 : .46)),
        width: percent(box.width * (top ? .55 : .14)),
        height: percent(box.height * (top ? .13 : .44)), outerBoundsMode: 'none'
      });
    }
    const auxiliaryXAxes = list(base.xAxis).filter((axis) =>
      String(axis.id).endsWith('/top') || String(axis.id).endsWith('/right')
    );
    const auxiliaryYAxes = list(base.yAxis).filter((axis) =>
      String(axis.id).endsWith('/top') || String(axis.id).endsWith('/right')
    );
    for (const axis of auxiliaryXAxes.filter(axis => String(axis.id).endsWith('/right'))) {
      const cell = renderCells.find(cell => String(axis.id).includes(cell.id))!;
      const range = snapshot.interactive.axisRanges[cell.id]?.rightX ?? [0, 40];
      axis.min = range[0]; axis.max = range[1];
    }
    const auxiliarySeries = list(base.series).filter((entry) =>
      String(entry.id).endsWith('/top') || String(entry.id).endsWith('/right')
    );
    // Marginal coordinates must use the same physical X/Y domain as the 3D data.
    for (const entry of auxiliarySeries) {
      const top = String(entry.id).endsWith('/top');
      entry.data = [[-5, 12], [-2, 26], [0, 18], [3, 34], [5, 20]].map(([position, value]) => top ? [position, value] : [value, position]);
    }
    const combinedSeries = [...auxiliarySeries, ...series];
    const fixedZoom = list(base.dataZoom)
      .filter((zoom) => String(zoom.id).includes('/fixed-'))
      .map((zoom) => {
        const adjusted = { ...zoom };
        if (Array.isArray(adjusted.xAxisId)) {
          adjusted.xAxisId = adjusted.xAxisId.filter((id) => String(id).endsWith('/top'));
        }
        if (Array.isArray(adjusted.yAxisId)) {
          adjusted.yAxisId = adjusted.yAxisId.filter((id) => String(id).endsWith('/right'));
        }
        return adjusted;
      });

    const legendScope = snapshot.sharing.legendSelection;
    const combinedLegend = groupCells(renderCells, legendScope).map((group, index) => {
      const targetIds = new Set(group.map((cell) => cell.id));
      const names = [...new Set(combinedSeries
        .filter((entry) => [...targetIds].some((id) => String(entry.id).includes(id)))
        .map((entry) => String(entry.name)))];
      const selected = snapshot.interactive.legendSelections[group[0].id] ?? {};
      return {
        id: `legend3D/group-${index}/${scopeKey(group[0], legendScope)}`,
        data: names,
        selected: Object.fromEntries(names.map((name) => [
          name,
          selected[name.split('/')[0]] !== false &&
          snapshot.interactive.seriesVisibility[group[0].id] !== false
        ])),
        ...legendPosition(group[0])
      };
    });

    return {
      ...base,
      matrix: undefined,
      title: titles,
      toolbox: [],
      grid: auxiliaryGrids,
      xAxis: auxiliaryXAxes,
      yAxis: auxiliaryYAxes,
      dataZoom: fixedZoom,
      legend: combinedLegend,
      visualMap,
      grid3D,
      xAxis3D,
      yAxis3D,
      zAxis3D,
      series: combinedSeries
    } as EChartsOption;
  }

  return {
    animation: false,
    title: useNativeMatrixAttempt ? [{ text: 'G01: native matrix placement is unsupported', subtext: 'The four 3D views overlap. Open G02 for working panel placement.', left: 16, top: 8, textStyle: { fontSize: 14 }, subtextStyle: { fontSize: 11 } }] : titles,
    matrix: useNativeMatrixAttempt
      ? {
          id: 'matrix/main',
          left: 40,
          top: 70,
          right: 40,
          bottom: 40,
          x: { data: Array.from({ length: snapshot.columns }, (_, index) => `Column ${index + 1}`) },
          y: { data: Array.from({ length: snapshot.rows }, (_, index) => `Row ${index + 1}`) }
        }
      : undefined,
    tooltip: { trigger: 'item' },
    grid3D,
    xAxis3D,
    yAxis3D,
    zAxis3D,
    legend,
    visualMap,
    series
  } as EChartsOption;
}
