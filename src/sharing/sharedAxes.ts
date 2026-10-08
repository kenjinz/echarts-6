import type { AppStateSnapshot, CellDefinition, ExampleDefinition, SharedAxisState, SharingElement, SharingScope } from '../core/types';
import { createCells } from '../data/cells';

export type AxisDimension = 'x' | 'y';

export function axisDimension(element: SharingElement): AxisDimension | undefined {
  return element === 'xRange' || element === 'dataZoomX' ? 'x'
    : element === 'yRange' || element === 'dataZoomY' ? 'y' : undefined;
}

export function supportsSharedAxis(example: ExampleDefinition, dimension: AxisDimension): boolean {
  return example.family !== 'three-dimensional' && example.id !== 'R08' &&
    example.sharing.some((capability) => !capability.fixed && axisDimension(capability.element) === dimension);
}

export function axisGroupKey(cell: CellDefinition, scope: SharingScope): string {
  return scope === 'all' ? 'all' : scope === 'row' ? `row-${cell.row}`
    : scope === 'column' ? `column-${cell.column}` : cell.id;
}

export function sharedAxisScope(snapshot: AppStateSnapshot, example: ExampleDefinition, dimension: AxisDimension): SharingScope {
  if (!supportsSharedAxis(example, dimension)) return 'individual';
  const group = snapshot.sharedAxes?.[dimension];
  if (group) return group.scope;
  // Older snapshots offered independent range/zoom switches. Either means a shared axis.
  const range = snapshot.sharing[dimension === 'x' ? 'xRange' : 'yRange'];
  return range !== 'individual' ? range : snapshot.sharing[dimension === 'x' ? 'dataZoomX' : 'dataZoomY'];
}

function localAxisState(snapshot: AppStateSnapshot, id: string, dimension: AxisDimension): SharedAxisState {
  return { range: snapshot.interactive.axisRanges[id]?.[dimension], zoom: snapshot.interactive.dataZoom[`${id}/${dimension}`] };
}

export function readAxisState(snapshot: AppStateSnapshot, example: ExampleDefinition, cell: CellDefinition, dimension: AxisDimension): SharedAxisState {
  const scope = sharedAxisScope(snapshot, example, dimension);
  if (scope === 'individual') return localAxisState(snapshot, cell.id, dimension);
  const key = axisGroupKey(cell, scope);
  const stored = snapshot.sharedAxes?.[dimension]?.groups[key];
  if (stored) return stored;
  const source = createCells(snapshot.rows, snapshot.columns).find((peer) => axisGroupKey(peer, scope) === key) ?? cell;
  return localAxisState(snapshot, source.id, dimension);
}

function projectAxisState(snapshot: AppStateSnapshot, cell: CellDefinition, dimension: AxisDimension, state: SharedAxisState): void {
  // Compatibility projection for existing exports; sharedAxes remains authoritative.
  const previousRange = snapshot.interactive.axisRanges[cell.id];
  const range = { ...previousRange };
  if (state.range) range[dimension] = [...state.range];
  else delete range[dimension];
  if (state.range || previousRange) snapshot.interactive.axisRanges[cell.id] = range;
  if (state.zoom) snapshot.interactive.dataZoom[`${cell.id}/${dimension}`] = { ...state.zoom };
  else delete snapshot.interactive.dataZoom[`${cell.id}/${dimension}`];
}

export function normalizeSharedAxes(snapshot: AppStateSnapshot, example: ExampleDefinition): void {
  const cells = createCells(snapshot.rows, snapshot.columns);
  for (const dimension of ['x', 'y'] as const) {
    if (!supportsSharedAxis(example, dimension)) continue;
    const scope = sharedAxisScope(snapshot, example, dimension);
    snapshot.sharing[dimension === 'x' ? 'xRange' : 'yRange'] = scope;
    snapshot.sharing[dimension === 'x' ? 'dataZoomX' : 'dataZoomY'] = scope;
    if (scope === 'individual' && !snapshot.sharedAxes?.[dimension]) continue;
    snapshot.sharedAxes ??= {};
    const axis = snapshot.sharedAxes[dimension] ??= { scope, groups: {} };
    if (scope === 'individual') continue;
    for (const cell of cells) {
      const key = axisGroupKey(cell, scope);
      axis.groups[key] ??= structuredClone(localAxisState(snapshot, cell.id, dimension));
      projectAxisState(snapshot, cell, dimension, axis.groups[key]);
    }
  }
}

export function changeAxisSharing(snapshot: AppStateSnapshot, example: ExampleDefinition, cells: readonly CellDefinition[], dimension: AxisDimension, scope: SharingScope, policy: 'first-cell' | 'configured' | 'derived'): void {
  // Materialize the previous shared view before splitting or regrouping it.
  const previous = cells.map((cell) => structuredClone(readAxisState(snapshot, example, cell, dimension)));
  cells.forEach((cell, index) => projectAxisState(snapshot, cell, dimension, previous[index]));
  const groups: Record<string, SharedAxisState> = {};
  if (scope !== 'individual') {
    for (const cell of cells) {
      const key = axisGroupKey(cell, scope);
      if (groups[key]) continue;
      const spatial = example.profile === 'bounded' || example.profile === 'compound';
      groups[key] = policy === 'first-cell' ? structuredClone(localAxisState(snapshot, cell.id, dimension))
        : policy === 'configured' ? { range: spatial ? [-10, 10] : dimension === 'x' ? [0, 24] : [0, 50], zoom: { start: 0, end: 100 } } : {};
    }
  }
  snapshot.sharedAxes ??= {};
  snapshot.sharedAxes[dimension] = { scope, groups };
  normalizeSharedAxes(snapshot, example);
}

export function writeAxisState(snapshot: AppStateSnapshot, example: ExampleDefinition, cell: CellDefinition, dimension: AxisDimension, patch: SharedAxisState): void {
  normalizeSharedAxes(snapshot, example);
  const scope = sharedAxisScope(snapshot, example, dimension);
  if (scope === 'individual') {
    projectAxisState(snapshot, cell, dimension, { ...localAxisState(snapshot, cell.id, dimension), ...patch });
    return;
  }
  Object.assign(snapshot.sharedAxes![dimension]!.groups[axisGroupKey(cell, scope)], patch);
  normalizeSharedAxes(snapshot, example);
}
