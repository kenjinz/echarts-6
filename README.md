# ECharts Matrix Capability Lab

Standalone Vite and TypeScript proof of concept for evaluating multi-panel widget sharing with ECharts 6.1 matrix and ECharts-GL 2.1.

## Run

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the Vite URL, choose any example from the catalog, and use the generated scope and value controls. Every example has a stable query route such as `?example=C06`.

Independent 2D plots contain their own legends, zoom toolboxes, and applicable
color scales. Larger matrices scroll to keep plots and controls readable.
X axis sharing and Y axis sharing each control the entire axis: its range,
zoom and settings use one state per group. Wheel, slider and box zoom all
operate on that group. Sharing both dimensions packs each comparison group
together with a 4px gap and hides interior axes. C05 opens with both axes already
shared. C17 demonstrates shared axes detached 16px from the plots; this offset
is limited to C17. Matrix labels have no surrounding borders, and light dashed
grid lines with axis ticks help compare values.
Older state exports with shared range or shared zoom settings are imported as
shared axes. If those settings conflict, the range scope takes precedence. Use
Shared X axis position and Shared Y axis position to choose the outer sides;
the default is bottom/left. Axis positions are included in exported state.
In guided view these settings are under Advanced chart settings.

Geometry and color controls retain only the distinct demonstrations: S02
compares pixel-sized markers with data-sized shapes, S03 controls vector scale
and a reference value, S04/S05 compare continuous and piecewise color scales,
and S09 preserves equal coordinate scales. S01, S06, S07, S08, and S10 were
removed because the other chart examples already cover their behavior.

G01 is an unsupported-layout diagnostic: this ECharts-GL version ignores native
matrix placement for grid3D, so its viewports overlap. G02 uses explicit panel
positions. Each 3D series targets its own grid3D; G04 synchronizes camera gestures
within the chosen group. G05/G06 keep legends and color scales beside their own
plots. G07 reserves separate regions for its 3D main view and 2D profiles, and
G08 uses matching panel slots when mixing dimensions. G09 preserves the selected
camera during enlargement, while G10 compares one instance with per-panel instances.

## Verify

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

The browser suite loads all 62 examples, exercises scope routing and interaction-state restoration, switches Canvas and SVG, compares one-instance and per-cell models, observes live WebGL resources, runs lifecycle stress, and writes representative evidence under `evidence/`.

## Implementation map

- `src/app/experimentRegistry.ts`: M01–M10, C01–C17, S02–S05, S09, P01–P12, G01–G10, and R01–R08 examples.
- `src/experiments`: matrix, Cartesian, bounded spatial, compound, 3D, and mixed 2D/3D option builders.
- `src/sharing`: serializable state and exact individual/all/row/column target resolution.
- `src/core`: deterministic exports, WebGL instrumentation, and measurements.
- `src/results`: capability scorecard types and store.
- `tests`: pure topology/state tests and Playwright browser checks.

## Interpretation rules

- Matrix layout, ECharts component behavior, and ECharts-GL behavior are recorded separately.
- External HTML controls are application wiring, not native ECharts controls.
- Every capability remains `Inconclusive` with low confidence until its example-specific automated and visual/domain-parity acceptance checks pass.
- `G02`, `P08`, and `G07` explicitly exercise calculated-box approaches, but the scorecard does not promote them to a verdict yet.
- CSV, JSON, and state export are application features independent of chart instance count.

The runtime result panel reports live instances, visual roots, WebGL contexts, DOM nodes, action routing, timings, and the current provisional capability classification.

## Presentation and engineering views

Open the app without a query string for 20 guided lessons in six chapters.
Each lesson contains selectable variants backed by the original engineering examples.

- `/?lesson=D04&example=C06` opens the X zoom variant of the linked-zoom lesson.
- `/?example=C06` opens the original engineering example and full controls.
- `/?mode=engineering` opens the 62-example engineering catalog.

Changing lessons or variants resets the chart. Switching catalog views for the
same source preserves the active investigation. Browser back/forward restores
the selected lesson/source with its default chart state, not a historical zoom.
Use Export state and Import state to save and restore an investigation.

Advanced controls and Technical details retain the original settings, metrics,
and source IDs. Eight implementation-focused cases are linked from the technical
appendix. Guided screenshots are in `evidence/presentation/`.

Guides distinguish expected observations from verified results. Capability
classifications remain provisional. CSV/JSON exports use the generated sample
data model; shared 3D cameras use ECharts-GL camera events; timing results
are specific to the tested machine and workload.
