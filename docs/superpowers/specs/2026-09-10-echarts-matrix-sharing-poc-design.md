# ECharts Matrix Sharing POC Design

## Purpose

Build a minimal Vite and TypeScript proof of concept for experimenting with the ECharts 6 matrix coordinate system. The page presents twelve heatmaps in a 3-row by 4-column matrix while creating exactly one ECharts instance.

The POC demonstrates switching between per-cell and shared visual maps, legends, axes, and data zoom controls. It is intentionally self-contained, uses deterministic sample data, and does not include automated tests.

## Project Shape

The workspace will contain a small Vite application with these responsibilities:

- `index.html` provides the application mount point.
- `src/main.ts` creates the controls, owns interaction state, initializes the single chart instance, and coordinates option updates.
- `src/chart-option.ts` generates deterministic heatmap data and builds the complete ECharts option from the current sharing state.
- `src/style.css` defines the page, control bar, chart sizing, responsive behavior, and disabled-control treatment.

The application will depend on ECharts 6.x and Vite's minimal TypeScript toolchain. It will not use a UI framework.

## Chart Architecture

One call to `echarts.init` creates the only chart instance. One ECharts `matrix` component defines a 3 by 4 table-like layout. Each matrix cell contains:

- one nested Cartesian `grid` component;
- one internal category X axis and one internal category Y axis;
- one Observed heatmap series and one Forecast heatmap series;
- cell-specific component placement for local legend and visual-map modes; and
- local inside data zoom when axes and zoom are not shared.

This yields twelve nested grids and twenty-four series inside one ECharts instance. The matrix coordinate system performs cell layout; the page will not calculate twelve absolute percentage rectangles manually.

ECharts scopes each Cartesian axis to one grid. Therefore, a single physical Cartesian axis object cannot span all twelve grids. Axis sharing will retain one internal axis per grid, synchronize their category domains and ranges, and hide redundant axis visuals. This preserves valid Cartesian coordinates while presenting shared outer axes.

## Sample Data

All cells use the same numeric X and Y domains so shared axes and linked zoom have an unambiguous meaning. X spans `0..21` in steps of 3 and Y spans `1..6` in steps of 1. Each cell has a stable region-and-metric title and a deterministic numeric offset. Observed and Forecast values are generated from the same deterministic formula with a layer-specific variation.

The data remains stable when settings change. This makes visual comparisons meaningful and prevents option rebuilding from appearing to produce new measurements.

Tooltips identify:

- the cell title;
- the Observed or Forecast layer;
- the numeric X value;
- the numeric Y value; and
- the numeric value.

## Sharing State

The page owns five Boolean settings:

- `shareVisualMap`
- `shareLegend`
- `shareXAxis`
- `shareYAxis`
- `shareDataZoom`

An HTML control bar above the canvas exposes these as switches. `shareDataZoom` is disabled when neither axis is shared. Disabling both shared axes automatically turns shared zoom off.

Every change calls a pure `buildChartOption(state)` function and applies the result to the existing chart with a non-merging option update. The chart instance is never recreated during a mode switch.

## Visual Map Behavior

In local mode, each cell has a compact visual map targeting only that cell's two series. A local range selection changes only its cell.

In shared mode, the twelve local visual maps are replaced by one vertical visual map on the right side of the full matrix. It targets all twenty-four heatmap series, and its range selection recolors all cells.

The shared visual map uses a common numeric extent across the deterministic dataset. Local visual maps use that same extent so switching modes does not change the meaning of the colors.

## Legend Behavior

Each cell contains Observed and Forecast layers.

In local mode, series names include a cell-specific identity so each of the twelve compact legends controls only the two series in its own cell. Legend labels use formatting to display the concise names `Observed` and `Forecast`.

In shared mode, series names are rebuilt into the common `Observed` and `Forecast` groups. One legend above the matrix controls the corresponding layer across all twelve cells.

Legend selection is retained across option rebuilding. The pure option builder accepts the previous legend options as an explicit input. Unchanged local identities retain their selections, and a shared selection expands into every local legend. Uniform local selections collapse to the same shared selection. If local selections differ, the shared layer is visible when any cell previously showed it; it is hidden only when every cell hid it.

## Axis Behavior

In local mode, all twelve cells render their own X and Y axes, including axis lines, ticks, and labels.

When X sharing is enabled:

- every cell retains an internal value X axis with the same numeric domain and extent;
- only the four X axes belonging to the bottom row render their line, ticks, and labels; and
- each visible bottom axis represents the column above it.

When Y sharing is enabled:

- every cell retains an internal value Y axis with the same numeric domain and extent;
- only the three Y axes belonging to the leftmost column render their line, ticks, and labels; and
- each visible left axis represents the row beside it.

Both settings can be enabled independently or together. Hidden axes continue to provide coordinate systems to their heatmap series while taking minimal visual space.

## Data Zoom Behavior

In the default local mode, every cell supports inside data zoom for its X and Y axes. A gesture affects only the cell where it occurs.

Shared data zoom is available only while at least one axis dimension is shared:

- with shared X only, one outer horizontal slider and inside gestures target all twelve X axes;
- with shared Y only, one outer vertical slider and inside gestures target all twelve Y axes;
- with both shared, both outer sliders are present and inside gestures target all matching axes.

If an axis is visually shared while `shareDataZoom` is off, that shared dimension remains at its full common range. This prevents visually shared axes from drifting into different ranges. Any non-shared dimension keeps its local inside zoom.

Switching an axis-sharing or zoom-sharing mode resets zoom to the full range. This keeps the POC behavior predictable and avoids carrying incompatible data-zoom component state between configurations.

## Layout and Interaction

The page uses a wide, responsive dashboard canvas with a practical minimum width and height. Smaller browser windows may scroll rather than compressing cells until labels and controls are unusable.

The header states that the page uses one ECharts instance and displays an instance count of one. Toggle cards communicate their current state. The shared-zoom card displays a short explanation while disabled.

The chart resizes through `ResizeObserver`, calling `chart.resize()` on the existing instance. A cleanup path disconnects the observer and disposes the chart during page teardown.

## Failure Handling

The deterministic dataset does not require network access. Initialization validates that the chart mount element exists and fails with a clear error if it does not. The option builder normalizes invalid state by forcing `shareDataZoom` to false when neither axis is shared.

Configuration updates remain synchronous. A visible status line reports the current sharing summary and can show an initialization failure instead of leaving an unexplained blank canvas.

## Verification

No automated tests will be added, as requested. Verification consists of:

- installing dependencies successfully;
- running the TypeScript compiler through the Vite production build;
- opening the app in a browser and confirming a 3 by 4 matrix of heatmaps;
- confirming the runtime reports one ECharts instance;
- toggling local and shared visual maps and checking their targeting;
- toggling local and shared legends and checking Observed and Forecast visibility;
- enabling shared X and shared Y independently and together, checking outer-axis visibility;
- confirming shared zoom is unavailable without a shared axis;
- confirming local zoom affects one cell and shared zoom affects every applicable cell; and
- resizing the viewport and checking that the existing instance resizes without creating another chart.

## Non-Goals

The POC does not include automated tests, backend services, persistence, production data loading, accessibility certification, framework integration, or a second ECharts instance. Its purpose is to expose ECharts 6 matrix composition and component-sharing behavior for hands-on experimentation.
