# ECharts Matrix Sharing POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal Vite and TypeScript POC that renders twelve interactive heatmap cells through one ECharts 6 matrix and one ECharts instance, with switchable local/shared visual maps, legends, axes, and data zoom.

**Architecture:** An HTML control bar owns five Boolean sharing settings. A pure option builder creates one matrix containing twelve nested Cartesian grids and twenty-four heatmap series; the controller reapplies a complete option to the same ECharts instance whenever settings change. Each grid retains its own internal axes because ECharts scopes Cartesian axes to grids, while shared modes synchronize targets and hide redundant visuals.

**Tech Stack:** Vite 7, TypeScript 5, Apache ECharts 6, plain HTML and CSS

**Spec:** `docs/superpowers/specs/2026-09-10-echarts-matrix-sharing-poc-design.md`

## Global Constraints

- Create exactly one ECharts instance with exactly one `echarts.init(...)` call.
- Use the ECharts 6 `matrix` coordinate system to lay out all twelve nested Cartesian grids.
- Render a 3-row by 4-column arrangement with Observed and Forecast heatmap layers in every cell.
- Do not add automated tests; verify with TypeScript/Vite builds and browser interaction.
- Do not calculate twelve absolute grid rectangles manually.
- Shared X renders four outer bottom axes; shared Y renders three outer left axes.
- Shared data zoom is unavailable unless X or Y sharing is enabled.

---

## File Structure

- `package.json`: project commands and pinned major-version dependencies.
- `tsconfig.json`: strict browser TypeScript configuration.
- `index.html`: semantic application shell, toggle controls, chart mount, and status region.
- `src/chart-option.ts`: state types, stable data generation, component construction, and `buildChartOption`.
- `src/main.ts`: the single ECharts lifecycle, DOM state synchronization, option application, resize handling, and cleanup.
- `src/style.css`: dashboard layout, switches, minimum chart dimensions, responsive overflow, and error/status styling.
- `.gitignore`: generated dependencies and build output.

### Task 1: Scaffold the Vite TypeScript Application Shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/style.css`

**Interfaces:**
- Produces: DOM elements `#matrix-chart`, `#chart-status`, and checkbox inputs whose `data-setting` values match `keyof SharingState`.
- Produces: scripts `dev`, `build`, and `preview`.

- [ ] **Step 1: Create the package and TypeScript configuration**

Create `package.json`:

```json
{
  "name": "echarts-matrix-sharing-poc",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "echarts": "^6.0.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vite": "^7.0.0"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Create the semantic HTML shell**

Create `index.html` with a header, a one-instance badge, five labeled checkbox controls, an explanatory note attached to shared zoom, a live status line, and the chart mount. Use these exact setting keys:

```html
<label><input type="checkbox" data-setting="shareVisualMap"> Shared visual map</label>
<label><input type="checkbox" data-setting="shareLegend"> Shared legend</label>
<label><input type="checkbox" data-setting="shareXAxis"> Shared X axis</label>
<label><input type="checkbox" data-setting="shareYAxis"> Shared Y axis</label>
<label><input type="checkbox" data-setting="shareDataZoom"> Shared data zoom</label>
```

Load the module with `<script type="module" src="/src/main.ts"></script>`. Give the chart mount `role="img"` and an `aria-label` describing the 3 by 4 heatmap matrix. Do not create any additional chart containers.

- [ ] **Step 3: Style the page and chart workspace**

Create `src/style.css` with:

- a neutral dashboard page and sticky-looking control surface;
- native checkboxes styled as clear switches while retaining keyboard focus;
- a `.chart-scroll` wrapper with `overflow: auto`;
- `#matrix-chart { min-width: 1440px; height: 1040px; }` so local controls stay readable;
- a muted disabled state for shared zoom;
- a responsive breakpoint that keeps horizontal scrolling instead of shrinking matrix cells; and
- status variants for active configuration and initialization failure.

Use CSS custom properties for the background, panel, text, muted text, border, accent, and danger colors. Do not import fonts or other network assets.

- [ ] **Step 4: Ignore generated files and install dependencies**

Create `.gitignore`:

```gitignore
node_modules/
dist/
.vite/
*.log
```

Run: `npm install`

Expected: ECharts 6.x, Vite 7.x, and TypeScript 5.x install and a lockfile is generated.

- [ ] **Step 5: Commit the scaffold**

```bash
git add package.json package-lock.json tsconfig.json index.html .gitignore src/style.css
git commit -m "chore: scaffold matrix sharing POC"
```

### Task 2: Build the Matrix Option Generator

**Files:**
- Create: `src/chart-option.ts`

**Interfaces:**
- Produces: `SharingState` with five Boolean fields.
- Produces: `DEFAULT_SHARING_STATE: Readonly<SharingState>`.
- Produces: `normalizeSharingState(state: SharingState): SharingState`.
- Produces: `buildChartOption(state: SharingState): EChartsOption`.
- Produces: `summarizeSharingState(state: SharingState): string`.

- [ ] **Step 1: Define state, domains, and stable cell metadata**

In `src/chart-option.ts`, import `EChartsOption` from `echarts`, define the public state interface, and use these constants:

```ts
export interface SharingState {
  shareVisualMap: boolean;
  shareLegend: boolean;
  shareXAxis: boolean;
  shareYAxis: boolean;
  shareDataZoom: boolean;
}

export const DEFAULT_SHARING_STATE: Readonly<SharingState> = {
  shareVisualMap: false,
  shareLegend: false,
  shareXAxis: false,
  shareYAxis: false,
  shareDataZoom: false
};

const MATRIX_COLUMNS = ['North', 'East', 'South', 'West'];
const MATRIX_ROWS = ['Temperature', 'Humidity', 'Pressure'];
const X_CATEGORIES = ['00', '03', '06', '09', '12', '15', '18', '21'];
const Y_CATEGORIES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VALUE_MIN = 0;
const VALUE_MAX = 100;
```

Normalize shared zoom with:

```ts
export function normalizeSharingState(state: SharingState): SharingState {
  return {
    ...state,
    shareDataZoom:
      state.shareDataZoom && (state.shareXAxis || state.shareYAxis)
  };
}
```

- [ ] **Step 2: Generate deterministic Observed and Forecast data**

Add a `makeLayerData(rowIndex, columnIndex, layerOffset)` helper returning `[xIndex, yIndex, value][]`. Generate every value with a deterministic arithmetic formula and clamp it into `0..100`:

```ts
const raw =
  18 + rowIndex * 17 + columnIndex * 11 +
  xIndex * 7 + yIndex * 9 + layerOffset +
  ((xIndex + 1) * (yIndex + 2) * (columnIndex + 2)) % 23;
const value = Math.max(VALUE_MIN, Math.min(VALUE_MAX, raw % 101));
```

Observed uses `layerOffset = 0`; Forecast uses `layerOffset = 9`. Keep all inputs numeric and return fresh arrays so ECharts can safely transform them.

- [ ] **Step 3: Create the matrix and one nested grid per cell**

Initialize the option with one matrix whose X data is `MATRIX_COLUMNS`, whose Y data is `MATRIX_ROWS`, and whose bounds reserve header, outer axes, global legend, global visual map, and global zoom space:

```ts
const option: EChartsOption = {
  animationDurationUpdate: 250,
  matrix: {
    id: 'poc-matrix',
    left: 92,
    right: normalized.shareVisualMap || normalized.shareYAxis ? 132 : 42,
    top: normalized.shareLegend ? 76 : 34,
    bottom: normalized.shareDataZoom && normalized.shareXAxis ? 84 : 46,
    x: { data: MATRIX_COLUMNS, levelSize: 32 },
    y: { data: MATRIX_ROWS, levelSize: 38 },
    body: { itemStyle: { borderColor: '#cbd5e1', borderWidth: 1 } }
  },
  tooltip: { trigger: 'item', confine: true },
  grid: [],
  xAxis: [],
  yAxis: [],
  legend: [],
  visualMap: [],
  dataZoom: [],
  series: []
};
```

Loop row-major over the 3 by 4 cells. For cell id `cell-${rowIndex}-${columnIndex}`, push one grid using the official nested-grid pattern:

```ts
{
  id: cellId,
  coordinateSystem: 'matrix',
  coord: [columnName, rowName],
  top: normalized.shareLegend ? 8 : 26,
  right: normalized.shareVisualMap ? 8 : 34,
  bottom: 26,
  left: 34,
  containLabel: false
}
```

Use matrix-relative offsets only; do not assign absolute percentage rectangles to individual grids.

- [ ] **Step 4: Add axes with independent outer-edge visibility**

For each cell, push category axes linked through `gridId: cellId`. All axes receive the complete common category arrays.

For X, compute `showXAxis = !normalized.shareXAxis || rowIndex === MATRIX_ROWS.length - 1`. For Y, compute `showYAxis = !normalized.shareYAxis || columnIndex === 0`. Apply those Booleans consistently to `axisLine.show`, `axisTick.show`, and `axisLabel.show`; keep `splitLine.show` false and use small readable labels.

This creates twelve valid Cartesian pairs while rendering exactly four bottom X axes in shared-X mode and three left Y axes in shared-Y mode.

- [ ] **Step 5: Add cell-isolated or grouped heatmap series names**

For each cell, create two heatmap series with `xAxisId` and `yAxisId` set to `cellId`, progressive rendering disabled for predictable interaction, and thin white cell borders.

Use these identities:

```ts
const observedName = normalized.shareLegend
  ? 'Observed'
  : `${cellId}:Observed`;
const forecastName = normalized.shareLegend
  ? 'Forecast'
  : `${cellId}:Forecast`;
```

Assign stable series ids `${cellId}-observed` and `${cellId}-forecast`. The tooltip formatter reads `seriesId`, resolves the cell title and layer, and returns the X category, Y category, and numeric value.

- [ ] **Step 6: Build local and shared legends**

In local mode, push one legend per cell with `coordinateSystem: 'matrix'`, `coord: [columnName, rowName]`, the two unique local names as `data`, and a formatter that strips the `${cellId}:` prefix. Use compact item sizes and top alignment inside the cell.

In shared mode, create one horizontal legend centered above the matrix:

```ts
{
  id: 'shared-legend',
  data: ['Observed', 'Forecast'],
  top: 18,
  left: 'center',
  selectedMode: true
}
```

Do not create local legend components in shared mode.

- [ ] **Step 7: Build local and shared visual maps**

In local mode, push one compact continuous visual map per cell. Lay it out relative to that matrix cell with `coordinateSystem: 'matrix'` and `coord`, set `seriesIndex` to the two series indexes for that cell, use `min: 0`, `max: 100`, `calculable: true`, and hide endpoint text to conserve space.

In shared mode, create one vertical continuous visual map on the right with `seriesIndex` set to all twenty-four indexes, `min: 0`, `max: 100`, `calculable: true`, and the same blue-to-cyan-to-amber-to-red color ramp.

Each series must be targeted by exactly one visual map in either mode.

- [ ] **Step 8: Build valid local and shared data zoom arrays**

When an axis dimension is not shared, add one `inside` data zoom per cell for that cell's matching axis id.

When an axis dimension is shared and `shareDataZoom` is false, do not create zoom for that dimension; its full common range stays fixed.

When `shareDataZoom` and `shareXAxis` are true, add:

```ts
{
  id: 'shared-x-slider',
  type: 'slider',
  xAxisIndex: 'all',
  left: 92,
  right: 132,
  bottom: 20,
  height: 22,
  filterMode: 'filter'
},
{
  id: 'shared-x-inside',
  type: 'inside',
  xAxisIndex: 'all',
  filterMode: 'filter'
}
```

When `shareDataZoom` and `shareYAxis` are true, add an analogous vertical slider at the right and one inside zoom with `yAxisIndex: 'all'`. Use `filterMode: 'filter'` for all data zoom components.

- [ ] **Step 9: Export a readable state summary**

Implement `summarizeSharingState` to return a compact string such as:

```text
Visual map: local · Legend: shared · X: shared · Y: local · Zoom: shared X
```

The zoom segment must distinguish `local`, `fixed shared axes`, `shared X`, `shared Y`, and `shared X + Y` based on normalized state.

- [ ] **Step 10: Commit the option generator**

```bash
git add src/chart-option.ts
git commit -m "feat: generate matrix heatmap configuration"
```

### Task 3: Wire the Single Chart Instance and Sharing Controls

**Files:**
- Create: `src/main.ts`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `SharingState`, `DEFAULT_SHARING_STATE`, `normalizeSharingState`, `buildChartOption`, and `summarizeSharingState` from `src/chart-option.ts`.
- Produces: one browser-owned ECharts instance and interactive settings controls.

- [ ] **Step 1: Initialize exactly one ECharts instance**

In `src/main.ts`, import the full ECharts bundle, the option helpers, and the stylesheet. Resolve the chart and status elements through a typed helper that throws `Missing required element: #<id>` when absent.

Create the instance once:

```ts
const chartElement = requireElement<HTMLDivElement>('matrix-chart');
const statusElement = requireElement<HTMLElement>('chart-status');
const chart = echarts.init(chartElement, undefined, { renderer: 'canvas' });
```

Do not call `echarts.init` anywhere else. Do not use `echarts.connect`, because there is no second instance.

- [ ] **Step 2: Apply normalized state without recreating the chart**

Keep a mutable copy of `DEFAULT_SHARING_STATE`. Implement:

```ts
function render(nextState: SharingState): void {
  state = normalizeSharingState(nextState);
  chart.setOption(buildChartOption(state), {
    notMerge: true,
    lazyUpdate: false
  });
  syncControls();
  statusElement.textContent = `1 ECharts instance · ${summarizeSharingState(state)}`;
}
```

`syncControls` checks each input according to its state field. It disables only the `shareDataZoom` input when neither axis is shared and updates the adjacent explanation.

- [ ] **Step 3: Bind the five controls through one delegated handler**

Select all `input[data-setting]` controls and handle `change`. Validate the attribute against an explicit `Set<keyof SharingState>` before indexing state:

```ts
const SETTING_KEYS = new Set<keyof SharingState>([
  'shareVisualMap',
  'shareLegend',
  'shareXAxis',
  'shareYAxis',
  'shareDataZoom'
]);
```

When both shared-axis settings become false, set `shareDataZoom` to false before rendering. Rebuilding the option deliberately resets zoom ranges while preserving the same chart object.

- [ ] **Step 4: Add resize and teardown handling**

Observe `chartElement` with `ResizeObserver` and call `chart.resize()` in the callback. Add a one-time `pagehide` listener that disconnects the observer and disposes the chart.

Call `render({ ...DEFAULT_SHARING_STATE })` exactly once after handlers are registered. Wrap startup in `try/catch`; on failure, set the status text to `Unable to initialize the matrix POC` and add the error CSS class before rethrowing for the developer console.

- [ ] **Step 5: Run the production build and inspect bundle output**

Run: `npm run build`

Expected: TypeScript exits successfully and Vite writes `dist/index.html` plus bundled assets. A Vite bundle-size warning caused by the full ECharts import is acceptable for this POC.

- [ ] **Step 6: Commit the interactive application**

```bash
git add src/main.ts src/style.css
git commit -m "feat: add matrix sharing controls"
```

### Task 4: Perform Browser Verification and Correct Integration Defects

**Files:**
- Modify if required by observed defects: `src/chart-option.ts`
- Modify if required by observed defects: `src/main.ts`
- Modify if required by observed defects: `src/style.css`

**Interfaces:**
- Consumes: the completed Vite application.
- Produces: a manually verified POC with documented run instructions in the final handoff.

- [ ] **Step 1: Start the development server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL and keeps running without TypeScript or runtime startup errors.

- [ ] **Step 2: Verify the default local configuration**

Open the local URL and confirm:

- the header reports `1 ECharts instance`;
- twelve titled cells appear in a 3 by 4 matrix;
- every cell contains Observed and Forecast heatmap layers;
- every cell displays X and Y axes, a compact legend, and a local visual map;
- wheel/pinch zoom inside one cell changes only that cell; and
- shared data zoom is disabled.

- [ ] **Step 3: Verify component sharing**

Enable shared visual map and confirm only one map remains on the right and changing its range recolors every cell. Enable shared legend and confirm only one legend remains above the matrix and each item toggles its layer in all twelve cells.

- [ ] **Step 4: Verify shared axes and zoom dependencies**

Enable shared X and confirm only four bottom X axes render. Enable shared Y and confirm only three left Y axes render. Confirm shared zoom becomes available, then enable it and verify gestures in any cell plus the outer sliders update all matching axes. Disable both shared axes and confirm shared zoom turns off and becomes unavailable.

- [ ] **Step 5: Verify resizing and instance stability**

Resize the browser across desktop widths and confirm the existing canvas resizes or the wrapper scrolls without unreadable cell compression. Toggle every setting repeatedly and confirm the displayed instance count stays at one and the browser console has no errors.

- [ ] **Step 6: Re-run the production build**

Stop the development server cleanly, then run: `npm run build`

Expected: TypeScript and Vite complete successfully after any browser-driven corrections.

- [ ] **Step 7: Commit any browser-verification corrections**

If browser verification required source changes, commit only those source files:

```bash
git add src/chart-option.ts src/main.ts src/style.css
git commit -m "fix: refine matrix sharing interactions"
```

If no source corrections were required, do not create an empty commit.
