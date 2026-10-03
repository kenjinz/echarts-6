# ECharts Matrix Capability Lab

Standalone Vite and TypeScript proof of concept for evaluating multi-panel widget sharing with ECharts 6.1 matrix and ECharts-GL 2.1.

## Run

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the Vite URL, choose any example from the catalog, and use the generated scope and value controls. Every example has a stable query route such as `?example=C06`.

## Verify

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

The browser suite loads all 66 examples, exercises scope routing and interaction-state restoration, switches Canvas and SVG, compares one-instance and per-cell models, observes live WebGL resources, runs lifecycle stress, and writes representative evidence under `evidence/`.

## Implementation map

- `src/app/experimentRegistry.ts`: all M01–M10, C01–C16, S01–S10, P01–P12, G01–G10, and R01–R08 examples.
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
