import type { Chapter, Lesson, AppendixEntry } from './types';
import { GUIDES } from './guides';

export const CHAPTERS: readonly Chapter[] = [
  {
    "id": "compare",
    "title": "Compare and investigate charts"
  },
  {
    "id": "spatial",
    "title": "Geometry and color controls"
  },
  {
    "id": "profiles",
    "title": "Connect a main plot with related profiles"
  },
  {
    "id": "three-dimensional",
    "title": "Explore the 3D boundary"
  },
  {
    "id": "save",
    "title": "Save and communicate results"
  },
  {
    "id": "evaluate",
    "title": "Evaluate the architecture"
  }
];

const definitions = [
  {
    "id": "D01",
    "chapterId": "compare",
    "title": "Multiple independent charts",
    "question": "Can several independent charts occupy one workspace?",
    "sources": [
      "M02",
      "C01"
    ]
  },
  {
    "id": "D02",
    "chapterId": "compare",
    "title": "An adaptable dashboard",
    "question": "Does the layout remain understandable as its size and contents change?",
    "sources": [
      "M04",
      "M05",
      "M08",
      "M09",
      "C15",
      "C16"
    ]
  },
  {
    "id": "D03",
    "chapterId": "compare",
    "title": "Comparable axis ranges",
    "question": "Can selected panels use comparable numeric scales?",
    "sources": [
      "C02",
      "C03",
      "C04",
      "C05",
      "C17"
    ]
  },
  {
    "id": "D04",
    "chapterId": "compare",
    "title": "Independent and linked zoom",
    "question": "Can investigation focus change independently or together?",
    "sources": [
      "C06",
      "C07",
      "C08"
    ]
  },
  {
    "id": "D05",
    "chapterId": "compare",
    "title": "Choose which data is visible",
    "question": "Can users reduce clutter without removing needed information?",
    "sources": [
      "C09",
      "C10",
      "C11"
    ]
  },
  {
    "id": "D06",
    "chapterId": "compare",
    "title": "Inspect and enlarge a panel",
    "question": "Can an interaction identify the intended measurement and panel?",
    "sources": [
      "M07",
      "C13",
      "C14"
    ]
  },
  {
    "id": "D07",
    "chapterId": "spatial",
    "title": "Marker sizing and equal-scale geometry",
    "question": "How do data-sized shapes and equal coordinate scales behave during resize?",
    "sources": [
      "S02",
      "S09"
    ]
  },
  {
    "id": "D08",
    "chapterId": "spatial",
    "title": "Color represents a measurement",
    "question": "Can color communicate numeric values consistently?",
    "sources": [
      "S04",
      "S05"
    ]
  },
  {
    "id": "D09",
    "chapterId": "spatial",
    "title": "Direction and magnitude with vectors",
    "question": "How do arrows communicate direction and size?",
    "sources": [
      "S03"
    ]
  },
  {
    "id": "D11",
    "chapterId": "profiles",
    "title": "One measurement, several related views",
    "question": "Why must related views remain aligned?",
    "sources": [
      "P01",
      "P02",
      "P03",
      "P04"
    ]
  },
  {
    "id": "D12",
    "chapterId": "profiles",
    "title": "Compare several groups of related views",
    "question": "How does optional cross-panel sharing coexist with required within-panel links?",
    "sources": [
      "P09",
      "P10",
      "P11"
    ]
  },
  {
    "id": "D13",
    "chapterId": "profiles",
    "title": "Optional profiles and constrained layouts",
    "question": "Does the layout remain readable when profiles are absent or space is constrained?",
    "sources": [
      "P05",
      "P12"
    ]
  },
  {
    "id": "D14",
    "chapterId": "three-dimensional",
    "title": "Explore multiple 3D views",
    "question": "Can several 3D views be explored independently?",
    "sources": [
      "G02",
      "G03",
      "G06",
      "G09"
    ]
  },
  {
    "id": "D15",
    "chapterId": "three-dimensional",
    "title": "Coordinate 3D comparisons",
    "question": "Which 3D properties can be coordinated?",
    "sources": [
      "G04",
      "G05"
    ]
  },
  {
    "id": "D16",
    "chapterId": "three-dimensional",
    "title": "Switch between 2D and 3D",
    "question": "Can selected panels change dimensionality?",
    "sources": [
      "G08"
    ]
  },
  {
    "id": "D17",
    "chapterId": "three-dimensional",
    "title": "A 3D main view with 2D profiles",
    "question": "Can 2D profiles remain useful beside a 3D main plot?",
    "sources": [
      "G07"
    ]
  },
  {
    "id": "D18",
    "chapterId": "save",
    "title": "Save and resume an investigation",
    "question": "Can an investigation be restored?",
    "sources": [
      "R01"
    ]
  },
  {
    "id": "D19",
    "chapterId": "save",
    "title": "Export results",
    "question": "Which export fits the recipient?",
    "sources": [
      "M10",
      "R02",
      "R03"
    ]
  },
  {
    "id": "D20",
    "chapterId": "evaluate",
    "title": "Resource use, performance, and stability",
    "question": "What evidence supports an architectural decision?",
    "sources": [
      "R07",
      "R04",
      "G10",
      "R05",
      "R06",
      "R08"
    ]
  }
];

export const LESSONS: readonly Lesson[] = definitions.map(({ sources, ...lesson }) => ({
  ...lesson, variants: sources.map(id => GUIDES[id])
}));

export const APPENDIX: readonly AppendixEntry[] = [
  {
    "exampleId": "M01",
    "reason": "Inspect direct matrix-coordinate rendering."
  },
  {
    "exampleId": "M03",
    "reason": "Investigate mixed axis types."
  },
  {
    "exampleId": "M06",
    "reason": "Inspect placement of visual controls."
  },
  {
    "exampleId": "C12",
    "reason": "Investigate incompatible axis-sharing requests."
  },
  {
    "exampleId": "P06",
    "reason": "Evaluate matrix subregions for related plots."
  },
  {
    "exampleId": "P07",
    "reason": "Evaluate multiple plots in one matrix position."
  },
  {
    "exampleId": "P08",
    "reason": "Evaluate calculated pixel layout and resize complexity."
  },
  {
    "exampleId": "G01",
    "reason": "Unsupported native matrix placement: 3D views overlap. G02 demonstrates working explicit placement."
  }
];
