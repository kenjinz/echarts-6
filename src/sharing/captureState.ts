import type { AppStateSnapshot, CellId } from '../core/types';

type Component = Record<string, unknown>;

function asComponents(value: unknown): Component[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  return isRecord(value) ? [value] : [];
}

function isRecord(value: unknown): value is Component {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cellId(value: unknown): CellId | undefined {
  if (typeof value !== 'string') return undefined;
  return value.match(/row-\d+:column-\d+/)?.[0] as CellId | undefined;
}

function cellsForGroup(snapshot: AppStateSnapshot, group: string): CellId[] {
  const result: CellId[] = [];
  for (let row = 0; row < snapshot.rows; row += 1) {
    for (let column = 0; column < snapshot.columns; column += 1) {
      const id = `row-${row}:column-${column}` as CellId;
      if (
        group === 'all' || group === id ||
        group === `row-${row}` || group === `column-${column}`
      ) result.push(id);
    }
  }
  return result;
}

function axisIds(component: Component, dimension: 'x' | 'y'): unknown[] {
  const value = component[`${dimension}AxisId`];
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

export function captureOptionState(snapshot: AppStateSnapshot, option: unknown): void {
  if (!isRecord(option)) return;

  for (const zoom of asComponents(option.dataZoom)) {
    const start = Number(zoom.start);
    const end = Number(zoom.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    for (const dimension of ['x', 'y'] as const) {
      for (const axisId of axisIds(zoom, dimension)) {
        const id = cellId(axisId);
        if (id) snapshot.interactive.dataZoom[`${id}/${dimension}`] = { start, end };
      }
    }
  }

  for (const legend of asComponents(option.legend)) {
    if (!isRecord(legend.selected)) continue;
    for (const [name, enabled] of Object.entries(legend.selected)) {
      const separator = name.lastIndexOf('/');
      if (separator < 1 || typeof enabled !== 'boolean') continue;
      const semanticName = name.slice(0, separator);
      const group = name.slice(separator + 1);
      for (const id of cellsForGroup(snapshot, group)) {
        snapshot.interactive.legendSelections[id] = {
          ...snapshot.interactive.legendSelections[id],
          [semanticName]: enabled
        };
      }
    }
  }

  for (const grid of asComponents(option.grid3D)) {
    const id = cellId(grid.id);
    const view = grid.viewControl;
    if (!id || !isRecord(view)) continue;
    const center = view.center;
    if (!Array.isArray(center) || center.length !== 3) continue;
    const alpha = Number(view.alpha);
    const beta = Number(view.beta);
    const distance = Number(view.distance);
    const numericCenter = center.map(Number);
    if (![alpha, beta, distance, ...numericCenter].every(Number.isFinite)) continue;
    snapshot.interactive.camera[id] = {
      alpha,
      beta,
      distance,
      center: numericCenter as [number, number, number]
    };
  }
}
