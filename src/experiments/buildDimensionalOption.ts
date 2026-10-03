import type { EChartsOption } from 'echarts';

import type { ExampleDefinition } from '../core/types';
import { buildThreeDimensionalOption } from './buildThreeDimensionalOption';
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

