export type SharingScope = 'individual' | 'all' | 'row' | 'column';

export type CellId = `row-${number}:column-${number}`;

export interface CellDefinition {
  id: CellId;
  row: number;
  column: number;
  title: string;
  empty?: boolean;
}

export type SharingElement =
  | 'xRange'
  | 'yRange'
  | 'zRange'
  | 'dataZoomX'
  | 'dataZoomY'
  | 'legendSelection'
  | 'visualMap'
  | 'seriesVisibility'
  | 'symbolVisibility'
  | 'vectorScale'
  | 'referenceVectorValue'
  | 'topYRange'
  | 'rightXRange'
  | 'viewMode'
  | 'camera';

export type ExampleFamily =
  | 'foundation'
  | 'cartesian'
  | 'bounded-spatial'
  | 'compound-spatial'
  | 'three-dimensional'
  | 'lifecycle';

export type ExampleGroup =
  | 'Matrix Foundation'
  | 'Multi-panel Cartesian'
  | 'Bounded Spatial Overlay'
  | 'Compound Spatial with Marginal Plots'
  | 'ECharts-GL 3D'
  | 'Export and State'
  | 'Baseline'
  | 'Lifecycle';

export interface SharingCapability {
  element: SharingElement;
  supportedScopes: SharingScope[];
  defaultScope: SharingScope;
  fixed?: boolean;
  reason?: string;
}

export interface FixedCoupling {
  label: string;
  reason: string;
}

export interface ExampleDefinition {
  id: string;
  title: string;
  family: ExampleFamily;
  group: ExampleGroup;
  question: string;
  sharing: SharingCapability[];
  fixedCouplings?: FixedCoupling[];
  profile: 'matrix' | 'cartesian' | 'bounded' | 'compound' | 'three-dimensional' | 'utility';
}

export type SharingState = Record<SharingElement, SharingScope>;

export interface AxisRangeState {
  x?: [number, number];
  y?: [number, number];
  z?: [number, number];
  topY?: [number, number];
  rightX?: [number, number];
}

export interface CameraState {
  alpha: number;
  beta: number;
  distance: number;
  center: [number, number, number];
}

export interface InteractiveState {
  axisRanges: Record<string, AxisRangeState>;
  dataZoom: Record<string, { start: number; end: number }>;
  legendSelections: Record<string, Record<string, boolean>>;
  seriesVisibility: Record<string, boolean>;
  symbolVisibility: Record<string, boolean>;
  colorScaleRange: Record<string, [number, number]>;
  vectorScale: Record<string, number>;
  referenceVectorValue: Record<string, number>;
  viewMode: Record<string, '2d' | '3d'>;
  selectedDataItems: Record<string, string[]>;
  camera: Record<string, CameraState>;
  enlargedCellId: CellId | null;
}

export interface AppStateSnapshot {
  version: 1;
  exampleId: string;
  seed: number;
  renderer: 'canvas' | 'svg';
  rows: number;
  columns: number;
  sharing: SharingState;
  interactive: InteractiveState;
}
