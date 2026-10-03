import { getExample } from '../app/experimentRegistry';
import type { SharingElement } from '../core/types';
import type { Variant, ControlPolicy, CommonControl, PanelAction, UtilityPanel } from './types';

const copy: Record<string, Omit<Variant, 'controls'>> = {
  "M02": {
    "exampleId": "M02",
    "label": "Plots inside a matrix",
    "steps": [
      "Identify the four panels.",
      "Hover a point in two panels."
    ],
    "expected": "Each panel has its own plot inside the common layout.",
    "limitation": "Detailed visual and domain acceptance review remains pending."
  },
  "C01": {
    "exampleId": "C01",
    "label": "Independent lines and points",
    "steps": [
      "Inspect a line and its points.",
      "Hover another panel."
    ],
    "expected": "Independent panels provide the baseline for later sharing.",
    "limitation": "Detailed visual and domain acceptance review remains pending."
  },
  "M04": {
    "exampleId": "M04",
    "label": "Fixed and flexible sizing",
    "steps": [
      "Compare the first column with the others.",
      "Change column count."
    ],
    "expected": "Fixed and automatic sizes have different layout effects.",
    "limitation": "Narrow-size visual review pending"
  },
  "M05": {
    "exampleId": "M05",
    "label": "Headers and empty positions",
    "steps": [
      "Read the headers and merged label.",
      "Locate the empty position."
    ],
    "expected": "Labels and intentionally empty positions remain understandable.",
    "limitation": "Merge combinations need manual review"
  },
  "M08": {
    "exampleId": "M08",
    "label": "Add and remove panels",
    "steps": [
      "Add a row.",
      "Remove that row."
    ],
    "expected": "Added plots appear and removed plots do not remain visible.",
    "limitation": "The example rebuilds its chart configuration when panels change."
  },
  "M09": {
    "exampleId": "M09",
    "label": "Resize the workspace",
    "steps": [
      "Reduce browser width.",
      "Restore the width."
    ],
    "expected": "Plots remain in their intended panels.",
    "limitation": "Screenshot review pending because local viewer was unavailable"
  },
  "C15": {
    "exampleId": "C15",
    "label": "Keep unaffected panel state",
    "steps": [
      "Select a panel in the first row.",
      "Add and remove a different row."
    ],
    "expected": "Check selected-panel identity; this source currently exposes no local zoom, so zoom preservation is not demonstrated here.",
    "limitation": "The example rebuilds its chart configuration; check that unaffected state survives.. Local zoom is not configured in this variant; zoom-related acceptance remains pending."
  },
  "C16": {
    "exampleId": "C16",
    "label": "Long labels and narrow screens",
    "steps": [
      "Read long headers.",
      "Narrow the browser."
    ],
    "expected": "Check wrapping and scrolling rather than assuming labels fit.",
    "limitation": "Manual typography review pending"
  },
  "C02": {
    "exampleId": "C02",
    "label": "Share X ranges",
    "steps": [
      "Select a panel and set X range scope to Individual.",
      "Change X range.",
      "Repeat with Per row."
    ],
    "expected": "Only the selected scope should receive the numeric range.",
    "limitation": "ECharts does not choose conflict policy"
  },
  "C03": {
    "exampleId": "C03",
    "label": "Share Y ranges",
    "steps": [
      "Select a panel and set Y range scope to Individual.",
      "Change Y range.",
      "Repeat with Per column."
    ],
    "expected": "Y ranges should change independently of X.",
    "limitation": "ECharts does not choose conflict policy"
  },
  "C04": {
    "exampleId": "C04",
    "label": "Mix X and Y scopes",
    "steps": [
      "Set X range scope to All cells and Y range scope to Individual.",
      "Change X and then Y range."
    ],
    "expected": "X and Y target groups remain independent.",
    "limitation": "The application maintains the shared settings."
  },
  "C05": {
    "exampleId": "C05",
    "label": "Show axes at the edges",
    "steps": [
      "Inspect outer axis labels.",
      "Change X range with All cells scope."
    ],
    "expected": "Repeated labels are hidden; underlying axes remain separate.",
    "limitation": "One physical axis is not reused across grids"
  },
  "C06": {
    "exampleId": "C06",
    "label": "Link X zoom",
    "steps": [
      "Set X linked zoom scope to Individual and change X linked zoom.",
      "Repeat with Per row.",
      "Reset the example."
    ],
    "expected": "Observe horizontal target isolation and reset.",
    "limitation": "Changing sharing scope rebuilds the affected zoom controls."
  },
  "C07": {
    "exampleId": "C07",
    "label": "Link Y zoom",
    "steps": [
      "Set Y linked zoom scope to Individual and change Y linked zoom.",
      "Repeat with Per column.",
      "Reset the example."
    ],
    "expected": "Observe vertical target isolation and reset.",
    "limitation": "Changing sharing scope rebuilds the affected zoom controls."
  },
  "C08": {
    "exampleId": "C08",
    "label": "Zoom a selected area",
    "steps": [
      "Use the chart's selected-area zoom tool.",
      "Select an area.",
      "Use its restore tool."
    ],
    "expected": "Cross-panel selection is an evaluation, not a proven capability.",
    "limitation": "Cross-grid selection needs manual review"
  },
  "C09": {
    "exampleId": "C09",
    "label": "Control visibility with legends",
    "steps": [
      "Set legend selection scope to Individual and change legend selection.",
      "Repeat with All cells."
    ],
    "expected": "Matching series visibility follows the selected group.",
    "limitation": "Series names determine which data the shared legend controls."
  },
  "C10": {
    "exampleId": "C10",
    "label": "Hide a whole series",
    "steps": [
      "Change series visibility for Individual.",
      "Restore it and repeat with Per row."
    ],
    "expected": "A whole series is hidden or shown.",
    "limitation": "Grouped series names determine the targets of visibility changes."
  },
  "C11": {
    "exampleId": "C11",
    "label": "Hide points and keep lines",
    "steps": [
      "Change point-symbol visibility.",
      "Inspect the line.",
      "Restore the points."
    ],
    "expected": "The line should remain when its symbols are hidden.",
    "limitation": "Not a legend-only behavior"
  },
  "S07": {
    "exampleId": "S07",
    "label": "Choose visible spatial data",
    "steps": [
      "Change spatial series visibility.",
      "Restore it and change point-symbol visibility."
    ],
    "expected": "Distinguish whole-series visibility from symbol rendering.",
    "limitation": "Point visibility requires a chart update from the application."
  },
  "M07": {
    "exampleId": "M07",
    "label": "Identify the selected panel",
    "steps": [
      "Click a point in one panel.",
      "Inspect the event and target.",
      "Click another panel."
    ],
    "expected": "Event identity should refer to the intended panel.",
    "limitation": "Context-menu events come from the rendering layer and require application routing."
  },
  "C13": {
    "exampleId": "C13",
    "label": "Inspect point values",
    "steps": [
      "Hover a point.",
      "Click it and inspect the event target."
    ],
    "expected": "Tooltip and event identities provide the inspection context.",
    "limitation": "Detailed visual and domain acceptance review remains pending."
  },
  "C14": {
    "exampleId": "C14",
    "label": "Enlarge and restore a panel",
    "steps": [
      "Select a panel.",
      "Enlarge it.",
      "Restore all panels."
    ],
    "expected": "Observe panel restoration; local zoom is not exposed by this source, so zoom preservation remains unverified.",
    "limitation": "Matrix headers remain in state for restoration. Local zoom is not configured in this variant; zoom-related acceptance remains pending."
  },
  "S08": {
    "exampleId": "S08",
    "label": "Inspect spatial items",
    "steps": [
      "Hover a spatial item.",
      "Select it.",
      "Inspect event and item identity."
    ],
    "expected": "Selection/event parity remains subject to manual review.",
    "limitation": "Disabled mappings need manual interaction review"
  },
  "S01": {
    "exampleId": "S01",
    "label": "Boundaries and data regions",
    "steps": [
      "Identify the circular boundary and rectangular regions.",
      "Resize the browser and inspect the edge."
    ],
    "expected": "Inspect geometry and clipping; this variant currently has no local zoom control.",
    "limitation": "Representative geometry only. Local zoom is not configured in this variant; zoom-related acceptance remains pending."
  },
  "S02": {
    "exampleId": "S02",
    "label": "Screen-sized and domain-sized shapes",
    "steps": [
      "Compare a point symbol with a rectangular region.",
      "Resize the browser."
    ],
    "expected": "Compare screen-sized symbols and domain-sized regions during resize; zoom is not configured in this source and remains unverified.",
    "limitation": "Visual zoom comparison pending. Local zoom is not configured in this variant; zoom-related acceptance remains pending."
  },
  "S09": {
    "exampleId": "S09",
    "label": "Aspect ratio and enlargement",
    "steps": [
      "Enlarge a panel.",
      "Resize the browser.",
      "Restore the panel."
    ],
    "expected": "Inspect aspect ratio and clipping visually.",
    "limitation": "Exact square-ratio pixel audit pending. Local zoom is not configured in this variant; zoom-related acceptance remains pending."
  },
  "S04": {
    "exampleId": "S04",
    "label": "Continuous color scale",
    "steps": [
      "Change color-scale selection for Individual.",
      "Repeat for All cells."
    ],
    "expected": "Continuous colors represent the same numeric scale.",
    "limitation": "The application decides which panels belong to each sharing group."
  },
  "S05": {
    "exampleId": "S05",
    "label": "Discrete color bands",
    "steps": [
      "Inspect discrete color bands.",
      "Change color-scale selection for a group."
    ],
    "expected": "Value bands differ from a continuous gradient.",
    "limitation": "The application decides which panels belong to each sharing group."
  },
  "S03": {
    "exampleId": "S03",
    "label": "Vector scale and reference value",
    "steps": [
      "Change vector scale for Individual.",
      "Change reference-vector value.",
      "Repeat with Per row."
    ],
    "expected": "Arrows respond to application inputs for the intended group.",
    "limitation": "Vector controls belong to the application, rather than the chart library."
  },
  "S06": {
    "exampleId": "S06",
    "label": "Link spatial ranges and zoom",
    "steps": [
      "Change X linked zoom for Individual.",
      "Repeat with Per row.",
      "Compare the Y range."
    ],
    "expected": "Spatial sharing should not leak into unrelated dimensions.",
    "limitation": "External scope controls required"
  },
  "S10": {
    "exampleId": "S10",
    "label": "Keep selection through updates",
    "steps": [
      "Select a spatial item.",
      "Regenerate data.",
      "Add a row and inspect prior selection."
    ],
    "expected": "Evaluate selection persistence; local zoom and the scope controls from S06 are not present here.",
    "limitation": "Application state owns restoration. Local zoom is not configured in this variant; zoom-related acceptance remains pending."
  },
  "P01": {
    "exampleId": "P01",
    "label": "Main plot only",
    "steps": [
      "Identify the main plot.",
      "Hover a measurement."
    ],
    "expected": "Establish the main-only baseline.",
    "limitation": "Detailed visual and domain acceptance review remains pending."
  },
  "P02": {
    "exampleId": "P02",
    "label": "Main plot and top profile",
    "steps": [
      "Identify main and top profile.",
      "Zoom the main X dimension."
    ],
    "expected": "Fixed main/top X coupling must remain visible.",
    "limitation": "Coupling is application-declared fixed"
  },
  "P03": {
    "exampleId": "P03",
    "label": "Main plot and side profile",
    "steps": [
      "Identify main and side profile.",
      "Zoom the main Y dimension."
    ],
    "expected": "Fixed main/side Y coupling must remain visible.",
    "limitation": "Coupling is application-declared fixed"
  },
  "P04": {
    "exampleId": "P04",
    "label": "Main plot and both profiles",
    "steps": [
      "Identify all three plots.",
      "Zoom the main plot and inspect the top profile along X.",
      "Inspect the side profile along Y as you zoom."
    ],
    "expected": "Main/top X and main/side Y links are separate.",
    "limitation": "Profile placement uses local offsets and still needs visual acceptance review."
  },
  "P09": {
    "exampleId": "P09",
    "label": "Link main ranges across panels",
    "steps": [
      "Set main X range scope to Per row and change it.",
      "Inspect top profiles and unaffected rows."
    ],
    "expected": "Optional cross-panel sharing preserves required local coupling.",
    "limitation": "The application maintains the shared settings."
  },
  "P10": {
    "exampleId": "P10",
    "label": "Change profile value ranges",
    "steps": [
      "Change top-profile value range for Per row.",
      "Change side-profile value range for Individual."
    ],
    "expected": "Profile value axes remain distinct from coupled position axes.",
    "limitation": "More interaction leakage checks recommended"
  },
  "P11": {
    "exampleId": "P11",
    "label": "Control related data displays",
    "steps": [
      "Change legend selection for a group.",
      "Restore it and change color scale."
    ],
    "expected": "Dense component layouts still need visual review.",
    "limitation": "Dense layouts need visual review"
  },
  "P05": {
    "exampleId": "P05",
    "label": "Optional profiles",
    "steps": [
      "Compare neighboring panels with missing profiles.",
      "Resize the browser."
    ],
    "expected": "Main plots should remain aligned despite absent auxiliaries.",
    "limitation": "Screenshot generated; visual review pending"
  },
  "P12": {
    "exampleId": "P12",
    "label": "A constrained two-by-three layout",
    "steps": [
      "Inspect the 2-column/3-row arrangement.",
      "Narrow the browser."
    ],
    "expected": "Check labels, profiles, and plot readability.",
    "limitation": "Long-label visual review pending"
  },
  "G02": {
    "exampleId": "G02",
    "label": "Explicit 3D viewports",
    "steps": [
      "Identify each 3D viewport.",
      "Rotate one view."
    ],
    "expected": "This uses explicit boxes, not proven native matrix placement.",
    "limitation": "Explicit layout is required"
  },
  "G03": {
    "exampleId": "G03",
    "label": "Independent cameras",
    "steps": [
      "Rotate the first view.",
      "Rotate another view."
    ],
    "expected": "Check that camera input targets the intended viewport.",
    "limitation": "Manual interaction targeting review pending"
  },
  "G06": {
    "exampleId": "G06",
    "label": "Representative 3D measurements",
    "steps": [
      "Inspect the representative 3D series.",
      "Rotate the view."
    ],
    "expected": "Representative rendering does not establish domain parity.",
    "limitation": "Rendering parity is representative only"
  },
  "G09": {
    "exampleId": "G09",
    "label": "Enlarge a 3D view",
    "steps": [
      "Rotate and select a panel.",
      "Enlarge it.",
      "Restore it."
    ],
    "expected": "Inspect camera and visual state preservation.",
    "limitation": "Camera persistence is maintained state"
  },
  "G04": {
    "exampleId": "G04",
    "label": "Apply shared camera settings",
    "steps": [
      "Change camera with Individual scope.",
      "Repeat with All cells."
    ],
    "expected": "Programmatic changes do not prove mouse-drag synchronization.",
    "limitation": "Programmatic camera changes do not prove mouse-drag synchronization. Camera-event acceptance remains pending."
  },
  "G05": {
    "exampleId": "G05",
    "label": "Share 3D ranges and colors",
    "steps": [
      "Change Z range with Per row scope.",
      "Change color scale for Individual."
    ],
    "expected": "Camera state and numeric ranges are separate concepts.",
    "limitation": "Legend parity requires manual review"
  },
  "G08": {
    "exampleId": "G08",
    "label": "Change between 2D and 3D",
    "steps": [
      "Change one panel to 2D.",
      "Repeat with a group.",
      "Return to 3D."
    ],
    "expected": "Inspect retained state and contexts without claiming rendering parity.",
    "limitation": "Context reuse remains extension-managed"
  },
  "G07": {
    "exampleId": "G07",
    "label": "3D main view with 2D profiles",
    "steps": [
      "Identify the 3D main and 2D profiles.",
      "Zoom the top profile along X.",
      "Resize the browser."
    ],
    "expected": "Inspect fixed profile/main coupling; its fixed scope selector is informational, not an editable control.",
    "limitation": "Mixed coordinate layout has added resize complexity"
  },
  "R01": {
    "exampleId": "R01",
    "label": "Save and restore workspace state",
    "steps": [
      "Change a sharing setting and export state.",
      "Reset the example.",
      "Import the saved snapshot."
    ],
    "expected": "Application state should be restored in a fresh chart instance.",
    "limitation": "Not a matrix capability"
  },
  "M10": {
    "exampleId": "M10",
    "label": "Export a chart image",
    "steps": [
      "Inspect headers and panels.",
      "Export the image."
    ],
    "expected": "Check that the downloaded image contains visible components.",
    "limitation": "Browser test verifies a non-empty download"
  },
  "R02": {
    "exampleId": "R02",
    "label": "Compare image renderers",
    "steps": [
      "Export with Canvas.",
      "Select SVG and export again."
    ],
    "expected": "Inspect supported output per renderer; do not promise GL/SVG equivalence.",
    "limitation": "GL and SVG support differ by mode"
  },
  "R03": {
    "exampleId": "R03",
    "label": "Export sample data",
    "steps": [
      "Export CSV.",
      "Export raw JSON."
    ],
    "expected": "Exports are generated sample-model data, not every plotted series.",
    "limitation": "Exports are generated sample-model data, not an exact export of every plotted series."
  },
  "R07": {
    "exampleId": "R07",
    "label": "Compare resource use and timing",
    "steps": [
      "Measure the one-instance 2 by 2 case.",
      "Select per-panel instances and measure.",
      "Repeat at another size."
    ],
    "expected": "Observations depend on this machine and equivalent workloads.",
    "limitation": "Machine-specific measurements; compare equivalent workloads. These results do not establish universal performance."
  },
  "R04": {
    "exampleId": "R04",
    "label": "One instance per panel",
    "steps": [
      "Inspect live instance count.",
      "Change grid size, then select Run example to rebuild the panels."
    ],
    "expected": "This is the separate-instance baseline.",
    "limitation": "Intentionally resource-heavy comparison"
  },
  "G10": {
    "exampleId": "G10",
    "label": "Compare 3D resources",
    "steps": [
      "Inspect one-instance resources.",
      "Switch to per-panel instances."
    ],
    "expected": "Context observations are cumulative, not a live-memory counter.",
    "limitation": "Observed WebGL contexts are cumulative, not a live-memory counter. Browser cleanup requires separate review."
  },
  "R05": {
    "exampleId": "R05",
    "label": "Repeat initialization",
    "steps": [
      "Run the example repeatedly.",
      "Inspect live instance and chart-root counts."
    ],
    "expected": "The existing automated suite supplies the 20-cycle evidence.",
    "limitation": "Automated for 20 cycles"
  },
  "R06": {
    "exampleId": "R06",
    "label": "Change scopes rapidly",
    "steps": [
      "Change sharing scopes repeatedly.",
      "Inspect event/status output."
    ],
    "expected": "Evaluate duplicate handling and unexpected target changes.",
    "limitation": "No event-loop errors observed"
  },
  "R08": {
    "exampleId": "R08",
    "label": "Change renderer and dimensions",
    "steps": [
      "Switch between 2D and 3D.",
      "Use supported renderer changes.",
      "Inspect chart roots."
    ],
    "expected": "Canvas/WebGL compatibility and browser-managed cleanup remain relevant.",
    "limitation": "WebGL cleanup is browser-managed"
  }
};

function controlsFor(id: string): ControlPolicy {
  const source = getExample(id);
  const common: CommonControl[] = [];
  if (['M04', 'M05', 'M08', 'C15', 'P12', 'R04', 'R07'].includes(id)) common.push('rows', 'columns');
  if (['R02', 'R08'].includes(id)) common.push('renderer');
  if (['G08', 'R08'].includes(id)) common.push('viewMode');
  if (['R07', 'G10'].includes(id)) common.push('instanceModel');
  const narrowed: Record<string, readonly SharingElement[]> = {
    G06: [], G07: ['xRange', 'yRange'], G05: ['zRange', 'visualMap'],
    S07: ['seriesVisibility', 'symbolVisibility'], P11: ['legendSelection', 'visualMap']
  };
  const sharing = [...new Set(source.sharing.filter(c => c.fixed || !narrowed[id] || narrowed[id].includes(c.element)).map(c => c.element))];
  const actions: PanelAction[] = [];
  if (['M08', 'C15', 'S10'].includes(id)) actions.push('add-row', 'remove-row', 'add-column', 'remove-column');
  if (id === 'S10') actions.push('regenerate');
  if (['C14', 'S09', 'G09'].includes(id)) actions.push('enlarge', 'restore');
  const utilities: UtilityPanel[] = [];
  if (['M07', 'C13', 'S08'].includes(id)) utilities.push('events');
  if (id === 'R01') utilities.push('state');
  if (['M10', 'R02', 'R03'].includes(id)) utilities.push('exports');
  if (['R04', 'G10', 'R05', 'R06', 'R08', 'R07'].includes(id)) utilities.push('metrics');
  if (id === 'R07') utilities.push('measurement');
  return { common, sharing, actions, utilities };
}
export const GUIDES: Readonly<Record<string, Variant>> = Object.fromEntries(
  Object.entries(copy).map(([id, guide]) => [id, { ...guide, controls: controlsFor(id) }])
);
