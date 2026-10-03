import type {
  AppStateSnapshot,
  CellDefinition,
  InteractiveState,
  SharingElement,
  SharingState
} from '../core/types';
import { resolveTargetCellIds } from './targetResolver';

export type ConflictPolicy = 'first-cell' | 'configured' | 'derived';

const SHARING_ELEMENTS: readonly SharingElement[] = [
  'xRange',
  'yRange',
  'zRange',
  'dataZoomX',
  'dataZoomY',
  'legendSelection',
  'visualMap',
  'seriesVisibility',
  'symbolVisibility',
  'vectorScale',
  'referenceVectorValue',
  'topYRange',
  'rightXRange',
  'viewMode',
  'camera'
];

export function createDefaultSharingState(): SharingState {
  return Object.fromEntries(
    SHARING_ELEMENTS.map((element) => [element, 'individual'])
  ) as SharingState;
}

export function createDefaultInteractiveState(): InteractiveState {
  return {
    axisRanges: {},
    dataZoom: {},
    legendSelections: {},
    seriesVisibility: {},
    symbolVisibility: {},
    colorScaleRange: {},
    vectorScale: {},
    referenceVectorValue: {},
    viewMode: {},
    selectedDataItems: {},
    camera: {},
    enlargedCellId: null
  };
}

export function createDefaultSnapshot(exampleId: string, seed: number): AppStateSnapshot {
  return {
    version: 1,
    exampleId,
    seed,
    renderer: 'canvas',
    rows: 2,
    columns: 2,
    sharing: createDefaultSharingState(),
    interactive: createDefaultInteractiveState()
  };
}

export function serializeSnapshot(snapshot: AppStateSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function parseSnapshot(serialized: string): AppStateSnapshot {
  const candidate: unknown = JSON.parse(serialized);
  if (!isRecord(candidate) || candidate.version !== 1) {
    throw new Error('Unsupported state snapshot version');
  }

  const validScopes = new Set(['individual', 'all', 'row', 'column']);
  const validDimensions = (value: unknown): value is number =>
    Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 5;
  const sharing = candidate.sharing;
  const interactive = candidate.interactive;
  const validInteractiveKeys = [
    'axisRanges', 'dataZoom', 'legendSelections', 'seriesVisibility',
    'symbolVisibility', 'colorScaleRange', 'vectorScale',
    'referenceVectorValue', 'viewMode', 'selectedDataItems', 'camera'
  ];
  if (
    typeof candidate.exampleId !== 'string' || candidate.exampleId.length === 0 ||
    typeof candidate.seed !== 'number' || !Number.isFinite(candidate.seed) ||
    (candidate.renderer !== 'canvas' && candidate.renderer !== 'svg') ||
    !validDimensions(candidate.rows) || !validDimensions(candidate.columns) ||
    !isRecord(sharing) ||
    !SHARING_ELEMENTS.every((element) => validScopes.has(String(sharing[element]))) ||
    !isRecord(interactive) ||
    !validInteractiveKeys.every((key) => isRecord(interactive[key])) ||
    !(interactive.enlargedCellId === null ||
      (typeof interactive.enlargedCellId === 'string' && /^row-\d+:column-\d+$/.test(interactive.enlargedCellId)))
  ) {
    throw new Error('Invalid state snapshot');
  }

  return candidate as unknown as AppStateSnapshot;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneValue<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

export function reconcileSharingState(
  snapshot: AppStateSnapshot,
  cells: readonly CellDefinition[],
  activeCellId: string,
  element: SharingElement,
  newScope: SharingState[SharingElement],
  policy: ConflictPolicy
): void {
  const targets = resolveTargetCellIds(cells, activeCellId, newScope);
  const source = policy === 'first-cell' ? targets[0] : undefined;
  const dimension = element === 'xRange' ? 'x'
    : element === 'yRange' ? 'y'
      : element === 'zRange' ? 'z'
        : element === 'topYRange' ? 'topY'
          : element === 'rightXRange' ? 'rightX'
            : undefined;

  for (const target of targets) {
    if (dimension) {
      const configuredRange: Partial<Record<typeof dimension, [number, number]>> = {
        x: [0, 24], y: [0, 50], z: [-4, 6], topY: [0, 50], rightX: [0, 24]
      };
      const value = source
        ? snapshot.interactive.axisRanges[source]?.[dimension]
        : policy === 'configured' ? configuredRange[dimension] : undefined;
      const next = { ...snapshot.interactive.axisRanges[target] };
      if (value) next[dimension] = cloneValue(value);
      else delete next[dimension];
      snapshot.interactive.axisRanges[target] = next;
      continue;
    }
    if (element === 'dataZoomX' || element === 'dataZoomY') {
      const suffix = element === 'dataZoomX' ? 'x' : 'y';
      const value = source
        ? snapshot.interactive.dataZoom[`${source}/${suffix}`]
        : policy === 'configured' ? { start: 0, end: 100 } : undefined;
      if (value) snapshot.interactive.dataZoom[`${target}/${suffix}`] = cloneValue(value);
      else delete snapshot.interactive.dataZoom[`${target}/${suffix}`];
      continue;
    }
    const bucket = element === 'legendSelection' ? snapshot.interactive.legendSelections
      : element === 'seriesVisibility' ? snapshot.interactive.seriesVisibility
        : element === 'symbolVisibility' ? snapshot.interactive.symbolVisibility
          : element === 'visualMap' ? snapshot.interactive.colorScaleRange
            : element === 'vectorScale' ? snapshot.interactive.vectorScale
              : element === 'referenceVectorValue' ? snapshot.interactive.referenceVectorValue
                : element === 'viewMode' ? snapshot.interactive.viewMode
                  : element === 'camera' ? snapshot.interactive.camera
                    : undefined;
    if (!bucket) continue;
    const configuredValues: Partial<Record<SharingElement, unknown>> = {
      legendSelection: {},
      seriesVisibility: true,
      symbolVisibility: true,
      visualMap: snapshot.exampleId.startsWith('G') ? [-4, 6] : [0, 100],
      vectorScale: 1,
      referenceVectorValue: 2,
      viewMode: snapshot.exampleId.startsWith('G') ? '3d' : '2d',
      camera: { alpha: 25, beta: 35, distance: 150, center: [0, 0, 0] }
    };
    const value = source ? bucket[source] : policy === 'configured' ? configuredValues[element] : undefined;
    if (value !== undefined) bucket[target] = cloneValue(value) as never;
    else delete bucket[target];
  }
}
