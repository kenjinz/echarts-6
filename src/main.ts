import { createPresentationView } from './presentation/view';
import { resolveLocation, selectionSearch, switchMode, selectionForImport } from './presentation/navigation';
import type { Selection, Resolution, PresentationMode } from './presentation/types';
import { LatestRequest } from './core/latestRequest';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';

import { EXAMPLES, getExample } from './app/experimentRegistry';
import { rowsToCsv, rowsToJson, type ExportRow } from './core/dataExport';
import {
  installWebGLInstrumentation,
  type CanvasPrototypeLike
} from './core/instrumentation';
import { summarizeMeasurements } from './core/measurement';
import type {
  AppStateSnapshot,
  CellDefinition,
  ExampleDefinition,
  SharingElement,
  SharingScope
} from './core/types';
import { createCells } from './data/cells';
import { createSeededRandom } from './data/random';
import { buildDimensionalOption } from './experiments/buildDimensionalOption';
import {
  buildPerCellCartesianOption,
  buildTwoDimensionalOption
} from './experiments/buildTwoDimensionalOption';
import { createInitialScorecard, ResultStore } from './results/resultStore';
import {
  prepareSnapshot,
  parseSnapshot,
  reconcileSharingState,
  serializeSnapshot
} from './sharing/optionState';
import { resolveTargetCellIds } from './sharing/targetResolver';
import { captureOptionState } from './sharing/captureState';
import './style.css';

const webglInstrumentation = installWebGLInstrumentation(
  HTMLCanvasElement.prototype as unknown as CanvasPrototypeLike
);
const resultStore = new ResultStore(createInitialScorecard(EXAMPLES));

const SCOPE_LABELS: Record<SharingScope, string> = {
  individual: 'Individual',
  all: 'All cells',
  row: 'Per row',
  column: 'Per column'
};

const ENGINEERING_ELEMENT_LABELS: Record<SharingElement, string> = {
  xRange: 'X range',
  yRange: 'Y range',
  zRange: 'Z range',
  dataZoomX: 'X dataZoom',
  dataZoomY: 'Y dataZoom',
  legendSelection: 'Legend selection',
  visualMap: 'visualMap',
  seriesVisibility: 'Series visibility',
  symbolVisibility: 'Symbol visibility',
  vectorScale: 'Vector scale',
  referenceVectorValue: 'Reference vector value',
  topYRange: 'Top marginal Y range',
  rightXRange: 'Right marginal X range',
  viewMode: '2D/3D view mode',
  camera: 'Camera'
};

const GUIDED_ELEMENT_LABELS: Record<SharingElement, string> = {
  ...ENGINEERING_ELEMENT_LABELS,
  dataZoomX: 'X linked zoom', dataZoomY: 'Y linked zoom', visualMap: 'Color scale',
  symbolVisibility: 'Point-symbol visibility', topYRange: 'Top profile value range',
  rightXRange: 'Side profile value range'
};
let selection: Selection = resolveLocation(location.search).selection;
let navigationNotice: string | undefined;
const searchByMode: Record<PresentationMode, string> = { guided: '', engineering: '' };
function elementLabels(): Record<SharingElement, string> {
  return selection.mode === 'guided' ? GUIDED_ELEMENT_LABELS : ENGINEERING_ELEMENT_LABELS;
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element: #${id}`);
  return element as T;
}

const elements = {
  list: requireElement<HTMLElement>('example-list'),
  search: requireElement<HTMLInputElement>('example-search'),
  visibleCount: requireElement<HTMLElement>('visible-example-count'),
  exampleId: document.querySelector<HTMLElement>('[data-testid=example-id]')!,
  family: requireElement<HTMLElement>('family-label'),
  title: requireElement<HTMLElement>('example-title'),
  question: requireElement<HTMLElement>('example-question'),
  commonControls: requireElement<HTMLElement>('common-controls'),
  sharingControls: requireElement<HTMLElement>('sharing-controls'),
  actionControls: requireElement<HTMLElement>('action-controls'),
  sharingSummary: requireElement<HTMLElement>('sharing-summary'),
  chartHost: requireElement<HTMLDivElement>('experiment-chart'),
  chartStatus: requireElement<HTMLElement>('chart-status'),
  selectedCell: requireElement<HTMLElement>('selected-cell'),
  stateJson: requireElement<HTMLTextAreaElement>('state-json'),
  initCount: requireElement<HTMLElement>('init-count'),
  liveInstances: requireElement<HTMLElement>('live-instances'),
  canvasCount: requireElement<HTMLElement>('canvas-count'),
  svgCount: requireElement<HTMLElement>('svg-count'),
  webglCount: requireElement<HTMLElement>('webgl-count'),
  domCount: requireElement<HTMLElement>('dom-count'),
  setOptionDuration: requireElement<HTMLElement>('set-option-duration'),
  resizeDuration: requireElement<HTMLElement>('resize-duration'),
  enlargedCell: requireElement<HTMLElement>('enlarged-cell'),
  latestEvent: requireElement<HTMLElement>('latest-event'),
  latestTarget: requireElement<HTMLElement>('latest-target'),
  latestAction: requireElement<HTMLElement>('latest-action'),
  classification: requireElement<HTMLElement>('classification'),
  classificationNote: requireElement<HTMLElement>('classification-note'),
  measurementSummary: requireElement<HTMLElement>('measurement-summary')
};

let currentExample: ExampleDefinition;
let snapshot: AppStateSnapshot;
let cells: CellDefinition[] = [];
let charts: ECharts[] = [];
let initCalls = 0;
let selectedCellId = 'row-0:column-0';
let lastSetOptionDuration = 0;
let lastResizeDuration = 0;
let lastInitializationDuration = 0;
let glLoaded = false;
let resizeFrame = 0;
let conflictPolicy: 'first-cell' | 'configured' | 'derived' = 'first-cell';
let comparisonInstanceModel: 'one' | 'per-cell' = 'one';
let synchronizingHybridZoom = false;

function createButton(label: string, id?: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button small';
  button.textContent = label;
  if (id) button.id = id;
  return button;
}

function createField(labelText: string, control: HTMLElement, note?: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'field';
  const text = document.createElement('span');
  text.textContent = labelText;
  label.append(text, control);
  if (note) {
    const small = document.createElement('small');
    small.textContent = note;
    label.append(small);
  }
  return label;
}

function createSelect(
  options: readonly { value: string; label: string }[],
  value: string
): HTMLSelectElement {
  const select = document.createElement('select');
  for (const optionDefinition of options) {
    const option = document.createElement('option');
    option.value = optionDefinition.value;
    option.textContent = optionDefinition.label;
    select.append(option);
  }
  select.value = value;
  return select;
}

function renderEngineeringNavigation(query = ''): void {
  elements.list.replaceChildren();
  const normalized = query.trim().toLowerCase();
  const visible = EXAMPLES.filter((example) =>
    !normalized || `${example.id} ${example.title} ${example.group}`.toLowerCase().includes(normalized)
  );
  const groups = new Map<string, ExampleDefinition[]>();
  for (const example of visible) {
    const group = groups.get(example.group) ?? [];
    group.push(example);
    groups.set(example.group, group);
  }

  for (const [groupName, examples] of groups) {
    const heading = document.createElement('p');
    heading.className = 'example-group-title';
    heading.textContent = groupName;
    elements.list.append(heading);
    for (const example of examples) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `example-button${currentExample?.id === example.id ? ' is-active' : ''}`;
      button.dataset.exampleId = example.id;
      button.dataset.testid = 'example-button';
      const id = document.createElement('span');
      id.className = 'id';
      id.textContent = example.id;
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = example.title;
      button.append(id, label);
      elements.list.append(button);
    }
  }
  elements.visibleCount.textContent = String(visible.length);
}

function renderCommonControls(): void {
  elements.commonControls.replaceChildren();
  const countOptions = [0, 1, 2, 3, 5].map((value) => ({ value: String(value), label: String(value) }));
  const rows = createSelect(countOptions, String(snapshot.rows));
  rows.dataset.common = 'rows';
  const columns = createSelect(countOptions, String(snapshot.columns));
  columns.dataset.common = 'columns';
  const renderer = createSelect([
    { value: 'canvas', label: 'Canvas' },
    { value: 'svg', label: 'SVG' }
  ], snapshot.renderer);
  renderer.dataset.common = 'renderer';
  if (currentExample.family === 'three-dimensional') {
    renderer.value = 'canvas';
    renderer.disabled = true;
    snapshot.renderer = 'canvas';
  }
  const seed = document.createElement('input');
  seed.type = 'number';
  seed.value = String(snapshot.seed);
  seed.dataset.common = 'seed';
  const conflictPolicySelect = createSelect([
    { value: 'first-cell', label: 'Use first cell state' },
    { value: 'configured', label: 'Use configured initial state' },
    { value: 'derived', label: 'Reset to data-derived state' }
  ], conflictPolicy);
  conflictPolicySelect.dataset.common = 'conflictPolicy';

  elements.commonControls.append(
    createField('Rows', rows),
    createField('Columns', columns),
    createField('Renderer', renderer, renderer.disabled ? 'ECharts-GL uses Canvas/WebGL.' : undefined),
    createField('Deterministic seed', seed),
    createField('Conflict policy', conflictPolicySelect)
  );

  if (currentExample.family === 'three-dimensional' || currentExample.id === 'R08') {
    const mode = snapshot.interactive.viewMode[selectedCellId] ?? '3d';
    const viewMode = createSelect([
      { value: '3d', label: '3D main plot' },
      { value: '2d', label: '2D main plot' }
    ], mode);
    viewMode.dataset.common = 'viewMode';
    elements.commonControls.append(createField('Selected-cell view mode', viewMode));
  }
  if (currentExample.id === 'G10' || currentExample.id === 'R07') {
    const instanceModel = createSelect([
      { value: 'one', label: 'One matrix instance' },
      { value: 'per-cell', label: 'One instance per cell' }
    ], comparisonInstanceModel);
    instanceModel.dataset.common = 'instanceModel';
    elements.commonControls.append(createField('Instance model', instanceModel));
  }
}

function renderSharingControls(): void {
  elements.sharingControls.replaceChildren();
  currentExample.sharing.forEach((capability, index) => {
    const select = createSelect(
      capability.supportedScopes.map((scope) => ({ value: scope, label: SCOPE_LABELS[scope] })),
      snapshot.sharing[capability.element]
    );
    select.dataset.sharingElement = capability.element;
    select.dataset.capabilityIndex = String(index);
    if (capability.fixed) {
      select.disabled = true;
      select.value = 'all';
      if (selection.mode === 'guided') select.selectedOptions[0].textContent = 'Fixed within panel';
    }
    const field = createField(
      `${elementLabels()[capability.element]} scope`,
      select,
      selection.mode === 'guided' && capability.fixed ? 'Fixed: the main plot and matching profile stay linked.' : capability.reason
    );
    if (capability.fixed) field.classList.add('is-fixed');
    elements.sharingControls.append(field);
  });
  for (const coupling of currentExample.fixedCouplings ?? []) {
    const fixed = createSelect([{ value: 'all', label: 'Fixed: shared' }], 'all');
    fixed.disabled = true;
    const field = createField(coupling.label, fixed, coupling.reason);
    field.classList.add('is-fixed');
    elements.sharingControls.append(field);
  }
  updateSharingSummary();
}

function renderActionControls(): void {
  elements.actionControls.replaceChildren();
  const actions: [string, string][] = [
    ['Add row', 'add-row'],
    ['Remove row', 'remove-row'],
    ['Add column', 'add-column'],
    ['Remove column', 'remove-column'],
    ['Regenerate data', 'regenerate'],
    ['Enlarge selected cell', 'enlarge'],
    ['Restore all cells', 'restore'],
    ['Remove all cells', 'remove-all'],
    ['Restore default cells', 'restore-default']
  ];
  for (const [label, action] of actions) {
    const button = createButton(label);
    button.dataset.action = action;
    elements.actionControls.append(button);
  }
  const mutationElements = new Set<SharingElement>();
  for (const capability of currentExample.sharing) {
    if (capability.fixed || mutationElements.has(capability.element)) continue;
    mutationElements.add(capability.element);
    const button = createButton(`Change ${elementLabels()[capability.element]}`);
    button.dataset.mutateElement = capability.element;
    elements.actionControls.append(button);
  }
}

function updateSharingSummary(): void {
  const values = currentExample.sharing.map((capability) =>
    selection.mode === 'guided'
      ? `${elementLabels()[capability.element]}: ${capability.fixed ? 'fixed within panel' : SCOPE_LABELS[snapshot.sharing[capability.element]]}`
      : `${capability.element}: ${capability.fixed ? 'all' : snapshot.sharing[capability.element]}`
  );
  values.push(...(currentExample.fixedCouplings ?? []).map((coupling) => `${coupling.label}: fixed`));
  elements.sharingSummary.textContent = values.length > 0
    ? values.join(' · ')
    : 'No switchable sharing state in this example';
}

function disposeCharts(): void {
  elements.chartHost.querySelectorAll('canvas').forEach((canvas) => webglInstrumentation.release(canvas));
  for (const chart of charts) {
    if (!chart.isDisposed()) chart.dispose();
  }
  charts = [];
  elements.chartHost.replaceChildren();
  elements.chartHost.classList.remove('baseline-layout');
  elements.chartHost.style.removeProperty('--baseline-columns');
}

function captureChartState(chart: ECharts): void {
  if (!chart.isDisposed()) captureOptionState(snapshot, chart.getOption());
}

function captureAllChartState(): void {
  charts.forEach(captureChartState);
}

async function ensureGlLoaded(): Promise<void> {
  if (glLoaded) return;
  await import('echarts-gl');
  glLoaded = true;
}

function wantsThreeDimensions(): boolean {
  if (currentExample.family !== 'three-dimensional' && currentExample.id !== 'R08') return false;
  return createCells(snapshot.rows, snapshot.columns).some((cell) =>
    (snapshot.interactive.viewMode[cell.id] ?? '3d') === '3d'
  );
}

function buildOption(): EChartsOption {
  const context = { example: currentExample, cells, snapshot };
  return currentExample.family === 'three-dimensional' || currentExample.id === 'R08'
    ? buildDimensionalOption(context)
    : buildTwoDimensionalOption(context);
}

function bindChartEvents(chart: ECharts): void {
  const handleEvent = (eventName: string, params: unknown): void => {
    const detail = params as { seriesId?: string; componentId?: string; dataIndex?: number };
    const identity = detail.seriesId ?? detail.componentId ?? 'chart';
    const match = identity.match(/row-\d+:column-\d+/);
    if (match) selectedCellId = match[0];
    elements.selectedCell.textContent = selectedCellId;
    elements.latestEvent.textContent = eventName;
    elements.latestTarget.textContent = `${identity}${detail.dataIndex === undefined ? '' : ` / data ${detail.dataIndex}`}`;
  };
  chart.on('click', (params) => handleEvent('click', params));
  chart.on('dblclick', (params) => handleEvent('double-click', params));
  chart.on('mouseover', (params) => handleEvent('hover', params));
  chart.on('datazoom', (params) => handleEvent('dataZoom', params));
  chart.on('legendselectchanged', (params) => handleEvent('legend selection', params));
  chart.on('datazoom', () => queueMicrotask(() => {
    captureChartState(chart);
    if (currentExample.id === 'G07' && !synchronizingHybridZoom && chart === charts[0]) {
      synchronizingHybridZoom = true;
      applyOption();
      setTimeout(() => { synchronizingHybridZoom = false; }, 0);
    }
  }));
  chart.on('legendselectchanged', () => queueMicrotask(() => captureChartState(chart)));
  chart.on('selectchanged', (params) => {
    const detail = params as unknown as { selected?: { seriesId?: string; dataIndex?: number[] }[] };
    for (const selection of detail.selected ?? []) {
      const id = selection.seriesId?.match(/row-\d+:column-\d+/)?.[0];
      if (id) snapshot.interactive.selectedDataItems[id] = (selection.dataIndex ?? []).map((index) => `region-${index}`);
    }
    handleEvent('data selection', params);
  });
  (chart as unknown as { on(name: string, handler: (params: unknown) => void): void })
    .on('globalcamerachanged', (params) => {
      handleEvent('camera', params);
      queueMicrotask(() => captureChartState(chart));
    });
  chart.getZr().on('contextmenu', () => {
    elements.latestEvent.textContent = 'context-menu';
    elements.latestTarget.textContent = selectedCellId;
  });
}

const initializationRequests = new LatestRequest();
async function initializeCharts(): Promise<void> {
  const request = initializationRequests.begin();
  try {
    const initializationStarted = performance.now();
    disposeCharts();
    if (wantsThreeDimensions()) await ensureGlLoaded();
    if (!initializationRequests.isCurrent(request)) return;
    cells = createCells(snapshot.rows, snapshot.columns);
    if (!cells.some((cell) => cell.id === selectedCellId)) selectedCellId = cells[0]?.id ?? 'row-0:column-0';
    elements.selectedCell.textContent = selectedCellId;
  
    const usePerCell = currentExample.id === 'R04' ||
      ((currentExample.id === 'G10' || currentExample.id === 'R07') && comparisonInstanceModel === 'per-cell');
    if (usePerCell) {
      elements.chartHost.classList.add('baseline-layout');
      elements.chartHost.style.setProperty('--baseline-columns', String(snapshot.columns));
      for (const cell of cells) {
        const host = document.createElement('div');
        host.className = 'baseline-cell';
        host.dataset.cellId = cell.id;
        elements.chartHost.append(host);
        const chart = echarts.init(host, undefined, { renderer: snapshot.renderer });
        initCalls += 1;
        charts.push(chart);
        if (currentExample.id === 'G10') {
          const normalizedCell = { ...cell, row: 0, column: 0 };
          chart.setOption(buildDimensionalOption({
            example: currentExample,
            cells: [normalizedCell],
            snapshot: { ...snapshot, rows: 1, columns: 1 }
          }), { notMerge: true });
        }
        else {
          chart.setOption(buildPerCellCartesianOption(cell, snapshot), { notMerge: true });
        }
        bindChartEvents(chart);
      }
    }
    else {
      const chart = echarts.init(elements.chartHost, undefined, { renderer: snapshot.renderer });
      initCalls += 1;
      charts.push(chart);
      bindChartEvents(chart);
      applyOption();
    }
    elements.chartStatus.textContent = `${currentExample.id} running with ${charts.length} ECharts instance${charts.length === 1 ? '' : 's'}`;
    elements.chartStatus.classList.remove('is-error');
    updateClassification();
    lastInitializationDuration = performance.now() - initializationStarted;
    requestAnimationFrame(() => {
      if (initializationRequests.isCurrent(request)) updateMetrics();
    });
  } catch (error) {
    if (!initializationRequests.isCurrent(request)) return;
    disposeCharts();
    elements.chartStatus.textContent = error instanceof Error ? error.message : String(error);
    elements.chartStatus.classList.add('is-error');
  }
}

function applyOption(): void {
  if (charts.length !== 1 || currentExample.id === 'R04') return;
  const started = performance.now();
  charts[0].setOption(buildOption(), { notMerge: true, lazyUpdate: false });
  lastSetOptionDuration = performance.now() - started;
  elements.latestAction.textContent = 'setOption (full replacement)';
  updateMetrics();
}

function updateClassification(): void {
  const classification = 'Inconclusive' as const;
  const note = 'Implemented for evaluation; promote only after the example-specific acceptance checks and evidence review pass.';
  resultStore.update(`${currentExample.id}-PRIMARY`, {
    classification,
    confidence: 'Low',
    evidence: [],
    limitation: note
  });
  elements.classification.textContent = classification;
  elements.classificationNote.textContent = note;
}

function updateMetrics(): void {
  const webgl = webglInstrumentation.snapshot();
  elements.initCount.textContent = String(initCalls);
  elements.liveInstances.textContent = String(charts.filter((chart) => !chart.isDisposed()).length);
  elements.canvasCount.textContent = String(elements.chartHost.querySelectorAll('canvas').length);
  elements.svgCount.textContent = String(elements.chartHost.querySelectorAll('svg').length);
  elements.webglCount.textContent = String(webgl.uniqueContexts);
  elements.domCount.textContent = String(elements.chartHost.querySelectorAll('*').length);
  elements.setOptionDuration.textContent = lastSetOptionDuration > 0 ? `${lastSetOptionDuration.toFixed(2)} ms` : '—';
  elements.resizeDuration.textContent = lastResizeDuration > 0 ? `${lastResizeDuration.toFixed(2)} ms` : '—';
  elements.enlargedCell.textContent = snapshot.interactive.enlargedCellId ?? 'None';
}

function renderExampleMetadata(): void {
  elements.exampleId.textContent = currentExample.id;
  elements.family.textContent = currentExample.group;
  elements.title.textContent = currentExample.title;
  elements.question.textContent = currentExample.question;
  const version = document.querySelector<HTMLElement>('[data-testid=echarts-version]');
  if (version) version.textContent = echarts.version;
}

async function selectExample(id: string, imported?: AppStateSnapshot): Promise<void> {
  currentExample = getExample(id);
  snapshot = prepareSnapshot(id, imported);
  selectedCellId = 'row-0:column-0';
  initCalls = 0;
  lastSetOptionDuration = 0;
  lastResizeDuration = 0;
  lastInitializationDuration = 0;
  comparisonInstanceModel = 'one';
  renderExampleMetadata();
  renderCommonControls();
  renderSharingControls();
  renderActionControls();
  elements.latestEvent.textContent = 'None';
  elements.latestTarget.textContent = 'None';
  elements.latestAction.textContent = 'Initialize';
  elements.measurementSummary.textContent = 'Warm-up has not run.';
  view.render(selection, elements.search.value, navigationNotice);
  view.arrangeControls(selection);
  await initializeCharts();
}

function createExportRows(): ExportRow[] {
  return cells.flatMap((cell) => {
    const random = createSeededRandom(snapshot.seed + cell.row * 101 + cell.column * 17);
    return Array.from({ length: 8 }, (_, index) => ({
      rowLabel: `Row ${cell.row + 1}`,
      columnLabel: `Column ${cell.column + 1}`,
      cellTitle: cell.title,
      series: 'Observed',
      x: index,
      y: Math.round(random() * 20),
      value: Math.round(random() * 100)
    }));
  });
}

function download(href: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function downloadText(text: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  download(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function changeDimension(dimension: 'rows' | 'columns', amount: number): void {
  captureAllChartState();
  snapshot[dimension] = Math.max(1, Math.min(5, snapshot[dimension] + amount));
  cells = createCells(snapshot.rows, snapshot.columns);
  if (!cells.some((cell) => cell.id === selectedCellId)) selectedCellId = cells[0]?.id ?? 'row-0:column-0';
  renderCommonControls();
      view.arrangeControls(selection);
  if (comparisonInstanceModel === 'per-cell' && (currentExample.id === 'G10' || currentExample.id === 'R07')) {
    void initializeCharts();
  }
  else applyOption();
}

async function handleAction(action: string): Promise<void> {
  switch (action) {
    case 'add-row': changeDimension('rows', 1); break;
    case 'remove-row': changeDimension('rows', -1); break;
    case 'add-column': changeDimension('columns', 1); break;
    case 'remove-column': changeDimension('columns', -1); break;
    case 'regenerate':
      snapshot.seed += 1;
      renderCommonControls();
      view.arrangeControls(selection);
      applyOption();
      break;
    case 'enlarge':
      snapshot.interactive.enlargedCellId = selectedCellId as AppStateSnapshot['interactive']['enlargedCellId'];
      elements.latestAction.textContent = `Enlarge ${selectedCellId}`;
      applyOption();
      break;
    case 'restore':
      snapshot.interactive.enlargedCellId = null;
      elements.latestAction.textContent = 'Restore matrix';
      applyOption();
      break;
    case 'remove-all':
      snapshot.rows = 0;
      snapshot.columns = 0;
      cells = [];
      snapshot.interactive.enlargedCellId = null;
      renderCommonControls();
      view.arrangeControls(selection);
      applyOption();
      elements.chartStatus.textContent = `${currentExample.id} running · No logical cells`;
      break;
    case 'restore-default':
      snapshot.rows = 2;
      snapshot.columns = 2;
      cells = createCells(2, 2);
      selectedCellId = cells[0].id;
      renderCommonControls();
      view.arrangeControls(selection);
      applyOption();
      elements.chartStatus.textContent = `${currentExample.id} running with ${charts.length} ECharts instance${charts.length === 1 ? '' : 's'}`;
      break;
  }
  updateMetrics();
}

function mutateInteractiveState(element: SharingElement): void {
  if (cells.length === 0) return;
  const scope = snapshot.sharing[element];
  const targets = resolveTargetCellIds(cells, selectedCellId, scope);

  for (const cellId of targets) {
    switch (element) {
      case 'xRange':
        snapshot.interactive.axisRanges[cellId] = {
          ...snapshot.interactive.axisRanges[cellId],
          x: [4, 20]
        };
        break;
      case 'yRange':
        snapshot.interactive.axisRanges[cellId] = {
          ...snapshot.interactive.axisRanges[cellId],
          y: [-5, 35]
        };
        break;
      case 'zRange':
        snapshot.interactive.axisRanges[cellId] = {
          ...snapshot.interactive.axisRanges[cellId],
          z: [-2, 9]
        };
        break;
      case 'topYRange':
        snapshot.interactive.axisRanges[cellId] = {
          ...snapshot.interactive.axisRanges[cellId],
          topY: [0, 40]
        };
        break;
      case 'rightXRange':
        snapshot.interactive.axisRanges[cellId] = {
          ...snapshot.interactive.axisRanges[cellId],
          rightX: [0, 36]
        };
        break;
      case 'dataZoomX':
        snapshot.interactive.dataZoom[`${cellId}/x`] = { start: 20, end: 80 };
        break;
      case 'dataZoomY':
        snapshot.interactive.dataZoom[`${cellId}/y`] = { start: 15, end: 75 };
        break;
      case 'legendSelection':
      case 'seriesVisibility': {
        const current = snapshot.interactive.legendSelections[cellId]?.Observed !== false;
        snapshot.interactive.legendSelections[cellId] = {
          ...snapshot.interactive.legendSelections[cellId],
          Observed: !current
        };
        snapshot.interactive.seriesVisibility[cellId] = !current;
        break;
      }
      case 'visualMap':
        snapshot.interactive.colorScaleRange[cellId] = [15, 85];
        break;
      case 'symbolVisibility':
        snapshot.interactive.symbolVisibility[cellId] = snapshot.interactive.symbolVisibility[cellId] === false;
        break;
      case 'vectorScale':
        snapshot.interactive.vectorScale[cellId] = (snapshot.interactive.vectorScale[cellId] ?? 1) + 0.5;
        break;
      case 'referenceVectorValue':
        snapshot.interactive.referenceVectorValue[cellId] = (snapshot.interactive.referenceVectorValue[cellId] ?? 2) + 1;
        break;
      case 'viewMode':
        snapshot.interactive.viewMode[cellId] = snapshot.interactive.viewMode[cellId] === '2d' ? '3d' : '2d';
        break;
      case 'camera': {
        const current = snapshot.interactive.camera[cellId];
        snapshot.interactive.camera[cellId] = {
          alpha: current?.alpha ?? 40,
          beta: (current?.beta ?? 35) + 20,
          distance: current?.distance ?? 120,
          center: current?.center ?? [0, 0, 0]
        };
        break;
      }
    }
  }

  elements.latestAction.textContent = `${elementLabels()[element]} change · ${scope} · ${targets.length} cell${targets.length === 1 ? '' : 's'}`;
  if (element === 'viewMode') void initializeCharts();
  else applyOption();
}


type NavigateOptions = { history: 'push' | 'replace' | 'none'; preserve?: boolean; imported?: AppStateSnapshot };
async function navigate(resolution: Resolution, options: NavigateOptions): Promise<void> {
  getExample(resolution.selection.exampleId);
  const retain = options.preserve === true && currentExample?.id === resolution.selection.exampleId && !options.imported;
  selection = resolution.selection;
  navigationNotice = resolution.notice;
  const url = `${location.pathname}${selectionSearch(selection)}${location.hash}`;
  if (options.history === 'push') history.pushState(null, '', url);
  else if (options.history === 'replace') history.replaceState(null, '', url);
  elements.search.value = searchByMode[selection.mode];
  if (retain) {
    renderExampleMetadata(); renderCommonControls(); renderSharingControls(); renderActionControls();
    view.render(selection, elements.search.value, navigationNotice);
    view.arrangeControls(selection);
    return;
  }
  await selectExample(selection.exampleId, options.imported);
}
const view = createPresentationView({
  select: next => { void navigate({ selection: next }, { history: 'push' }); },
  mode: mode => {
    captureAllChartState();
    void navigate(switchMode(selection, mode), { history: 'push', preserve: true });
  },
  search: query => {
    searchByMode[selection.mode] = query;
    view.render(selection, query, navigationNotice);
  },
  renderEngineeringNavigation
});
elements.list.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-example-id]');
  if (button?.dataset.exampleId) void navigate({ selection: { mode: 'engineering', exampleId: button.dataset.exampleId } }, { history: 'push' });
});
elements.sharingControls.addEventListener('change', (event) => {
  const select = event.target as HTMLSelectElement;
  const element = select.dataset.sharingElement as SharingElement | undefined;
  if (!element) return;
  captureAllChartState();
  const nextScope = select.value as SharingScope;
  reconcileSharingState(snapshot, cells, selectedCellId, element, nextScope, conflictPolicy);
  snapshot.sharing[element] = nextScope;
  updateSharingSummary();
  applyOption();
});
elements.commonControls.addEventListener('change', (event) => {
  const control = event.target as HTMLInputElement | HTMLSelectElement;
  const key = control.dataset.common;
  if (key === 'rows' || key === 'columns') {
    captureAllChartState();
    snapshot[key] = Number(control.value);
    cells = createCells(snapshot.rows, snapshot.columns);
    if (!cells.some((cell) => cell.id === selectedCellId)) selectedCellId = cells[0]?.id ?? 'row-0:column-0';
    if (comparisonInstanceModel === 'per-cell' && (currentExample.id === 'G10' || currentExample.id === 'R07')) {
      void initializeCharts();
    }
    else applyOption();
  }
  else if (key === 'seed') {
    snapshot.seed = Number(control.value);
    applyOption();
  }
  else if (key === 'renderer') {
    snapshot.renderer = control.value as 'canvas' | 'svg';
    void initializeCharts();
  }
  else if (key === 'viewMode') {
    snapshot.interactive.viewMode[selectedCellId] = control.value as '2d' | '3d';
    void initializeCharts();
  }
  else if (key === 'conflictPolicy') {
    conflictPolicy = control.value as typeof conflictPolicy;
    const selected = control as HTMLSelectElement;
    elements.latestAction.textContent = `Conflict policy: ${selected.selectedOptions[0]?.textContent ?? selected.value}`;
  }
  else if (key === 'instanceModel') {
    comparisonInstanceModel = control.value as typeof comparisonInstanceModel;
    void initializeCharts();
  }
});
elements.actionControls.addEventListener('click', (event) => {
  const target = event.target as Element;
  const mutationButton = target.closest<HTMLButtonElement>('[data-mutate-element]');
  if (mutationButton?.dataset.mutateElement) {
    mutateInteractiveState(mutationButton.dataset.mutateElement as SharingElement);
    return;
  }
  const button = target.closest<HTMLButtonElement>('[data-action]');
  if (button?.dataset.action) void handleAction(button.dataset.action);
});

window.addEventListener('popstate', () => { void navigate(resolveLocation(location.search), { history: 'none' }); });
requireElement<HTMLButtonElement>('run-example').addEventListener('click', () => void initializeCharts());
requireElement<HTMLButtonElement>('reset-example').addEventListener('click', () => void navigate({ selection }, { history: 'replace' }));
requireElement<HTMLButtonElement>('export-state').addEventListener('click', () => {
  captureAllChartState();
  elements.stateJson.value = serializeSnapshot(snapshot);
  elements.latestAction.textContent = 'Export state';
});
requireElement<HTMLButtonElement>('import-state').addEventListener('click', async () => {
  try {
    const imported = parseSnapshot(elements.stateJson.value);
    getExample(imported.exampleId);
    await navigate({ selection: selectionForImport(selection, imported.exampleId) }, { history: 'push', imported });
  }
  catch (error) {
    elements.chartStatus.textContent = error instanceof Error ? error.message : String(error);
    elements.chartStatus.classList.add('is-error');
  }
});
requireElement<HTMLButtonElement>('export-option').addEventListener('click', () => {
  const option = charts.length === 1 ? charts[0].getOption() : charts.map((chart) => chart.getOption());
  downloadText(JSON.stringify(option, null, 2), `${currentExample.id}-option.json`, 'application/json');
});

Object.assign(window, {
  __matrixPoc: {
    dispatchAction(action: Record<string, unknown> & { type: string }): void {
      charts[0]?.dispatchAction(action);
    },
    getOption(): unknown {
      return charts.length === 1 ? charts[0]?.getOption() : charts.map((chart) => chart.getOption());
    },
    getSnapshot(): AppStateSnapshot {
      captureAllChartState();
      return JSON.parse(serializeSnapshot(snapshot)) as AppStateSnapshot;
    }
  }
});
requireElement<HTMLButtonElement>('export-image').addEventListener('click', () => {
  if (charts.length === 0) return;
  const dataUrl = charts[0].getDataURL({ type: 'png', pixelRatio: 1, backgroundColor: '#ffffff' });
  download(dataUrl, `${currentExample.id}-matrix.png`);
  elements.latestAction.textContent = 'getDataURL';
});
requireElement<HTMLButtonElement>('export-csv').addEventListener('click', () => {
  downloadText(rowsToCsv(createExportRows()), `${currentExample.id}-data.csv`, 'text/csv');
});
requireElement<HTMLButtonElement>('export-json').addEventListener('click', () => {
  downloadText(rowsToJson(createExportRows()), `${currentExample.id}-data.json`, 'application/json');
});
requireElement<HTMLButtonElement>('start-measurement').addEventListener('click', () => {
  if (charts.length === 0 || currentExample.id === 'R04' || (charts.length > 1 && currentExample.id !== 'R07')) {
    elements.measurementSummary.textContent = 'Use the one-instance examples for setOption timing.';
    return;
  }
  const updateAll = (): void => {
    if (charts.length === 1) {
      charts[0].setOption(buildOption(), { notMerge: true, lazyUpdate: false });
      return;
    }
    charts.forEach((chart, index) => {
      chart.setOption(buildPerCellCartesianOption(cells[index], snapshot), { notMerge: true, lazyUpdate: false });
    });
  };
  updateAll();
  const values = Array.from({ length: 5 }, () => {
    const started = performance.now();
    updateAll();
    return performance.now() - started;
  });
  const summary = summarizeMeasurements(values);
  const resizeValues = Array.from({ length: 5 }, () => {
    const started = performance.now();
    charts.forEach((chart) => chart.resize());
    return performance.now() - started;
  });
  const resizeSummary = summarizeMeasurements(resizeValues);
  elements.measurementSummary.textContent = `Init ${lastInitializationDuration.toFixed(2)} ms · Update median ${summary.median.toFixed(2)} ms · Resize median ${resizeSummary.median.toFixed(2)} ms · ${summary.iterations} iterations`;
  lastSetOptionDuration = values[values.length - 1];
  updateMetrics();
});

const resizeObserver = new ResizeObserver(() => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    const started = performance.now();
    charts.forEach((chart) => chart.resize());
    lastResizeDuration = performance.now() - started;
    updateMetrics();
  });
});
resizeObserver.observe(elements.chartHost);

window.addEventListener('pagehide', () => {
  initializationRequests.begin();
  resizeObserver.disconnect();
  cancelAnimationFrame(resizeFrame);
  disposeCharts();
  webglInstrumentation.restore();
}, { once: true });


void navigate(resolveLocation(location.search), { history: 'replace' }).catch((error) => {
  elements.chartStatus.textContent = error instanceof Error ? error.message : String(error);
  elements.chartStatus.classList.add('is-error');
  throw error;
});
