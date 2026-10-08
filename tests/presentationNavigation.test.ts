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
  expect(filterLessons('Geometry and color controls')).toHaveLength(3);
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

it.each(['?lesson=', '?lesson=%3Cscript%3E', '?lesson=unknown&mode=engineering'])(
  'normalizes invalid lesson input %s', search => {
    const result = resolveLocation(search);
    expect(result.selection).toEqual({ mode: 'guided', lessonId: 'D01', exampleId: 'M02' });
    expect(result.notice).toBeTruthy();
  }
);
it('uses lesson context before conflicting mode and keeps invalid examples in engineering', () => {
  expect(resolveLocation('?lesson=D04&example=C07&mode=engineering').selection)
    .toEqual({ mode: 'guided', lessonId: 'D04', exampleId: 'C07' });
  expect(resolveLocation('?example=').selection).toEqual({ mode: 'engineering', exampleId: 'M01' });
  expect(resolveLocation('?mode=unknown').selection).toEqual({ mode: 'guided', lessonId: 'D01', exampleId: 'M02' });
});
