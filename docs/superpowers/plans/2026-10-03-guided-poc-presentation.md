# Guided PoC Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 20 guided customer-facing lessons in six chapters while preserving all 66 independently runnable engineering examples.

**Architecture:** A typed presentation catalog references the existing experiment registry. Pure navigation functions resolve URLs and mode transitions; a presentation view renders guidance and organizes existing controls. `src/main.ts` remains the single owner of chart state, selection, and initialization.

**Tech Stack:** Existing TypeScript, Vite, ECharts 6.1.0, ECharts-GL 2.1.0, Vitest, and Playwright; native DOM APIs.

**Spec:** `docs/superpowers/specs/2026-10-03-guided-poc-presentation-design.md` (approved by the user's request to start writing this plan on 2026-10-03).

## Global Constraints

- Exactly 20 guided lessons, with stable IDs D01 through D20 and the mapping below.
- Six chapters, ordered from basic comparison to architectural evidence.
- Every lesson explains its question, actions, expected observations, and evidence limitations.
- Selectable variants reuse existing engineering examples. A lesson is not a new chart family or a union of every source example's capabilities.
- Preserve all 66 existing IDs and direct links; preserve the scorecard's provisional classifications.
- Default fresh visits to the guided presentation; existing example links continue to open the engineering catalog.
- Prefer a 2 by 2 starting layout, retaining the existing 3 by 2 special case for P12.
- No new dependencies, backend, chart family, performance claim, or scorecard promotion.
- Snapshot format remains version 1 and contains the engineering example ID, not tutorial metadata.
- Guided labels use panel, linked zoom, color scale, point symbols, top profile, and side profile. Engineering mode retains existing labels and identifiers so existing checks and technical terminology remain usable.
- Scope options remain Individual, All cells, Per row, and Per column wherever the active source supports them.
- Existing screenshots, option snapshots, and measurements remain evidence inputs. Add guided screenshots under a separate presentation evidence folder; do not replace existing evidence just to document new navigation.

## Review Focus

1. Rapid navigation while GL imports: the most recent requested source owns the chart, URL, guide, and error status (Task 3).
2. Imported P12 dimensions or mixed 2D/3D state: imported values survive initialization and failed imports leave the active view unchanged (Tasks 3 and 5).
3. Mode switches, browser history, and filtered navigation: controls remain attached, direct links still work, and mode-only changes retain interactive state (Tasks 2, 4, and 5).
4. Advanced controls and fixed coupling: guidance never asks for an inaccessible action; keyboard navigation does not enter collapsed content; engineering selectors remain usable (Tasks 1, 4, and 6).
5. Guide/implementation disagreement: every variant names actual controls and expresses expected behavior separately from provisional evidence; export, camera, and performance limitations stay visible (Tasks 1 and 6).

## Execution notes

Read the spec and this plan before changing product code. Work in `G:\echarts-6`; that is the consolidated checkout, and `G:\echarts-6-worktrees` was intentionally removed. At execution time use the worktree skill to determine isolation; prefer an in-repository `.worktrees/guided-presentation` if a linked worktree is necessary, and report its location. Do not silently leave the user viewing stale `main` at handoff. Integration/publishing after implementation follows the branch-completion workflow and the user's then-current instructions.

PowerShell commands use `npm.cmd`. Git may need command-local `-c safe.directory=G:/echarts-6` (and the actual worktree path if used); do not change global safety settings. Existing repository-local publishing hooks remain enabled. Run the publishing skill's current-repository setup if executing in a checkout without those hooks. Never bypass hooks.

Task order is 1 through 6. Tasks are sequential because the view, routing, and chart integration share contracts. Execute one failing test, implementation, passing test cycle at a time. Code blocks below establish contracts and concrete behavior; incorporate them into the named files with the necessary imports. All prose and control-policy entries are specified below or in the approved spec, not deferred design decisions.

## File ownership

| File | Responsibility |
| --- | --- |
| `src/presentation/types.ts` | Presentation contracts only |
| `src/presentation/catalog.ts` | Six chapters, 20 ordered lessons, eight appendix entries |
| `src/presentation/guides.ts` | Source-specific copy and primary-control policies for 58 variants |
| `src/presentation/navigation.ts` | URL parsing, serialization, search, adjacency, mode/import route resolution |
| `src/presentation/view.ts` | Guided DOM, labels, control placement, and callbacks; no ECharts ownership |
| `src/core/latestRequest.ts` | Small generation guard for asynchronous chart initialization |
| `src/sharing/optionState.ts` | Default-versus-imported snapshot preparation |
| `src/main.ts` | Existing chart lifecycle and centralized presentation selection integration |
| `index.html`, `src/style.css` | Guided markup, disclosures, responsive styling |
| `tests/presentationCatalog.test.ts`, `tests/presentationNavigation.test.ts` | Catalog and route contracts |
| `tests/latestRequest.test.ts`, `tests/foundationState.test.ts` | Race guard and imported snapshot preservation |
| `tests/e2e/presentation.spec.ts` | Guided navigation, controls, imports, and race regression checks |
| `tests/e2e/presentationEvidence.spec.ts` | Separate guided screenshots and layout checks |
| `README.md` | Presentation and engineering entry points |

---

## Task 1: Build the teaching catalog and control policies

**Files:** Create `src/presentation/types.ts`, `src/presentation/catalog.ts`, `src/presentation/guides.ts`, and `tests/presentationCatalog.test.ts`.

**Consumes:** `EXAMPLES: readonly ExampleDefinition[]`, `getExample(id: string): ExampleDefinition`, and `SharingElement` from the existing registry/types.

**Produces:** `CHAPTERS: readonly Chapter[]`, `LESSONS: readonly Lesson[]`, `APPENDIX: readonly AppendixEntry[]`, and `GUIDES: Readonly<Record<string, Variant>>` with the following contracts.

- [x] **Step 1: Write the failing catalog integrity and control-compatibility tests.**

```ts
import { expect, it } from 'vitest';
import { EXAMPLES, getExample } from '../src/app/experimentRegistry';
import { CHAPTERS, LESSONS, APPENDIX } from '../src/presentation/catalog';

it('covers every engineering case exactly once across lessons and appendix', () => {
  expect(CHAPTERS).toHaveLength(6);
  expect(LESSONS.map(l => l.id)).toEqual(
    Array.from({ length: 20 }, (_, i) => `D${String(i + 1).padStart(2, '0')}`)
  );
  const guided = LESSONS.flatMap(l => l.variants.map(v => v.exampleId));
  expect(guided).toHaveLength(58);
  expect(APPENDIX).toHaveLength(8);
  const all = [...guided, ...APPENDIX.map(a => a.exampleId)];
  expect(new Set(all).size).toBe(66);
  expect([...all].sort()).toEqual(EXAMPLES.map(e => e.id).sort());
});

it('has actionable guidance and only declares source-supported sharing controls', () => {
  for (const lesson of LESSONS) {
    expect(CHAPTERS.some(c => c.id === lesson.chapterId)).toBe(true);
    expect(lesson.question.trim().endsWith('?')).toBe(true);
    for (const variant of lesson.variants) {
      const source = getExample(variant.exampleId);
      expect(variant.steps.length).toBeGreaterThanOrEqual(2);
      expect(variant.steps.length).toBeLessThanOrEqual(3);
      for (const text of [variant.label, variant.expected, variant.limitation, ...variant.steps]) {
        expect(text.trim().length).toBeGreaterThan(8);
      }
      for (const element of variant.controls.sharing) {
        expect(source.sharing.some(c => c.element === element)).toBe(true);
      }
      expect(new Set(variant.controls.sharing).size).toBe(variant.controls.sharing.length);
    }
  }
});
```

Add explicit assertions that G04 warns about programmatic versus drag synchronization, R03 describes generated sample data, and R07 describes machine-specific measurements. These protect material limitations rather than copy punctuation.

- [x] **Step 2: Run the focused test and observe missing-module failures.**

```powershell
npm.cmd test -- tests/presentationCatalog.test.ts
```

- [x] **Step 3: Define the types.**

```ts
import type { SharingElement } from '../core/types';
export type PresentationMode = 'guided' | 'engineering';
export type CommonControl = 'rows' | 'columns' | 'renderer' | 'seed' |
  'conflictPolicy' | 'viewMode' | 'instanceModel';
export type PanelAction = 'add-row' | 'remove-row' | 'add-column' | 'remove-column' |
  'regenerate' | 'enlarge' | 'restore' | 'remove-all' | 'restore-default';
export type UtilityPanel = 'state' | 'exports' | 'metrics' | 'measurement' | 'events';
export interface ControlPolicy {
  common: readonly CommonControl[];
  sharing: readonly SharingElement[];
  actions: readonly PanelAction[];
  utilities: readonly UtilityPanel[];
}
export interface Variant {
  exampleId: string;
  label: string;
  steps: readonly [string, string] | readonly [string, string, string];
  expected: string;
  limitation: string;
  controls: ControlPolicy;
}
export interface Chapter { id: string; title: string; }
export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  question: string;
  variants: readonly Variant[];
}
export interface AppendixEntry { exampleId: string; reason: string; }
export type Selection =
  | { mode: 'guided'; lessonId: string; exampleId: string }
  | { mode: 'engineering'; exampleId: string };
export interface Resolution { selection: Selection; notice?: string; }
```

- [x] **Step 4: Populate catalog metadata using the approved titles/questions and this exact mapping.**

```ts
const lessonSources = [
  ['D01', 'compare', ['M02', 'C01']],
  ['D02', 'compare', ['M04', 'M05', 'M08', 'M09', 'C15', 'C16']],
  ['D03', 'compare', ['C02', 'C03', 'C04', 'C05']],
  ['D04', 'compare', ['C06', 'C07', 'C08']],
  ['D05', 'compare', ['C09', 'C10', 'C11', 'S07']],
  ['D06', 'compare', ['M07', 'C13', 'C14', 'S08']],
  ['D07', 'spatial', ['S01', 'S02', 'S09']],
  ['D08', 'spatial', ['S04', 'S05']],
  ['D09', 'spatial', ['S03']],
  ['D10', 'spatial', ['S06', 'S10']],
  ['D11', 'profiles', ['P01', 'P02', 'P03', 'P04']],
  ['D12', 'profiles', ['P09', 'P10', 'P11']],
  ['D13', 'profiles', ['P05', 'P12']],
  ['D14', 'three-dimensional', ['G02', 'G03', 'G06', 'G09']],
  ['D15', 'three-dimensional', ['G04', 'G05']],
  ['D16', 'three-dimensional', ['G08']],
  ['D17', 'three-dimensional', ['G07']],
  ['D18', 'save', ['R01']],
  ['D19', 'save', ['M10', 'R02', 'R03']],
  ['D20', 'evaluate', ['R07', 'R04', 'G10', 'R05', 'R06', 'R08']]
] as const;
```

Use the six chapter titles from the specification, preserving order. Populate `Lesson.title` and `Lesson.question` with its exact table title and opening question. Resolve variants from `GUIDES` in source order, with the first as default. Give appendix entries the registry title at render time and these reasons: M01 direct matrix coordinates; M03 mixed axis types; M06 component placement; C12 axis compatibility; P06 matrix subregions; P07 multiple nested grids; P08 calculated pixel layout; G01 native 3D placement investigation.

- [x] **Step 5: Author the 58 guide records from the following source-specific scripts.**

Each semicolon-delimited action is one step, except a final grouped observation may remain in the second step. Expand abbreviations into the guided labels. The label identifies the source variant in plain language, such as `X zoom` for C06. Keep each record to two or three steps. Expected text must say what to examine, not mark the source as passed. Set `limitation` from the source-specific limitation in `evidence/final-scorecard.md`, using the explicit qualifications in this table where present. Do not mechanically generate the same steps from the example title.

| Source | Steps | Expected observation / material qualification |
| --- | --- | --- |
| M02 | Identify the four panels; hover a point in two panels | Each panel has its own plot inside the common layout |
| C01 | Inspect a line and its points; hover another panel | Independent panels provide the baseline for later sharing |
| M04 | Compare the first column with the others; change column count | Fixed and automatic sizes have different layout effects |
| M05 | Read the headers and merged label; locate the empty position | Labels and intentionally empty positions remain understandable |
| M08 | Add a row; remove that row | Added plots appear and removed plots do not remain visible |
| M09 | Reduce browser width; restore the width | Plots remain in their intended panels |
| C15 | Select a panel in the first row; add and remove a different row | Check selected-panel identity; this source currently exposes no local zoom, so zoom preservation is not demonstrated here |
| C16 | Read long headers; narrow the browser | Check wrapping and scrolling rather than assuming labels fit |
| C02 | Select a panel and set X range scope to Individual; change X range; repeat with Per row | Only the selected scope should receive the numeric range |
| C03 | Select a panel and set Y range scope to Individual; change Y range; repeat with Per column | Y ranges should change independently of X |
| C04 | Set X range scope to All cells and Y range scope to Individual; change X and then Y range | X and Y target groups remain independent |
| C05 | Inspect outer axis labels; change X range with All cells scope | Repeated labels are hidden; underlying axes remain separate |
| C06 | Set X linked zoom scope to Individual and change X linked zoom; repeat with Per row; reset the example | Observe horizontal target isolation and reset |
| C07 | Set Y linked zoom scope to Individual and change Y linked zoom; repeat with Per column; reset the example | Observe vertical target isolation and reset |
| C08 | Use the chart's selected-area zoom tool; select an area; use its restore tool | Cross-panel selection is an evaluation, not a proven capability |
| C09 | Set legend selection scope to Individual and change legend selection; repeat with All cells | Matching series visibility follows the selected group |
| C10 | Change series visibility for Individual; restore it and repeat with Per row | A whole series is hidden or shown |
| C11 | Change point-symbol visibility; inspect the line; restore the points | The line should remain when its symbols are hidden |
| S07 | Change spatial series visibility; restore it and change point-symbol visibility | Distinguish whole-series visibility from symbol rendering |
| M07 | Click a point in one panel; inspect the event and target; click another panel | Event identity should refer to the intended panel |
| C13 | Hover a point; click it and inspect the event target | Tooltip and event identities provide the inspection context |
| C14 | Select a panel; enlarge it; restore all panels | Observe panel restoration; local zoom is not exposed by this source, so zoom preservation remains unverified |
| S08 | Hover a spatial item; select it; inspect event and item identity | Selection/event parity remains subject to manual review |
| S01 | Identify the circular boundary and rectangular regions; resize the browser and inspect the edge | Inspect geometry and clipping; this variant currently has no local zoom control |
| S02 | Compare a point symbol with a rectangular region; resize the browser | Compare screen-sized symbols and domain-sized regions during resize; zoom is not configured in this source and remains unverified |
| S09 | Enlarge a panel; resize the browser; restore the panel | Inspect aspect ratio and clipping visually |
| S04 | Change color-scale selection for Individual; repeat for All cells | Continuous colors represent the same numeric scale |
| S05 | Inspect discrete color bands; change color-scale selection for a group | Value bands differ from a continuous gradient |
| S03 | Change vector scale for Individual; change reference-vector value; repeat with Per row | Arrows respond to application inputs for the intended group |
| S06 | Change X linked zoom for Individual; repeat with Per row; compare the Y range | Spatial sharing should not leak into unrelated dimensions |
| S10 | Select a spatial item; regenerate data; add a row and inspect prior selection | Evaluate selection persistence; local zoom and the scope controls from S06 are not present here |
| P01 | Identify the main plot; hover a measurement | Establish the main-only baseline |
| P02 | Identify main and top profile; zoom the main X dimension | Fixed main/top X coupling must remain visible |
| P03 | Identify main and side profile; zoom the main Y dimension | Fixed main/side Y coupling must remain visible |
| P04 | Identify all three plots; zoom X; zoom Y | Main/top X and main/side Y links are separate |
| P09 | Set main X range scope to Per row and change it; inspect top profiles and unaffected rows | Optional cross-panel sharing preserves required local coupling |
| P10 | Change top-profile value range for Per row; change side-profile value range for Individual | Profile value axes remain distinct from coupled position axes |
| P11 | Change legend selection for a group; restore it and change color scale | Dense component layouts still need visual review |
| P05 | Compare neighboring panels with missing profiles; resize the browser | Main plots should remain aligned despite absent auxiliaries |
| P12 | Inspect the 2-column/3-row arrangement; narrow the browser | Check labels, profiles, and plot readability |
| G02 | Identify each 3D viewport; rotate one view | This uses explicit boxes, not proven native matrix placement |
| G03 | Rotate the first view; rotate another view | Check that camera input targets the intended viewport |
| G06 | Inspect the representative 3D series; rotate the view | Representative rendering does not establish domain parity |
| G09 | Rotate and select a panel; enlarge it; restore it | Inspect camera and visual state preservation |
| G04 | Change camera with Individual scope; repeat with All cells | Programmatic changes do not prove mouse-drag synchronization |
| G05 | Change Z range with Per row scope; change color scale for Individual | Camera state and numeric ranges are separate concepts |
| G08 | Change one panel to 2D; repeat with a group; return to 3D | Inspect retained state and contexts without claiming rendering parity |
| G07 | Identify the 3D main and 2D profiles; zoom the top profile along X; resize | Inspect fixed profile/main coupling; its fixed scope selector is informational, not an editable control |
| R01 | Change a sharing setting and export state; reset; import the saved snapshot | Application state should be restored in a fresh chart instance |
| M10 | Inspect headers and panels; export the image | Check that the downloaded image contains visible components |
| R02 | Export with Canvas; select SVG and export again | Inspect supported output per renderer; do not promise GL/SVG equivalence |
| R03 | Export CSV; export raw JSON | Exports are generated sample-model data, not every plotted series |
| R07 | Measure the one-instance 2 by 2 case; select per-panel instances and measure; repeat at another size | Observations depend on this machine and equivalent workloads |
| R04 | Inspect live instance count; change grid size | This is the separate-instance baseline |
| G10 | Inspect one-instance resources; switch to per-panel instances | Context observations are cumulative, not a live-memory counter |
| R05 | Run the example repeatedly; inspect live instance and chart-root counts | The existing automated suite supplies the 20-cycle evidence |
| R06 | Change sharing scopes repeatedly; inspect event/status output | Evaluate duplicate handling and unexpected target changes |
| R08 | Switch between 2D and 3D; use supported renderer changes; inspect chart roots | Canvas/WebGL compatibility and browser-managed cleanup remain relevant |

Primary control policies use these exact rules:

- All sharing elements declared by a source are primary unless explicitly narrowed below; deduplicate their enum keys with a Set. A declared fixed element and all `fixedCouplings` always remain visible. Mutation buttons use the same primary sharing elements, skipping fixed capabilities.
- Primary common controls are empty except: rows/columns for M04, M05, M08, C15, P12, R04, R07; renderer for R02/R08; viewMode for G08/R08; instanceModel for R07/G10.
- Primary actions: add/remove row/column for M08/C15/S10; regenerate for S10; enlarge/restore for C14/S09/G09; none elsewhere. D20 R05 uses the persistent Run button, not a new stress-loop feature.
- Narrow G06 to no primary sharing controls; G07 to fixed controls plus xRange/yRange; G05 to zRange/visualMap; S07 to seriesVisibility/symbolVisibility; P11 to legendSelection/visualMap plus fixed controls. Unsupported fields are removed by intersecting with the actual source declarations, never added to them.
- Primary utility panels: events for M07/C13/S08; state for R01; exports for M10/R02/R03; metrics for R04/G10/R05/R06/R08; metrics and measurement for R07. Other utilities remain in Technical details. Export controls themselves are source-specific: image for M10/R02, CSV/raw JSON for R03.
- Every omitted existing control is reachable through Advanced controls or Technical details. Rows/columns defaults and experiment data remain unchanged.

- [x] **Step 6: Run the catalog tests and TypeScript production build, then commit.**

```powershell
npm.cmd test -- tests/presentationCatalog.test.ts
npm.cmd run build
git add src/presentation/types.ts src/presentation/catalog.ts src/presentation/guides.ts tests/presentationCatalog.test.ts
git commit -m 'feat: define guided presentation catalog and teaching content'
```

Expected: catalog tests pass; no invalid control-policy references; build succeeds.


### Source behavior discovered during planning

The approved structure is unchanged, but source inspection found a teaching limitation: the 2D builder only adds ordinary scoped zoom when the source declares dataZoomX/dataZoomY, plus fixed profile zoom in compound cases. C14, C15, S01, S02, S09, and S10 do not declare ordinary zoom. Therefore their scripts use selection, enlargement, or resize and explicitly identify zoom-related acceptance as pending where relevant. D04 and D10/S06 remain the working routes for linked zoom. Do not add undocumented controls or silently claim the intended engineering capability is already available. Implementing missing chart behaviors is separate from this presentation feature.

This qualification refines the instructions to match actual behavior; it does not remove the approved lessons or promote a scorecard result. During final guide review, record any additional mismatch with the source as a visible limitation and an engineering follow-up.
## Task 2: Define navigation and URL contracts independently of the DOM

**Files:** Create `src/presentation/navigation.ts` and `tests/presentationNavigation.test.ts`.

**Consumes:** `LESSONS`, `CHAPTERS`, `EXAMPLES`, and `Selection`/`Resolution`.

**Produces:**

```ts
export function resolveLocation(search: string): Resolution;
export function selectionSearch(selection: Selection): string;
export function findLessonForExample(exampleId: string): Lesson | undefined;
export function filterLessons(query: string): readonly Lesson[];
export function adjacentLesson(lessonId: string, delta: -1 | 1): Lesson | undefined;
export function switchMode(selection: Selection, mode: PresentationMode): Resolution;
export function selectionForImport(selection: Selection, exampleId: string): Selection;
```

- [x] **Step 1: Write route, fallback, search, and transition tests.**

```ts
import { expect, it } from 'vitest';
import { resolveLocation, selectionSearch, filterLessons, adjacentLesson,
  switchMode, selectionForImport } from '../src/presentation/navigation';

it.each([
  ['', { mode: 'guided', lessonId: 'D01', exampleId: 'M02' }],
  ['?example=C06', { mode: 'engineering', exampleId: 'C06' }],
  ['?mode=engineering', { mode: 'engineering', exampleId: 'M01' }],
  ['?lesson=D04', { mode: 'guided', lessonId: 'D04', exampleId: 'C06' }],
  ['?lesson=D04&example=C07', { mode: 'guided', lessonId: 'D04', exampleId: 'C07' }],
  ['?lesson=D04&example=G01', { mode: 'guided', lessonId: 'D04', exampleId: 'C06' }],
  ['?lesson=missing&example=C07', { mode: 'guided', lessonId: 'D01', exampleId: 'M02' }],
  ['?example=missing', { mode: 'engineering', exampleId: 'M01' }]
])('resolves %s deterministically', (search, expected) => {
  expect(resolveLocation(search).selection).toEqual(expected);
});

it('normalizes guided links and explains incompatible variants', () => {
  const resolved = resolveLocation('?lesson=D04&example=P04');
  expect(resolved.notice).toMatch(/variant|example/i);
  expect(selectionSearch(resolved.selection)).toBe('?lesson=D04&example=C06');
});

it('searches source IDs, uses global adjacency, and handles boundaries', () => {
  expect(filterLessons('  c07 ').map(l => l.id)).toEqual(['D04']);
  expect(filterLessons('Understand spatial measurements')).toHaveLength(4);
  expect(filterLessons('no-such-lesson')).toEqual([]);
  expect(adjacentLesson('D04', 1)?.id).toBe('D05');
  expect(adjacentLesson('D01', -1)).toBeUndefined();
  expect(adjacentLesson('D20', 1)).toBeUndefined();
});

it('keeps source on mode switches and routes unrelated imports to engineering', () => {
  const current = { mode: 'guided', lessonId: 'D04', exampleId: 'C06' } as const;
  expect(switchMode(current, 'engineering').selection).toEqual({ mode: 'engineering', exampleId: 'C06' });
  expect(switchMode({ mode: 'engineering', exampleId: 'C07' }, 'guided').selection)
    .toEqual({ mode: 'guided', lessonId: 'D04', exampleId: 'C07' });
  expect(switchMode({ mode: 'engineering', exampleId: 'G01' }, 'guided').notice).toMatch(/reset/i);
  expect(selectionForImport(current, 'C07')).toEqual({ mode: 'guided', lessonId: 'D04', exampleId: 'C07' });
  expect(selectionForImport(current, 'R01')).toEqual({ mode: 'engineering', exampleId: 'R01' });
});
```

Also test empty `lesson=` and `example=` as invalid IDs, encoded unexpected text as harmless unknown IDs, round trips for every lesson/variant and engineering source, and unknown mode without an example as the normal guided default. A present lesson parameter takes precedence over `mode=engineering`; this removes ambiguity for conflicting URLs.

- [x] **Step 2: Run the focused test and observe the missing module.**

```powershell
npm.cmd test -- tests/presentationNavigation.test.ts
```

- [x] **Step 3: Implement pure resolution and serialization.**

```ts
import { EXAMPLES } from '../app/experimentRegistry';
import { CHAPTERS, LESSONS } from './catalog';
import type { Lesson, PresentationMode, Resolution, Selection } from './types';

function defaultGuided(): Selection {
  return { mode: 'guided', lessonId: LESSONS[0].id, exampleId: LESSONS[0].variants[0].exampleId };
}
export function resolveLocation(search: string): Resolution {
  const params = new URLSearchParams(search);
  const requested = params.get('example');
  if (params.has('lesson')) {
    const lesson = LESSONS.find(l => l.id === params.get('lesson'));
    if (!lesson) return { selection: defaultGuided(), notice: 'Unknown lesson. Opened the first lesson.' };
    const matched = lesson.variants.find(v => v.exampleId === requested);
    return {
      selection: { mode: 'guided', lessonId: lesson.id, exampleId: (matched ?? lesson.variants[0]).exampleId },
      ...(requested !== null && !matched ? { notice: 'That example is not a variant of this lesson. Opened its first variant.' } : {})
    };
  }
  if (params.has('example') || params.get('mode') === 'engineering') {
    const valid = EXAMPLES.some(e => e.id === requested);
    return {
      selection: { mode: 'engineering', exampleId: valid ? requested! : 'M01' },
      ...(requested !== null && !valid ? { notice: 'Unknown example. Opened M01.' } : {})
    };
  }
  return { selection: defaultGuided() };
}
export function selectionSearch(selection: Selection): string {
  const params = new URLSearchParams();
  if (selection.mode === 'guided') params.set('lesson', selection.lessonId);
  params.set('example', selection.exampleId);
  return `?${params}`;
}
export function findLessonForExample(exampleId: string): Lesson | undefined {
  return LESSONS.find(l => l.variants.some(v => v.exampleId === exampleId));
}
export function filterLessons(query: string): readonly Lesson[] {
  const text = query.trim().toLowerCase();
  return LESSONS.filter(l => [l.id, l.title, l.question,
    CHAPTERS.find(c => c.id === l.chapterId)?.title ?? '',
    ...l.variants.flatMap(v => [v.exampleId, v.label])].join(' ').toLowerCase().includes(text));
}
export function adjacentLesson(lessonId: string, delta: -1 | 1): Lesson | undefined {
  const index = LESSONS.findIndex(l => l.id === lessonId);
  return index < 0 ? undefined : LESSONS[index + delta];
}
export function switchMode(selection: Selection, mode: PresentationMode): Resolution {
  if (mode === selection.mode) return { selection };
  if (mode === 'engineering') return { selection: { mode, exampleId: selection.exampleId } };
  const lesson = findLessonForExample(selection.exampleId);
  return lesson
    ? { selection: { mode, lessonId: lesson.id, exampleId: selection.exampleId } }
    : { selection: defaultGuided(), notice: 'This appendix case has no guided lesson. Reset to the first lesson.' };
}
export function selectionForImport(selection: Selection, exampleId: string): Selection {
  const lesson = selection.mode === 'guided' ? LESSONS.find(l => l.id === selection.lessonId) : undefined;
  return lesson?.variants.some(v => v.exampleId === exampleId)
    ? { mode: 'guided', lessonId: lesson.id, exampleId }
    : { mode: 'engineering', exampleId };
}
```

These functions do not touch browser history or reset charts. Unknown snapshot IDs are rejected by the caller before `selectionForImport`.

- [x] **Step 4: Run the tests and commit the pure navigation module.**

```powershell
npm.cmd test -- tests/presentationNavigation.test.ts tests/presentationCatalog.test.ts
git add src/presentation/navigation.ts tests/presentationNavigation.test.ts
git commit -m 'feat: define guided and engineering navigation contracts'
```

## Task 3: Make initialization race-safe and preserve imported state

**Files:** Create `src/core/latestRequest.ts`, `tests/latestRequest.test.ts`; modify `src/main.ts` (`initializeCharts`, `selectExample`, GL loading, run/error entry points), `src/sharing/optionState.ts`, and `tests/foundationState.test.ts`.

**Consumes:** Existing `createDefaultSnapshot`, `getExample`, `AppStateSnapshot`, chart initialization and disposal functions.

**Produces:** `LatestRequest.begin(): number`, `LatestRequest.isCurrent(token: number): boolean`; `prepareSnapshot(exampleId: string, imported?: AppStateSnapshot): AppStateSnapshot`; initialization that cannot commit stale work. These are the only lifecycle refactors required before presentation integration.

- [x] **Step 1: Add failing tests for stale requests and imported state.**

```ts
// tests/latestRequest.test.ts
import { expect, it } from 'vitest';
import { LatestRequest } from '../src/core/latestRequest';
it('invalidates a delayed request without invalidating its successor', async () => {
  const guard = new LatestRequest();
  const first = guard.begin();
  let release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  const committed: number[] = [];
  const pending = delayed.then(() => { if (guard.isCurrent(first)) committed.push(first); });
  const second = guard.begin();
  if (guard.isCurrent(second)) committed.push(second);
  release();
  await pending;
  expect(committed).toEqual([second]);
});
```

```ts
// Add to tests/foundationState.test.ts with existing imports deduplicated.
import { createDefaultSnapshot, prepareSnapshot } from '../src/sharing/optionState';
it('applies defaults only to fresh P12 and 3D examples', () => {
  expect(prepareSnapshot('P12')).toMatchObject({ rows: 3, columns: 2 });
  const imported = createDefaultSnapshot('P12', 42);
  imported.rows = 1;
  imported.columns = 3;
  expect(prepareSnapshot('P12', imported)).toEqual(imported);
  const mixed = createDefaultSnapshot('G08', 42);
  mixed.interactive.viewMode = { 'row-0:column-0': '2d', 'row-0:column-1': '3d' };
  expect(prepareSnapshot('G08', mixed)).toEqual(mixed);
  expect(prepareSnapshot('G08').interactive.viewMode['row-0:column-0']).toBe('3d');
});
it('does not alias or mutate imported snapshots', () => {
  const imported = createDefaultSnapshot('G08', 42);
  const prepared = prepareSnapshot('G08', imported);
  prepared.interactive.viewMode['row-0:column-0'] = '2d';
  expect(imported.interactive.viewMode).toEqual({});
});
```

- [x] **Step 2: Run these tests to confirm missing implementations.**

```powershell
npm.cmd test -- tests/latestRequest.test.ts tests/foundationState.test.ts
```

- [x] **Step 3: Add guard and snapshot preparation, then adopt them in main.**

```ts
// src/core/latestRequest.ts
export class LatestRequest {
  private generation = 0;
  begin(): number { return ++this.generation; }
  isCurrent(token: number): boolean { return token === this.generation; }
}
```

```ts
// src/sharing/optionState.ts: add imports for getExample and createCells.
export function prepareSnapshot(exampleId: string, imported?: AppStateSnapshot): AppStateSnapshot {
  const example = getExample(exampleId);
  if (imported) {
    if (imported.exampleId !== exampleId) throw new Error('Snapshot example does not match requested example');
    return structuredClone(imported);
  }
  const state = createDefaultSnapshot(exampleId, 20260914);
  if (exampleId === 'P12') { state.rows = 3; state.columns = 2; }
  if (example.family === 'three-dimensional') {
    for (const cell of createCells(state.rows, state.columns)) state.interactive.viewMode[cell.id] = '3d';
  }
  return state;
}
```

Replace the default/import handling at the beginning of existing `selectExample` with `prepareSnapshot`, removing the unconditional P12 and 3D overrides. Replace asynchronous initialization with a guarded try/catch/finally around its existing synchronous chart-building body:

```ts
const initializationRequests = new LatestRequest();
// At the start of initializeCharts:
const request = initializationRequests.begin();
try {
  // Dispose before awaiting, so a newer request never gets disposed by this one later.
  disposeCharts();
  if (wantsThreeDimensions()) await ensureGlLoaded();
  if (!initializationRequests.isCurrent(request)) return;
  // Existing synchronous cells/chart construction, bindChartEvents, applyOption,
  // status, classification, and timing updates remain here without additional awaits.
  requestAnimationFrame(() => {
    if (initializationRequests.isCurrent(request)) updateMetrics();
  });
} catch (error) {
  if (!initializationRequests.isCurrent(request)) return;
  disposeCharts();
  elements.chartStatus.classList.add('is-error');
  elements.chartStatus.textContent = error instanceof Error ? error.message : String(error);
}
```

Move the existing body into the indicated guarded region; do not leave a second unguarded `requestAnimationFrame(updateMetrics)`. No asynchronous operation may dispose charts or update selection metadata after an await without checking the generation. Set `glLoaded` only after successful import. Invalidate pending requests on `pagehide`. Keep Run/renderer/dimension changes routed through the same guard. Later mode-only changes must not invalidate a chart load unless they actually change the source.

- [x] **Step 4: Run unit tests and existing browser coverage for imports and GL before committing.**

```powershell
npm.cmd test
npm.cmd run test:e2e -- tests/e2e/application.spec.ts
npm.cmd run build
git add src/core/latestRequest.ts src/sharing/optionState.ts src/main.ts tests/latestRequest.test.ts tests/foundationState.test.ts
git commit -m 'fix: preserve imported chart state and ignore stale initialization'
```

Expected: existing 66 source routes still load, imported values remain intact, and unit tests pass. The browser-level delayed-GL regression is added in Task 5 when lesson switching exists.

## Task 4: Render the guided shell and wire basic lesson selection

**Files:** Create `src/presentation/view.ts` and `tests/e2e/presentation.spec.ts`; modify `index.html`, `src/style.css`, and `src/main.ts` (navigation, labels, metadata, control-render hooks).

**Consumes:** All Task 1 types/catalog, Task 2 routing functions, the existing `renderNavigation` implementation and DOM control containers.

**Produces:** A single presentation view with this interface; a central `navigate` function in main. The view never initializes or disposes ECharts.

```ts
// Export from src/presentation/view.ts.
import type { PresentationMode, Selection } from './types';
export interface PresentationCallbacks {
  select(selection: Selection): void;
  mode(mode: PresentationMode): void;
  search(query: string): void;
  renderEngineeringNavigation(query: string): void;
}
export interface PresentationView {
  render(selection: Selection, query: string, notice?: string): void;
  arrangeControls(selection: Selection): void;
}
export function createPresentationView(callbacks: PresentationCallbacks): PresentationView;
```

- [x] **Step 1: Add failing browser tests for guided entry, variant rendering, and engineering compatibility.**

```ts
import { expect, test } from '@playwright/test';
import { LESSONS } from '../../src/presentation/catalog';

test('starts with twenty guided lessons and opens source-specific variants', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('lesson-button')).toHaveCount(20);
  await expect(page.getByTestId('lesson-id')).toHaveText('D01');
  await expect(page.getByTestId('example-id')).toHaveText('M02');
  await page.getByTestId('lesson-button').filter({ hasText: 'D04' }).click();
  await page.getByLabel('Lesson variant').selectOption('C07');
  await expect(page).toHaveURL(/lesson=D04&example=C07/);
  await expect(page.locator('#guide-steps li')).toHaveCount(3);
  await expect(page.getByLabel('Y linked zoom scope')).toBeVisible();
  await expect(page.getByLabel('X linked zoom scope')).toHaveCount(0);
  await expect(page.locator('#guide-limitation')).not.toBeEmpty();
  await expect(page.getByTestId('live-instances')).toHaveText('1');
});

test('retains the existing engineering entry point and labels', async ({ page }) => {
  await page.goto('/?example=C06');
  await expect(page.getByTestId('example-button')).toHaveCount(66);
  await expect(page.getByTestId('lesson-button')).toHaveCount(0);
  await expect(page.getByLabel('X dataZoom scope')).toBeVisible();
  await expect(page.locator('#lesson-guide')).toBeHidden();
});

test('opens every guided lesson with the correct default source', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const lesson of LESSONS) {
    await page.goto(`/?lesson=${lesson.id}`);
    await expect(page.getByTestId('lesson-id')).toHaveText(lesson.id);
    await expect(page.getByTestId('example-id')).toHaveText(lesson.variants[0].exampleId);
    await expect(page.locator('#chart-status')).toContainText(`${lesson.variants[0].exampleId} running`);
    await expect(page.locator('#guide-expected')).not.toBeEmpty();
    await expect(page.locator('#guide-status')).toContainText('acceptance review pending');
  }
  expect(errors).toEqual([]);
});
```

- [x] **Step 2: Run the focused browser suite and observe missing guided controls.**

```powershell
npm.cmd run test:e2e -- tests/e2e/presentation.spec.ts
```

- [x] **Step 3: Add semantic guide markup while retaining current chart/control IDs.**

Insert a mode selector in the header and a guide before the control panel:

```html
<label class="presentation-mode">Catalog view
  <select id="presentation-mode">
    <option value="guided">Guided presentation</option>
    <option value="engineering">Engineering catalog</option>
  </select>
</label>
<section id="lesson-guide" class="card lesson-guide" aria-label="Lesson guide" hidden>
  <div class="lesson-navigation">
    <span data-testid="lesson-id"></span>
    <button id="previous-lesson" type="button" class="button">Previous lesson</button>
    <button id="next-lesson" type="button" class="button">Next lesson</button>
  </div>
  <label>Lesson variant <select id="lesson-variant"></select></label>
  <p id="variant-position"></p>
  <p>Changing lessons or variants resets the chart. Export state to save an investigation.</p>
  <ol id="guide-steps"></ol>
  <h3>Expected observation</h3><p id="guide-expected"></p>
  <p id="guide-status">Implemented for evaluation - acceptance review pending.</p>
  <p id="guide-limitation"></p>
  <details><summary>How sharing scopes work</summary>
    <p>Individual changes the selected panel. Per row changes its row. Per column changes its column. All cells changes every panel.</p>
  </details>
</section>
<p id="navigation-notice" role="status" aria-live="polite" hidden></p>
<div id="guided-utilities"></div>
<details id="technical-details" class="card">
  <summary>Technical details</summary>
  <div id="technical-content"></div>
</details>
```

Place `#guided-utilities` and `#technical-details` after the chart. Move the existing state panel, metric/result/event/measurement cards, version stack, and source-ID badge as DOM nodes between their engineering positions and these guided containers. Preserve their original parents/sibling anchors in `createPresentationView` so engineering mode restores them in order. Do not duplicate markup or listeners. Keep the current `#classification` and all test IDs; guided `#guide-status` is a separate explanation, not a replacement verdict. The capability-result card containing option exports stays in technical details; place its existing export buttons into the primary exports area only when relevant.

Give the catalog heading an ID and update it to `20 lessons` or `66 examples`. Add an appendix disclosure with eight engineering links and their reasons below the guided lesson list. Empty search results display `No lessons match this search.` Count only lessons in guided mode. Main heading/title/question show lesson text in guided mode; active engineering source ID appears in technical details.

- [x] **Step 4: Implement the view using native DOM APIs and callbacks.**

In `createPresentationView`, obtain required elements once, register listeners once, and retain the current rendered `Selection` for callbacks. Use `textContent` for all strings. Each guided navigation button has `data-testid="lesson-button"`, `data-lesson-id`, wrapped ID/title spans, and `aria-current="page"` only when active. Group by `CHAPTERS` order, omit empty groups after filtering, and keep previous/next based on the complete `LESSONS` array.

The rendering core uses this pattern:

```ts
// Inside render, after resolving the active lesson and variant from selection:
const steps = document.getElementById('guide-steps')!;
steps.replaceChildren(...variant.steps.map(text => {
  const item = document.createElement('li');
  item.textContent = text;
  return item;
}));
document.getElementById('guide-expected')!.textContent = variant.expected;
document.getElementById('guide-limitation')!.textContent = variant.limitation;
const select = document.getElementById('lesson-variant') as HTMLSelectElement;
select.replaceChildren(...lesson.variants.map((entry, index) => {
  const option = document.createElement('option');
  option.value = entry.exampleId;
  option.textContent = `${index + 1}. ${entry.label}`;
  return option;
}));
select.value = variant.exampleId;
```

On variant change, call `callbacks.select({ mode: 'guided', lessonId, exampleId: select.value })`; on previous/next, call it with the adjacent lesson's first source. Appendix links call it with engineering selection. Mode/search callbacks delegate to main. Engineering rendering calls `callbacks.renderEngineeringNavigation(query)` and restores all existing technical labels and primary containers.

`arrangeControls` operates on the existing controls after each render. Use a helper that keeps delegated events inside their original ancestor:

```ts
function placeInDisclosure(container: HTMLElement, isPrimary: (element: HTMLElement) => boolean,
  summaryText: string): void {
  const prior = container.querySelector<HTMLDetailsElement>(':scope > details');
  const all = Array.from(container.children).flatMap(child => child === prior
    ? Array.from(prior.querySelector<HTMLElement>(':scope > .advanced-content')!.children)
    : [child]).filter((child): child is HTMLElement => child instanceof HTMLElement);
  const disclosure = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = summaryText;
  const content = document.createElement('div');
  content.className = 'advanced-content';
  disclosure.append(summary, content);
  container.replaceChildren();
  for (const child of all) (isPrimary(child) ? container : content).append(child);
  if (content.childElementCount) container.append(disclosure);
}
```

Common fields are selected using their child's `data-common`, sharing fields by `data-sharing-element`, mutation buttons by `data-mutate-element`, and action buttons by `data-action`. Always keep disabled fixed-coupling fields primary. Use `Advanced chart settings`, `Advanced sharing controls`, and `Advanced actions` as distinct disclosure labels. Keep these disclosures within `common-controls`, `sharing-controls`, and `action-controls` respectively so existing delegated listeners still receive events. In engineering mode rebuild the original controls without disclosures. Do not remove unsupported controls from the source registry.

Move utility panels using the retained node anchors, not cloned HTML. Raw option snapshots stay technical even when customer exports are primary. Render source-specific expected/limitation text next to primary controls, with technical status always reachable. The existing ResizeObserver handles container-size changes; disclosure toggle can additionally schedule `chart.resize()` through a callback in main if visual checks show a missed layout update, never `echarts.init`.

- [x] **Step 5: Integrate main with one selection function.**

Rename the existing `renderNavigation` to `renderEngineeringNavigation`, and retain its exact engineering behavior. Store one `selection: Selection`, `navigationNotice: string | undefined`, and `searchByMode: Record<PresentationMode, string>` in main. Do not add a second chart-state store. Rename `ELEMENT_LABELS` to `ENGINEERING_ELEMENT_LABELS` and derive guided text with overrides:

```ts
const GUIDED_ELEMENT_LABELS = {
  ...ENGINEERING_ELEMENT_LABELS,
  dataZoomX: 'X linked zoom', dataZoomY: 'Y linked zoom', visualMap: 'Color scale',
  symbolVisibility: 'Point-symbol visibility',
  topYRange: 'Top profile value range', rightXRange: 'Side profile value range'
};
```

Use the mode-specific labels when rendering fields, mutation buttons, and sharing summaries. Stored enum keys and engineering labels are unchanged. After `renderCommonControls`, `renderSharingControls`, and `renderActionControls`, call `view.arrangeControls(selection)`.

Create this coordinator, with `view` from `createPresentationView` and `searchByMode` initialized to empty strings:

```ts
type NavigateOptions = {
  history: 'push' | 'replace' | 'none';
  preserve?: boolean;
  imported?: AppStateSnapshot;
};
async function navigate(resolution: Resolution, options: NavigateOptions): Promise<void> {
  // Validate before committing metadata or history; imported snapshots are parsed before this call.
  getExample(resolution.selection.exampleId);
  const retain = options.preserve === true &&
    currentExample?.id === resolution.selection.exampleId && !options.imported;
  selection = resolution.selection;
  navigationNotice = resolution.notice;
  const url = `${location.pathname}${selectionSearch(selection)}${location.hash}`;
  if (options.history === 'push') history.pushState(null, '', url);
  else if (options.history === 'replace') history.replaceState(null, '', url);
  elements.search.value = searchByMode[selection.mode];
  if (retain) {
    renderExampleMetadata();
    renderCommonControls();
    renderSharingControls();
    renderActionControls();
    view.render(selection, elements.search.value, navigationNotice);
    view.arrangeControls(selection);
    return;
  }
  await selectExample(selection.exampleId, options.imported);
}
```

Remove URL mutation from `selectExample`; before its `await initializeCharts()`, render current engineering metadata/controls, then `view.render` and `view.arrangeControls`. It must not change guide metadata after the await. Replace the old initial `requestedExample` logic with `navigate(resolveLocation(location.search), { history: 'replace' })`.

View callbacks call `navigate` for source/lesson changes. Mode callback first calls `captureAllChartState()`, resolves `switchMode`, and passes `{ history: 'push', preserve: true }`. Existing engineering list click handling calls `navigate` with engineering selection; guided buttons use different `data-lesson-id` so the old listener does not select twice. Replace the old search listener with one that updates `searchByMode` and calls only `view.render`, never `selectExample`.

- [x] **Step 6: Add minimal responsive styles and run the new and existing browser tests.**

```css
[hidden] { display: none !important; }
.lesson-guide { padding: 18px; }
.lesson-guide p, .lesson-guide li { line-height: 1.55; }
.lesson-navigation { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.lesson-guide select { max-width: 100%; }
.example-button .label { white-space: normal; overflow-wrap: anywhere; }
.advanced-content { display: grid; gap: 10px; padding-top: 10px; }
.control-grid > details { grid-column: 1 / -1; }
body[data-presentation-mode='guided'] .workspace { grid-template-columns: 270px minmax(0, 1fr); }
body[data-presentation-mode='guided'] .result-panel { display: none; }
#technical-details { padding: 16px; }
#technical-content, #guided-utilities { display: grid; gap: 12px; }
@media (max-width: 1000px) {
  body[data-presentation-mode='guided'] .workspace { grid-template-columns: minmax(0, 1fr); }
  body[data-presentation-mode='guided'] .example-browser { position: static; max-height: none; }
  body[data-presentation-mode='guided'] .example-list { max-height: 280px; }
}
```

Set `document.body.dataset.presentationMode` in view render. Preserve existing chart scrolling rules and engineering breakpoints, and refine these styles after Task 6 screenshot review.

```powershell
npm.cmd run test:e2e -- tests/e2e/presentation.spec.ts tests/e2e/application.spec.ts
npm.cmd run build
git add src/presentation/view.ts src/main.ts index.html src/style.css tests/e2e/presentation.spec.ts
git commit -m 'feat: add guided lesson navigation and contextual controls'
```

## Task 5: Complete history, reset, import, and rapid-navigation behavior

**Files:** Modify `src/main.ts`, `src/presentation/view.ts` only as needed for coordination, and `tests/e2e/presentation.spec.ts`.

**Consumes:** Task 4 `navigate`, Task 2 route helpers, Task 3 initialization guard, existing `window.__matrixPoc.getSnapshot()` and `getOption()` browser test hooks.

**Produces:** All entry points use the same navigation/state policy; back/forward and mode switches cannot desynchronize guide and chart.

- [x] **Step 1: Add failing browser tests for search/history/reset.**

```ts
test('search preserves chart state and history changes reset source state', async ({ page }) => {
  await page.goto('/?lesson=D04&example=C06');
  await page.getByLabel('X linked zoom scope').selectOption('row');
  await page.getByRole('button', { name: 'Change X linked zoom', exact: true }).click();
  const before = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  await page.locator('#example-search').fill('no-such-lesson');
  await expect(page.getByText('No lessons match this search.')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).toEqual(before);
  await page.getByRole('button', { name: 'Next lesson', exact: true }).click();
  await expect(page).toHaveURL(/lesson=D05&example=C09/);
  await page.goBack();
  await expect(page).toHaveURL(/lesson=D04&example=C06/);
  await expect(page.getByLabel('X linked zoom scope')).toHaveValue('individual');
  await page.goForward();
  await expect(page.getByTestId('lesson-id')).toHaveText('D05');
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  await expect(page.getByTestId('lesson-id')).toHaveText('D05');
});

test('mode-only switches preserve interaction state and independent search text', async ({ page }) => {
  await page.goto('/?lesson=D04&example=C06');
  await page.getByLabel('X linked zoom scope').selectOption('column');
  await page.getByRole('button', { name: 'Change X linked zoom', exact: true }).click();
  await page.locator('#example-search').fill('zoom');
  const before = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  const initCount = await page.getByTestId('init-count').textContent();
  await page.getByLabel('Catalog view').selectOption('engineering');
  await expect(page.locator('#example-search')).toHaveValue('');
  await expect(page.getByLabel('X dataZoom scope')).toHaveValue('column');
  await page.locator('#example-search').fill('C06');
  await page.getByLabel('Catalog view').selectOption('guided');
  await expect(page.locator('#example-search')).toHaveValue('zoom');
  expect(await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).toEqual(before);
  await expect(page.getByTestId('init-count')).toHaveText(initCount!);
});
```

- [x] **Step 2: Add import and asynchronous failure tests.**

Use the existing snapshot test hook to prepare real valid version-1 fixtures. Open Technical details to reach snapshot controls outside D18. Test these four concrete cases:

```ts
test('imports preserve P12 dimensions and invalid imports preserve the active route', async ({ page }) => {
  await page.goto('/?lesson=D13&example=P12');
  const imported = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  imported.rows = 1;
  imported.columns = 3;
  await page.locator('#technical-details > summary').click();
  await page.getByLabel('State snapshot JSON').fill(JSON.stringify(imported));
  await page.getByRole('button', { name: 'Import state', exact: true }).click();
  await expect(page.getByTestId('lesson-id')).toHaveText('D13');
  await expect.poll(async () => (await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).rows).toBe(1);
  const activeUrl = page.url();
  const before = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  await page.getByLabel('State snapshot JSON').fill('{');
  await page.getByRole('button', { name: 'Import state', exact: true }).click();
  await expect(page.locator('#chart-status')).toHaveClass(/is-error/);
  expect(page.url()).toBe(activeUrl);
  expect(await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).toEqual(before);
});
```

Add one test that imports C07 into guided D04/C06 and stays in D04, then imports R01 and opens engineering R01. Create fixtures by `createDefaultSnapshot` imported directly into the Playwright test process. Add one test importing G08 with mixed view modes and verify the snapshot after render still contains the exact 2D/3D map. Compare selected dimensions/view modes rather than the entire post-render snapshot because chart capture can populate additional defaults.

For delayed GL, intercept the real lazy-loaded module after first opening the 2D default. The matching request contains `echarts-gl`; the production build is not used by this dev-server test.

```ts
test('the newest lesson wins when a prior GL module request completes late', async ({ page }) => {
  await page.goto('/');
  let release!: () => void;
  let requested!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const observed = new Promise<void>(resolve => { requested = resolve; });
  await page.route('**/*echarts-gl*', async route => {
    requested();
    await gate;
    await route.continue();
  });
  const glResponse = page.waitForResponse(response => response.url().includes('echarts-gl'));
  await page.getByTestId('lesson-button').filter({ hasText: 'D14' }).click();
  await observed;
  await page.getByTestId('lesson-button').filter({ hasText: 'D01' }).click();
  release();
  await (await glResponse).finished();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#chart-status')).toContainText('M02 running');
  await expect(page.getByTestId('lesson-id')).toHaveText('D01');
  await expect(page).toHaveURL(/lesson=D01&example=M02/);
  await expect(page.getByTestId('live-instances')).toHaveText('1');
  await expect(page.locator('#experiment-chart canvas')).toHaveCount(1);
});
```

Add a fresh-page test aborting that request, expect a visible error, then select D01 and expect successful M02 rendering without an unhandled page error. When investigating interception issues, inspect Playwright request URLs; do not replace the test with a timing-only sleep.

- [x] **Step 3: Run the focused tests and observe the missing history/import behavior.**

```powershell
npm.cmd run test:e2e -- tests/e2e/presentation.spec.ts
```

- [x] **Step 4: Centralize remaining entry points and preserve valid state.**

```ts
window.addEventListener('popstate', () => {
  void navigate(resolveLocation(location.search), { history: 'none' });
});
requireElement<HTMLButtonElement>('reset-example').addEventListener('click', () => {
  void navigate({ selection }, { history: 'replace' });
});
```

Replace, rather than add alongside, the old reset listener. Keep Run routed to guarded `initializeCharts` without modifying URL or lesson. Replace the existing import handler:

```ts
requireElement<HTMLButtonElement>('import-state').addEventListener('click', async () => {
  try {
    const imported = parseSnapshot(elements.stateJson.value);
    getExample(imported.exampleId);
    const next = selectionForImport(selection, imported.exampleId);
    await navigate({ selection: next }, { history: 'push', imported });
  } catch (error) {
    elements.chartStatus.classList.add('is-error');
    elements.chartStatus.textContent = error instanceof Error ? error.message : String(error);
  }
});
```

Parse and resolve before changing selection or browser history. Do not clear the snapshot textarea on reset; D18 needs to import its saved text. Preserve disclosure open state during a same-lesson import so the next action is reachable. Render notices for invalid URLs and appendix-to-guided reset via `#navigation-notice`; use textContent and toggle `hidden`. Recheck stale-load errors and initialization ownership; Task 3's guard must cover every call path introduced by the view.

- [x] **Step 5: Verify the complete guided and engineering interaction suites and commit.**

```powershell
npm.cmd test
npm.cmd run test:e2e -- tests/e2e/presentation.spec.ts tests/e2e/application.spec.ts
npm.cmd run build
git add src/main.ts src/presentation/view.ts tests/e2e/presentation.spec.ts
git commit -m 'feat: preserve presentation context through history and state restoration'
```

## Task 6: Verify customer workflows, inspect layout, and document delivery

**Files:** Extend `tests/e2e/presentation.spec.ts`; create `tests/e2e/presentationEvidence.spec.ts`; update `README.md`; adjust `src/presentation/guides.ts`, `src/presentation/view.ts`, and `src/style.css` only for failures found by these checks. Store new screenshots in `evidence/presentation/`.

**Consumes:** Complete guided UI, existing chart test hooks, Playwright screenshots, all earlier test suites.

**Produces:** Verified scope/visibility/fixed-coupling/export behavior from guided controls, reviewed wide/constrained layouts, documented links and limitations.

- [x] **Step 1: Add tests for meaningful guided interactions and control availability.**

```ts
test('guided row zoom changes only the selected row', async ({ page }) => {
  await page.goto('/?lesson=D04&example=C06');
  await page.getByLabel('X linked zoom scope').selectOption('row');
  await page.getByRole('button', { name: 'Change X linked zoom', exact: true }).click();
  const snapshot = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  expect(snapshot.interactive.dataZoom['row-0:column-0/x']).toEqual({ start: 20, end: 80 });
  expect(snapshot.interactive.dataZoom['row-0:column-1/x']).toEqual({ start: 20, end: 80 });
  expect(snapshot.interactive.dataZoom['row-1:column-0/x']).toEqual({ start: 0, end: 100 });
});

test('point-symbol changes keep the line and fixed coupling stays visible', async ({ page }) => {
  await page.goto('/?lesson=D05&example=C11');
  await page.getByRole('button', { name: 'Change Point-symbol visibility', exact: true }).click();
  const option = await page.evaluate(() => (window as any).__matrixPoc.getOption());
  const lines = option.series.filter((series: any) => series.type === 'line');
  expect(lines.length).toBeGreaterThan(0);
  expect(lines.some((series: any) => series.showSymbol === false && series.data.length > 0)).toBe(true);
  await page.goto('/?lesson=D11&example=P04');
  await expect(page.getByLabel('X range scope')).toBeVisible();
  await expect(page.getByLabel('X range scope')).toBeDisabled();
  await expect(page.getByLabel('Y linked zoom scope')).toBeDisabled();
});

test('customer exports are reachable without technical details', async ({ page }) => {
  await page.goto('/?lesson=D19&example=M10');
  await expect(page.locator('#technical-details')).not.toHaveAttribute('open', '');
  const image = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export image', exact: true }).click();
  expect((await image).suggestedFilename()).toMatch(/\.png$/);
  await page.getByLabel('Lesson variant').selectOption('R03');
  await expect(page.locator('#guide-limitation')).toContainText('sample');
  const csv = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  expect((await csv).suggestedFilename()).toMatch(/\.csv$/);
});
```

Add a test that opening/closing Advanced chart settings neither changes `init-count` nor removes controls; change an advanced seed to prove delegated listeners still operate after relocation. In a guided D04 variant, close the advanced disclosure, tab through the top controls, and assert focus never reaches its renderer/seed descendants. Search for each of the 58 source IDs and assert exactly its parent lesson is shown. Exercise at least one non-default variant in every chapter (C07, S05, P03, G05, R03, G10). Check that `#classification` always stays Inconclusive when technical details are open.

- [x] **Step 2: Add screenshots and dimension checks in a separate evidence test.**

```ts
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('captures guided layouts at wide and constrained sizes', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir('evidence/presentation', { recursive: true });
  const cases = [
    ['D04', 'C06'], ['D08', 'S05'], ['D11', 'P04'],
    ['D14', 'G02'], ['D18', 'R01'], ['D20', 'R07']
  ];
  for (const width of [1440, 900]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [lessonId, exampleId] of cases) {
      await page.goto(`/?lesson=${lessonId}&example=${exampleId}`);
      await expect(page.locator('#chart-status')).toContainText(`${exampleId} running`);
      await expect(page.locator('#guide-steps')).toBeVisible();
      const host = await page.locator('#experiment-chart').boundingBox();
      expect(host!.height).toBeGreaterThanOrEqual(500);
      await page.screenshot({ path: `evidence/presentation/${lessonId}-${width}.png`, fullPage: true });
    }
  }
});
```

At 390px add a smoke check for usable mode/variant selectors and horizontal chart scrolling, without requiring a desktop chart to shrink to phone width. Take an additional screenshot with Technical details open and one with Advanced controls open at 900px. The details node must remain within the page content width; overflow inside the chart is acceptable.

- [x] **Step 3: Run new checks, fix observed UI failures, and inspect screenshots.**

```powershell
npm.cmd run test:e2e -- tests/e2e/presentation.spec.ts tests/e2e/presentationEvidence.spec.ts
```

Open the generated images with the available image-viewing tool. Inspect all 12 chapter/viewport images plus the two disclosure states. Confirm readable wrapped titles, unclipped step text, distinguishable chapter/variant labels, adequate chart area, and accessible primary actions. Correct concrete defects in CSS/view code and rerun only affected screenshot cases before the final full run. If the image-viewing tool is unavailable, report the visual review as pending; DOM dimensions alone do not prove a visual pass.

Use this specific class when narrow screens need chart-only scrolling:

```css
body[data-presentation-mode='guided'] .chart-card { overflow-x: auto; }
@media (max-width: 600px) {
  body[data-presentation-mode='guided'] #experiment-chart { min-width: 520px; }
  .lesson-guide select, .presentation-mode select { width: 100%; }
}
```

Do not update native-capacity scorecard verdicts after these presentation checks. Rendering and domain acceptance still require their own evidence.

- [x] **Step 4: Document the two entry points, reset semantics, and evidence policy.**

Add the following README section near Run:

```markdown
## Presentation and engineering views

Open the app without a query string for 20 guided lessons in six chapters.
Each lesson contains selectable variants backed by the original engineering examples.

- `/?lesson=D04&example=C06` opens the X zoom variant of the linked-zoom lesson.
- `/?example=C06` opens the original engineering example and full controls.
- `/?mode=engineering` opens the 66-example engineering catalog.

Changing lessons or variants resets the chart. Switching catalog views for the
same source preserves the active investigation. Browser back/forward restores
the selected lesson/source with its default chart state, not a historical zoom.
Use Export state and Import state to save and restore an investigation.

Advanced controls and Technical details retain the original settings, metrics,
and source IDs. Eight implementation-focused cases are linked from the technical
appendix. Guided screenshots are in `evidence/presentation/`.

Guides distinguish expected observations from verified results. Capability
classifications remain provisional. CSV/JSON exports use the generated sample
data model; camera actions do not establish drag synchronization; timing results
are specific to the tested machine and workload.
```

- [x] **Step 5: Run final verification and isolate generated evidence changes.**

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Check each command's exit code before running the next. The full engineering evidence suite regenerates tracked option snapshots and R07 measurements. Before the run, record clean/dirty paths. Afterward preserve user changes; revert only newly generated changes to pre-existing `evidence/options`, `evidence/measurements`, and `evidence/screenshots` that were clean before the run and are unrelated to this feature. Do not revert `evidence/presentation`. Never use a repository-wide hard reset or clean.

Review staged file scope, run `git diff --check`, confirm no dependency changes and no changed engineering IDs, then commit:

```powershell
git add src/presentation src/main.ts src/style.css index.html README.md tests/e2e/presentation.spec.ts tests/e2e/presentationEvidence.spec.ts evidence/presentation
git diff --cached --check
git commit -m 'test: verify guided workflows and document customer presentation'
```

Report unit/browser test totals from the actual output, build status, screenshot-review status, and the active implementation folder/branch. Use the required review and branch-completion skills before integration. Do not describe catalog completion as proving native support for all chart capabilities.

## Requirement coverage and self-review

| Spec area | Implementation and verification |
| --- | --- |
| Audience, 20 lessons, six chapters, complete 66-case coverage | Task 1 metadata, exact mapping, and catalog integrity tests |
| Source-specific instruction, expectations, limitations | Task 1 scripts and control policies; Task 6 manual/script audit |
| Appendix and engineering compatibility | Tasks 1, 2, and 4; existing 66-route browser suite |
| URL defaults, validation, search, adjacency | Task 2 pure tests and Task 4 shell |
| Browser history, reset, mode state, separate searches | Task 5 browser tests |
| Imported dimensions, view modes, invalid snapshots | Tasks 3 and 5 |
| Delayed GL, failure recovery, disposal | Tasks 3 and 5 guard and intercepted-request tests |
| Primary/advanced controls, fixed coupling, accessible DOM | Tasks 4 and 6 |
| Save/export/metrics lesson-specific layouts | Task 4 policies and Task 6 workflow checks |
| Responsive layout and visual evidence | Task 6 screenshots and manual review |
| Provisional classifications and existing evidence | Tasks 1, 4, and 6 |
| No dependencies, unchanged snapshots/IDs | Task 3 preservation and Task 6 final diff/build review |

## Handoff

Recommend **Native execution**: implement these six dependent tasks in this session, followed by the workflow's independent final review. The tasks share navigation and lifecycle contracts, so keeping implementation context together is useful. Subagent-driven execution is also available if the user prefers task-by-task independent implementation and review.

This plan is ready for user review. Product implementation starts after the user confirms the plan and selects the execution approach, as required by the Superpowers writing-plans handoff.
