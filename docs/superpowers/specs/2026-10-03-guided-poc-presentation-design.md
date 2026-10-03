# Guided PoC Presentation Design

Date: 2026-10-03
Status: Proposed written specification; customer-facing structure approved in conversation

## Purpose and audience

Provide a guided catalog of 20 focused examples in six chapters for technical customers who do not specialize in front-end development. Clarity is the priority, not minimizing the example count. Retain the existing 66 engineering routes and evidence for investigation.

The PoC asks whether a coordinated workspace of 2D and 3D charts can preserve required interactions while reducing separate chart instances, and where native functionality, application wiring, or limitations affect that decision.

## Agreed scope

- Exactly 20 guided lessons, with stable IDs D01 through D20 and the mapping below.
- Six chapters, ordered from basic comparison to architectural evidence.
- Every lesson explains its question, actions, expected observations, and evidence limitations.
- Selectable variants reuse existing engineering examples. A lesson is not a new chart family or a union of every source example's capabilities.
- Preserve all 66 existing IDs and direct links; preserve the scorecard's provisional classifications.
- Default fresh visits to the guided presentation; existing example links continue to open the engineering catalog.
- Prefer a 2 by 2 starting layout, retaining the existing 3 by 2 special case for P12.
- No new dependencies, backend, chart family, performance claim, or scorecard promotion.

## Approach decision

Use a guided presentation layer over the current registry and chart lifecycle. Grouped navigation alone would not explain actions or outcomes. Replacing the engineering registry with 20 combined chart builders would mix capabilities, lose reproducible cases, and expand scope. The guided layer provides the approved grouping while leaving each experiment independently runnable.

## Catalog and teaching content

Each row defines a lesson. Source IDs are the selectable variants, in the stated order; the first ID is the default. Each variant receives a concise descriptive label, two or three source-specific actions, expected observations, and a limitation. Instructions must describe controls actually available for that source. Later variants build on the lesson's question but start from a reset configuration.

| ID | Chapter | Title | Ordered source examples | Question and teaching sequence |
| --- | --- | --- | --- | --- |
| D01 | Compare and investigate charts | Multiple independent charts | M02, C01 | Can several independent charts occupy one workspace? Identify a panel, inspect its data, and observe the independent panel structure. Introduce panels and series. |
| D02 | Compare and investigate charts | An adaptable dashboard | M04, M05, M08, M09, C15, C16 | Does the layout remain understandable as its size and contents change? Compare sizing and headers, add/remove panels in the relevant variants, then inspect narrow layouts and long labels. |
| D03 | Compare and investigate charts | Comparable axis ranges | C02, C03, C04, C05 | Can selected panels use comparable numeric scales? Set X sharing, then Y sharing, then mixed scopes. Explain C05 as synchronized ranges with repeated axis visuals hidden, not one physical axis shared by all grids. |
| D04 | Compare and investigate charts | Independent and linked zoom | C06, C07, C08 | Can investigation focus change independently or together? Select a panel, compare individual/row/column/all zoom, then use selected-area zoom and reset in C08. Range and zoom remain different concepts. |
| D05 | Compare and investigate charts | Choose which data is visible | C09, C10, C11, S07 | Can users reduce clutter without removing needed information? Hide a series, restore it, and hide point symbols while keeping line rendering. Use S07 to revisit visibility for spatial data. |
| D06 | Compare and investigate charts | Inspect and enlarge a panel | M07, C13, C14, S08 | Can an interaction identify the intended measurement and panel? Inspect tooltip/event identity, enlarge and restore in C14, and inspect spatial data-item identity in S08. |
| D07 | Understand spatial measurements | Spatial geometry during zoom | S01, S02, S09 | Does zoom preserve the meaning of geometry? Identify the boundary and data regions; compare fixed screen-sized symbols with coordinate-sized regions; inspect clipping and aspect ratio. Geometry observations remain pending visual acceptance. |
| D08 | Understand spatial measurements | Color represents a measurement | S04, S05 | Can color communicate numeric values consistently? Compare continuous gradients and discrete value bands, then change the color control for one panel versus a group. |
| D09 | Understand spatial measurements | Direction and magnitude with vectors | S03 | How do arrows communicate direction and size? Change vector scale, then reference-vector value, and observe the intended group. Explain that inputs are application controls. |
| D10 | Understand spatial measurements | Continue a spatial investigation through updates | S06, S10 | Which investigation settings survive updates? Explore spatial range/zoom scopes in S06; use S10 to change data or panel structure and inspect retained state. Do not imply S10 exposes S06's scope controls. |
| D11 | Connect a main plot with related profiles | One measurement, several related views | P01, P02, P03, P04 | Why must related views remain aligned? Start with the main plot, add a top profile, a side profile, then both. Demonstrate mandatory main/top X and main/side Y coupling. |
| D12 | Connect a main plot with related profiles | Compare several groups of related views | P09, P10, P11 | How does optional cross-panel sharing coexist with required within-panel links? Compare main ranges, independent profile value ranges, then visual controls in their respective variants. |
| D13 | Connect a main plot with related profiles | Optional profiles and constrained layouts | P05, P12 | Does the layout remain readable when profiles are absent or space is constrained? Inspect alternating profiles, then the constrained 2-column/3-row layout. |
| D14 | Explore the 3D boundary | Explore multiple 3D views | G02, G03, G06, G09 | Can several 3D views be explored independently? Identify explicit viewport layout, investigate camera targeting and representative series, then enlarge and restore. Do not claim native matrix placement. |
| D15 | Explore the 3D boundary | Coordinate 3D comparisons | G04, G05 | Which 3D properties can be coordinated? Use the camera-scope action, then separately compare numeric ranges and color/legend controls. Programmatic camera changes do not prove drag-event synchronization. |
| D16 | Explore the 3D boundary | Switch between 2D and 3D | G08 | Can selected panels change dimensionality? Change a panel or group to 2D, return to 3D, and inspect state/resources. Rendering parity and WebGL cleanup remain provisional. |
| D17 | Explore the 3D boundary | A 3D main view with 2D profiles | G07 | Can 2D profiles remain useful beside a 3D main plot? Identify the main/profile relationship, inspect dimension coupling, and resize. Explain mixed-layout complexity. |
| D18 | Save and communicate results | Save and resume an investigation | R01 | Can an investigation be restored? Change supported settings, export a snapshot, reset, and import the snapshot. The snapshot describes application state, not a native matrix feature. |
| D19 | Save and communicate results | Export results | M10, R02, R03 | Which export fits the recipient? Export a chart image, compare supported renderer modes, then export CSV/JSON sample data. Existing data exports are generated from the sample data model; do not describe them as an exact export of every plotted series. |
| D20 | Evaluate the architecture | Resource use, performance, and stability | R07, R04, G10, R05, R06, R08 | What evidence supports an architectural decision? Compare equivalent sizes and instance models, inspect 3D resource counts separately, then inspect lifecycle/scope/mode-switch behavior. Report machine-specific observations, not universal speed claims. |

The technical appendix contains M01, M03, M06, C12, P06, P07, P08, and G01. Display descriptive titles and a reason to investigate each: direct matrix coordinates, mixed axes, component placement, incompatible axes, alternative compound layouts, and native grid3D placement. These remain engineering routes, not additional guided lessons.

The guided source set and appendix must be disjoint and together cover all 66 IDs. Repeated teaching concepts are intentional; duplicate source assignments are not needed.

## Guided page layout

1. Header: short PoC purpose, Guided presentation / Engineering catalog switch, and runtime version details available in technical details.
2. Sidebar: six chapter headings and 20 numbered lesson titles. Search lesson titles, questions, chapter names, and source IDs. A match on a source ID retains its parent lesson. Empty results have a clear message. Search must not reset the active chart.
3. Lesson header: chapter, lesson number/title, question, previous/next lesson buttons, and a clearly labeled variant selector. Show variant position and descriptive name; technical source ID appears in details.
4. Guide card: two or three actions for the active variant and an Expected observation paragraph. Expected observations are evaluation criteria, not automatic pass assertions.
5. Relevant controls and chart: existing chart host and lifecycle, with only controls relevant to the variant's lesson visible by default.
6. Evidence and limitations: always-visible provisional status and specific limitation; expandable technical details for raw IDs, event logs, metrics, option snapshots, and engineering links.

D18 exposes snapshot actions and JSON input directly. D19 exposes relevant export actions directly. D20 exposes resource metrics and measurement controls directly. Other lessons keep these in technical details. There must be only one live copy of every control; changing mode cannot add duplicate event handlers or duplicate IDs.

Advanced controls remain available in an accessible disclosure. The UI must never hide the only control needed for the guide's steps. Fixed coupling remains visible and disabled with a plain-language explanation.

## Copy and control policy

Guided labels use panel, linked zoom, color scale, point symbols, top profile, and side profile. Engineering mode retains existing labels and identifiers so existing checks and technical terminology remain usable.

Scope options remain Individual, All cells, Per row, and Per column wherever the active source supports them. Introduce their meaning once in guided help and reuse that explanation. Existing enum values and target resolution do not change.

Control policy belongs to each variant and identifies visible common controls, sharing elements, action buttons, and relevant utility panels. Unsupported controls are not invented by combining the capabilities of source examples. All declared shareable source capabilities remain reachable in advanced controls when omitted from the main guide.

## Navigation and state behavior

- No query: open D01 with M02 in guided mode.
- Guided deep link: `?lesson=D04&example=C06` opens D04's X zoom variant.
- Lesson only: select that lesson's default variant and normalize the URL.
- `?example=C06` alone: open the original engineering view. Existing links and tests retain their behavior.
- `?mode=engineering` without an example: open M01.
- A valid lesson with an unrelated or unknown example falls back to its default variant with a brief visible notice.
- An unknown lesson falls back to D01 with a brief notice. An invalid engineering example falls back to M01 with a notice. IDs never reach `getExample` without validation.
- Clicking lessons or variants pushes navigation history. Initial normalization and reset replace the current entry. Back/forward restore mode, lesson, and variant with default chart state; navigation is not an interactive-state history.
- Changing lesson or variant resets the source experiment. Explain this beside the variant selector. Previous/next operates over all 20 lessons, independent of search filtering; first/last buttons are disabled at boundaries.
- Switching to engineering keeps the active source and its current chart state; switching back uses the lesson containing that source. Appendix-only sources return to D01 with an explicit reset notice. Preserve the search text separately per mode.
- Reset restarts the active source variant while keeping guided context. Run rebuilds the current chart from maintained state as it does today.
- Snapshot format remains version 1 and contains the engineering example ID, not tutorial metadata. A successful import stays in the current guided lesson when the imported source belongs to it; otherwise it opens engineering mode for that source. Import preserves the snapshot's dimensions and 2D/3D states; default-only initialization must not overwrite imported values. Invalid imports leave the active view and state intact and display an error.
- Deep links describe navigation only, not serialized measurement data or chart state.

## Technical structure

Keep the existing experiment registry authoritative. Add focused files under `src/presentation/`:

- `types.ts`: chapter, lesson, variant, guide, and control-policy contracts; navigation selection discriminated union.
- `catalog.ts`: six chapters, 20 lessons, all source-specific guide text, and eight appendix entries.
- `navigation.ts`: pure route parsing/serialization, source-to-lesson lookup, filtering, and previous/next resolution.
- `view.ts`: guided navigation, guide content, control visibility, and mode-specific labels. Receives callbacks rather than owning charts.

`src/main.ts` remains responsible for chart state and lifecycle. Adapt its navigation entry points, metadata rendering, URL updates, reset/import handling, and control-render completion hooks to the presentation layer. Do not duplicate chart builders or build a second global state store. Retain the current engineering DOM IDs and selectors wherever practical.

Update `index.html` for the mode switch, guide, variant selector, pagination, and disclosures. Extend `src/style.css` with responsive guide styles. Update README with both navigation modes and URL examples.

## Lifecycle, error, and accessibility requirements

Selection that lazily loads ECharts-GL can race with a later selection. Use a monotonically increasing selection/initialization token so stale asynchronous completions cannot initialize an obsolete example, dispose a newer chart, change the URL, or overwrite the guide. Catch selection failures from all navigation entry points, show a useful chart status, and allow another example to be selected.

Changing variants must dispose old charts and clear obsolete chart roots through the existing lifecycle. Disclosure and mode changes resize the existing chart after its container dimensions change; they do not create extra instances. Tests distinguish cumulative WebGL context observations from live chart counts.

Use native buttons, selects, and details/summary where appropriate. Label both navigation modes, active lesson, active variant, previous/next buttons, search, and advanced controls. Hidden controls must not remain keyboard-focusable. Maintain visible focus and readable wrapped titles. Test 1440px and 900px viewports; at smaller widths stack sections and keep the chart scrollable rather than compressing labels into overlap.

## Evidence policy

The current scorecard remains Inconclusive / Low confidence. Guided status uses plain language such as Implemented for evaluation - acceptance review pending, with the exact classification available in technical details. Neither visited lessons nor successful page loads promote a capability.

Existing screenshots, option snapshots, and measurements remain evidence inputs. Add guided screenshots under a separate presentation evidence folder; do not replace existing evidence just to document new navigation. Explain that R07 measurements are machine-specific and that native matrix layout and explicit 3D positioning receive separate evaluations.

## Acceptance criteria and verification

- Catalog validation proves exactly 20 stable lessons in six ordered chapters and valid, unique source IDs. Guided IDs plus the eight appendix IDs equal the 66 registered examples.
- Every variant has a nonempty question context, two or three concrete actions, expected observation, limitation, and a default control policy referencing real source capabilities.
- Navigation unit tests cover defaults, existing engineering URLs, guided links, invalid/mismatched IDs, source lookup, chapter/source search, empty search results, and previous/next boundaries.
- Browser checks open every guided lesson and exercise representative variant transitions in all six chapters, verifying chart source, guide, controls, status, and normalized URL agree.
- Existing engineering browser checks continue loading all 66 routes unchanged.
- Browser checks cover reset within a lesson, mode switch with state retention, browser back/forward, search without chart reset, invalid import, snapshot import into same/different lessons, and imported P12 dimensions/3D states.
- A rapid 3D-to-2D navigation test verifies the final requested example owns the only intended live chart roots and guide. Failure recovery is tested with a rejected GL load or controlled initialization error.
- Guided interaction checks cover individual/row scope changes, fixed compound coupling, symbol-only visibility, and export actions using the existing builders.
- Run unit suite, production build, and browser suite after integration. Inspect guided screenshots at wide and constrained sizes for title wrapping, visible instructions, controls, chart size, and disclosure behavior.
- No new runtime dependencies; no scorecard promotion or changes to existing example IDs.

## Review and execution status

The user approved the 20-example proposal and requested the Superpowers workflow. This document records the concrete navigation, variant, state, and test design. The Superpowers architectural path requires written-spec review before the detailed implementation plan, followed by plan review before implementation. No product code is changed by this specification.
