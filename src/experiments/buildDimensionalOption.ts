import type { EChartsOption } from 'echarts';

import type { ExampleDefinition } from '../core/types';
import { buildThreeDimensionalOption, threeDimensionalCellBox } from './buildThreeDimensionalOption';
import {
  buildTwoDimensionalOption,
  type TwoDimensionalBuildContext
} from './buildTwoDimensionalOption';

type Component = Record<string, unknown>;
type InspectableOption = EChartsOption & Record<string, unknown>;

function components(value: unknown): Component[] {
  if (!value) return [];
  return Array.isArray(value) ? value as Component[] : [value as Component];
}

function asTwoDimensionalExample(example: ExampleDefinition): ExampleDefinition {
  if (example.id === 'G06') return { ...example, profile: 'bounded' };
  if (example.id === 'G07') return { ...example, profile: 'compound' };
  if (example.family === 'three-dimensional') return { ...example, profile: 'cartesian' };
  return example;
}

export function buildDimensionalOption(
  context: TwoDimensionalBuildContext
): EChartsOption {
  const threeDimensionalCells = context.cells.filter((cell) =>
    (context.snapshot.interactive.viewMode[cell.id] ?? '3d') === '3d'
  );
  const twoDimensionalCells = context.cells.filter((cell) =>
    (context.snapshot.interactive.viewMode[cell.id] ?? '3d') === '2d'
  );

  if (threeDimensionalCells.length === 0) {
    return buildTwoDimensionalOption({
      ...context,
      example: asTwoDimensionalExample(context.example)
    });
  }
  if (twoDimensionalCells.length === 0) {
    return buildThreeDimensionalOption(context);
  }

  const two = buildTwoDimensionalOption({
    ...context,
    example: asTwoDimensionalExample(context.example),
    cells: twoDimensionalCells
  }) as InspectableOption;
  const three = buildThreeDimensionalOption({
    ...context,
    cells: threeDimensionalCells
  }) as InspectableOption;

  // Mixed charts share the same cell slots; native matrix headers otherwise
  // shift only the 2D plots into neighboring 3D viewports.
  if (context.example.id === 'G08' || context.example.id === 'R08') {
    const place = (entry: Component, region: 'grid' | 'title' | 'legend' | 'toolbox') => {
      const cell = twoDimensionalCells.find(cell => String(entry.id).includes(cell.id));
      if (!cell) return entry;
      const box = threeDimensionalCellBox(context, cell);
      for (const key of ['coordinateSystem', 'matrixId', 'coord', 'right', 'bottom']) delete entry[key];
      const percent = (value: number) => `${value}%`;
      if (region === 'grid') Object.assign(entry, { left: percent(box.left + box.width * .12), top: percent(box.top + box.height * .15), width: percent(box.width * .8), height: percent(box.height * .7), outerBoundsMode: 'none' });
      else if (region === 'title') Object.assign(entry, { left: percent(box.left), top: percent(box.top - 3) });
      else if (region === 'legend') Object.assign(entry, { left: percent(box.left), top: percent(box.top + box.height * .94), width: percent(box.width) });
      else Object.assign(entry, { left: percent(box.left + box.width * .7), top: percent(box.top) });
      return entry;
    };
    two.matrix = undefined;
    for (const region of ['grid', 'title', 'legend', 'toolbox'] as const) two[region] = components(two[region]).map(entry => place(entry, region));
    two.title = [...components(two.title), ...components(three.title)];
  }

  return {
    ...two,
    grid3D: components(three.grid3D),
    xAxis3D: components(three.xAxis3D),
    yAxis3D: components(three.yAxis3D),
    zAxis3D: components(three.zAxis3D),
    visualMap: [...components(two.visualMap), ...components(three.visualMap)],
    series: [...components(two.series), ...components(three.series)]
  } as EChartsOption;
}

