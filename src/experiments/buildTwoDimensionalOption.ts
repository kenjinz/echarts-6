import type { EChartsOption } from 'echarts';

import type {
  AppStateSnapshot,
  CellDefinition,
  ExampleDefinition,
  SharingScope
} from '../core/types';
import { createSeededRandom } from '../data/random';

type Component = Record<string, unknown>;

export interface TwoDimensionalBuildContext {
  example: ExampleDefinition;
  cells: readonly CellDefinition[];
  snapshot: AppStateSnapshot;
}

interface OptionParts {
  grid: Component[];
  xAxis: Component[];
  yAxis: Component[];
  series: Component[];
  legend: Component[];
  dataZoom: Component[];
  visualMap: Component[];
  title: Component[];
  toolbox: Component[];
}

function componentId(kind: string, cell: CellDefinition, plot = 'main'): string {
  return `${kind}/${cell.id}/${plot}`;
}

function groupCells(cells: readonly CellDefinition[], scope: SharingScope): CellDefinition[][] {
  const groups = new Map<string, CellDefinition[]>();
  for (const cell of cells) {
    const key = scope === 'all'
      ? 'all'
      : scope === 'row'
        ? `row-${cell.row}`
        : scope === 'column'
          ? `column-${cell.column}`
          : cell.id;
    const group = groups.get(key) ?? [];
    group.push(cell);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function scopeKey(cell: CellDefinition, scope: SharingScope): string {
  if (scope === 'all') return 'all';
  if (scope === 'row') return `row-${cell.row}`;
  if (scope === 'column') return `column-${cell.column}`;
  return cell.id;
}

export function makeCartesianData(seed: number, cell: CellDefinition): [number, number][] {
  const random = createSeededRandom(seed + cell.row * 101 + cell.column * 17);
  return Array.from({ length: 25 }, (_, index) => [
    index,
    Math.round((cell.row + 1) * 8 + cell.column * 5 + Math.sin(index / 3) * 12 + random() * 7)
  ]);
}

export function buildPerCellCartesianOption(
  cell: CellDefinition,
  snapshot: AppStateSnapshot
): EChartsOption {
  const data = makeCartesianData(snapshot.seed, cell);
  const range = snapshot.interactive.axisRanges[cell.id];
  return {
    animation: false,
    title: { text: cell.title, left: 'center', textStyle: { fontSize: 11 } },
    tooltip: { trigger: 'axis' },
    legend: {
      data: [`Observed/${cell.id}`, `Forecast/${cell.id}`],
      selected: {
        [`Observed/${cell.id}`]: snapshot.interactive.legendSelections[cell.id]?.Observed !== false,
        [`Forecast/${cell.id}`]: snapshot.interactive.legendSelections[cell.id]?.Forecast !== false
      }
    },
    grid: { left: 42, right: 18, top: 44, bottom: 34 },
    xAxis: { id: componentId('xAxis', cell), type: 'value', min: range?.x?.[0] ?? 0, max: range?.x?.[1] ?? 24 },
    yAxis: { id: componentId('yAxis', cell), type: 'value', min: range?.y?.[0] ?? 0, max: range?.y?.[1] ?? 50 },
    series: [
      {
        id: componentId('series', cell, 'observed'),
        name: `Observed/${cell.id}`,
        type: 'line',
        showSymbol: snapshot.interactive.symbolVisibility[cell.id] !== false,
        data
      },
      {
        id: componentId('series', cell, 'forecast'),
        name: `Forecast/${cell.id}`,
        type: 'scatter',
        symbol: cell.column % 2 === 0 ? 'rect' : 'diamond',
        symbolSize: 8,
        data: data.map(([x, y]) => [x, y + 5])
      }
    ]
  };
}

function makeMatrix(context: TwoDimensionalBuildContext): Component {
  const { example, snapshot } = context;
  const columnCount = example.id === 'P06' ? snapshot.columns * 2 : snapshot.columns;
  const rowCount = example.id === 'P06' ? snapshot.rows * 2 : snapshot.rows;
  const columnData = Array.from({ length: columnCount }, (_, index) => {
    if (example.id === 'P06') return index % 2 === 0 ? `Main ${Math.floor(index / 2) + 1}` : 'Right';
    if (example.id === 'M04' && index === 0) return { value: `Column ${index + 1}`, size: 180 };
    return example.id === 'C16'
      ? `Column ${index + 1} with an intentionally long label`
      : `Column ${index + 1}`;
  });
  const rowData = Array.from({ length: rowCount }, (_, index) =>
    example.id === 'P06'
      ? index % 2 === 0 ? 'Top' : `Main row ${Math.floor(index / 2) + 1}`
      : example.id === 'C16'
      ? `Row ${index + 1} with a long descriptive label`
      : `Row ${index + 1}`
  );

  return {
    id: 'matrix/main',
    left: 72,
    top: 62,
    right: 52,
    bottom: 58,
    x: { data: columnData, levelSize: example.id === 'C16' ? 58 : 34 },
    y: { data: rowData, levelSize: example.id === 'C16' ? 116 : 72 },
    body: {
      data: example.id === 'M05'
        ? [{ coord: [0, 0], value: 'Body label' }, { coord: [[0, 1], [1, 1]], value: 'Merged body' }]
        : [],
      itemStyle: { borderColor: '#d7dde5', borderWidth: 1 }
    },
    triggerEvent: true
  };
}

function makeGrid(cell: CellDefinition, plot = 'main', subregions = false): Component {
  const subregionCoord = plot === 'top'
    ? [cell.column * 2, cell.row * 2]
    : plot === 'right'
      ? [cell.column * 2 + 1, cell.row * 2 + 1]
      : [cell.column * 2, cell.row * 2 + 1];
  const base: Component = {
    id: componentId('grid', cell, plot),
    coordinateSystem: 'matrix',
    matrixId: 'matrix/main',
    coord: subregions ? subregionCoord : [cell.column, cell.row],
    containLabel: false
  };

  if (subregions) return { ...base, left: 8, right: 8, top: 8, bottom: 8 };

  if (plot === 'top') {
    return { ...base, left: '12%', right: '24%', top: '5%', height: '18%' };
  }
  if (plot === 'right') {
    return { ...base, left: '78%', width: '18%', top: '28%', bottom: '12%' };
  }
  return { ...base, left: '12%', right: '24%', top: '28%', bottom: '12%' };
}

function pushAxes(
  parts: OptionParts,
  context: TwoDimensionalBuildContext,
  cell: CellDefinition,
  plot: string,
  domain: 'cartesian' | 'spatial' = 'cartesian'
): void {
  const spatial = domain === 'spatial';
  const range = context.snapshot.interactive.axisRanges[cell.id];
  const compound = context.example.profile === 'compound';
  const spatialDomain: [number, number] = context.example.id === 'G07' ? [-6, 6] : [-10, 10];
  const defaultX: [number, number] = spatial || (compound && plot !== 'right') ? spatialDomain : [0, 24];
  const defaultY: [number, number] = spatial || (compound && plot !== 'top') ? spatialDomain : [0, 50];
  const xRange = (plot === 'right' ? range?.rightX : range?.x) ?? defaultX;
  const yRange = (plot === 'top' ? range?.topY : range?.y) ?? defaultY;
  parts.xAxis.push({
    id: componentId('xAxis', cell, plot),
    gridId: componentId('grid', cell, plot),
    type: 'value',
    min: xRange[0],
    max: xRange[1],
    axisLabel: { fontSize: 9 },
    splitLine: { show: spatial }
  });
  parts.yAxis.push({
    id: componentId('yAxis', cell, plot),
    gridId: componentId('grid', cell, plot),
    type: 'value',
    min: yRange[0],
    max: yRange[1],
    axisLabel: { fontSize: 9 },
    splitLine: { show: spatial }
  });
  if (context.example.id === 'C05') {
    const xAxis = parts.xAxis[parts.xAxis.length - 1];
    const yAxis = parts.yAxis[parts.yAxis.length - 1];
    const showX = cell.row === context.snapshot.rows - 1;
    const showY = cell.column === 0;
    xAxis.axisLabel = { fontSize: 9, show: showX };
    xAxis.axisLine = { show: showX };
    xAxis.name = showX ? 'Synchronized X' : '';
    yAxis.axisLabel = { fontSize: 9, show: showY };
    yAxis.axisLine = { show: showY };
    yAxis.name = showY ? 'Synchronized Y' : '';
  }
}

function pushMainCartesian(
  parts: OptionParts,
  context: TwoDimensionalBuildContext,
  cell: CellDefinition
): void {
  const { example, snapshot } = context;
  parts.grid.push(makeGrid(cell));
  pushAxes(parts, context, cell, 'main');
  const data = makeCartesianData(snapshot.seed, cell);
  const legendScope = example.sharing.some((capability) => capability.element === 'legendSelection')
    ? snapshot.sharing.legendSelection
    : example.sharing.some((capability) => capability.element === 'seriesVisibility')
      ? snapshot.sharing.seriesVisibility
      : 'individual';
  const groupKey = scopeKey(cell, legendScope);
  const names = [`Observed/${groupKey}`, `Forecast/${groupKey}`];
  const seriesStart = parts.series.length;
  parts.series.push(
    {
      id: componentId('series', cell, 'observed'),
      name: names[0],
      type: 'line',
      xAxisId: componentId('xAxis', cell),
      yAxisId: componentId('yAxis', cell),
      showSymbol: snapshot.interactive.symbolVisibility[cell.id] !== false,
      data
    },
    {
      id: componentId('series', cell, 'forecast'),
      name: names[1],
      type: 'scatter',
      xAxisId: componentId('xAxis', cell),
      yAxisId: componentId('yAxis', cell),
      symbol: cell.column % 2 === 0 ? 'rect' : 'diamond',
      symbolSize: 8,
      data: data.map(([x, y]) => [x, y + 5])
    }
  );
  parts.title.push({
    id: componentId('title', cell),
    coordinateSystem: 'matrix',
    matrixId: 'matrix/main',
    coord: [cell.column, cell.row],
    text: cell.title,
    left: 'center',
    top: 5,
    textStyle: { fontSize: 11 }
  });

  const cellOrdinal = cell.row * snapshot.columns + cell.column;
  if (example.id === 'M03') {
    const xAxis = parts.xAxis[parts.xAxis.length - 1];
    if (cellOrdinal % 4 === 1) {
      xAxis.type = 'time';
      delete xAxis.min;
      delete xAxis.max;
      const start = Date.UTC(2026, 0, 1);
      for (const entry of parts.series.slice(seriesStart)) {
        entry.data = data.map(([x, y]) => [start + x * 3_600_000, y]);
      }
    }
    else if (cellOrdinal % 4 === 2) {
      const categories = data.map((_entry, index) => `Category ${index + 1}`);
      xAxis.type = 'category';
      xAxis.data = categories;
      delete xAxis.min;
      delete xAxis.max;
      for (const entry of parts.series.slice(seriesStart)) {
        entry.data = data.map(([_x, y], index) => [categories[index], y]);
      }
    }
  }

  if (example.id === 'C12' || (example.id === 'M03' && cellOrdinal % 4 === 3)) {
    const secondaryAxisId = componentId('yAxis', cell, 'secondary');
    parts.yAxis.push({
      id: secondaryAxisId,
      gridId: componentId('grid', cell),
      type: example.id === 'C12' && cellOrdinal % 2 === 1 ? 'log' : 'value',
      position: 'right',
      min: example.id === 'C12' && cellOrdinal % 2 === 1 ? 1 : -20,
      max: 120,
      axisLabel: { fontSize: 9 }
    });
    parts.series.push({
      id: componentId('series', cell, 'secondary'),
      name: `Secondary/${groupKey}`,
      type: 'line',
      xAxisId: componentId('xAxis', cell),
      yAxisId: secondaryAxisId,
      showSymbol: false,
      data: data.map(([x, y]) => [x, y * 1.8 - 15])
    });
  }

}

function boundaryRenderItem(_params: unknown, api: {
  coord(value: number[]): number[];
  size(value: number[]): number[];
}): Component {
  const center = api.coord([0, 0]);
  const radius = Math.abs(api.size([18, 0])[0]) / 2;
  return {
    type: 'group',
    children: [
      { type: 'circle', shape: { cx: center[0], cy: center[1], r: radius }, style: { fill: 'none', stroke: '#64748b', lineWidth: 2 } },
      { type: 'line', shape: { x1: center[0], y1: center[1] - radius, x2: center[0] + 7, y2: center[1] - radius + 9 }, style: { stroke: '#f97316', lineWidth: 3 } }
    ]
  };
}

function regionRenderItem(params: { dataIndex: number }, api: {
  value(dimension: number): number;
  coord(value: number[]): number[];
  size(value: number[]): number[];
}): Component {
  const x = api.value(0);
  const y = api.value(1);
  const width = api.value(2);
  const height = api.value(3);
  const center = api.coord([x, y]);
  const size = api.size([width, height]);
  return {
    type: 'rect',
    name: `region-${params.dataIndex}`,
    shape: {
      x: center[0] - Math.abs(size[0]) / 2,
      y: center[1] - Math.abs(size[1]) / 2,
      width: Math.abs(size[0]),
      height: Math.abs(size[1])
    },
    style: { fill: '#38bdf8', stroke: '#0f172a', lineWidth: 1 }
  };
}

function vectorRenderItem(_params: unknown, api: {
  value(dimension: number): number;
  coord(value: number[]): number[];
}): Component {
  const start = api.coord([api.value(0), api.value(1)]);
  const end = api.coord([api.value(2), api.value(3)]);
  return {
    type: 'line',
    shape: { x1: start[0], y1: start[1], x2: end[0], y2: end[1] },
    style: { stroke: '#7c3aed', lineWidth: 2 }
  };
}

function pushBoundedSpatial(
  parts: OptionParts,
  context: TwoDimensionalBuildContext,
  cell: CellDefinition
): void {
  parts.grid.push(makeGrid(cell));
  if (context.example.id === 'S09') {
    const grid = parts.grid[parts.grid.length - 1];
    const size = Math.max(90, Math.min(180, 360 / Math.max(context.snapshot.rows, context.snapshot.columns)));
    grid.width = size;
    grid.height = size;
    grid.left = 'center';
    grid.top = 'middle';
  }
  pushAxes(parts, context, cell, 'main', 'spatial');
  const scale = context.snapshot.interactive.vectorScale[cell.id] ?? 1;
  const referenceValue = context.snapshot.interactive.referenceVectorValue[cell.id] ?? 2;
  const legendScope = context.example.sharing.some((capability) => capability.element === 'legendSelection')
    ? context.snapshot.sharing.legendSelection
    : context.example.sharing.some((capability) => capability.element === 'seriesVisibility')
      ? context.snapshot.sharing.seriesVisibility
      : 'individual';
  const groupKey = scopeKey(cell, legendScope);
  const selectedRegions = new Set(context.snapshot.interactive.selectedDataItems[cell.id] ?? []);
  const axisIds = {
    xAxisId: componentId('xAxis', cell),
    yAxisId: componentId('yAxis', cell)
  };
  parts.series.push(
    {
      id: componentId('series', cell, 'boundary'),
      name: `Boundary/${groupKey}`,
      type: 'custom',
      ...axisIds,
      silent: true,
      clip: true,
      data: [[0, 0, 18]],
      renderItem: boundaryRenderItem
    },
    {
      id: componentId('series', cell, 'regions'),
      name: `Regions/${groupKey}`,
      type: 'custom',
      ...axisIds,
      clip: true,
      selectedMode: 'multiple',
      encode: { x: [0, 2], y: [1, 3], tooltip: [0, 1, 4] },
      data: [
        { id: 'region-0', value: [-4, -2, 3, 4, 24], selected: selectedRegions.has('region-0') },
        { id: 'region-1', value: [1, 2, 4, 3, 67], selected: selectedRegions.has('region-1') },
        { id: 'region-2', value: [4, -4, 2.5, 2.5, 88], selected: selectedRegions.has('region-2') }
      ],
      renderItem: regionRenderItem
    },
    {
      id: componentId('series', cell, 'symbols'),
      name: `Symbols/${groupKey}`,
      type: 'scatter',
      ...axisIds,
      symbolSize: context.snapshot.interactive.symbolVisibility[cell.id] === false ? 0 : 11,
      data: [[-6, 4, 35], [0, -5, 60], [6, 3, 82]]
    },
    {
      id: componentId('series', cell, 'vectors'),
      name: `Vectors/${groupKey}`,
      type: 'custom',
      ...axisIds,
      clip: true,
      data: [
        [-5, -5, -5 + 3 * scale, -5 + 2 * scale],
        [1, 1, 1 + 4 * scale, 1 - 3 * scale],
        [-8, 7, -8 + referenceValue, 7]
      ],
      renderItem: vectorRenderItem
    }
  );
}

function compoundAuxiliaries(exampleId: string, cell: CellDefinition): { top: boolean; right: boolean } {
  if (exampleId === 'P01') return { top: false, right: false };
  if (exampleId === 'P02') return { top: true, right: false };
  if (exampleId === 'P03') return { top: false, right: true };
  if (exampleId === 'P05') {
    return (cell.row + cell.column) % 2 === 0
      ? { top: true, right: false }
      : { top: false, right: true };
  }
  return { top: true, right: true };
}

function pushCompound(
  parts: OptionParts,
  context: TwoDimensionalBuildContext,
  cell: CellDefinition
): void {
  const subregions = context.example.id === 'P06';
  const legendScope = context.example.sharing.some((capability) => capability.element === 'legendSelection')
    ? context.snapshot.sharing.legendSelection
    : context.example.sharing.some((capability) => capability.element === 'seriesVisibility')
      ? context.snapshot.sharing.seriesVisibility
      : 'individual';
  const groupKey = scopeKey(cell, legendScope);
  parts.grid.push(makeGrid(cell, 'main', subregions));
  pushAxes(parts, context, cell, 'main', 'spatial');
  parts.series.push({
    id: componentId('series', cell, 'main'),
    name: `Main/${groupKey}`,
    type: 'scatter',
    xAxisId: componentId('xAxis', cell),
    yAxisId: componentId('yAxis', cell),
    symbolSize: context.snapshot.interactive.symbolVisibility[cell.id] === false ? 0 : 9,
    data: [[-7, -3, 20], [-2, 4, 55], [4, -1, 82]]
  });

  const auxiliary = compoundAuxiliaries(context.example.id, cell);
  if (auxiliary.top) {
    parts.grid.push(makeGrid(cell, 'top', subregions));
    pushAxes(parts, context, cell, 'top');
    parts.series.push({
      id: componentId('series', cell, 'top'),
      name: `Top marginal/${groupKey}`,
      type: 'line',
      xAxisId: componentId('xAxis', cell, 'top'),
      yAxisId: componentId('yAxis', cell, 'top'),
      showSymbol: false,
      data: [[0, 12], [6, 26], [12, 18], [18, 34], [24, 20]]
    });
    parts.dataZoom.push({
      id: componentId('dataZoom', cell, 'fixed-x'),
      type: 'inside',
      xAxisId: [componentId('xAxis', cell), componentId('xAxis', cell, 'top')],
      start: context.snapshot.interactive.dataZoom[`${cell.id}/x`]?.start ?? 0,
      end: context.snapshot.interactive.dataZoom[`${cell.id}/x`]?.end ?? 100
    });
  }
  if (auxiliary.right) {
    parts.grid.push(makeGrid(cell, 'right', subregions));
    pushAxes(parts, context, cell, 'right');
    parts.series.push({
      id: componentId('series', cell, 'right'),
      name: `Right marginal/${groupKey}`,
      type: 'line',
      xAxisId: componentId('xAxis', cell, 'right'),
      yAxisId: componentId('yAxis', cell, 'right'),
      showSymbol: false,
      data: [[8, 0], [20, 12], [14, 24], [31, 36], [17, 48]]
    });
    parts.dataZoom.push({
      id: componentId('dataZoom', cell, 'fixed-y'),
      type: 'inside',
      yAxisId: [componentId('yAxis', cell), componentId('yAxis', cell, 'right')],
      start: context.snapshot.interactive.dataZoom[`${cell.id}/y`]?.start ?? 0,
      end: context.snapshot.interactive.dataZoom[`${cell.id}/y`]?.end ?? 100
    });
  }
}

function pushScopedZoom(
  parts: OptionParts,
  context: TwoDimensionalBuildContext,
  cells: readonly CellDefinition[],
  dimension: 'x' | 'y',
  scope: SharingScope
): void {
  groupCells(cells, scope).forEach((group, index) => {
    const target = group.map((cell) => componentId(`${dimension}Axis`, cell));
    const range = context.snapshot.interactive.dataZoom[`${group[0].id}/${dimension}`];
    parts.dataZoom.push({
      id: `dataZoom/group-${index}/${dimension}/native`,
      type: 'inside',
      [`${dimension}AxisId`]: target,
      start: range?.start ?? 0,
      end: range?.end ?? 100,
      filterMode: 'filter'
    });
  });
}

function makeDirectMatrixSeries(cells: readonly CellDefinition[], seed: number): Component[] {
  return cells.map((cell) => ({
    id: componentId('series', cell, 'direct-matrix'),
    name: cell.title,
    type: 'scatter',
    coordinateSystem: 'matrix',
    matrixId: 'matrix/main',
    coord: [cell.column, cell.row],
    symbolSize: 10,
    data: makeCartesianData(seed, cell).slice(0, 8)
  }));
}

export function buildTwoDimensionalOption(context: TwoDimensionalBuildContext): EChartsOption {
  const parts: OptionParts = {
    grid: [],
    xAxis: [],
    yAxis: [],
    series: [],
    legend: [],
    dataZoom: [],
    visualMap: [],
    title: [],
    toolbox: []
  };
  const enlargedCellId = context.snapshot.interactive.enlargedCellId;
  const renderCells = enlargedCellId
    ? context.cells.filter((cell) => cell.id === enlargedCellId)
    : context.cells;

  if (context.example.id === 'M01') {
    parts.series.push(...makeDirectMatrixSeries(renderCells, context.snapshot.seed));
  }
  else {
    for (const cell of renderCells) {
      if (context.example.id === 'M05' && cell === renderCells[renderCells.length - 1]) continue;
      if (context.example.profile === 'bounded') {
        pushBoundedSpatial(parts, context, cell);
      }
      else if (context.example.profile === 'compound') {
        pushCompound(parts, context, cell);
      }
      else {
        pushMainCartesian(parts, context, cell);
      }
    }
  }

  const sharingElements = new Set(context.example.sharing.map((capability) => capability.element));
  if (sharingElements.has('legendSelection') || sharingElements.has('seriesVisibility')) {
    const scope = sharingElements.has('legendSelection')
      ? context.snapshot.sharing.legendSelection
      : context.snapshot.sharing.seriesVisibility;
    groupCells(renderCells, scope).forEach((group, index) => {
      const key = scopeKey(group[0], scope);
      const selected = context.snapshot.interactive.legendSelections[group[0].id] ?? {};
      const targetIds = new Set(group.map((cell) => cell.id));
      const names = [...new Set(parts.series
        .filter((series) => {
          const id = String(series.id);
          return [...targetIds].some((cellId) => id.includes(cellId));
        })
        .map((series) => String(series.name))
        .filter(Boolean))];
      const selectedByName = Object.fromEntries(names.map((name) => {
        const semanticName = name.split('/')[0];
        return [name,
          selected[semanticName] !== false &&
          context.snapshot.interactive.seriesVisibility[group[0].id] !== false
        ];
      }));
      parts.legend.push({
        id: `legend/group-${index}/${key}`,
        data: names,
        selected: selectedByName,
        top: 8 + index * 22,
        right: 10,
        textStyle: { fontSize: 9 }
      });
    });
  }
  if (sharingElements.has('visualMap')) {
    const scope = context.snapshot.sharing.visualMap;
    groupCells(renderCells, scope).forEach((group, index) => {
      const range = context.snapshot.interactive.colorScaleRange[group[0].id] ?? [0, 100];
      const common = {
        id: `visualMap/group-${index}/${scopeKey(group[0], scope)}`,
        dimension: 2,
        seriesId: group.map((cell) => componentId(
          'series',
          cell,
          context.example.profile === 'compound' ? 'main' : 'symbols'
        )),
        min: range[0],
        max: range[1]
      };
      parts.visualMap.push(context.example.id === 'S05'
        ? {
            ...common,
            type: 'piecewise',
            pieces: [{ max: 33, label: 'Low' }, { min: 34, max: 66, label: 'Medium' }, { min: 67, label: 'High' }]
          }
        : { ...common, type: 'continuous', calculable: true, right: 5 + index * 18, top: 36 });
    });
  }
  if (sharingElements.has('dataZoomX') && context.example.profile !== 'compound') {
    pushScopedZoom(parts, context, renderCells, 'x', context.snapshot.sharing.dataZoomX);
  }
  if (sharingElements.has('dataZoomY') && context.example.profile !== 'compound') {
    pushScopedZoom(parts, context, renderCells, 'y', context.snapshot.sharing.dataZoomY);
  }

  if (enlargedCellId) {
    parts.grid = parts.grid.map((grid) => {
      const expanded = { ...grid };
      delete expanded.coordinateSystem;
      delete expanded.matrixId;
      delete expanded.coord;
      return { ...expanded, left: 70, right: 35, top: 55, bottom: 50 };
    });
  }

  if (
    context.example.id === 'P08' &&
    context.snapshot.rows > 0 &&
    context.snapshot.columns > 0
  ) {
    parts.grid = parts.grid.map((grid) => {
      const match = String(grid.id).match(/^grid\/(row-(\d+):column-(\d+))\/(main|top|right)$/);
      if (!match) return grid;
      const row = Number(match[2]);
      const column = Number(match[3]);
      const plot = match[4];
      const cellWidth = 94 / context.snapshot.columns;
      const cellHeight = 90 / context.snapshot.rows;
      const cellLeft = 4 + column * cellWidth;
      const cellTop = 6 + row * cellHeight;
      const boxes: Record<string, { left: number; top: number; width: number; height: number }> = {
        main: { left: cellLeft + cellWidth * 0.08, top: cellTop + cellHeight * 0.28, width: cellWidth * 0.66, height: cellHeight * 0.64 },
        top: { left: cellLeft + cellWidth * 0.08, top: cellTop + cellHeight * 0.04, width: cellWidth * 0.66, height: cellHeight * 0.18 },
        right: { left: cellLeft + cellWidth * 0.78, top: cellTop + cellHeight * 0.28, width: cellWidth * 0.18, height: cellHeight * 0.64 }
      };
      const box = boxes[plot];
      const absolute = { ...grid };
      delete absolute.coordinateSystem;
      delete absolute.matrixId;
      delete absolute.coord;
      return {
        ...absolute,
        left: `${box.left.toFixed(2)}%`,
        top: `${box.top.toFixed(2)}%`,
        width: `${box.width.toFixed(2)}%`,
        height: `${box.height.toFixed(2)}%`
      };
    });
  }

  if (context.example.id === 'C08') {
    parts.toolbox.push({ id: 'toolbox/selected-area-zoom', feature: { dataZoom: {}, restore: {} }, right: 18, top: 12 });
  }
  if (context.example.id === 'M06') {
    parts.toolbox.push({
      id: 'toolbox/row-0:column-0/main',
      coordinateSystem: 'matrix',
      matrixId: 'matrix/main',
      coord: [0, 0],
      feature: { dataZoom: {}, restore: {}, saveAsImage: {} }
    });
  }

  return {
    animation: false,
    matrix: makeMatrix(context),
    tooltip: { trigger: 'item', confine: true },
    title: parts.title,
    toolbox: parts.toolbox,
    grid: parts.grid,
    xAxis: parts.xAxis,
    yAxis: parts.yAxis,
    legend: parts.legend,
    dataZoom: parts.dataZoom,
    visualMap: parts.visualMap,
    series: parts.series
  } as EChartsOption;
}
