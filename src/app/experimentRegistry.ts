import type {
  ExampleDefinition,
  ExampleFamily,
  ExampleGroup,
  SharingCapability,
  SharingElement,
  FixedCoupling
} from '../core/types';

const ALL_SCOPES = ['individual', 'all', 'row', 'column'] as const;

function share(...elements: SharingElement[]): SharingCapability[] {
  return elements.map((element) => ({
    element,
    supportedScopes: [...ALL_SCOPES],
    defaultScope: 'individual'
  }));
}

function fixed(...elements: SharingElement[]): SharingCapability[] {
  return elements.map((element) => ({
    element,
    supportedScopes: ['all'],
    defaultScope: 'all',
    fixed: true,
    reason: 'Fixed: shared within each logical cell'
  }));
}

interface CatalogRow {
  id: string;
  title: string;
  sharing?: SharingCapability[];
  profile?: ExampleDefinition['profile'];
  fixedCouplings?: FixedCoupling[];
}

function defineGroup(
  family: ExampleFamily,
  group: ExampleGroup,
  profile: ExampleDefinition['profile'],
  rows: CatalogRow[]
): ExampleDefinition[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    family,
    group,
    profile: row.profile ?? profile,
    question: row.title.endsWith('?') ? row.title : `${row.title}?`,
    sharing: row.sharing ?? [],
    fixedCouplings: row.fixedCouplings
  }));
}

const matrixExamples = defineGroup('foundation', 'Matrix Foundation', 'matrix', [
  { id: 'M01', title: 'Direct matrix-coordinate scatter series' },
  { id: 'M02', title: 'Nested Cartesian grids in matrix cells' },
  { id: 'M03', title: 'Mixed axis types and multiple axes' },
  { id: 'M04', title: 'Fixed and automatic matrix sizing' },
  { id: 'M05', title: 'Headers, merged cells, labels, and empty cells' },
  { id: 'M06', title: 'Matrix placement for visual components' },
  { id: 'M07', title: 'Matrix event routing' },
  { id: 'M08', title: 'Dynamic row and column insertion and removal' },
  { id: 'M09', title: 'Responsive matrix resize' },
  { id: 'M10', title: 'Native matrix image export' }
]);

const cartesianExamples = defineGroup('cartesian', 'Multi-panel Cartesian', 'cartesian', [
  { id: 'C01', title: 'Independent line and scatter panels' },
  { id: 'C02', title: 'X range sharing scopes', sharing: share('xRange') },
  { id: 'C03', title: 'Y range sharing scopes', sharing: share('yRange') },
  { id: 'C04', title: 'Mixed X and Y range scopes', sharing: share('xRange', 'yRange') },
  { id: 'C05', title: 'Shared visible axes versus synchronized ranges', sharing: share('xRange', 'yRange') },
  { id: 'C06', title: 'X dataZoom sharing scopes', sharing: share('dataZoomX') },
  { id: 'C07', title: 'Y dataZoom sharing scopes', sharing: share('dataZoomY') },
  { id: 'C08', title: 'Selected-area zoom and reset', sharing: share('dataZoomX', 'dataZoomY') },
  { id: 'C09', title: 'Legend selection sharing scopes', sharing: share('legendSelection') },
  { id: 'C10', title: 'Series visibility sharing scopes', sharing: share('seriesVisibility') },
  { id: 'C11', title: 'Symbol visibility while preserving lines', sharing: share('symbolVisibility') },
  {
    id: 'C12',
    title: 'Compatible and incompatible multiple Y axes',
    sharing: share('yRange').map((capability) => ({
      ...capability,
      reason: 'Scopes apply to primary value axes; alternating log secondary axes are intentionally incompatible.'
    }))
  },
  { id: 'C13', title: 'Tooltip and pointer-event routing' },
  { id: 'C14', title: 'Cell enlargement with state preservation' },
  { id: 'C15', title: 'Dynamic cells with unaffected state preservation' },
  { id: 'C16', title: 'Long labels, sparse cells, and narrow viewports' },
  { id: 'C17', title: 'Detached shared axes with comparison grid', sharing: share('xRange', 'yRange') }
]);

const boundedExamples = defineGroup('bounded-spatial', 'Geometry and Color Controls', 'bounded', [
  { id: 'S02', title: 'Pixel symbols versus domain-sized shapes' },
  { id: 'S03', title: 'Vector scale and reference-vector sharing', sharing: share('vectorScale', 'referenceVectorValue') },
  { id: 'S04', title: 'Continuous visualMap sharing scopes', sharing: share('visualMap') },
  { id: 'S05', title: 'Piecewise visualMap sharing scopes', sharing: share('visualMap') },
  { id: 'S09', title: 'Equal-scale geometry during resize and enlargement' },
]);

const compoundFixed = fixed('xRange', 'yRange', 'dataZoomX', 'dataZoomY');
const compoundCouplings: FixedCoupling[] = [
  { label: 'Main ↔ top X range and zoom', reason: 'Fixed: shared within each logical cell' },
  { label: 'Main ↔ right Y range and zoom', reason: 'Fixed: shared within each logical cell' }
];
const compoundExamples = defineGroup('compound-spatial', 'Compound Spatial with Marginal Plots', 'compound', [
  { id: 'P01', title: 'Main spatial plot only' },
  { id: 'P02', title: 'Top marginal plot with fixed X coupling', sharing: fixed('xRange', 'dataZoomX') },
  { id: 'P03', title: 'Right marginal plot with fixed Y coupling', sharing: fixed('yRange', 'dataZoomY') },
  { id: 'P04', title: 'Top and right marginal plots with fixed coupling', sharing: compoundFixed },
  { id: 'P05', title: 'Alternating sparse marginal plots', sharing: compoundFixed },
  { id: 'P06', title: 'Matrix subregions for compound cells', sharing: compoundFixed },
  { id: 'P07', title: 'Multiple nested grids in one matrix cell', sharing: compoundFixed },
  { id: 'P08', title: 'Calculated pixel-box fallback stability', sharing: compoundFixed },
  { id: 'P09', title: 'Cross-cell main range sharing', sharing: share('xRange', 'yRange'), fixedCouplings: compoundCouplings },
  { id: 'P10', title: 'Independent marginal value-axis sharing', sharing: share('topYRange', 'rightXRange'), fixedCouplings: compoundCouplings },
  { id: 'P11', title: 'Compound legend, visualMap, series, and symbols', sharing: [...compoundFixed, ...share('legendSelection', 'visualMap', 'seriesVisibility', 'symbolVisibility')] },
  { id: 'P12', title: 'Wide and constrained 2 by 3 composition', sharing: compoundFixed }
]);

const threeDimensionalExamples = defineGroup('three-dimensional', 'ECharts-GL 3D', 'three-dimensional', [
  { id: 'G01', title: 'Unsupported native matrix placement (diagnostic)' },
  { id: 'G02', title: 'Absolute multi-grid3D one-instance layout' },
  { id: 'G03', title: 'Independent 3D camera interaction and targeting' },
  { id: 'G04', title: 'Camera sharing scopes', sharing: share('camera') },
  { id: 'G05', title: '3D ranges, legend, and visualMap sharing', sharing: share('xRange', 'yRange', 'zRange', 'legendSelection', 'visualMap') },
  { id: 'G06', title: 'Bounded spatial 3D profile', sharing: share('xRange', 'yRange', 'zRange', 'camera', 'legendSelection', 'visualMap', 'seriesVisibility', 'symbolVisibility', 'vectorScale') },
  { id: 'G07', title: 'Compound 3D main plot with 2D marginals', profile: 'compound', sharing: [...fixed('xRange', 'yRange', 'dataZoomX', 'dataZoomY'), ...share('zRange', 'camera', 'legendSelection', 'visualMap', 'seriesVisibility', 'symbolVisibility', 'vectorScale')] },
  { id: 'G08', title: 'Scoped 2D and 3D view-mode switching', sharing: share('viewMode') },
  { id: 'G09', title: '3D cell enlargement with camera preservation' },
  { id: 'G10', title: 'One-instance and per-cell WebGL resources' }
]);

const utilityRows: CatalogRow[] = [
  { id: 'R01', title: 'Export and import sharing and interactive state', sharing: share('xRange', 'yRange', 'legendSelection', 'visualMap', 'seriesVisibility', 'symbolVisibility', 'viewMode', 'camera') },
  { id: 'R02', title: 'Canvas, SVG, and ECharts-GL image export' },
  { id: 'R03', title: 'CSV and JSON data-model export' },
  { id: 'R04', title: 'Equivalent per-cell instance baseline' },
  { id: 'R05', title: 'Repeated initialization, disposal, and switching' },
  { id: 'R06', title: 'Rapid sharing changes without event loops', sharing: share('xRange', 'yRange', 'legendSelection', 'visualMap') },
  { id: 'R07', title: 'Grid-size resource and timing comparison' },
  { id: 'R08', title: 'Renderer and dimensional-mode cleanup', sharing: share('viewMode') }
];

const utilityExamples = utilityRows.map((row) => {
  const group: ExampleGroup = row.id === 'R04'
    ? 'Baseline'
    : row.id === 'R01' || row.id === 'R02' || row.id === 'R03'
      ? 'Export and State'
      : 'Lifecycle';

  return defineGroup('lifecycle', group, 'utility', [row])[0];
});

export const EXAMPLES: readonly ExampleDefinition[] = [
  ...matrixExamples,
  ...cartesianExamples,
  ...boundedExamples,
  ...compoundExamples,
  ...threeDimensionalExamples,
  ...utilityExamples
];

export function getExample(id: string): ExampleDefinition {
  const example = EXAMPLES.find((candidate) => candidate.id === id);
  if (!example) {
    throw new Error(`Unknown example: ${id}`);
  }
  return example;
}
